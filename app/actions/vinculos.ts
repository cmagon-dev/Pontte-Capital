'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ==================== VÍNCULO COM FUNDO ====================

const VinculoFundoSchema = z.object({
  obraId: z.string().min(1, "Obra é obrigatória"),
  fundoId: z.string().min(1, "Fundo é obrigatório"),
  percentual: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  valorAlocado: z.number().min(0, "Valor alocado deve ser positivo"),
  observacoes: z.string().optional().nullable(),
});

export async function vincularFundo(data: any) {
  try {
    console.log("📢 VINCULANDO FUNDO À OBRA");
    console.log("📦 Dados recebidos:", data);

    const validatedFields = VinculoFundoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ Erro de validação:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Dados inválidos",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se já existe um fundo vinculado a essa obra
    const vinculoExistente = await db.vinculoFundo.findUnique({
      where: { obraId: payload.obraId },
    });

    if (vinculoExistente) {
      return {
        success: false,
        message: "Esta obra já possui um fundo vinculado. Remova o vínculo existente primeiro.",
      };
    }

    // Criar vínculo
    const vinculo = await db.vinculoFundo.create({
      data: {
        obraId: payload.obraId,
        fundoId: payload.fundoId,
        percentual: payload.percentual,
        valorAlocado: payload.valorAlocado,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ Fundo vinculado com sucesso:", vinculo.id);

    revalidatePath(`/eng/contratos/contratos-obras/obra/${payload.obraId}`);
    return {
      success: true,
      message: "Fundo vinculado com sucesso!",
    };
  } catch (error: any) {
    console.error("🔥 Erro ao vincular fundo:", error);
    return {
      success: false,
      message: `Erro ao vincular: ${error?.message || "Erro interno"}`,
    };
  }
}

export async function desvincularFundo(vinculoId: string, obraId: string) {
  try {
    await db.vinculoFundo.delete({
      where: { id: vinculoId },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);
    return {
      success: true,
      message: "Fundo desvinculado com sucesso!",
    };
  } catch (error: any) {
    console.error("🔥 Erro ao desvincular fundo:", error);
    return {
      success: false,
      message: `Erro ao desvincular: ${error?.message || "Erro interno"}`,
    };
  }
}

// ==================== VÍNCULO COM FIADOR ====================

const VinculoFiadorSchema = z.object({
  obraId: z.string().min(1, "Obra é obrigatória"),
  fiadorId: z.string().min(1, "Fiador é obrigatório"),
  percentualGarantia: z.number().min(0).max(100, "Percentual deve estar entre 0 e 100"),
  valorGarantia: z.number().min(0, "Valor da garantia deve ser positivo"),
  observacoes: z.string().optional().nullable(),
});

export async function vincularFiador(data: any) {
  try {
    console.log("📢 VINCULANDO FIADOR À OBRA");
    console.log("📦 Dados recebidos:", data);

    const validatedFields = VinculoFiadorSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ Erro de validação:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Dados inválidos",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o fiador já está vinculado a essa obra
    const vinculoExistente = await db.vinculoFiador.findFirst({
      where: {
        obraId: payload.obraId,
        fiadorId: payload.fiadorId,
      },
    });

    if (vinculoExistente) {
      return {
        success: false,
        message: "Este fiador já está vinculado a esta obra.",
      };
    }

    // Criar vínculo
    const vinculo = await db.vinculoFiador.create({
      data: {
        obraId: payload.obraId,
        fiadorId: payload.fiadorId,
        percentualGarantia: payload.percentualGarantia,
        valorGarantia: payload.valorGarantia,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ Fiador vinculado com sucesso:", vinculo.id);

    revalidatePath(`/eng/contratos/contratos-obras/obra/${payload.obraId}`);
    return {
      success: true,
      message: "Fiador vinculado com sucesso!",
      vinculoId: vinculo.id,
    };
  } catch (error: any) {
    console.error("🔥 Erro ao vincular fiador:", error);
    return {
      success: false,
      message: `Erro ao vincular: ${error?.message || "Erro interno"}`,
    };
  }
}

export async function desvincularFiador(vinculoId: string, obraId: string) {
  try {
    await db.vinculoFiador.delete({
      where: { id: vinculoId },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);
    return {
      success: true,
      message: "Fiador desvinculado com sucesso!",
    };
  } catch (error: any) {
    console.error("🔥 Erro ao desvincular fiador:", error);
    return {
      success: false,
      message: `Erro ao desvincular: ${error?.message || "Erro interno"}`,
    };
  }
}

// ==================== VÍNCULO DE BEM À FIADOR ====================

export async function vincularBemAoFiador(vinculoFiadorId: string, bemId: string, obraId: string) {
  try {
    console.log("📢 VINCULANDO BEM AO FIADOR");

    // Verificar se o bem já está vinculado
    const vinculoExistente = await db.vinculoBemGarantia.findFirst({
      where: {
        vinculoFiadorId,
        bemId,
      },
    });

    if (vinculoExistente) {
      return {
        success: false,
        message: "Este bem já está vinculado a este fiador nesta obra.",
      };
    }

    // Criar vínculo
    await db.vinculoBemGarantia.create({
      data: {
        vinculoFiadorId,
        bemId,
      },
    });

    console.log("✅ Bem vinculado com sucesso");

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);
    return {
      success: true,
      message: "Bem vinculado com sucesso!",
    };
  } catch (error: any) {
    console.error("🔥 Erro ao vincular bem:", error);
    return {
      success: false,
      message: `Erro ao vincular: ${error?.message || "Erro interno"}`,
    };
  }
}

export async function desvincularBem(vinculoBemId: string, obraId: string) {
  try {
    await db.vinculoBemGarantia.delete({
      where: { id: vinculoBemId },
    });

    revalidatePath(`/eng/contratos/contratos-obras/obra/${obraId}`);
    return {
      success: true,
      message: "Bem desvinculado com sucesso!",
    };
  } catch (error: any) {
    console.error("🔥 Erro ao desvincular bem:", error);
    return {
      success: false,
      message: `Erro ao desvincular: ${error?.message || "Erro interno"}`,
    };
  }
}

// ==================== LISTAR VÍNCULOS ====================

export async function listarVinculosObra(obraId: string) {
  try {
    const [vinculoFundo, vinculosFiadores] = await Promise.all([
      // Buscar vínculo com fundo (apenas 1)
      db.vinculoFundo.findUnique({
        where: { obraId },
        include: {
          fundo: {
            select: {
              id: true,
              codigo: true,
              razaoSocial: true,
              nomeFantasia: true,
              cnpj: true,
            },
          },
        },
      }),
      // Buscar vínculos com fiadores (múltiplos)
      db.vinculoFiador.findMany({
        where: { obraId },
        include: {
          fiador: {
            select: {
              id: true,
              codigo: true,
              nome: true,
              tipo: true,
              cpfCnpj: true,
            },
          },
          bensVinculados: {
            include: {
              bem: {
                select: {
                  id: true,
                  tipo: true,
                  descricao: true,
                  valor: true,
                  endereco: true,
                  cidade: true,
                  estado: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      vinculoFundo,
      vinculosFiadores,
    };
  } catch (error: any) {
    console.error("🔥 Erro ao listar vínculos:", error);
    return {
      vinculoFundo: null,
      vinculosFiadores: [],
    };
  }
}

// ==================== LISTAR FUNDOS E FIADORES DISPONÍVEIS ====================

export async function listarFundosDisponiveis() {
  try {
    const fundos = await db.fundo.findMany({
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true,
      },
      orderBy: { razaoSocial: 'asc' },
    });

    return fundos;
  } catch (error) {
    console.error("🔥 Erro ao listar fundos:", error);
    return [];
  }
}

export async function listarFiadoresDisponiveis() {
  try {
    const fiadores = await db.fiador.findMany({
      select: {
        id: true,
        codigo: true,
        nome: true,
        tipo: true,
        cpfCnpj: true,
      },
      orderBy: { nome: 'asc' },
    });

    return fiadores;
  } catch (error) {
    console.error("🔥 Erro ao listar fiadores:", error);
    return [];
  }
}

export async function listarBensPorFiador(fiadorId: string) {
  try {
    const bens = await db.bem.findMany({
      where: {
        fiadorId,
        status: 'Livre', // Apenas bens livres (não vinculados a outras obras)
      },
      select: {
        id: true,
        tipo: true,
        descricao: true,
        valor: true,
        endereco: true,
        cidade: true,
        estado: true,
      },
      orderBy: { descricao: 'asc' },
    });

    return bens;
  } catch (error) {
    console.error("🔥 Erro ao listar bens:", error);
    return [];
  }
}
