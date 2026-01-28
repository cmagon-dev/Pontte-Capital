'use client';

import React, { useState } from 'react';
import { X, Calendar, TrendingUp, TrendingDown, FileText, User, Filter, ChevronDown, ChevronRight } from 'lucide-react';

interface HistoricoItem {
  id: string;
  dataAtualizacao: Date;
  tipoAlteracao: 'ADITIVO' | 'REVISAO' | 'GLOSA';
  numeroAditivo?: number;
  descricao?: string;
  usuarioId?: string;
  itensAdicionados: number;
  itensRemovidos: number;
  itensAlterados: number;
  itensMantidos: number;
  versaoAnterior: {
    numero: number;
    nome: string;
  };
  versaoNova: {
    numero: number;
    nome: string;
  };
  impactoFinanceiro?: {
    totalAnterior: number;
    totalNovo: number;
    delta: number;
    percentualVariacao: number;
  };
}

interface ModalHistoricoAditivosProps {
  isOpen: boolean;
  onClose: () => void;
  historico: HistoricoItem[];
  nomeObra: string;
}

type FiltroTipo = 'TODOS' | 'ADITIVO' | 'REVISAO' | 'GLOSA';

export default function ModalHistoricoAditivos({
  isOpen,
  onClose,
  historico,
  nomeObra,
}: ModalHistoricoAditivosProps) {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('TODOS');
  const [itemExpandido, setItemExpandido] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Filtrar histórico
  const historicoFiltrado = filtroTipo === 'TODOS'
    ? historico
    : historico.filter(item => item.tipoAlteracao === filtroTipo);

  // Estatísticas gerais
  const estatisticasGerais = {
    totalAditivos: historico.filter(h => h.tipoAlteracao === 'ADITIVO').length,
    totalRevisoes: historico.filter(h => h.tipoAlteracao === 'REVISAO').length,
    totalGlosas: historico.filter(h => h.tipoAlteracao === 'GLOSA').length,
    impactoTotal: historico.reduce((sum, h) => sum + (h.impactoFinanceiro?.delta || 0), 0),
  };

  const obterCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ADITIVO':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'REVISAO':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'GLOSA':
        return 'text-red-400 bg-red-900/30 border-red-700';
      default:
        return 'text-slate-400 bg-slate-800/30 border-slate-700';
    }
  };

  const obterIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'ADITIVO':
        return '📈';
      case 'REVISAO':
        return '🔄';
      case 'GLOSA':
        return '📉';
      default:
        return '📄';
    }
  };

  const obterTextoTipo = (tipo: string, numeroAditivo?: number) => {
    switch (tipo) {
      case 'ADITIVO':
        return numeroAditivo ? `Aditivo ${String(numeroAditivo).padStart(2, '0')}` : 'Aditivo';
      case 'REVISAO':
        return 'Revisão Geral';
      case 'GLOSA':
        return 'Glosa (Supressão)';
      default:
        return tipo;
    }
  };

  const toggleExpand = (id: string) => {
    setItemExpandido(itemExpandido === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Histórico de Alterações Contratuais</h2>
            <p className="text-sm text-slate-400">{nomeObra}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Estatísticas Gerais */}
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400 mb-1">Aditivos</p>
                  <p className="text-2xl font-bold text-green-300">{estatisticasGerais.totalAditivos}</p>
                </div>
                <span className="text-3xl">📈</span>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 mb-1">Revisões</p>
                  <p className="text-2xl font-bold text-blue-300">{estatisticasGerais.totalRevisoes}</p>
                </div>
                <span className="text-3xl">🔄</span>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400 mb-1">Glosas</p>
                  <p className="text-2xl font-bold text-red-300">{estatisticasGerais.totalGlosas}</p>
                </div>
                <span className="text-3xl">📉</span>
              </div>
            </div>

            <div className={`${estatisticasGerais.impactoTotal >= 0 ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Impacto Total</p>
                  <p className={`text-xl font-bold ${estatisticasGerais.impactoTotal >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {estatisticasGerais.impactoTotal >= 0 ? '+' : ''}{formatCurrency(estatisticasGerais.impactoTotal)}
                  </p>
                </div>
                {estatisticasGerais.impactoTotal >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">Filtrar por:</span>
            {(['TODOS', 'ADITIVO', 'REVISAO', 'GLOSA'] as FiltroTipo[]).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filtroTipo === tipo
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {tipo === 'TODOS' ? 'Todos' : tipo.charAt(0) + tipo.slice(1).toLowerCase()}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              {historicoFiltrado.length} {historicoFiltrado.length === 1 ? 'alteração' : 'alterações'}
            </span>
          </div>
        </div>

        {/* Timeline de Histórico */}
        <div className="flex-1 overflow-y-auto p-6">
          {historicoFiltrado.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Nenhuma alteração encontrada</p>
              <p className="text-slate-500 text-sm mt-2">
                {filtroTipo !== 'TODOS' 
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Esta obra ainda não possui histórico de alterações'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicoFiltrado.map((item, index) => (
                <div key={item.id} className="relative">
                  {/* Linha conectora (exceto último item) */}
                  {index < historicoFiltrado.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-700"></div>
                  )}

                  {/* Card do item */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                    {/* Header do card */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Ícone de timeline */}
                        <div className="flex-shrink-0 w-10 h-10 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center text-xl z-10">
                          {obterIconeTipo(item.tipoAlteracao)}
                        </div>

                        {/* Conteúdo principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded border font-semibold ${obterCorTipo(item.tipoAlteracao)}`}>
                                  {obterTextoTipo(item.tipoAlteracao, item.numeroAditivo)}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(item.dataAtualizacao)}
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-white">
                                {item.versaoAnterior.nome} (v{item.versaoAnterior.numero}) → {item.versaoNova.nome} (v{item.versaoNova.numero})
                              </h3>
                            </div>
                            <button className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors">
                              {itemExpandido === item.id ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>

                          {/* Descrição (se houver) */}
                          {item.descricao && (
                            <p className="text-sm text-slate-400 mb-3">{item.descricao}</p>
                          )}

                          {/* Estatísticas resumidas */}
                          <div className="flex items-center gap-4 text-xs">
                            {item.itensAdicionados > 0 && (
                              <span className="text-blue-400">+{item.itensAdicionados} adicionados</span>
                            )}
                            {item.itensRemovidos > 0 && (
                              <span className="text-red-400">-{item.itensRemovidos} removidos</span>
                            )}
                            {item.itensAlterados > 0 && (
                              <span className="text-yellow-400">{item.itensAlterados} alterados</span>
                            )}
                            {item.impactoFinanceiro && (
                              <span className={`font-semibold ${item.impactoFinanceiro.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.impactoFinanceiro.delta >= 0 ? '+' : ''}{formatCurrency(item.impactoFinanceiro.delta)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo expandido */}
                    {itemExpandido === item.id && (
                      <div className="border-t border-slate-700 p-4 bg-slate-900/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Estatísticas detalhadas */}
                          <div>
                            <h4 className="text-xs font-semibold text-slate-300 mb-3">Alterações de Itens</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Itens Adicionados:</span>
                                <span className="text-blue-400 font-semibold">{item.itensAdicionados}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Itens Removidos:</span>
                                <span className="text-red-400 font-semibold">{item.itensRemovidos}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Itens Alterados:</span>
                                <span className="text-yellow-400 font-semibold">{item.itensAlterados}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Itens Mantidos:</span>
                                <span className="text-slate-300 font-semibold">{item.itensMantidos}</span>
                              </div>
                            </div>
                          </div>

                          {/* Impacto financeiro */}
                          {item.impactoFinanceiro && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-300 mb-3">Impacto Financeiro</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">Valor Anterior:</span>
                                  <span className="text-slate-300 font-mono">{formatCurrency(item.impactoFinanceiro.totalAnterior)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">Valor Novo:</span>
                                  <span className="text-slate-300 font-mono">{formatCurrency(item.impactoFinanceiro.totalNovo)}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Variação:</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-mono font-bold ${item.impactoFinanceiro.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.impactoFinanceiro.delta >= 0 ? '+' : ''}{formatCurrency(item.impactoFinanceiro.delta)}
                                      </span>
                                      <span className={`text-xs ${item.impactoFinanceiro.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ({item.impactoFinanceiro.percentualVariacao.toFixed(2)}%)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Informações adicionais */}
                        {item.usuarioId && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <User className="w-3 h-3" />
                              <span>Usuário: {item.usuarioId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              💡 Clique em cada item para ver mais detalhes
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
