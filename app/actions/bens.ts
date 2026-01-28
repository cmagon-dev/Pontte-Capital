'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Schema de validação para Bem
const BemSchema = z.object({
  fiadorId: z.string().min(1, "ID do fiador obrigatório"),
  tipo: z.enum(['Imóvel', 'Veículo', 'Investimentos', 'Outros']),
  descricao: z.string().min(3, "Descrição muito curta"),
  valor: z.string().min(1, "Valor obrigatório").transform((val) => {
    // Converter string formatada para número
    const numValue = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(numValue) ? 0 : numValue;
  }),
  rendaMensal: z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    const numValue = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(numValue) ? null : numValue;
  }),
  // Campos opcionais
  endereco: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cidade: z.string().optional().nullable().transform(val => val === '' ? null : val),
  estado: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cep: z.string().optional().nullable().transform(val => val === '' ? null : val),
  matricula: z.string().optional().nullable().transform(val => val === '' ? null : val),
  cartorio: z.string().optional().nullable().transform(val => val === '' ? null : val),
  status: z.enum(['Livre', 'Penhorado', 'Hipotecado']).default('Livre'),
  observacoes: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

export async function criarBem(data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR BEM INICIADA");
    console.log("📦 DADOS RECEBIDOS:", JSON.stringify(data, null, 2));

    // Validação
    const validatedFields = BemSchema.safeParse(data);

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
    const fiador = await db.fiador.findUnique({
      where: { id: payload.fiadorId },
    });

    if (!fiador) {
      return {
        success: false,
        message: "Fiador não encontrado.",
      };
    }

    // Salvar
    console.log("💾 SALVANDO BEM NO BANCO...");
    
    const novoBem = await db.bem.create({
      data: {
        fiadorId: payload.fiadorId,
        tipo: payload.tipo,
        descricao: payload.descricao,
        valor: payload.valor,
        rendaMensal: payload.rendaMensal || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        matricula: payload.matricula || null,
        cartorio: payload.cartorio || null,
        status: payload.status || 'Livre',
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Bem criado:", novoBem.id);
    
    revalidatePath(`/cadastros/fiadores/${payload.fiadorId}/documentos`);
    return { success: true, message: "Bem cadastrado com sucesso!", bemId: novoBem.id };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function atualizarBem(id: string, data: any) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION ATUALIZAR BEM INICIADA");
    console.log("🆔 ID:", id);

    const validatedFields = BemSchema.safeParse(data);

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO ZOD:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se o bem existe
    const existente = await db.bem.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Bem não encontrado.",
      };
    }

    // Atualizar
    const bemAtualizado = await db.bem.update({
      where: { id },
      data: {
        tipo: payload.tipo,
        descricao: payload.descricao,
        valor: payload.valor,
        rendaMensal: payload.rendaMensal || null,
        endereco: payload.endereco || null,
        cidade: payload.cidade || null,
        estado: payload.estado || null,
        cep: payload.cep || null,
        matricula: payload.matricula || null,
        cartorio: payload.cartorio || null,
        status: payload.status || 'Livre',
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Bem atualizado:", bemAtualizado.id);
    
    revalidatePath(`/cadastros/fiadores/${payload.fiadorId}/documentos`);
    return { success: true, message: "Bem atualizado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO ATUALIZAR:", error);
    return {
      success: false,
      message: `Erro ao atualizar: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}

export async function excluirBem(id: string, fiadorId: string) {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR BEM INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se o bem existe
    const existente = await db.bem.findUnique({
      where: { id },
    });

    if (!existente) {
      return {
        success: false,
        message: "Bem não encontrado.",
      };
    }

    // Excluir (documentos vinculados serão excluídos em cascade se configurado)
    await db.bem.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Bem excluído:", id);
    
    revalidatePath(`/cadastros/fiadores/${fiadorId}/documentos`);
    return { success: true, message: "Bem excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor."}`,
    };
  }
}
