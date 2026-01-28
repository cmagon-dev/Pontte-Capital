'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Função auxiliar para gerar o próximo número de reajuste
 */
async function gerarProximoNumeroReajuste(obraId: string): Promise<number> {
  const ultimoReajuste = await db.reajuste.findFirst({
    where: { obraId },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  return ultimoReajuste ? ultimoReajuste.numero + 1 : 1;
}

/**
 * Schema de validação para Reajuste
 */
const ReajusteSchema = z.object({
  obraId: z.string().min(1, "ID da obra é obrigatório"),
  dataBase: z.string().min(1, "Data base é obrigatória"),
  indice: z.string().min(1, "Índice é obrigatório"),
  percentual: z.number().min(0, "Percentual deve ser maior ou igual a zero"),
  valorReajuste: z.number().min(0, "Valor do reajuste deve ser maior ou igual a zero"),
  dataAplicacao: z.string().min(1, "Data de aplicação é obrigatória"),
  observacoes: z.string().optional().nullable(),
  status: z.string().optional(),
});

/**
 * Criar novo reajuste
 */
export async function criarReajuste(data: any) {
  try {
    // Validar dados
    const validated = ReajusteSchema.parse(data);

    // Gerar próximo número
    const numero = await gerarProximoNumeroReajuste(validated.obraId);

    // Converter data de aplicação
    const dataAplicacao = new Date(validated.dataAplicacao);

    // Criar reajuste
    const reajuste = await db.reajuste.create({
      data: {
        obraId: validated.obraId,
        numero,
        dataBase: validated.dataBase,
        indice: validated.indice,
        percentual: validated.percentual,
        valorReajuste: validated.valorReajuste,
        dataAplicacao,
        observacoes: validated.observacoes || null,
        status: validated.status || 'PENDENTE',
      },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${validated.obraId}`);

    return {
      success: true,
      message: `Reajuste nº ${numero} criado com sucesso!`,
      data: reajuste,
    };
  } catch (error: any) {
    console.error("🔥 ERRO AO CRIAR REAJUSTE:", error);
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        message: `Erro de validação: ${error.issues.map((e: any) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      message: error?.message || 'Erro ao criar reajuste',
    };
  }
}

/**
 * Listar reajustes de uma obra
 */
export async function listarReajustesObra(obraId: string) {
  try {
    const reajustes = await db.reajuste.findMany({
      where: { obraId },
      include: {
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return { success: true, data: reajustes };
  } catch (error: any) {
    console.error("🔥 ERRO AO LISTAR REAJUSTES:", error);
    return { success: false, data: [] };
  }
}

/**
 * Buscar reajuste por ID
 */
export async function buscarReajustePorId(id: string) {
  try {
    const reajuste = await db.reajuste.findUnique({
      where: { id },
      include: {
        obra: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            valorContrato: true,
          },
        },
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return reajuste;
  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR REAJUSTE:", error);
    return null;
  }
}

/**
 * Atualizar reajuste
 */
export async function atualizarReajuste(id: string, data: any) {
  try {
    const validated = ReajusteSchema.partial().parse(data);

    // Preparar dados para atualização
    const updateData: any = {};

    if (validated.dataBase) updateData.dataBase = validated.dataBase;
    if (validated.indice) updateData.indice = validated.indice;
    if (validated.percentual !== undefined) updateData.percentual = validated.percentual;
    if (validated.valorReajuste !== undefined) updateData.valorReajuste = validated.valorReajuste;
    if (validated.dataAplicacao) updateData.dataAplicacao = new Date(validated.dataAplicacao);
    if (validated.observacoes !== undefined) updateData.observacoes = validated.observacoes;
    if (validated.status) updateData.status = validated.status;

    const reajuste = await db.reajuste.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${reajuste.obraId}`);

    return {
      success: true,
      message: 'Reajuste atualizado com sucesso!',
      data: reajuste,
    };
  } catch (error: any) {
    console.error("🔥 ERRO AO ATUALIZAR REAJUSTE:", error);
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        message: `Erro de validação: ${error.issues.map((e: any) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      message: error?.message || 'Erro ao atualizar reajuste',
    };
  }
}

/**
 * Excluir reajuste
 */
export async function excluirReajuste(id: string, obraId: string) {
  try {
    await db.reajuste.delete({
      where: { id },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);

    return {
      success: true,
      message: 'Reajuste excluído com sucesso!',
    };
  } catch (error: any) {
    console.error("🔥 ERRO AO EXCLUIR REAJUSTE:", error);
    return {
      success: false,
      message: error?.message || 'Erro ao excluir reajuste',
    };
  }
}

/**
 * Calcular valor total dos reajustes de uma obra
 */
export async function calcularTotalReajustesObra(obraId: string) {
  try {
    const reajustes = await db.reajuste.findMany({
      where: {
        obraId,
        status: 'APLICADO',
      },
      select: {
        valorReajuste: true,
      },
    });

    const total = reajustes.reduce((acc: number, reajuste: typeof reajustes[0]) => {
      return acc + Number(reajuste.valorReajuste);
    }, 0);

    return { success: true, total };
  } catch (error: any) {
    console.error("🔥 ERRO AO CALCULAR TOTAL DE REAJUSTES:", error);
    return { success: false, total: 0 };
  }
}
