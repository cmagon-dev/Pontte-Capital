'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema de validação
const AditivoSchema = z.object({
  obraId: z.string().uuid(),
  tipo: z.enum(['VALOR', 'PRAZO']),
  dataAssinatura: z.string().nullable().optional(),
  justificativa: z.string().nullable().optional(),
  // Campos de Valor
  valorAditivo: z.number().nullable().optional(),
  valorGlosa: z.number().nullable().optional(),
  // Campos de Prazo
  tipoUnidadePrazo: z.enum(['DIAS', 'MESES']).nullable().optional(),
  prazoVigencia: z.number().int().nullable().optional(),
  prazoExecucao: z.number().int().nullable().optional(),
  // Status
  status: z.string().optional(),
});

/**
 * Gerar próximo número de aditivo para a obra
 */
async function gerarProximoNumeroAditivo(obraId: string): Promise<number> {
  const ultimoAditivo = await db.aditivo.findFirst({
    where: { obraId },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  return ultimoAditivo ? ultimoAditivo.numero + 1 : 1;
}

/**
 * Criar novo aditivo
 */
export async function criarAditivo(data: any) {
  try {
    console.log("📢 SERVER ACTION CRIAR ADITIVO INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = AditivoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a obra existe
    const obra = await db.obra.findUnique({
      where: { id: payload.obraId },
    });

    if (!obra) {
      return {
        success: false,
        message: "Obra não encontrada.",
      };
    }

    // Gerar próximo número
    const numero = await gerarProximoNumeroAditivo(payload.obraId);

    // Criar aditivo
    const aditivo = await db.aditivo.create({
      data: {
        obraId: payload.obraId,
        numero,
        tipo: payload.tipo,
        dataAssinatura: payload.dataAssinatura ? new Date(payload.dataAssinatura) : null,
        justificativa: payload.justificativa || null,
        valorAditivo: payload.valorAditivo || null,
        valorGlosa: payload.valorGlosa || null,
        tipoUnidadePrazo: payload.tipoUnidadePrazo || null,
        prazoVigencia: payload.prazoVigencia || null,
        prazoExecucao: payload.prazoExecucao || null,
        status: payload.status || 'EM_ELABORACAO',
      },
    });

    console.log("✅ SUCESSO! Aditivo criado:", aditivo.id);

    revalidatePath(`/eng/contratos/contratos-obras/obra/${payload.obraId}`);
    return { 
      success: true, 
      message: `Aditivo nº ${numero} criado com sucesso!`,
      data: aditivo,
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao criar aditivo: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Listar aditivos de uma obra
 */
export async function listarAditivosObra(obraId: string) {
  try {
    const aditivos = await db.aditivo.findMany({
      where: { obraId },
      include: {
        documentos: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { numero: 'asc' },
    });

    return { success: true, data: aditivos };
  } catch (error: any) {
    console.error("🔥 ERRO AO LISTAR ADITIVOS:", error);
    return { success: false, data: [] };
  }
}

/**
 * Buscar aditivo por ID
 */
export async function buscarAditivoPorId(id: string) {
  try {
    const aditivo = await db.aditivo.findUnique({
      where: { id },
      include: {
        obra: {
          select: {
            id: true,
            codigo: true,
            nome: true,
          },
        },
      },
    });

    return aditivo;
  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR ADITIVO:", error);
    return null;
  }
}

/**
 * Atualizar aditivo
 */
export async function atualizarAditivo(id: string, data: any) {
  try {
    console.log("📢 SERVER ACTION ATUALIZAR ADITIVO INICIADA");
    console.log("🆔 ID:", id);
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = AditivoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o aditivo existe
    const aditivoExistente = await db.aditivo.findUnique({
      where: { id },
    });

    if (!aditivoExistente) {
      return {
        success: false,
        message: "Aditivo não encontrado.",
      };
    }

    // Atualizar
    const aditivoAtualizado = await db.aditivo.update({
      where: { id },
      data: {
        tipo: payload.tipo,
        dataAssinatura: payload.dataAssinatura ? new Date(payload.dataAssinatura) : null,
        justificativa: payload.justificativa || null,
        valorAditivo: payload.valorAditivo || null,
        valorGlosa: payload.valorGlosa || null,
        tipoUnidadePrazo: payload.tipoUnidadePrazo || null,
        prazoVigencia: payload.prazoVigencia || null,
        prazoExecucao: payload.prazoExecucao || null,
        status: payload.status || aditivoExistente.status,
      },
    });

    console.log("✅ SUCESSO! Aditivo atualizado:", aditivoAtualizado.id);

    revalidatePath(`/eng/contratos/contratos-obras/obra/${payload.obraId}`);
    return { 
      success: true, 
      message: "Aditivo atualizado com sucesso!",
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir aditivo
 */
export async function excluirAditivo(id: string, obraId: string) {
  try {
    console.log("🗑️ SERVER ACTION EXCLUIR ADITIVO INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se o aditivo existe
    const aditivo = await db.aditivo.findUnique({
      where: { id },
    });

    if (!aditivo) {
      return {
        success: false,
        message: "Aditivo não encontrado.",
      };
    }

    // Excluir
    await db.aditivo.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Aditivo excluído:", id);

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);
    return { 
      success: true, 
      message: "Aditivo excluído com sucesso!",
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}


/**
 * Calcular valor total dos aditivos de uma obra
 */
export async function calcularTotalAditivosObra(obraId: string) {
  try {
    const aditivos = await db.aditivo.findMany({
      where: { 
        obraId,
        tipo: 'VALOR',
        status: 'APROVADO',
      },
      select: {
        valorAditivo: true,
        valorGlosa: true,
      },
    });

    const totalAditivos = aditivos.reduce((acc: number, ad: { valorAditivo?: number | string | null }) => {
      const valor = Number(ad.valorAditivo || 0);
      return acc + valor;
    }, 0);

    const totalGlosas = aditivos.reduce((acc, ad) => {
      const glosa = Number(ad.valorGlosa || 0);
      return acc + glosa;
    }, 0);

    return {
      totalAditivos,
      totalGlosas,
      valorLiquido: totalAditivos - totalGlosas,
    };
  } catch (error: any) {
    console.error("🔥 ERRO AO CALCULAR TOTAIS:", error);
    return {
      totalAditivos: 0,
      totalGlosas: 0,
      valorLiquido: 0,
    };
  }
}
