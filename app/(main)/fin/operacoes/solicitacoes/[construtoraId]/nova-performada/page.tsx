'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  TrendingUp,
  RotateCcw,
  Info,
  Upload,
  Trash2,
  Calculator,
  Lock,
  Clock,
  Edit,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  criarOperacaoPerformada,
  listarOperacoesAPerformarAbertas,
} from '@/app/actions/operacoes';
import { buscarConfigTaxas } from '@/app/actions/config-taxas';
import { listarMedicoesPorObra } from '@/app/actions/medicoes';
import { calcularProjecaoEncargos, DEFAULT_TAXA_CONFIG } from '@/lib/types/operations';
import { useRef } from 'react';

type Medicao = {
  id: string;
  nome: string;
  numero: number;
  dataPrevisao: Date | string;
  dataRealMedicao: Date | string | null;
  status: string;
  tipo: string;
  observacoes: string | null;
  valorTotal: number;
};

type OpAPerformar = {
  id: string;
  codigo: string;
  valorTotalOrdens: number | string;
  valorRecomprado: number | string | null;
  statusRecompra: string | null;
  statusWorkflow: string;
  dataReferencia: Date | string;
  ordens: Array<{
    id: string;
    numeroDocumento: string;
    valorTotal: number | string;
    tipoDocumentoNome: string | null;
    credor: { id: string; nome: string } | null;
  }>;
};

type RecompraEntry = {
  operacaoAPerformarId: string;
  valorRecomprado: number;
};

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

function getWorkflowBadge(status: string) {
  switch (status) {
    case 'EM_EDICAO':    return { label: 'Em Edição',    icon: <Edit className="w-3 h-3" />,       cls: 'bg-blue-900/50 text-blue-400 border-blue-800' };
    case 'FINALIZADA':  return { label: 'Finalizada',   icon: <FileText className="w-3 h-3" />,   cls: 'bg-slate-700 text-slate-300 border-slate-600' };
    case 'EM_APROVACAO':return { label: 'Em Aprovação', icon: <Clock className="w-3 h-3" />,      cls: 'bg-amber-900/50 text-amber-400 border-amber-800' };
    case 'APROVADA':    return { label: 'Aprovada',     icon: <CheckCircle2 className="w-3 h-3" />,cls: 'bg-green-900/50 text-green-400 border-green-800' };
    case 'REJEITADA':   return { label: 'Rejeitada',    icon: <XCircle className="w-3 h-3" />,    cls: 'bg-red-900/50 text-red-400 border-red-800' };
    default:            return { label: status,         icon: null,                                cls: 'bg-slate-700 text-slate-400 border-slate-600' };
  }
}

function NovaPerformadaContent({ params }: { params: { construtoraId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') || '';

  const [obraNome, setObraNome] = useState('');
  const [obraCodigo, setObraCodigo] = useState('');

  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [medicaoSelecionadaId, setMedicaoSelecionadaId] = useState('');

  // Toggle: é reajuste/complemento (sem medição de referência)?
  const [isReajuste, setIsReajuste] = useState(false);
  const [nfReferencia, setNfReferencia] = useState('');

  const [nfNumero, setNfNumero] = useState('');
  const [nfDataEmissao, setNfDataEmissao] = useState('');
  const [nfValorBrutoStr, setNfValorBrutoStr] = useState('');
  const [nfRetencoesStr, setNfRetencoesStr] = useState('');
  const [dataReferencia, setDataReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [documentosNf, setDocumentosNf] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [operacoesAbertas, setOperacoesAbertas] = useState<OpAPerformar[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [valoresRecompra, setValoresRecompra] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');
  const [taxaConfig, setTaxaConfig] = useState(DEFAULT_TAXA_CONFIG);

  const carregar = useCallback(async () => {
    if (!obraId) return;

    const resObra = await fetch(`/api/construtoras/${params.construtoraId}/obras`).catch(() => null);
    if (resObra?.ok) {
      const data = await resObra.json();
      const obra = data.obras?.find((o: { id: string; nome: string; codigo: string }) => o.id === obraId);
      if (obra) {
        setObraNome(obra.nome);
        setObraCodigo(obra.codigo);
      }
    }

    const [meds, ops, config] = await Promise.all([
      listarMedicoesPorObra(obraId),
      listarOperacoesAPerformarAbertas(obraId),
      buscarConfigTaxas(params.construtoraId),
    ]);

    setMedicoes(meds as unknown as Medicao[]);
    setOperacoesAbertas(ops as unknown as OpAPerformar[]);
    setTaxaConfig({
      taxaJurosMensal: config.taxaJurosMensal,
      taxaAdministrativa: config.taxaAdministrativa,
      tipoTaxaAdministrativa: config.tipoTaxaAdministrativa,
    });

    const valoresIniciais: Record<string, string> = {};
    for (const op of ops) {
      const disponivel = Number(op.valorTotalOrdens) - Number(op.valorRecomprado ?? 0);
      valoresIniciais[op.id] = disponivel.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    setValoresRecompra(valoresIniciais);
  }, [obraId, params.construtoraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const medicaoSelecionada = useMemo(
    () => medicoes.find((m) => m.id === medicaoSelecionadaId),
    [medicoes, medicaoSelecionadaId]
  );

  const handleSelecionarMedicao = (id: string) => {
    setMedicaoSelecionadaId(id);
    const med = medicoes.find((m) => m.id === id);
    if (med && med.valorTotal > 0) {
      setNfValorBrutoStr(
        med.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    }
  };

  const handleToggleReajuste = (value: boolean) => {
    setIsReajuste(value);
    setMedicaoSelecionadaId('');
    setNfValorBrutoStr('');
    setNfRetencoesStr('');
    setNfReferencia('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const novos = Array.from(e.target.files);
      setDocumentosNf((prev) => [...prev, ...novos]);
      e.target.value = '';
    }
  };

  const toggleSelecionada = (id: string) => {
    const op = operacoesAbertas.find((o) => o.id === id);
    if (!op || op.statusWorkflow !== 'APROVADA') return;
    const next = new Set(selecionadas);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelecionadas(next);
  };

  const handleValorRecompra = (opId: string, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const formatted = digits
      ? (parseInt(digits) / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '';
    setValoresRecompra((prev) => ({ ...prev, [opId]: formatted }));
  };

  const nfValorBruto = parseValorInput(nfValorBrutoStr);
  const nfRetencoes = parseValorInput(nfRetencoesStr);
  const nfValor = Math.max(0, nfValorBruto - nfRetencoes); // Valor Líquido
  const projecaoEncargos = useMemo(() => {
    if (!dataReferencia || nfValor <= 0) return null;
    return calcularProjecaoEncargos(nfValor, dataReferencia, 'TO_PERFORM', taxaConfig);
  }, [dataReferencia, nfValor, taxaConfig]);

  const jurosProjetados = projecaoEncargos?.jurosProjetados ?? 0;
  const taxasProjetadas = projecaoEncargos?.taxasProjetadas ?? 0;
  const totalEncargos = projecaoEncargos?.totalEncargos ?? 0;
  const valorOperadoComEncargos = nfValor + totalEncargos;

  const recomprasAtivas: RecompraEntry[] = Array.from(selecionadas).map((id) => ({
    operacaoAPerformarId: id,
    valorRecomprado: parseValorInput(valoresRecompra[id] || '0'),
  }));

  const totalRecomprado = recomprasAtivas.reduce((s, r) => s + r.valorRecomprado, 0);
  const saldoResidual = valorOperadoComEncargos - totalRecomprado;
  const nfInsuficiente = totalRecomprado > valorOperadoComEncargos + 0.005;

  const handleCriar = async () => {
    setErro('');

    if (!isReajuste && !medicaoSelecionadaId) {
      setErro('Selecione a medição de engenharia ou marque como reajuste/complemento');
      return;
    }
    if (isReajuste && !nfReferencia.trim()) {
      setErro('Informe a descrição do reajuste/complemento desta NF');
      return;
    }
    if (!nfNumero.trim()) { setErro('Informe o número da NF'); return; }
    if (!nfDataEmissao) { setErro('Informe a data de emissão da NF'); return; }
    if (!nfValorBrutoStr || nfValorBruto <= 0) { setErro('Informe o valor bruto da NF'); return; }
    if (nfRetencoes > nfValorBruto) { setErro('As retenções não podem ser maiores que o valor bruto'); return; }
    if (nfValor <= 0) { setErro('O valor líquido da NF deve ser maior que zero'); return; }
    if (!dataReferencia) { setErro('Informe a data de referência'); return; }
    if (nfInsuficiente) {
      setErro('O valor da NF é insuficiente para cobrir o total das recompras selecionadas');
      return;
    }

    for (const r of recomprasAtivas) {
      const op = operacoesAbertas.find((o) => o.id === r.operacaoAPerformarId);
      if (!op) continue;
      const disponivel = Number(op.valorTotalOrdens) - Number(op.valorRecomprado ?? 0);
      if (r.valorRecomprado > disponivel + 0.005) {
        setErro(
          `O valor de recompra para ${op.codigo} excede o saldo disponível (${formatCurrency(disponivel)})`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await criarOperacaoPerformada({
        construtoraId: params.construtoraId,
        obraId,
        previsaoMedicaoId: isReajuste ? null : medicaoSelecionadaId || null,
        nfReferencia: isReajuste ? nfReferencia.trim() : null,
        nfNumero: nfNumero.trim(),
        nfDataEmissao: nfDataEmissao ? new Date(nfDataEmissao) : null,
        nfValorBruto,
        nfRetencoes,
        nfValor,
        dataReferencia: new Date(dataReferencia),
        recompras: recomprasAtivas,
        observacoes: observacoes.trim() || undefined,
      });
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar operação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Obra não informada.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Nova Operação Performada</h1>
            <p className="text-slate-400">
              Obra: {obraCodigo} {obraNome && `— ${obraNome}`}
            </p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="mb-6 flex items-center gap-3 bg-red-950/40 border border-red-700 rounded-lg p-4 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* 1. Referência da NF */}
      <div className="bg-slate-900 border border-purple-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-400" />
          Referência da NF
        </h2>

        {/* Toggle: Medição vs Reajuste */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700 mb-6 w-fit">
          <button
            type="button"
            onClick={() => handleToggleReajuste(false)}
            className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
              !isReajuste
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Medição de Engenharia
          </button>
          <button
            type="button"
            onClick={() => handleToggleReajuste(true)}
            className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 transition-colors ${
              isReajuste
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reajuste / Complemento
          </button>
        </div>

        {/* Medição de Engenharia */}
        {!isReajuste && (
          <div>
            {medicoes.length === 0 ? (
              <div className="flex items-start gap-3 bg-amber-950/30 border border-amber-700 rounded-lg p-4 text-amber-300 text-sm">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Nenhuma medição com status <strong>Realizada</strong> encontrada para esta obra.
                  Conclua as medições no módulo de engenharia para que apareçam aqui.
                </span>
              </div>
            ) : (
              <select
                value={medicaoSelecionadaId}
                onChange={(e) => handleSelecionarMedicao(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Selecione a medição...</option>
                {medicoes.map((m) => (
                  <option key={m.id} value={m.id}>
                    Medição #{m.numero} — {m.nome} — {formatCurrency(m.valorTotal)}
                    {m.dataRealMedicao
                      ? ` (realizada em ${formatDate(new Date(m.dataRealMedicao).toString())})`
                      : ''}
                  </option>
                ))}
              </select>
            )}

            {medicaoSelecionada && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Medição</p>
                  <p className="text-white font-semibold">#{medicaoSelecionada.numero}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Nome</p>
                  <p className="text-white font-semibold text-sm truncate">{medicaoSelecionada.nome}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Data Realização</p>
                  <p className="text-white font-semibold text-sm">
                    {medicaoSelecionada.dataRealMedicao
                      ? formatDate(new Date(medicaoSelecionada.dataRealMedicao).toString())
                      : '—'}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Valor Total Medido</p>
                  <p className="text-green-400 font-semibold font-mono">
                    {formatCurrency(medicaoSelecionada.valorTotal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reajuste / Complemento */}
        {isReajuste && (
          <div>
            <div className="flex items-start gap-3 bg-amber-950/20 border border-amber-700/50 rounded-lg p-4 text-amber-300 text-sm mb-4">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Para NFs de <strong>reajuste ou complemento</strong>, descreva abaixo a que se refere
                este documento. O sistema não vinculará esta NF a uma medição específica.
              </span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Descrição do reajuste / complemento *
              </label>
              <input
                type="text"
                value={nfReferencia}
                onChange={(e) => setNfReferencia(e.target.value)}
                placeholder="Ex: Reajuste da Medição #3 — INCC Dez/2024, Complemento de medição anterior..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Dados da NF */}
      <div className="bg-slate-900 border border-purple-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-purple-400" />
          Dados da Nota Fiscal
        </h2>

        {/* Linha 1: Número, Data Emissão, Data Referência */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Número da NF *</label>
            <input
              type="text"
              value={nfNumero}
              onChange={(e) => setNfNumero(e.target.value)}
              placeholder="NF-12345"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Data de Emissão *</label>
            <input
              type="date"
              value={nfDataEmissao}
              onChange={(e) => setNfDataEmissao(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Data de Referência (vencimento) *</label>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Linha 2: Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Valor Bruto da NF *{' '}
              {!isReajuste && medicaoSelecionada?.valorTotal && (
                <span className="text-xs text-purple-400">(pré-preenchido)</span>
              )}
            </label>
            <input
              type="text"
              value={nfValorBrutoStr}
              onChange={(e) => setNfValorBrutoStr(formatValorInput(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Retenções{' '}
              <span className="text-xs text-slate-500">(ISS, IR, INSS, etc.)</span>
            </label>
            <input
              type="text"
              value={nfRetencoesStr}
              onChange={(e) => setNfRetencoesStr(formatValorInput(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-green-400" />
              Valor Líquido
              <span className="text-xs text-green-400 ml-1">(base de cálculo)</span>
            </label>
            <div className={`w-full px-4 py-2 rounded-lg border text-lg font-mono font-bold ${
              nfValor > 0
                ? 'bg-green-950/30 border-green-700 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {formatCurrency(nfValor)}
            </div>
            {nfRetencoes > 0 && nfValorBruto > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {formatCurrency(nfValorBruto)} − {formatCurrency(nfRetencoes)} = {formatCurrency(nfValor)}
              </p>
            )}
          </div>
        </div>

        {/* Info valor líquido */}
        {nfValor > 0 && nfRetencoes > 0 && (
          <div className="flex items-center gap-2 bg-green-950/20 border border-green-800/50 rounded-lg p-3 text-green-300 text-sm">
            <Info className="w-4 h-4 flex-shrink-0" />
            O valor líquido de <strong>{formatCurrency(nfValor)}</strong> será usado como base para
            recompra das operações e cálculo de taxas.
          </div>
        )}

        {/* Upload de Documentos */}
        <div className="mt-5 border-t border-slate-800 pt-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            Anexar Nota Fiscal e Documentos{' '}
            <span className="text-slate-500 font-normal">(opcional)</span>
          </h3>

          {documentosNf.length > 0 && (
            <div className="mb-3 space-y-2">
              {documentosNf.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocumentosNf((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1.5 hover:bg-slate-700 rounded text-red-400 transition-colors ml-2 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xml"
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            {documentosNf.length === 0 ? 'Selecionar Arquivo(s)' : 'Adicionar Mais Arquivos'}
          </button>
          <p className="text-xs text-slate-500 mt-1.5">PDF, JPG, PNG, DOC, XML</p>
        </div>
      </div>

      {/* 3. Recompra de Operações À Performar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
          Recompra de Operações À Performar
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Selecione as operações a recomprar com esta NF. O valor padrão é o saldo disponível —
          ajuste para recompra parcial. Se nenhuma operação for selecionada, a operação performada
          será criada normalmente.
        </p>

        {operacoesAbertas.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma operação "À Performar" aberta para esta obra.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {operacoesAbertas.map((op) => {
              const disponivel = Number(op.valorTotalOrdens) - Number(op.valorRecomprado ?? 0);
              const aprovada = op.statusWorkflow === 'APROVADA';
              const sel = selecionadas.has(op.id);
              const valorAtual = parseValorInput(valoresRecompra[op.id] || '0');
              const isParcial = sel && valorAtual < disponivel - 0.005;
              const credorNome = op.ordens[0]?.credor?.nome || '—';
              const badge = getWorkflowBadge(op.statusWorkflow);

              return (
                <div
                  key={op.id}
                  className={`border-2 rounded-lg p-4 transition-colors ${
                    !aprovada
                      ? 'bg-slate-800/50 border-slate-700/50 opacity-70'
                      : sel
                      ? 'bg-blue-950/20 border-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox — bloqueado se não aprovada */}
                    <button
                      type="button"
                      onClick={() => toggleSelecionada(op.id)}
                      disabled={!aprovada}
                      title={!aprovada ? 'Somente operações aprovadas podem ser recompradas' : undefined}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        !aprovada
                          ? 'border-slate-600 bg-slate-800 cursor-not-allowed'
                          : sel
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-500 hover:border-blue-400'
                      }`}
                    >
                      {!aprovada
                        ? <Lock className="w-3 h-3 text-slate-600" />
                        : sel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-blue-400 font-semibold">{op.codigo}</span>
                        {/* Badge de status workflow */}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${badge.cls}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span className="text-slate-300 text-sm truncate">{credorNome}</span>
                        {isParcial && (
                          <span className="text-xs bg-orange-900/50 text-orange-300 border border-orange-700 rounded px-2 py-0.5">
                            Parcial
                          </span>
                        )}
                        {op.statusRecompra === 'PARCIAL' && (
                          <span className="text-xs bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded px-2 py-0.5">
                            Já recomprada parcialmente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Venc.: {formatDate(new Date(op.dataReferencia).toString())} · Total:{' '}
                        {formatCurrency(Number(op.valorTotalOrdens))}
                        {Number(op.valorRecomprado ?? 0) > 0 && (
                          <> · Já recomprado: {formatCurrency(Number(op.valorRecomprado))}</>
                        )}
                      </p>
                      {!aprovada && (
                        <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Esta operação precisa ser aprovada antes de ser recomprada
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <p className="text-xs text-slate-400">Disponível</p>
                      <p className={`font-mono font-semibold text-sm ${aprovada ? 'text-green-400' : 'text-slate-500'}`}>
                        {formatCurrency(disponivel)}
                      </p>
                    </div>
                  </div>

                  {sel && aprovada && (
                    <div className="mt-3 ml-9 flex items-center gap-3">
                      <label className="text-sm text-slate-400 whitespace-nowrap">
                        Valor a recomprar:
                      </label>
                      <input
                        type="text"
                        value={valoresRecompra[op.id] || ''}
                        onChange={(e) => handleValorRecompra(op.id, e.target.value)}
                        placeholder="R$ 0,00"
                        className="w-44 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setValoresRecompra((prev) => ({
                            ...prev,
                            [op.id]: disponivel.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                          }))
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Preencher total
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Resumo Financeiro */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Resumo Financeiro
        </h2>
        <div className="space-y-3">
          {nfValorBruto > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Valor Bruto da NF</span>
              <span className="font-mono text-slate-300">{formatCurrency(nfValorBruto)}</span>
            </div>
          )}
          {nfRetencoes > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Retenções</span>
              <span className="font-mono text-red-400">− {formatCurrency(nfRetencoes)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300 font-medium">
              Valor Líquido da NF{' '}
              <span className="text-xs text-green-400 font-normal">(base de cálculo)</span>
            </span>
            <span className="font-mono text-green-400 font-semibold">{formatCurrency(nfValor)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300 text-sm">Juros projetados</span>
            <span className="font-mono text-amber-400">{formatCurrency(jurosProjetados)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300 text-sm">Taxas projetadas</span>
            <span className="font-mono text-amber-400">{formatCurrency(taxasProjetadas)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300 font-medium">Valor operado + encargos</span>
            <span className="font-mono text-cyan-400 font-semibold">{formatCurrency(valorOperadoComEncargos)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-300">
              Total a recomprar ({selecionadas.size} op{selecionadas.size !== 1 ? 's' : ''})
            </span>
            <span
              className={`font-mono font-semibold ${
                nfInsuficiente ? 'text-red-400' : 'text-purple-400'
              }`}
            >
              {formatCurrency(totalRecomprado)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-300">
              Saldo residual{' '}
              {saldoResidual > 0.005 && (
                <span className="text-xs text-orange-400">(credito no caixa de saldo performado)</span>
              )}
            </span>
            <span
              className={`font-mono font-semibold ${
                nfInsuficiente
                  ? 'text-red-400'
                  : saldoResidual > 0.005
                  ? 'text-orange-400'
                  : 'text-slate-400'
              }`}
            >
              {formatCurrency(Math.max(0, saldoResidual))}
            </span>
          </div>
        </div>

        {nfInsuficiente && (
          <div className="mt-4 flex items-center gap-2 bg-red-950/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            O valor operado com encargos ({formatCurrency(valorOperadoComEncargos)}) é insuficiente para cobrir o total recomprado (
            {formatCurrency(totalRecomprado)}).
          </div>
        )}

        {saldoResidual > 0.005 && !nfInsuficiente && (
          <div className="mt-4 flex items-center gap-2 bg-orange-950/30 border border-orange-700 rounded-lg p-3 text-orange-300 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />O saldo de{' '}
            {formatCurrency(saldoResidual)} será automaticamente registrado no{' '}
            <strong>caixa de saldo performado</strong> para uso futuro.
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Observações</h2>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Informações adicionais sobre esta operação..."
          rows={3}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
        />
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCriar}
          disabled={
            (!isReajuste && !medicaoSelecionadaId && medicoes.length > 0) ||
            (isReajuste && !nfReferencia.trim()) ||
            !nfNumero.trim() ||
            !nfDataEmissao ||
            !nfValorBrutoStr ||
            nfValor <= 0 ||
            !dataReferencia ||
            nfInsuficiente ||
            submitting
          }
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Criando...
            </>
          ) : (
            'Criar Operação Performada'
          )}
        </button>
      </div>
    </div>
  );
}

export default function NovaOperacaoPerformadaPage({
  params,
}: {
  params: { construtoraId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <p className="text-slate-400">Carregando...</p>
        </div>
      }
    >
      <NovaPerformadaContent params={params} />
    </Suspense>
  );
}
