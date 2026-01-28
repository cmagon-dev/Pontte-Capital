'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, TrendingUp, TrendingDown, ArrowRight, Filter } from 'lucide-react';

interface ItemComparacao {
  codigo: string;
  discriminacao: string;
  unidade: string | null;
  tipoAlteracao: string;
  quantidadeAnterior: number | null;
  quantidadeNova: number | null;
  precoAnterior: number | null;
  precoNovo: number | null;
  totalAnterior: number;
  totalNovo: number;
}

interface VersaoInfo {
  numero: number;
  nome: string;
  dataVersao?: string;
}

interface ModalComparacaoVersoesProps {
  isOpen: boolean;
  onClose: () => void;
  versaoAnterior: VersaoInfo;
  versaoNova: VersaoInfo;
  mapeamento: ItemComparacao[];
}

type FiltroTipo = 'TODOS' | 'ADICIONADO' | 'REMOVIDO' | 'ALTERADO' | 'MANTIDO';

export default function ModalComparacaoVersoes({
  isOpen,
  onClose,
  versaoAnterior,
  versaoNova,
  mapeamento,
}: ModalComparacaoVersoesProps) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');
  const [ordenacao, setOrdenacao] = useState<'codigo' | 'impacto'>('codigo');

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Processar itens com totais calculados
  const itensProcessados = useMemo(() => {
    return mapeamento.map(item => {
      const qtdAnt = Number(item.quantidadeAnterior || 0);
      const qtdNova = Number(item.quantidadeNova || 0);
      const precoAnt = Number(item.precoAnterior || 0);
      const precoNovo = Number(item.precoNovo || 0);
      
      const totalAnterior = qtdAnt * precoAnt;
      const totalNovo = qtdNova * precoNovo;
      
      return {
        ...item,
        totalAnterior,
        totalNovo,
        delta: totalNovo - totalAnterior,
      };
    });
  }, [mapeamento]);

  // Filtrar e ordenar itens
  const itensFiltrados = useMemo(() => {
    let resultado = itensProcessados;

    // Aplicar filtro de tipo
    if (filtroTipo !== 'TODOS') {
      if (filtroTipo === 'ALTERADO') {
        resultado = resultado.filter(item => 
          item.tipoAlteracao === 'QUANTIDADE_ALTERADA' ||
          item.tipoAlteracao === 'PRECO_ALTERADO' ||
          item.tipoAlteracao === 'QUANTIDADE_E_PRECO_ALTERADOS'
        );
      } else {
        resultado = resultado.filter(item => item.tipoAlteracao === filtroTipo);
      }
    }

    // Aplicar busca
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase().trim();
      resultado = resultado.filter(item =>
        item.codigo.toLowerCase().includes(buscaLower) ||
        item.discriminacao.toLowerCase().includes(buscaLower)
      );
    }

    // Aplicar ordenação
    if (ordenacao === 'impacto') {
      resultado = [...resultado].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    } else {
      resultado = [...resultado].sort((a, b) => a.codigo.localeCompare(b.codigo));
    }

    return resultado;
  }, [itensProcessados, filtroTipo, busca, ordenacao]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const totalAnterior = itensProcessados.reduce((sum, item) => sum + item.totalAnterior, 0);
    const totalNovo = itensProcessados.reduce((sum, item) => sum + item.totalNovo, 0);
    const delta = totalNovo - totalAnterior;
    const percentualVariacao = totalAnterior > 0 ? ((totalNovo - totalAnterior) / totalAnterior) * 100 : 0;

    return {
      totalAnterior,
      totalNovo,
      delta,
      percentualVariacao,
      totalItens: itensProcessados.length,
      totalFiltrados: itensFiltrados.length,
    };
  }, [itensProcessados, itensFiltrados]);

  const obterCorTipoAlteracao = (tipo: string) => {
    switch (tipo) {
      case 'ADICIONADO':
        return 'text-blue-400 bg-blue-900/30';
      case 'REMOVIDO':
        return 'text-red-400 bg-red-900/30';
      case 'QUANTIDADE_ALTERADA':
      case 'PRECO_ALTERADO':
      case 'QUANTIDADE_E_PRECO_ALTERADOS':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'MANTIDO':
        return 'text-slate-400 bg-slate-800/30';
      default:
        return 'text-slate-400 bg-slate-800/30';
    }
  };

  const obterTextoTipoAlteracao = (tipo: string) => {
    switch (tipo) {
      case 'ADICIONADO':
        return 'Adicionado';
      case 'REMOVIDO':
        return 'Removido';
      case 'QUANTIDADE_ALTERADA':
        return 'Qtd. Alterada';
      case 'PRECO_ALTERADO':
        return 'Preço Alterado';
      case 'QUANTIDADE_E_PRECO_ALTERADOS':
        return 'Qtd. e Preço Alterados';
      case 'MANTIDO':
        return 'Mantido';
      default:
        return tipo;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Comparação de Versões</h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Versão Anterior:</span>
                <span className="px-3 py-1 bg-blue-900/30 border border-blue-700 rounded text-blue-300 font-semibold">
                  {versaoAnterior.nome} (v{versaoAnterior.numero})
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Versão Nova:</span>
                <span className="px-3 py-1 bg-green-900/30 border border-green-700 rounded text-green-300 font-semibold">
                  {versaoNova.nome} (v{versaoNova.numero})
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Anterior</p>
              <p className="text-lg font-bold text-slate-200">{formatCurrency(estatisticas.totalAnterior)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Novo</p>
              <p className="text-lg font-bold text-slate-200">{formatCurrency(estatisticas.totalNovo)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Variação</p>
              <div className="flex items-center gap-2">
                {estatisticas.delta >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <p className={`text-lg font-bold ${estatisticas.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(estatisticas.delta))}
                </p>
                <span className={`text-xs ${estatisticas.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ({estatisticas.percentualVariacao.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Itens</p>
              <p className="text-lg font-bold text-slate-200">
                {estatisticas.totalFiltrados} / {estatisticas.totalItens}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="p-4 border-b border-slate-700 space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Tipo:</span>
              {(['TODOS', 'ADICIONADO', 'REMOVIDO', 'ALTERADO', 'MANTIDO'] as FiltroTipo[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    filtroTipo === tipo
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'ALTERADO' ? 'Alterados' : obterTextoTipoAlteracao(tipo)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-400">Ordenar por:</span>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as 'codigo' | 'impacto')}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="codigo">Código</option>
                <option value="impacto">Impacto Financeiro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Comparação */}
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">Código</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">Descrição</th>
                  <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">Un.</th>
                  <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">Tipo</th>
                  
                  {/* Versão Anterior */}
                  <th colSpan={3} className="text-center text-xs font-semibold text-blue-400 px-4 py-2 border-b border-l-2 border-blue-700 bg-blue-950/20">
                    Versão Anterior (v{versaoAnterior.numero})
                  </th>
                  
                  {/* Versão Nova */}
                  <th colSpan={3} className="text-center text-xs font-semibold text-green-400 px-4 py-2 border-b border-l-2 border-green-700 bg-green-950/20">
                    Versão Nova (v{versaoNova.numero})
                  </th>
                  
                  {/* Delta */}
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-3 border-b border-l-2 border-slate-700">Variação (R$)</th>
                </tr>
                <tr>
                  <th colSpan={4}></th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b border-l-2 border-blue-700 bg-blue-950/10">Qtd.</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b bg-blue-950/10">Preço Unit.</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b bg-blue-950/10">Total</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b border-l-2 border-green-700 bg-green-950/10">Qtd.</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b bg-green-950/10">Preço Unit.</th>
                  <th className="text-right text-xs font-semibold text-slate-400 px-4 py-2 border-b bg-green-950/10">Total</th>
                  <th className="border-b border-l-2 border-slate-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {itensFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-400">
                      {busca.trim() ? 'Nenhum item encontrado com os filtros aplicados' : 'Nenhum item para comparar'}
                    </td>
                  </tr>
                ) : (
                  itensFiltrados.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{item.codigo}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-md truncate" title={item.discriminacao}>
                        {item.discriminacao}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-slate-400">{item.unidade || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${obterCorTipoAlteracao(item.tipoAlteracao)}`}>
                          {obterTextoTipoAlteracao(item.tipoAlteracao)}
                        </span>
                      </td>
                      
                      {/* Versão Anterior */}
                      <td className="px-4 py-3 text-sm text-right font-mono border-l-2 border-blue-700 bg-blue-950/5">
                        {item.quantidadeAnterior !== null ? formatQuantity(item.quantidadeAnterior) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono bg-blue-950/5">
                        {item.precoAnterior !== null ? formatCurrency(item.precoAnterior) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold bg-blue-950/5">
                        {formatCurrency(item.totalAnterior)}
                      </td>
                      
                      {/* Versão Nova */}
                      <td className="px-4 py-3 text-sm text-right font-mono border-l-2 border-green-700 bg-green-950/5">
                        {item.quantidadeNova !== null ? formatQuantity(item.quantidadeNova) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono bg-green-950/5">
                        {item.precoNovo !== null ? formatCurrency(item.precoNovo) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold bg-green-950/5">
                        {formatCurrency(item.totalNovo)}
                      </td>
                      
                      {/* Delta */}
                      <td className={`px-4 py-3 text-sm text-right font-mono font-bold border-l-2 border-slate-700 ${
                        item.delta > 0 ? 'text-green-400' : item.delta < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {item.delta > 0 && '+'}{formatCurrency(item.delta)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              💡 Dica: Use a ordenação por "Impacto Financeiro" para visualizar os itens com maior variação primeiro
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
