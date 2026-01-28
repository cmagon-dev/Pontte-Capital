'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Schema de validação para Centro de Custo
const CentroCustoSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  descricao: z.string().optional().nullable().transform(val => val === '' ? null : val),
  tipo: z.string().optional().nullable().transform(val => val === '' ? null : val),
  nivel: z.number().optional().default(0),
  parentId: z.string().optional().nullable().transform(val => val === '' ? null : val),
  obraIds: z.any().optional().nullable(),
  status: z.string().optional().default("ATIVO"),
  observacoes: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

// Função para gerar o próximo código CC-XXX
async function gerarProximoCodigoCentroCusto(construtoraId: string) {
  const ultimoCentroCusto = await db.centroCusto.findFirst({
    where: { construtoraId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoCentroCusto || !ultimoCentroCusto.codigo) {
    return 'CC-001';
  }

  const match = ultimoCentroCusto.codigo.match(/CC-(\d+)/);
  if (!match) {
    return 'CC-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `CC-${String(proximoNumero).padStart(3, '0')}`;
}

/**
 * Criar novo centro de custo
 */
export async function criarCentroCusto(construtoraId: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - CRIAR CENTRO DE CUSTO");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = CentroCustoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique os campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    console.log("✅ VALIDAÇÃO: SUCESSO");
    const payload = validatedFields.data;

    // 2. Verificar se a construtora existe
    const construtora = await db.construtora.findUnique({
      where: { id: construtoraId }
    });

    if (!construtora) {
      return {
        success: false,
        message: "Construtora não encontrada.",
      };
    }

    // 3. Se tem parentId, verificar se o pai existe
    if (payload.parentId) {
      const centroCustoPai = await db.centroCusto.findUnique({
        where: { id: payload.parentId }
      });

      if (!centroCustoPai) {
        return {
          success: false,
          message: "Centro de custo pai não encontrado.",
        };
      }

      // Calcular nível baseado no pai
      payload.nivel = centroCustoPai.nivel + 1;
    }

    // 4. Gerar código
    console.log("🔢 GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoCentroCusto(construtoraId);
    console.log("✅ Código gerado:", codigo);

    // 5. Preparar obraIds
    const obraIds = payload.obraIds || null;

    // 6. Salvar
    console.log("💾 SALVANDO NO BANCO...");
    const novoCentroCusto = await db.centroCusto.create({
      data: {
        codigo,
        construtoraId,
        nome: payload.nome,
        descricao: payload.descricao || null,
        tipo: payload.tipo || null,
        nivel: payload.nivel || 0,
        parentId: payload.parentId || null,
        obraIds: obraIds ? obraIds : Prisma.JsonNull,
        status: payload.status || "ATIVO",
        observacoes: payload.observacoes || null,
      },
    });

    console.log("🚀 SUCESSO! Centro de custo criado:", novoCentroCusto.id);
    console.log("🚀    Código:", novoCentroCusto.codigo);
    
    revalidatePath(`/fin/cadastros/${construtoraId}/centro-custo`);
    revalidatePath(`/fin/cadastros/${construtoraId}`);
    return { success: true, message: "Centro de custo cadastrado com sucesso!", centroCustoId: novoCentroCusto.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar centro de custo existente
 */
export async function atualizarCentroCusto(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - ATUALIZAR CENTRO DE CUSTO");
    console.log("🆔 Centro de Custo ID:", id);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = CentroCustoSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique os campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // 2. Verificar se o centro de custo existe
    const centroCustoExistente = await db.centroCusto.findUnique({
      where: { id },
    });

    if (!centroCustoExistente) {
      return {
        success: false,
        message: "Centro de custo não encontrado.",
      };
    }

    // 3. Se tem parentId, verificar se o pai existe e não é ele mesmo
    if (payload.parentId) {
      if (payload.parentId === id) {
        return {
          success: false,
          message: "Um centro de custo não pode ser pai de si mesmo.",
        };
      }

      const centroCustoPai = await db.centroCusto.findUnique({
        where: { id: payload.parentId }
      });

      if (!centroCustoPai) {
        return {
          success: false,
          message: "Centro de custo pai não encontrado.",
        };
      }

      // Calcular nível baseado no pai
      payload.nivel = centroCustoPai.nivel + 1;
    }

    // 4. Preparar obraIds
    const obraIds = payload.obraIds || null;

    // 5. Atualizar
    const centroCustoAtualizado = await db.centroCusto.update({
      where: { id },
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        tipo: payload.tipo || null,
        nivel: payload.nivel ?? 0,
        parentId: payload.parentId || null,
        obraIds: obraIds ? obraIds : Prisma.JsonNull,
        status: payload.status || "ATIVO",
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Centro de custo atualizado:", centroCustoAtualizado.id);
    
    revalidatePath(`/fin/cadastros/${centroCustoExistente.construtoraId}/centro-custo`);
    revalidatePath(`/fin/cadastros/${centroCustoExistente.construtoraId}/centro-custo/${id}`);
    revalidatePath(`/fin/cadastros/${centroCustoExistente.construtoraId}`);
    return { success: true, message: "Centro de custo atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir centro de custo
 */
export async function excluirCentroCusto(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION - EXCLUIR CENTRO DE CUSTO");
    console.log("🆔 Centro de Custo ID:", id);

    // 1. Verificar se o centro de custo existe
    const centroCusto = await db.centroCusto.findUnique({
      where: { id },
    });

    if (!centroCusto) {
      return {
        success: false,
        message: "Centro de custo não encontrado.",
      };
    }

    // 2. Verificar se há centros de custo filhos
    const centrosCustoFilhos = await db.centroCusto.count({
      where: { parentId: id }
    });

    if (centrosCustoFilhos > 0) {
      return {
        success: false,
        message: `Não é possível excluir. Existem ${centrosCustoFilhos} centro(s) de custo vinculado(s) a este.`,
      };
    }

    // TODO: Verificar se há lançamentos vinculados ao centro de custo
    // Por enquanto, permitir exclusão

    // 3. Excluir
    await db.centroCusto.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Centro de custo excluído:", id);
    
    revalidatePath(`/fin/cadastros/${centroCusto.construtoraId}/centro-custo`);
    revalidatePath(`/fin/cadastros/${centroCusto.construtoraId}`);
    return { success: true, message: "Centro de custo excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Buscar centros de custo de uma construtora
 */
export async function buscarCentrosCusto(construtoraId: string, filtros?: {
  tipo?: string;
  status?: string;
  busca?: string;
}) {
  try {
    console.log("🔍 BUSCANDO CENTROS DE CUSTO");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("🔧 Filtros:", filtros);

    const where: any = {
      construtoraId,
    };

    // Aplicar filtros
    if (filtros?.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.busca) {
      where.OR = [
        { nome: { contains: filtros.busca, mode: 'insensitive' } },
        { codigo: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }

    const centrosCusto = await db.centroCusto.findMany({
      where,
      orderBy: [
        { nivel: 'asc' }, // Pais primeiro
        { nome: 'asc' },
      ],
    });

    console.log(`✅ ${centrosCusto.length} centros de custo encontrados`);
    return centrosCusto;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CENTROS DE CUSTO:", error);
    throw error;
  }
}

/**
 * Buscar centro de custo por ID
 */
export async function buscarCentroCustoPorId(id: string) {
  try {
    const centroCusto = await db.centroCusto.findUnique({
      where: { id },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
          }
        }
      }
    });

    return centroCusto;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CENTRO DE CUSTO:", error);
    throw error;
  }
}
