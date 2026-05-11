import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOperacaoScopeFilter } from '@/lib/scope';
import AprovacoesClient from './AprovacoesClient';

async function getOperacoesEmAprovacao() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const scopeFilter = getOperacaoScopeFilter(session);
  const permissoes = session.user.permissoes ?? [];
  const podeAprovarFundo = permissoes.includes('aprovacoes:financeiro:aprovar');
  const podeAprovarFiador = permissoes.includes('aprovacoes:fiador:aprovar');
  const filaFilter: Record<string, unknown> =
    podeAprovarFundo && podeAprovarFiador
      ? { OR: [{ aprovacaoFundoStatus: 'PENDENTE' }, { aprovacaoFiadorStatus: 'PENDENTE', exigeAprovacaoFiador: true }] }
      : podeAprovarFiador
        ? { exigeAprovacaoFiador: true, aprovacaoFiadorStatus: 'PENDENTE' }
        : { aprovacaoFundoStatus: 'PENDENTE' };

  return db.operacao.findMany({
    where: {
      statusWorkflow: 'EM_APROVACAO_FINANCEIRA',
      ...filaFilter,
      ...scopeFilter,
    },
    include: {
      construtora: { select: { id: true, razaoSocial: true, cnpj: true } },
      obra: { select: { id: true, nome: true, codigo: true } },
      ordens: { include: { credor: { select: { nome: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AprovacoesPage() {
  const operacoes = await getOperacoesEmAprovacao();

  const serialized = operacoes.map((op) => ({
    id: op.id,
    codigo: op.codigo,
    tipo: op.tipo,
    construtoraNome: op.construtora.razaoSocial,
    construtoraId: op.construtoraId,
    obraCodigo: op.obra.codigo,
    obraNome: op.obra.nome,
    dataSolicitacao: op.dataSolicitacao.toISOString(),
    valorTotalOrdens: Number(op.valorTotalOrdens),
    valorDesagio: Number(op.valorDesagio),
    credores: [...new Set(op.ordens.map((o) => o.credor.nome))],
    exigeAprovacaoFiador: op.exigeAprovacaoFiador,
    aprovacaoFundoStatus: op.aprovacaoFundoStatus,
    aprovacaoFiadorStatus: op.aprovacaoFiadorStatus,
  }));

  return <AprovacoesClient operacoes={serialized} />;
}
