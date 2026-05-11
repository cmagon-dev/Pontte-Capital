'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMedicaoScopeFilter } from '@/lib/scope';
import { revalidatePath } from 'next/cache';

export async function listarMedicoesParaAprovacao() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const scopeFilter = getMedicaoScopeFilter(session);

  const medicoes = await db.medicao.findMany({
    where: {
      status: 'AGUARDANDO_APROVACAO',
      ...scopeFilter,
    },
    include: {
      obra: {
        select: {
          id: true,
          codigo: true,
          nome: true,
          construtora: { select: { id: true, razaoSocial: true } },
        },
      },
    },
    orderBy: { periodoFim: 'desc' },
  });
  return medicoes;
}

export async function aprovarMedicao(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissoes?.includes('aprovacoes:engenharia:aprovar')) {
    throw new Error('Sem permissão para aprovar medições');
  }

  await db.medicao.update({
    where: { id },
    data: {
      status: 'APROVADA',
      dataAprovacao: new Date(),
    },
  });

  revalidatePath('/aprovacoes/engenharia');
}

export async function rejeitarMedicao(id: string, motivo: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissoes?.includes('aprovacoes:engenharia:aprovar')) {
    throw new Error('Sem permissão para rejeitar medições');
  }

  await db.medicao.update({
    where: { id },
    data: { status: 'REJEITADA' },
  });

  revalidatePath('/aprovacoes/engenharia');
}
