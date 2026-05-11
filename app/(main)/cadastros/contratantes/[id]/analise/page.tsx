import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, TrendingUp, Clock, DollarSign, Shield } from 'lucide-react';
import { db } from '@/lib/db';

// Função auxiliar para formatar código
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado (SC-001, SC-002, etc)
}

// Função auxiliar para formatar data
function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

// Função auxiliar para formatar porcentagem
function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Função auxiliar para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default async function AnaliseContratantePage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const contratante = await db.contratante.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!contratante) {
    notFound();
  }

  // Dados mockados de análise (posteriormente podem vir do banco de dados)
  const analiseRisco = {
    classificacao: 'Baixo' as 'Baixo' | 'Médio' | 'Alto',
    score: 85,
    tempoMedioPagamento: 12,
    taxaAtraso: 5.2,
    quantidadeAtrasos: 2,
    maiorAtraso: 8,
    ultimoAtraso: new Date('2024-11-15'),
    volumeTotal: 2500000,
    operacoesRealizadas: 24,
    ticketMedio: 104166.67,
  };

  const historicoPagamentos = [
    { data: new Date('2025-01-10'), valor: 150000, status: 'Pago', diasAtraso: 0 },
    { data: new Date('2024-12-15'), valor: 120000, status: 'Pago', diasAtraso: 3 },
    { data: new Date('2024-11-20'), valor: 180000, status: 'Pago', diasAtraso: 0 },
    { data: new Date('2024-10-18'), valor: 95000, status: 'Pago', diasAtraso: 5 },
    { data: new Date('2024-09-22'), valor: 110000, status: 'Pago', diasAtraso: 0 },
  ];

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'Baixo':
        return 'bg-green-900/30 text-green-400 border-green-500';
      case 'Médio':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-500';
      case 'Alto':
        return 'bg-red-900/30 text-red-400 border-red-500';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/contratantes/${params.id}/cadastro`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Análise de Risco</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Código:</span>
              <span className="font-mono text-blue-400 font-bold text-lg">{formatCodigo(contratante.codigo)}</span>
              <span className="text-slate-400">|</span>
              <span className="text-white font-medium">{contratante.razaoSocial}</span>
            </div>
            <p className="text-slate-400 mt-1">Indicadores de Risco e Histórico de Pagamentos</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Resumo de Risco */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Classificação de Risco */}
          <div className={`bg-slate-900 border rounded-lg p-6 ${getRiscoColor(analiseRisco.classificacao)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold">Classificação de Risco</h3>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">{analiseRisco.classificacao}</p>
            <p className="text-sm opacity-80">
              {analiseRisco.classificacao === 'Baixo' && 'Contratante confiável com bom histórico'}
              {analiseRisco.classificacao === 'Médio' && 'Atenção moderada requerida'}
              {analiseRisco.classificacao === 'Alto' && 'Revisão detalhada necessária'}
            </p>
          </div>

          {/* Score de Confiabilidade */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-white">Score de Confiabilidade</h3>
            </div>
            <p className={`text-4xl font-bold mb-2 ${getScoreColor(analiseRisco.score)}`}>
              {analiseRisco.score}
            </p>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${analiseRisco.score >= 80 ? 'bg-green-500' : analiseRisco.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${analiseRisco.score}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">Baseado em {analiseRisco.operacoesRealizadas} operações</p>
          </div>

          {/* Tempo Médio de Pagamento */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-white">Tempo Médio de Pagamento</h3>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{analiseRisco.tempoMedioPagamento} dias</p>
            <p className="text-sm text-slate-400">
              {analiseRisco.tempoMedioPagamento <= 15 ? 'Excelente pontualidade' : 'Dentro do prazo aceitável'}
            </p>
          </div>
        </div>

        {/* Indicadores Detalhados */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Indicadores de Inadimplência
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Taxa de Atraso</p>
              <p className={`text-2xl font-bold ${analiseRisco.taxaAtraso > 10 ? 'text-red-400' : analiseRisco.taxaAtraso > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                {formatPercent(analiseRisco.taxaAtraso)}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Quantidade de Atrasos</p>
              <p className="text-2xl font-bold text-white">{analiseRisco.quantidadeAtrasos}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Maior Atraso Registrado</p>
              <p className="text-2xl font-bold text-red-400">{analiseRisco.maiorAtraso} dias</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Último Atraso</p>
              <p className="text-lg font-bold text-white">{formatDate(analiseRisco.ultimoAtraso)}</p>
            </div>
          </div>
        </div>

        {/* Volume Financeiro */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Volume Financeiro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Volume Total Operado</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(analiseRisco.volumeTotal)}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Operações Realizadas</p>
              <p className="text-2xl font-bold text-white">{analiseRisco.operacoesRealizadas}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(analiseRisco.ticketMedio)}</p>
            </div>
          </div>
        </div>

        {/* Histórico de Pagamentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Histórico de Pagamentos (Últimas 5 Operações)</h2>
          <div className="overflow-x-auto">
            <table className="table-engineering w-full">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Dias de Atraso</th>
                </tr>
              </thead>
              <tbody>
                {historicoPagamentos.map((pagamento, index) => (
                  <tr key={index} className="hover:bg-slate-800">
                    <td>
                      <span className="text-slate-300">{formatDate(pagamento.data)}</span>
                    </td>
                    <td>
                      <span className="font-mono text-green-400">{formatCurrency(pagamento.valor)}</span>
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        pagamento.status === 'Pago'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {pagamento.status}
                      </span>
                    </td>
                    <td>
                      <span className={`font-bold ${
                        pagamento.diasAtraso === 0
                          ? 'text-green-400'
                          : pagamento.diasAtraso <= 5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {pagamento.diasAtraso === 0 ? 'No Prazo' : `${pagamento.diasAtraso} dias`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recomendações */}
        <div className={`border rounded-lg p-6 ${getRiscoColor(analiseRisco.classificacao)}`}>
          <h2 className="text-xl font-bold mb-4">Recomendações</h2>
          <ul className="space-y-2">
            {analiseRisco.classificacao === 'Baixo' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Contratante possui histórico consistente e confiável de pagamentos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Taxa de inadimplência dentro dos parâmetros aceitáveis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Aprovado para operações de crédito com condições padrão.</span>
                </li>
              </>
            )}
            {analiseRisco.classificacao === 'Médio' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Monitorar de perto o histórico de pagamentos futuros.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Considerar redução de limite ou garantias adicionais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Revisão trimestral dos indicadores de risco recomendada.</span>
                </li>
              </>
            )}
            {analiseRisco.classificacao === 'Alto' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Histórico de inadimplência significativo. Atenção máxima necessária.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Exigir garantias robustas antes de novas operações.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✕</span>
                  <span>Aprovação de comitê de crédito obrigatória para qualquer liberação.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
