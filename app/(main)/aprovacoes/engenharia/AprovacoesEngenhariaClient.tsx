'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  FileText,
  Hammer,
  ExternalLink,
  Receipt,
  HardHat,
} from 'lucide-react';
import { aprovarMedicao, rejeitarMedicao } from '@/app/actions/aprovacoes-eng';
import { aprovarTecnica, rejeitarTecnica } from '@/app/actions/operacoes';

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

interface OperacaoItem {
  id: string;
  codigo: string;
  tipo: 'A_PERFORMAR' | 'PERFORMADA' | 'SALDO_PERFORMADO';
  construtoraId: string;
  construtoraNome: string;
  obraId: string;
  obraCodigo: string;
  obraNome: string;
  dataSolicitacao: string;
  valorTotalOrdens: number;
  valorBruto: number;
  quantidadeOrdens: number;
  credores: string[];
}

type Aba = 'medicoes' | 'operacoes';
type RejeicaoTarget = { tipo: 'medicao' | 'operacao'; id: string } | null;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function labelTipoOperacao(tipo: OperacaoItem['tipo']) {
  switch (tipo) {
    case 'A_PERFORMAR':
      return 'À Performar';
    case 'PERFORMADA':
      return 'Performada';
    case 'SALDO_PERFORMADO':
      return 'Saldo Performado';
  }
}

export default function AprovacoesEngenhariaClient({
  medicoes,
  operacoes,
}: {
  medicoes: MedicaoItem[];
  operacoes: OperacaoItem[];
}) {
  const router = useRouter();
  const [listaMedicoes, setListaMedicoes] = useState(medicoes);
  const [listaOperacoes, setListaOperacoes] = useState(operacoes);
  const [aba, setAba] = useState<Aba>(
    medicoes.length === 0 && operacoes.length > 0 ? 'operacoes' : 'medicoes'
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [rejeitarTarget, setRejeitarTarget] = useState<RejeicaoTarget>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  // -------------- Medicoes --------------
  const handleAprovarMedicao = async (id: string) => {
    if (!confirm('Confirmar aprovação desta medição?')) return;
    setLoading(id);
    try {
      await aprovarMedicao(id);
      setListaMedicoes((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao aprovar medição.');
    } finally {
      setLoading(null);
    }
  };

  // -------------- Operacoes --------------
  const handleAprovarOperacao = async (id: string) => {
    if (!confirm('Confirmar aprovação técnica desta operação?')) return;
    setLoading(id);
    try {
      await aprovarTecnica(id);
      setListaOperacoes((prev) => prev.filter((o) => o.id !== id));
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao aprovar operação.');
    } finally {
      setLoading(null);
    }
  };

  // -------------- Rejeicao unificada --------------
  const handleRejeitar = async () => {
    if (!rejeitarTarget || !motivoRejeicao.trim()) {
      alert('Informe o motivo da rejeição');
      return;
    }
    setLoading(rejeitarTarget.id);
    try {
      if (rejeitarTarget.tipo === 'medicao') {
        await rejeitarMedicao(rejeitarTarget.id, motivoRejeicao);
        setListaMedicoes((prev) => prev.filter((m) => m.id !== rejeitarTarget.id));
      } else {
        await rejeitarTecnica(rejeitarTarget.id, motivoRejeicao);
        setListaOperacoes((prev) => prev.filter((o) => o.id !== rejeitarTarget.id));
      }
      setRejeitarTarget(null);
      setMotivoRejeicao('');
      router.refresh();
    } catch (e) {
      console.error(e);
      alert('Erro ao rejeitar item.');
    } finally {
      setLoading(null);
    }
  };

  const valorTotalAba =
    aba === 'medicoes'
      ? listaMedicoes.reduce((s, m) => s + m.valorMedido, 0)
      : listaOperacoes.reduce((s, o) => s + o.valorTotalOrdens, 0);

  const qtdAba = aba === 'medicoes' ? listaMedicoes.length : listaOperacoes.length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Hammer className="w-7 h-7 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Aprovações Técnicas</h1>
        </div>
        <p className="text-slate-400">
          Medições e operações aguardando aprovação da equipe Pontte
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setAba('medicoes')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              aba === 'medicoes'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <HardHat className="w-4 h-4" />
            Medições
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                aba === 'medicoes' ? 'bg-blue-900 text-blue-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {listaMedicoes.length}
            </span>
          </button>
          <button
            onClick={() => setAba('operacoes')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
              aba === 'operacoes'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Operações
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                aba === 'operacoes' ? 'bg-blue-900 text-blue-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {listaOperacoes.length}
            </span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">
            {aba === 'medicoes' ? 'Medições aguardando' : 'Operações aguardando'}
          </p>
          <p className="text-2xl font-bold text-amber-400">{qtdAba}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor total em análise</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {formatCurrency(valorTotalAba)}
          </p>
        </div>
      </div>

      {/* Lista da aba */}
      {aba === 'medicoes' ? (
        listaMedicoes.length === 0 ? (
          <EmptyState mensagem="Nenhuma medição aguardando aprovação técnica" />
        ) : (
          <div className="space-y-4">
            {listaMedicoes.map((medicao) => (
              <MedicaoCard
                key={medicao.id}
                medicao={medicao}
                loading={loading === medicao.id}
                onAprovar={() => handleAprovarMedicao(medicao.id)}
                onRejeitar={() => {
                  setRejeitarTarget({ tipo: 'medicao', id: medicao.id });
                  setMotivoRejeicao('');
                }}
              />
            ))}
          </div>
        )
      ) : listaOperacoes.length === 0 ? (
        <EmptyState mensagem="Nenhuma operação aguardando aprovação técnica" />
      ) : (
        <div className="space-y-4">
          {listaOperacoes.map((operacao) => (
            <OperacaoCard
              key={operacao.id}
              operacao={operacao}
              loading={loading === operacao.id}
              onAprovar={() => handleAprovarOperacao(operacao.id)}
              onRejeitar={() => {
                setRejeitarTarget({ tipo: 'operacao', id: operacao.id });
                setMotivoRejeicao('');
              }}
            />
          ))}
        </div>
      )}

      {/* Modal de rejeicao */}
      {rejeitarTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-red-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-2">Motivo da Rejeição</h2>
            <p className="text-sm text-slate-400 mb-4">
              {rejeitarTarget.tipo === 'medicao'
                ? 'A construtora será notificada do motivo para correção e reenvio.'
                : 'A operação volta para a construtora com este motivo visível no detalhe.'}
            </p>
            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejeitarTarget(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
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

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function EmptyState({ mensagem }: { mensagem: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
      <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
      <p className="text-slate-400 text-lg">{mensagem}</p>
    </div>
  );
}

function MedicaoCard({
  medicao,
  loading,
  onAprovar,
  onRejeitar,
}: {
  medicao: MedicaoItem;
  loading: boolean;
  onAprovar: () => void;
  onRejeitar: () => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
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
            <span>
              {medicao.obraCodigo} — {medicao.obraNome.substring(0, 50)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Calendar className="w-4 h-4" />
            <span>
              Período: {formatDate(medicao.periodoInicio)} a {formatDate(medicao.periodoFim)}
            </span>
          </div>
        </div>
        <div className="ml-6 text-right">
          <p className="text-xs text-slate-400 mb-1">Valor Medido</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {formatCurrency(medicao.valorMedido)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Acumulado: {formatCurrency(medicao.valorAcumulado)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
        <button
          onClick={onRejeitar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-900 text-red-400 text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          Rejeitar
        </button>
        <button
          onClick={onAprovar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {loading ? 'Aprovando...' : 'Aprovar'}
        </button>
      </div>
    </div>
  );
}

function OperacaoCard({
  operacao,
  loading,
  onAprovar,
  onRejeitar,
}: {
  operacao: OperacaoItem;
  loading: boolean;
  onAprovar: () => void;
  onRejeitar: () => void;
}) {
  const detalheUrl = `/fin/operacoes/solicitacoes/${operacao.construtoraId}/${operacao.id}`;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 bg-amber-900 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Aguardando Aprovação Técnica
            </span>
            <span className="text-blue-400 bg-blue-900/40 border border-blue-800 px-2 py-1 rounded text-xs font-semibold">
              {labelTipoOperacao(operacao.tipo)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-mono">
            Operação {operacao.codigo}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Building2 className="w-4 h-4" />
            <span>{operacao.construtoraNome}</span>
            <span className="text-slate-600">•</span>
            <span>
              {operacao.obraCodigo} — {operacao.obraNome.substring(0, 50)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Calendar className="w-4 h-4" />
            <span>Solicitada em {formatDate(operacao.dataSolicitacao)}</span>
            <span className="text-slate-600">•</span>
            <FileText className="w-4 h-4" />
            <span>
              {operacao.quantidadeOrdens} ord.
              {operacao.credores.length > 0 && ` · ${operacao.credores.slice(0, 3).join(', ')}`}
              {operacao.credores.length > 3 && ` +${operacao.credores.length - 3}`}
            </span>
          </div>
        </div>
        <div className="ml-6 text-right">
          <p className="text-xs text-slate-400 mb-1">Valor das Ordens</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {formatCurrency(operacao.valorTotalOrdens)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Bruto: {formatCurrency(operacao.valorBruto)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <Link
          href={detalheUrl}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver detalhes
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={onRejeitar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-900 text-red-400 text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rejeitar
          </button>
          <button
            onClick={onAprovar}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'Aprovando...' : 'Aprovar'}
          </button>
        </div>
      </div>
    </div>
  );
}
