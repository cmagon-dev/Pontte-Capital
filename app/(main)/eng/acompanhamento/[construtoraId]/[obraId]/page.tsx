'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Building2, AlertTriangle, CheckCircle2, Calendar, DollarSign, TrendingUp, BarChart3, Percent, Hammer, Eye, ExternalLink, FolderKanban } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';
import { getConstrutoraById, getAllObras, getContratoInfoByObraId, getMedicoesInfoByObraId } from '@/lib/mock-data';

export default function AcompanhamentoObraPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  const construtora = getConstrutoraById(params.construtoraId);
  const obras = getAllObras().filter((obra) => obra.construtoraId === params.construtoraId);
  const obraSelecionada = obras.find((obra) => obra.id === params.obraId);
  
  // Buscar informações adicionais da obra
  const medicoesInfo = obraSelecionada ? getMedicoesInfoByObraId(params.obraId) : null;
  const contratoInfo = obraSelecionada && medicoesInfo
    ? getContratoInfoByObraId(params.obraId, medicoesInfo.valorFinanceiroMedido || 0)
    : null;

  // Mock: Documentos/CNDs da construtora (em produção viria do cadastro de construtoras)
  const documentosConstrutora = [
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
  ];

  // Mock: Dados do Orçamento (em produção viria dos módulos de orçamento)
  const dadosOrcamento = {
    valorTotalPlanilhaContratual: contratoInfo?.valorAtualizado || 0,
    valorAditivos: contratoInfo?.valorAditivos || 0,
    valorSupressoes: contratoInfo?.valorSupressoes || 0,
    valorReajustes: contratoInfo?.valorReajustes || 0,
    custoTotalOrcado: 10587500.00, // Mock
    margemLucroProjetada: 15.3, // Mock
    lucroProjetado: 1912500.00, // Mock
    temAditivo: (contratoInfo?.valorAditivos || 0) > 0,
    necessitaNovaVersaoOrcamento: false, // Mock - lógica de negócio
    necessitaNovaVersaoCustoOrcado: false, // Mock
    necessitaNovaVersaoCategorizacao: false, // Mock
    saldoEmpenho: contratoInfo?.saldoEmpenhos || 0,
    necessitaNovoEmpenho: (contratoInfo?.saldoEmpenhos || 0) < 1000000, // Mock - se saldo < 1M
  };

  // Mock: Dados do Planejamento (em produção viria dos módulos de planejamento)
  const dadosPlanejamento = {
    previstoFisico: 52.3, // %
    realizadoFisico: 45.8, // %
    desvioFisico: 45.8 - 52.3, // %
    previstoFinanceiro: 5500000.00, // R$
    realizadoFinanceiro: 4750000.00, // R$
    desvioFinanceiro: 4750000.00 - 5500000.00, // R$
    custoOrcado: 3500000.00, // R$
    custoRealizado: 3850000.00, // R$
    desvioCusto: 3850000.00 - 3500000.00, // R$
    margemOrcada: 20.5, // %
    margemRealizada: 16.8, // %
    desvioMargem: 16.8 - 20.5, // %
  };

  // Mock: Dados de Medições
  const dadosMedicoes = {
    quantidadeMedicoes: medicoesInfo?.quantidadeMedicoes || 0,
    valorAcumulado: medicoesInfo?.valorFinanceiroMedido || 0,
    valorUltimaMedicao: medicoesInfo?.valorUltimaMedicao || 0,
    avancoFisico: medicoesInfo?.avancoFisico || 0,
  };

  if (!construtora || !obraSelecionada) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">Construtora ou Obra não encontrada</p>
        </div>
      </div>
    );
  }

  const getDocumentoStatus = (dataValidade: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataValidade);
    const diasDiff = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasDiff < 0) return { status: 'Vencido', cor: 'bg-red-900 text-red-400', icone: <AlertTriangle className="w-4 h-4" /> };
    if (diasDiff <= 30) return { status: 'Vencendo', cor: 'bg-amber-900 text-amber-400', icone: <AlertTriangle className="w-4 h-4" /> };
    return { status: 'Válido', cor: 'bg-green-900 text-green-400', icone: <CheckCircle2 className="w-4 h-4" /> };
  };

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/acompanhamento/${params.construtoraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Acompanhamento - {obraSelecionada.numeroContrato}</h1>
              <p className="text-slate-400">{obraSelecionada.objeto}</p>
              <p className="text-slate-500 text-sm mt-1">{construtora.razaoSocial}</p>
            </div>
          </div>
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
        </div>
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
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Dados do Orçamento</h2>
          </div>
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}`}
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

        {/* Valores Contratuais */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Valor Global Inicial</p>
            <p className="text-sm font-semibold text-white font-mono">{formatCurrency(contratoInfo?.valorGlobalInicial || 0)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Aditivos</p>
            <p className="text-sm font-semibold text-green-400 font-mono">+{formatCurrency(dadosOrcamento.valorAditivos)}</p>
            {dadosOrcamento.temAditivo && <p className="text-xs text-amber-400 mt-1">✓ Tem aditivo</p>}
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Supressões</p>
            <p className="text-sm font-semibold text-red-400 font-mono">-{formatCurrency(dadosOrcamento.valorSupressoes)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Reajustes</p>
            <p className="text-sm font-semibold text-yellow-400 font-mono">+{formatCurrency(dadosOrcamento.valorReajustes)}</p>
          </div>
          <div className="bg-slate-800 border border-green-500/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Valor Atualizado</p>
            <p className="text-sm font-semibold text-green-400 font-mono">{formatCurrency(dadosOrcamento.valorTotalPlanilhaContratual)}</p>
          </div>
        </div>

        {/* Custos e Margem */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

      {/* Bloco 3: Dados do Planejamento */}
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

      {/* Bloco 4: Dados de Medições */}
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
            <p className="text-2xl font-bold text-white font-mono">{dadosMedicoes.quantidadeMedicoes}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Valor Acumulado</p>
            <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(dadosMedicoes.valorAcumulado)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Valor Última Medição</p>
            <p className="text-lg font-bold text-yellow-400 font-mono">{formatCurrency(dadosMedicoes.valorUltimaMedicao)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Avanço Físico</p>
            <p className="text-2xl font-bold text-blue-400 font-mono">{formatPercent(dadosMedicoes.avancoFisico)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}