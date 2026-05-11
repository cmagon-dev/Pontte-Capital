'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Building2, Filter, ArrowLeft, Plus, FileText, DollarSign,
  CheckCircle2, Clock, XCircle, Eye, Edit, FolderKanban, PlayCircle,
  TrendingUp, AlertCircle, ExternalLink, BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { buscarResumoCaixaSaldoPerformado, listarOperacoesPorConstrutora } from '@/app/actions/operacoes';
import { buscarConfigTaxas } from '@/app/actions/config-taxas';
import { db } from '@/lib/db';
import SweepModal from '@/app/components/SweepModal';
import ModalEAP from '@/app/components/ModalEAP';

type OperacaoFull = Awaited<ReturnType<typeof listarOperacoesPorConstrutora>>[number];

type TipoFiltro = 'todas' | 'A_PERFORMAR' | 'PERFORMADA' | 'SALDO_PERFORMADO';

function getLabelTipo(tipo: string) {
  switch (tipo) {
    case 'A_PERFORMAR': return 'À Performar';
    case 'PERFORMADA': return 'Performada';
    case 'SALDO_PERFORMADO': return 'Saldo Performado';
    default: return tipo;
  }
}

function getStatusWorkflowColor(status: string) {
  switch (status) {
    case 'EM_EDICAO': return 'bg-blue-900 text-blue-400';
    case 'FINALIZADA': return 'bg-slate-700 text-slate-300';
    case 'EM_APROVACAO_TECNICA': return 'bg-amber-900 text-amber-400';
    case 'EM_APROVACAO_FINANCEIRA': return 'bg-amber-900 text-amber-400';
    case 'APROVADA': return 'bg-green-900 text-green-400';
    case 'REJEITADA': return 'bg-red-900 text-red-400';
    default: return 'bg-slate-700 text-slate-300';
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

function getStatusWorkflowIcon(status: string) {
  switch (status) {
    case 'EM_EDICAO': return <Edit className="w-4 h-4" />;
    case 'FINALIZADA': return <FileText className="w-4 h-4" />;
    case 'EM_APROVACAO_TECNICA': return <Clock className="w-4 h-4" />;
    case 'EM_APROVACAO_FINANCEIRA': return <Clock className="w-4 h-4" />;
    case 'APROVADA': return <CheckCircle2 className="w-4 h-4" />;
    case 'REJEITADA': return <XCircle className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function getStatusFinanceiroColor(status: string) {
  switch (status) {
    case 'ABERTO': return 'bg-orange-900 text-orange-400';
    case 'VENCIDO': return 'bg-red-900 text-red-400';
    case 'LIQUIDADO': return 'bg-green-900 text-green-400';
    case 'PENDENTE': return 'bg-slate-700 text-slate-500';
    default: return 'bg-slate-700 text-slate-300';
  }
}


export default function SolicitacoesConstrutoraPage({ params }: { params: { construtoraId: string } }) {
  const [operacoes, setOperacoes] = useState<OperacaoFull[]>([]);
  const [obras, setObras] = useState<Array<{ id: string; nome: string; codigo: string }>>([]);
  const [construtoraNome, setConstrutoraNome] = useState('');
  const [construtoraCnpj, setConstrutoraCnpj] = useState('');
  const [limiteAPerformar, setLimiteAPerformar] = useState(200000);
  const [limitePerformadas, setLimitePerformadas] = useState(500000);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `obra-selecionada-${params.construtoraId}`;

  const [searchTerm, setSearchTerm] = useState('');
  const [obraSelecionadaId, setObraSelecionadaId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY) ?? '';
    }
    return '';
  });
  const [filtroStatusWorkflow, setFiltroStatusWorkflow] = useState('todas');
  const [filtroStatusFinanceiro, setFiltroStatusFinanceiro] = useState<'todas' | 'ABERTO' | 'VENCIDO' | 'LIQUIDADO'>('todas');
  const [tipoOperacaoFiltro, setTipoOperacaoFiltro] = useState<TipoFiltro>('todas');
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
  const [isEAPModalOpen, setIsEAPModalOpen] = useState(false);
  const [resumoCaixa, setResumoCaixa] = useState<{ saldoAtual: number; creditosMes: number; debitosMes: number } | null>(null);

  const handleSetObra = (id: string) => {
    setObraSelecionadaId(id);
    if (typeof window !== 'undefined') {
      if (id) sessionStorage.setItem(STORAGE_KEY, id);
      else sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, config] = await Promise.all([
        listarOperacoesPorConstrutora(params.construtoraId),
        buscarConfigTaxas(params.construtoraId),
      ]);
      setOperacoes(ops);
      if (config.limiteAPerformarMensal) setLimiteAPerformar(config.limiteAPerformarMensal);
      if (config.limitePerformadaMensal) setLimitePerformadas(config.limitePerformadaMensal);

      // Buscar dados da construtora e obras via fetch (client-side)
      const res = await fetch(`/api/construtoras/${params.construtoraId}/obras`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setConstrutoraNome(data.razaoSocial || '');
        setConstrutoraCnpj(data.cnpj || '');
        setObras(data.obras || []);
      } else {
        // Extrair obras únicas das operações
        const obrasMap = new Map<string, { id: string; nome: string; codigo: string }>();
        ops.forEach((op) => {
          if (op.obra) obrasMap.set(op.obra.id, op.obra);
        });
        setObras(Array.from(obrasMap.values()));
      }
    } finally {
      setLoading(false);
    }
  }, [params.construtoraId]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    const carregarResumo = async () => {
      if (!obraSelecionadaId) {
        setResumoCaixa(null);
        return;
      }
      const resumo = await buscarResumoCaixaSaldoPerformado(obraSelecionadaId);
      setResumoCaixa(resumo);
    };
    carregarResumo();
  }, [obraSelecionadaId]);

  const operacoesFiltradas = useMemo(() => {
    return operacoes.filter((op) => {
      const matchObra = !obraSelecionadaId || op.obraId === obraSelecionadaId;
      const matchSearch =
        op.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.ordens.some((o) => (o.credor?.nome ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTipo = tipoOperacaoFiltro === 'todas' || op.tipo === tipoOperacaoFiltro;
      const matchWorkflow = filtroStatusWorkflow === 'todas' || op.statusWorkflow === filtroStatusWorkflow;
      const statusFinDisplay = op.statusWorkflow === 'APROVADA' ? op.statusFinanceiro : null;
      const matchFin = filtroStatusFinanceiro === 'todas' || statusFinDisplay === filtroStatusFinanceiro;
      return matchObra && matchSearch && matchTipo && matchWorkflow && matchFin;
    });
  }, [operacoes, obraSelecionadaId, searchTerm, tipoOperacaoFiltro, filtroStatusWorkflow, filtroStatusFinanceiro]);

  // KPIs — apenas operações APROVADAS contam para saldos e status financeiro
  const aPerformar = operacoesFiltradas.filter((op) => op.tipo === 'A_PERFORMAR');
  const performadas = operacoesFiltradas.filter((op) => op.tipo === 'PERFORMADA');

  const aPerformarAprovadas = aPerformar.filter((op) => op.statusWorkflow === 'APROVADA');
  const performadasAprovadas = performadas.filter((op) => op.statusWorkflow === 'APROVADA');

  const totalAPerformar = aPerformar.length;
  const aPerformarAbertas = aPerformarAprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').length;
  const aPerformarLiquidadas = aPerformarAprovadas.filter((op) => op.statusFinanceiro === 'LIQUIDADO').length;
  const valorAPerformarAberto = aPerformarAprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').reduce((s, op) => s + Number(op.valorTotalOrdens), 0);
  const utilizadoAPerformar = aPerformarAprovadas.reduce((s, op) => s + Number(op.valorTotalOrdens), 0);
  const saldoAPerformar = limiteAPerformar - utilizadoAPerformar;
  const percentualSaldoAPerformar = (saldoAPerformar / limiteAPerformar) * 100;
  const saldoAPerformarBaixo = percentualSaldoAPerformar < 20;

  const totalPerformadas = performadas.length;
  const performadasAbertas = performadasAprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').length;
  const performadasLiquidadas = performadasAprovadas.filter((op) => op.statusFinanceiro === 'LIQUIDADO').length;
  const valorPerformadasAberto = performadasAprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').reduce((s, op) => s + Number(op.valorTotalOrdens), 0);
  const utilizadoPerformadas = performadasAprovadas.reduce((s, op) => s + Number(op.valorTotalOrdens), 0);
  const saldoPerformadas = limitePerformadas - utilizadoPerformadas;
  const percentualSaldoPerformadas = (saldoPerformadas / limitePerformadas) * 100;
  const saldoPerformadasBaixo = percentualSaldoPerformadas < 20;

  const aprovadas = operacoesFiltradas.filter((op) => op.statusWorkflow === 'APROVADA');
  const totalOperacoes = operacoesFiltradas.length;
  const totalAbertas = aprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').length;
  const totalLiquidadas = aprovadas.filter((op) => op.statusFinanceiro === 'LIQUIDADO').length;
  const valorTotalAberto = aprovadas.filter((op) => op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO').reduce((s, op) => s + Number(op.valorTotalOrdens), 0);

  const necessidadeMomento = useMemo(() => {
    if (saldoAPerformarBaixo && !saldoPerformadasBaixo) return 'Emissão de NF (Operação Performada)';
    if (saldoPerformadasBaixo && !saldoAPerformarBaixo) return 'Recebimento do Órgão';
    if (saldoAPerformarBaixo && saldoPerformadasBaixo) return 'Emissão de NF e Recebimento';
    return null;
  }, [saldoAPerformarBaixo, saldoPerformadasBaixo]);

  // Operações À Performar abertas para SweepModal
  const operacoesParaSweep = useMemo(() =>
    operacoes
      .filter((op) => op.obraId === obraSelecionadaId && op.tipo === 'A_PERFORMAR' && (op.statusFinanceiro === 'ABERTO' || op.statusFinanceiro === 'VENCIDO'))
      .map((op) => ({
        id: op.id,
        numero: op.codigo,
        valor: Number(op.valorTotalOrdens),
        dataSolicitacao: op.dataSolicitacao?.toString() ?? new Date().toISOString(),
        credor: { nome: op.ordens[0]?.credor?.nome || 'N/A', cnpj: op.ordens[0]?.credor?.cpfCnpj || '' },
        dataLiquidacaoPrevista: op.dataReferencia.toString(),
        statusFinanceiro: op.statusFinanceiro,
      })),
    [operacoes, obraSelecionadaId]
  );

  // Operações para ModalEAP
  const operacoesParaEAP = useMemo(() =>
    operacoes
      .filter((op) => op.obraId === obraSelecionadaId)
      .map((op) => ({
        id: op.id,
        numero: op.codigo,
        tipoOperacao: op.tipo === 'A_PERFORMAR' ? 'aPerformar' as const : op.tipo === 'PERFORMADA' ? 'performada' as const : 'saldoPerformado' as const,
        ordensPagamento: op.ordens.map((o) => ({
          id: o.id,
          credorNome: o.credor?.nome ?? 'Credor nao informado',
          tipoDocumento: o.tipoDocumento,
          numeroDocumento: o.numeroDocumento,
          valorTotal: Number(o.valorTotal),
          apropriacoesOrcamentarias: o.apropriacoesOrcamentarias.map((ap) => ({
            subEtapaId: ap.itemVisaoGerencialId || ap.subEtapaCodigo,
            subEtapaCode: ap.subEtapaCodigo,
            subEtapaDescription: ap.subEtapaDescricao,
            etapa: ap.etapaNome,
            percentual: ap.percentual.toString(),
            valor: ap.valor.toString(),
          })),
        })),
      })),
    [operacoes, obraSelecionadaId]
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fin/operacoes/solicitacoes" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Operações Fin. {construtoraNome && `- ${construtoraNome}`}</h1>
              <p className="text-slate-400">Operações Financeiras da Construtora</p>
              {construtoraCnpj && <p className="text-slate-500 text-sm mt-1">CNPJ: {construtoraCnpj}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Seleção de Obra */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5" />
          Seleção de Obra
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Filtrar por obra</label>
            <select
              value={obraSelecionadaId}
              onChange={(e) => handleSetObra(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas as obras</option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.codigo} - {obra.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-slate-400">
              Exibindo {obraSelecionadaId ? 'operações da obra selecionada' : 'todas as operações da construtora'}.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
          <Link
            href={obraSelecionadaId ? `/fin/operacoes/solicitacoes/${params.construtoraId}/nova?obraId=${obraSelecionadaId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${obraSelecionadaId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'}`}
            onClick={(e) => { if (!obraSelecionadaId) { e.preventDefault(); alert('Selecione uma obra primeiro'); } }}
          >
            <Plus className="w-5 h-5" />
            Op. à Performar
          </Link>
          <Link
            href={obraSelecionadaId ? `/fin/operacoes/solicitacoes/${params.construtoraId}/nova-performada?obraId=${obraSelecionadaId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${obraSelecionadaId ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'}`}
            onClick={(e) => { if (!obraSelecionadaId) { e.preventDefault(); alert('Selecione uma obra primeiro'); } }}
          >
            <TrendingUp className="w-5 h-5" />
            Op. Performada
          </Link>
        </div>
      </div>

      <>
          {/* KPIs */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* À Performar */}
              <div className="bg-slate-800 border border-blue-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Op. à Performar</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><p className="text-sm text-slate-400">Total</p><p className="text-sm font-bold text-white">{totalAPerformar}</p></div>
                  <div><p className="text-sm text-slate-400">Abertas</p><p className="text-sm font-bold text-orange-400">{aPerformarAbertas}</p></div>
                  <div><p className="text-sm text-slate-400">Liquidadas</p><p className="text-sm font-bold text-green-400">{aPerformarLiquidadas}</p></div>
                  <div><p className="text-sm text-slate-400">Valor Aberto</p><p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorAPerformarAberto)}</p></div>
                </div>
                <div className="border-t border-blue-700/50 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-sm text-slate-400">Limite</p><p className="text-sm font-bold text-blue-400 font-mono">{formatCurrency(limiteAPerformar)}</p></div>
                    <div><p className="text-sm text-slate-400">Utilizado</p><p className="text-sm font-bold text-orange-400 font-mono">{formatCurrency(utilizadoAPerformar)}</p></div>
                    <div><p className="text-sm text-slate-400">Saldo</p><p className={`text-sm font-bold font-mono ${saldoAPerformar >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(saldoAPerformar)}</p></div>
                  </div>
                </div>
              </div>

              {/* Performadas */}
              <div className="bg-slate-800 border border-purple-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Op. Performadas</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><p className="text-sm text-slate-400">Total</p><p className="text-sm font-bold text-white">{totalPerformadas}</p></div>
                  <div><p className="text-sm text-slate-400">Abertas</p><p className="text-sm font-bold text-orange-400">{performadasAbertas}</p></div>
                  <div><p className="text-sm text-slate-400">Liquidadas</p><p className="text-sm font-bold text-green-400">{performadasLiquidadas}</p></div>
                  <div><p className="text-sm text-slate-400">Valor Aberto</p><p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorPerformadasAberto)}</p></div>
                </div>
                <div className="border-t border-purple-700/50 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-sm text-slate-400">Limite</p><p className="text-sm font-bold text-purple-400 font-mono">{formatCurrency(limitePerformadas)}</p></div>
                    <div><p className="text-sm text-slate-400">Utilizado</p><p className="text-sm font-bold text-orange-400 font-mono">{formatCurrency(utilizadoPerformadas)}</p></div>
                    <div><p className="text-sm text-slate-400">Saldo</p><p className={`text-sm font-bold font-mono ${saldoPerformadas >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(saldoPerformadas)}</p></div>
                  </div>
                </div>
              </div>

              {/* Resumo Geral */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-white">Resumo Geral</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><p className="text-sm text-slate-400">Total</p><p className="text-sm font-bold text-white">{totalOperacoes}</p></div>
                  <div><p className="text-sm text-slate-400">Abertas</p><p className="text-sm font-bold text-orange-400">{totalAbertas}</p></div>
                  <div><p className="text-sm text-slate-400">Liquidadas</p><p className="text-sm font-bold text-green-400">{totalLiquidadas}</p></div>
                  <div><p className="text-sm text-slate-400">Valor Aberto</p><p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorTotalAberto)}</p></div>
                </div>
                {necessidadeMomento && (
                  <div className="border-t border-slate-600/50 pt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <p className="text-sm font-semibold text-orange-300">Necessidade do Momento</p>
                    </div>
                    <p className="text-sm font-bold text-orange-400">{necessidadeMomento}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {obraSelecionadaId && resumoCaixa && (
            <div className="bg-slate-900 border border-emerald-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-emerald-300">Caixa de Saldo Performado</h3>
                <Link
                  href={`/fin/operacoes/solicitacoes/${params.construtoraId}/caixa-saldo-performado?obraId=${obraSelecionadaId}`}
                  className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
                >
                  Ver extrato
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Saldo atual</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{formatCurrency(resumoCaixa.saldoAtual)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Créditos no mês</p>
                  <p className="text-base font-bold text-green-400 font-mono">{formatCurrency(resumoCaixa.creditosMes)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Débitos no mês</p>
                  <p className="text-base font-bold text-orange-400 font-mono">{formatCurrency(resumoCaixa.debitosMes)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="Código, Credor, Documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Operação</label>
                <select value={tipoOperacaoFiltro} onChange={(e) => setTipoOperacaoFiltro(e.target.value as TipoFiltro)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="todas">Todos os Tipos</option>
                  <option value="A_PERFORMAR">À Performar</option>
                  <option value="PERFORMADA">Performada</option>
                  <option value="SALDO_PERFORMADO">Saldo Performado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status Workflow</label>
                <select value={filtroStatusWorkflow} onChange={(e) => setFiltroStatusWorkflow(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="todas">Todos</option>
                  <option value="EM_EDICAO">Em Edição</option>
                  <option value="FINALIZADA">Finalizada</option>
                  <option value="EM_APROVACAO_TECNICA">Em Aprovação Técnica</option>
                  <option value="EM_APROVACAO_FINANCEIRA">Em Aprovação Financeira</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="REJEITADA">Rejeitada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status Financeiro</label>
                <select value={filtroStatusFinanceiro} onChange={(e) => setFiltroStatusFinanceiro(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="todas">Todos</option>
                  <option value="ABERTO">Aberto</option>
                  <option value="VENCIDO">Vencido</option>
                  <option value="LIQUIDADO">Liquidado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="max-h-[calc(100vh-400px)] overflow-auto">
              <div className="overflow-x-auto">
                <table className="table-engineering w-full border-collapse">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                    <tr>
                      <th className="bg-slate-900 border-b border-slate-700">Tipo</th>
                      <th className="bg-slate-900 border-b border-slate-700">Código</th>
                      <th className="bg-slate-900 border-b border-slate-700">Data</th>
                      <th className="bg-slate-900 border-b border-slate-700">Credores</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Valor Total</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Juros Proj.</th>
                      <th className="bg-slate-900 border-b border-slate-700">Data Referência</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Total Devedor</th>
                      <th className="bg-slate-900 border-b border-slate-700">Status Workflow</th>
                      <th className="bg-slate-900 border-b border-slate-700">Status Fin.</th>
                      <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-8 text-slate-400">Nenhuma operação encontrada</td>
                      </tr>
                    ) : (
                      operacoesFiltradas.map((op) => {
                        const totalDevedor = Number(op.valorTotalOrdens) + Number(op.jurosProjetados) + Number(op.taxasAdministrativas);
                        const credorNomes = [...new Set(op.ordens.map((o) => o.credor?.nome ?? 'Credor nao informado'))].join(', ');
                        return (
                          <tr key={op.id} className="hover:bg-slate-800">
                            <td>
                              <div className="flex items-center gap-2">
                                {op.tipo === 'A_PERFORMAR' ? <PlayCircle className="w-4 h-4 text-blue-400" /> : op.tipo === 'PERFORMADA' ? <TrendingUp className="w-4 h-4 text-purple-400" /> : <DollarSign className="w-4 h-4 text-amber-400" />}
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${op.tipo === 'A_PERFORMAR' ? 'bg-blue-900 text-blue-400' : op.tipo === 'PERFORMADA' ? 'bg-purple-900 text-purple-400' : 'bg-amber-900 text-amber-400'}`}>
                                  {getLabelTipo(op.tipo)}
                                </span>
                              </div>
                            </td>
                            <td><p className="font-medium text-white font-mono">{op.codigo}</p></td>
                            <td><p className="text-slate-300 text-sm">{formatDate(op.dataSolicitacao.toString())}</p></td>
                            <td><p className="text-white text-sm">{credorNomes.substring(0, 40)}</p></td>
                            <td className="number-cell"><p className="text-green-400 font-mono font-semibold">{formatCurrency(Number(op.valorTotalOrdens))}</p></td>
                            <td className="number-cell">
                              <p className="text-amber-400 font-mono text-sm">{formatCurrency(Number(op.jurosProjetados) + Number(op.taxasAdministrativas))}</p>
                            </td>
                            <td><p className="text-slate-300 text-sm">{formatDate(op.dataReferencia.toString())}</p></td>
                            <td className="number-cell"><p className="text-green-400 font-mono font-bold">{formatCurrency(totalDevedor)}</p></td>
                            <td>
                              <div className="flex items-center gap-2">
                                {getStatusWorkflowIcon(op.statusWorkflow)}
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusWorkflowColor(op.statusWorkflow)}`}>{getLabelWorkflow(op.statusWorkflow)}</span>
                              </div>
                            </td>
                            <td>
                              {op.statusWorkflow === 'APROVADA' ? (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusFinanceiroColor(op.statusFinanceiro)}`}>
                                  {op.statusFinanceiro === 'LIQUIDADO' ? 'Liquidado' : op.statusFinanceiro === 'VENCIDO' ? 'Vencido' : 'Aberto'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-600 border border-slate-700">
                                  —
                                </span>
                              )}
                            </td>
                            <td>
                              <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}/${op.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                                <Eye className="w-4 h-4" />
                                Visualizar
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setIsEAPModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <BarChart3 className="w-5 h-5" />
              Visualizar EAP - EAP Gerencial
            </button>
          </div>
      </>

      {obraSelecionadaId && (
        <SweepModal
          isOpen={isSweepModalOpen}
          onClose={() => setIsSweepModalOpen(false)}
          operacoesAPerformar={operacoesParaSweep}
          onConfirmarRecompra={(ops, total) => {
            alert(`Recompra: ${ops.length} op(ões) — ${formatCurrency(total)}`);
            setIsSweepModalOpen(false);
          }}
        />
      )}

      {obraSelecionadaId && (
        <ModalEAP
          isOpen={isEAPModalOpen}
          onClose={() => setIsEAPModalOpen(false)}
          obraId={obraSelecionadaId}
          operacoes={operacoesParaEAP}
        />
      )}
    </div>
  );
}
