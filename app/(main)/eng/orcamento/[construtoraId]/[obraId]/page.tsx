'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ClipboardList, DollarSign, FolderKanban, BarChart3, FileText, TrendingUp, Percent, AlertCircle, Clock, Package, Wrench, Users, Building } from 'lucide-react';
import { formatCurrency, formatPercent, formatQuantity } from '@/lib/utils/format';

interface ResumoOrcamento {
  valorTotalPlanilhaContratual: number;
  percentualOrcado: number;
  custoTotalOrcado: number;
  lucroProjetado: number;
  margemLucroProjetada: number;
  totalItensPlanilha: number;
  itensOrcados: number;
  statusOrcamento: string;
}

interface CustosDetalhados {
  material: number;
  maoDeObra: number;
  equipamento: number;
  verba: number;
}

interface Versao {
  id: string;
  numero: number;
  status: string;
  createdAt: string;
  observacoes: string | null;
}

interface VersoesInfo {
  ativa: Versao | null;
  todas: Versao[];
  totalVersoes: number;
}

interface ResumoData {
  resumo: ResumoOrcamento;
  custosDetalhados: CustosDetalhados;
  versoes: {
    contratual: VersoesInfo;
    custos: VersoesInfo;
    categorizacao: VersoesInfo;
    gerencial: VersoesInfo;
  };
}

export default function OrcamentoObraPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  const pathname = usePathname();
  const [resumoData, setResumoData] = useState<ResumoData | null>(null);
  const [obraData, setObraData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados da obra e resumo do orçamento
  useEffect(() => {
    async function fetchDados() {
      try {
        setIsLoading(true);
        
        // Buscar dados da obra
        const obraResponse = await fetch(`/api/obras/${params.obraId}`);
        if (obraResponse.ok) {
          const obra = await obraResponse.json();
          
          // Calcular valor atualizado com aditivos e reajustes
          const valorBase = Number(obra.valorContrato) || 0;
          
          const valorAditivos = obra.aditivos?.reduce((acc: number, aditivo: any) => {
            const valor = Number(aditivo.valorAditivo) || 0;
            const glosa = Number(aditivo.valorGlosa) || 0;
            return acc + (valor - glosa);
          }, 0) || 0;
          
          const valorReajustes = obra.reajustes?.reduce((acc: number, reajuste: any) => {
            return acc + (Number(reajuste.valorReajuste) || 0);
          }, 0) || 0;
          
          const valorAtualizado = valorBase + valorAditivos + valorReajustes;
          
          setObraData({
            id: obra.id,
            numeroContrato: obra.codigo || 'N/A',
            objeto: obra.nome || 'Obra não encontrada',
            construtora: obra.construtora?.razaoSocial || obra.construtora?.nomeFantasia || 'Construtora não encontrada',
            valorGlobalContrato: valorAtualizado,
          });
        }
        
        // Buscar resumo do orçamento
        const resumoResponse = await fetch(`/api/orcamento/resumo/${params.obraId}`);
        if (resumoResponse.ok) {
          const data = await resumoResponse.json();
          setResumoData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDados();
  }, [params.obraId]);

  const resumoOrcamento = resumoData?.resumo || {
    valorTotalPlanilhaContratual: 0,
    percentualOrcado: 0,
    custoTotalOrcado: 0,
    lucroProjetado: 0,
    margemLucroProjetada: 0,
    totalItensPlanilha: 0,
    itensOrcados: 0,
    statusOrcamento: 'Pendente',
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completo':
        return 'bg-green-900 text-green-400';
      case 'Em Andamento':
        return 'bg-blue-900 text-blue-400';
      case 'Pendente':
        return 'bg-amber-900 text-amber-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getMargemColor = (margem: number) => {
    if (margem >= 15) return 'text-green-400';
    if (margem >= 8) return 'text-amber-400';
    return 'text-red-400';
  };

  const menuItems = [
    {
      title: 'Planilha Contratual',
      description: 'Espelho fiel da Planilha Orçamentária Vencedora da Licitação',
      href: `/eng/orcamento/${params.construtoraId}/${params.obraId}/planilha-contratual`,
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-900 border-blue-800 text-blue-400',
    },
    {
      title: 'Custos Orçados',
      description: 'Definição da Meta de Custo e Margem de Lucro da obra',
      href: `/eng/orcamento/${params.construtoraId}/${params.obraId}/custos-orcados`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-900 border-green-800 text-green-400',
    },
    {
      title: 'Categorização',
      description: 'Mapeamento da EAP Gerencial - Transformação da EAP Analítica em EAP Gerencial',
      href: `/eng/orcamento/${params.construtoraId}/${params.obraId}/categorizacao`,
      icon: <FolderKanban className="w-6 h-6" />,
      color: 'bg-purple-900 border-purple-800 text-purple-400',
    },
    {
      title: 'EAP Gerencial',
      description: 'Painel de Controle Financeiro da Engenharia (EAP Gerencial)',
      href: `/eng/orcamento/${params.construtoraId}/${params.obraId}/visao-gerencial`,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-amber-900 border-amber-800 text-amber-400',
    },
  ];

  // Dados padrão enquanto carrega
  const dadosExibicao = obraData || {
    numeroContrato: 'Carregando...',
    objeto: 'Carregando...',
    construtora: 'Carregando...',
    valorGlobalContrato: 0,
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Orçamento - {dadosExibicao.numeroContrato}</h1>
            <p className="text-slate-400">{dadosExibicao.objeto}</p>
            <p className="text-slate-500 text-sm mt-1">Construtora: {dadosExibicao.construtora}</p>
          </div>
        </div>
      </div>

      {/* Resumo do Orçamento - KPIs */}
      {isLoading ? (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4 animate-pulse">
              <div className="h-16 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-blue-900/50 rounded">
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(resumoOrcamento.statusOrcamento)}`}>
                {resumoOrcamento.statusOrcamento}
              </span>
            </div>
            <h3 className="text-xs text-slate-400 mb-1">Valor Total Planilha Contratual</h3>
            <p className="text-lg font-bold text-white font-mono">{formatCurrency(resumoOrcamento.valorTotalPlanilhaContratual)}</p>
            <p className="text-xs text-slate-500 mt-1">
              {resumoOrcamento.totalItensPlanilha} itens
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-green-900/50 rounded">
                <Percent className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <h3 className="text-xs text-slate-400 mb-1">% Orçado</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-white">{formatPercent(resumoOrcamento.percentualOrcado)}</p>
              <p className="text-xs text-slate-500">
                ({resumoOrcamento.itensOrcados}/{resumoOrcamento.totalItensPlanilha})
              </p>
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  resumoOrcamento.percentualOrcado >= 80
                    ? 'bg-green-500'
                    : resumoOrcamento.percentualOrcado >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${resumoOrcamento.percentualOrcado}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-purple-900/50 rounded">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xs text-slate-400 mb-1">Custo Total Orçado</h3>
            <p className="text-lg font-bold text-white font-mono">{formatCurrency(resumoOrcamento.custoTotalOrcado)}</p>
            <p className="text-xs text-slate-500 mt-1">
              MAT + MO + Contratos + Eq/Fr
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="p-1.5 bg-amber-900/50 rounded">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <h3 className="text-xs text-slate-400 mb-1">Margem de Lucro Projetada</h3>
            <p className={`text-lg font-bold font-mono ${getMargemColor(resumoOrcamento.margemLucroProjetada)}`}>
              {formatPercent(resumoOrcamento.margemLucroProjetada)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Lucro: {formatCurrency(resumoOrcamento.lucroProjetado)}
            </p>
          </div>
        </div>
      )}

      {/* Cards de Custos Detalhados por Tipo */}
      {!isLoading && resumoData && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 bg-blue-900/50 rounded">
                <Package className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="text-xs text-slate-400">Material (MAT)</h3>
            </div>
            <p className="text-base font-bold text-white font-mono">{formatCurrency(resumoData.custosDetalhados.material)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {resumoOrcamento.custoTotalOrcado > 0 
                ? `${((resumoData.custosDetalhados.material / resumoOrcamento.custoTotalOrcado) * 100).toFixed(1)}% do custo`
                : '0%'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 bg-green-900/50 rounded">
                <Users className="w-3.5 h-3.5 text-green-400" />
              </div>
              <h3 className="text-xs text-slate-400">Mão de Obra (MO)</h3>
            </div>
            <p className="text-base font-bold text-white font-mono">{formatCurrency(resumoData.custosDetalhados.maoDeObra)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {resumoOrcamento.custoTotalOrcado > 0 
                ? `${((resumoData.custosDetalhados.maoDeObra / resumoOrcamento.custoTotalOrcado) * 100).toFixed(1)}% do custo`
                : '0%'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 bg-orange-900/50 rounded">
                <Wrench className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <h3 className="text-xs text-slate-400">Equipamento (Eq/Fr)</h3>
            </div>
            <p className="text-base font-bold text-white font-mono">{formatCurrency(resumoData.custosDetalhados.equipamento)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {resumoOrcamento.custoTotalOrcado > 0 
                ? `${((resumoData.custosDetalhados.equipamento / resumoOrcamento.custoTotalOrcado) * 100).toFixed(1)}% do custo`
                : '0%'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 bg-purple-900/50 rounded">
                <Building className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h3 className="text-xs text-slate-400">Contratos (Verba)</h3>
            </div>
            <p className="text-base font-bold text-white font-mono">{formatCurrency(resumoData.custosDetalhados.verba)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {resumoOrcamento.custoTotalOrcado > 0 
                ? `${((resumoData.custosDetalhados.verba / resumoOrcamento.custoTotalOrcado) * 100).toFixed(1)}% do custo`
                : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Análise Financeira Detalhada */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            Análise Financeira
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Valor de Venda:</span>
              <span className="text-xs font-semibold text-white">{formatCurrency(resumoOrcamento.valorTotalPlanilhaContratual)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Custo Total:</span>
              <span className="text-xs font-semibold text-red-400">{formatCurrency(resumoOrcamento.custoTotalOrcado)}</span>
            </div>
            <div className="border-t border-slate-700 pt-1.5 mt-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">Lucro Projetado:</span>
                <span className={`text-xs font-bold ${resumoOrcamento.lucroProjetado > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(resumoOrcamento.lucroProjetado)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Status do Orçamento
          </h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Progresso</span>
                <span className="text-xs text-slate-400">{formatPercent(resumoOrcamento.percentualOrcado)}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    resumoOrcamento.percentualOrcado >= 80
                      ? 'bg-green-500'
                      : resumoOrcamento.percentualOrcado >= 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${resumoOrcamento.percentualOrcado}%` }}
                />
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-0.5">Itens Orçados:</p>
              <p className="text-base font-bold text-white">
                {resumoOrcamento.itensOrcados} / {resumoOrcamento.totalItensPlanilha}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Rentabilidade
          </h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500">Margem Média</span>
                <span className={`text-sm font-bold ${getMargemColor(resumoOrcamento.margemLucroProjetada)}`}>
                  {formatPercent(resumoOrcamento.margemLucroProjetada)}
                </span>
              </div>
              {resumoOrcamento.margemLucroProjetada < 8 && (
                <div className="mt-1.5 p-2 bg-amber-950 border border-amber-800 rounded text-xs text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Margem abaixo do recomendado (mín. 8%)</span>
                </div>
              )}
              {resumoOrcamento.margemLucroProjetada >= 8 && resumoOrcamento.margemLucroProjetada < 15 && (
                <div className="mt-1.5 p-2 bg-blue-950 border border-blue-800 rounded text-xs text-blue-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Margem dentro do aceitável</span>
                </div>
              )}
              {resumoOrcamento.margemLucroProjetada >= 15 && (
                <div className="mt-1.5 p-2 bg-green-950 border border-green-800 rounded text-xs text-green-300 flex items-start gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Margem excelente</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Módulos */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`${item.color} border rounded-lg p-4 hover:opacity-90 transition-opacity group`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-black/20 rounded-lg group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs opacity-80">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Card de Versões das Planilhas */}
      {!isLoading && resumoData && (
        <div className="mb-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-900/50 rounded">
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Versões das Planilhas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Planilha Contratual */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <h4 className="text-xs font-semibold text-slate-300">Planilha Contratual</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Versão Ativa:</span>
                    <span className="text-xs font-bold text-blue-400">
                      {resumoData.versoes.contratual.ativa 
                        ? `v${resumoData.versoes.contratual.ativa.numero}` 
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total:</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {resumoData.versoes.contratual.totalVersoes}
                    </span>
                  </div>
                  {resumoData.versoes.contratual.ativa && (
                    <div className="pt-1.5 border-t border-slate-700">
                      <p className="text-xs text-slate-500">
                        {new Date(resumoData.versoes.contratual.ativa.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custos Orçados */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <h4 className="text-xs font-semibold text-slate-300">Custos Orçados</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Versão Ativa:</span>
                    <span className="text-xs font-bold text-green-400">
                      {resumoData.versoes.custos.ativa 
                        ? `v${resumoData.versoes.custos.ativa.numero}` 
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total:</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {resumoData.versoes.custos.totalVersoes}
                    </span>
                  </div>
                  {resumoData.versoes.custos.ativa && (
                    <div className="pt-1.5 border-t border-slate-700">
                      <p className="text-xs text-slate-500">
                        {new Date(resumoData.versoes.custos.ativa.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Categorização */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                  <h4 className="text-xs font-semibold text-slate-300">Categorização</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Versão Ativa:</span>
                    <span className="text-xs font-bold text-purple-400">
                      {resumoData.versoes.categorizacao.ativa 
                        ? `v${resumoData.versoes.categorizacao.ativa.numero}` 
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total:</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {resumoData.versoes.categorizacao.totalVersoes}
                    </span>
                  </div>
                  {resumoData.versoes.categorizacao.ativa && (
                    <div className="pt-1.5 border-t border-slate-700">
                      <p className="text-xs text-slate-500">
                        {new Date(resumoData.versoes.categorizacao.ativa.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* EAP Gerencial */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="text-xs font-semibold text-slate-300">EAP Gerencial</h4>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Versão Ativa:</span>
                    <span className="text-xs font-bold text-amber-400">
                      {resumoData.versoes.gerencial.ativa 
                        ? `v${resumoData.versoes.gerencial.ativa.numero}` 
                        : 'Nenhuma'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total:</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {resumoData.versoes.gerencial.totalVersoes}
                    </span>
                  </div>
                  {resumoData.versoes.gerencial.ativa && (
                    <div className="pt-1.5 border-t border-slate-700">
                      <p className="text-xs text-slate-500">
                        {new Date(resumoData.versoes.gerencial.ativa.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
