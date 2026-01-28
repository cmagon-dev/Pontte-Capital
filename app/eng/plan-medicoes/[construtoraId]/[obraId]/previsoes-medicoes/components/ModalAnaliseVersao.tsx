'use client';

import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Plus, Minus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ImpactoFinanceiro {
  totalAnterior: number;
  totalNovo: number;
  delta: number;
  percentualVariacao: number;
}

interface Estatisticas {
  itensAdicionados: number;
  itensRemovidos: number;
  itensAlterados: number;
  itensMantidos: number;
}

interface ItemMapeamento {
  codigo: string;
  discriminacao: string;
  unidade: string | null;
  tipoAlteracao: string;
  quantidadeAnterior: number | null;
  quantidadeNova: number | null;
  precoAnterior: number | null;
  precoNovo: number | null;
}

interface ModalAnaliseVersaoProps {
  isOpen: boolean;
  onClose: () => void;
  versaoAnterior: {
    numero: number;
    nome: string;
  };
  versaoNova: {
    numero: number;
    nome: string;
  };
  estatisticas: Estatisticas;
  impactoFinanceiro: ImpactoFinanceiro;
  mapeamento: ItemMapeamento[];
  onConfirmarMigracao: () => Promise<void>;
}

export default function ModalAnaliseVersao({
  isOpen,
  onClose,
  versaoAnterior,
  versaoNova,
  estatisticas,
  impactoFinanceiro,
  mapeamento,
  onConfirmarMigracao,
}: ModalAnaliseVersaoProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [migrando, setMigrando] = useState(false);

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

  const itensFiltrados = filtroTipo === 'TODOS' 
    ? mapeamento 
    : mapeamento.filter(item => item.tipoAlteracao === filtroTipo);

  const handleConfirmarMigracao = async () => {
    try {
      setMigrando(true);
      await onConfirmarMigracao();
      onClose();
    } catch (error) {
      console.error('Erro ao migrar:', error);
    } finally {
      setMigrando(false);
    }
  };

  const obterCorTipoAlteracao = (tipo: string) => {
    switch (tipo) {
      case 'ADICIONADO':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'REMOVIDO':
        return 'text-red-400 bg-red-900/30 border-red-700';
      case 'QUANTIDADE_ALTERADA':
      case 'PRECO_ALTERADO':
      case 'QUANTIDADE_E_PRECO_ALTERADOS':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      default:
        return 'text-slate-400 bg-slate-800/30 border-slate-700';
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
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Análise de Impacto da Nova Versão</h2>
            <p className="text-sm text-slate-400">
              Comparando: <span className="text-blue-400">{versaoAnterior.nome} (v{versaoAnterior.numero})</span> → <span className="text-green-400">{versaoNova.nome} (v{versaoNova.numero})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 mb-1">Itens Adicionados</p>
                  <p className="text-2xl font-bold text-blue-300">{estatisticas.itensAdicionados}</p>
                </div>
                <Plus className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400 mb-1">Itens Removidos</p>
                  <p className="text-2xl font-bold text-red-300">{estatisticas.itensRemovidos}</p>
                </div>
                <Minus className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-400 mb-1">Itens Alterados</p>
                  <p className="text-2xl font-bold text-yellow-300">{estatisticas.itensAlterados}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 mb-1">Itens Mantidos</p>
                  <p className="text-2xl font-bold text-green-300">{estatisticas.itensMantidos}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Impacto Financeiro */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Impacto Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-2">Valor Anterior</p>
                <p className="text-xl font-bold text-slate-300">{formatCurrency(impactoFinanceiro.totalAnterior)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Valor Novo</p>
                <p className="text-xl font-bold text-slate-300">{formatCurrency(impactoFinanceiro.totalNovo)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Variação</p>
                <div className="flex items-center gap-2">
                  {impactoFinanceiro.delta >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`text-xl font-bold ${impactoFinanceiro.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(impactoFinanceiro.delta))}
                  </p>
                  <span className={`text-sm ${impactoFinanceiro.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({impactoFinanceiro.percentualVariacao.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400">Filtrar por:</span>
            {['TODOS', 'ADICIONADO', 'REMOVIDO', 'QUANTIDADE_ALTERADA', 'QUANTIDADE_E_PRECO_ALTERADOS'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filtroTipo === tipo
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tipo === 'TODOS' ? 'Todos' : obterTextoTipoAlteracao(tipo)}
              </button>
            ))}
          </div>

          {/* Lista de Itens */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Código</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Descrição</th>
                    <th className="text-center text-xs font-semibold text-slate-400 px-4 py-3">Tipo</th>
                    <th className="text-right text-xs font-semibold text-slate-400 px-4 py-3">Qtd. Anterior</th>
                    <th className="text-right text-xs font-semibold text-slate-400 px-4 py-3">Qtd. Nova</th>
                    <th className="text-right text-xs font-semibold text-slate-400 px-4 py-3">Preço Anterior</th>
                    <th className="text-right text-xs font-semibold text-slate-400 px-4 py-3">Preço Novo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {itensFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Nenhum item encontrado com este filtro
                      </td>
                    </tr>
                  ) : (
                    itensFiltrados.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-slate-300">{item.codigo}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{item.discriminacao}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${obterCorTipoAlteracao(item.tipoAlteracao)}`}>
                            {obterTextoTipoAlteracao(item.tipoAlteracao)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                          {item.quantidadeAnterior !== null ? `${formatQuantity(item.quantidadeAnterior)} ${item.unidade || ''}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                          {item.quantidadeNova !== null ? `${formatQuantity(item.quantidadeNova)} ${item.unidade || ''}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                          {item.precoAnterior !== null ? formatCurrency(item.precoAnterior) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-slate-300">
                          {item.precoNovo !== null ? formatCurrency(item.precoNovo) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <p className="mb-1">⚠️ Ao confirmar, as medições existentes serão atualizadas para a nova versão.</p>
              <p>Os percentuais serão recalculados automaticamente (mantendo quantidades absolutas).</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={migrando}
                className="px-6 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarMigracao}
                disabled={migrando}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                {migrando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  'Confirmar Migração'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
