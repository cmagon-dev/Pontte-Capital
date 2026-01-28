'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Schema de validação para Fiador
const FiadorSchema = z.object({
  tipo: z.enum(['PF', 'PJ']),
  nome: z.string().min(3, "Nome/Razão Social muito curto"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"), // CPF tem 11 dígitos, CNPJ tem 14
  // Campos opcionais - converte string vazia para null
  rg: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estadoCivil: z.string().optional().nullable().transform(val => val === '' ? null : val),
  dataNascimento: z.string().optional().nullable().transform(val => val === '' ? null : val),
  nomeFantasia: z.string().optional().nullable().transform(val => val === '' ? null : val),
  inscricaoEstadual: z.string().optional().nullable().transform(val => val === '' ? null : val),
  endereco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cidade: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estado: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cep: z.string().optional().nullable().transform(val => val === '' ? null : val),
  telefone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.string().optional().nullable().transform(val => val === '' ? null : val).refine((val) => {
    if (!val || val === '' || val === null) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  }, {
    message: "Email inválido"
  }),
  aprovadorFinanceiro: z.boolean().default(false),
});

// Função para gerar o próximo código AV-XXX
async function gerarProximoCodigoFiador() {
  const ultimoFiador = await db.fiador.findFirst({
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoFiador || !ultimoFiador.codigo) {
    return 'AV-001';
  }

  const match = ultimoFiador.codigo.match(/AV-(\d+)/);
  if (!match) {
    return 'AV-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `AV-${String(proximoNumero).padStart(3, '0')}`;
}

export async function criarFiador(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 1. SERVER ACTION CRIAR FIADOR INICIADA");
    console.log("📦 DADOS RECEBIDOS DO FRONT:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = FiadorSchema.safeParse(data);

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

    // 2. Verificar duplicidade de CPF/CNPJ
    console.log("🔍 3. VERIFICANDO DUPLICIDADE DE CPF/CNPJ:", payload.cpfCnpj);
    const existente = await db.fiador.findUnique({
      where: { cpfCnpj: payload.cpfCnpj }
    });

    if (existente) {
      console.warn("⚠️ 4. CPF/CNPJ JÁ EXISTE NO BANCO");
      return {
        success: false,
        message: `Já existe um fiador cadastrado com este ${payload.tipo === 'PF' ? 'CPF' : 'CNPJ'}.`,
      };
    }

    // 3. Gerar código
    console.log("🔢 4. GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoFiador();
    console.log("✅ Código gerado:", codigo);

    // 4. Salvar
    console.log("💾 5. TENTANDO SALVAR NO BANCO...");
    
    const novoFiador = await db.fiador.create({
      data: {
        codigo,
        tipo: payload.tipo,
        nome: payload.nome,
        cpfCnpj: payload.cpfCnpj,
        rg: payload.rg || null,
        estadoCivil: payload.estadoCivil || null,
        dataNascimento: payload.dataNascimento ? new Date(payload.dataNascimento) : null,
        nomeFantasia: payload.nomeFantasia || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        telefone: payload.telefone || null,
        email: payload.email || null,
        aprovadorFinanceiro: payload.aprovadorFinanceiro || false,
      },
    });

    console.log("🚀 6. SUCESSO! ID Criado:", novoFiador.id);
    console.log("🚀    Código:", novoFiador.codigo);
    
    revalidatePath("/cadastros/fiadores");
    return { success: true, message: "Fiador cadastrado com sucesso!" };

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

export async function atualizarFiador(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR FIADOR INICIADA");
    console.log("🆔 ID:", id);
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    const validatedFields = FiadorSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique o terminal do servidor.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o fiador existe
    const existente = await db.fiador.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Fiador não encontrado.",
      };
    }

    // Verificar duplicidade de CPF/CNPJ (exceto se for o mesmo registro)
    if (payload.cpfCnpj !== existente.cpfCnpj) {
      const cpfCnpjExistente = await db.fiador.findUnique({
        where: { cpfCnpj: payload.cpfCnpj },
      });

      if (cpfCnpjExistente) {
        return {
          success: false,
          message: `Já existe outro fiador cadastrado com este ${payload.tipo === 'PF' ? 'CPF' : 'CNPJ'}.`,
        };
      }
    }

    // Atualizar
    const fiadorAtualizado = await db.fiador.update({
      where: { id },
      data: {
        tipo: payload.tipo,
        nome: payload.nome,
        cpfCnpj: payload.cpfCnpj,
        rg: payload.rg || null,
        estadoCivil: payload.estadoCivil || null,
        dataNascimento: payload.dataNascimento ? new Date(payload.dataNascimento) : null,
        nomeFantasia: payload.nomeFantasia || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        telefone: payload.telefone || null,
        email: payload.email || null,
        aprovadorFinanceiro: payload.aprovadorFinanceiro || false,
      },
    });

    console.log("✅ SUCESSO! Fiador atualizado:", fiadorAtualizado.id);
    
    revalidatePath("/cadastros/fiadores");
    revalidatePath(`/cadastros/fiadores/${id}/cadastro`);
    return { success: true, message: "Fiador atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}

export async function excluirFiador(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR FIADOR INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se o fiador existe
    const existente = await db.fiador.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Fiador não encontrado.",
      };
    }

    // Excluir
    await db.fiador.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Fiador excluído:", id);
    
    revalidatePath("/cadastros/fiadores");
    return { success: true, message: "Fiador excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}
