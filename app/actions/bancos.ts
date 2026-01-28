'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Schema de validação para Conta Bancária
const ContaBancariaSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  banco: z.string().length(3, "Código do banco deve ter 3 dígitos"),
  nomeBanco: z.string().min(3, "Nome do banco muito curto"),
  agencia: z.string().min(1, "Agência obrigatória"),
  agenciaDigito: z.string().optional().nullable().transform(val => val === '' ? null : val),
  conta: z.string().min(1, "Conta obrigatória"),
  contaDigito: z.string().min(1, "Dígito da conta obrigatório"),
  tipoConta: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO']),
  chavePix: z.string().optional().nullable().transform(val => val === '' ? null : val),
  tipoChavePix: z.string().optional().nullable().transform(val => val === '' ? null : val),
  chavesPix: z.any().optional().nullable(),
  saldoAtual: z.number().optional().default(0),
  saldoDisponivel: z.number().optional().default(0),
  status: z.string().optional().default("ATIVA"),
  permiteSaque: z.boolean().optional().default(true),
  permiteDeposito: z.boolean().optional().default(true),
  permiteTransferencia: z.boolean().optional().default(true),
  observacoes: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

// Função para gerar o próximo código BANCO-XXX
async function gerarProximoCodigoBanco(construtoraId: string) {
  const ultimoBanco = await db.contaBancaria.findFirst({
    where: { construtoraId },
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimoBanco || !ultimoBanco.codigo) {
    return 'BANCO-001';
  }

  const match = ultimoBanco.codigo.match(/BANCO-(\d+)/);
  if (!match) {
    return 'BANCO-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `BANCO-${String(proximoNumero).padStart(3, '0')}`;
}

/**
 * Criar nova conta bancária
 */
export async function criarContaBancaria(construtoraId: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - CRIAR CONTA BANCÁRIA");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = ContaBancariaSchema.safeParse(data);

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

    // 3. Verificar duplicidade de conta (mesmo banco, agência e conta)
    const contaExistente = await db.contaBancaria.findFirst({
      where: {
        construtoraId,
        banco: payload.banco,
        agencia: payload.agencia,
        conta: payload.conta,
      }
    });

    if (contaExistente) {
      console.warn("⚠️ CONTA JÁ CADASTRADA");
      return {
        success: false,
        message: "Já existe uma conta cadastrada com estes dados (banco, agência e conta).",
      };
    }

    // 4. Gerar código
    console.log("🔢 GERANDO CÓDIGO...");
    const codigo = await gerarProximoCodigoBanco(construtoraId);
    console.log("✅ Código gerado:", codigo);

    // 5. Preparar chaves PIX
    const chavesPix = payload.chavesPix || (payload.chavePix ? [{ chave: payload.chavePix, tipo: payload.tipoChavePix }] : null);

    // 6. Salvar
    console.log("💾 SALVANDO NO BANCO...");
    const novaConta = await db.contaBancaria.create({
      data: {
        codigo,
        construtoraId,
        nome: payload.nome,
        banco: payload.banco,
        nomeBanco: payload.nomeBanco,
        agencia: payload.agencia,
        agenciaDigito: payload.agenciaDigito || null,
        conta: payload.conta,
        contaDigito: payload.contaDigito,
        tipoConta: payload.tipoConta,
        chavePix: payload.chavePix || null,
        tipoChavePix: payload.tipoChavePix || null,
        chavesPix: chavesPix ? chavesPix : Prisma.JsonNull,
        saldoAtual: payload.saldoAtual || 0,
        saldoDisponivel: payload.saldoDisponivel || 0,
        status: payload.status || "ATIVA",
        permiteSaque: payload.permiteSaque ?? true,
        permiteDeposito: payload.permiteDeposito ?? true,
        permiteTransferencia: payload.permiteTransferencia ?? true,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("🚀 SUCESSO! Conta criada:", novaConta.id);
    console.log("🚀    Código:", novaConta.codigo);
    
    revalidatePath(`/fin/cadastros/${construtoraId}/bancos`);
    revalidatePath(`/fin/cadastros/${construtoraId}`);
    return { success: true, message: "Conta bancária cadastrada com sucesso!", contaId: novaConta.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar conta bancária existente
 */
export async function atualizarContaBancaria(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION - ATUALIZAR CONTA BANCÁRIA");
    console.log("🆔 Conta ID:", id);
    console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));

    // 1. Validação
    const validatedFields = ContaBancariaSchema.safeParse(data);

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
    const contaExistente = await db.contaBancaria.findUnique({
      where: { id },
    });

    if (!contaExistente) {
      return {
        success: false,
        message: "Conta bancária não encontrada.",
      };
    }

    // 3. Verificar duplicidade (exceto próprio registro)
    const contaDuplicada = await db.contaBancaria.findFirst({
      where: {
        construtoraId: contaExistente.construtoraId,
        banco: payload.banco,
        agencia: payload.agencia,
        conta: payload.conta,
        id: { not: id }
      }
    });

    if (contaDuplicada) {
      return {
        success: false,
        message: "Já existe outra conta cadastrada com estes dados (banco, agência e conta).",
      };
    }

    // 4. Preparar chaves PIX
    const chavesPix = payload.chavesPix || (payload.chavePix ? [{ chave: payload.chavePix, tipo: payload.tipoChavePix }] : null);

    // 5. Atualizar
    const contaAtualizada = await db.contaBancaria.update({
      where: { id },
      data: {
        nome: payload.nome,
        banco: payload.banco,
        nomeBanco: payload.nomeBanco,
        agencia: payload.agencia,
        agenciaDigito: payload.agenciaDigito || null,
        conta: payload.conta,
        contaDigito: payload.contaDigito,
        tipoConta: payload.tipoConta,
        chavePix: payload.chavePix || null,
        tipoChavePix: payload.tipoChavePix || null,
        chavesPix: chavesPix ? chavesPix : Prisma.JsonNull,
        status: payload.status || "ATIVA",
        permiteSaque: payload.permiteSaque ?? true,
        permiteDeposito: payload.permiteDeposito ?? true,
        permiteTransferencia: payload.permiteTransferencia ?? true,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Conta atualizada:", contaAtualizada.id);
    
    revalidatePath(`/fin/cadastros/${contaExistente.construtoraId}/bancos`);
    revalidatePath(`/fin/cadastros/${contaExistente.construtoraId}/bancos/${id}`);
    revalidatePath(`/fin/cadastros/${contaExistente.construtoraId}`);
    return { success: true, message: "Conta bancária atualizada com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Atualizar saldo da conta
 */
export async function atualizarSaldoConta(id: string, saldoAtual: number, saldoDisponivel?: number) {
  try {
    const conta = await db.contaBancaria.update({
      where: { id },
      data: {
        saldoAtual,
        saldoDisponivel: saldoDisponivel ?? saldoAtual,
        dataAtualizacaoSaldo: new Date(),
      },
    });

    revalidatePath(`/fin/cadastros/${conta.construtoraId}/bancos`);
    return { success: true, message: "Saldo atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO AO ATUALIZAR SALDO:", error);
    return {
      success: false,
      message: `Erro ao atualizar saldo: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Excluir conta bancária
 */
export async function excluirContaBancaria(id: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION - EXCLUIR CONTA BANCÁRIA");
    console.log("🆔 Conta ID:", id);

    // 1. Verificar se a conta existe
    const conta = await db.contaBancaria.findUnique({
      where: { id },
    });

    if (!conta) {
      return {
        success: false,
        message: "Conta bancária não encontrada.",
      };
    }

    // TODO: Verificar se há movimentações/lançamentos vinculados à conta
    // Por enquanto, permitir exclusão

    // 2. Excluir
    await db.contaBancaria.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Conta excluída:", id);
    
    revalidatePath(`/fin/cadastros/${conta.construtoraId}/bancos`);
    revalidatePath(`/fin/cadastros/${conta.construtoraId}`);
    return { success: true, message: "Conta bancária excluída com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

/**
 * Buscar contas bancárias de uma construtora
 */
export async function buscarContasBancarias(construtoraId: string, filtros?: {
  status?: string;
  tipoConta?: string;
  busca?: string;
}) {
  try {
    console.log("🔍 BUSCANDO CONTAS BANCÁRIAS");
    console.log("🏢 Construtora ID:", construtoraId);
    console.log("🔧 Filtros:", filtros);

    const where: any = {
      construtoraId,
    };

    // Aplicar filtros
    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.tipoConta) {
      where.tipoConta = filtros.tipoConta;
    }

    if (filtros?.busca) {
      where.OR = [
        { nome: { contains: filtros.busca, mode: 'insensitive' } },
        { banco: { contains: filtros.busca } },
        { nomeBanco: { contains: filtros.busca, mode: 'insensitive' } },
        { codigo: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }

    const contas = await db.contaBancaria.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // ATIVA primeiro
        { nome: 'asc' },
      ],
    });

    console.log(`✅ ${contas.length} contas encontradas`);
    return contas;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CONTAS:", error);
    throw error;
  }
}

/**
 * Buscar conta bancária por ID
 */
export async function buscarContaBancariaPorId(id: string) {
  try {
    const conta = await db.contaBancaria.findUnique({
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

    return conta;

  } catch (error: any) {
    console.error("🔥 ERRO AO BUSCAR CONTA:", error);
    throw error;
  }
}
