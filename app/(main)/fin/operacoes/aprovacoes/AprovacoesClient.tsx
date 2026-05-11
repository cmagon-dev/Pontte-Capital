'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Building2, FileText, PlayCircle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { aprovarOperacao, rejeitarOperacao } from '@/app/actions/operacoes';

type OperacaoItem = {
  id: string;
  codigo: string;
  tipo: string;
  construtoraNome: string;
  construtoraId: string;
  obraCodigo: string;
  obraNome: string;
  dataSolicitacao: string;
  valorTotalOrdens: number;
  valorDesagio: number;
  credores: string[];
  exigeAprovacaoFiador: boolean;
  aprovacaoFundoStatus: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
  aprovacaoFiadorStatus: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
};

function getLabelTipo(tipo: string) {
  switch (tipo) {
    case 'A_PERFORMAR': return 'À Performar';
    case 'PERFORMADA': return 'Performada';
    case 'SALDO_PERFORMADO': return 'Saldo Performado';
    default: return tipo;
  }
}

function classeStatusAprovacao(status: OperacaoItem['aprovacaoFundoStatus']) {
  if (status === 'APROVADA') return 'bg-emerald-900 text-emerald-300 border-emerald-700';
  if (status === 'REJEITADA') return 'bg-red-900 text-red-300 border-red-700';
  return 'bg-amber-900 text-amber-300 border-amber-700';
}

export default function AprovacoesClient({ operacoes: operacoesInicial }: { operacoes: OperacaoItem[] }) {
  const router = useRouter();
  const [operacoes, setOperacoes] = useState(operacoesInicial);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [operacaoRejeitar, setOperacaoRejeitar] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAprovar = async (id: string) => {
    if (!confirm('Confirmar aprovação desta operação?')) return;
    setLoading(id);
    try {
      await aprovarOperacao(id);
      setOperacoes(operacoes.filter((op) => op.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao aprovar operação.');
    } finally {
      setLoading(null);
    }
  };

  const handleRejeitar = async () => {
    if (!operacaoRejeitar || !motivoRejeicao.trim()) { alert('Informe o motivo da rejeição'); return; }
    setLoading(operacaoRejeitar);
    try {
      await rejeitarOperacao(operacaoRejeitar, motivoRejeicao);
      setOperacoes(operacoes.filter((op) => op.id !== operacaoRejeitar));
      setOperacaoRejeitar(null);
      setMotivoRejeicao('');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao rejeitar operação.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações de Operações</h1>
        <p className="text-slate-400">Operações financeiras aguardando aprovação</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Aguardando Aprovação</p>
          <p className="text-2xl font-bold text-amber-400">{operacoes.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total em Aprovação</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(operacoes.reduce((s, op) => s + op.valorTotalOrdens, 0))}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Deságio Total Projetado</p>
          <p className="text-xl font-bold text-orange-400 font-mono">{formatCurrency(operacoes.reduce((s, op) => s + op.valorDesagio, 0))}</p>
        </div>
      </div>

      {/* Lista */}
      {operacoes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Nenhuma operação aguardando aprovação</p>
        </div>
      ) : (
        <div className="space-y-4">
          {operacoes.map((op) => (
            <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {op.tipo === 'A_PERFORMAR' ? <PlayCircle className="w-5 h-5 text-blue-400" /> : op.tipo === 'PERFORMADA' ? <TrendingUp className="w-5 h-5 text-purple-400" /> : <DollarSign className="w-5 h-5 text-amber-400" />}
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${op.tipo === 'A_PERFORMAR' ? 'bg-blue-900 text-blue-400' : op.tipo === 'PERFORMADA' ? 'bg-purple-900 text-purple-400' : 'bg-amber-900 text-amber-400'}`}>
                      {getLabelTipo(op.tipo)}
                    </span>
                    <span className="text-amber-400 bg-amber-900 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Em Aprovação
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{op.codigo}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="w-4 h-4" />
                    <span>{op.construtoraNome}</span>
                    <span className="text-slate-600">•</span>
                    <span>{op.obraCodigo} - {op.obraNome.substring(0, 50)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-[11px] px-2 py-1 rounded border ${classeStatusAprovacao(op.aprovacaoFundoStatus)}`}>
                      Fundo: {op.aprovacaoFundoStatus}
                    </span>
                    {op.exigeAprovacaoFiador && (
                      <span className={`text-[11px] px-2 py-1 rounded border ${classeStatusAprovacao(op.aprovacaoFiadorStatus)}`}>
                        Fiador: {op.aprovacaoFiadorStatus}
                      </span>
                    )}
                  </div>
                  {op.credores.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">Credores: {op.credores.join(', ')}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">Solicitado em: {formatDate(op.dataSolicitacao)}</p>
                </div>
                <div className="ml-6 text-right">
                  <p className="text-xs text-slate-400 mb-1">Valor Total</p>
                  <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(op.valorTotalOrdens)}</p>
                  <p className="text-xs text-orange-400 mt-1">Deságio: {formatCurrency(op.valorDesagio)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <Link href={`/fin/operacoes/solicitacoes/${op.construtoraId}/${op.id}`}
                  className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors">
                  Ver Detalhes
                </Link>
                <button onClick={() => { setOperacaoRejeitar(op.id); setMotivoRejeicao(''); }}
                  disabled={loading === op.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900 text-red-400 text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </button>
                <button onClick={() => handleAprovar(op.id)}
                  disabled={loading === op.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" />
                  {loading === op.id ? 'Aprovando...' : 'Aprovar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Rejeição */}
      {operacaoRejeitar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-red-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Motivo da Rejeição</h2>
            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setOperacaoRejeitar(null)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Cancelar
              </button>
              <button onClick={handleRejeitar} disabled={!motivoRejeicao.trim() || loading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" />
                {loading ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
