import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOperacaoScopeFilter } from '@/lib/scope';
import AprovacoesClient from '@/app/(main)/fin/operacoes/aprovacoes/AprovacoesClient';

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
      statusWorkflow: 'EM_APROVACAO',
      ...filaFilter,
      ...scopeFilter,
    },
    include: {
      construtora: { select: { id: true, razaoSocial: true } },
      obra: { select: { id: true, nome: true, codigo: true } },
      ordens: { include: { credor: { select: { nome: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AprovacoesFinanceiroPage() {
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
    credores: [...new Set(op.ordens.map((o) => o.credor?.nome ?? 'N/A').filter(Boolean))],
    exigeAprovacaoFiador: op.exigeAprovacaoFiador,
    aprovacaoFundoStatus: op.aprovacaoFundoStatus,
    aprovacaoFiadorStatus: op.aprovacaoFiadorStatus,
  }));

  return (
    <div>
      <div className="px-8 pt-8 pb-0">
        <h1 className="text-3xl font-bold text-white mb-1">Aprovações Financeiras</h1>
        <p className="text-slate-400 mb-6">Operações financeiras aguardando aprovação do fundo e/ou fiador</p>
      </div>
      <AprovacoesClient operacoes={serialized} />
    </div>
  );
}
