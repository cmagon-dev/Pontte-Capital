import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ClipboardList, DollarSign, BarChart3, Percent, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { buscarObraPorId } from '@/app/actions/obras';
import { buscarPrevisoesPorObra } from '@/app/actions/previsoes-medicao';

export default async function PlanMedicoesObraPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  const [obra, previsaoResult] = await Promise.all([
    buscarObraPorId(params.obraId),
    buscarPrevisoesPorObra(params.obraId),
  ]);

  if (!obra) {
    notFound();
  }

  const previsoes = previsaoResult.success ? previsaoResult.data : [];

  const realizadas = previsoes.filter((p) => p.status === 'REALIZADA');
  const previstas = previsoes.filter((p) => p.status === 'PREVISTA');

  const valorContrato = Number(obra.valorContrato ?? 0);

  const valorTotalMedido = realizadas.reduce((acc, p) => {
    const soma = p.itens.reduce((s, item) => s + Number(item.valorPrevisto ?? 0), 0);
    return acc + soma;
  }, 0);

  const percentualMedidoFisico = valorContrato > 0 ? (valorTotalMedido / valorContrato) * 100 : 0;
  const saldoMedir = valorContrato - valorTotalMedido;
  const numeroMedicoes = realizadas.length;

  const ultimaMedicao = realizadas
    .map((p) => p.dataRealMedicao ?? p.dataPrevisao)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const agora = new Date();
  const atrasadas = previstas.filter((p) => new Date(p.dataPrevisao) < agora);
  const statusMedicoes = atrasadas.length > 0 ? 'Atrasado' : numeroMedicoes === 0 ? 'Pendente' : 'Em Dia';

  const proximaMedicaoPrevista = previstas
    .filter((p) => new Date(p.dataPrevisao) >= agora)
    .sort((a, b) => new Date(a.dataPrevisao).getTime() - new Date(b.dataPrevisao).getTime())[0]?.dataPrevisao;

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Dia': return 'bg-green-900 text-green-400';
      case 'Atrasado': return 'bg-red-900 text-red-400';
      case 'Pendente': return 'bg-amber-900 text-amber-400';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 80) return 'bg-green-500';
    if (percentual >= 50) return 'bg-blue-500';
    if (percentual >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const menuItems = [
    {
      title: 'Previsões & Medições',
      description: 'Planejamento e cronograma de medições futuras',
      href: `/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/previsoes-medicoes`,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-900 border-blue-800 text-blue-400',
    },
    {
      title: 'Lead Time Suprimentos',
      description: 'Gestão de prazos e entregas de materiais',
      href: `/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/lead-time-suprimentos`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-900 border-purple-800 text-purple-400',
    },
    {
      title: 'Parâmetros Financeiros',
      description: 'Configuração de parâmetros e indicadores financeiros',
      href: `/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/parametros-financeiros`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-amber-900 border-amber-800 text-amber-400',
    },
    {
      title: 'Fluxo Financeiro Projetado',
      description: 'Projeção e análise do fluxo de caixa da obra',
      href: `/eng/plan-medicoes/${params.construtoraId}/${params.obraId}/fluxo-financeiro-projetado`,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-teal-900 border-teal-800 text-teal-400',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/plan-medicoes/${params.construtoraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Medições — {obra.codigo}</h1>
            <p className="text-slate-400">{obra.nome}</p>
            <p className="text-slate-500 text-sm mt-1">
              Construtora: {obra.construtora?.nomeFantasia ?? obra.construtora?.razaoSocial ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <Percent className="w-5 h-5 text-blue-400" />
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(statusMedicoes)}`}>
              {statusMedicoes}
            </span>
          </div>
          <h3 className="text-sm text-slate-400 mb-1">% Medido (Físico)</h3>
          <p className="text-2xl font-bold text-white">{formatPercent(percentualMedidoFisico)}</p>
          <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressColor(percentualMedidoFisico)}`}
              style={{ width: `${Math.min(percentualMedidoFisico, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="p-2 bg-green-900/50 rounded-lg w-fit mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-sm text-slate-400 mb-1">Valor Total Medido</h3>
          <p className="text-2xl font-bold text-white font-mono">{formatCurrency(valorTotalMedido)}</p>
          <p className="text-xs text-slate-500 mt-2">De {formatCurrency(valorContrato)} contratado</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="p-2 bg-purple-900/50 rounded-lg w-fit mb-2">
            <ClipboardList className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-sm text-slate-400 mb-1">Medições Realizadas</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{numeroMedicoes}</p>
            <p className="text-xs text-slate-500">medições</p>
          </div>
          <p className="text-xs text-slate-500 mt-2">Última: {formatDate(ultimaMedicao)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="p-2 bg-amber-900/50 rounded-lg w-fit mb-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-sm text-slate-400 mb-1">Saldo a Medir</h3>
          <p className="text-2xl font-bold text-white font-mono">{formatCurrency(saldoMedir)}</p>
          <p className="text-xs text-slate-500 mt-2">
            Próxima prevista: {formatDate(proximaMedicaoPrevista)}
          </p>
        </div>
      </div>

      {/* Análise Detalhada */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Análise Financeira
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Valor Contratado:</span>
              <span className="text-sm font-semibold text-white">{formatCurrency(valorContrato)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Valor Medido:</span>
              <span className="text-sm font-semibold text-green-400">{formatCurrency(valorTotalMedido)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-300">Saldo a Medir:</span>
                <span className="text-sm font-bold text-amber-400">{formatCurrency(saldoMedir)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Progresso Físico
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Avanço Físico</span>
                <span className="text-xs text-slate-400">{formatPercent(percentualMedidoFisico)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(percentualMedidoFisico)}`}
                  style={{ width: `${Math.min(percentualMedidoFisico, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Última Medição:</p>
              <p className="text-lg font-bold text-white">{formatDate(ultimaMedicao)}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Próximas Medições
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Próxima Prevista</span>
                <span className="text-sm font-bold text-blue-400">{formatDate(proximaMedicaoPrevista)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {previsoes.length} previsões cadastradas —{' '}
                {realizadas.length} realizadas, {previstas.length} pendentes
                {atrasadas.length > 0 && (
                  <span className="text-red-400"> ({atrasadas.length} atrasada{atrasadas.length > 1 ? 's' : ''})</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`${item.color} border rounded-lg p-6 hover:opacity-90 transition-opacity group`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-black/20 rounded-lg group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm opacity-80">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
