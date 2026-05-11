'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Upload, FileText, Users, Plus as PlusIcon, ExternalLink, BarChart3, DollarSign, Trash2, CreditCard, Banknote, QrCode, Barcode, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import { buscarCredores } from '@/app/actions/credores';
import { listarItensCustoIndiretoAtivos } from '@/app/actions/custos-indiretos';
import { listarTiposDocumentoAtivos } from '@/app/actions/tipos-documento';
import { buscarVisaoGerencialSalva } from '@/app/actions/orcamento';
import { buscarAcumuladoCompradoPorObra } from '@/app/actions/operacoes';
import { isSubEtapa } from '@/lib/types/operations';
import SubEtapaTreeSelect from '@/app/components/SubEtapaTreeSelect';
import { transformarVisaoGerencialParaEAP } from '@/lib/utils/visao-gerencial-para-eap';

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

const SUBCATEGORIAS_DIRETAS = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'MAO_OBRA_SUB', label: 'MO Subempreitada' },
  { value: 'CONTRATOS', label: 'Contratos (MAT+MO)' },
  { value: 'EQUIP_FRETE', label: 'Equipamentos e Fretes' },
];

interface ApropriacaoOrcamentaria {
  tipoCusto: 'DIRETO' | 'INDIRETO';
  // DIRETO
  subEtapaId: string;
  subEtapaCode: string;
  subEtapaDescription: string;
  etapa: string;
  subcategoriaDireta: string;
  percentualComprado: string;
  // INDIRETO
  itemCustoIndiretoId: string;
  itemCustoIndiretoNome: string;
  // comuns
  tipoValor: 'percentual' | 'valor';
  percentual: string;
  valor: string;
}

function emptyApropriacao(): ApropriacaoOrcamentaria {
  return {
    tipoCusto: 'DIRETO',
    subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '',
    subcategoriaDireta: '', percentualComprado: '',
    itemCustoIndiretoId: '', itemCustoIndiretoNome: '',
    tipoValor: 'percentual', percentual: '', valor: '',
  };
}

export interface PagamentoConfirmado {
  credorId: string;
  documentos: File[];
  tipoDocumento: string;
  numeroDocumento: string;
  valorTotal: number;
  tipoPagamento: string;
  codigoBarras?: string;
  observacoes?: string;
  apropriacoesOrcamentarias: ApropriacaoOrcamentaria[];
}

export interface PagamentoInitialData {
  credorId?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  valorTotal?: number;
  tipoPagamento?: string;
  codigoBarras?: string;
  observacoes?: string;
  apropriacoesOrcamentarias?: ApropriacaoOrcamentaria[];
}

interface NovoPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  construtoraId: string;
  /** Dados iniciais para modo edição */
  initialData?: PagamentoInitialData;
  /** Título personalizado para modo edição */
  titulo?: string;
  onConfirm: (pagamento: PagamentoConfirmado) => void;
}

export default function NovoPagamentoModal({
  isOpen, onClose, obraId, construtoraId, onConfirm, initialData, titulo,
}: NovoPagamentoModalProps) {
  const [credores, setCredores] = useState<Array<{
    id: string; nome: string; cpfCnpj: string; chavePix?: string | null; tipoChavePix?: string | null;
    banco?: string | null; agencia?: string | null; conta?: string | null; tipoConta?: string | null;
  }>>([]);
  const [itensCustoIndireto, setItensCustoIndireto] = useState<Array<{ id: string; nome: string; descricao?: string | null }>>([]);
  const [tiposDocumento, setTiposDocumento] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    if (!construtoraId) return;
    buscarCredores(construtoraId).then((creds) =>
      setCredores(creds.map((c) => ({
        id: c.id, nome: c.nome, cpfCnpj: c.cpfCnpj,
        chavePix: c.chavePix, tipoChavePix: c.tipoChavePix,
        banco: c.banco, agencia: c.agencia, conta: c.conta, tipoConta: c.tipoConta,
      })))
    ).catch(console.error);

    listarItensCustoIndiretoAtivos(construtoraId).then((itens) =>
      setItensCustoIndireto(itens.map((i) => ({ id: i.id, nome: i.nome, descricao: i.descricao })))
    ).catch(console.error);

    listarTiposDocumentoAtivos(construtoraId).then((tipos) =>
      setTiposDocumento(tipos.map((t) => ({ id: t.id, nome: t.nome })))
    ).catch(console.error);
  }, [construtoraId]);

  const [credorId, setCredorId] = useState(initialData?.credorId ?? '');
  const [tipoDocumento, setTipoDocumento] = useState(initialData?.tipoDocumento ?? '');
  const [numeroDocumento, setNumeroDocumento] = useState(initialData?.numeroDocumento ?? '');
  const [valorTotal, setValorTotal] = useState(
    initialData?.valorTotal
      ? initialData.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  );
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [tipoPagamento, setTipoPagamento] = useState(initialData?.tipoPagamento ?? 'Transferência');
  const [observacoes, setObservacoes] = useState(initialData?.observacoes ?? '');
  const [codigoBarras, setCodigoBarras] = useState(initialData?.codigoBarras ?? '');
  const [apropriacoes, setApropiacoes] = useState<ApropriacaoOrcamentaria[]>(
    initialData?.apropriacoesOrcamentarias ?? [emptyApropriacao()]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const credorSelecionado = useMemo(() => credores.find((c) => c.id === credorId), [credorId, credores]);

  useEffect(() => {
    if (isOpen) {
      setCredorId(initialData?.credorId ?? '');
      setTipoDocumento(initialData?.tipoDocumento ?? '');
      setNumeroDocumento(initialData?.numeroDocumento ?? '');
      setValorTotal(
        initialData?.valorTotal
          ? initialData.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : ''
      );
      setDocumentos([]);
      setTipoPagamento(initialData?.tipoPagamento ?? 'Transferência');
      setCodigoBarras(initialData?.codigoBarras ?? '');
      setApropiacoes(initialData?.apropriacoesOrcamentarias ?? [emptyApropriacao()]);
      setObservacoes(initialData?.observacoes ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const [vgItens, setVgItens] = useState<any[]>([]);
  const [acumuladoMap, setAcumuladoMap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!obraId) return;
    buscarVisaoGerencialSalva(obraId).then((d: any) => setVgItens(d?.visaoGerencial?.itens || [])).catch(() => setVgItens([]));
    buscarAcumuladoCompradoPorObra(obraId).then(setAcumuladoMap).catch(() => setAcumuladoMap({}));
  }, [obraId]);
  const visaoGerencialCompleta = transformarVisaoGerencialParaEAP(vgItens);

  const valorTotalNumerico = useMemo(() => parseValorInput(valorTotal), [valorTotal]);

  const saldoApropriado = useMemo(() => {
    const total = apropriacoes.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
    }, 0);
    return valorTotalNumerico - total;
  }, [apropriacoes, valorTotalNumerico]);

  // Em modo edição, desconta a contribuição original da ordem do acumulado
  // para não bloquear o campo "%Comprado" indevidamente
  const acumuladoExcluido = useMemo(() => {
    if (!initialData?.apropriacoesOrcamentarias) return {} as Record<string, number>;
    const m: Record<string, number> = {};
    for (const ap of initialData.apropriacoesOrcamentarias) {
      if (ap.tipoCusto === 'DIRETO' && ap.subEtapaId) {
        const v = parseFloat(String(ap.percentualComprado || '0').replace(',', '.')) || 0;
        m[ap.subEtapaId] = (m[ap.subEtapaId] ?? 0) + v;
      }
    }
    return m;
  }, [initialData]);

  const getAcumulado = (itemId: string) =>
    Math.max(0, (acumuladoMap[itemId] ?? 0) - (acumuladoExcluido[itemId] ?? 0));
  const isComprado = (id: string) => getAcumulado(id) >= 100;

  const addApropriacao = () => setApropiacoes([...apropriacoes, emptyApropriacao()]);
  const removeApropriacao = (i: number) => setApropiacoes(apropriacoes.filter((_, idx) => idx !== i));

  const updateApropriacao = (index: number, updates: Partial<ApropriacaoOrcamentaria>) => {
    const next = [...apropriacoes];
    next[index] = { ...next[index], ...updates };
    setApropiacoes(next);
  };

  const handleSelectServico = (index: number, itemId: string) => {
    const item = visaoGerencialCompleta.find((i) => i.id === itemId);
    if (item && isSubEtapa(item)) {
      updateApropriacao(index, {
        subEtapaId: itemId, subEtapaCode: item.numeroHierarquico,
        subEtapaDescription: item.descricao, etapa: item.etapa || '',
        percentualComprado: '',
      });
    }
  };

  const handleSelectIndireto = (index: number, itemId: string) => {
    const item = itensCustoIndireto.find((i) => i.id === itemId);
    updateApropriacao(index, { itemCustoIndiretoId: itemId, itemCustoIndiretoNome: item?.nome || '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const novosArquivos = Array.from(e.target.files);
      setDocumentos((prev) => [...prev, ...novosArquivos]);
      e.target.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (!credorId) { alert('Selecione um credor'); return; }
    if (!numeroDocumento) { alert('Informe o número do documento'); return; }
    if (valorTotalNumerico <= 0) { alert('Informe um valor total válido'); return; }

    for (const ap of apropriacoes) {
      if (ap.tipoCusto === 'DIRETO' && !ap.subEtapaId) {
        alert('Selecione um serviço EAP para todas as linhas de Custo Direto.'); return;
      }
      if (ap.tipoCusto === 'DIRETO' && !ap.subcategoriaDireta) {
        alert('Selecione a categoria (Material, MO, Contratos, Equip.) para todas as linhas de Custo Direto.'); return;
      }
      if (ap.tipoCusto === 'INDIRETO' && !ap.itemCustoIndiretoId) {
        alert('Selecione um item de Custo Indireto para todas as linhas indiretas.'); return;
      }
    }

    const totalApropriado = apropriacoes.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
    }, 0);

    if (Math.abs(totalApropriado - valorTotalNumerico) > 0.01) {
      alert(`A soma das apropriações (${formatCurrency(totalApropriado)}) deve ser igual ao valor total (${formatCurrency(valorTotalNumerico)})`);
      return;
    }

    for (const ap of apropriacoes) {
      if (ap.tipoCusto !== 'DIRETO' || !ap.subEtapaId) continue;
      const acumulado = getAcumulado(ap.subEtapaId);
      const desta = parseFloat((ap.percentualComprado || '0').replace(',', '.')) || 0;
      if (acumulado + desta > 100) {
        alert(`O item "${ap.subEtapaDescription}" atingiria ${(acumulado + desta).toFixed(2)}% comprado (limite: 100%). Reduza o valor informado.`);
        return;
      }
    }

    onConfirm({
      credorId, documentos, tipoDocumento, numeroDocumento,
      valorTotal: valorTotalNumerico, tipoPagamento,
      codigoBarras: (tipoPagamento === 'Boleto' || tipoPagamento === 'Outros') ? codigoBarras : undefined,
      observacoes: observacoes.trim() || undefined,
      apropriacoesOrcamentarias: apropriacoes,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">{titulo ?? 'Novo Pagamento'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Credor */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5" />Credor *</h3>
              <Link href={`/fin/cadastros/${construtoraId}/credores/novo`} target="_blank"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors">
                <PlusIcon className="w-4 h-4" />Novo Credor<ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <select value={credorId} onChange={(e) => setCredorId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="">Selecione o credor...</option>
              {credores.map((c) => <option key={c.id} value={c.id}>{c.nome} - {c.cpfCnpj}</option>)}
            </select>
          </div>

          {/* Documento e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Documento *</label>
              {tiposDocumento.length > 0 ? (
                <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="">Selecione o tipo...</option>
                  {tiposDocumento.map((t) => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                  <span>Nenhum tipo cadastrado.</span>
                  <a
                    href={`/fin/cadastros/${construtoraId}/tipos-documento`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline whitespace-nowrap"
                  >
                    Cadastrar tipos →
                  </a>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Número do Documento *</label>
              <input type="text" value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="Ex: NF-12345"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" />Valor Total *</label>
              <input
                type="text"
                value={valorTotal}
                onChange={(e) => setValorTotal(formatValorInput(e.target.value))}
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" />Tipo de Pagamento *</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {(['Transferência', 'PIX', 'Boleto', 'Outros'] as const).map((tipo) => (
                <button key={tipo} type="button" onClick={() => setTipoPagamento(tipo)}
                  className={`p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                    tipoPagamento === tipo ? 'border-blue-500 bg-blue-950/50 text-blue-400' : 'border-slate-600 bg-slate-700 hover:border-slate-500 text-slate-300'}`}>
                  {tipo === 'Transferência' && <Banknote className="w-5 h-5" />}
                  {tipo === 'PIX' && <QrCode className="w-5 h-5" />}
                  {tipo === 'Boleto' && <Barcode className="w-5 h-5" />}
                  {tipo === 'Outros' && <FileText className="w-5 h-5" />}
                  <span className="font-semibold">{tipo}</span>
                </button>
              ))}
            </div>
            {(tipoPagamento === 'PIX' || tipoPagamento === 'Transferência') && credorSelecionado && (
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                {tipoPagamento === 'PIX' ? (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Chave PIX</label>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{credorSelecionado.chavePix || credorSelecionado.cpfCnpj || 'N/A'}</p>
                        <p className="text-xs text-slate-400">Tipo: {credorSelecionado.tipoChavePix || 'CPF/CNPJ'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Dados Bancários</label>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Banco: {credorSelecionado.banco || 'N/A'}</p>
                        <p className="text-xs text-slate-400">Ag: {credorSelecionado.agencia || 'N/A'} | Conta: {credorSelecionado.conta || 'N/A'} ({credorSelecionado.tipoConta || 'CORRENTE'})</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(tipoPagamento === 'Boleto' || tipoPagamento === 'Outros') && (
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                <label className="block text-sm text-slate-400 mb-2">Código de Barras *</label>
                <input type="text" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)}
                  placeholder="Digite o código de barras"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500" />
              </div>
            )}
          </div>

          {/* Upload Documentos */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Upload className="w-5 h-5" />Anexar Documentos <span className="text-sm font-normal text-slate-400">(opcional)</span></h3>
            {documentos.length > 0 && (
              <div className="mb-4 space-y-2">
                {documentos.map((arquivo, docIdx) => (
                  <div key={docIdx} className="flex items-center justify-between bg-slate-700 border border-slate-600 rounded-lg p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{arquivo.name}</p>
                        <p className="text-sm text-slate-400">{(arquivo.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setDocumentos((prev) => prev.filter((_, idx) => idx !== docIdx))}
                      className="p-1.5 hover:bg-slate-600 rounded text-red-400 transition-colors ml-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={handleClickUpload}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                {documentos.length === 0 ? 'Selecionar Arquivo(s)' : 'Adicionar Mais Arquivos'}
              </button>
              <p className="text-xs text-slate-500 mt-2">Você pode selecionar múltiplos arquivos</p>
            </div>
          </div>

          {/* Apropriação de Custos */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Apropriação de Custos *
              </h3>
              <button type="button" onClick={addApropriacao}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors">
                <PlusIcon className="w-4 h-4" />Adicionar Linha
              </button>
            </div>
            <div className="space-y-4 mb-4">
              {apropriacoes.map((ap, index) => (
                <div key={index} className="bg-slate-700 border border-slate-600 rounded-lg p-4">
                  {/* Toggle DIRETO / INDIRETO */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm text-slate-400 font-medium">Tipo de Custo:</span>
                    <div className="flex rounded-lg overflow-hidden border border-slate-500">
                      <button type="button"
                        onClick={() => updateApropriacao(index, { tipoCusto: 'DIRETO', subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '', subcategoriaDireta: '', percentualComprado: '', itemCustoIndiretoId: '', itemCustoIndiretoNome: '' })}
                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${ap.tipoCusto === 'DIRETO' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                        Custo Direto
                      </button>
                      <button type="button"
                        onClick={() => updateApropriacao(index, { tipoCusto: 'INDIRETO', subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '', subcategoriaDireta: '', percentualComprado: '', itemCustoIndiretoId: '', itemCustoIndiretoNome: '' })}
                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${ap.tipoCusto === 'INDIRETO' ? 'bg-orange-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                        Custo Indireto
                      </button>
                    </div>
                    {ap.tipoCusto === 'DIRETO' && (
                      <span className="text-xs text-blue-400">Vinculado ao serviço da EAP Gerencial</span>
                    )}
                    {ap.tipoCusto === 'INDIRETO' && (
                      <span className="text-xs text-orange-400">Overhead da obra — sem serviço EAP</span>
                    )}
                  </div>

                  {/* Campos DIRETO */}
                  {ap.tipoCusto === 'DIRETO' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Serviço EAP *</label>
                          <SubEtapaTreeSelect
                            items={visaoGerencialCompleta}
                            selectedSubEtapaId={ap.subEtapaId}
                            onSelect={(itemId) => handleSelectServico(index, itemId)}
                            placeholder="Selecione um SERVIÇO..."
                            isItemDisabled={isComprado}
                            getPercentualCompradoAcumulado={getAcumulado}
                          />
                          {ap.subEtapaId && (() => {
                            const acumulado = getAcumulado(ap.subEtapaId);
                            const naoApto = acumulado >= 100;
                            return (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${naoApto ? 'bg-red-900/60 text-red-300' : 'bg-green-900/60 text-green-300'}`}>
                                  {naoApto ? 'Não Apto' : 'Apto'}
                                </span>
                                {acumulado > 0 && <span className="text-xs text-cyan-400">%Comprado: {acumulado.toFixed(2).replace('.', ',')}%</span>}
                                {!naoApto && acumulado > 0 && <span className="text-xs text-slate-400">(disponível: {(100 - acumulado).toFixed(2).replace('.', ',')}%)</span>}
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Categoria *</label>
                          <select value={ap.subcategoriaDireta} onChange={(e) => updateApropriacao(index, { subcategoriaDireta: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="">Selecione a categoria...</option>
                            {SUBCATEGORIAS_DIRETAS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Tipo de Valor</label>
                          <select value={ap.tipoValor} onChange={(e) => updateApropriacao(index, { tipoValor: e.target.value as any })}
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500">
                            <option value="percentual">Percentual (%)</option>
                            <option value="valor">Valor (R$)</option>
                          </select>
                        </div>
                        {ap.tipoValor === 'percentual' ? (
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Percentual (%)</label>
                            <input type="text" value={ap.percentual} onChange={(e) => updateApropriacao(index, { percentual: e.target.value })}
                              placeholder="0,00" className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500" />
                            <p className="text-xs text-slate-500 mt-1">Valor: {formatCurrency(valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100)}</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Valor (R$)</label>
                            <input type="text" value={ap.valor} onChange={(e) => updateApropriacao(index, { valor: e.target.value })}
                              placeholder="0,00" className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500" />
                            {valorTotalNumerico > 0 && <p className="text-xs text-slate-500 mt-1">%: {((parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0) / valorTotalNumerico * 100).toFixed(2)}%</p>}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">%Comprado (desta NF)</label>
                          {(() => {
                            const acumulado = ap.subEtapaId ? getAcumulado(ap.subEtapaId) : 0;
                            const atingido = acumulado >= 100;
                            const desta = parseFloat((ap.percentualComprado || '0').replace(',', '.')) || 0;
                            const total = acumulado + desta;
                            return (
                              <>
                                <input type="text" value={atingido ? '100,00' : ap.percentualComprado}
                                  onChange={(e) => updateApropriacao(index, { percentualComprado: e.target.value })}
                                  placeholder="0,00" disabled={atingido}
                                  className={`w-full px-4 py-2 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 ${atingido ? 'bg-slate-700 border border-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-600 border border-slate-500'}`} />
                                {atingido ? (
                                  <p className="text-xs mt-1 text-red-400">100% já atingido</p>
                                ) : ap.subEtapaId ? (
                                  <p className={`text-xs mt-1 ${total > 100 ? 'text-red-400' : 'text-slate-500'}`}>
                                    Total após: {total.toFixed(2).replace('.', ',')}%
                                    {total > 100 && ' ⚠ Excede 100%'}
                                  </p>
                                ) : null}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-end">
                          {apropriacoes.length > 1 && (
                            <button type="button" onClick={() => removeApropriacao(index)}
                              className="w-full p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors">
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos INDIRETO */}
                  {ap.tipoCusto === 'INDIRETO' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                          <PackageOpen className="w-4 h-4 text-orange-400" />
                          Item de Custo Indireto *
                        </label>
                        {itensCustoIndireto.length === 0 ? (
                          <div className="p-3 bg-orange-950/20 border border-orange-800 rounded-lg">
                            <p className="text-sm text-orange-300">
                              Nenhum item cadastrado.{' '}
                              <Link href={`/fin/cadastros/${construtoraId}/custos-indiretos/novo`} target="_blank"
                                className="underline hover:text-orange-200">Cadastre aqui</Link>
                            </p>
                          </div>
                        ) : (
                          <select value={ap.itemCustoIndiretoId} onChange={(e) => handleSelectIndireto(index, e.target.value)}
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-orange-500">
                            <option value="">Selecione um item de custo indireto...</option>
                            {itensCustoIndireto.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
                          </select>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Tipo de Valor</label>
                          <select value={ap.tipoValor} onChange={(e) => updateApropriacao(index, { tipoValor: e.target.value as any })}
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-orange-500">
                            <option value="percentual">Percentual (%)</option>
                            <option value="valor">Valor (R$)</option>
                          </select>
                        </div>
                        {ap.tipoValor === 'percentual' ? (
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Percentual (%)</label>
                            <input type="text" value={ap.percentual} onChange={(e) => updateApropriacao(index, { percentual: e.target.value })}
                              placeholder="0,00" className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-orange-500" />
                            <p className="text-xs text-slate-500 mt-1">Valor: {formatCurrency(valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100)}</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Valor (R$)</label>
                            <input type="text" value={ap.valor} onChange={(e) => updateApropriacao(index, { valor: e.target.value })}
                              placeholder="0,00" className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-orange-500" />
                            {valorTotalNumerico > 0 && <p className="text-xs text-slate-500 mt-1">%: {((parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0) / valorTotalNumerico * 100).toFixed(2)}%</p>}
                          </div>
                        )}
                        <div className="flex items-end">
                          {apropriacoes.length > 1 && (
                            <button type="button" onClick={() => removeApropriacao(index)}
                              className="w-full p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors">
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Apropriado:</span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${Math.abs(saldoApropriado) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(valorTotalNumerico - saldoApropriado)}
                  </span>
                  <span className="text-sm text-slate-400">
                    Saldo: <span className={saldoApropriado >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(saldoApropriado)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre este pagamento (opcional)..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-700">
          <button onClick={onClose} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {initialData ? 'Salvar Alterações' : 'Adicionar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
