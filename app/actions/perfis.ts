'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const PerfilSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  tipoEscopo: z.enum(['GLOBAL', 'FUNDO', 'CONSTRUTORA', 'FIADOR']).default('GLOBAL'),
  permissoes: z.array(z.string()).default([]),
});

function isTenantAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session?.user) return false;
  const permissoes = session.user.permissoes ?? [];
  return (
    session.user.tipoEscopo !== 'GLOBAL' &&
    (permissoes.includes('admin:tenant:perfis:gerenciar') || permissoes.includes('admin:perfis:gerenciar'))
  );
}

export async function listarPerfis() {
  try {
    const session = await getServerSession(authOptions);
    const where =
      session?.user?.tipoEscopo && session.user.tipoEscopo !== 'GLOBAL'
        ? { tipoEscopo: session.user.tipoEscopo }
        : {};

    const perfis = await db.perfil.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { usuarios: true, permissoes: true } },
      },
    });
    return { sucesso: true, dados: perfis };
  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    return { sucesso: false, erro: 'Erro ao carregar perfis' };
  }
}

export async function buscarPerfilPorId(id: string) {
  try {
    const perfil = await db.perfil.findUnique({
      where: { id },
      include: {
        permissoes: { include: { permissao: true } },
        _count: { select: { usuarios: true } },
      },
    });
    if (!perfil) return { sucesso: false, erro: 'Perfil não encontrado' };
    return { sucesso: true, dados: perfil };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return { sucesso: false, erro: 'Erro ao buscar perfil' };
  }
}

export async function listarPermissoes() {
  try {
    const permissoes = await db.permissao.findMany({
      orderBy: [{ categoria: 'asc' }, { chave: 'asc' }],
    });
    return { sucesso: true, dados: permissoes };
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    return { sucesso: false, erro: 'Erro ao carregar permissões' };
  }
}

export async function criarPerfil(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { sucesso: false, erro: 'Não autenticado' };

    const parsed = PerfilSchema.parse(data);

    const existente = await db.perfil.findUnique({ where: { nome: parsed.nome } });
    if (existente) {
      return { sucesso: false, erro: 'Já existe um perfil com este nome' };
    }

    const permissoesDB = await db.permissao.findMany({
      where: { chave: { in: parsed.permissoes } },
    });

    if (isTenantAdmin(session)) {
      if (parsed.tipoEscopo !== session.user.tipoEscopo) {
        return { sucesso: false, erro: 'Admin delegado só pode criar perfis do mesmo tipo de escopo' };
      }
      const permissoesSessao = new Set(session.user.permissoes ?? []);
      const tentativaForaEscopo = parsed.permissoes.find((p) => !permissoesSessao.has(p));
      if (tentativaForaEscopo) {
        return { sucesso: false, erro: `Permissão fora do escopo do admin: ${tentativaForaEscopo}` };
      }
    }

    const perfil = await db.perfil.create({
      data: {
        nome: parsed.nome,
        descricao: parsed.descricao,
        ativo: parsed.ativo,
        tipoEscopo: parsed.tipoEscopo,
        permissoes: {
          create: permissoesDB.map((p) => ({ permissaoId: p.id })),
        },
      },
    });

    revalidatePath('/admin/parametros/perfis');
    return { sucesso: true, dados: perfil };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error('Erro ao criar perfil:', error);
    return { sucesso: false, erro: 'Erro ao criar perfil' };
  }
}

export async function atualizarPerfil(id: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { sucesso: false, erro: 'Não autenticado' };

    const parsed = PerfilSchema.parse(data);

    const existente = await db.perfil.findUnique({ where: { id } });
    if (!existente) return { sucesso: false, erro: 'Perfil não encontrado' };

    const nomeConflito = await db.perfil.findFirst({
      where: { nome: parsed.nome, NOT: { id } },
    });
    if (nomeConflito) return { sucesso: false, erro: 'Já existe outro perfil com este nome' };

    const permissoesDB = await db.permissao.findMany({
      where: { chave: { in: parsed.permissoes } },
    });

    if (isTenantAdmin(session)) {
      if (parsed.tipoEscopo !== session.user.tipoEscopo) {
        return { sucesso: false, erro: 'Admin delegado só pode editar perfis do mesmo tipo de escopo' };
      }
      const permissoesSessao = new Set(session.user.permissoes ?? []);
      const tentativaForaEscopo = parsed.permissoes.find((p) => !permissoesSessao.has(p));
      if (tentativaForaEscopo) {
        return { sucesso: false, erro: `Permissão fora do escopo do admin: ${tentativaForaEscopo}` };
      }
    }

    await db.perfilPermissao.deleteMany({ where: { perfilId: id } });

    const perfil = await db.perfil.update({
      where: { id },
      data: {
        nome: parsed.nome,
        descricao: parsed.descricao,
        ativo: parsed.ativo,
        tipoEscopo: parsed.tipoEscopo,
        permissoes: {
          create: permissoesDB.map((p) => ({ permissaoId: p.id })),
        },
      },
    });

    revalidatePath('/admin/parametros/perfis');
    revalidatePath(`/admin/parametros/perfis/${id}`);
    return { sucesso: true, dados: perfil };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error('Erro ao atualizar perfil:', error);
    return { sucesso: false, erro: 'Erro ao atualizar perfil' };
  }
}

export async function listarFundosParaVinculo() {
  try {
    const session = await getServerSession(authOptions);
    const where =
      session?.user?.tipoEscopo === 'FUNDO' && session.user.fundoIds.length > 0
        ? { id: { in: session.user.fundoIds } }
        : {};

    const fundos = await db.fundo.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
      select: { id: true, razaoSocial: true, codigo: true },
    });
    return { sucesso: true, dados: fundos };
  } catch (error) {
    console.error('Erro ao listar fundos:', error);
    return { sucesso: false, erro: 'Erro ao carregar fundos', dados: [] as { id: string; razaoSocial: string; codigo: string }[] };
  }
}

export async function listarConstrutoresParaVinculo() {
  try {
    const session = await getServerSession(authOptions);
    const where =
      session?.user?.tipoEscopo === 'CONSTRUTORA' && session.user.construtoraIds.length > 0
        ? { id: { in: session.user.construtoraIds } }
        : session?.user?.tipoEscopo === 'FIADOR' && session.user.fiadorConstrutoraIds.length > 0
          ? { id: { in: session.user.fiadorConstrutoraIds } }
          : {};

    const construtoras = await db.construtora.findMany({
      where,
      orderBy: { razaoSocial: 'asc' },
      select: { id: true, razaoSocial: true, codigo: true },
    });
    return { sucesso: true, dados: construtoras };
  } catch (error) {
    console.error('Erro ao listar construtoras:', error);
    return { sucesso: false, erro: 'Erro ao carregar construtoras', dados: [] as { id: string; razaoSocial: string; codigo: string }[] };
  }
}

export async function listarObrasParaVinculo() {
  try {
    const session = await getServerSession(authOptions);
    const filtrosFiador: Record<string, unknown>[] = [];
    if (session?.user?.tipoEscopo === 'FIADOR') {
      if (session.user.fiadorObraIds.length > 0) {
        filtrosFiador.push({ id: { in: session.user.fiadorObraIds } });
      }
      if (session.user.fiadorConstrutoraIds.length > 0) {
        filtrosFiador.push({ construtoraId: { in: session.user.fiadorConstrutoraIds } });
      }
    }
    const where = session?.user?.tipoEscopo === 'FIADOR'
      ? (filtrosFiador.length > 0 ? { OR: filtrosFiador } : { id: '__nenhum__' })
      : {};

    const obras = await db.obra.findMany({
      where,
      orderBy: [{ construtora: { razaoSocial: 'asc' } }, { nome: 'asc' }],
      select: {
        id: true,
        nome: true,
        codigo: true,
        construtoraId: true,
        construtora: { select: { razaoSocial: true } },
      },
    });

    return { sucesso: true, dados: obras };
  } catch (error) {
    console.error('Erro ao listar obras:', error);
    return {
      sucesso: false,
      erro: 'Erro ao carregar obras',
      dados: [] as { id: string; nome: string; codigo: string; construtoraId: string; construtora: { razaoSocial: string } }[],
    };
  }
}

export async function excluirPerfil(id: string) {
  try {
    const perfil = await db.perfil.findUnique({
      where: { id },
      include: { _count: { select: { usuarios: true } } },
    });
    if (!perfil) return { sucesso: false, erro: 'Perfil não encontrado' };
    if (perfil._count.usuarios > 0) {
      return { sucesso: false, erro: `Este perfil possui ${perfil._count.usuarios} usuário(s) vinculado(s). Remova os usuários antes de excluir.` };
    }

    await db.perfil.delete({ where: { id } });
    revalidatePath('/admin/parametros/perfis');
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao excluir perfil:', error);
    return { sucesso: false, erro: 'Erro ao excluir perfil' };
  }
}
