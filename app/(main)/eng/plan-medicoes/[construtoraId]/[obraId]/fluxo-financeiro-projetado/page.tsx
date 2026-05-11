import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { buscarObraPorId } from '@/app/actions/obras';
import { buscarPrevisoesPorObra } from '@/app/actions/previsoes-medicao';

export default async function FluxoFinanceiroProjetadoPage({
  params,
}: {
  params: { construtoraId: string; obraId: string };
}) {
  const [obra, previsaoResult] = await Promise.all([
    buscarObraPorId(params.obraId),
    buscarPrevisoesPorObra(params.obraId),
  ]);

  if (!obra) {
    notFound();
  }

  const previsoes = previsaoResult.success ? previsaoResult.data : [];
  const bdi = obra.bdi != null ? Number(obra.bdi) / 100 : 0;
  const encargos = obra.encargos != null ? Number(obra.encargos) / 100 : 0;
  const valorContrato = Number(obra.valorContrato ?? 0);

  const temParametros = obra.bdi != null || obra.encargos != null;

  type LinhaFluxo = {
    numero: number;
    nome: string;
    dataPrevisao: Date;
    status: string;
    valorBase: number;
    valorComBdi: number;
    valorComEncargos: number;
    valorFinanceiro: number;
    percentualBase: number;
    percentualAcumulado: number;
    valorAcumulado: number;
  };

  const linhas: LinhaFluxo[] = [];
  let acumuladoBase = 0;

  const visiveis = previsoes
    .filter((p) => p.visivel && p.status !== 'CANCELADA')
    .sort((a, b) => a.numero - b.numero);

  for (const prev of visiveis) {
    const valorBase = prev.itens.reduce((s, item) => s + Number(item.valorPrevisto ?? 0), 0);
    const valorComBdi = valorBase * (1 + bdi);
    const valorComEncargos = valorBase * (1 + encargos);
    const valorFinanceiro = valorBase * (1 + bdi) * (1 + encargos);
    const percentualBase = valorContrato > 0 ? (valorBase / valorContrato) * 100 : 0;
    acumuladoBase += valorBase;
    const percentualAcumulado = valorContrato > 0 ? (acumuladoBase / valorContrato) * 100 : 0;

    linhas.push({
      numero: prev.numero,
      nome: prev.nome,
      dataPrevisao: new Date(prev.dataPrevisao),
      status: prev.status,
      valorBase,
      valorComBdi,
      valorComEncargos,
      valorFinanceiro,
      percentualBase,
      percentualAcumulado,
      valorAcumulado: acumuladoBase,
    });
  }

  const totalBase = linhas.reduce((s, l) => s + l.valorBase, 0);
  const totalFinanceiro = linhas.reduce((s, l) => s + l.valorFinanceiro, 0);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REALIZADA': return 'bg-green-900 text-green-400';
      case 'EM_MEDICAO': return 'bg-blue-900 text-blue-400';
      case 'PREVISTA': return 'bg-slate-700 text-slate-300';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const statusLabel: Record<string, string> = {
    REALIZADA: 'Realizada',
    EM_MEDICAO: 'Em Medição',
    PREVISTA: 'Prevista',
    CANCELADA: 'Cancelada',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Fluxo Financeiro Projetado</h1>
          <p className="text-slate-400">
            {obra.codigo} — {obra.nome}
          </p>
        </div>
      </div>

      {/* Aviso se não houver parâmetros */}
      {!temParametros && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-950 border border-amber-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">Parâmetros financeiros não configurados</p>
            <p className="text-amber-300/80 text-xs mt-1">
              BDI e Encargos ainda não foram definidos para esta obra. Os valores financeiros abaixo refletem
              apenas o valor contratual base.{' '}
              <Link
                href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/parametros-financeiros`}
                className="underline hover:text-amber-200"
              >
                Configurar agora
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="p-2 bg-teal-900/50 rounded-lg w-fit mb-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-xs text-slate-400 mb-1">Total Base (Contratual)</p>
          <p className="text-xl font-bold text-white font-mono">{formatCurrency(totalBase)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="p-2 bg-amber-900/50 rounded-lg w-fit mb-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs text-slate-400 mb-1">BDI Aplicado</p>
          <p className="text-xl font-bold text-white">{obra.bdi != null ? `${Number(obra.bdi).toFixed(2)}%` : '—'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="p-2 bg-purple-900/50 rounded-lg w-fit mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-xs text-slate-400 mb-1">Encargos Aplicados</p>
          <p className="text-xl font-bold text-white">
            {obra.encargos != null ? `${Number(obra.encargos).toFixed(2)}%` : '—'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="p-2 bg-green-900/50 rounded-lg w-fit mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-xs text-slate-400 mb-1">Total Financeiro Projetado</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(totalFinanceiro)}</p>
        </div>
      </div>

      {/* Tabela */}
      {linhas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-semibold">Nenhuma previsão de medição cadastrada</p>
          <p className="text-slate-500 text-sm mt-2">
            Cadastre as previsões de medição para visualizar o fluxo financeiro projetado.
          </p>
          <Link
            href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/previsoes-medicoes`}
            className="inline-block mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            Cadastrar Previsões
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Projeção por Medição</h2>
            <p className="text-slate-400 text-sm mt-1">
              Valores calculados com BDI e encargos configurados nos parâmetros financeiros.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Medição</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Data Prevista</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Valor Base</th>
                  {bdi > 0 && (
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">c/ BDI</th>
                  )}
                  {encargos > 0 && (
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">c/ Encargos</th>
                  )}
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Valor Financeiro</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">% Base</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${
                      linha.status === 'REALIZADA' ? 'bg-green-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{linha.nome}</p>
                        <p className="text-xs text-slate-500">Medição {linha.numero}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDate(linha.dataPrevisao)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(linha.status)}`}>
                        {statusLabel[linha.status] ?? linha.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300 font-mono">
                      {formatCurrency(linha.valorBase)}
                    </td>
                    {bdi > 0 && (
                      <td className="px-4 py-3 text-right text-amber-300 font-mono">
                        {formatCurrency(linha.valorComBdi)}
                      </td>
                    )}
                    {encargos > 0 && (
                      <td className="px-4 py-3 text-right text-purple-300 font-mono">
                        {formatCurrency(linha.valorComEncargos)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-green-400 font-mono font-semibold">
                      {formatCurrency(linha.valorFinanceiro)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {formatPercent(linha.percentualBase)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-white font-mono">{formatCurrency(linha.valorAcumulado)}</p>
                        <div className="w-20 bg-slate-700 rounded-full h-1 mt-1 ml-auto">
                          <div
                            className="h-1 rounded-full bg-teal-500"
                            style={{ width: `${Math.min(linha.percentualAcumulado, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 text-right mt-0.5">
                          {formatPercent(linha.percentualAcumulado)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800/70 border-t-2 border-slate-700">
                  <td colSpan={3} className="px-4 py-3 text-white font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {formatCurrency(totalBase)}
                  </td>
                  {bdi > 0 && (
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">
                      {formatCurrency(linhas.reduce((s, l) => s + l.valorComBdi, 0))}
                    </td>
                  )}
                  {encargos > 0 && (
                    <td className="px-4 py-3 text-right font-mono font-bold text-purple-300">
                      {formatCurrency(linhas.reduce((s, l) => s + l.valorComEncargos, 0))}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-mono font-bold text-green-400">
                    {formatCurrency(totalFinanceiro)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-300">
                    {formatPercent(linhas.reduce((s, l) => s + l.percentualBase, 0))}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
