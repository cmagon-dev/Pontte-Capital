'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, Filter, ClipboardList, ArrowLeft, Plus, FileText, DollarSign, CheckCircle2, Clock, XCircle, Eye, Edit, FolderKanban, PlayCircle, TrendingUp, Wallet, AlertCircle, ExternalLink, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { getConstrutoraById, getAllObras, getContratoInfoByObraId, getMedicoesInfoByObraId } from '@/lib/mock-data';
import SweepModal from '@/app/components/SweepModal';
import ModalEAP from '@/app/components/ModalEAP';

export default function SolicitacoesConstrutoraPage({ params }: { params: { construtoraId: string } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [obraSelecionadaId, setObraSelecionadaId] = useState<string>('');
  const [filtroStatusWorkflow, setFiltroStatusWorkflow] = useState<string>('todas');
  const [filtroStatusFinanceiro, setFiltroStatusFinanceiro] = useState<string>('todas');
  const [tipoOperacaoFiltro, setTipoOperacaoFiltro] = useState<'todas' | 'aPerformar' | 'performada'>('todas');
  const [isSweepModalOpen, setIsSweepModalOpen] = useState(false);
  const [isEAPModalOpen, setIsEAPModalOpen] = useState(false);

  const construtora = getConstrutoraById(params.construtoraId);
  
  // Obras da construtora
  const todasObras = getAllObras();
  const obrasConstrutora = todasObras.filter((obra) => obra.construtoraId === params.construtoraId);

  // Dados mockados de operações - em produção viria de API/banco
  // Operações à Performar são as que foram solicitadas mas ainda não foram pagas (podem ser recompradas)
  // Operações Performadas são as que já foram pagas e podem recomprar operações à performar
  const todasOperacoes = [
    {
      id: 'OP-001',
      numero: '001/2024',
      dataSolicitacao: '2024-01-15',
      obraId: obrasConstrutora[0]?.id || 'OBR-001',
      tipoOperacao: 'aPerformar' as const,
      credor: {
        id: 'CRED-001',
        nome: 'Fornecedor ABC Ltda',
        cnpj: '12.345.678/0001-90',
      },
      tipoDocumento: 'Nota Fiscal',
      numeroDocumento: 'NF-12345',
      valor: 45000.00,
      // Projeção de encargos
      projecaoEncargos: {
        dataReferencia: '2024-02-15',
        taxaMensal: 0.015,
        diasCorridos: 31,
        jurosProjetados: 697.50, // 45000 * 0.015 * (31/30)
        taxasProjetadas: 225.00, // 45000 * 0.005
        totalEncargos: 922.50,
      },
      dataLiquidacaoPrevista: '2024-02-15',
      statusWorkflow: 'Em Aprovação',
      statusFinanceiro: 'Aberto',
      dataAprovacao: null,
      aprovador: null,
      dataPagamento: null,
    },
    {
      id: 'OP-002',
      numero: '002/2024',
      dataSolicitacao: '2024-01-18',
      obraId: obrasConstrutora[0]?.id || 'OBR-001',
      tipoOperacao: 'performada' as const,
      credor: {
        id: 'CRED-001',
        nome: 'Fornecedor ABC Ltda',
        cnpj: '12.345.678/0001-90',
      },
      tipoDocumento: 'Pedido de Compra',
      numeroDocumento: 'PC-67890',
      valor: 80000.00,
      // Projeção de encargos
      projecaoEncargos: {
        dataReferencia: '2024-03-01',
        taxaMensal: 0.015,
        diasCorridos: 43,
        jurosProjetados: 1720.00, // 80000 * 0.015 * (43/30)
        taxasProjetadas: 400.00, // 80000 * 0.005
        totalEncargos: 2120.00,
      },
      dataLiquidacaoPrevista: '2024-03-01',
      statusWorkflow: 'Aprovada',
      statusFinanceiro: 'Liquidado',
      dataAprovacao: '2024-01-20',
      aprovador: 'Eng. João Silva',
      dataPagamento: '2024-01-25',
      operacoesRecompradas: ['OP-003'], // IDs das operações à performar que foram recompradas
    },
    {
      id: 'OP-003',
      numero: '003/2024',
      dataSolicitacao: '2024-01-20',
      obraId: obrasConstrutora[0]?.id || 'OBR-001',
      tipoOperacao: 'aPerformar' as const,
      credor: {
        id: 'CRED-002',
        nome: 'Empreiteiro XYZ',
        cnpj: '98.765.432/0001-10',
      },
      tipoDocumento: 'Contrato',
      numeroDocumento: 'CT-11111',
      valor: 120000.00,
      // Projeção de encargos
      projecaoEncargos: {
        dataReferencia: '2024-02-20',
        taxaMensal: 0.015,
        diasCorridos: 31,
        jurosProjetados: 1860.00, // 120000 * 0.015 * (31/30)
        taxasProjetadas: 600.00, // 120000 * 0.005
        totalEncargos: 2460.00,
      },
      dataLiquidacaoPrevista: '2024-02-20',
      statusWorkflow: 'Em Edição',
      statusFinanceiro: 'Liquidado', // Liquidada porque foi recomprada pela OP-002
      dataAprovacao: null,
      aprovador: null,
      dataPagamento: null,
      recompradaPor: 'OP-002', // ID da operação performada que recomprou esta
    },
    {
      id: 'OP-004',
      numero: '004/2024',
      dataSolicitacao: '2024-01-22',
      obraId: obrasConstrutora[0]?.id || 'OBR-001',
      tipoOperacao: 'aPerformar' as const,
      credor: {
        id: 'CRED-002',
        nome: 'Empreiteiro XYZ',
        cnpj: '98.765.432/0001-10',
      },
      tipoDocumento: 'Nota Fiscal',
      numeroDocumento: 'NF-22222',
      valor: 35000.00,
      // Projeção de encargos
      projecaoEncargos: {
        dataReferencia: '2024-03-01',
        taxaMensal: 0.015,
        diasCorridos: 39,
        jurosProjetados: 682.50, // 35000 * 0.015 * (39/30)
        taxasProjetadas: 175.00, // 35000 * 0.005
        totalEncargos: 857.50,
      },
      dataLiquidacaoPrevista: '2024-03-01',
      statusWorkflow: 'Finalizada',
      statusFinanceiro: 'Aberto',
      dataAprovacao: '2024-01-23',
      aprovador: 'Eng. Maria Santos',
      dataPagamento: null,
    },
  ];

  // Filtrar operações por obra selecionada e tipo
  const operacoesFiltradas = useMemo(() => {
    let operacoes = todasOperacoes;
    
    // Filtrar por obra se uma obra estiver selecionada
    if (obraSelecionadaId) {
      operacoes = operacoes.filter((op) => op.obraId === obraSelecionadaId);
    }
    
    // Aplicar todos os filtros
    return operacoes.filter((op) => {
      // Filtrar por busca
      const matchSearch =
        op.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.credor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtrar por tipo de operação
      const matchTipo = tipoOperacaoFiltro === 'todas' || op.tipoOperacao === tipoOperacaoFiltro;
      
      // Filtrar por status workflow
      const matchWorkflow = filtroStatusWorkflow === 'todas' || op.statusWorkflow === filtroStatusWorkflow;
      
      // Filtrar por status financeiro
      const matchFinanceiro = filtroStatusFinanceiro === 'todas' || op.statusFinanceiro === filtroStatusFinanceiro;
      
      return matchSearch && matchTipo && matchWorkflow && matchFinanceiro;
    });
  }, [todasOperacoes, obraSelecionadaId, searchTerm, tipoOperacaoFiltro, filtroStatusWorkflow, filtroStatusFinanceiro]);

  const statusWorkflowOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Em Edição', nome: 'Em Edição' },
    { id: 'Finalizada', nome: 'Finalizada' },
    { id: 'Em Aprovação', nome: 'Em Aprovação' },
    { id: 'Aprovada', nome: 'Aprovada' },
    { id: 'Rejeitada', nome: 'Rejeitada' },
  ];

  const statusFinanceiroOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Aberto', nome: 'Aberto' },
    { id: 'Liquidado', nome: 'Liquidado' },
  ];

  const tipoOperacaoOptions = [
    { id: 'todas', nome: 'Todos os Tipos' },
    { id: 'aPerformar', nome: 'À Performar' },
    { id: 'performada', nome: 'Performada' },
  ];

  const getStatusWorkflowColor = (status: string) => {
    switch (status) {
      case 'Em Edição':
        return 'bg-blue-900 text-blue-400';
      case 'Finalizada':
        return 'bg-slate-700 text-slate-300';
      case 'Em Aprovação':
        return 'bg-amber-900 text-amber-400';
      case 'Aprovada':
        return 'bg-green-900 text-green-400';
      case 'Rejeitada':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusFinanceiroColor = (status: string) => {
    switch (status) {
      case 'Aberto':
        return 'bg-orange-900 text-orange-400';
      case 'Liquidado':
        return 'bg-green-900 text-green-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusWorkflowIcon = (status: string) => {
    switch (status) {
      case 'Em Edição':
        return <Edit className="w-4 h-4" />;
      case 'Finalizada':
        return <FileText className="w-4 h-4" />;
      case 'Em Aprovação':
        return <Clock className="w-4 h-4" />;
      case 'Aprovada':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Rejeitada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusFinanceiroIcon = (status: string) => {
    switch (status) {
      case 'Aberto':
        return <DollarSign className="w-4 h-4" />;
      case 'Liquidado':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  // Obter obra selecionada
  const obraSelecionada = obrasConstrutora.find((obra) => obra.id === obraSelecionadaId);
  
  // Buscar informações adicionais da obra (contrato e medições)
  // Primeiro buscar medições para obter valorFinanceiroMedido, depois passar para contrato
  const medicoesInfo = obraSelecionadaId ? getMedicoesInfoByObraId(obraSelecionadaId) : null;
  const contratoInfo = obraSelecionadaId 
    ? getContratoInfoByObraId(obraSelecionadaId, medicoesInfo?.valorFinanceiroMedido || 0)
    : null;

  // Calcular totais separados por tipo de operação
  const operacoesAPerformar = operacoesFiltradas.filter((op) => op.tipoOperacao === 'aPerformar');
  const operacoesPerformadas = operacoesFiltradas.filter((op) => op.tipoOperacao === 'performada');

  // Totais para Operações à Performar
  const totalAPerformar = operacoesAPerformar.length;
  const aPerformarAbertas = operacoesAPerformar.filter((op) => op.statusFinanceiro === 'Aberto').length;
  const aPerformarLiquidadas = operacoesAPerformar.filter((op) => op.statusFinanceiro === 'Liquidado').length;
  const valorAPerformarAberto = operacoesAPerformar
    .filter((op) => op.statusFinanceiro === 'Aberto')
    .reduce((sum, op) => sum + op.valor, 0);
  // Limite, utilizado e saldo de Op. à Performar (mock - em produção viria de configuração/obra)
  const limiteAPerformar = useMemo(() => {
    // Mock: em produção viria da configuração da obra/construtora
    return 200000.00;
  }, [obraSelecionadaId]);
  const utilizadoAPerformar = operacoesAPerformar.reduce((sum, op) => sum + op.valor, 0);
  const saldoAPerformar = limiteAPerformar - utilizadoAPerformar;
  const percentualSaldoAPerformar = (saldoAPerformar / limiteAPerformar) * 100;
  const saldoAPerformarBaixo = percentualSaldoAPerformar < 20; // Considera baixo se menor que 20%

  // Totais para Operações Performadas
  const totalPerformadas = operacoesPerformadas.length;
  const performadasAbertas = operacoesPerformadas.filter((op) => op.statusFinanceiro === 'Aberto').length;
  const performadasLiquidadas = operacoesPerformadas.filter((op) => op.statusFinanceiro === 'Liquidado').length;
  const valorPerformadasAberto = operacoesPerformadas
    .filter((op) => op.statusFinanceiro === 'Aberto')
    .reduce((sum, op) => sum + op.valor, 0);
  // Limite, utilizado e saldo de operações Performadas (mock - em produção viria de configuração/obra)
  const limitePerformadas = useMemo(() => {
    // Mock: em produção viria da configuração da obra/construtora
    return 500000.00;
  }, [obraSelecionadaId]);
  const utilizadoPerformadas = operacoesPerformadas.reduce((sum, op) => sum + op.valor, 0);
  const saldoPerformadas = limitePerformadas - utilizadoPerformadas;
  const percentualSaldoPerformadas = (saldoPerformadas / limitePerformadas) * 100;
  const saldoPerformadasBaixo = percentualSaldoPerformadas < 20; // Considera baixo se menor que 20%
  
  // Saldo de operações performadas disponível para uso (mock - em produção calcularia saldos residuais)
  const saldoPerformadasDisponivel = useMemo(() => {
    // Mock: em produção calcularia saldos residuais de operações performadas liquidadas
    return 15000.00;
  }, [obraSelecionadaId]);

  // Calcular necessidade do momento
  const necessidadeMomento = useMemo(() => {
    if (saldoAPerformarBaixo && !saldoPerformadasBaixo) {
      return 'Emissão de NF (Operação Performada)';
    } else if (saldoPerformadasBaixo && !saldoAPerformarBaixo) {
      return 'Recebimento do Órgão';
    } else if (saldoAPerformarBaixo && saldoPerformadasBaixo) {
      return 'Emissão de NF e Recebimento';
    }
    return null;
  }, [saldoAPerformarBaixo, saldoPerformadasBaixo]);

  // Totais gerais
  const totalOperacoes = operacoesFiltradas.length;
  const totalAbertas = operacoesFiltradas.filter((op) => op.statusFinanceiro === 'Aberto').length;
  const totalLiquidadas = operacoesFiltradas.filter((op) => op.statusFinanceiro === 'Liquidado').length;
  const valorTotalAberto = operacoesFiltradas
    .filter((op) => op.statusFinanceiro === 'Aberto')
    .reduce((sum, op) => sum + op.valor, 0);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/fin/operacoes/solicitacoes"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Operações Fin. - {construtora.razaoSocial}</h1>
              <p className="text-slate-400">Operações Fin. da Construtora</p>
              <p className="text-slate-500 text-sm mt-1">CNPJ: {construtora.cnpj}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={obraSelecionadaId ? `/fin/operacoes/solicitacoes/${params.construtoraId}/nova?obraId=${obraSelecionadaId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              obraSelecionadaId
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => {
              if (!obraSelecionadaId) {
                e.preventDefault();
                alert('Por favor, selecione uma obra primeiro');
              }
            }}
          >
            <Plus className="w-5 h-5" />
            Op. à Performar
          </Link>
          <Link
            href={obraSelecionadaId ? `/fin/operacoes/solicitacoes/${params.construtoraId}/nova-performada?obraId=${obraSelecionadaId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              obraSelecionadaId
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => {
              if (!obraSelecionadaId) {
                e.preventDefault();
                alert('Por favor, selecione uma obra primeiro');
              }
            }}
          >
            <TrendingUp className="w-5 h-5" />
            Op. Performada
          </Link>
          <Link
            href={obraSelecionadaId ? `/fin/operacoes/solicitacoes/${params.construtoraId}/nova-saldo-performado?obraId=${obraSelecionadaId}` : '#'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              obraSelecionadaId
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => {
              if (!obraSelecionadaId) {
                e.preventDefault();
                alert('Por favor, selecione uma obra primeiro');
              }
            }}
          >
            <Plus className="w-5 h-5" />
            Op. Saldo Performado
          </Link>
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FolderKanban className="w-5 h-5" />
          Obras da Construtora
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obrasConstrutora.map((obra) => {
            const operacoesObra = todasOperacoes.filter((op) => op.obraId === obra.id);
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
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500">
                    {operacoesObra.length} operação(ões)
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mostrar operações apenas se uma obra estiver selecionada */}
      {obraSelecionadaId && obraSelecionada && (
        <>
          {/* Informações da Obra Selecionada */}
          <div className="bg-blue-950/20 border border-blue-800 rounded-lg p-3 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white mb-2">
                  Obra: {obraSelecionada.numeroContrato} - {obraSelecionada.objeto.substring(0, 50)}...
                </h3>
                
                {/* Informações do Contrato */}
                {contratoInfo && (
                  <div className="space-y-2 mt-2">
                    {/* Valores do Contrato */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div className="bg-slate-800/50 rounded p-2">
                        <p className="text-sm text-slate-400 mb-1">Valor Global Inicial</p>
                        <p className="text-sm font-semibold text-white font-mono">{formatCurrency(contratoInfo.valorGlobalInicial)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2">
                        <p className="text-sm text-slate-400 mb-1">Valor Aditivos</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">+{formatCurrency(contratoInfo.valorAditivos)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2">
                        <p className="text-sm text-slate-400 mb-1">Valor Supressões</p>
                        <p className="text-sm font-semibold text-red-400 font-mono">-{formatCurrency(contratoInfo.valorSupressoes)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2">
                        <p className="text-sm text-slate-400 mb-1">Valor Reajustes</p>
                        <p className="text-sm font-semibold text-yellow-400 font-mono">+{formatCurrency(contratoInfo.valorReajustes)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2 border border-green-500/50">
                        <p className="text-sm text-slate-400 mb-1">Valor Atualizado</p>
                        <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(contratoInfo.valorAtualizado)}</p>
                      </div>
                    </div>

                    {/* Empenhos e Saldo Contratual */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-slate-800/50 rounded p-2">
                        <p className="text-sm text-slate-400 mb-1">Saldo Empenhos</p>
                        <p className="text-sm font-semibold text-purple-400 font-mono">{formatCurrency(contratoInfo.saldoEmpenhos)}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2 border border-blue-500/50">
                        <p className="text-sm text-slate-400 mb-1">Saldo Contratual</p>
                        <p className="text-sm font-semibold text-blue-400 font-mono">{formatCurrency(contratoInfo.saldoContratual)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações de Medições */}
                {medicoesInfo && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-sm text-slate-400 mb-1">Medições Realizadas</p>
                      <p className="text-sm font-semibold text-white">{medicoesInfo.quantidadeMedicoes}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-sm text-slate-400 mb-1">Avanço Físico</p>
                      <p className="text-sm font-semibold text-blue-400">{formatPercent(medicoesInfo.avancoFisico)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-sm text-slate-400 mb-1">Valor Financeiro Medido</p>
                      <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(medicoesInfo.valorFinanceiroMedido)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-sm text-slate-400 mb-1">Valor Última Medição</p>
                      <p className="text-sm font-semibold text-yellow-400 font-mono">{formatCurrency(medicoesInfo.valorUltimaMedicao)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <a
                  href={`/eng/contratos/contratos-obras/obra/${obraSelecionada.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Contrato</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setObraSelecionadaId('')}
                  className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* KPIs Resumo - Compacto */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Operações à Performar */}
              <div className="bg-slate-800 border border-blue-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Op. à Performar</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-sm font-bold text-white">{totalAPerformar}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Abertas</p>
                    <p className="text-sm font-bold text-orange-400">{aPerformarAbertas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Liquidadas</p>
                    <p className="text-sm font-bold text-green-400">{aPerformarLiquidadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Valor Aberto</p>
                    <p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorAPerformarAberto)}</p>
                  </div>
                </div>
                <div className="border-t border-blue-700/50 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-sm text-slate-400">Limite</p>
                      <p className="text-sm font-bold text-blue-400 font-mono">{formatCurrency(limiteAPerformar)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Utilizado</p>
                      <p className="text-sm font-bold text-orange-400 font-mono">{formatCurrency(utilizadoAPerformar)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Saldo</p>
                      <p className={`text-sm font-bold font-mono ${saldoAPerformar >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(saldoAPerformar)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operações Performadas */}
              <div className="bg-slate-800 border border-purple-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Op. Performadas</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-sm font-bold text-white">{totalPerformadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Abertas</p>
                    <p className="text-sm font-bold text-orange-400">{performadasAbertas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Liquidadas</p>
                    <p className="text-sm font-bold text-green-400">{performadasLiquidadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Valor Aberto</p>
                    <p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorPerformadasAberto)}</p>
                  </div>
                </div>
                <div className="border-t border-purple-700/50 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-sm text-slate-400">Limite</p>
                      <p className="text-sm font-bold text-purple-400 font-mono">{formatCurrency(limitePerformadas)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Utilizado</p>
                      <p className="text-sm font-bold text-orange-400 font-mono">{formatCurrency(utilizadoPerformadas)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Saldo</p>
                      <p className={`text-sm font-bold font-mono ${saldoPerformadas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(saldoPerformadas)}
                      </p>
                    </div>
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
                  <div>
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-sm font-bold text-white">{totalOperacoes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Abertas</p>
                    <p className="text-sm font-bold text-orange-400">{totalAbertas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Liquidadas</p>
                    <p className="text-sm font-bold text-green-400">{totalLiquidadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Valor Aberto</p>
                    <p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(valorTotalAberto)}</p>
                  </div>
                </div>
                <div className="border-t border-slate-600/50 pt-2 space-y-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wallet className="w-4 h-4 text-amber-400" />
                      <p className="text-sm font-semibold text-amber-300">Saldo Performado Disponível</p>
                    </div>
                    <p className="text-sm font-bold text-amber-400 font-mono">{formatCurrency(saldoPerformadasDisponivel)}</p>
                  </div>
                  {necessidadeMomento && (
                    <div className="pt-2 border-t border-slate-600/50">
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
          </div>

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
                  <input
                    type="text"
                    placeholder="Número, Credor, Documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Operação</label>
                <select
                  value={tipoOperacaoFiltro}
                  onChange={(e) => setTipoOperacaoFiltro(e.target.value as 'todas' | 'aPerformar' | 'performada')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {tipoOperacaoOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status Workflow</label>
                <select
                  value={filtroStatusWorkflow}
                  onChange={(e) => setFiltroStatusWorkflow(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {statusWorkflowOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status Financeiro</label>
                <select
                  value={filtroStatusFinanceiro}
                  onChange={(e) => setFiltroStatusFinanceiro(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {statusFinanceiroOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Operações */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="max-h-[calc(100vh-400px)] overflow-auto">
              <div className="overflow-x-auto">
                <table className="table-engineering w-full border-collapse">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                    <tr>
                      <th className="bg-slate-900 border-b border-slate-700">Tipo</th>
                      <th className="bg-slate-900 border-b border-slate-700">Número</th>
                      <th className="bg-slate-900 border-b border-slate-700">Data</th>
                      <th className="bg-slate-900 border-b border-slate-700">Credor</th>
                      <th className="bg-slate-900 border-b border-slate-700">Documento</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Valor Principal</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Juros/Taxas Proj.</th>
                      <th className="bg-slate-900 border-b border-slate-700">Data Liq. Prevista</th>
                      <th className="number-cell bg-slate-900 border-b border-slate-700">Total Devedor Proj.</th>
                      <th className="bg-slate-900 border-b border-slate-700">Status Workflow</th>
                      <th className="bg-slate-900 border-b border-slate-700">Status Financeiro</th>
                      <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-8 text-slate-400">
                          Nenhuma operação encontrada
                        </td>
                      </tr>
                    ) : (
                      operacoesFiltradas.map((operacao) => {
                        const totalDevedorProjetado = operacao.valor + (operacao.projecaoEncargos?.totalEncargos || 0);
                        return (
                        <tr key={operacao.id} className="hover:bg-slate-800">
                          <td>
                            <div className="flex items-center gap-2">
                              {operacao.tipoOperacao === 'aPerformar' ? (
                                <PlayCircle className="w-4 h-4 text-blue-400" />
                              ) : (
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                              )}
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                operacao.tipoOperacao === 'aPerformar'
                                  ? 'bg-blue-900 text-blue-400'
                                  : 'bg-purple-900 text-purple-400'
                              }`}>
                                {operacao.tipoOperacao === 'aPerformar' ? 'À Performar' : 'Performada'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <p className="font-medium text-white font-mono">{operacao.numero}</p>
                            </div>
                          </td>
                          <td>
                            <p className="text-slate-300 text-sm">{formatDate(operacao.dataSolicitacao)}</p>
                          </td>
                          <td>
                            <div>
                              <p className="text-white text-sm font-medium">{operacao.credor.nome}</p>
                              <p className="text-slate-400 text-xs font-mono">{operacao.credor.cnpj}</p>
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="text-white text-sm">{operacao.tipoDocumento}</p>
                              <p className="text-slate-400 text-xs font-mono">{operacao.numeroDocumento}</p>
                            </div>
                          </td>
                          <td className="number-cell">
                            <p className="text-green-400 font-mono font-semibold">{formatCurrency(operacao.valor)}</p>
                          </td>
                          <td className="number-cell">
                            {operacao.projecaoEncargos ? (
                              <div>
                                <p className="text-amber-400 font-mono text-sm font-semibold">
                                  {formatCurrency(operacao.projecaoEncargos.totalEncargos)}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  J: {formatCurrency(operacao.projecaoEncargos.jurosProjetados)} | 
                                  T: {formatCurrency(operacao.projecaoEncargos.taxasProjetadas)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm">-</p>
                            )}
                          </td>
                          <td>
                            {operacao.dataLiquidacaoPrevista ? (
                              <p className="text-slate-300 text-sm">{formatDate(operacao.dataLiquidacaoPrevista)}</p>
                            ) : (
                              <p className="text-slate-500 text-sm">-</p>
                            )}
                          </td>
                          <td className="number-cell">
                            {operacao.projecaoEncargos ? (
                              <p className="text-green-400 font-mono font-bold">{formatCurrency(totalDevedorProjetado)}</p>
                            ) : (
                              <p className="text-slate-500 text-sm">-</p>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {getStatusWorkflowIcon(operacao.statusWorkflow)}
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusWorkflowColor(operacao.statusWorkflow)}`}>
                                {operacao.statusWorkflow}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {getStatusFinanceiroIcon(operacao.statusFinanceiro)}
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusFinanceiroColor(operacao.statusFinanceiro)}`}>
                                {operacao.statusFinanceiro}
                              </span>
                            </div>
                          </td>
                          <td>
                            <Link
                              href={`/fin/operacoes/solicitacoes/${params.construtoraId}/${operacao.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
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

          {/* Botão para visualizar EAP - EAP Gerencial */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setIsEAPModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Visualizar EAP - EAP Gerencial
            </button>
          </div>
        </>
      )}

      {!obraSelecionadaId && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Selecione uma obra acima para visualizar suas operações</p>
          <p className="text-sm text-slate-500">Clique em uma obra para ver as operações relacionadas</p>
        </div>
      )}

      {/* Modal de Recompra/Sweep */}
      {obraSelecionadaId && (
        <SweepModal
          isOpen={isSweepModalOpen}
          onClose={() => setIsSweepModalOpen(false)}
          operacoesAPerformar={todasOperacoes.filter(
            (op) => op.obraId === obraSelecionadaId && op.tipoOperacao === 'aPerformar' && op.statusFinanceiro === 'Aberto'
          )}
          onConfirmarRecompra={(operacoesSelecionadas, valorTotalRecompra) => {
            // Em produção, aqui faria a chamada à API para:
            // 1. Criar a operação performada
            // 2. Liquidar as operações à performar selecionadas
            // 3. Atualizar os status
            console.log('Recompra confirmada:', {
              operacoesSelecionadas,
              valorTotalRecompra,
              obraId: obraSelecionadaId,
            });
            alert(`Recompra realizada com sucesso! ${operacoesSelecionadas.length} operação(ões) liquidada(s). Total: ${formatCurrency(valorTotalRecompra)}`);
            setIsSweepModalOpen(false);
            // Em produção, recarregaria os dados ou atualizaria o estado
          }}
        />
      )}

      {/* Modal EAP - EAP Gerencial */}
      {obraSelecionadaId && (
        <ModalEAP
          isOpen={isEAPModalOpen}
          onClose={() => setIsEAPModalOpen(false)}
          obraId={obraSelecionadaId}
          operacoes={[
            // Mock: operações com ordensPagamento para a obra
            // Em produção, buscaria essas operações da API
            {
              id: 'OP-001',
              numero: '001/2024',
              tipoOperacao: 'aPerformar' as const,
              ordensPagamento: [
                {
                  id: 'ORD-001',
                  credorNome: 'Fornecedor ABC Ltda',
                  tipoDocumento: 'Nota Fiscal',
                  numeroDocumento: '1234',
                  valorTotal: 5000.00,
                  apropriacoesOrcamentarias: [
                    {
                      subEtapaId: '1.1.1',
                      subEtapaCode: '1.1.1',
                      subEtapaDescription: 'Escavação e Reaterro Mecanizado',
                      etapa: 'Movimentação de Terra',
                      percentual: '100,00',
                      valor: '5000,00',
                    },
                  ],
                },
              ],
            },
            {
              id: 'OP-003',
              numero: '003/2024',
              tipoOperacao: 'aPerformar' as const,
              ordensPagamento: [
                {
                  id: 'ORD-004',
                  credorNome: 'Empreiteiro XYZ',
                  tipoDocumento: 'Contrato',
                  numeroDocumento: 'CT-11111',
                  valorTotal: 120000.00,
                  apropriacoesOrcamentarias: [
                    {
                      subEtapaId: '1.2.1',
                      subEtapaCode: '1.2.1',
                      subEtapaDescription: 'Execução de Fundações',
                      etapa: 'Fundações',
                      percentual: '50,00',
                      valor: '60000,00',
                    },
                  ],
                },
              ],
            },
            {
              id: 'OP-004',
              numero: '004/2024',
              tipoOperacao: 'aPerformar' as const,
              ordensPagamento: [
                {
                  id: 'ORD-005',
                  credorNome: 'Empreiteiro XYZ',
                  tipoDocumento: 'Nota Fiscal',
                  numeroDocumento: 'NF-22222',
                  valorTotal: 35000.00,
                  apropriacoesOrcamentarias: [
                    {
                      subEtapaId: '1.3.1',
                      subEtapaCode: '1.3.1',
                      subEtapaDescription: 'Drenos perimetrais com brita',
                      etapa: 'Drenagem e Impermeabilização',
                      percentual: '100,00',
                      valor: '35000,00',
                    },
                  ],
                },
              ],
            },
            {
              id: 'OP-005',
              numero: '005/2024',
              tipoOperacao: 'saldoPerformado' as const,
              ordensPagamento: [
                {
                  id: 'ORD-002',
                  credorNome: 'Fornecedor DEF Ltda',
                  tipoDocumento: 'Ordem de Pagamento',
                  numeroDocumento: 'OP-555',
                  valorTotal: 8000.00,
                  apropriacoesOrcamentarias: [
                    {
                      subEtapaId: '1.2.1',
                      subEtapaCode: '1.2.1',
                      subEtapaDescription: 'Execução de Fundações',
                      etapa: 'Fundações',
                      percentual: '60,00',
                      valor: '4800,00',
                    },
                    {
                      subEtapaId: '1.2.2',
                      subEtapaCode: '1.2.2',
                      subEtapaDescription: 'Concretagem de Estrutura',
                      etapa: 'Fundações',
                      percentual: '40,00',
                      valor: '3200,00',
                    },
                  ],
                },
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
