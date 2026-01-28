'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, FileText, Building2, MapPin, Filter, ClipboardList, FolderKanban, CheckCircle2, AlertTriangle, DollarSign, Calendar, Hammer, ExternalLink, Percent, Clock, XCircle, Edit2 } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';
import { getAllObras, getConstrutoraById, getContratoInfoByObraId, getMedicoesInfoByObraId } from '@/lib/mock-data';

export default function AcompanhamentoPorConstrutoraPage({ params }: { params: { construtoraId: string } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [obraSelecionadaId, setObraSelecionadaId] = useState<string>('');

  // Buscar construtora e obras
  const construtora = getConstrutoraById(params.construtoraId);
  const obras = getAllObras()
    .filter((obra) => obra.construtoraId === params.construtoraId)
    .map((obra) => ({
      id: obra.id,
      numeroContrato: obra.numeroContrato,
      numeroEdital: obra.numeroEdital,
      objeto: obra.objeto,
      contratante: obra.contratante,
      construtora: {
        id: obra.construtoraId,
        nome: obra.construtoraNome,
      },
      fundo: {
        id: obra.fundoId,
        nome: obra.fundoNome,
      },
      valorGlobal: obra.valorGlobal,
      dataInicio: obra.dataInicio,
      dataFim: obra.dataFim,
      enderecoObra: obra.enderecoObra,
      status: obra.status,
      percentualExecucao: 45.8, // Mock - em produção viria do banco
      percentualPlanejado: 52.3, // % do planejado executado
    }));

  const statusOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Ativa', nome: 'Ativa' },
    { id: 'Atrasada', nome: 'Atrasada' },
    { id: 'Em Planejamento', nome: 'Em Planejamento' },
    { id: 'Finalizada', nome: 'Finalizada' },
    { id: 'Parada', nome: 'Parada' },
  ];

  const filteredObras = obras.filter((obra) => {
    const matchSearch =
      obra.numeroContrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.contratante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.numeroEdital?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todas' || obra.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

  // Obter obra selecionada
  const obraSelecionada = obras.find((obra) => obra.id === obraSelecionadaId);
  
  // Buscar informações adicionais da obra quando selecionada
  const medicoesInfo = obraSelecionadaId ? getMedicoesInfoByObraId(obraSelecionadaId) : null;
  const contratoInfo = obraSelecionadaId && medicoesInfo
    ? getContratoInfoByObraId(obraSelecionadaId, medicoesInfo.valorFinanceiroMedido || 0)
    : null;

  // Mock: Documentos/CNDs da construtora (em produção viria do cadastro de construtoras)
  const documentosConstrutora = obraSelecionadaId ? [
    {
      categoria: 'Fiscal',
      tipo: 'CND Federal',
      dataValidade: '2024-01-15',
      status: 'Vencido',
      diasVencimento: 25,
    },
    {
      categoria: 'Fiscal',
      tipo: 'CND Estadual',
      dataValidade: '2024-06-30',
      status: 'Válido',
      diasVencimento: 170,
    },
    {
      categoria: 'Fiscal',
      tipo: 'CND Municipal',
      dataValidade: '2024-12-31',
      status: 'Válido',
      diasVencimento: 355,
    },
    {
      categoria: 'Fiscal',
      tipo: 'FGTS',
      dataValidade: '2024-03-15',
      status: 'Vencendo',
      diasVencimento: 45,
    },
  ] : [];

  // Mock: Dados do Orçamento (em produção viria dos módulos de orçamento)
  const dadosOrcamento = obraSelecionadaId ? {
    valorTotalPlanilhaContratual: contratoInfo?.valorAtualizado || 0,
    valorAditivos: contratoInfo?.valorAditivos || 0,
    valorSupressoes: contratoInfo?.valorSupressoes || 0,
    valorReajustes: contratoInfo?.valorReajustes || 0,
    custoTotalOrcado: 10587500.00,
    margemLucroProjetada: 15.3,
    lucroProjetado: 1912500.00,
    temAditivo: (contratoInfo?.valorAditivos || 0) > 0,
    necessitaNovaVersaoOrcamento: false,
    necessitaNovaVersaoCustoOrcado: false,
    necessitaNovaVersaoCategorizacao: false,
    saldoEmpenho: contratoInfo?.saldoEmpenhos || 0,
    necessitaNovoEmpenho: (contratoInfo?.saldoEmpenhos || 0) < 1000000,
  } : null;

  // Mock: Dados do Planejamento (em produção viria dos módulos de planejamento)
  const dadosPlanejamento = obraSelecionadaId ? {
    previstoFisico: 52.3,
    realizadoFisico: 45.8,
    desvioFisico: 45.8 - 52.3,
    previstoFinanceiro: 5500000.00,
    realizadoFinanceiro: 4750000.00,
    desvioFinanceiro: 4750000.00 - 5500000.00,
    custoOrcado: 3500000.00,
    custoRealizado: 3850000.00,
    desvioCusto: 3850000.00 - 3500000.00,
    margemOrcada: 20.5,
    margemRealizada: 16.8,
    desvioMargem: 16.8 - 20.5,
  } : null;

  const totalValorGlobal = filteredObras.reduce((sum, obra) => sum + obra.valorGlobal, 0);
  const obrasAtivas = filteredObras.filter((o) => o.status === 'Ativa').length;
  const obrasAtrasadas = filteredObras.filter((o) => o.status === 'Atrasada').length;

  const getDocumentoStatus = (dataValidade: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataValidade);
    const diasDiff = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasDiff < 0) return { status: 'Vencido', cor: 'bg-red-900 text-red-400', icone: <AlertTriangle className="w-4 h-4" /> };
    if (diasDiff <= 30) return { status: 'Vencendo', cor: 'bg-amber-900 text-amber-400', icone: <AlertTriangle className="w-4 h-4" /> };
    return { status: 'Válido', cor: 'bg-green-900 text-green-400', icone: <CheckCircle2 className="w-4 h-4" /> };
  };

  // Mock: Status de Aprovação das Planilhas (em produção viria do sistema de aprovações)
  const statusAprovacoes = obraSelecionadaId ? {
    orcamento: {
      planilhaContratual: { status: 'aprovado', ultimaAtualizacao: '2024-01-15', aprovadoPor: 'João Silva' },
      custosOrcados: { status: 'aguardando-aprovacao', ultimaAtualizacao: '2024-02-10', solicitadoPor: 'Maria Santos' },
      categorizacao: { status: 'aprovado', ultimaAtualizacao: '2024-01-20', aprovadoPor: 'João Silva' },
      visaoGerencial: { status: 'em-edicao', ultimaAtualizacao: '2024-02-12', editandoPor: 'Carlos Oliveira' },
    },
    planejamento: {
      cronogramaExecutivo: { status: 'aprovado', ultimaAtualizacao: '2024-01-25', aprovadoPor: 'João Silva' },
    },
    medicoes: {
      boletimMedicao: { status: 'aguardando-aprovacao', ultimaAtualizacao: '2024-02-14', solicitadoPor: 'Ana Costa' },
    },
  } : null;

  const getStatusAprovacaoInfo = (status: string) => {
    switch (status) {
      case 'aprovado':
        return { 
          label: 'Aprovado', 
          cor: 'bg-green-900 text-green-400 border-green-800', 
          icone: <CheckCircle2 className="w-4 h-4" />,
          bgCard: 'border-green-500/20 bg-green-950/10'
        };
      case 'aguardando-aprovacao':
        return { 
          label: 'Aguardando Aprovação', 
          cor: 'bg-amber-900 text-amber-400 border-amber-800', 
          icone: <Clock className="w-4 h-4" />,
          bgCard: 'border-amber-500/20 bg-amber-950/10'
        };
      case 'em-edicao':
        return { 
          label: 'Em Edição', 
          cor: 'bg-blue-900 text-blue-400 border-blue-800', 
          icone: <Edit2 className="w-4 h-4" />,
          bgCard: 'border-blue-500/20 bg-blue-950/10'
        };
      case 'rejeitado':
        return { 
          label: 'Rejeitado', 
          cor: 'bg-red-900 text-red-400 border-red-800', 
          icone: <XCircle className="w-4 h-4" />,
          bgCard: 'border-red-500/20 bg-red-950/10'
        };
      case 'pendente':
        return { 
          label: 'Pendente', 
          cor: 'bg-slate-700 text-slate-400 border-slate-600', 
          icone: <AlertTriangle className="w-4 h-4" />,
          bgCard: 'border-slate-500/20 bg-slate-900/50'
        };
      default:
        return { 
          label: 'Desconhecido', 
          cor: 'bg-slate-700 text-slate-400 border-slate-600', 
          icone: <AlertTriangle className="w-4 h-4" />,
          bgCard: 'border-slate-500/20 bg-slate-900/50'
        };
    }
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
            href="/eng/acompanhamento"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Acompanhamento - {construtora.razaoSocial}</h1>
              <p className="text-slate-400">Acompanhamento de obras da construtora</p>
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
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />
                  )}
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

      {/* Mostrar detalhes apenas se uma obra estiver selecionada */}
      {obraSelecionadaId && obraSelecionada && (
        <>
          {/* Informações da Obra Selecionada */}
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
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Obra</h3>
              <p className="text-lg font-bold text-white">
                {obraSelecionada.numeroContrato} - {obraSelecionada.objeto}
              </p>
            </div>

            {/* Informações do Contrato */}
            {contratoInfo && (
              <>
                {/* Valores do Contrato */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor Global Inicial</p>
                    <p className="text-sm font-semibold text-white font-mono">{formatCurrency(contratoInfo.valorGlobalInicial)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor Aditivos</p>
                    <p className="text-sm font-semibold text-green-400 font-mono">+{formatCurrency(contratoInfo.valorAditivos)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor Supressões</p>
                    <p className="text-sm font-semibold text-red-400 font-mono">-{formatCurrency(contratoInfo.valorSupressoes)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor Reajustes</p>
                    <p className="text-sm font-semibold text-yellow-400 font-mono">+{formatCurrency(contratoInfo.valorReajustes)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 border border-green-500/50">
                    <p className="text-xs text-slate-400 mb-1">Valor Atualizado</p>
                    <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(contratoInfo.valorAtualizado)}</p>
                  </div>
                </div>

                {/* Empenhos e Saldo Contratual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Saldo Empenhos</p>
                    <p className="text-sm font-semibold text-purple-400 font-mono">{formatCurrency(contratoInfo.saldoEmpenhos)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 border border-blue-500/50">
                    <p className="text-xs text-slate-400 mb-1">Saldo Contratual</p>
                    <p className="text-sm font-semibold text-blue-400 font-mono">{formatCurrency(contratoInfo.saldoContratual)}</p>
                  </div>
                </div>
              </>
            )}

            {/* Informações de Medições */}
            {medicoesInfo && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Medições Realizadas</p>
                  <p className="text-sm font-semibold text-white font-mono">{medicoesInfo.quantidadeMedicoes}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Avanço Físico</p>
                  <p className="text-sm font-semibold text-blue-400 font-mono">{formatPercent(medicoesInfo.avancoFisico)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Financeiro Medido</p>
                  <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(medicoesInfo.valorFinanceiroMedido)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Última Medição</p>
                  <p className="text-sm font-semibold text-yellow-400 font-mono">{formatCurrency(medicoesInfo.valorUltimaMedicao)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bloco 1: CND's e Documentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">CND's e Documentos</h2>
            </div>
            {documentosConstrutora.filter((d) => d.status === 'Vencido' || d.status === 'Vencendo').length > 0 && (
              <div className="mb-4 bg-amber-950 border border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-white font-semibold">Atenção: Documentos precisam de atualização</span>
                </div>
                <p className="text-sm text-slate-300">
                  Documentos vencidos ou próximos do vencimento bloqueiam novos desembolsos
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documentosConstrutora.map((doc, idx) => {
                const statusInfo = getDocumentoStatus(doc.dataValidade);
                return (
                  <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusInfo.cor}`}>
                        {statusInfo.status}
                      </span>
                      {statusInfo.icone}
                    </div>
                    <p className="text-sm text-slate-400 mb-1">Categoria: {doc.categoria}</p>
                    <p className="text-white font-medium mb-2">{doc.tipo}</p>
                    <p className="text-xs text-slate-500">Validade: {formatDate(doc.dataValidade)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {doc.diasVencimento > 0 ? `${doc.diasVencimento} dias restantes` : `Vencido há ${Math.abs(doc.diasVencimento)} dias`}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Link
                href={`/cadastros/construtoras/${params.construtoraId}/documentos`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                <FileText className="w-4 h-4" />
                Gerenciar todos os documentos
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Bloco 2: Dados do Orçamento */}
          {dadosOrcamento && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Dados do Orçamento</h2>
                </div>
                <Link
                  href={`/eng/orcamento/${params.construtoraId}/${obraSelecionadaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Ver detalhes do orçamento <ExternalLink className="w-3 h-3 inline ml-1" />
                </Link>
              </div>

              {/* Alertas de Necessidades */}
              {(dadosOrcamento.necessitaNovaVersaoOrcamento || dadosOrcamento.necessitaNovaVersaoCustoOrcado || dadosOrcamento.necessitaNovaVersaoCategorizacao || dadosOrcamento.necessitaNovoEmpenho) && (
                <div className="mb-4 bg-amber-950 border border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-semibold">Ações Necessárias</span>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {dadosOrcamento.necessitaNovaVersaoOrcamento && <li>• Nova versão de orçamento necessária</li>}
                    {dadosOrcamento.necessitaNovaVersaoCustoOrcado && <li>• Atualização de custos orçados necessária</li>}
                    {dadosOrcamento.necessitaNovaVersaoCategorizacao && <li>• Revisão de categorização necessária</li>}
                    {dadosOrcamento.necessitaNovoEmpenho && <li>• Solicitação de novo empenho recomendada</li>}
                  </ul>
                </div>
              )}

              {/* Custos e Margem */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Custo Total Orçado</p>
                  <p className="text-sm font-semibold text-white font-mono">{formatCurrency(dadosOrcamento.custoTotalOrcado)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Lucro Projetado</p>
                  <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(dadosOrcamento.lucroProjetado)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Margem Projetada</p>
                  <p className="text-sm font-semibold text-blue-400 font-mono">{formatPercent(dadosOrcamento.margemLucroProjetada)}</p>
                </div>
                <div className="bg-slate-800 border border-purple-500/50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Saldo de Empenho</p>
                  <p className={`text-sm font-semibold font-mono ${dadosOrcamento.saldoEmpenho > 0 ? 'text-purple-400' : 'text-red-400'}`}>
                    {formatCurrency(dadosOrcamento.saldoEmpenho)}
                  </p>
                  {dadosOrcamento.necessitaNovoEmpenho && (
                    <p className="text-xs text-amber-400 mt-1">⚠ Baixo saldo</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bloco 3: Dados do Planejamento */}
          {dadosPlanejamento && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Dados do Planejamento</h2>
                </div>
              </div>

              {/* Previsto vs Realizado - Físico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Avanço Físico - Previsto</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">{formatPercent(dadosPlanejamento.previstoFisico)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Avanço Físico - Realizado</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">{formatPercent(dadosPlanejamento.realizadoFisico)}</p>
                </div>
                <div className={`bg-slate-800 rounded-lg p-4 border ${dadosPlanejamento.desvioFisico < 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                  <p className="text-xs text-slate-400 mb-2">Desvio Físico</p>
                  <p className={`text-2xl font-bold font-mono ${dadosPlanejamento.desvioFisico < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {dadosPlanejamento.desvioFisico >= 0 ? '+' : ''}{formatPercent(dadosPlanejamento.desvioFisico)}
                  </p>
                </div>
              </div>

              {/* Previsto vs Realizado - Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Financeiro - Previsto</p>
                  <p className="text-lg font-bold text-blue-400 font-mono">{formatCurrency(dadosPlanejamento.previstoFinanceiro)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Financeiro - Realizado</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(dadosPlanejamento.realizadoFinanceiro)}</p>
                </div>
                <div className={`bg-slate-800 rounded-lg p-4 border ${dadosPlanejamento.desvioFinanceiro < 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                  <p className="text-xs text-slate-400 mb-2">Desvio Financeiro</p>
                  <p className={`text-lg font-bold font-mono ${dadosPlanejamento.desvioFinanceiro < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {dadosPlanejamento.desvioFinanceiro >= 0 ? '+' : ''}{formatCurrency(dadosPlanejamento.desvioFinanceiro)}
                  </p>
                </div>
              </div>

              {/* Custos e Margens */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Custo Orçado</p>
                  <p className="text-lg font-bold text-white font-mono">{formatCurrency(dadosPlanejamento.custoOrcado)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Custo Realizado</p>
                  <p className="text-lg font-bold text-white font-mono">{formatCurrency(dadosPlanejamento.custoRealizado)}</p>
                </div>
                <div className={`bg-slate-800 rounded-lg p-4 border ${dadosPlanejamento.desvioCusto > 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                  <p className="text-xs text-slate-400 mb-2">Desvio de Custo</p>
                  <p className={`text-lg font-bold font-mono ${dadosPlanejamento.desvioCusto > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {dadosPlanejamento.desvioCusto >= 0 ? '+' : ''}{formatCurrency(dadosPlanejamento.desvioCusto)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Margem Orçada</p>
                  <p className="text-lg font-bold text-blue-400 font-mono">{formatPercent(dadosPlanejamento.margemOrcada)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Margem Realizada</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{formatPercent(dadosPlanejamento.margemRealizada)}</p>
                </div>
                <div className={`bg-slate-800 rounded-lg p-4 border ${dadosPlanejamento.desvioMargem < 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                  <p className="text-xs text-slate-400 mb-2">Desvio de Margem</p>
                  <p className={`text-lg font-bold font-mono ${dadosPlanejamento.desvioMargem < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {dadosPlanejamento.desvioMargem >= 0 ? '+' : ''}{formatPercent(dadosPlanejamento.desvioMargem)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bloco 4: Dados de Medições */}
          {medicoesInfo && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Dados de Medições</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Medições Realizadas</p>
                  <p className="text-2xl font-bold text-white font-mono">{medicoesInfo.quantidadeMedicoes}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Valor Acumulado</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(medicoesInfo.valorFinanceiroMedido)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Valor Última Medição</p>
                  <p className="text-lg font-bold text-yellow-400 font-mono">{formatCurrency(medicoesInfo.valorUltimaMedicao)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Avanço Físico</p>
                  <p className="text-2xl font-bold text-blue-400 font-mono">{formatPercent(medicoesInfo.avancoFisico)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status de Aprovações */}
          {statusAprovacoes && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Status de Aprovações</h2>
              </div>

              {/* Módulo: Orçamento */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Orçamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(statusAprovacoes.orcamento).map(([key, value]) => {
                    const statusInfo = getStatusAprovacaoInfo(value.status);
                    const nomePlanilha = key === 'planilhaContratual' ? 'Planilha Contratual' :
                                       key === 'custosOrcados' ? 'Custos Orçados' :
                                       key === 'categorizacao' ? 'Categorização' :
                                       'EAP Gerencial';
                    return (
                      <div key={key} className={`bg-slate-800 border rounded-lg p-3 ${statusInfo.bgCard}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusInfo.cor}`}>
                            {statusInfo.label}
                          </span>
                          {statusInfo.icone}
                        </div>
                        <p className="text-white font-medium text-sm mb-1">{nomePlanilha}</p>
                        <p className="text-xs text-slate-400 mb-1">
                          Última atualização: {formatDate(value.ultimaAtualizacao)}
                        </p>
                        {value.status === 'aprovado' && 'aprovadoPor' in value && (
                          <p className="text-xs text-slate-500">Aprovado por: {String(value.aprovadoPor)}</p>
                        )}
                        {value.status === 'aguardando-aprovacao' && 'solicitadoPor' in value && (
                          <p className="text-xs text-slate-500">Solicitado por: {String(value.solicitadoPor)}</p>
                        )}
                        {value.status === 'em-edicao' && 'editandoPor' in value && (
                          <p className="text-xs text-slate-500">Editando: {String(value.editandoPor)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Módulo: Planejamento */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Planejamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(statusAprovacoes.planejamento).map(([key, value]) => {
                    const statusInfo = getStatusAprovacaoInfo(value.status);
                    const nomePlanilha = key === 'cronogramaExecutivo' ? 'Cronograma Executivo' : key;
                    return (
                      <div key={key} className={`bg-slate-800 border rounded-lg p-3 ${statusInfo.bgCard}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusInfo.cor}`}>
                            {statusInfo.label}
                          </span>
                          {statusInfo.icone}
                        </div>
                        <p className="text-white font-medium text-sm mb-1">{nomePlanilha}</p>
                        <p className="text-xs text-slate-400 mb-1">
                          Última atualização: {formatDate(value.ultimaAtualizacao)}
                        </p>
                        {value.status === 'aprovado' && 'aprovadoPor' in value && (
                          <p className="text-xs text-slate-500">Aprovado por: {String(value.aprovadoPor)}</p>
                        )}
                        {value.status === 'aguardando-aprovacao' && 'solicitadoPor' in value && (
                          <p className="text-xs text-slate-500">Solicitado por: {String(value.solicitadoPor)}</p>
                        )}
                        {value.status === 'em-edicao' && 'editandoPor' in value && (
                          <p className="text-xs text-slate-500">Editando: {String(value.editandoPor)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Módulo: Medições */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Hammer className="w-4 h-4" />
                  Medições
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(statusAprovacoes.medicoes).map(([key, value]) => {
                    const statusInfo = getStatusAprovacaoInfo(value.status);
                    const nomePlanilha = key === 'boletimMedicao' ? 'Boletim de Medição' : key;
                    return (
                      <div key={key} className={`bg-slate-800 border rounded-lg p-3 ${statusInfo.bgCard}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusInfo.cor}`}>
                            {statusInfo.label}
                          </span>
                          {statusInfo.icone}
                        </div>
                        <p className="text-white font-medium text-sm mb-1">{nomePlanilha}</p>
                        <p className="text-xs text-slate-400 mb-1">
                          Última atualização: {formatDate(value.ultimaAtualizacao)}
                        </p>
                        {value.status === 'aprovado' && 'aprovadoPor' in value && (
                          <p className="text-xs text-slate-500">Aprovado por: {String(value.aprovadoPor)}</p>
                        )}
                        {value.status === 'aguardando-aprovacao' && 'solicitadoPor' in value && (
                          <p className="text-xs text-slate-500">Solicitado por: {String(value.solicitadoPor)}</p>
                        )}
                        {value.status === 'em-edicao' && 'editandoPor' in value && (
                          <p className="text-xs text-slate-500">Editando: {String(value.editandoPor)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!obraSelecionadaId && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">Selecione uma obra acima para visualizar seus detalhes</p>
          <p className="text-sm text-slate-500">Clique em uma obra para ver as informações de acompanhamento relacionadas</p>
        </div>
      )}
    </div>
  );
}