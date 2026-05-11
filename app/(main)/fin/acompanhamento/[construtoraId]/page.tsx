'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileText, Building2, FolderKanban, CheckCircle2, DollarSign, Wallet, CreditCard, Banknote, ChevronRight, ChevronDown, BarChart3, ExternalLink, TrendingUp, AlertTriangle, ClipboardList, Calendar, Hammer, Layers } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate, formatQuantity } from '@/lib/utils/format';
import { getAllObras, getConstrutoraById, getContratoInfoByObraId, getMedicoesInfoByObraId, getPlanilhaContratualByObraId, getVisaoGerencialByObraId, getCategorizacaoByObraId } from '@/lib/mock-data';

type EAPItem = {
  id: string;
  item: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoTotal: number;
  nivel: number;
  tipo: 'agrupador' | 'item';
  filhos: string[];
  parentId?: string;
  etapa?: string;
  subetapa?: string;
  servicoSimplificado?: string;
  apropriacoesOrcamentarias?: {
    valorOrcado: number;
    valorRealizado: number;
    percentualApropriado: number;
    percentualComprado: number;
  };
};

type ItemPlanilhaContratual = {
  id: string;
  item: string;
  descricao: string;
  unidade: string;
  precoTotal: number;
  servicoSimplificado: string;
};

type OrdemPagamento = {
  id: string;
  numero: string;
  credor: string;
  valor: number;
  data: string;
  servicoSimplificado: string;
};

export default function AcompanhamentoFinanceiroPorConstrutoraPage({ params }: { params: { construtoraId: string } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [obraSelecionadaId, setObraSelecionadaId] = useState<string>('');
  const [expandedEAPRows, setExpandedEAPRows] = useState<Set<string>>(new Set());

  // Buscar construtora e obras
  const construtora = getConstrutoraById(params.construtoraId);
  const obras = getAllObras()
    .filter((obra) => obra.construtoraId === params.construtoraId)
    .map((obra) => ({
      id: obra.id,
      numeroContrato: obra.numeroContrato,
      objeto: obra.objeto,
      status: obra.status,
      valorGlobal: obra.valorGlobal,
      percentualExecucao: 45.8,
    }));

  const statusOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Ativa', nome: 'Ativa' },
    { id: 'Atrasada', nome: 'Atrasada' },
  ];

  const filteredObras = obras.filter((obra) => {
    const matchSearch = obra.numeroContrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.objeto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filtroStatus === 'todas' || obra.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  const obraSelecionada = obras.find((obra) => obra.id === obraSelecionadaId);
  const medicoesInfo = obraSelecionadaId ? getMedicoesInfoByObraId(obraSelecionadaId) : null;
  const contratoInfo = obraSelecionadaId && medicoesInfo
    ? getContratoInfoByObraId(obraSelecionadaId, medicoesInfo.valorFinanceiroMedido || 0)
    : null;

  // Mock: Dados de operações financeiras
  const operacoesFinanceiras = obraSelecionadaId ? [
    {
      id: 'OP-001',
      numero: '001/2024',
      tipo: 'aPerformar' as const,
      credor: 'Fornecedor ABC Ltda',
      valor: 45000.00,
      statusWorkflow: 'Aprovada',
      statusFinanceiro: 'Aberto',
      dataSolicitacao: '2024-01-15',
    },
    {
      id: 'OP-002',
      numero: '002/2024',
      tipo: 'performada' as const,
      credor: 'Empreiteiro XYZ',
      valor: 80000.00,
      statusWorkflow: 'Aprovada',
      statusFinanceiro: 'Liquidado',
      dataSolicitacao: '2024-01-18',
    },
  ] : [];

  // Mock: Dados de cadastros
  const dadosCadastros = obraSelecionadaId ? {
    totalBancos: 3,
    totalCredores: 15,
    totalPlanosContas: 3,
    saldoTotal: 1500000.00,
  } : null;

  // Ordens de pagamento por serviço (mock) - calcular antes para usar no cálculo do % comprado
  const ordensPagamentoPorServicoPreCalc = useMemo(() => {
    if (!obraSelecionadaId) return {};
    
    const mockOrdens: Record<string, OrdemPagamento[]> = {};
    const visaoGerencial = getVisaoGerencialByObraId(obraSelecionadaId);
    const servicos = visaoGerencial.filter((item) => item.servicoSimplificado && item.tipo === 'item');
    
    servicos.forEach((servico, index) => {
      if (servico.servicoSimplificado) {
        mockOrdens[servico.servicoSimplificado] = index % 2 === 0 ? [
          {
            id: `OP-SERV-${servico.id}-001`,
            numero: `${String(index + 1).padStart(3, '0')}/2024`,
            credor: 'Fornecedor ABC Ltda',
            valor: servico.precoTotal * 0.20,
            data: '2024-01-15',
            servicoSimplificado: servico.servicoSimplificado,
          },
          {
            id: `OP-SERV-${servico.id}-002`,
            numero: `${String(index + 1).padStart(3, '0')}/2024-2`,
            credor: 'Empreiteiro XYZ',
            valor: servico.precoTotal * 0.18,
            data: '2024-02-10',
            servicoSimplificado: servico.servicoSimplificado,
          },
        ] : [
          {
            id: `OP-SERV-${servico.id}-001`,
            numero: `${String(index + 1).padStart(3, '0')}/2024`,
            credor: 'Fornecedor ABC Ltda',
            valor: servico.precoTotal * 0.25,
            data: '2024-01-20',
            servicoSimplificado: servico.servicoSimplificado,
          },
        ];
      }
    });
    
    return mockOrdens;
  }, [obraSelecionadaId]);

  // EAP com apropriações orçamentárias (usando EAP Gerencial)
  const eapData = useMemo(() => {
    if (!obraSelecionadaId) return [];
    const visaoGerencial = getVisaoGerencialByObraId(obraSelecionadaId);
    return visaoGerencial.map((item): EAPItem => {
      // Calcular % comprado baseado nas ordens de pagamento
      let percentualComprado = 0;
      if (item.servicoSimplificado && ordensPagamentoPorServicoPreCalc[item.servicoSimplificado]) {
        const valorTotalOPs = ordensPagamentoPorServicoPreCalc[item.servicoSimplificado]
          .reduce((sum, op) => sum + op.valor, 0);
        percentualComprado = item.precoTotal > 0 ? (valorTotalOPs / item.precoTotal) * 100 : 0;
      }

      return {
        id: item.id,
        item: item.numeroHierarquico || item.id,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        precoTotal: item.precoTotal,
        nivel: item.nivel,
        tipo: item.tipo,
        filhos: item.filhos,
        parentId: item.parentId,
        etapa: item.etapa,
        subetapa: item.subetapa,
        servicoSimplificado: item.servicoSimplificado,
        apropriacoesOrcamentarias: {
          valorOrcado: item.precoTotal,
          valorRealizado: item.precoTotal * 0.45, // Mock - 45% realizado
          percentualApropriado: 45.00,
          percentualComprado,
        },
      };
    });
  }, [obraSelecionadaId, ordensPagamentoPorServicoPreCalc]);

  // Itens da planilha contratual por serviço
  const itensPlanilhaPorServico = useMemo(() => {
    if (!obraSelecionadaId) return {};
    const categorizacao = getCategorizacaoByObraId(obraSelecionadaId);
    const agrupamento: Record<string, ItemPlanilhaContratual[]> = {};
    
    categorizacao.forEach((item) => {
      if (item.servicoSimplificado && item.tipo === 'item') {
        if (!agrupamento[item.servicoSimplificado]) {
          agrupamento[item.servicoSimplificado] = [];
        }
        agrupamento[item.servicoSimplificado].push({
          id: item.id,
          item: item.item,
          descricao: item.descricao,
          unidade: item.unidade,
          precoTotal: item.precoTotal,
          servicoSimplificado: item.servicoSimplificado,
        });
      }
    });
    
    return agrupamento;
  }, [obraSelecionadaId]);

  // Reutilizar ordens de pagamento já calculadas
  const ordensPagamentoPorServico = ordensPagamentoPorServicoPreCalc;

  const toggleEAPRow = (itemId: string) => {
    const newExpanded = new Set(expandedEAPRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedEAPRows(newExpanded);
  };

  const getEAPChildren = (parentId: string): EAPItem[] => {
    return eapData.filter((item) => item.parentId === parentId);
  };

  const isServicoUltimoNivel = (item: EAPItem): boolean => {
    return !!item.servicoSimplificado && item.tipo === 'item' && item.filhos.length === 0;
  };

  const renderEAPRow = (item: EAPItem, depth: number = 0): React.ReactNode => {
    const hasChildren = item.filhos.length > 0;
    const isExpanded = expandedEAPRows.has(item.id);
    const children = hasChildren ? getEAPChildren(item.id) : [];
    const isServico = isServicoUltimoNivel(item);
    const itensPlanilha = isServico && item.servicoSimplificado ? (itensPlanilhaPorServico[item.servicoSimplificado] || []) : [];
    const ordensPagamento = isServico && item.servicoSimplificado ? (ordensPagamentoPorServico[item.servicoSimplificado] || []) : [];

    return (
      <React.Fragment key={item.id}>
        <tr className={`hover:bg-slate-800 ${item.tipo === 'agrupador' ? 'bg-slate-850' : ''}`}>
          <td style={{ paddingLeft: `${depth * 24 + 12}px` }} className="py-2">
            <div className="flex items-center gap-2">
              {(hasChildren || isServico) ? (
                <button
                  onClick={() => toggleEAPRow(item.id)}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <span className={`font-mono text-sm ${item.tipo === 'agrupador' ? 'font-bold text-blue-400' : 'text-slate-300'}`}>
                {item.item}
              </span>
            </div>
          </td>
          <td className="py-2 text-sm text-slate-300">{item.descricao}</td>
          <td className="py-2 text-sm text-slate-400 text-center">{item.unidade || '-'}</td>
          <td className="py-2 text-sm text-blue-400 font-mono text-right">
            {formatCurrency(item.apropriacoesOrcamentarias?.valorOrcado || item.precoTotal)}
          </td>
          <td className="py-2 text-sm text-green-400 font-mono text-right">
            {formatCurrency(item.apropriacoesOrcamentarias?.valorRealizado || 0)}
          </td>
          <td className="py-2 text-sm text-amber-400 font-mono text-right">
            {formatPercent(item.apropriacoesOrcamentarias?.percentualApropriado || 0)}
          </td>
          <td className="py-2 text-sm text-purple-400 font-mono text-right">
            {formatPercent(item.apropriacoesOrcamentarias?.percentualComprado || 0)}
          </td>
        </tr>
        
        {/* Itens da planilha contratual do serviço (quando expandido) */}
        {isServico && isExpanded && itensPlanilha.length > 0 && (
          <>
            <tr>
              <td colSpan={6} className="py-2 px-4 bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-400 uppercase">Itens da Planilha Contratual</p>
              </td>
            </tr>
            {itensPlanilha.map((itemPlanilha) => (
              <tr key={`planilha-${itemPlanilha.id}`} className="bg-slate-800/30">
                <td style={{ paddingLeft: `${(depth + 1) * 24 + 36}px` }} className="py-1">
                  <span className="text-xs text-slate-400 font-mono">{itemPlanilha.item}</span>
                </td>
                <td className="py-1 text-xs text-slate-400">{itemPlanilha.descricao}</td>
                <td className="py-1 text-xs text-slate-500 text-center">{itemPlanilha.unidade}</td>
                <td className="py-1 text-xs text-slate-500 font-mono text-right">
                  {formatCurrency(itemPlanilha.precoTotal)}
                </td>
                <td colSpan={2}></td>
              </tr>
            ))}
          </>
        )}

        {/* Ordens de pagamento do serviço (quando expandido) */}
        {isServico && isExpanded && ordensPagamento.length > 0 && (
          <>
            <tr>
              <td colSpan={6} className="py-2 px-4 bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-400 uppercase">Ordens de Pagamento Apropriadas</p>
              </td>
            </tr>
            {ordensPagamento.map((op) => (
              <tr key={`op-${op.id}`} className="bg-slate-800/30">
                <td style={{ paddingLeft: `${(depth + 1) * 24 + 36}px` }} className="py-1">
                  <span className="text-xs text-purple-400 font-mono">{op.numero}</span>
                </td>
                <td className="py-1 text-xs text-slate-400">{op.credor}</td>
                <td className="py-1 text-xs text-slate-500 text-center">{formatDate(op.data)}</td>
                <td className="py-1 text-xs text-slate-500 font-mono text-right">
                  {formatCurrency(op.valor)}
                </td>
                <td colSpan={2}></td>
              </tr>
            ))}
          </>
        )}

        {/* Filhos hierárquicos */}
        {hasChildren && isExpanded && children.map((child) => renderEAPRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (!construtora) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">Construtora não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/fin/acompanhamento"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Acompanhamento Financeiro - {construtora.razaoSocial}</h1>
              <p className="text-slate-400">Acompanhamento de operações, cadastros e apropriações orçamentárias</p>
              <p className="text-slate-500 text-sm mt-1">CNPJ: {construtora.cnpj}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5" />
          Obras da Construtora
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObras.map((obra) => {
            const isSelected = obraSelecionadaId === obra.id;
            return (
              <button
                key={obra.id}
                type="button"
                onClick={() => setObraSelecionadaId(isSelected ? '' : obra.id)}
                className={`bg-slate-800 border-2 rounded-lg p-4 text-left transition-colors hover:border-blue-500 ${
                  isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-mono text-slate-400 mb-1">{obra.numeroContrato}</p>
                    <p className="text-white font-medium text-sm">{obra.objeto.substring(0, 60)}...</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500">
                    % Execução: <span className="text-blue-400 font-semibold">{formatPercent(obra.percentualExecucao)}</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhes da Obra Selecionada */}
      {obraSelecionadaId && obraSelecionada && (
        <>
          {/* Informações da Obra */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Informações da Obra</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/eng/contratos/contratos-obras/obra/${obraSelecionada.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Contrato</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => setObraSelecionadaId('')}
                  className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            {contratoInfo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Global Inicial</p>
                  <p className="text-sm font-semibold text-white font-mono">{formatCurrency(contratoInfo.valorGlobalInicial)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Aditivos</p>
                  <p className="text-sm font-semibold text-green-400 font-mono">+{formatCurrency(contratoInfo.valorAditivos)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Atualizado</p>
                  <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(contratoInfo.valorAtualizado)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Saldo Empenhos</p>
                  <p className="text-sm font-semibold text-purple-400 font-mono">{formatCurrency(contratoInfo.saldoEmpenhos)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Saldo Contratual</p>
                  <p className="text-sm font-semibold text-blue-400 font-mono">{formatCurrency(contratoInfo.saldoContratual)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Operações Financeiras */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold text-white">Operações Financeiras</h2>
              </div>
              <Link
                href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas as operações <ExternalLink className="w-3 h-3 inline ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Total de Operações</p>
                <p className="text-2xl font-bold text-white font-mono">{operacoesFinanceiras.length}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Valor Total</p>
                <p className="text-lg font-bold text-green-400 font-mono">
                  {formatCurrency(operacoesFinanceiras.reduce((sum, op) => sum + op.valor, 0))}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Operações Abertas</p>
                <p className="text-2xl font-bold text-amber-400 font-mono">
                  {operacoesFinanceiras.filter((op) => op.statusFinanceiro === 'Aberto').length}
                </p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 mb-2">Operações Liquidadas</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {operacoesFinanceiras.filter((op) => op.statusFinanceiro === 'Liquidado').length}
                </p>
              </div>
            </div>
          </div>

          {/* Cadastros */}
          {dadosCadastros && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Cadastros Financeiros</h2>
                </div>
                <Link
                  href={`/fin/cadastros/${params.construtoraId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Ver cadastros <ExternalLink className="w-3 h-3 inline ml-1" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Total de Bancos</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">{dadosCadastros.totalBancos}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Total de Credores</p>
                  <p className="text-2xl font-bold text-purple-400 font-mono">{dadosCadastros.totalCredores}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Planos de Contas</p>
                  <p className="text-2xl font-bold text-amber-400 font-mono">{dadosCadastros.totalPlanosContas}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Saldo Total</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(dadosCadastros.saldoTotal)}</p>
                </div>
              </div>
            </div>
          )}

          {/* EAP Gerencial - EAP com Apropriações Orçamentárias */}
          {eapData.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">EAP Gerencial - EAP com Apropriações Orçamentárias</h2>
                </div>
              </div>
              <div className="max-h-[calc(100vh-500px)] overflow-auto" style={{ scrollbarWidth: 'thin' }}>
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-900 z-20">
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 sticky left-0 bg-slate-900 z-20">Item / Descrição</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Unidade</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Valor Orçado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">Valor Realizado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">% Apropriado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-300">% Comprado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eapData.filter((item) => !item.parentId).map((item) => renderEAPRow(item))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!obraSelecionadaId && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Selecione uma obra acima para visualizar seus detalhes financeiros</p>
          <p className="text-sm text-slate-500">Clique em uma obra para ver as informações de acompanhamento relacionadas</p>
        </div>
      )}
    </div>
  );
}
