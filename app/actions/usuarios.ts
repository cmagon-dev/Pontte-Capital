'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  perfilId: z.string().uuid('Perfil inválido'),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
  fundoIds: z.array(z.string()).default([]),
  construtoraIds: z.array(z.string()).default([]),
  fiadorConstrutoraIds: z.array(z.string()).default([]),
  fiadorObraIds: z.array(z.string()).default([]),
});

function isSubset<T>(subset: T[], superset: T[]) {
  return subset.every((item) => superset.includes(item));
}

function isTenantAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session?.user) return false;
  const permissoes = session.user.permissoes ?? [];
  return (
    session.user.tipoEscopo !== 'GLOBAL' &&
    (permissoes.includes('admin:tenant:usuarios:gerenciar') || permissoes.includes('admin:usuarios:gerenciar'))
  );
}

function validarVinculosPorEscopo(
  tipoEscopo: string,
  parsed: z.infer<typeof UsuarioSchema>
): string | null {
  if (tipoEscopo === 'FUNDO' && parsed.fundoIds.length === 0) {
    return 'Perfis de fundo exigem ao menos um fundo vinculado';
  }
  if (tipoEscopo === 'CONSTRUTORA' && parsed.construtoraIds.length === 0) {
    return 'Perfis de construtora exigem ao menos uma construtora vinculada';
  }
  if (tipoEscopo === 'FIADOR' && parsed.fiadorConstrutoraIds.length === 0 && parsed.fiadorObraIds.length === 0) {
    return 'Perfis de fiador exigem ao menos uma obra ou construtora vinculada';
  }
  return null;
}

export async function listarUsuarios() {
  try {
    const session = await getServerSession(authOptions);
    const where: Record<string, unknown> = {};

    if (session?.user && session.user.tipoEscopo !== 'GLOBAL') {
      if (session.user.tipoEscopo === 'FUNDO') {
        where.fundosVinculados = { some: { fundoId: { in: session.user.fundoIds } } };
      } else if (session.user.tipoEscopo === 'CONSTRUTORA') {
        where.construtorasVinculadas = { some: { construtoraId: { in: session.user.construtoraIds } } };
      } else if (session.user.tipoEscopo === 'FIADOR') {
        where.OR = [
          { fiadorConstrutorasVinculadas: { some: { construtoraId: { in: session.user.fiadorConstrutoraIds } } } },
          { fiadorObrasVinculadas: { some: { obraId: { in: session.user.fiadorObraIds } } } },
        ];
      }
    }

    const usuarios = await db.usuario.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        perfil: true,
        fundosVinculados: { select: { fundoId: true } },
        construtorasVinculadas: { select: { construtoraId: true } },
        fiadorConstrutorasVinculadas: { select: { construtoraId: true } },
        fiadorObrasVinculadas: { select: { obraId: true } },
      },
    });
    return { sucesso: true, dados: usuarios };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return { sucesso: false, erro: 'Erro ao carregar usuários' };
  }
}

export async function buscarUsuarioPorId(id: string) {
  try {
    const usuario = await db.usuario.findUnique({
      where: { id },
      include: {
        perfil: true,
        fundosVinculados: { select: { fundoId: true } },
        construtorasVinculadas: { select: { construtoraId: true } },
        fiadorConstrutorasVinculadas: { select: { construtoraId: true } },
        fiadorObrasVinculadas: { select: { obraId: true } },
      },
    });
    if (!usuario) {
      return { sucesso: false, erro: 'Usuário não encontrado' };
    }
    return { sucesso: true, dados: usuario };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return { sucesso: false, erro: 'Erro ao buscar usuário' };
  }
}

export async function criarUsuario(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { sucesso: false, erro: 'Não autenticado' };

    const parsed = UsuarioSchema.parse(data);

    if (!parsed.senha || parsed.senha === '') {
      return { sucesso: false, erro: 'Senha é obrigatória para novos usuários' };
    }

    const existente = await db.usuario.findUnique({ where: { email: parsed.email } });
    if (existente) {
      return { sucesso: false, erro: 'Já existe um usuário com este e-mail' };
    }

    const perfilDestino = await db.perfil.findUnique({
      where: { id: parsed.perfilId },
      include: { permissoes: { include: { permissao: true } } },
    });
    if (!perfilDestino) return { sucesso: false, erro: 'Perfil de destino não encontrado' };
    const erroVinculo = validarVinculosPorEscopo(perfilDestino.tipoEscopo, parsed);
    if (erroVinculo) return { sucesso: false, erro: erroVinculo };

    if (isTenantAdmin(session)) {
      if (perfilDestino.tipoEscopo !== session.user.tipoEscopo) {
        return { sucesso: false, erro: 'Admin delegado só pode criar usuários do mesmo tipo de escopo' };
      }
      if (session.user.tipoEscopo === 'FUNDO' && !isSubset(parsed.fundoIds, session.user.fundoIds)) {
        return { sucesso: false, erro: 'Você só pode vincular fundos do seu próprio escopo' };
      }
      if (
        session.user.tipoEscopo === 'CONSTRUTORA' &&
        !isSubset(parsed.construtoraIds, session.user.construtoraIds)
      ) {
        return { sucesso: false, erro: 'Você só pode vincular construtoras do seu próprio escopo' };
      }
      if (session.user.tipoEscopo === 'FIADOR') {
        if (!isSubset(parsed.fiadorConstrutoraIds, session.user.fiadorConstrutoraIds)) {
          return { sucesso: false, erro: 'Você só pode vincular construtoras do seu escopo de fiador' };
        }
        if (!isSubset(parsed.fiadorObraIds, session.user.fiadorObraIds)) {
          return { sucesso: false, erro: 'Você só pode vincular obras do seu escopo de fiador' };
        }
      }
    }

    const senhaHash = await bcrypt.hash(parsed.senha, 10);

    const usuario = await db.usuario.create({
      data: {
        nome: parsed.nome,
        email: parsed.email,
        senha: senhaHash,
        perfilId: parsed.perfilId,
        status: parsed.status,
        fundosVinculados: parsed.fundoIds.length > 0
          ? { create: parsed.fundoIds.map((fundoId) => ({ fundoId })) }
          : undefined,
        construtorasVinculadas: parsed.construtoraIds.length > 0
          ? { create: parsed.construtoraIds.map((construtoraId) => ({ construtoraId })) }
          : undefined,
        fiadorConstrutorasVinculadas: parsed.fiadorConstrutoraIds.length > 0
          ? { create: parsed.fiadorConstrutoraIds.map((construtoraId) => ({ construtoraId })) }
          : undefined,
        fiadorObrasVinculadas: parsed.fiadorObraIds.length > 0
          ? { create: parsed.fiadorObraIds.map((obraId) => ({ obraId })) }
          : undefined,
      },
    });

    revalidatePath('/admin/usuarios');
    return { sucesso: true, dados: usuario };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error('Erro ao criar usuário:', error);
    return { sucesso: false, erro: 'Erro ao criar usuário' };
  }
}

export async function atualizarUsuario(id: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { sucesso: false, erro: 'Não autenticado' };

    const parsed = UsuarioSchema.parse(data);

    const existente = await db.usuario.findUnique({ where: { id } });
    if (!existente) {
      return { sucesso: false, erro: 'Usuário não encontrado' };
    }

    const emailConflito = await db.usuario.findFirst({
      where: { email: parsed.email, NOT: { id } },
    });
    if (emailConflito) {
      return { sucesso: false, erro: 'Este e-mail já está em uso por outro usuário' };
    }

    const perfilDestino = await db.perfil.findUnique({
      where: { id: parsed.perfilId },
      include: { permissoes: { include: { permissao: true } } },
    });
    if (!perfilDestino) return { sucesso: false, erro: 'Perfil de destino não encontrado' };
    const erroVinculo = validarVinculosPorEscopo(perfilDestino.tipoEscopo, parsed);
    if (erroVinculo) return { sucesso: false, erro: erroVinculo };

    if (isTenantAdmin(session)) {
      if (perfilDestino.tipoEscopo !== session.user.tipoEscopo) {
        return { sucesso: false, erro: 'Admin delegado só pode editar usuários do mesmo tipo de escopo' };
      }
      if (session.user.tipoEscopo === 'FUNDO' && !isSubset(parsed.fundoIds, session.user.fundoIds)) {
        return { sucesso: false, erro: 'Você só pode vincular fundos do seu próprio escopo' };
      }
      if (
        session.user.tipoEscopo === 'CONSTRUTORA' &&
        !isSubset(parsed.construtoraIds, session.user.construtoraIds)
      ) {
        return { sucesso: false, erro: 'Você só pode vincular construtoras do seu próprio escopo' };
      }
      if (session.user.tipoEscopo === 'FIADOR') {
        if (!isSubset(parsed.fiadorConstrutoraIds, session.user.fiadorConstrutoraIds)) {
          return { sucesso: false, erro: 'Você só pode vincular construtoras do seu escopo de fiador' };
        }
        if (!isSubset(parsed.fiadorObraIds, session.user.fiadorObraIds)) {
          return { sucesso: false, erro: 'Você só pode vincular obras do seu escopo de fiador' };
        }
      }
    }

    const dadosAtualizacao: {
      nome: string;
      email: string;
      perfilId: string;
      status: 'ATIVO' | 'INATIVO';
      senha?: string;
    } = {
      nome: parsed.nome,
      email: parsed.email,
      perfilId: parsed.perfilId,
      status: parsed.status,
    };

    if (parsed.senha && parsed.senha !== '') {
      dadosAtualizacao.senha = await bcrypt.hash(parsed.senha, 10);
    }

    // Atualizar usuário e sincronizar vínculos em uma transação
    const usuario = await db.$transaction(async (tx) => {
      const u = await tx.usuario.update({ where: { id }, data: dadosAtualizacao });

      // Sincronizar vínculos com fundos
      await tx.usuarioFundo.deleteMany({ where: { usuarioId: id } });
      if (parsed.fundoIds.length > 0) {
        await tx.usuarioFundo.createMany({
          data: parsed.fundoIds.map((fundoId) => ({ usuarioId: id, fundoId })),
        });
      }

      // Sincronizar vínculos com construtoras
      await tx.usuarioConstrutora.deleteMany({ where: { usuarioId: id } });
      if (parsed.construtoraIds.length > 0) {
        await tx.usuarioConstrutora.createMany({
          data: parsed.construtoraIds.map((construtoraId) => ({ usuarioId: id, construtoraId })),
        });
      }

      // Sincronizar vínculos com construtoras do escopo fiador
      await tx.usuarioFiadorConstrutora.deleteMany({ where: { usuarioId: id } });
      if (parsed.fiadorConstrutoraIds.length > 0) {
        await tx.usuarioFiadorConstrutora.createMany({
          data: parsed.fiadorConstrutoraIds.map((construtoraId) => ({ usuarioId: id, construtoraId })),
        });
      }

      // Sincronizar vínculos com obras do escopo fiador
      await tx.usuarioFiadorObra.deleteMany({ where: { usuarioId: id } });
      if (parsed.fiadorObraIds.length > 0) {
        await tx.usuarioFiadorObra.createMany({
          data: parsed.fiadorObraIds.map((obraId) => ({ usuarioId: id, obraId })),
        });
      }

      return u;
    });

    revalidatePath('/admin/usuarios');
    revalidatePath(`/admin/usuarios/${id}/editar`);
    return { sucesso: true, dados: usuario };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { sucesso: false, erro: error.issues[0].message };
    }
    console.error('Erro ao atualizar usuário:', error);
    return { sucesso: false, erro: 'Erro ao atualizar usuário' };
  }
}

export async function excluirUsuario(id: string) {
  try {
    const existente = await db.usuario.findUnique({ where: { id } });
    if (!existente) {
      return { sucesso: false, erro: 'Usuário não encontrado' };
    }

    await db.usuario.delete({ where: { id } });

    revalidatePath('/admin/usuarios');
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return { sucesso: false, erro: 'Erro ao excluir usuário' };
  }
}
