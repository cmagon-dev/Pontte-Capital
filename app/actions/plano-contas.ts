'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Schema de validação para Plano de Contas
const PlanoContasSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  descricao: z.string().optional().nullable().transform(val => val === '' ? null : val),
  isPadrao: z.boolean().optional().default(false),
  status: z.string().optional().default("ATIVO"),
  obraIds: z.any().optional().nullable(),
});

// Schema de validação para Conta Contábil
const ContaContabilSchema = z.object({
  codigo: z.string().min(1, "Código obrigatório"),
  nome: z.string().min(3, "Nome muito curto"),
  descricao: z.string().optional().nullable().transform(val => val === '' ? null : val),
  nivel: z.number().min(0).max(3, "Nível máximo é 3 (4 níveis de hierarquia)"),
  ordem: z.number().min(0),
  parentId: z.string().optional().nullable().transform(val => val === '' ? null : val),
  tipo: z.enum(['ANALITICA', 'SINTETICA', 'LINHA_RESULTADO']),
  natureza: z.enum(['DEVEDORA', 'CREDORA']),
  aceitaLancamento: z.boolean().optional().default(true),
  categoriaDRE: z.enum([
    'RECEITA_BRUTA',
    'DEDUCOES_RECEITA',
    'RECEITA_LIQUIDA',
    'CUSTO_SERVICOS',
    'LUCRO_BRUTO',
    'DESPESAS_COMERCIAIS',
    'DESPESAS_ADMINISTRATIVAS',
    'DESPESAS_PESSOAL',
    'OUTRAS_DESPESAS_OPERACIONAIS',
    'EBITDA',
    'DEPRECIACAO_AMORTIZACAO',
    'EBIT',
    'RECEITAS_FINANCEIRAS',
    'DESPESAS_FINANCEIRAS',
    'RESULTADO_FINANCEIRO',
    'LAIR',
    'IMPOSTOS_LUCRO',
    'LUCRO_LIQUIDO'
  ]).optional().nullable(),
  tipoCalculo: z.enum(['SOMA', 'SUBTRACAO', 'FORMULA']).optional().nullable(),
  formula: z.string().optional().nullable().transform(val => val === '' ? null : val),
  categoria: z.string().optional().nullable().transform(val => val === '' ? null : val),
  subcategoria: z.string().optional().nullable().transform(val => val === '' ? null : val),
  status: z.string().optional().default("ATIVA"),
  observacoes: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

// Função para gerar o próximo código PLANO-XXX
async function gerarProximoCodigoPlano(construtoraId: string) {
  const ultimoPlano = await db.planoContas.findFirst({
    where: { construtoraId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoPlano || !ultimoPlano.codigo) {
    return 'PLANO-001';
  }

  const match = ultimoPlano.codigo.match(/PLANO-(\d+)/);
  if (!match) {
    return 'PLANO-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `PLANO-${String(proximoNumero).padStart(3, '0')}`;
}

/**
 * Criar novo plano de contas
 */
export async function criarPlanoContas(construtoraId: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - CRIAR PLANO DE CONTAS");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = PlanoContasSchema.safeParse(data);

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

    // 3. Se marcar como padrão, desmarcar outros planos padrão
    if (payload.isPadrao) {
      await db.planoContas.updateMany({
        where: {
          construtoraId,
          isPadrao: true,
        },
        data: {
          isPadrao: false,
        },
      });
    }

    // 4. Gerar código
    console.log("🔢 GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoPlano(construtoraId);
    console.log("✅ Código gerado:", codigo);

    // 5. Preparar obraIds
    const obraIds = payload.obraIds || null;

    // 6. Salvar
    console.log("💾 SALVANDO NO BANCO...");
    const novoPlano = await db.planoContas.create({
      data: {
        codigo,
        construtoraId,
        nome: payload.nome,
        descricao: payload.descricao || null,
        isPadrao: payload.isPadrao || false,
        status: payload.status || "ATIVO",
        obraIds: obraIds ? obraIds : Prisma.JsonNull,
      },
    });

    console.log("🚀 SUCESSO! Plano de contas criado:", novoPlano.id);
    console.log("🚀    Código:", novoPlano.codigo);
    
    revalidatePath(`/fin/cadastros/${construtoraId}/plano-contas`);
    revalidatePath(`/fin/cadastros/${construtoraId}`);
    return { success: true, message: "Plano de contas cadastrado com sucesso!", planoId: novoPlano.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar plano de contas existente
 */
export async function atualizarPlanoContas(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - ATUALIZAR PLANO DE CONTAS");
    console.log("🆔 Plano ID:", id);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = PlanoContasSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique os campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // 2. Verificar se o plano existe
    const planoExistente = await db.planoContas.findUnique({
      where: { id },
    });

    if (!planoExistente) {
      return {
        success: false,
        message: "Plano de contas não encontrado.",
      };
    }

    // 3. Se marcar como padrão, desmarcar outros planos padrão
    if (payload.isPadrao) {
      await db.planoContas.updateMany({
        where: {
          construtoraId: planoExistente.construtoraId,
          isPadrao: true,
          id: { not: id }
        },
        data: {
          isPadrao: false,
        },
      });
    }

    // 4. Preparar obraIds
    const obraIds = payload.obraIds || null;

    // 5. Atualizar
    const planoAtualizado = await db.planoContas.update({
      where: { id },
      data: {
        nome: payload.nome,
        descricao: payload.descricao || null,
        isPadrao: payload.isPadrao || false,
        status: payload.status || "ATIVO",
        obraIds: obraIds ? obraIds : Prisma.JsonNull,
      },
    });

    console.log("✅ SUCESSO! Plano de contas atualizado:", planoAtualizado.id);
    
    revalidatePath(`/fin/cadastros/${planoExistente.construtoraId}/plano-contas`);
    revalidatePath(`/fin/cadastros/${planoExistente.construtoraId}/plano-contas/${id}`);
    revalidatePath(`/fin/cadastros/${planoExistente.construtoraId}`);
    return { success: true, message: "Plano de contas atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Definir plano como padrão
 */
export async function definirPlanoPadrao(id: string) {
  try {
    const plano = await db.planoContas.findUnique({
      where: { id },
    });

    if (!plano) {
      return {
        success: false,
        message: "Plano de contas não encontrado.",
      };
    }

    // Desmarcar outros planos padrão
    await db.planoContas.updateMany({
      where: {
        construtoraId: plano.construtoraId,
        isPadrao: true,
      },
      data: {
        isPadrao: false,
      },
    });

    // Marcar como padrão
    await db.planoContas.update({
      where: { id },
      data: {
        isPadrao: true,
      },
    });

    revalidatePath(`/fin/cadastros/${plano.construtoraId}/plano-contas`);
    return { success: true, message: "Plano de contas definido como padrão!" };

  } catch (error: any) {
    console.error("🔥 ERRO AO DEFINIR PADRÃO:", error);
    return {
      success: false,
      message: `Erro: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir plano de contas
 */
export async function excluirPlanoContas(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION - EXCLUIR PLANO DE CONTAS");
    console.log("🆔 Plano ID:", id);

    // 1. Verificar se o plano existe
    const plano = await db.planoContas.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contas: true,
          }
        }
      }
    });

    if (!plano) {
      return {
        success: false,
        message: "Plano de contas não encontrado.",
      };
    }

    // 2. Não permitir exclusão do plano padrão
    if (plano.isPadrao) {
      return {
        success: false,
        message: "Não é possível excluir o plano de contas padrão.",
      };
    }

    // 3. Excluir (cascade vai excluir as contas contábeis)
    await db.planoContas.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Plano de contas excluído:", id);
    
    revalidatePath(`/fin/cadastros/${plano.construtoraId}/plano-contas`);
    revalidatePath(`/fin/cadastros/${plano.construtoraId}`);
    return { success: true, message: "Plano de contas excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Buscar planos de contas de uma construtora
 */
export async function buscarPlanosContas(construtoraId: string) {
  try {
    console.log("🔍 BUSCANDO PLANOS DE CONTAS");
    console.log("🏢 Construtora ID:", construtoraId);

    const planos = await db.planoContas.findMany({
      where: { construtoraId },
      include: {
        _count: {
          select: {
            contas: true,
          }
        }
      },
      orderBy: [
        { isPadrao: 'desc' }, // Padrão primeiro
        { nome: 'asc' },
      ],
    });

    console.log(`✅ ${planos.length} planos de contas encontrados`);
    return planos;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR PLANOS:", error);
    throw error;
  }
}

/**
 * Buscar plano de contas por ID
 */
export async function buscarPlanoContasPorId(id: string) {
  try {
    const plano = await db.planoContas.findUnique({
      where: { id },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
          }
        },
        _count: {
          select: {
            contas: true,
          }
        }
      }
    });

    return plano;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR PLANO:", error);
    throw error;
  }
}

/**
 * Criar nova conta contábil
 */
export async function criarContaContabil(planoContasId: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - CRIAR CONTA CONTÁBIL");
    console.log("📊 Plano ID:", planoContasId);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = ContaContabilSchema.safeParse(data);

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

    // 2. Verificar se o plano existe
    const plano = await db.planoContas.findUnique({
      where: { id: planoContasId }
    });

    if (!plano) {
      return {
        success: false,
        message: "Plano de contas não encontrado.",
      };
    }

    // 3. Verificar duplicidade de código no plano
    const contaExistente = await db.contaContabil.findFirst({
      where: {
        planoContasId,
        codigo: payload.codigo,
      }
    });

    if (contaExistente) {
      return {
        success: false,
        message: "Já existe uma conta com este código neste plano.",
      };
    }

    // 4. Se tem parentId, verificar se o pai existe e calcular nível
    if (payload.parentId) {
      const contaPai = await db.contaContabil.findUnique({
        where: { id: payload.parentId }
      });

      if (!contaPai) {
        return {
          success: false,
          message: "Conta contábil pai não encontrada.",
        };
      }

      if (contaPai.planoContasId !== planoContasId) {
        return {
          success: false,
          message: "A conta pai deve pertencer ao mesmo plano de contas.",
        };
      }

      // Validar nível máximo (máximo 3 = 4 níveis de 0 a 3)
      if (contaPai.nivel >= 3) {
        return {
          success: false,
          message: "Nível máximo da hierarquia atingido (4 níveis).",
        };
      }

      payload.nivel = contaPai.nivel + 1;
    } else {
      payload.nivel = 0;
    }

    // 5. Validar tipos especiais
    if (payload.tipo === 'LINHA_RESULTADO') {
      payload.aceitaLancamento = false;
    }

    if (payload.tipo === 'SINTETICA') {
      payload.aceitaLancamento = false;
    }

    // 6. Salvar
    console.log("💾 SALVANDO NO BANCO...");
    const novaConta = await db.contaContabil.create({
      data: {
        planoContasId,
        codigo: payload.codigo,
        nome: payload.nome,
        descricao: payload.descricao || null,
        nivel: payload.nivel,
        ordem: payload.ordem,
        parentId: payload.parentId || null,
        tipo: payload.tipo,
        natureza: payload.natureza,
        aceitaLancamento: payload.aceitaLancamento ?? true,
        categoriaDRE: payload.categoriaDRE || null,
        tipoCalculo: payload.tipoCalculo || null,
        formula: payload.formula || null,
        categoria: payload.categoria || null,
        subcategoria: payload.subcategoria || null,
        status: payload.status || "ATIVA",
        observacoes: payload.observacoes || null,
      },
    });

    console.log("🚀 SUCESSO! Conta contábil criada:", novaConta.id);
    console.log("🚀    Código:", novaConta.codigo);
    
    revalidatePath(`/fin/cadastros/${plano.construtoraId}/plano-contas/${planoContasId}`);
    return { success: true, message: "Conta contábil cadastrada com sucesso!", contaId: novaConta.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar conta contábil existente
 */
export async function atualizarContaContabil(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - ATUALIZAR CONTA CONTÁBIL");
    console.log("🆔 Conta ID:", id);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = ContaContabilSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique os campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // 2. Verificar se a conta existe
    const contaExistente = await db.contaContabil.findUnique({
      where: { id },
      include: {
        planoContas: {
          select: {
            id: true,
            construtoraId: true,
          }
        }
      }
    });

    if (!contaExistente) {
      return {
        success: false,
        message: "Conta contábil não encontrada.",
      };
    }

    // 3. Verificar duplicidade de código (exceto próprio registro)
    if (payload.codigo !== contaExistente.codigo) {
      const contaDuplicada = await db.contaContabil.findFirst({
        where: {
          planoContasId: contaExistente.planoContasId,
          codigo: payload.codigo,
          id: { not: id }
        }
      });

      if (contaDuplicada) {
        return {
          success: false,
          message: "Já existe outra conta com este código neste plano.",
        };
      }
    }

    // 4. Validar tipos especiais
    if (payload.tipo === 'LINHA_RESULTADO') {
      payload.aceitaLancamento = false;
    }

    if (payload.tipo === 'SINTETICA') {
      payload.aceitaLancamento = false;
    }

    // 5. Atualizar
    const contaAtualizada = await db.contaContabil.update({
      where: { id },
      data: {
        codigo: payload.codigo,
        nome: payload.nome,
        descricao: payload.descricao || null,
        ordem: payload.ordem,
        tipo: payload.tipo,
        natureza: payload.natureza,
        aceitaLancamento: payload.aceitaLancamento ?? true,
        categoriaDRE: payload.categoriaDRE || null,
        tipoCalculo: payload.tipoCalculo || null,
        formula: payload.formula || null,
        categoria: payload.categoria || null,
        subcategoria: payload.subcategoria || null,
        status: payload.status || "ATIVA",
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Conta contábil atualizada:", contaAtualizada.id);
    
    revalidatePath(`/fin/cadastros/${contaExistente.planoContas.construtoraId}/plano-contas/${contaExistente.planoContasId}`);
    return { success: true, message: "Conta contábil atualizada com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir conta contábil
 */
export async function excluirContaContabil(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION - EXCLUIR CONTA CONTÁBIL");
    console.log("🆔 Conta ID:", id);

    // 1. Verificar se a conta existe
    const conta = await db.contaContabil.findUnique({
      where: { id },
      include: {
        planoContas: {
          select: {
            id: true,
            construtoraId: true,
            isPadrao: true,
          }
        }
      }
    });

    if (!conta) {
      return {
        success: false,
        message: "Conta contábil não encontrada.",
      };
    }

    // 2. Verificar se há contas filhas
    const contasFilhas = await db.contaContabil.count({
      where: { parentId: id }
    });

    if (contasFilhas > 0) {
      return {
        success: false,
        message: `Não é possível excluir. Existem ${contasFilhas} conta(s) vinculada(s) a esta.`,
      };
    }

    // 3. Não permitir exclusão de linhas de resultado do plano padrão
    if (conta.planoContas.isPadrao && conta.tipo === 'LINHA_RESULTADO') {
      return {
        success: false,
        message: "Não é possível excluir linhas de resultado do plano padrão.",
      };
    }

    // TODO: Verificar se há lançamentos vinculados à conta

    // 4. Excluir
    await db.contaContabil.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Conta contábil excluída:", id);
    
    revalidatePath(`/fin/cadastros/${conta.planoContas.construtoraId}/plano-contas/${conta.planoContasId}`);
    return { success: true, message: "Conta contábil excluída com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Buscar contas contábeis de um plano
 */
export async function buscarContasContabeis(planoContasId: string) {
  try {
    console.log("🔍 BUSCANDO CONTAS CONTÁBEIS");
    console.log("📊 Plano ID:", planoContasId);

    const contas = await db.contaContabil.findMany({
      where: { planoContasId },
      orderBy: [
        { codigo: 'asc' },
      ],
    });

    console.log(`✅ ${contas.length} contas contábeis encontradas`);
    return contas;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CONTAS:", error);
    throw error;
  }
}

/**
 * Buscar conta contábil por ID
 */
export async function buscarContaContabilPorId(id: string) {
  try {
    const conta = await db.contaContabil.findUnique({
      where: { id },
      include: {
        planoContas: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            construtoraId: true,
          }
        }
      }
    });

    return conta;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CONTA:", error);
    throw error;
  }
}

/**
 * Mover conta contábil para outro pai (reorganizar hierarquia)
 */
export async function moverContaContabil(id: string, novoParentId: string | null) {
  try {
    const conta = await db.contaContabil.findUnique({
      where: { id },
      include: {
        planoContas: true,
      }
    });

    if (!conta) {
      return {
        success: false,
        message: "Conta contábil não encontrada.",
      };
    }

    let novoNivel = 0;

    if (novoParentId) {
      const novoPai = await db.contaContabil.findUnique({
        where: { id: novoParentId }
      });

      if (!novoPai) {
        return {
          success: false,
          message: "Conta pai não encontrada.",
        };
      }

      if (novoPai.planoContasId !== conta.planoContasId) {
        return {
          success: false,
          message: "A conta pai deve pertencer ao mesmo plano de contas.",
        };
      }

      if (novoPai.nivel >= 3) {
        return {
          success: false,
          message: "Nível máximo da hierarquia atingido (4 níveis).",
        };
      }

      novoNivel = novoPai.nivel + 1;
    }

    await db.contaContabil.update({
      where: { id },
      data: {
        parentId: novoParentId,
        nivel: novoNivel,
      },
    });

    revalidatePath(`/fin/cadastros/${conta.planoContas.construtoraId}/plano-contas/${conta.planoContasId}`);
    return { success: true, message: "Conta movida com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO AO MOVER CONTA:", error);
    return {
      success: false,
      message: `Erro ao mover: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}
