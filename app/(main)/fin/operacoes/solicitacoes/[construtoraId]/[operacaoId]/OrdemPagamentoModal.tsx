'use client';

import {
  X, FileText, User, QrCode, Banknote, Barcode, CreditCard,
  Paperclip, Download, ExternalLink, ChevronRight, Trash2, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

// ── tipos ──────────────────────────────────────────────────────────────────
export type DocumentoOrdemItem = {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tipoArquivo: string;
  tamanhoBytes: number;
};

export type OrdemDetalhes = {
  id: string;
  tipoDocumento: string;
  tipoDocumentoNome: string | null;
  numeroDocumento: string;
  valorTotal: string;
  tipoPagamento: string;
  codigoBarras: string | null;
  observacoes: string | null;
  credor: { id: string; nome: string; cpfCnpj: string } | null;
  documentos: DocumentoOrdemItem[];
  apropriacoesOrcamentarias: Array<{
    id: string;
    tipoCusto: string;
    subEtapaCodigo: string;
    subEtapaDescricao: string;
    etapaNome: string;
    percentual: string;
    percentualComprado: string;
    subcategoriaDireta: string | null;
    itemVisaoGerencialId: string | null;
    itemCustoIndireto: { id: string; nome: string } | null;
    /** Níveis ancestrais do item EAP, do mais alto ao mais próximo (sem o item folha) */
    ancestores: Array<{ codigo: string; discriminacao: string }>;
  }>;
};

interface Props {
  ordem: OrdemDetalhes;
  editavel: boolean;
  onClose: () => void;
  onEditar: (ordem: OrdemDetalhes) => void;
  onExcluir: (ordemId: string) => Promise<void>;
}

// ── helpers ────────────────────────────────────────────────────────────────
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLabelSubcategoria(sub: string | null): string {
  switch (sub) {
    case 'MATERIAL': return 'Material';
    case 'MAO_OBRA_SUB': return 'MO Subempreitada';
    case 'CONTRATOS': return 'Contratos (MAT+MO)';
    case 'EQUIP_FRETE': return 'Equipamentos e Fretes';
    default: return '';
  }
}

/**
 * Quebra o código hierárquico "1.1.2.01" em níveis progressivos:
 * ["1", "1.1", "1.1.2", "1.1.2.01"]
 */
function buildCodeLevels(code: string): string[] {
  const parts = code.split('.');
  return parts.map((_, i) => parts.slice(0, i + 1).join('.'));
}

function getFileIcon(tipoArquivo: string): string {
  if (tipoArquivo.includes('pdf')) return '📄';
  if (tipoArquivo.includes('image')) return '🖼️';
  if (tipoArquivo.includes('word') || tipoArquivo.includes('document')) return '📝';
  if (tipoArquivo.includes('excel') || tipoArquivo.includes('spreadsheet')) return '📊';
  return '📎';
}

// ── componente ─────────────────────────────────────────────────────────────
export default function OrdemPagamentoModal({ ordem, editavel, onClose, onEditar, onExcluir }: Props) {
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  const handleExcluir = async () => {
    setExcluindo(true);
    setErro('');
    try {
      await onExcluir(ordem.id);
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao excluir');
      setExcluindo(false);
      setConfirmarExcluir(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-white font-bold">Detalhes da Ordem</h3>
              <p className="text-slate-400 text-xs font-mono">{ordem.numeroDocumento}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editavel && (
              <>
                <button
                  onClick={() => onEditar(ordem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-600 text-xs transition-colors"
                >
                  Editar Ordem
                </button>
                <button
                  onClick={() => setConfirmarExcluir(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 text-red-400 border border-red-800 rounded-lg hover:bg-red-900/60 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors ml-1">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {erro && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          {/* Dados do documento */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Documento</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                <p className="text-white text-sm">{getLabelDoc(ordem.tipoDocumento, ordem.tipoDocumentoNome)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <label className="block text-xs text-slate-500 mb-1">Número</label>
                <p className="text-white text-sm font-mono">{ordem.numeroDocumento}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <label className="block text-xs text-slate-500 mb-1">Valor Total</label>
                <p className="text-green-400 font-mono font-semibold">{formatCurrency(Number(ordem.valorTotal))}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <label className="block text-xs text-slate-500 mb-1">Tipo de Pagamento</label>
                <div className="flex items-center gap-1.5 text-white text-sm">
                  <PagamentoIcon tipo={ordem.tipoPagamento} />
                  {getLabelPagamento(ordem.tipoPagamento)}
                </div>
              </div>
              {ordem.codigoBarras && (
                <div className="col-span-2 bg-slate-800 rounded-lg p-3">
                  <label className="block text-xs text-slate-500 mb-1">Código de Barras / Chave PIX</label>
                  <p className="text-slate-300 text-xs font-mono break-all">{ordem.codigoBarras}</p>
                </div>
              )}
            </div>
          </div>

          {/* Credor */}
          {ordem.credor && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Credor</h4>
              <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">{ordem.credor.nome}</p>
                  <p className="text-slate-400 text-xs font-mono">{ordem.credor.cpfCnpj}</p>
                </div>
              </div>
            </div>
          )}

          {/* Apropriações */}
          {ordem.apropriacoesOrcamentarias.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Apropriações Orçamentárias
              </h4>
              <div className="space-y-2">
                {ordem.apropriacoesOrcamentarias.map((ap) => {
                  const isDireto = ap.tipoCusto === 'DIRETO';
                  const ancestores = ap.ancestores ?? [];
                  const subcatLabel = getLabelSubcategoria(ap.subcategoriaDireta);

                  return (
                    <div key={ap.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                      {/* Cabeçalho com tipo e percentual */}
                      <div className={`px-3 py-1.5 flex items-center justify-between ${isDireto ? 'bg-blue-950/40 border-b border-blue-900/40' : 'bg-orange-950/40 border-b border-orange-900/40'}`}>
                        <span className={`text-xs font-semibold ${isDireto ? 'text-blue-300' : 'text-orange-300'}`}>
                          {isDireto ? 'Custo Direto' : 'Custo Indireto'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-400 font-mono text-sm font-bold">
                            {formatPercent(Number(ap.percentual))}
                          </span>
                          {isDireto && Number(ap.percentualComprado) > 0 && (
                            <span className="text-slate-400 text-xs font-mono">
                              {formatPercent(Number(ap.percentualComprado))} comprado
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-2.5">
                        {isDireto ? (
                          <div className="space-y-1">
                            {/* Níveis ancestrais com código e descrição reais */}
                            {ancestores.map((anc, i) => (
                              <div
                                key={anc.codigo}
                                className="flex items-center gap-2"
                                style={{ paddingLeft: `${i * 14}px` }}
                              >
                                <span className="text-slate-600 text-xs select-none flex-shrink-0">
                                  {i === 0 ? '┬' : '├'}
                                </span>
                                <span className="font-mono text-xs text-slate-500 flex-shrink-0">
                                  {anc.codigo}
                                </span>
                                <span className="text-slate-400 text-xs truncate">
                                  {anc.discriminacao}
                                </span>
                              </div>
                            ))}

                            {/* Item folha — destacado */}
                            <div
                              className="flex items-center gap-2"
                              style={{ paddingLeft: `${ancestores.length * 14}px` }}
                            >
                              <span className="text-slate-500 text-xs select-none flex-shrink-0">└</span>
                              <span className="font-mono text-xs font-bold text-blue-400 flex-shrink-0">
                                {ap.subEtapaCodigo}
                              </span>
                              <span className="text-white text-sm font-semibold">
                                {ap.subEtapaDescricao}
                              </span>
                            </div>

                            {/* Subcategoria */}
                            {subcatLabel && (
                              <div
                                className="flex items-center gap-1.5 mt-0.5"
                                style={{ paddingLeft: `${(ancestores.length + 1) * 14 + 8}px` }}
                              >
                                <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                                  {subcatLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-white text-sm font-semibold">
                            {ap.itemCustoIndireto?.nome || 'Custo Indireto'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          {ordem.observacoes && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Observações</h4>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{ordem.observacoes}</p>
              </div>
            </div>
          )}

          {/* Anexos */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Paperclip className="w-3.5 h-3.5" />
              Anexos
              {ordem.documentos.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 rounded text-xs">
                  {ordem.documentos.length}
                </span>
              )}
            </h4>
            {ordem.documentos.length > 0 ? (
              <div className="space-y-2">
                {ordem.documentos.map((doc) => (
                  <div key={doc.id} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{getFileIcon(doc.tipoArquivo)}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{doc.nomeArquivo}</p>
                        <p className="text-slate-500 text-xs">{formatBytes(doc.tamanhoBytes)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={doc.caminhoArquivo}
                        download={doc.nomeArquivo}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 text-xs transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar
                      </a>
                      <a
                        href={doc.caminhoArquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/30 text-blue-400 border border-blue-800 rounded-lg hover:bg-blue-900/50 text-xs transition-colors"
                        title="Abrir em nova aba"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-lg p-4 text-center">
                <Paperclip className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Nenhum anexo nesta ordem</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal confirmar exclusão */}
      {confirmarExcluir && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-red-800 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold text-white">Excluir Ordem?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-2">
              Excluir a ordem <strong className="text-white font-mono">{ordem.numeroDocumento}</strong>?
            </p>
            <p className="text-red-400 text-xs mb-6">
              O valor será removido do total da operação e os encargos serão recalculados.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmarExcluir(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                Cancelar
              </button>
              <button onClick={handleExcluir} disabled={excluindo}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
