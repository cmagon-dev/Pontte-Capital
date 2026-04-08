'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const UsuarioSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().or(z.literal('')),
  perfil: z.enum(["ADMIN", "ENGENHARIA", "FINANCEIRO", "APROVADOR"]),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
});

export async function listarUsuarios() {
  try {
    const usuarios = await db.usuario.findMany({
      orderBy: { nome: 'asc' },
    });
    return { sucesso: true, dados: usuarios };
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return { sucesso: false, erro: "Erro ao carregar usuários" };
  }
}

export async function buscarUsuarioPorId(id: string) {
  try {
    const usuario = await db.usuario.findUnique({
      where: { id },
    });
    if (!usuario) {
      return { sucesso: false, erro: "Usuário não encontrado" };
    }
    return { sucesso: true, dados: usuario };
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return { sucesso: false, erro: "Erro ao buscar usuário" };
  }
}

export async function criarUsuario(data: unknown) {
  try {
    const parsed = UsuarioSchema.parse(data);

    if (!parsed.senha || parsed.senha === '') {
      return { sucesso: false, erro: "Senha é obrigatória para novos usuários" };
    }

    const existente = await db.usuario.findUnique({ where: { email: parsed.email } });
    if (existente) {
      return { sucesso: false, erro: "Já existe um usuário com este e-mail" };
    }

    const usuario = await db.usuario.create({
      data: {
        nome: parsed.nome,
        email: parsed.email,
        senha: parsed.senha,
        perfil: parsed.perfil,
        status: parsed.status,
      },
    });

    revalidatePath('/admin/usuarios');
    return { sucesso: true, dados: usuario };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error("Erro ao criar usuário:", error);
    return { sucesso: false, erro: "Erro ao criar usuário" };
  }
}

export async function atualizarUsuario(id: string, data: unknown) {
  try {
    const parsed = UsuarioSchema.parse(data);

    const existente = await db.usuario.findUnique({ where: { id } });
    if (!existente) {
      return { sucesso: false, erro: "Usuário não encontrado" };
    }

    const emailConflito = await db.usuario.findFirst({
      where: { email: parsed.email, NOT: { id } },
    });
    if (emailConflito) {
      return { sucesso: false, erro: "Este e-mail já está em uso por outro usuário" };
    }

    const dadosAtualizacao: {
      nome: string;
      email: string;
      perfil: "ADMIN" | "ENGENHARIA" | "FINANCEIRO" | "APROVADOR";
      status: "ATIVO" | "INATIVO";
      senha?: string;
    } = {
      nome: parsed.nome,
      email: parsed.email,
      perfil: parsed.perfil,
      status: parsed.status,
    };

    if (parsed.senha && parsed.senha !== '') {
      dadosAtualizacao.senha = parsed.senha;
    }

    const usuario = await db.usuario.update({
      where: { id },
      data: dadosAtualizacao,
    });

    revalidatePath('/admin/usuarios');
    revalidatePath(`/admin/usuarios/${id}/editar`);
    return { sucesso: true, dados: usuario };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error("Erro ao atualizar usuário:", error);
    return { sucesso: false, erro: "Erro ao atualizar usuário" };
  }
}

export async function excluirUsuario(id: string) {
  try {
    const existente = await db.usuario.findUnique({ where: { id } });
    if (!existente) {
      return { sucesso: false, erro: "Usuário não encontrado" };
    }

    await db.usuario.delete({ where: { id } });

    revalidatePath('/admin/usuarios');
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return { sucesso: false, erro: "Erro ao excluir usuário" };
  }
}
