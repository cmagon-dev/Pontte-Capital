'use client';

import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronDown, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { getCategorizacaoByObraId, getVisaoGerencialByObraId } from '@/lib/mock-data';
import { transformarCategorizacaoParaEAP } from '@/lib/utils/categorizacao-para-eap';

interface ModalEAPProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  operacoes: Array<{
    id: string;
    numero: string;
    tipoOperacao: 'aPerformar' | 'performada' | 'saldoPerformado';
    ordensPagamento?: Array<{
      id: string;
      credorNome: string;
      tipoDocumento: string;
      numeroDocumento: string;
      valorTotal: number;
      apropriacoesOrcamentarias: Array<{
        subEtapaId: string;
        subEtapaCode: string;
        subEtapaDescription: string;
        etapa: string;
        percentual: string;
        valor: string;
      }>;
    }>;
  }>;
}

interface ServicoComApropriacoes {
  servicoId: string;
  servicoCode: string;
  servicoDescricao: string;
  etapa: string;
  subetapa: string;
  valorOrcado: number;
  valorVenda: number;
  valorApropriado: number;
  percentualComprado: number;
  ordensPagamento: Array<{
    operacaoId: string;
    operacaoNumero: string;
    ordemId: string;
    credorNome: string;
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    valorApropriado: number;
  }>;
}

export default function ModalEAP({ isOpen, onClose, obraId, operacoes }: ModalEAPProps) {
  // Buscar categorização (mesma base usada para apropriação orçamentária)
  const categorizacaoItens = getCategorizacaoByObraId(obraId);
  const visaoGerencialCompleta = transformarCategorizacaoParaEAP(categorizacaoItens);
  
  // Inicializar todos os nós expandidos (apenas agrupadores)
  const initialExpandedNodes = useMemo(() => {
    const expanded = new Set<string>();
    visaoGerencialCompleta.forEach((item) => {
      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
        expanded.add(item.id);
      }
    });
    return expanded;
  }, [visaoGerencialCompleta]);
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpandedNodes);
  const [selectedServicoId, setSelectedServicoId] = useState<string | null>(null);
  
  // Buscar valores de custo/venda da visão gerencial para combinar com a categorização
  const visaoGerencialValores = getVisaoGerencialByObraId(obraId);
  const valoresMap = new Map<string, { custoTotal: number; precoTotal: number }>();
  visaoGerencialValores.forEach((item) => {
    if (item.tipo === 'item') {
      // Fazer match pelo ID (mesmo ID da categorização)
      valoresMap.set(item.id, {
        custoTotal: item.custoTotal || 0,
        precoTotal: item.precoTotal || 0,
      });
    }
  });

  // Criar mapa de itens por ID
  const itemsMap = useMemo(() => {
    const map = new Map();
    visaoGerencialCompleta.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [visaoGerencialCompleta]);

  // Agregar apropriações por serviço
  const servicosComApropriacoes = useMemo(() => {
    const servicosMap = new Map<string, ServicoComApropriacoes>();

    // Inicializar serviços a partir da categorização transformada (nivel 3, tipo item)
    visaoGerencialCompleta.forEach((item) => {
      if (item.tipo === 'item' && item.nivel === 3) {
        // Buscar valores de custo/venda da visão gerencial pelo ID
        const valores = valoresMap.get(item.id) || { custoTotal: 0, precoTotal: 0 };
        servicosMap.set(item.id, {
          servicoId: item.id,
          servicoCode: item.numeroHierarquico,
          servicoDescricao: item.descricao,
          etapa: item.etapa || '',
          subetapa: item.subetapa || '',
          valorOrcado: valores.custoTotal,
          valorVenda: valores.precoTotal,
          valorApropriado: 0,
          percentualComprado: 0,
          ordensPagamento: [],
        });
      }
    });

    // Agregar apropriações das operações
    operacoes.forEach((operacao) => {
      if (operacao.ordensPagamento) {
        operacao.ordensPagamento.forEach((ordem) => {
          ordem.apropriacoesOrcamentarias.forEach((aprop) => {
            const servicoId = aprop.subEtapaId;
            const servico = servicosMap.get(servicoId);
            if (servico) {
              const valorApropriado = parseFloat(aprop.valor.replace(/\./g, '').replace(',', '.'));
              servico.valorApropriado += valorApropriado;
              servico.ordensPagamento.push({
                operacaoId: operacao.id,
                operacaoNumero: operacao.numero,
                ordemId: ordem.id,
                credorNome: ordem.credorNome,
                tipoDocumento: ordem.tipoDocumento,
                numeroDocumento: ordem.numeroDocumento,
                valorTotal: ordem.valorTotal,
                valorApropriado: valorApropriado,
              });
            }
          });
        });
      }
    });

    // Calcular percentual comprado
    servicosMap.forEach((servico) => {
      servico.percentualComprado = servico.valorVenda > 0
        ? (servico.valorApropriado / servico.valorVenda) * 100
        : 0;
    });

    return Array.from(servicosMap.values());
  }, [operacoes, visaoGerencialCompleta]);

  // Criar mapa de serviços com apropriações para busca rápida
  const servicosApropriacoesMap = useMemo(() => {
    const map = new Map<string, ServicoComApropriacoes>();
    servicosComApropriacoes.forEach((servico) => {
      map.set(servico.servicoId, servico);
    });
    return map;
  }, [servicosComApropriacoes]);

  // Obter itens raiz (nivel 1 - Etapas)
  const rootItems = useMemo(() => {
    return visaoGerencialCompleta.filter((item) => item.nivel === 1 && item.tipo === 'agrupador');
  }, [visaoGerencialCompleta]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleServico = (servicoId: string) => {
    if (selectedServicoId === servicoId) {
      setSelectedServicoId(null);
    } else {
      setSelectedServicoId(servicoId);
    }
  };

  // Renderizar item da árvore
  const renderItem = (itemId: string, level: number = 0): React.ReactNode => {
    const item = itemsMap.get(itemId);
    if (!item) return null;

    const hasChildren = item.filhos && item.filhos.length > 0;
    const isExpanded = expandedNodes.has(itemId);
    const isServico = item.tipo === 'item' && item.nivel === 3;
    const servicoApropriacoes = isServico ? servicosApropriacoesMap.get(item.id) : null;
    const isSelected = selectedServicoId === item.id;

    if (isServico && servicoApropriacoes) {
      return (
        <div key={item.id}>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 cursor-pointer ${
              isSelected ? 'bg-blue-900/30 border border-blue-700' : ''
            }`}
            style={{ paddingLeft: `${12 + level * 20}px` }}
            onClick={() => toggleServico(item.id)}
          >
            <div className="flex-1 grid grid-cols-12 gap-2 items-center text-sm">
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-xs">{item.numeroHierarquico}</span>
                  <span className="text-white">{item.descricao}</span>
                </div>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-slate-300 font-mono text-xs">{formatCurrency(servicoApropriacoes.valorOrcado)}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-blue-400 font-mono text-xs">{formatCurrency(servicoApropriacoes.valorVenda)}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-green-400 font-mono text-xs">{formatCurrency(servicoApropriacoes.valorApropriado)}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className={`font-mono text-xs ${servicoApropriacoes.percentualComprado >= 100 ? 'text-red-400' : servicoApropriacoes.percentualComprado >= 80 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {formatPercent(servicoApropriacoes.percentualComprado)}
                </p>
              </div>
              <div className="col-span-1 text-right">
                {isSelected ? (
                  <ChevronDown className="w-4 h-4 text-blue-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>
          {isSelected && servicoApropriacoes.ordensPagamento.length > 0 && (
            <div className="ml-8 mt-2 mb-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-3">Ordens de Pagamento</h4>
                <div className="space-y-2">
                  {servicoApropriacoes.ordensPagamento.map((ordem) => (
                    <div key={ordem.ordemId} className="bg-slate-900 border border-slate-700 rounded p-2">
                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">Operação</p>
                          <p className="text-white font-mono">{ordem.operacaoNumero}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Credor</p>
                          <p className="text-white">{ordem.credorNome}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Documento</p>
                          <p className="text-white">{ordem.tipoDocumento} {ordem.numeroDocumento}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Valor Total</p>
                          <p className="text-white font-mono">{formatCurrency(ordem.valorTotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">Valor Apropriado</p>
                          <p className="text-green-400 font-mono">{formatCurrency(ordem.valorApropriado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 cursor-pointer"
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => hasChildren && toggleNode(itemId)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(itemId);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-slate-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <div className="flex-1 flex items-center gap-2">
            {item.numeroHierarquico && (
              <span className="text-slate-400 font-mono text-xs">{item.numeroHierarquico}</span>
            )}
            <span className={`text-sm ${item.nivel === 1 ? 'font-bold text-white' : item.nivel === 2 ? 'font-semibold text-slate-200' : 'text-slate-300'}`}>
              {item.descricao}
            </span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.filhos.map((childId: string) => renderItem(childId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">EAP - EAP Gerencial</h2>
              <p className="text-sm text-slate-400">Apropriações realizadas por serviço</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Cabeçalho da tabela */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-700 text-sm font-semibold">
              <div className="col-span-3 text-slate-300">Serviço</div>
              <div className="col-span-2 text-right text-slate-300">Valor Orçado</div>
              <div className="col-span-2 text-right text-blue-300">Valor de Venda</div>
              <div className="col-span-2 text-right text-green-300">Valor Apropriado</div>
              <div className="col-span-2 text-right text-yellow-300">% Comprado</div>
              <div className="col-span-1"></div>
            </div>
            <div className="divide-y divide-slate-700">
              {rootItems.map((rootItem) => renderItem(rootItem.id, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
