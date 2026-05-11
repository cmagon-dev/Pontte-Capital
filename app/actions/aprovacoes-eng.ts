'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMedicaoScopeFilter, getOperacaoScopeFilter } from '@/lib/scope';
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

/**
 * Lista operacoes em EM_APROVACAO_TECNICA visiveis ao usuario logado.
 * Restricao de permissao: a pagina que a usa exige `aprovacoes:engenharia:aprovar`;
 * aqui retornamos vazio se nao houver sessao (a tela ja faz o gate).
 */
export async function listarOperacoesParaAprovacaoTecnica() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const scopeFilter = getOperacaoScopeFilter(session);

  return db.operacao.findMany({
    where: {
      statusWorkflow: 'EM_APROVACAO_TECNICA',
      ...scopeFilter,
    },
    include: {
      construtora: { select: { id: true, razaoSocial: true, cnpj: true } },
      obra: { select: { id: true, codigo: true, nome: true } },
      ordens: {
        select: {
          id: true,
          credor: { select: { nome: true } },
        },
      },
    },
    orderBy: { dataSolicitacao: 'desc' },
  });
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
