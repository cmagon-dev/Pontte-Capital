'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, Filter, FolderKanban, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { getAllObras, getAllConstrutoras, getAllFundos } from '@/lib/mock-data';

export default function AcompanhamentoFinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados das obras, construtoras e fundos
  const obras = getAllObras();
  const construtoras = getAllConstrutoras();
  const fundos = getAllFundos();

  // Agrupar obras por construtora para exibição
  const obrasPorConstrutora = useMemo(() => {
    const agrupamento: Record<string, {
      construtoraId: string;
      construtoraNome: string;
      construtoraCnpj: string;
      obras: Array<{
        obraId: string;
        obraNumeroContrato: string;
        obraObjeto: string;
        obraStatus: string;
        obraValorGlobal: number;
        fundoId: string;
        fundoNome: string;
        percentualExecucao: number;
      }>;
    }> = {};

    obras.forEach((obra) => {
      const construtora = construtoras.find((c) => c.id === obra.construtoraId);
      const fundo = fundos.find((f) => f.id === obra.fundoId);
      
      if (!agrupamento[obra.construtoraId]) {
        agrupamento[obra.construtoraId] = {
          construtoraId: obra.construtoraId,
          construtoraNome: construtora?.razaoSocial || obra.construtoraNome,
          construtoraCnpj: construtora?.cnpj || '',
          obras: [],
        };
      }

      agrupamento[obra.construtoraId].obras.push({
        obraId: obra.id,
        obraNumeroContrato: obra.numeroContrato,
        obraObjeto: obra.objeto,
        obraStatus: obra.status,
        obraValorGlobal: obra.valorGlobal,
        fundoId: obra.fundoId,
        fundoNome: fundo?.nome || obra.fundoNome,
        percentualExecucao: 45.8, // Mock - em produção viria do banco
      });
    });

    return Object.values(agrupamento);
  }, [obras, construtoras, fundos]);

  // Adicionar estatísticas financeiras por construtora (mock)
  const construtorasComStats = obrasPorConstrutora.map((grupo) => {
    const totalObras = grupo.obras.length;
    const obrasAtivas = grupo.obras.filter((o) => o.obraStatus === 'Ativa').length;
    const obrasAtrasadas = grupo.obras.filter((o) => o.obraStatus === 'Atrasada').length;
    const valorTotal = grupo.obras.reduce((sum, o) => sum + o.obraValorGlobal, 0);
    const percentualExecucaoMedio = grupo.obras.reduce((sum, o) => sum + o.percentualExecucao, 0) / totalObras;

    // Mock de dados financeiros - em produção viria de API
    const totalOperacoes = 15;
    const operacoesAbertas = 5;
    const operacoesLiquidadas = 10;
    const valorTotalOperacoes = 850000.00;
    const totalBancos = 3;
    const totalCredores = 15;
    const saldoTotal = 1500000.00;

    return {
      ...grupo,
      totalObras,
      obrasAtivas,
      obrasAtrasadas,
      valorTotal,
      percentualExecucaoMedio,
      totalOperacoes,
      operacoesAbertas,
      operacoesLiquidadas,
      valorTotalOperacoes,
      totalBancos,
      totalCredores,
      saldoTotal,
    };
  });

  // Filtrar construtoras
  const filteredConstrutoras = useMemo(() => {
    return construtorasComStats.filter((grupo) => {
      const matchSearch = 
        grupo.construtoraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.construtoraCnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.obras.some((obra) =>
          obra.obraNumeroContrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obra.obraObjeto.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return matchSearch;
    });
  }, [construtorasComStats, searchTerm]);

  // Totais
  const totalConstrutoras = filteredConstrutoras.length;
  const totalObras = filteredConstrutoras.reduce((sum, c) => sum + c.totalObras, 0);
  const valorTotal = filteredConstrutoras.reduce((sum, c) => sum + c.valorTotal, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Acompanhamento Financeiro</h1>
        <p className="text-slate-400">Acompanhamento de operações financeiras, cadastros e apropriações orçamentárias</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Construtoras</p>
          <p className="text-2xl font-bold text-white">{totalConstrutoras}</p>
        </div>
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-blue-400">{totalObras}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(valorTotal)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Construtora, CNPJ, Obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Construtoras */}
      <div className="space-y-4">
        {filteredConstrutoras.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">Nenhuma construtora encontrada com os filtros aplicados</p>
          </div>
        ) : (
          filteredConstrutoras.map((grupo) => (
            <div key={grupo.construtoraId} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{grupo.construtoraNome}</h3>
                      {grupo.construtoraCnpj && (
                        <p className="text-sm text-slate-400 font-mono mt-1">CNPJ: {grupo.construtoraCnpj}</p>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/fin/acompanhamento/${grupo.construtoraId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Ver Acompanhamento
                </Link>
              </div>

              {/* KPIs da Construtora */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Obras Ativas</p>
                  <p className="text-lg font-bold text-white">{grupo.obrasAtivas}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Obras Atrasadas</p>
                  <p className="text-lg font-bold text-red-400">{grupo.obrasAtrasadas}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Valor Total</p>
                  <p className="text-sm font-bold text-green-400 font-mono">{formatCurrency(grupo.valorTotal)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">% Execução Médio</p>
                  <p className="text-lg font-bold text-blue-400 font-mono">{formatPercent(grupo.percentualExecucaoMedio)}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Operações</p>
                  <p className="text-lg font-bold text-purple-400">{grupo.totalOperacoes}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Bancos</p>
                  <p className="text-lg font-bold text-blue-400">{grupo.totalBancos}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Credores</p>
                  <p className="text-lg font-bold text-purple-400">{grupo.totalCredores}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nota sobre Fonte de Dados */}
      <div className="mt-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Nota:</strong> Os dados de operações financeiras, cadastros e apropriações são consolidados por construtora. 
          O acompanhamento utiliza como fonte única de verdade os módulos de Operações Financeiras e Cadastros do sistema.
        </p>
      </div>
    </div>
  );
}
