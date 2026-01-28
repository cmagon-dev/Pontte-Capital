'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Schema flexível para DEBUG (Vamos apertar depois que funcionar)
const ContratanteSchema = z.object({
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

// Função para gerar o próximo código SC-XXX
async function gerarProximoCodigoContratante() {
  const ultimoContratante = await db.contratante.findFirst({
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoContratante || !ultimoContratante.codigo) {
    return 'SC-001';
  }

  const match = ultimoContratante.codigo.match(/SC-(\d+)/);
  if (!match) {
    return 'SC-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `SC-${String(proximoNumero).padStart(3, '0')}`;
}

export async function criarContratante(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 1. SERVER ACTION CRIAR CONTRATANTE INICIADA");
    console.log("📦 DADOS RECEBIDOS DO FRONT:", JSON.stringify(data, null, 2));

    // Remover campos extras que não estão no schema (como 'complemento')
    const { complemento, ...dataToValidate } = data;

    // 1. Validação
    const validatedFields = ContratanteSchema.safeParse(dataToValidate);

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
    const existente = await db.contratante.findUnique({
      where: { cnpj: payload.cnpj }
    });

    if (existente) {
      console.warn("⚠️ 4. CNPJ JÁ EXISTE NO BANCO");
      return {
        success: false,
        message: "Já existe um contratante cadastrado com este CNPJ.",
      };
    }

    // 3. Salvar
    console.log("💾 5. TENTANDO SALVAR NO BANCO...");
    
    // Gerar código
    console.log("🔢 4. GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoContratante();
    console.log("✅ Código gerado:", codigo);

    // Preparar dados para o Prisma - converter strings vazias para null e tratar JSON
    const sociosValue = payload.socios && Array.isArray(payload.socios) && payload.socios.length > 0 
      ? payload.socios 
      : Prisma.JsonNull;
    
    const contaBancariaValue = payload.contaBancaria && 
      typeof payload.contaBancaria === 'object' && 
      Object.keys(payload.contaBancaria).length > 0 &&
      !Object.values(payload.contaBancaria).every(v => v === '' || v === null)
      ? payload.contaBancaria 
      : Prisma.JsonNull;
    
    const novoContratante = await db.contratante.create({
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

    console.log("🚀 6. SUCESSO! ID Criado:", novoContratante.id);
    console.log("🚀    Código:", novoContratante.codigo);
    
    revalidatePath("/cadastros/contratantes");
    return { success: true, message: "Contratante cadastrado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 7. ERRO CRÍTICO:", error);
    console.error("🔥 Tipo do erro:", typeof error);
    console.error("🔥 Mensagem:", error?.message);
    console.error("🔥 Stack:", error?.stack);
    
    const errorMessage = error?.message || "Erro interno ao salvar no banco de dados.";
    return {
      success: false,
      message: `Erro ao salvar: ${errorMessage}`,
    };
  }
}

export async function atualizarContratante(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR CONTRATANTE INICIADA");
    console.log("🆔 ID:", id);
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    const { complemento, ...dataToValidate } = data;

    const validatedFields = ContratanteSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o contratante existe
    const existente = await db.contratante.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Contratante não encontrado.",
      };
    }

    // Verificar duplicidade de CNPJ (exceto se for o mesmo registro)
    if (payload.cnpj !== existente.cnpj) {
      const cnpjExistente = await db.contratante.findUnique({
        where: { cnpj: payload.cnpj },
      });

      if (cnpjExistente) {
        return {
          success: false,
          message: "Já existe outro contratante cadastrado com este CNPJ.",
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
    const contratanteAtualizado = await db.contratante.update({
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

    console.log("✅ SUCESSO! Contratante atualizado:", contratanteAtualizado.id);
    
    revalidatePath("/cadastros/contratantes");
    revalidatePath(`/cadastros/contratantes/${id}/cadastro`);
    return { success: true, message: "Contratante atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}

export async function excluirContratante(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR CONTRATANTE INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se o contratante existe
    const existente = await db.contratante.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Contratante não encontrado.",
      };
    }

    // Excluir
    await db.contratante.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Contratante excluído:", id);
    
    revalidatePath("/cadastros/contratantes");
    return { success: true, message: "Contratante excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}
