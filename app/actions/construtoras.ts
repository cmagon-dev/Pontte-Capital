'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Schema flexível para DEBUG (Vamos apertar depois que funcionar)
const ConstrutoraSchema = z.object({
  razaoSocial: z.string().min(3, "Razão Social muito curta"),
  cnpj: z.string().min(14, "CNPJ inválido"), // Já vem limpo do front
  // Campos opcionais - converte string vazia para null
  nomeFantasia: z.string().optional().nullable().transform(val => val === '' ? null : val),
  inscricaoEstadual: z.string().optional().nullable().transform(val => val === '' ? null : val),
  endereco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cidade: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estado: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cep: z.string().optional().nullable().transform(val => val === '' ? null : val),
  telefone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.string().optional().nullable().transform(val => val === '' ? null : val),
  // Campos JSON - aceita qualquer valor
  socios: z.any().optional(),
  contaBancaria: z.any().optional(),
});

// Função para gerar o próximo código CD-XXX
async function gerarProximoCodigoConstrutor() {
  const ultimaConstrutora = await db.construtora.findFirst({
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimaConstrutora || !ultimaConstrutora.codigo) {
    return 'CD-001';
  }

  // Extrair o número do código (CD-001 -> 001)
  const match = ultimaConstrutora.codigo.match(/CD-(\d+)/);
  if (!match) {
    return 'CD-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `CD-${String(proximoNumero).padStart(3, '0')}`;
}

export async function criarConstrutora(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 1. SERVER ACTION INICIADA");
    console.log("📦 DADOS RECEBIDOS DO FRONT:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = ConstrutoraSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ 2. ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    console.log("✅ 2. VALIDAÇÃO ZOD: SUCESSO");
    const payload = validatedFields.data;

    // 2. Verificar duplicidade
    console.log("🔍 3. VERIFICANDO DUPLICIDADE DE CNPJ:", payload.cnpj);
    const existente = await db.construtora.findUnique({
      where: { cnpj: payload.cnpj }
    });

    if (existente) {
      console.warn("⚠️ 4. CNPJ JÁ EXISTE NO BANCO");
      return {
        success: false,
        message: "Já existe uma construtora cadastrada com este CNPJ.",
      };
    }

    // 3. Gerar código
    console.log("🔢 4. GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoConstrutor();
    console.log("✅ Código gerado:", codigo);

    // 4. Salvar
    console.log("💾 5. TENTANDO SALVAR NO BANCO...");
    
    // Preparar dados para o Prisma - converter strings vazias para null e tratar JSON
    // Para campos JSON, usar Prisma.JsonNull quando não houver valor (em vez de undefined)
    const sociosValue = payload.socios && Array.isArray(payload.socios) && payload.socios.length > 0 
      ? payload.socios 
      : Prisma.JsonNull;
    
    const contaBancariaValue = payload.contaBancaria && 
      typeof payload.contaBancaria === 'object' && 
      Object.keys(payload.contaBancaria).length > 0 &&
      !Object.values(payload.contaBancaria).every(v => v === '' || v === null)
      ? payload.contaBancaria 
      : Prisma.JsonNull;
    
    const novaConstrutora = await db.construtora.create({
      data: {
        codigo,
        razaoSocial: payload.razaoSocial,
        cnpj: payload.cnpj,
        nomeFantasia: payload.nomeFantasia || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        telefone: payload.telefone || null,
        email: payload.email || null,
        socios: sociosValue,
        contaBancaria: contaBancariaValue,
      },
    });

    console.log("🚀 7. SUCESSO! ID Criado:", novaConstrutora.id);
    console.log("🚀    Código:", novaConstrutora.codigo);
    
    revalidatePath("/cadastros/construtoras");
    return { success: true, message: "Construtora cadastrada com sucesso!" };

  } catch (error: any) {
    console.error("🔥 7. ERRO CRÍTICO:", error);
    console.error("🔥 Tipo do erro:", typeof error);
    console.error("🔥 Mensagem:", error?.message);
    console.error("🔥 Stack:", error?.stack);
    
    // Melhorar mensagem de erro para ajudar no debug
    const errorMessage = error?.message || "Erro interno ao salvar no banco de dados.";
    return {
      success: false,
      message: `Erro ao salvar: ${errorMessage}`,
    };
  }
}

export async function atualizarConstrutora(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR INICIADA");
    console.log("🆔 ID:", id);
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = ConstrutoraSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a construtora existe
    const existente = await db.construtora.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Construtora não encontrada.",
      };
    }

    // Verificar duplicidade de CNPJ (exceto se for o mesmo registro)
    if (payload.cnpj !== existente.cnpj) {
      const cnpjExistente = await db.construtora.findUnique({
        where: { cnpj: payload.cnpj },
      });

      if (cnpjExistente) {
        return {
          success: false,
          message: "Já existe outra construtora cadastrada com este CNPJ.",
        };
      }
    }

    // Preparar dados JSON
    const sociosValue = payload.socios && Array.isArray(payload.socios) && payload.socios.length > 0 
      ? payload.socios 
      : Prisma.JsonNull;
    
    const contaBancariaValue = payload.contaBancaria && 
      typeof payload.contaBancaria === 'object' && 
      Object.keys(payload.contaBancaria).length > 0 &&
      !Object.values(payload.contaBancaria).every(v => v === '' || v === null)
      ? payload.contaBancaria 
      : Prisma.JsonNull;

    // Atualizar
    const construtoraAtualizada = await db.construtora.update({
      where: { id },
      data: {
        razaoSocial: payload.razaoSocial,
        cnpj: payload.cnpj,
        nomeFantasia: payload.nomeFantasia || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        telefone: payload.telefone || null,
        email: payload.email || null,
        socios: sociosValue,
        contaBancaria: contaBancariaValue,
      },
    });

    console.log("✅ SUCESSO! Construtora atualizada:", construtoraAtualizada.id);
    
    revalidatePath("/cadastros/construtoras");
    revalidatePath(`/cadastros/construtoras/${id}/cadastro`);
    return { success: true, message: "Construtora atualizada com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}

export async function excluirConstrutora(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se a construtora existe
    const existente = await db.construtora.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            obras: true,
            operacoes: true,
          },
        },
      },
    });

    if (!existente) {
      return {
        success: false,
        message: "Construtora não encontrada.",
      };
    }

    // Verificar se há obras ou operações vinculadas
    if (existente._count.obras > 0) {
      return {
        success: false,
        message: `Não é possível excluir. Existem ${existente._count.obras} obra(s) vinculada(s) a esta construtora.`,
      };
    }

    if (existente._count.operacoes > 0) {
      return {
        success: false,
        message: `Não é possível excluir. Existem ${existente._count.operacoes} operação(ões) vinculada(s) a esta construtora.`,
      };
    }

    // Excluir
    await db.construtora.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Construtora excluída:", id);
    
    revalidatePath("/cadastros/construtoras");
    return { success: true, message: "Construtora excluída com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}
