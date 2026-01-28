'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const EmpenhoSchema = z.object({
  obraId: z.string().uuid(),
  numeroNE: z.string().min(1, 'Número da NE é obrigatório'),
  dataEmissao: z.string().min(1, 'Data de emissão é obrigatória'),
  valor: z.number().positive('Valor deve ser positivo'),
  tipo: z.enum(['ORIGINAL', 'REFORCO', 'ANULACAO']),
  alertaMinimo: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  status: z.string().default('ATIVO'),
});

// ========================================
// HELPERS
// ========================================

/**
 * Gera o próximo número sequencial de empenho para uma obra
 */
async function gerarProximoNumeroEmpenho(obraId: string): Promise<number> {
  const ultimoEmpenho = await db.empenho.findFirst({
    where: { obraId },
    orderBy: { numero: 'desc' },
  });

  return ultimoEmpenho ? ultimoEmpenho.numero + 1 : 1;
}

/**
 * Calcula o saldo total de empenhos de uma obra
 * Soma: ORIGINAL + REFORCO - ANULACAO
 */
async function calcularSaldoTotalEmpenhos(obraId: string): Promise<number> {
  const empenhos = await db.empenho.findMany({
    where: { 
      obraId,
      status: { not: 'CANCELADO' } // Ignora empenhos cancelados
    },
  });

  let saldoTotal = 0;

  for (const empenho of empenhos) {
    const valor = Number(empenho.valor);
    
    if (empenho.tipo === 'ORIGINAL' || empenho.tipo === 'REFORCO') {
      saldoTotal += valor;
    } else if (empenho.tipo === 'ANULACAO') {
      saldoTotal -= valor;
    }
  }

  return saldoTotal;
}

// ========================================
// SERVER ACTIONS - CRUD
// ========================================

/**
 * Criar novo empenho
 */
export async function criarEmpenho(data: z.infer<typeof EmpenhoSchema>) {
  try {
    // Validação
    const validated = EmpenhoSchema.parse(data);

    // Gerar número sequencial
    const numero = await gerarProximoNumeroEmpenho(validated.obraId);

    // Definir saldo inicial
    let saldoAtual = validated.valor;

    // Se for ANULACAO, o saldo inicial é negativo (será subtraído do total)
    if (validated.tipo === 'ANULACAO') {
      saldoAtual = -validated.valor;
    }

    // Criar empenho
    const empenho = await db.empenho.create({
      data: {
        obraId: validated.obraId,
        numero,
        numeroNE: validated.numeroNE,
        dataEmissao: new Date(validated.dataEmissao),
        valor: validated.valor,
        saldoAtual,
        tipo: validated.tipo,
        alertaMinimo: validated.alertaMinimo || null,
        observacoes: validated.observacoes || null,
        status: validated.status,
      },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${validated.obraId}`);

    return {
      success: true,
      message: `Empenho #${numero} criado com sucesso!`,
      data: empenho,
    };
  } catch (error: any) {
    console.error('🔥 ERRO AO CRIAR EMPENHO:', error);
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        message: `Erro de validação: ${error.issues.map((e: any) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      message: error?.message || 'Erro ao criar empenho',
    };
  }
}

/**
 * Listar empenhos de uma obra
 */
export async function listarEmpenhosObra(obraId: string) {
  try {
    const empenhos = await db.empenho.findMany({
      where: { obraId },
      include: {
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return { success: true, data: empenhos };
  } catch (error: any) {
    console.error('🔥 ERRO AO LISTAR EMPENHOS:', error);
    return { success: false, data: [] };
  }
}

/**
 * Buscar empenho por ID
 */
export async function buscarEmpenhoPorId(id: string) {
  try {
    const empenho = await db.empenho.findUnique({
      where: { id },
      include: {
        obra: {
          include: {
            construtora: true,
          },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return empenho;
  } catch (error: any) {
    console.error('🔥 ERRO AO BUSCAR EMPENHO:', error);
    return null;
  }
}

/**
 * Atualizar empenho
 */
export async function atualizarEmpenho(
  id: string,
  data: Partial<z.infer<typeof EmpenhoSchema>>
) {
  try {
    const empenho = await db.empenho.findUnique({
      where: { id },
    });

    if (!empenho) {
      return { success: false, message: 'Empenho não encontrado' };
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data.numeroNE !== undefined) updateData.numeroNE = data.numeroNE;
    if (data.dataEmissao !== undefined) updateData.dataEmissao = new Date(data.dataEmissao);
    if (data.valor !== undefined) {
      updateData.valor = data.valor;
      // Recalcular saldo se o valor mudou
      if (empenho.tipo === 'ANULACAO') {
        updateData.saldoAtual = -data.valor;
      } else {
        updateData.saldoAtual = data.valor;
      }
    }
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.alertaMinimo !== undefined) updateData.alertaMinimo = data.alertaMinimo;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.status !== undefined) updateData.status = data.status;

    const empenhoAtualizado = await db.empenho.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${empenho.obraId}`);

    return {
      success: true,
      message: 'Empenho atualizado com sucesso!',
      data: empenhoAtualizado,
    };
  } catch (error: any) {
    console.error('🔥 ERRO AO ATUALIZAR EMPENHO:', error);
    return {
      success: false,
      message: error?.message || 'Erro ao atualizar empenho',
    };
  }
}

/**
 * Cancelar/Excluir empenho
 */
export async function excluirEmpenho(id: string) {
  try {
    const empenho = await db.empenho.findUnique({
      where: { id },
      include: {
        documentos: true,
      },
    });

    if (!empenho) {
      return { success: false, message: 'Empenho não encontrado' };
    }

    // Excluir empenho (CASCADE irá excluir documentos vinculados)
    await db.empenho.delete({
      where: { id },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${empenho.obraId}`);

    return {
      success: true,
      message: 'Empenho excluído com sucesso!',
    };
  } catch (error: any) {
    console.error('🔥 ERRO AO EXCLUIR EMPENHO:', error);
    return {
      success: false,
      message: error?.message || 'Erro ao excluir empenho',
    };
  }
}

/**
 * Marcar empenho como CANCELADO (sem excluir)
 */
export async function cancelarEmpenho(id: string, motivo?: string) {
  try {
    const empenho = await db.empenho.findUnique({
      where: { id },
    });

    if (!empenho) {
      return { success: false, message: 'Empenho não encontrado' };
    }

    const empenhoCancelado = await db.empenho.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        saldoAtual: 0, // Zera o saldo
        observacoes: motivo
          ? `${empenho.observacoes || ''}\n[CANCELADO] ${motivo}`
          : empenho.observacoes,
      },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${empenho.obraId}`);

    return {
      success: true,
      message: 'Empenho cancelado com sucesso!',
      data: empenhoCancelado,
    };
  } catch (error: any) {
    console.error('🔥 ERRO AO CANCELAR EMPENHO:', error);
    return {
      success: false,
      message: error?.message || 'Erro ao cancelar empenho',
    };
  }
}

// ========================================
// CÁLCULOS E ANÁLISES
// ========================================

/**
 * Calcular resumo de empenhos de uma obra
 */
export async function calcularResumoEmpenhos(obraId: string) {
  try {
    const empenhos = await db.empenho.findMany({
      where: { obraId },
    });

    let totalOriginal = 0;
    let totalReforco = 0;
    let totalAnulacao = 0;
    let saldoDisponivel = 0;

    for (const empenho of empenhos) {
      const valor = Number(empenho.valor);

      if (empenho.status === 'CANCELADO') continue;

      if (empenho.tipo === 'ORIGINAL') {
        totalOriginal += valor;
      } else if (empenho.tipo === 'REFORCO') {
        totalReforco += valor;
      } else if (empenho.tipo === 'ANULACAO') {
        totalAnulacao += valor;
      }

      saldoDisponivel += Number(empenho.saldoAtual);
    }

    return {
      success: true,
      data: {
        totalOriginal,
        totalReforco,
        totalAnulacao,
        totalEmpenhado: totalOriginal + totalReforco - totalAnulacao,
        saldoDisponivel,
        quantidadeEmpenhos: empenhos.filter((e: { status: string }) => e.status !== 'CANCELADO').length,
      },
    };
  } catch (error: any) {
    console.error('🔥 ERRO AO CALCULAR RESUMO DE EMPENHOS:', error);
    return {
      success: false,
      data: null,
    };
  }
}
