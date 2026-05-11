'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, FileText, PlayCircle, TrendingUp, DollarSign,
  QrCode, Banknote, Barcode, CreditCard, Edit2, Send, Trash2,
  AlertTriangle, Save, X, CheckCircle, Clock, XCircle, Receipt,
  Eye, BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import {
  enviarParaAprovacao,
  excluirOperacao,
  atualizarOperacaoBasica,
  excluirOrdemPagamento,
  atualizarOrdemCompleta,
} from '@/app/actions/operacoes';
import OrdemPagamentoModal, { type OrdemDetalhes } from './OrdemPagamentoModal';
import NovoPagamentoModal, { type PagamentoInitialData, type PagamentoConfirmado } from '@/app/components/NovoPagamentoModal';

// ── tipos ──────────────────────────────────────────────────────────────────
export type AncestorItem = { codigo: string; discriminacao: string };

export type OperacaoDetalhes = {
  id: string;
  codigo: string;
  tipo: string;
  statusWorkflow: string;
  statusFinanceiro: string;
  dataReferencia: string;
  dataSolicitacao: string;
  dataFinalizacao: string | null;
  dataAprovacao: string | null;
  dataRejeicao: string | null;
  valorTotalOrdens: string;
  taxaJurosMensal: string;
  taxaAdministrativa: string;
  jurosProjetados: string;
  taxasAdministrativas: string;
  valorDesagio: string;
  valorBruto: string;
  percentualDesagio: string;
  observacoes: string | null;
  motivoRejeicao: string | null;
  nfNumero: string | null;
  nfDataEmissao: string | null;
  nfValorBruto: string | null;
  nfRetencoes: string | null;
  nfReferencia: string | null;
  saldoPerformadoConsumido: string | null;
  obra: { id: string; codigo: string; nome: string };
  construtora: { id: string; razaoSocial: string };
  aprovador: { id: string; nome: string } | null;
  ordens: OrdemDetalhes[];
};

// ── helpers ────────────────────────────────────────────────────────────────
function getLabelTipo(tipo: string) {
  switch (tipo) {
    case 'A_PERFORMAR': return 'À Performar';
    case 'PERFORMADA': return 'Performada';
    case 'SALDO_PERFORMADO': return 'Saldo Performado';
    default: return tipo;
  }
}

function getLabelWorkflow(status: string) {
  switch (status) {
    case 'EM_EDICAO': return 'Em Edição';
    case 'FINALIZADA': return 'Finalizada';
    case 'EM_APROVACAO_TECNICA': return 'Em Aprovação Técnica';
    case 'EM_APROVACAO_FINANCEIRA': return 'Em Aprovação Financeira';
    case 'APROVADA': return 'Aprovada';
    case 'REJEITADA': return 'Rejeitada';
    default: return status;
  }
}

function getWorkflowBadgeClass(status: string) {
  switch (status) {
    case 'EM_EDICAO': return 'bg-blue-900/60 text-blue-300 border border-blue-700';
    case 'FINALIZADA': return 'bg-slate-700 text-slate-300 border border-slate-600';
    case 'EM_APROVACAO_TECNICA': return 'bg-amber-900/60 text-amber-300 border border-amber-700';
    case 'EM_APROVACAO_FINANCEIRA': return 'bg-amber-900/60 text-amber-300 border border-amber-700';
    case 'APROVADA': return 'bg-green-900/60 text-green-300 border border-green-700';
    case 'REJEITADA': return 'bg-red-900/60 text-red-300 border border-red-700';
    default: return 'bg-slate-700 text-slate-300';
  }
}

function getLabelDoc(tipo: string, nomeCustom?: string | null) {
  if (nomeCustom) return nomeCustom;
  switch (tipo) {
    case 'NOTA_FISCAL': return 'Nota Fiscal';
    case 'PEDIDO_COMPRA': return 'Pedido de Compra';
    case 'CONTRATO': return 'Contrato';
    case 'RECIBO': return 'Recibo';
    default: return tipo || 'Outro';
  }
}

function getLabelPagamento(tipo: string) {
  switch (tipo) {
    case 'PIX': return 'PIX';
    case 'TED': return 'TED';
    case 'BOLETO': return 'Boleto';
    case 'CARTAO': return 'Cartão';
    default: return tipo;
  }
}

function PagamentoIcon({ tipo }: { tipo: string }) {
  switch (tipo) {
    case 'PIX': return <QrCode className="w-4 h-4" />;
    case 'TED': return <Banknote className="w-4 h-4" />;
    case 'BOLETO': return <Barcode className="w-4 h-4" />;
    default: return <CreditCard className="w-4 h-4" />;
  }
}

function toDateInput(iso: string | null | undefined) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function formatValorInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return (parseInt(digits) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseValorInput(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

// ── tooltip de apropriações ────────────────────────────────────────────────
function getLabelSubcat(sub: string | null) {
  switch (sub) {
    case 'MATERIAL': return 'Material';
    case 'MAO_OBRA_SUB': return 'MO Sub.';
    case 'CONTRATOS': return 'Contratos';
    case 'EQUIP_FRETE': return 'Equip./Frete';
    default: return '';
  }
}

type ApropriacaoItem = OrdemDetalhes['apropriacoesOrcamentarias'][0];

function ApropriacaoTooltip({ apropriacoes }: { apropriacoes: ApropriacaoItem[] }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (apropriacoes.length === 0) {
    return <span className="text-slate-600 text-xs italic">—</span>;
  }

  const primeiros = apropriacoes.slice(0, 2);

  const handleMouseEnter = () => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const spaceRight = window.innerWidth - rect.left;
    const left = spaceRight < tooltipWidth + 16 ? rect.right - tooltipWidth : rect.left;
    setPos({ top: rect.bottom + 6, left });
  };

  const handleMouseLeave = () => setPos(null);

  return (
    <>
      <div
        ref={wrapRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-1.5 cursor-default w-full"
      >
        <BarChart3 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="min-w-0">
          {primeiros.map((ap, i) => (
            <div key={i} className="flex items-center gap-1 flex-wrap">
              <span className={`text-xs px-1 py-0.5 rounded flex-shrink-0 ${ap.tipoCusto === 'INDIRETO' ? 'bg-orange-900/40 text-orange-300' : 'bg-blue-900/40 text-blue-300'}`}>
                {ap.tipoCusto === 'INDIRETO' ? 'Ind.' : 'Dir.'}
              </span>
              <span className="text-slate-300 text-xs font-mono truncate max-w-[120px]">
                {ap.tipoCusto === 'INDIRETO'
                  ? (ap.itemCustoIndireto?.nome ?? '—')
                  : `${ap.subEtapaCodigo} ${ap.subEtapaDescricao}`}
              </span>
              <span className="text-cyan-400 text-xs font-mono flex-shrink-0">
                {formatPercent(Number(ap.percentual))}
              </span>
            </div>
          ))}
          {apropriacoes.length > 2 && (
            <span className="text-slate-500 text-xs">+{apropriacoes.length - 2} mais</span>
          )}
        </div>
      </div>

      {/* Portal via fixed — escapa qualquer overflow */}
      {pos && (
        <div
          onMouseEnter={() => setPos(pos)}
          onMouseLeave={handleMouseLeave}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 320, zIndex: 9999 }}
          className="bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-3"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Apropriações Orçamentárias
          </p>
          {apropriacoes.map((ap, idx) => {
            const ancestores = (ap as any).ancestores as Array<{ codigo: string; discriminacao: string }> ?? [];
            const subcat = getLabelSubcat(ap.subcategoriaDireta);
            return (
              <div key={idx} className={`rounded-lg overflow-hidden border ${ap.tipoCusto === 'INDIRETO' ? 'border-orange-900/50' : 'border-blue-900/50'}`}>
                <div className={`px-2 py-1 flex items-center justify-between ${ap.tipoCusto === 'INDIRETO' ? 'bg-orange-950/50' : 'bg-blue-950/50'}`}>
                  <span className={`text-xs font-semibold ${ap.tipoCusto === 'INDIRETO' ? 'text-orange-300' : 'text-blue-300'}`}>
                    {ap.tipoCusto === 'INDIRETO' ? 'Custo Indireto' : 'Custo Direto'}
                  </span>
                  <span className="text-cyan-400 font-mono text-xs font-bold">
                    {formatPercent(Number(ap.percentual))}
                  </span>
                </div>
                <div className="px-2 py-2 bg-slate-900 space-y-0.5">
                  {ap.tipoCusto === 'DIRETO' ? (
                    <>
                      {ancestores.map((anc, i) => (
                        <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: `${i * 10}px` }}>
                          <span className="text-slate-600 text-xs select-none flex-shrink-0">{i === 0 ? '┬' : '├'}</span>
                          <span className="font-mono text-xs text-slate-500 flex-shrink-0">{anc.codigo}</span>
                          <span className="text-slate-400 text-xs">{anc.discriminacao}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5" style={{ paddingLeft: `${ancestores.length * 10}px` }}>
                        <span className="text-slate-500 text-xs select-none flex-shrink-0">└</span>
                        <span className="font-mono text-xs font-bold text-blue-400 flex-shrink-0">{ap.subEtapaCodigo}</span>
                        <span className="text-white text-xs font-semibold">{ap.subEtapaDescricao}</span>
                      </div>
                      {subcat && (
                        <div style={{ paddingLeft: `${(ancestores.length + 1) * 10 + 6}px` }}>
                          <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">{subcat}</span>
                        </div>
                      )}
                      {Number(ap.percentualComprado) > 0 && (
                        <div style={{ paddingLeft: `${(ancestores.length + 1) * 10 + 6}px` }}>
                          <span className="text-xs text-slate-500">{formatPercent(Number(ap.percentualComprado))} comprado</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-white text-xs font-semibold">{ap.itemCustoIndireto?.nome ?? '—'}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── componente principal ───────────────────────────────────────────────────
export default function OperacaoDetalhesClient({
  operacao,
  construtoraId,
}: {
  operacao: OperacaoDetalhes;
  construtoraId: string;
}) {
  const router = useRouter();
  const podeEditar = operacao.statusWorkflow === 'EM_EDICAO';
  const podeEnviar = operacao.statusWorkflow === 'EM_EDICAO';
  const statusFinanceiroVisivel = operacao.statusWorkflow !== 'EM_EDICAO';

  const [editMode, setEditMode] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);
  const [erro, setErro] = useState('');

  // Modal de detalhes da ordem
  const [ordemModalAberta, setOrdemModalAberta] = useState<OrdemDetalhes | null>(null);
  // Modal de edição completa da ordem (NovoPagamentoModal)
  const [ordemEditando, setOrdemEditando] = useState<OrdemDetalhes | null>(null);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);
  // Confirmação de exclusão inline de ordem
  const [confirmarExcluirOrdemId, setConfirmarExcluirOrdemId] = useState<string | null>(null);
  const [excluindoOrdem, setExcluindoOrdem] = useState(false);

  // Campos de edição da operação
  const [dataReferencia, setDataReferencia] = useState(toDateInput(operacao.dataReferencia));
  const [observacoes, setObservacoes] = useState(operacao.observacoes ?? '');
  const [nfNumero, setNfNumero] = useState(operacao.nfNumero ?? '');
  const [nfDataEmissao, setNfDataEmissao] = useState(toDateInput(operacao.nfDataEmissao));
  const [nfValorBrutoStr, setNfValorBrutoStr] = useState(
    operacao.nfValorBruto
      ? Number(operacao.nfValorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  );
  const [nfRetencoesStr, setNfRetencoesStr] = useState(
    operacao.nfRetencoes
      ? Number(operacao.nfRetencoes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  );
  const [nfReferencia, setNfReferencia] = useState(operacao.nfReferencia ?? '');

  const nfValorBruto = parseValorInput(nfValorBrutoStr);
  const nfRetencoes = parseValorInput(nfRetencoesStr);
  const nfLiquido = Math.max(0, nfValorBruto - nfRetencoes);

  const tipoColor = {
    A_PERFORMAR: { text: 'text-blue-400', border: 'border-blue-800', bg: 'bg-blue-900/30' },
    PERFORMADA: { text: 'text-purple-400', border: 'border-purple-800', bg: 'bg-purple-900/30' },
    SALDO_PERFORMADO: { text: 'text-amber-400', border: 'border-amber-800', bg: 'bg-amber-900/30' },
  }[operacao.tipo] ?? { text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900/30' };

  const totalOrdens = operacao.ordens.reduce((s, o) => s + Number(o.valorTotal), 0);
  const totalDevedor =
    Number(operacao.valorTotalOrdens) +
    Number(operacao.jurosProjetados) +
    Number(operacao.taxasAdministrativas);

  // ── handlers da operação ──────────────────────────────────────────────────

  const handleSalvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      await atualizarOperacaoBasica(operacao.id, {
        dataReferencia: dataReferencia || undefined,
        observacoes: observacoes.trim() || null,
        ...(operacao.tipo === 'PERFORMADA'
          ? {
              nfNumero: nfNumero.trim() || null,
              nfDataEmissao: nfDataEmissao || null,
              nfValorBruto: nfValorBruto > 0 ? nfValorBruto : null,
              nfRetencoes: nfRetencoes >= 0 ? nfRetencoes : null,
              nfReferencia: nfReferencia.trim() || null,
            }
          : {}),
      });
      setEditMode(false);
      router.refresh();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleEnviar = async () => {
    setEnviando(true);
    setConfirmarEnvio(false);
    setErro('');
    try {
      await enviarParaAprovacao(operacao.id);
      router.refresh();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar para aprovação');
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    setExcluindo(true);
    setConfirmarExcluir(false);
    setErro('');
    try {
      await excluirOperacao(operacao.id);
      router.push(`/fin/operacoes/solicitacoes/${construtoraId}`);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir');
      setExcluindo(false);
    }
  };

  const handleCancelarEdicao = () => {
    setDataReferencia(toDateInput(operacao.dataReferencia));
    setObservacoes(operacao.observacoes ?? '');
    setNfNumero(operacao.nfNumero ?? '');
    setNfDataEmissao(toDateInput(operacao.nfDataEmissao));
    setNfValorBrutoStr(
      operacao.nfValorBruto
        ? Number(operacao.nfValorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setNfRetencoesStr(
      operacao.nfRetencoes
        ? Number(operacao.nfRetencoes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setNfReferencia(operacao.nfReferencia ?? '');
    setEditMode(false);
    setErro('');
  };

  // ── handlers de ordem individual ─────────────────────────────────────────

  const handleExcluirOrdem = async (ordemId: string) => {
    await excluirOrdemPagamento(ordemId);
    router.refresh();
  };

  const handleExcluirOrdemInline = async () => {
    if (!confirmarExcluirOrdemId) return;
    setExcluindoOrdem(true);
    try {
      await excluirOrdemPagamento(confirmarExcluirOrdemId);
      setConfirmarExcluirOrdemId(null);
      router.refresh();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir ordem');
    } finally {
      setExcluindoOrdem(false);
    }
  };

  // Converte dados da OrdemDetalhes para o formato PagamentoInitialData do modal
  const ordemParaInitialData = (ordem: OrdemDetalhes): PagamentoInitialData => ({
    credorId: ordem.credor?.id ?? '',
    tipoDocumento: ordem.tipoDocumentoNome ?? ordem.tipoDocumento,
    numeroDocumento: ordem.numeroDocumento,
    valorTotal: Number(ordem.valorTotal),
    tipoPagamento: ordem.tipoPagamento,
    codigoBarras: ordem.codigoBarras ?? '',
    observacoes: ordem.observacoes ?? '',
    apropriacoesOrcamentarias: ordem.apropriacoesOrcamentarias.map((ap) => ({
      tipoCusto: ap.tipoCusto as 'DIRETO' | 'INDIRETO',
      subEtapaId: ap.itemVisaoGerencialId ?? '',
      subEtapaCode: ap.subEtapaCodigo,
      subEtapaDescription: ap.subEtapaDescricao,
      etapa: ap.etapaNome,
      subcategoriaDireta: ap.subcategoriaDireta ?? '',
      percentualComprado: Number(ap.percentualComprado).toFixed(2).replace('.', ','),
      itemCustoIndiretoId: ap.itemCustoIndireto?.id ?? '',
      itemCustoIndiretoNome: ap.itemCustoIndireto?.nome ?? '',
      tipoValor: 'percentual' as const,
      percentual: Number(ap.percentual).toFixed(2).replace('.', ','),
      valor: '0',
    })),
  });

  const handleConfirmarEdicaoOrdem = async (pagamento: PagamentoConfirmado) => {
    if (!ordemEditando) return;
    setSalvandoOrdem(true);
    try {
      await atualizarOrdemCompleta(ordemEditando.id, {
        credorId: pagamento.credorId || null,
        tipoDocumento: pagamento.tipoDocumento,
        tipoDocumentoNome: pagamento.tipoDocumento,
        numeroDocumento: pagamento.numeroDocumento,
        valorTotal: pagamento.valorTotal,
        tipoPagamento: pagamento.tipoPagamento,
        codigoBarras: pagamento.codigoBarras ?? null,
        observacoes: pagamento.observacoes ?? null,
        apropriacoesOrcamentarias: pagamento.apropriacoesOrcamentarias.map((ap) => ({
          subEtapaCodigo: ap.subEtapaCode,
          subEtapaDescricao: ap.subEtapaDescription,
          etapaNome: ap.etapa,
          percentual: parseFloat(String(ap.percentual).replace(',', '.')) || 0,
          valor: parseFloat(String(ap.valor).replace(',', '.')) || 0,
          itemVisaoGerencialId: ap.tipoCusto === 'DIRETO' ? (ap.subEtapaId || null) : null,
          percentualComprado: ap.tipoCusto === 'DIRETO' ? (parseFloat(String(ap.percentualComprado || '0').replace(',', '.')) || 0) : 0,
          tipoCusto: ap.tipoCusto,
          subcategoriaDireta: ap.tipoCusto === 'DIRETO' ? (ap.subcategoriaDireta || null) : null,
          itemCustoIndiretoId: ap.tipoCusto === 'INDIRETO' ? (ap.itemCustoIndiretoId || null) : null,
        })),
      });

      // Upload de novos arquivos (se houver)
      if (pagamento.documentos.length > 0) {
        const form = new FormData();
        pagamento.documentos.forEach((f) => form.append('arquivos', f));
        await fetch(`/api/ordens-pagamento/${ordemEditando.id}/documentos`, {
          method: 'POST',
          body: form,
        });
      }

      setOrdemEditando(null);
      router.refresh();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar ordem');
    } finally {
      setSalvandoOrdem(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/fin/operacoes/solicitacoes/${construtoraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className={`w-8 h-8 ${tipoColor.text}`} />
            <div>
              <h1 className="text-2xl font-bold text-white">Operação {operacao.codigo}</h1>
              <p className="text-slate-400 text-sm">
                Obra: {operacao.obra.codigo} — {operacao.obra.nome}
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {podeEditar && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={handleCancelarEdicao}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </>
          )}
          {podeEnviar && !editMode && (
            <button
              onClick={() => setConfirmarEnvio(true)}
              disabled={enviando}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {enviando ? 'Enviando...' : 'Enviar para Aprovação'}
            </button>
          )}
          {podeEditar && !editMode && (
            <button
              onClick={() => setConfirmarExcluir(true)}
              disabled={excluindo}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/50 text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition-colors text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-6 flex items-center gap-3 bg-red-950/40 border border-red-700 rounded-lg p-4 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Faixa de status em edição */}
      {editMode && (
        <div className="mb-6 flex items-center gap-3 bg-blue-950/30 border border-blue-700 rounded-lg p-4 text-blue-300 text-sm">
          <Edit2 className="w-4 h-4 flex-shrink-0" />
          Modo edição ativo — altere os campos desejados e clique em{' '}
          <strong>Salvar Alterações</strong>. As ordens de pagamento também podem ser editadas individualmente.
        </div>
      )}

      {/* Informações Gerais */}
      <div className={`bg-slate-900 border ${tipoColor.border} rounded-lg p-6 mb-6`}>
        <h2 className="text-lg font-bold text-white mb-4">Informações Gerais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo</label>
            <div className={`flex items-center gap-1.5 px-2 py-1.5 ${tipoColor.bg} rounded-lg`}>
              {operacao.tipo === 'A_PERFORMAR' ? (
                <PlayCircle className={`w-4 h-4 ${tipoColor.text}`} />
              ) : operacao.tipo === 'PERFORMADA' ? (
                <TrendingUp className={`w-4 h-4 ${tipoColor.text}`} />
              ) : (
                <DollarSign className={`w-4 h-4 ${tipoColor.text}`} />
              )}
              <span className={`font-semibold text-sm ${tipoColor.text}`}>
                {getLabelTipo(operacao.tipo)}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Código</label>
            <p className="text-white font-mono font-semibold">{operacao.codigo}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status Workflow</label>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getWorkflowBadgeClass(operacao.statusWorkflow)}`}>
              {operacao.statusWorkflow === 'EM_EDICAO' && <Edit2 className="w-3 h-3" />}
              {(operacao.statusWorkflow === 'EM_APROVACAO_TECNICA' || operacao.statusWorkflow === 'EM_APROVACAO_FINANCEIRA') && <Clock className="w-3 h-3" />}
              {operacao.statusWorkflow === 'APROVADA' && <CheckCircle className="w-3 h-3" />}
              {operacao.statusWorkflow === 'REJEITADA' && <XCircle className="w-3 h-3" />}
              {getLabelWorkflow(operacao.statusWorkflow)}
            </span>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status Financeiro</label>
            {statusFinanceiroVisivel ? (
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                operacao.statusFinanceiro === 'LIQUIDADO'
                  ? 'bg-green-900/60 text-green-300 border border-green-700'
                  : operacao.statusFinanceiro === 'VENCIDO'
                    ? 'bg-red-900/60 text-red-300 border border-red-700'
                    : 'bg-orange-900/60 text-orange-300 border border-orange-700'
              }`}>
                {operacao.statusFinanceiro === 'LIQUIDADO' ? 'Liquidado' : operacao.statusFinanceiro === 'VENCIDO' ? 'Vencido' : 'Aberto'}
              </span>
            ) : (
              <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                Aguardando Aprovação
              </span>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data de Solicitação</label>
            <p className="text-white text-sm">{formatDate(operacao.dataSolicitacao)}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Data de Referência</label>
            {editMode ? (
              <input
                type="date"
                value={dataReferencia}
                onChange={(e) => setDataReferencia(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
              />
            ) : (
              <p className="text-white text-sm">{formatDate(operacao.dataReferencia)}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Valor Total Ordens</label>
            <p className="text-green-400 font-mono font-semibold">
              {formatCurrency(Number(operacao.valorTotalOrdens))}
            </p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Total Devedor</label>
            <p className="text-amber-400 font-mono font-semibold">
              {formatCurrency(totalDevedor)}
            </p>
          </div>
          {operacao.saldoPerformadoConsumido && Number(operacao.saldoPerformadoConsumido) > 0 && (
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Saldo Performado Abatido</label>
              <p className="text-emerald-400 font-mono font-semibold">
                {formatCurrency(Number(operacao.saldoPerformadoConsumido))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dados da NF (Performada) */}
      {operacao.tipo === 'PERFORMADA' && (
        <div className="bg-slate-900 border border-purple-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-400" />
            Dados da Nota Fiscal
          </h2>
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Número da NF</label>
                  <input
                    type="text"
                    value={nfNumero}
                    onChange={(e) => setNfNumero(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    value={nfDataEmissao}
                    onChange={(e) => setNfDataEmissao(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Bruto</label>
                  <input
                    type="text"
                    value={nfValorBrutoStr}
                    onChange={(e) => setNfValorBrutoStr(formatValorInput(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Retenções</label>
                  <input
                    type="text"
                    value={nfRetencoesStr}
                    onChange={(e) => setNfRetencoesStr(formatValorInput(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-950/20 border border-green-800/50 rounded-lg p-3">
                <span className="text-slate-400 text-sm">Valor Líquido:</span>
                <span className="text-green-400 font-mono font-bold">{formatCurrency(nfLiquido)}</span>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Referência do reajuste (se aplicável)</label>
                <input
                  type="text"
                  value={nfReferencia}
                  onChange={(e) => setNfReferencia(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {operacao.nfNumero && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Número da NF</label>
                  <p className="text-white font-mono">{operacao.nfNumero}</p>
                </div>
              )}
              {operacao.nfDataEmissao && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data de Emissão</label>
                  <p className="text-white text-sm">{formatDate(operacao.nfDataEmissao)}</p>
                </div>
              )}
              {operacao.nfValorBruto && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Bruto</label>
                  <p className="text-white font-mono">{formatCurrency(Number(operacao.nfValorBruto))}</p>
                </div>
              )}
              {operacao.nfRetencoes && Number(operacao.nfRetencoes) > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Retenções</label>
                  <p className="text-red-400 font-mono">− {formatCurrency(Number(operacao.nfRetencoes))}</p>
                </div>
              )}
              {operacao.nfValorBruto && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Líquido</label>
                  <p className="text-green-400 font-mono font-semibold">
                    {formatCurrency(
                      Math.max(0, Number(operacao.nfValorBruto) - Number(operacao.nfRetencoes ?? 0))
                    )}
                  </p>
                </div>
              )}
              {operacao.nfReferencia && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Referência</label>
                  <p className="text-slate-300 text-sm">{operacao.nfReferencia}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Encargos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Encargos Projetados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Taxa Juros Mensal', value: formatPercent(Number(operacao.taxaJurosMensal) * 100), color: 'text-cyan-400' },
            { label: 'Taxa Administrativa', value: formatPercent(Number(operacao.taxaAdministrativa) * 100), color: 'text-cyan-400' },
            { label: 'Juros Projetados', value: formatCurrency(Number(operacao.jurosProjetados)), color: 'text-orange-400' },
            { label: 'Taxas Administrativas', value: formatCurrency(Number(operacao.taxasAdministrativas)), color: 'text-orange-400' },
            { label: 'Valor Deságio', value: formatCurrency(Number(operacao.valorDesagio)), color: 'text-orange-400' },
            { label: '% Deságio', value: formatPercent(Number(operacao.percentualDesagio)), color: 'text-orange-400' },
            { label: 'Valor Bruto', value: formatCurrency(Number(operacao.valorBruto)), color: 'text-green-400' },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 rounded-lg p-3">
              <label className="block text-xs text-slate-400 mb-1">{item.label}</label>
              <p className={`font-mono font-semibold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ordens de Pagamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Ordens de Pagamento
            {operacao.ordens.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                ({operacao.ordens.length} {operacao.ordens.length === 1 ? 'ordem' : 'ordens'})
              </span>
            )}
          </h2>
          {editMode && (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Edit2 className="w-3 h-3" /> Clique em uma ordem para editar ou excluir
            </span>
          )}
        </div>

        {operacao.ordens.length === 0 ? (
          <p className="text-slate-500 text-sm italic">Nenhuma ordem de pagamento registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700 text-left px-3 py-2 text-xs text-slate-400">Documento</th>
                  <th className="bg-slate-900 border-b border-slate-700 text-left px-3 py-2 text-xs text-slate-400">Credor</th>
                  <th className="bg-slate-900 border-b border-slate-700 text-right px-3 py-2 text-xs text-slate-400">Valor</th>
                  <th className="bg-slate-900 border-b border-slate-700 text-left px-3 py-2 text-xs text-slate-400">Pagamento</th>
                  <th className="bg-slate-900 border-b border-slate-700 text-left px-3 py-2 text-xs text-slate-400">Apropriação</th>
                  <th className="bg-slate-900 border-b border-slate-700 text-center px-3 py-2 text-xs text-slate-400">{editMode ? 'Ações' : 'Detalhes'}</th>
                </tr>
              </thead>
              <tbody>
                {operacao.ordens.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 flex-shrink-0 ${tipoColor.text}`} />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {getLabelDoc(ordem.tipoDocumento, ordem.tipoDocumentoNome)}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{ordem.numeroDocumento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-b border-slate-800">
                      {ordem.credor ? (
                        <>
                          <p className="text-white text-sm font-medium">{ordem.credor.nome}</p>
                          <p className="text-xs text-slate-400 font-mono">{ordem.credor.cpfCnpj}</p>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm italic">—</p>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-slate-800 text-right">
                      <p className="text-green-400 font-mono font-semibold text-sm">
                        {formatCurrency(Number(ordem.valorTotal))}
                      </p>
                    </td>
                    <td className="px-3 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                        <PagamentoIcon tipo={ordem.tipoPagamento} />
                        {getLabelPagamento(ordem.tipoPagamento)}
                      </div>
                    </td>
                    <td className="px-3 py-3 border-b border-slate-800">
                      <ApropriacaoTooltip apropriacoes={ordem.apropriacoesOrcamentarias} />
                    </td>
                    <td className="px-3 py-3 border-b border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => editMode ? setOrdemEditando(ordem) : setOrdemModalAberta(ordem)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            editMode
                              ? 'bg-blue-700 text-white hover:bg-blue-600'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }`}
                        >
                          {editMode ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {editMode ? 'Editar' : 'Detalhes'}
                        </button>
                        {editMode && (
                          <button
                            onClick={() => setConfirmarExcluirOrdemId(ordem.id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-red-900/40 text-red-400 border border-red-800 rounded-lg hover:bg-red-900/70 text-xs transition-colors"
                            title="Excluir ordem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800">
                  <td colSpan={2} className="px-3 py-3 text-right text-white font-semibold text-sm">
                    Total das Ordens:
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-green-400 font-mono font-bold">{formatCurrency(totalOrdens)}</span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-3">Observações</h2>
        {editMode ? (
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Informações adicionais..."
            className="w-full px-3 py-2 bg-slate-800 border border-blue-600 rounded-lg text-white text-sm focus:outline-none resize-none"
          />
        ) : (
          <p className="text-slate-300 text-sm">
            {operacao.observacoes || <span className="text-slate-500 italic">Nenhuma observação</span>}
          </p>
        )}
      </div>

      {/* Aprovação / Rejeição */}
      {operacao.dataAprovacao && (
        <div className="bg-slate-900 border border-green-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Aprovação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Data de Aprovação</label>
              <p className="text-white">{formatDate(operacao.dataAprovacao)}</p>
            </div>
            {operacao.aprovador && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Aprovador</label>
                <p className="text-white">{operacao.aprovador.nome}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {operacao.motivoRejeicao && (
        <div className="bg-slate-900 border border-red-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5" /> Motivo de Rejeição
          </h2>
          <p className="text-slate-300">{operacao.motivoRejeicao}</p>
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between">
        <Link
          href={`/fin/operacoes/solicitacoes/${construtoraId}`}
          className="px-5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
          Voltar
        </Link>
        {podeEnviar && !editMode && (
          <button
            onClick={() => setConfirmarEnvio(true)}
            disabled={enviando}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Enviar para Aprovação
          </button>
        )}
      </div>

      {/* Modal de detalhes da ordem */}
      {ordemModalAberta && (
        <OrdemPagamentoModal
          ordem={ordemModalAberta}
          editavel={editMode}
          onClose={() => setOrdemModalAberta(null)}
          onEditar={(ordem) => {
            setOrdemModalAberta(null);
            setOrdemEditando(ordem);
          }}
          onExcluir={handleExcluirOrdem}
        />
      )}

      {/* Modal de edição completa da ordem */}
      {ordemEditando && (
        <NovoPagamentoModal
          isOpen={true}
          onClose={() => setOrdemEditando(null)}
          obraId={operacao.obra.id}
          construtoraId={construtoraId}
          titulo={`Editar Ordem — ${ordemEditando.numeroDocumento}`}
          initialData={ordemParaInitialData(ordemEditando)}
          onConfirm={handleConfirmarEdicaoOrdem}
        />
      )}

      {/* Modal confirmar exclusão inline de ordem */}
      {confirmarExcluirOrdemId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold text-white">Excluir Ordem?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-2">
              O valor desta ordem será removido do total da operação e os encargos serão recalculados.
            </p>
            <p className="text-red-400 text-xs mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmarExcluirOrdemId(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirOrdemInline}
                disabled={excluindoOrdem}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {excluindoOrdem ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar envio */}
      {confirmarEnvio && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Send className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-bold text-white">Enviar para Aprovação?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              A operação <strong>{operacao.codigo}</strong> será enviada para análise e aprovação.
              Após envio, não será possível editar ou excluir.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmarEnvio(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Send className="w-4 h-4" />
                Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {confirmarExcluir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold text-white">Excluir Operação?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-2">
              Tem certeza que deseja excluir a operação{' '}
              <strong className="text-white">{operacao.codigo}</strong>?
            </p>
            <p className="text-red-400 text-sm mb-6">
              Esta ação não pode ser desfeita. Todas as ordens de pagamento vinculadas também serão
              removidas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmarExcluir(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
