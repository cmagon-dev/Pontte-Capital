'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { validarCPFouCNPJ, limparCPFCNPJ } from "@/lib/utils/validations";

// Schema de validação para Credor
const CredorSchema = z.object({
  tipo: z.enum(['FORNECEDOR', 'EMPREITEIRO', 'FUNCIONARIO']),
  tipoPessoa: z.enum(['PF', 'PJ']),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido").max(14, "CPF/CNPJ inválido"),
  nome: z.string().min(3, "Nome muito curto"),
  nomeFantasia: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.string().email("Email inválido").optional().nullable().transform(val => val === '' ? null : val),
  telefone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  celular: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cep: z.string().optional().nullable().transform(val => val === '' ? null : val),
  endereco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  numero: z.string().optional().nullable().transform(val => val === '' ? null : val),
  complemento: z.string().optional().nullable().transform(val => val === '' ? null : val),
  bairro: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cidade: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estado: z.string().optional().nullable().transform(val => val === '' ? null : val),
  banco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  agencia: z.string().optional().nullable().transform(val => val === '' ? null : val),
  agenciaDigito: z.string().optional().nullable().transform(val => val === '' ? null : val),
  conta: z.string().optional().nullable().transform(val => val === '' ? null : val),
  contaDigito: z.string().optional().nullable().transform(val => val === '' ? null : val),
  tipoConta: z.string().optional().nullable().transform(val => val === '' ? null : val),
  chavePix: z.string().optional().nullable().transform(val => val === '' ? null : val),
  tipoChavePix: z.string().optional().nullable().transform(val => val === '' ? null : val),
  inscricaoEstadual: z.string().optional().nullable().transform(val => val === '' ? null : val),
  inscricaoMunicipal: z.string().optional().nullable().transform(val => val === '' ? null : val),
  rg: z.string().optional().nullable().transform(val => val === '' ? null : val),
  status: z.string().optional().default("ATIVO"),
  valorPendente: z.number().optional().default(0),
  observacoes: z.string().optional().nullable().transform(val => val === '' ? null : val),
}).refine((data) => {
  // Validação CPF/CNPJ
  if (data.tipoPessoa === 'PF' && data.cpfCnpj.length !== 11) {
    return false;
  }
  if (data.tipoPessoa === 'PJ' && data.cpfCnpj.length !== 14) {
    return false;
  }
  return validarCPFouCNPJ(data.cpfCnpj);
}, { message: "CPF/CNPJ inválido", path: ['cpfCnpj'] });

// Função para gerar o próximo código CRED-XXX
async function gerarProximoCodigoCredor(construtoraId: string) {
  const ultimoCredor = await db.credor.findFirst({
    where: { construtoraId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoCredor || !ultimoCredor.codigo) {
    return 'CRED-001';
  }

  // Extrair o número do código (CRED-001 -> 001)
  const match = ultimoCredor.codigo.match(/CRED-(\d+)/);
  if (!match) {
    return 'CRED-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `CRED-${String(proximoNumero).padStart(3, '0')}`;
}

/**
 * Criar novo credor
 */
export async function criarCredor(construtoraId: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - CRIAR CREDOR");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // Limpar CPF/CNPJ
    data.cpfCnpj = limparCPFCNPJ(data.cpfCnpj);

    // 1. Validação
    const validatedFields = CredorSchema.safeParse(data);

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

    // 3. Verificar duplicidade de CPF/CNPJ na construtora
    const credorExistente = await db.credor.findFirst({
      where: {
        construtoraId,
        cpfCnpj: payload.cpfCnpj
      }
    });

    if (credorExistente) {
      console.warn("⚠️ CPF/CNPJ JÁ CADASTRADO NESTA CONSTRUTORA");
      return {
        success: false,
        message: "Já existe um credor cadastrado com este CPF/CNPJ nesta construtora.",
      };
    }

    // 4. Gerar código
    console.log("🔢 GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoCredor(construtoraId);
    console.log("✅ Código gerado:", codigo);

    // 5. Salvar
    console.log("💾 SALVANDO NO BANCO...");
    const novoCredor = await db.credor.create({
      data: {
        codigo,
        construtoraId,
        tipo: payload.tipo,
        tipoPessoa: payload.tipoPessoa,
        cpfCnpj: payload.cpfCnpj,
        nome: payload.nome,
        nomeFantasia: payload.nomeFantasia || null,
        email: payload.email || null,
        telefone: payload.telefone || null,
        celular: payload.celular || null,
        cep: payload.cep || null,
        endereco: payload.endereco || null,
        numero: payload.numero || null,
        complemento: payload.complemento || null,
        bairro: payload.bairro || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        banco: payload.banco || null,
        agencia: payload.agencia || null,
        agenciaDigito: payload.agenciaDigito || null,
        conta: payload.conta || null,
        contaDigito: payload.contaDigito || null,
        tipoConta: payload.tipoConta || null,
        chavePix: payload.chavePix || null,
        tipoChavePix: payload.tipoChavePix || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        inscricaoMunicipal: payload.inscricaoMunicipal || null,
        rg: payload.rg || null,
        status: payload.status || "ATIVO",
        valorPendente: payload.valorPendente || 0,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("🚀 SUCESSO! Credor criado:", novoCredor.id);
    console.log("🚀    Código:", novoCredor.codigo);
    
    revalidatePath(`/fin/cadastros/${construtoraId}/credores`);
    revalidatePath(`/fin/cadastros/${construtoraId}`);
    return { success: true, message: "Credor cadastrado com sucesso!", credorId: novoCredor.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar credor existente
 */
export async function atualizarCredor(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - ATUALIZAR CREDOR");
    console.log("🆔 Credor ID:", id);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // Limpar CPF/CNPJ
    data.cpfCnpj = limparCPFCNPJ(data.cpfCnpj);

    // 1. Validação
    const validatedFields = CredorSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados. Verifique os campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // 2. Verificar se o credor existe
    const credorExistente = await db.credor.findUnique({
      where: { id },
    });

    if (!credorExistente) {
      return {
        success: false,
        message: "Credor não encontrado.",
      };
    }

    // 3. Verificar duplicidade de CPF/CNPJ (exceto próprio registro)
    if (payload.cpfCnpj !== credorExistente.cpfCnpj) {
      const credorDuplicado = await db.credor.findFirst({
        where: {
          construtoraId: credorExistente.construtoraId,
          cpfCnpj: payload.cpfCnpj,
          id: { not: id }
        }
      });

      if (credorDuplicado) {
        return {
          success: false,
          message: "Já existe outro credor cadastrado com este CPF/CNPJ nesta construtora.",
        };
      }
    }

    // 4. Atualizar
    const credorAtualizado = await db.credor.update({
      where: { id },
      data: {
        tipo: payload.tipo,
        tipoPessoa: payload.tipoPessoa,
        cpfCnpj: payload.cpfCnpj,
        nome: payload.nome,
        nomeFantasia: payload.nomeFantasia || null,
        email: payload.email || null,
        telefone: payload.telefone || null,
        celular: payload.celular || null,
        cep: payload.cep || null,
        endereco: payload.endereco || null,
        numero: payload.numero || null,
        complemento: payload.complemento || null,
        bairro: payload.bairro || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        banco: payload.banco || null,
        agencia: payload.agencia || null,
        agenciaDigito: payload.agenciaDigito || null,
        conta: payload.conta || null,
        contaDigito: payload.contaDigito || null,
        tipoConta: payload.tipoConta || null,
        chavePix: payload.chavePix || null,
        tipoChavePix: payload.tipoChavePix || null,
        inscricaoEstadual: payload.inscricaoEstadual || null,
        inscricaoMunicipal: payload.inscricaoMunicipal || null,
        rg: payload.rg || null,
        status: payload.status || "ATIVO",
        valorPendente: payload.valorPendente || 0,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Credor atualizado:", credorAtualizado.id);
    
    revalidatePath(`/fin/cadastros/${credorExistente.construtoraId}/credores`);
    revalidatePath(`/fin/cadastros/${credorExistente.construtoraId}/credores/${id}`);
    revalidatePath(`/fin/cadastros/${credorExistente.construtoraId}`);
    return { success: true, message: "Credor atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir credor
 */
export async function excluirCredor(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION - EXCLUIR CREDOR");
    console.log("🆔 Credor ID:", id);

    // 1. Verificar se o credor existe
    const credor = await db.credor.findUnique({
      where: { id },
    });

    if (!credor) {
      return {
        success: false,
        message: "Credor não encontrado.",
      };
    }

    // TODO: Verificar se há lançamentos/operações vinculadas ao credor
    // Por enquanto, permitir exclusão

    // 2. Excluir
    await db.credor.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Credor excluído:", id);
    
    revalidatePath(`/fin/cadastros/${credor.construtoraId}/credores`);
    revalidatePath(`/fin/cadastros/${credor.construtoraId}`);
    return { success: true, message: "Credor excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Buscar credores de uma construtora
 */
export async function buscarCredores(construtoraId: string, filtros?: {
  tipo?: string;
  status?: string;
  busca?: string;
}) {
  try {
    console.log("🔍 BUSCANDO CREDORES");
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
        { cpfCnpj: { contains: filtros.busca } },
        { codigo: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }

    const credores = await db.credor.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ATIVO primeiro
        { nome: 'asc' },
      ],
    });

    console.log(`✅ ${credores.length} credores encontrados`);
    return credores;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CREDORES:", error);
    throw error;
  }
}

/**
 * Buscar credor por ID
 */
export async function buscarCredorPorId(id: string) {
  try {
    const credor = await db.credor.findUnique({
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

    return credor;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CREDOR:", error);
    throw error;
  }
}
