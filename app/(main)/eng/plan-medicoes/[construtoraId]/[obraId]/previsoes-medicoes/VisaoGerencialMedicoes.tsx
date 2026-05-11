'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ChevronsDown, ChevronsUp, Layers } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

// --- TIPAGENS ---

type ItemVisaoGerencial = {
  id: string;
  codigo: string;
  discriminacao: string;
  nivel: number;
  tipo: 'AGRUPADOR' | 'ITEM';
  ordem: number;
  parentId: string | null;
  precoTotalVenda: number;
  vinculosItens: Array<{
    id: string;
    itemCustoOrcadoId: string;
    itemCustoOrcado?: {
      id: string;
      codigo: string;
      discriminacao: string;
    };
  }>;
};

type Medicao = {
  id: string;
  nome: string;
  dataPrevisao: string;
  numero: number;
  ordem: number;
  visivel: boolean;
  tipo: 'percentual' | 'quantidade';
  status?: 'PREVISTA' | 'EM_MEDICAO' | 'REALIZADA' | 'CANCELADA';
};

type ValorMedicao = {
  quantidade: number;
  percentual: number;
  valorTotal: number;
  percentualTotal: number;
};

interface VisaoGerencialMedicoesProps {
  versaoVisaoGerencial: {
    id: string;
    nome: string;
    itens: Array<ItemVisaoGerencial>;
  };
  medicoes: Medicao[];
  valoresMedicoes: Map<string, Map<string, ValorMedicao>>;
  acumuladoVisivel: boolean;
  mapCodigoParaId: Map<string, string>; // Converte código do item para ID do ItemOrcamento
}

export default function VisaoGerencialMedicoes({
  versaoVisaoGerencial,
  medicoes,
  valoresMedicoes,
  acumuladoVisivel,
  mapCodigoParaId,
}: VisaoGerencialMedicoesProps) {
  
  // Estados
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Construir hierarquia de itens
  const itensHierarquicos = useMemo(() => {
    const itensMap = new Map<string, ItemVisaoGerencial & { filhos: string[] }>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

    versaoVisaoGerencial.itens.forEach((item) => {
      itensMap.set(item.id, {
        ...item,
        filhos: [],
      });

      if (item.parentId) {
        if (!filhosMap.has(item.parentId)) {
          filhosMap.set(item.parentId, []);
        }
        filhosMap.get(item.parentId)!.push({
          id: item.id,
          ordem: item.ordem,
        });
      }
    });

    filhosMap.forEach((filhos, parentId) => {
      const parent = itensMap.get(parentId);
      if (parent) {
        filhos.sort((a, b) => a.ordem - b.ordem);
        parent.filhos = filhos.map(f => f.id);
      }
    });

    return itensMap;
  }, [versaoVisaoGerencial.itens]);

  // Itens visíveis (respeitando expansão)
  const visibleItems = useMemo(() => {
    const itensRaiz = Array.from(itensHierarquicos.values()).filter((item) => item.nivel === 0);
    const resultado: Array<ItemVisaoGerencial & { filhos: string[] }> = [];

    const adicionarItemEFilhos = (item: ItemVisaoGerencial & { filhos: string[] }) => {
      resultado.push(item);
      
      if (item.tipo === 'AGRUPADOR' && expandedRows.has(item.id)) {
        item.filhos.forEach((filhoId) => {
          const filho = itensHierarquicos.get(filhoId);
          if (filho) {
            adicionarItemEFilhos(filho);
          }
        });
      }
    };

    itensRaiz.forEach((item) => adicionarItemEFilhos(item));
    return resultado;
  }, [itensHierarquicos, expandedRows]);

  // Função para alternar expansão de linha
  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  // Expandir/recolher todos
  const expandirTodos = () => {
    const todosIds = Array.from(itensHierarquicos.values())
      .filter((item) => item.tipo === 'AGRUPADOR')
      .map((item) => item.id);
    setExpandedRows(new Set(todosIds));
  };

  const recolherTodos = () => {
    setExpandedRows(new Set());
  };

  // Função para agregar valores de uma medição para um ItemVisaoGerencial
  const agregarValoresMedicao = (item: ItemVisaoGerencial & { filhos: string[] }, medicaoId: string): ValorMedicao => {
    let totalValor = 0;
    
    // Se for um agrupador, somar recursivamente os filhos
    if (item.tipo === 'AGRUPADOR' && item.filhos.length > 0) {
      item.filhos.forEach((filhoId) => {
        const filho = itensHierarquicos.get(filhoId);
        if (filho) {
          const valorFilho = agregarValoresMedicao(filho, medicaoId);
          totalValor += valorFilho.valorTotal;
        }
      });
    } else {
      // Para itens folha (nível 2), somar os valores dos itens vinculados
      item.vinculosItens.forEach((vinculo) => {
        // Converter itemCustoOrcado.codigo → ItemOrcamento.id usando o mapa
        const codigoItem = vinculo.itemCustoOrcado?.codigo;
        if (codigoItem) {
          const itemOrcamentoId = mapCodigoParaId.get(codigoItem);
          if (itemOrcamentoId) {
            const valor = valoresMedicoes.get(itemOrcamentoId)?.get(medicaoId);
            if (valor) {
              totalValor += valor.valorTotal;
            }
          }
        }
      });
    }
    
    const percentualTotal = item.precoTotalVenda > 0 ? (totalValor / item.precoTotalVenda) * 100 : 0;
    
    return {
      quantidade: 0, // Não calculamos quantidade na EAP
      percentual: 0,
      valorTotal: totalValor,
      percentualTotal: percentualTotal,
    };
  };

  // Calcular valores acumulados (soma de todas as medições)
  const calcularValorAcumulado = (item: ItemVisaoGerencial & { filhos: string[] }): ValorMedicao => {
    let totalValor = 0;
    
    medicoes.forEach((medicao) => {
      const valor = agregarValoresMedicao(item, medicao.id);
      totalValor += valor.valorTotal;
    });
    
    const percentualTotal = item.precoTotalVenda > 0 ? (totalValor / item.precoTotalVenda) * 100 : 0;
    
    return {
      quantidade: 0,
      percentual: 0,
      valorTotal: totalValor,
      percentualTotal: percentualTotal,
    };
  };

  // Função para determinar a cor baseada no percentual acumulado
  const obterCorPorPercentualAcumulado = (item: ItemVisaoGerencial & { filhos: string[] }): string => {
    const valorAcumulado = calcularValorAcumulado(item);
    const percentual = valorAcumulado.percentualTotal;
    const isAgrupador = item.tipo === 'AGRUPADOR';
    
    if (percentual > 100) {
      return isAgrupador ? 'text-red-400' : 'text-red-300';
    } else if (percentual === 100) {
      return isAgrupador ? 'text-green-400' : 'text-green-300';
    } else if (percentual > 0) {
      return isAgrupador ? 'text-yellow-400' : 'text-yellow-300';
    } else {
      return isAgrupador ? 'text-white' : 'text-slate-300';
    }
  };

  // Função para determinar se deve usar negrito (níveis 0 e 1 = negrito, nível 2 = normal)
  const obterClasseFonte = (item: ItemVisaoGerencial & { filhos: string[] }): string => {
    return item.nivel < 2 ? 'font-bold' : 'font-normal';
  };

  // Calcular níveis disponíveis
  const getNiveisDisponiveis = (): number[] => {
    const niveis = new Set<number>();
    Array.from(itensHierarquicos.values()).forEach((item) => {
      if (item.tipo === 'AGRUPADOR') {
        niveis.add(item.nivel);
      }
    });
    return Array.from(niveis).sort((a, b) => a - b);
  };

  // Toggle nível
  const toggleNivel = (nivel: number) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      
      if (nivel === 0) {
        const itensDoNivel0 = Array.from(itensHierarquicos.values()).filter((i) => i.nivel === 0 && i.tipo === 'AGRUPADOR');
        const todosExpandidos = itensDoNivel0.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel0.forEach((item) => newExpanded.delete(item.id));
          Array.from(itensHierarquicos.values()).forEach((item) => {
            if (item.nivel > 0 && item.tipo === 'AGRUPADOR') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          itensDoNivel0.forEach((item) => newExpanded.add(item.id));
        }
      } else {
        for (let n = 0; n < nivel; n++) {
          const itensDoNivelAnterior = Array.from(itensHierarquicos.values()).filter(
            (i) => i.nivel === n && i.tipo === 'AGRUPADOR'
          );
          itensDoNivelAnterior.forEach((item) => newExpanded.add(item.id));
        }

        const itensDoNivel = Array.from(itensHierarquicos.values()).filter(
          (i) => i.nivel === nivel && i.tipo === 'AGRUPADOR'
        );
        const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel.forEach((item) => newExpanded.delete(item.id));
          Array.from(itensHierarquicos.values()).forEach((item) => {
            if (item.nivel > nivel && item.tipo === 'AGRUPADOR') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          itensDoNivel.forEach((item) => newExpanded.add(item.id));
        }
      }

      return newExpanded;
    });
  };

  // Calcular total geral EAP usando Number() para converter Decimal para número
  const totalGeralEAP = Array.from(itensHierarquicos.values())
    .filter((i) => i.nivel === 0)
    .reduce((sum, i) => sum + Number(i.precoTotalVenda), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Controles de Níveis */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Níveis EAP:
          </span>
          {getNiveisDisponiveis().map((nivel) => {
            const itensDoNivel = Array.from(itensHierarquicos.values()).filter((i) => i.nivel === nivel && i.tipo === 'AGRUPADOR');
            const todosExpandidos = itensDoNivel.every((item) => expandedRows.has(item.id));
            const algunsExpandidos = itensDoNivel.some((item) => expandedRows.has(item.id));

            return (
              <button
                key={nivel}
                onClick={() => toggleNivel(nivel)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  todosExpandidos
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : algunsExpandidos
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Nível {nivel} {todosExpandidos ? '(Expandido)' : algunsExpandidos ? '(Parcial)' : '(Recolhido)'}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandirTodos}
            className="p-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Expandir todos"
          >
            <ChevronsDown className="w-4 h-4" />
          </button>
          <button
            onClick={recolherTodos}
            className="p-2 rounded-lg transition-colors bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Recolher todos"
          >
            <ChevronsUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="max-h-[calc(100vh-300px)] overflow-auto">
        <table className="table-engineering w-full border-collapse text-xs">
          <thead className="sticky top-0 z-20 bg-slate-900">
            <tr className="bg-slate-900 shadow-lg">
              <th rowSpan={2} className="w-12 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4"></th>
              <th rowSpan={2} className="w-32 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-2">
                <span className="text-xs">Código EAP</span>
              </th>
              <th rowSpan={2} className="min-w-[300px] bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-2">
                <span className="text-xs">Discriminação</span>
              </th>
              <th rowSpan={2} className="number-cell w-40 bg-slate-900 border-b-4 border-r-2 border-slate-700 text-xs py-4 px-1">Valor Total EAP</th>
              
              {/* Colunas de Medições */}
              {medicoes.map((medicao) => (
                <th 
                  key={medicao.id} 
                  colSpan={2}
                  className="bg-blue-900/30 border-b py-3 px-2"
                  style={{ 
                    borderLeftWidth: '3px', 
                    borderRightWidth: '3px',
                    borderLeftColor: 'rgb(71 85 105)',
                    borderRightColor: 'rgb(71 85 105)'
                  }}
                >
                  <div className="text-xs font-bold text-blue-400 text-center">
                    {medicao.nome}
                  </div>
                </th>
              ))}

              {/* Coluna Acumulado */}
              {acumuladoVisivel && (
                <th 
                  colSpan={2}
                  className="bg-purple-900/30 border-b py-3 px-2"
                  style={{ 
                    borderLeftWidth: '3px', 
                    borderRightWidth: '3px',
                    borderLeftColor: 'rgb(71 85 105)',
                    borderRightColor: 'rgb(71 85 105)'
                  }}
                >
                  <div className="text-xs font-bold text-purple-400 text-center">Acumulado</div>
                </th>
              )}
            </tr>
            <tr className="bg-slate-900">
              {medicoes.map((medicao) => (
                <React.Fragment key={`medicao-header-${medicao.id}`}>
                  <th className="number-cell w-40 bg-blue-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1"
                    style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)' }}>
                    Total (R$)
                  </th>
                  <th className="number-cell w-32 bg-blue-900/20 border-b-4 text-xs py-2 px-1"
                    style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)' }}>
                    Total (%)
                  </th>
                </React.Fragment>
              ))}

              {acumuladoVisivel && (
                <>
                  <th className="number-cell w-40 bg-purple-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1"
                    style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)' }}>
                    Total (R$)
                  </th>
                  <th className="number-cell w-32 bg-purple-900/20 border-b-4 text-xs py-2 px-1"
                    style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)' }}>
                    Total (%)
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleItems.length === 0 ? (
              <tr>
                <td colSpan={4 + (medicoes.length * 2) + (acumuladoVisivel ? 2 : 0)} className="text-center py-8 text-slate-400">
                  Nenhum item encontrado na Visão Gerencial.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800 ${item.tipo === 'AGRUPADOR' ? 'bg-slate-850' : ''} ${
                    item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
                  }`}
                >
                  <td className="py-1 px-1">
                    {item.tipo === 'AGRUPADOR' && item.filhos.length > 0 ? (
                      <button
                        onClick={() => toggleRow(item.id)}
                        className="p-0.5 hover:bg-slate-700 rounded"
                      >
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-4"></div>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <span
                      className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}
                      style={{ paddingLeft: `${item.nivel * 12}px` }}
                    >
                      {item.codigo}
                    </span>
                  </td>
                  <td className="py-1 px-2">
                    <span className={`text-xs ${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                      {item.discriminacao}
                    </span>
                  </td>
                  <td className="number-cell text-xs py-1 px-1">
                    <span className={`font-mono ${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                      {item.precoTotalVenda > 0 ? formatCurrency(item.precoTotalVenda) : '-'}
                    </span>
                  </td>

                  {/* Colunas de Medições */}
                  {medicoes.map((medicao) => {
                    const valor = agregarValoresMedicao(item, medicao.id);
                    
                    return (
                      <React.Fragment key={`medicao-${medicao.id}-item-${item.id}`}>
                        <td className={`number-cell py-1 px-2 border-r font-mono text-xs border-slate-700`}
                          style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)' }}>
                          <span className={`${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                            {valor.valorTotal > 0 ? formatCurrency(valor.valorTotal) : '-'}
                          </span>
                        </td>
                        <td className="number-cell py-1 px-2 font-mono text-xs"
                          style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)' }}>
                          <span className={`${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                            {valor.percentualTotal > 0 ? formatPercent(valor.percentualTotal) : '-'}
                          </span>
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* Colunas do Acumulado */}
                  {acumuladoVisivel && (() => {
                    const valorAcumulado = calcularValorAcumulado(item);
                    
                    return (
                      <>
                        <td className={`number-cell py-1 px-2 border-r border-slate-700`}
                          style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)' }}>
                          <span className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                            {valorAcumulado.valorTotal > 0 ? formatCurrency(valorAcumulado.valorTotal) : '-'}
                          </span>
                        </td>
                        <td className="number-cell py-1 px-2"
                          style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)' }}>
                          <span className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${obterClasseFonte(item)}`}>
                            {valorAcumulado.percentualTotal > 0 ? formatPercent(valorAcumulado.percentualTotal) : '-'}
                          </span>
                        </td>
                      </>
                    );
                  })()}
                </tr>
              ))
            )}
            
            {/* Linha de Totais */}
            <tr className="bg-slate-800 border-t-2 border-slate-600 font-bold sticky bottom-0 z-10">
              <td colSpan={3} className="py-2 px-2 text-right text-white text-xs">TOTAL GERAL EAP:</td>
              <td className="number-cell py-2 px-1 text-white font-mono text-xs">{formatCurrency(totalGeralEAP)}</td>
              {medicoes.map((medicao) => {
                const totalMedicao = Array.from(itensHierarquicos.values())
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => sum + agregarValoresMedicao(item, medicao.id).valorTotal, 0);
                
                const percentualMedicao = totalGeralEAP > 0 ? (totalMedicao / totalGeralEAP) * 100 : 0;
                
                return (
                  <React.Fragment key={`medicao-eap-total-${medicao.id}`}>
                    <td className="number-cell py-2 px-2 border-r font-mono text-xs font-bold border-slate-700"
                      style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)', color: 'rgb(96 165 250)' }}>
                      {formatCurrency(totalMedicao)}
                    </td>
                    <td className="number-cell py-2 px-2 font-mono text-xs font-bold"
                      style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)', color: 'rgb(96 165 250)' }}>
                      {percentualMedicao > 0 ? formatPercent(percentualMedicao) : '-'}
                    </td>
                  </React.Fragment>
                );
              })}

              {acumuladoVisivel && (() => {
                const totalAcumulado = Array.from(itensHierarquicos.values())
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => sum + calcularValorAcumulado(item).valorTotal, 0);
                
                const percentualAcumulado = totalGeralEAP > 0 ? (totalAcumulado / totalGeralEAP) * 100 : 0;
                
                return (
                  <React.Fragment key="acumulado-eap-total">
                    <td className="number-cell py-2 px-2 border-r font-mono text-xs font-bold border-slate-700"
                      style={{ borderLeftWidth: '3px', borderLeftColor: 'rgb(71 85 105)', color: 'rgb(192 132 252)' }}>
                      {formatCurrency(totalAcumulado)}
                    </td>
                    <td className="number-cell py-2 px-2 font-mono text-xs font-bold"
                      style={{ borderRightWidth: '3px', borderRightColor: 'rgb(71 85 105)', color: 'rgb(192 132 252)' }}>
                      {percentualAcumulado > 0 ? formatPercent(percentualAcumulado) : '-'}
                    </td>
                  </React.Fragment>
                );
              })()}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
