'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { formatPercent } from '@/lib/utils/format';

interface HierarchicalItem {
  id: string;
  numeroHierarquico: string;
  descricao: string;
  etapa?: string;
  subetapa?: string;
  servicoSimplificado?: string;
  nivel: number;
  tipo: 'agrupador' | 'item';
  filhos: string[];
  parentId?: string;
}

interface SubEtapaTreeSelectProps {
  items: HierarchicalItem[];
  selectedSubEtapaId: string;
  onSelect: (itemId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isItemDisabled?: (itemId: string) => boolean;
  getPercentualCompradoAcumulado?: (itemId: string) => number;
}

export default function SubEtapaTreeSelect({
  items,
  selectedSubEtapaId,
  onSelect,
  placeholder = 'Selecione um SERVIÇO...',
  disabled = false,
  isItemDisabled,
  getPercentualCompradoAcumulado,
}: SubEtapaTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Criar mapa de itens por ID para acesso rápido
  const itemsMap = useMemo(() => {
    const map = new Map<string, HierarchicalItem>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  // Filtrar apenas SERVIÇOS (nível 3, tipo item, com servicoSimplificado) - são as selecionáveis
  const servicosDisponiveis = useMemo(() => {
    return items.filter((item) => item.tipo === 'item' && item.servicoSimplificado && item.servicoSimplificado.trim() !== '');
  }, [items]);

  // Obter item selecionado
  const selectedItem = selectedSubEtapaId ? itemsMap.get(selectedSubEtapaId) : null;

  // Obter itens raiz (nível 1 - ETAPAS) - EAP da Visão Gerencial começa nas Etapas
  const rootItems = useMemo(() => {
    return items.filter((item) => item.nivel === 1 && item.tipo === 'agrupador');
  }, [items]);

  // Construir árvore recursivamente
  const renderItem = (itemId: string, level: number = 0): React.ReactNode => {
    const item = itemsMap.get(itemId);
    if (!item) return null;

    const hasChildren = item.filhos.length > 0;
    const isExpanded = expandedNodes.has(itemId);
    const isSelected = selectedSubEtapaId === itemId;
    const isSelectable = item.tipo === 'item' && item.servicoSimplificado && item.servicoSimplificado.trim() !== '' && item.nivel === 3; // Apenas Serviços (nível 3)
    const isDisabledByHierarchy = !isSelectable && item.tipo === 'agrupador'; // Não permitir selecionar agrupadores (Etapas ou Subetapas)
    
    // Obter % comprado acumulado para serviços
    const percentualCompradoAcumulado = isSelectable && getPercentualCompradoAcumulado 
      ? getPercentualCompradoAcumulado(itemId) 
      : 0;
    const isFechado = percentualCompradoAcumulado >= 100;
    // Desabilitar se 100% comprado OU se a função customizada retornar true
    const isDisabledByCustom = isSelectable && (isFechado || (isItemDisabled ? isItemDisabled(itemId) : false));
    const isDisabled = isDisabledByHierarchy || isDisabledByCustom;

    return (
      <div key={itemId} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded text-sm
            ${isSelectable && !disabled
              ? 'hover:bg-slate-700 cursor-pointer'
              : isDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-default'
            }
            ${isSelected ? 'bg-blue-900 text-blue-400' : 'text-slate-300'}
          `}
          onClick={() => {
            if (disabled) return;
            if (hasChildren && !isDisabled) {
              // Toggle expand/collapse
              const newExpanded = new Set(expandedNodes);
              if (isExpanded) {
                newExpanded.delete(itemId);
              } else {
                newExpanded.add(itemId);
              }
              setExpandedNodes(newExpanded);
            } else if (isSelectable && !isDisabled) {
              // Selecionar SERVIÇO (apenas se não estiver desabilitado)
              onSelect(itemId);
              setIsOpen(false);
            }
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) {
                  const newExpanded = new Set(expandedNodes);
                  if (isExpanded) {
                    newExpanded.delete(itemId);
                  } else {
                    newExpanded.add(itemId);
                  }
                  setExpandedNodes(newExpanded);
                }
              }}
              className="p-0.5 hover:bg-slate-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Espaçador para alinhamento
          )}
          
          <span className="flex-1">
            {item.numeroHierarquico} - {item.descricao}
          </span>
          
          {/* Mostrar % comprado acumulado e status para serviços */}
          {isSelectable && getPercentualCompradoAcumulado && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${isFechado ? 'text-red-400' : 'text-cyan-400'}`}>
                {formatPercent(percentualCompradoAcumulado)}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${isFechado ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                {isFechado ? 'Fechado' : 'Apto'}
              </span>
            </div>
          )}
          
          {isSelected && (
            <Check className="w-4 h-4 text-blue-400 ml-2" />
          )}
          
          {isDisabledByHierarchy && (
            <span className="text-xs text-slate-500 ml-2">(Selecione um SERVIÇO)</span>
          )}
        </div>
        
        {/* Renderizar filhos se expandido */}
        {hasChildren && isExpanded && (
          <div>
            {item.filhos.map((childId) => renderItem(childId, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Input/Botão de seleção */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-left
          focus:outline-none focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-600'}
          ${isOpen ? 'border-blue-500' : ''}
        `}
      >
        {selectedItem ? (
          <div className="flex items-center justify-between">
            <span className="text-white">
              {selectedItem.numeroHierarquico} - {selectedItem.descricao}
            </span>
            {selectedItem.subetapa && (
              <span className="text-xs text-slate-400 ml-2">
                ({selectedItem.etapa} → {selectedItem.subetapa})
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}
      </button>

      {/* Dropdown com árvore */}
      {isOpen && !disabled && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel da árvore */}
          <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="p-2">
              {rootItems.length > 0 ? (
                rootItems.map((rootItem) => (
                  <div key={rootItem.id}>
                    {renderItem(rootItem.id, 0)}
                  </div>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-slate-500 text-sm">
                  Nenhum SERVIÇO disponível
                </div>
              )}
            </div>
            
            {/* Mensagem de ajuda */}
            <div className="border-t border-slate-700 p-2 bg-slate-800">
              <p className="text-xs text-slate-500">
                <strong>Importante:</strong> Selecione apenas um SERVIÇO (nível 3 - nível mais granular). 
                Não é possível selecionar ETAPAS (nível 1) ou SUBETAPAS (nível 2) diretamente.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
