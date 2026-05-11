'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, Building2, Calendar, FileText, Hammer } from 'lucide-react';
import { aprovarMedicao, rejeitarMedicao } from '@/app/actions/aprovacoes-eng';

interface MedicaoItem {
  id: string;
  numero: number;
  periodoInicio: string;
  periodoFim: string;
  valorMedido: number;
  valorAcumulado: number;
  obraId: string;
  obraCodigo: string;
  obraNome: string;
  construtoraNome: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function AprovacoesEngenhariaClient({ medicoes }: { medicoes: MedicaoItem[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(medicoes);
  const [loading, setLoading] = useState<string | null>(null);
  const [medicaoRejeitar, setMedicaoRejeitar] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  const handleAprovar = async (id: string) => {
    if (!confirm('Confirmar aprovação desta medição?')) return;
    setLoading(id);
    try {
      await aprovarMedicao(id);
      setLista((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch {
      alert('Erro ao aprovar medição.');
    } finally {
      setLoading(null);
    }
  };

  const handleRejeitar = async () => {
    if (!medicaoRejeitar || !motivoRejeicao.trim()) { alert('Informe o motivo da rejeição'); return; }
    setLoading(medicaoRejeitar);
    try {
      await rejeitarMedicao(medicaoRejeitar, motivoRejeicao);
      setLista((prev) => prev.filter((m) => m.id !== medicaoRejeitar));
      setMedicaoRejeitar(null);
      setMotivoRejeicao('');
      router.refresh();
    } catch {
      alert('Erro ao rejeitar medição.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Hammer className="w-7 h-7 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Aprovações Técnicas</h1>
        </div>
        <p className="text-slate-400">Medições e itens técnicos aguardando aprovação da equipe Pontte</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Aguardando Aprovação</p>
          <p className="text-2xl font-bold text-amber-400">{lista.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total em Análise</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {formatCurrency(lista.reduce((s, m) => s + m.valorMedido, 0))}
          </p>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Nenhuma medição aguardando aprovação técnica</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lista.map((medicao) => (
            <div key={medicao.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-400 bg-amber-900 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Aguardando Aprovação Técnica
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Medição #{medicao.numero.toString().padStart(3, '0')}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="w-4 h-4" />
                    <span>{medicao.construtoraNome}</span>
                    <span className="text-slate-600">•</span>
                    <span>{medicao.obraCodigo} — {medicao.obraNome.substring(0, 50)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Período: {formatDate(medicao.periodoInicio)} a {formatDate(medicao.periodoFim)}</span>
                  </div>
                </div>
                <div className="ml-6 text-right">
                  <p className="text-xs text-slate-400 mb-1">Valor Medido</p>
                  <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(medicao.valorMedido)}</p>
                  <p className="text-xs text-slate-500 mt-1">Acumulado: {formatCurrency(medicao.valorAcumulado)}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  onClick={() => { setMedicaoRejeitar(medicao.id); setMotivoRejeicao(''); }}
                  disabled={loading === medicao.id}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900 text-red-400 text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </button>
                <button
                  onClick={() => handleAprovar(medicao.id)}
                  disabled={loading === medicao.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading === medicao.id ? 'Aprovando...' : 'Aprovar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {medicaoRejeitar && (
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
              <button onClick={() => setMedicaoRejeitar(null)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                Cancelar
              </button>
              <button
                onClick={handleRejeitar}
                disabled={!motivoRejeicao.trim() || loading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
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
