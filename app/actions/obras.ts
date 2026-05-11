'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getObraScopeFilter } from '@/lib/scope';

// Função para gerar o próximo código de obra por construtora
async function gerarProximoCodigoObra(construtoraId: string) {
  // Buscar a última obra desta construtora
  const ultimaObra = await db.obra.findFirst({
    where: { construtoraId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimaObra || !ultimaObra.codigo || ultimaObra.codigo === 'CT-000') {
    return 'CT-001';
  }

  // Extrair o número do código (CT-XXX)
  const match = ultimaObra.codigo.match(/CT-(\d+)/);
  if (!match) {
    return 'CT-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `CT-${String(proximoNumero).padStart(3, '0')}`;
}

// Schema de validação para Obra
const ObraSchema = z.object({
  nome: z.string().min(3, "Nome da obra muito curto"),
  construtoraId: z.string().min(1, "Construtora é obrigatória"),
  contratanteId: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Localização
  endereco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cidade: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estado: z.string().optional().nullable().transform(val => val === '' ? null : val),
  latitude: z.string().optional().nullable().transform(val => val === '' ? null : val),
  longitude: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Vigência do Contrato
  prazoMeses: z.number().optional().nullable(),
  dataInicio: z.string().optional().nullable().transform(val => val === '' ? null : val),
  dataFim: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Execução da Obra
  prazoExecucaoMeses: z.number().optional().nullable(),
  dataInicioExecucao: z.string().optional().nullable().transform(val => val === '' ? null : val),
  dataFimExecucao: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Valor
  valorContrato: z.string().min(1, "Valor do contrato é obrigatório").transform((val) => {
    const numValue = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(numValue) ? 0 : numValue;
  }),
  // Documentação Técnica
  cno: z.string().optional().nullable().transform(val => val === '' ? null : val),
  art: z.string().optional().nullable().transform(val => val === '' ? null : val),
  alvara: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Recurso Financeiro
  recursoFinanceiro: z.string().optional().nullable().transform(val => val === '' ? null : val), // UUID da fonte
  fonteRecursoId: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Status
  status: z.enum(['NAO_INICIADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'PARALISADA', 'CANCELADA']).default('NAO_INICIADA'),
});

export async function criarObra(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR OBRA INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = ObraSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    console.log("✅ VALIDAÇÃO ZOD: SUCESSO");
    const payload = validatedFields.data;

    // Verificar se a construtora existe
    const construtora = await db.construtora.findUnique({
      where: { id: payload.construtoraId },
    });

    if (!construtora) {
      return {
        success: false,
        message: "Construtora não encontrada.",
      };
    }

    // Verificar se o contratante existe (se fornecido)
    if (payload.contratanteId) {
      const contratante = await db.contratante.findUnique({
        where: { id: payload.contratanteId },
      });

      if (!contratante) {
        return {
          success: false,
          message: "Contratante não encontrado.",
        };
      }
    }

    // Gerar código sequencial por construtora
    const codigo = await gerarProximoCodigoObra(payload.construtoraId);
    console.log("🔢 CÓDIGO GERADO:", codigo);

    // Salvar
    console.log("💾 SALVANDO OBRA NO BANCO...");
    
    const novaObra = await db.obra.create({
      data: {
        codigo,
        nome: payload.nome,
        construtoraId: payload.construtoraId,
        contratanteId: payload.contratanteId || null,
        // Localização
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        // Vigência do Contrato
        prazoMeses: payload.prazoMeses || null,
        dataInicio: payload.dataInicio ? new Date(payload.dataInicio) : null,
        dataFim: payload.dataFim ? new Date(payload.dataFim) : null,
        // Execução da Obra
        prazoExecucaoMeses: payload.prazoExecucaoMeses || null,
        dataInicioExecucao: payload.dataInicioExecucao ? new Date(payload.dataInicioExecucao) : null,
        dataFimExecucao: payload.dataFimExecucao ? new Date(payload.dataFimExecucao) : null,
        // Valor
        valorContrato: payload.valorContrato,
        // Documentação Técnica
        cno: payload.cno || null,
        art: payload.art || null,
        alvara: payload.alvara || null,
        // Recurso Financeiro
        fonteRecursoId: payload.recursoFinanceiro || payload.fonteRecursoId || null,
        // Status
        status: payload.status,
      },
    });

    console.log("✅ SUCESSO! Obra criada:", novaObra.id);
    console.log("📊 Nome:", novaObra.nome);
    console.log("------------------------------------------------");

    revalidatePath('/eng/contratos/contratos-obras');
    return { 
      success: true, 
      message: "Obra cadastrada com sucesso!",
      data: { 
        id: novaObra.id,
        nome: novaObra.nome
      }
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function listarObras() {
  try {
    const session = await getServerSession(authOptions);
    const scopeFilter = session ? getObraScopeFilter(session) : { id: '__nenhum__' };

    const obras = await db.obra.findMany({
      where: scopeFilter,
      orderBy: { createdAt: 'desc' },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
        contratante: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
        aditivos: {
          where: {
            status: 'APROVADO', // Apenas aditivos aprovados
          },
          select: {
            valorAditivo: true,
            valorGlosa: true,
          }
        },
        reajustes: {
          where: {
            status: 'APLICADO', // Apenas reajustes aplicados
          },
          select: {
            valorReajuste: true,
          }
        },
      },
    });

    return obras;
  } catch (error: any) {
    console.error("🔥 ERRO AO LISTAR OBRAS:", error);
    return [];
  }
}

export async function buscarObraPorId(id: string) {
  try {
    const obra = await db.obra.findUnique({
      where: { id },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            telefone: true,
            email: true,
          }
        },
        contratante: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
            telefone: true,
            email: true,
          }
        },
        fonteRecurso: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            tipo: true,
            esfera: true,
          }
        },
        medicoes: {
          orderBy: { numero: 'desc' },
          take: 5,
        },
      },
    });

    return obra;
  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR OBRA:", error);
    return null;
  }
}

export async function atualizarObra(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR OBRA INICIADA");
    console.log("🆔 ID:", id);
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = ObraSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a obra existe
    const obraExistente = await db.obra.findUnique({
      where: { id },
    });

    if (!obraExistente) {
      return {
        success: false,
        message: "Obra não encontrada.",
      };
    }

    // Verificar se a construtora existe
    const construtora = await db.construtora.findUnique({
      where: { id: payload.construtoraId },
    });

    if (!construtora) {
      return {
        success: false,
        message: "Construtora não encontrada.",
      };
    }

    // Verificar se o contratante existe (se fornecido)
    if (payload.contratanteId) {
      const contratante = await db.contratante.findUnique({
        where: { id: payload.contratanteId },
      });

      if (!contratante) {
        return {
          success: false,
          message: "Contratante não encontrado.",
        };
      }
    }

    // Atualizar
    console.log("💾 ATUALIZANDO OBRA NO BANCO...");
    
    const obraAtualizada = await db.obra.update({
      where: { id },
      data: {
        nome: payload.nome,
        construtoraId: payload.construtoraId,
        contratanteId: payload.contratanteId || null,
        // Localização
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        // Vigência do Contrato
        prazoMeses: payload.prazoMeses || null,
        dataInicio: payload.dataInicio ? new Date(payload.dataInicio) : null,
        dataFim: payload.dataFim ? new Date(payload.dataFim) : null,
        // Execução da Obra
        prazoExecucaoMeses: payload.prazoExecucaoMeses || null,
        dataInicioExecucao: payload.dataInicioExecucao ? new Date(payload.dataInicioExecucao) : null,
        dataFimExecucao: payload.dataFimExecucao ? new Date(payload.dataFimExecucao) : null,
        // Valor
        valorContrato: payload.valorContrato,
        // Documentação Técnica
        cno: payload.cno || null,
        art: payload.art || null,
        alvara: payload.alvara || null,
        // Recurso Financeiro
        fonteRecursoId: payload.recursoFinanceiro || payload.fonteRecursoId || null,
        // Status
        status: payload.status,
      },
    });

    console.log("✅ SUCESSO! Obra atualizada:", obraAtualizada.id);
    console.log("------------------------------------------------");

    revalidatePath('/eng/contratos/contratos-obras');
    revalidatePath(`/eng/contratos/contratos-obras/obra/${id}`);
    return { 
      success: true, 
      message: "Obra atualizada com sucesso!",
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function atualizarParametrosFinanceiros(
  obraId: string,
  dados: {
    bdi?: number | null;
    encargos?: number | null;
    indiceReajuste?: string | null;
    periodicidadeMedicao?: number | null;
  }
) {
  try {
    const obra = await db.obra.update({
      where: { id: obraId },
      data: {
        bdi: dados.bdi != null ? dados.bdi : null,
        encargos: dados.encargos != null ? dados.encargos : null,
        indiceReajuste: dados.indiceReajuste ?? null,
        periodicidadeMedicao: dados.periodicidadeMedicao ?? null,
      },
    });

    revalidatePath(`/eng/plan-medicoes`);
    return { success: true, data: obra };
  } catch (error: any) {
    console.error('🔥 ERRO AO ATUALIZAR PARÂMETROS FINANCEIROS:', error);
    return { success: false, message: error?.message || 'Erro ao salvar parâmetros.' };
  }
}

export async function excluirObra(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR OBRA INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se a obra existe
    const obra = await db.obra.findUnique({
      where: { id },
      include: {
        medicoes: true,
      }
    });

    if (!obra) {
      return {
        success: false,
        message: "Obra não encontrada.",
      };
    }

    // Verificar se há medições associadas
    if (obra.medicoes.length > 0) {
      return {
        success: false,
        message: `Não é possível excluir esta obra pois ela possui ${obra.medicoes.length} medição(ões) associada(s). Exclua as medições primeiro.`,
      };
    }

    // Excluir
    await db.obra.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Obra excluída:", id);
    console.log("------------------------------------------------");

    revalidatePath('/eng/contratos/contratos-obras');
    return { 
      success: true, 
      message: "Obra excluída com sucesso!",
    };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}
