'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, ArrowLeft, AlertCircle, Layers, Save, GripVertical, RefreshCw, CheckCircle, CheckCircle2, XCircle, Settings, Filter, X } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import type { ItemVisaoGerencial } from '@/app/actions/orcamento';
import {
  calcularPorcentagemCategorizado,
  calcularPorcentagemOrcado,
  buscarVisaoGerencial,
  salvarVisaoGerencial,
} from '@/app/actions/orcamento';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- TIPAGENS ---

interface VisaoGerencialContentProps {
  params: { construtoraId: string; obraId: string };
  obra: {
    id: string;
    codigo: string;
    nome: string;
    construtora: {
      razaoSocial: string;
    };
  };
  versaoContratualAtiva: {
    id: string;
    nome: string;
    numero: number;
    createdAt: Date;
  } | null;
  versaoAtivaCustos: {
    id: string;
    nome: string;
    numero: number;
    createdAt: Date;
  } | null;
  versaoAtivaCategorizacao: {
    id: string;
    nome: string;
    numero: number;
    createdAt: Date;
  } | null;
  visaoGerencialSalva: {
    id: string;
    versaoCustoOrcadoId: string;
    versaoCategorizacaoId: string;
    versaoNome: string;
    versaoNumero: number;
    versaoUpdatedAt: string;
    configuracaoNiveis: {
      campoNivel0: string;
      campoNivel1?: string;
      campoNivel2?: string;
    };
    itens: ItemVisaoGerencial[];
  } | null;
  erroVisaoGerencialSalva: string | null;
  porcentagemCategorizado: number;
  porcentagemOrcado: number;
}

type EstadoFluxo = 'inicial' | 'validando' | 'configurando' | 'visualizando' | 'salvando' | 'salvo';

type ConfiguracaoNiveis = {
  campoNivel0: 'etapa' | 'subEtapa' | 'servicoSimplificado';
  campoNivel1?: 'etapa' | 'subEtapa' | 'servicoSimplificado';
  campoNivel2?: 'etapa' | 'subEtapa' | 'servicoSimplificado';
};

// Componente Sortable para linhas da hierarquia
function SortableHierarchyRow({ 
  id, 
  item, 
  isEditMode, 
  expandedRows, 
  toggleRow,
  temFilhos,
  estaExpandido,
  getColorByLevel,
  getCorPorMargem,
}: { 
  id: string;
  item: ItemVisaoGerencial;
  isEditMode: boolean;
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
  temFilhos: boolean;
  estaExpandido: boolean;
  getColorByLevel: (nivel: number, tipo: string) => string;
  getCorPorMargem: (margem: number) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: !isEditMode || item.nivel === 3, // Não permitir arrastar nível 3 (referências)
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-slate-800 ${item.tipo === 'AGRUPADOR' ? 'bg-slate-850' : ''} ${
        item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
      } ${item.nivel === 3 ? 'text-slate-500' : ''}`}
    >
      {isEditMode && item.nivel !== 3 && (
        <td className="w-8 py-1 px-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 cursor-grab active:cursor-grabbing"
            title="Arrastar para reposicionar"
          >
            <GripVertical className="w-3 h-3" />
          </button>
        </td>
      )}
      {isEditMode && item.nivel === 3 && (
        <td className="w-8 py-1 px-1"></td>
      )}
      <td className={`py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        {/* Mostrar seta apenas para níveis 0 e 1 (não para nível 2) */}
        {temFilhos && item.nivel !== 2 ? (
          <button
            onClick={() => toggleRow(item.id)}
            className="p-0.5 hover:bg-slate-700 rounded"
          >
            {estaExpandido ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-4"></div>
        )}
      </td>
      <td className={`py-1 px-2 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''} ${item.nivel === 3 ? 'text-slate-500' : ''}`}>
        <span
          className={`font-mono text-xs ${getColorByLevel(item.nivel, item.tipo)}`}
          style={{ paddingLeft: `${item.nivel * 12}px` }}
        >
          {item.codigo}
        </span>
      </td>
      <td className={`py-1 px-2 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''} ${item.nivel === 3 ? 'text-slate-500' : ''}`}>
        <div className="flex items-center gap-1">
          {/* Seta para nível 2 (Serviço Simplificado) dentro da célula da discriminação */}
          {temFilhos && item.nivel === 2 && (
            <button
              onClick={() => toggleRow(item.id)}
              className="p-0.5 hover:bg-slate-700 rounded flex-shrink-0"
            >
              {estaExpandido ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}
          <span className={`text-xs ${
            item.nivel === 0 ? 'font-bold text-white' :
            item.nivel === 1 ? 'font-semibold text-white' :
            item.nivel === 2 ? 'font-normal text-slate-300' :
            'font-normal text-slate-500'
          }`}>
            {item.discriminacao}
          </span>
        </div>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
          {formatCurrency(item.custoMat)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
          {formatCurrency(item.custoMO)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
          {formatCurrency(item.custoContratos)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
          {formatCurrency(item.custoEqFr)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
          {formatCurrency(item.custoTotal)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
        <span className={
          item.nivel === 3 ? 'text-slate-500 font-normal' :
          item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-semibold text-white' : 
          'text-slate-300 font-normal'
        }>
          {formatCurrency(item.precoTotalVenda)}
        </span>
      </td>
      <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : 'font-normal'}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : getCorPorMargem(item.margem)}>
          {formatCurrency(item.lucroProjetado)}
        </span>
      </td>
      <td className={`number-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : 'font-normal'}`}>
        <span className={item.nivel === 3 ? 'text-slate-500' : getCorPorMargem(item.margem)}>
          {formatPercent(item.margem)}
        </span>
      </td>
    </tr>
  );
}

export default function VisaoGerencialContent({
  params,
  obra,
  versaoContratualAtiva,
  versaoAtivaCustos,
  versaoAtivaCategorizacao,
  visaoGerencialSalva,
  erroVisaoGerencialSalva,
  porcentagemCategorizado: porcentagemCategorizadoInicial,
  porcentagemOrcado: porcentagemOrcadoInicial,
}: VisaoGerencialContentProps) {
  const router = useRouter();
  
  // Estados do fluxo
  const [estadoFluxo, setEstadoFluxo] = useState<EstadoFluxo>(
    visaoGerencialSalva ? 'salvo' : 'inicial'
  );
  const [porcentagemCategorizado, setPorcentagemCategorizado] = useState(porcentagemCategorizadoInicial);
  const [porcentagemOrcado, setPorcentagemOrcado] = useState(porcentagemOrcadoInicial);
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(erroVisaoGerencialSalva);
  
  // Estados da configuração de níveis
  const [configuracaoNiveis, setConfiguracaoNiveis] = useState<ConfiguracaoNiveis>(
    visaoGerencialSalva ? {
      campoNivel0: visaoGerencialSalva.configuracaoNiveis.campoNivel0 as any,
      campoNivel1: visaoGerencialSalva.configuracaoNiveis.campoNivel1 as any,
      campoNivel2: visaoGerencialSalva.configuracaoNiveis.campoNivel2 as any,
    } : {
      campoNivel0: 'etapa',
      campoNivel1: 'subEtapa',
      campoNivel2: 'servicoSimplificado',
    }
  );

  // Estados da visualização
  const [itensVisaoGerencial, setItensVisaoGerencial] = useState<ItemVisaoGerencial[]>(
    visaoGerencialSalva?.itens || []
  );
  const [modoReorganizar, setModoReorganizar] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Estados dos filtros (padrão com ícones)
  const [filtros, setFiltros] = useState<Map<string, Set<string>>>(new Map());
  const [filtroAberto, setFiltroAberto] = useState<string | null>(null);
  const [elementoFiltro, setElementoFiltro] = useState<HTMLElement | null>(null);

  // Sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler para atualizar da categorização
  const handleAtualizarCategorizacao = async () => {
    if (porcentagemCategorizado < 100) {
      setMensagemErro('A categorização deve estar 100% completa para gerar a Visão Gerencial.');
      return;
    }

    setEstadoFluxo('configurando');
    setMensagemErro(null);
  };

  // Handler para gerar visualização
  const handleGerarVisualizacao = async () => {
    setCarregando(true);
    setMensagemErro(null);

    try {
      const resultado = await buscarVisaoGerencial(params.obraId);

      if (!resultado.success || !resultado.visaoGerencial) {
        setMensagemErro(resultado.error || 'Erro ao gerar visualização');
        setCarregando(false);
        return;
      }

      // Aplicar a configuração de níveis aos itens
      const itensProcessados = resultado.visaoGerencial.itens || [];
      setItensVisaoGerencial(itensProcessados);

      // Expandir todos os níveis 0 por padrão
      const etapas = itensProcessados.filter((item: ItemVisaoGerencial) => item.nivel === 0);
      setExpandedRows(new Set(etapas.map((e: ItemVisaoGerencial) => e.id)));

      setEstadoFluxo('visualizando');
    } catch (error: any) {
      setMensagemErro(error.message || 'Erro ao gerar visualização');
    } finally {
      setCarregando(false);
    }
  };

  // Função para recalcular códigos hierárquicos
  const recalcularCodigosHierarquicos = (itens: ItemVisaoGerencial[]): ItemVisaoGerencial[] => {
    const itensAtualizados = [...itens];
    
    const calcularCodigo = (item: ItemVisaoGerencial, parent?: ItemVisaoGerencial): string => {
      if (!parent) {
        const etapasOrdenadas = itensAtualizados
          .filter((h) => h.nivel === 0)
          .sort((a, b) => a.ordem - b.ordem);
        const index = etapasOrdenadas.findIndex((h) => h.id === item.id);
        return `${index + 1}.0`;
      } else {
        const parentCodigo = parent.codigo;
        const filhos = itensAtualizados
          .filter((i) => i.parentId === parent.id)
          .sort((a, b) => a.ordem - b.ordem);
        const index = filhos.findIndex((h) => h.id === item.id);
        
        if (item.nivel === 1) {
          const numeroEtapa = parentCodigo.split('.')[0];
          return `${numeroEtapa}.${index + 1}`;
        }
        if (item.nivel === 2) {
          const [numeroEtapa, numeroSubetapa] = parent.codigo.split('.');
          return `${numeroEtapa}.${numeroSubetapa}.${index + 1}`;
        }
        return parentCodigo;
      }
    };

    [0, 1, 2].forEach(nivel => {
      itensAtualizados
        .filter(item => item.nivel === nivel)
        .forEach(item => {
          const parent = item.parentId 
            ? itensAtualizados.find(i => i.id === item.parentId)
            : undefined;
          item.codigo = calcularCodigo(item, parent);
        });
    });

    return itensAtualizados;
  };

  // Handler para drag-and-drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const itemAtivo = itensVisaoGerencial.find((h) => h.id === active.id);
    const itemOver = itensVisaoGerencial.find((h) => h.id === over.id);

    if (!itemAtivo || !itemOver) return;

    // Verificar se são do mesmo nível e mesmo pai (ou ambos nível 0 sem pai)
    if (itemAtivo.nivel !== itemOver.nivel) return;
    if (itemAtivo.parentId !== itemOver.parentId) return;

    // Buscar todos os irmãos (mesmo parentId ou ambos null para nível 0)
    const irmãos = itensVisaoGerencial
      .filter((h) => h.parentId === itemAtivo.parentId && h.nivel === itemAtivo.nivel)
      .sort((a, b) => a.ordem - b.ordem);

    const oldIndex = irmãos.findIndex(i => i.id === active.id);
    const newIndex = irmãos.findIndex(i => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const novaOrdemIrmãos = arrayMove(irmãos, oldIndex, newIndex);

    // Atualizar ordem de todos os irmãos
    const itensAtualizados = itensVisaoGerencial.map((item) => {
      const indexNaNovaOrdem = novaOrdemIrmãos.findIndex(f => f.id === item.id);
      if (indexNaNovaOrdem !== -1) {
        return { ...item, ordem: indexNaNovaOrdem };
      }
      return item;
    });

    const itensComCodigosAtualizados = recalcularCodigosHierarquicos(itensAtualizados);
    setItensVisaoGerencial(itensComCodigosAtualizados);
  };

  // Handler para salvar no banco
  const handleSalvarNoBanco = async () => {
    setCarregando(true);
    setMensagemErro(null);

    try {
      const resultado = await salvarVisaoGerencial(
        params.obraId,
        itensVisaoGerencial,
        configuracaoNiveis
      );

      if (!resultado.success) {
        setMensagemErro(resultado.error || 'Erro ao salvar no banco');
        setCarregando(false);
        return;
      }

      // Sucesso - recarregar a página para mostrar os dados atualizados do banco
      router.refresh();
      setTimeout(() => {
        window.location.reload();
      }, 50);
    } catch (error: any) {
      setMensagemErro(error.message || 'Erro ao salvar');
      setCarregando(false);
    }
  };

  // Função para alternar expansão de linha
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Funções de filtro (padrão com ícones)
  const obterValoresUnicos = (campo: string): string[] => {
    const valores = new Set<string>();
    itensVisaoGerencial.forEach((item) => {
      let valor = '';
      switch (campo) {
        case 'codigo':
          valor = item.codigo;
          break;
        case 'discriminacao':
          valor = item.discriminacao;
          break;
        case 'nivel':
          if (item.nivel === 0) valor = 'Etapa';
          else if (item.nivel === 1) valor = 'SubEtapa';
          else if (item.nivel === 2) valor = 'Serviço Simplificado';
          else if (item.nivel === 3) valor = 'Serviço Original';
          break;
        default:
          break;
      }
      if (valor) valores.add(valor);
    });
    return Array.from(valores).sort();
  };

  const toggleFiltro = (campo: string, valor: string) => {
    setFiltros((prev) => {
      const novo = new Map(prev);
      if (!novo.has(campo)) {
        novo.set(campo, new Set());
      }
      const valores = new Set(novo.get(campo)!);
      if (valores.has(valor)) {
        valores.delete(valor);
      } else {
        valores.add(valor);
      }
      if (valores.size === 0) {
        novo.delete(campo);
      } else {
        novo.set(campo, valores);
      }
      return novo;
    });
  };

  const limparFiltro = (campo: string) => {
    setFiltros((prev) => {
      const novo = new Map(prev);
      novo.delete(campo);
      return novo;
    });
  };

  const abrirFiltro = (campo: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (filtroAberto === campo) {
      setFiltroAberto(null);
      setElementoFiltro(null);
      return;
    }
    const button = event.currentTarget;
    const th = button.closest('th') as HTMLElement;
    if (th) {
      setElementoFiltro(th);
      setFiltroAberto(campo);
    }
  };

  // Fechar filtro ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (filtroAberto && !target.closest('.filtro-modal') && !target.closest('button[title*="Filtrar"]')) {
        setFiltroAberto(null);
        setElementoFiltro(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && filtroAberto) {
        setFiltroAberto(null);
        setElementoFiltro(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [filtroAberto]);

  // Função para verificar se um item corresponde aos filtros
  const itemCorrespondeFiltros = (item: ItemVisaoGerencial): boolean => {
    if (filtros.size === 0) return true;

    // Verificar filtro de código
    if (filtros.has('codigo')) {
      const valoresFiltro = filtros.get('codigo')!;
      if (!valoresFiltro.has(item.codigo)) {
        // Verificar se algum filho corresponde
        const filhos = itensVisaoGerencial.filter(i => i.parentId === item.id);
        if (!filhos.some(filho => itemCorrespondeFiltros(filho))) {
          return false;
        }
      }
    }

    // Verificar filtro de discriminação
    if (filtros.has('discriminacao')) {
      const valoresFiltro = filtros.get('discriminacao')!;
      if (!valoresFiltro.has(item.discriminacao)) {
        const filhos = itensVisaoGerencial.filter(i => i.parentId === item.id);
        if (!filhos.some(filho => itemCorrespondeFiltros(filho))) {
          return false;
        }
      }
    }

    // Verificar filtro de nível
    if (filtros.has('nivel')) {
      const valoresFiltro = filtros.get('nivel')!;
      let nivelString = '';
      if (item.nivel === 0) nivelString = 'Etapa';
      else if (item.nivel === 1) nivelString = 'SubEtapa';
      else if (item.nivel === 2) nivelString = 'Serviço Simplificado';
      else if (item.nivel === 3) nivelString = 'Serviço Original';

      if (!valoresFiltro.has(nivelString)) {
        const filhos = itensVisaoGerencial.filter(i => i.parentId === item.id);
        if (!filhos.some(filho => itemCorrespondeFiltros(filho))) {
          return false;
        }
      }
    }

    return true;
  };

  // Função para obter itens visíveis com filtros aplicados
  const getVisibleItems = useMemo(() => {
    if (!itensVisaoGerencial) return [];

    const visible: ItemVisaoGerencial[] = [];
    
    const processItem = (item: ItemVisaoGerencial) => {
      if (!itemCorrespondeFiltros(item)) return;
      
      visible.push(item);
      
      if (expandedRows.has(item.id) && item.tipo === 'AGRUPADOR') {
        const filhos = itensVisaoGerencial
          .filter(i => i.parentId === item.id)
          .sort((a, b) => a.ordem - b.ordem);
        
        filhos.forEach(filho => processItem(filho));
      }
    };
    
    const raizes = itensVisaoGerencial
      .filter(item => item.nivel === 0)
      .sort((a, b) => a.ordem - b.ordem);
    
    raizes.forEach(raiz => processItem(raiz));
    
    return visible;
  }, [itensVisaoGerencial, expandedRows, filtros]);

  // Calcular totais
  const totais = useMemo(() => {
    if (!itensVisaoGerencial || itensVisaoGerencial.length === 0) {
      return {
        custoMat: 0,
        custoMO: 0,
        custoContratos: 0,
        custoEqFr: 0,
        custoTotal: 0,
        precoTotalVenda: 0,
        lucroProjetado: 0,
        margem: 0,
      };
    }

    const etapas = itensVisaoGerencial.filter(item => item.nivel === 0);
    
    const totais = etapas.reduce((acc, item) => ({
      custoMat: acc.custoMat + item.custoMat,
      custoMO: acc.custoMO + item.custoMO,
      custoContratos: acc.custoContratos + item.custoContratos,
      custoEqFr: acc.custoEqFr + item.custoEqFr,
      custoTotal: acc.custoTotal + item.custoTotal,
      precoTotalVenda: acc.precoTotalVenda + item.precoTotalVenda,
      lucroProjetado: acc.lucroProjetado + item.lucroProjetado,
      margem: 0,
    }), {
      custoMat: 0,
      custoMO: 0,
      custoContratos: 0,
      custoEqFr: 0,
      custoTotal: 0,
      precoTotalVenda: 0,
      lucroProjetado: 0,
      margem: 0,
    });

    totais.margem = totais.precoTotalVenda > 0 
      ? (totais.lucroProjetado / totais.precoTotalVenda) * 100 
      : 0;

    return totais;
  }, [itensVisaoGerencial]);

  // Funções auxiliares
  const getCorPorMargem = (margem: number): string => {
    if (margem > 35) return 'text-green-500';
    if (margem >= 25) return 'text-amber-500';
    return 'text-red-500';
  };

  const getColorByLevel = (nivel: number, tipo: string) => {
    if (tipo === 'AGRUPADOR') {
      if (nivel === 0) return 'text-blue-400 font-bold';
      if (nivel === 1) return 'text-blue-400 font-semibold';
      if (nivel === 2) return 'text-slate-300'; // Serviço simplificado - texto normal
    }
    // Nível 3 = serviços originais da planilha contratual (cinza mais fraco)
    if (nivel === 3) return 'text-slate-500';
    return 'text-slate-300';
  };

  // Funções para controle de níveis
  const getNiveisDisponiveis = (): number[] => {
    const niveis = new Set<number>();
    itensVisaoGerencial.forEach((item) => {
      if (item.tipo === 'AGRUPADOR') {
        niveis.add(item.nivel);
      }
    });
    const niveisArray = Array.from(niveis).sort((a, b) => a - b);
    console.log('Níveis disponíveis:', niveisArray);
    return niveisArray;
  };

  const toggleNivel = (nivel: number) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      
      if (nivel === 0) {
        const itensDoNivel0 = itensVisaoGerencial.filter((i) => i.nivel === 0 && i.tipo === 'AGRUPADOR');
        const todosExpandidos = itensDoNivel0.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel0.forEach((item) => {
            newExpanded.delete(item.id);
          });
          itensVisaoGerencial.forEach((item) => {
            if (item.nivel > 0 && item.tipo === 'AGRUPADOR') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          itensDoNivel0.forEach((item) => {
            newExpanded.add(item.id);
          });
        }
      } else {
        // Expandir níveis anteriores primeiro
        for (let n = 0; n < nivel; n++) {
          const itensDoNivelAnterior = itensVisaoGerencial.filter(
            (i) => i.nivel === n && i.tipo === 'AGRUPADOR'
          );
          itensDoNivelAnterior.forEach((item) => {
            newExpanded.add(item.id);
          });
        }

        const itensDoNivel = itensVisaoGerencial.filter(
          (i) => i.nivel === nivel && i.tipo === 'AGRUPADOR'
        );
        const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel.forEach((item) => {
            newExpanded.delete(item.id);
          });
          itensVisaoGerencial.forEach((item) => {
            if (item.nivel > nivel && item.tipo === 'AGRUPADOR') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          itensDoNivel.forEach((item) => {
            newExpanded.add(item.id);
          });
        }
      }

      return newExpanded;
    });
  };

  // IDs dos itens ordenáveis (todos exceto nível 3 que são apenas referências)
  const itensOrdenaveis = useMemo(() => 
    getVisibleItems
      .filter((item) => modoReorganizar && item.nivel !== 3)
      .map((item) => item.id),
    [getVisibleItems, modoReorganizar]
  );

  return (
    <div className="p-8 relative">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Visão Gerencial - {obra.codigo}</h1>
            <p className="text-slate-400">O Orçamento Consolidado - Painel de Controle Financeiro da Engenharia</p>
            <p className="text-slate-500 text-sm mt-1">{obra.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {estadoFluxo === 'inicial' && (
            <button
              onClick={handleAtualizarCategorizacao}
              disabled={carregando}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar da Categorização
            </button>
          )}
          {estadoFluxo === 'visualizando' && (
            <>
              <button
                onClick={() => setModoReorganizar(!modoReorganizar)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <GripVertical className="w-5 h-5" />
                {modoReorganizar ? 'Cancelar Reorganização' : 'Reorganizar EAP'}
              </button>
              <button
                onClick={handleSalvarNoBanco}
                disabled={carregando}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando no banco de dados...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Visão Gerencial
                  </>
                )}
              </button>
            </>
          )}
          {estadoFluxo === 'salvo' && (
            <button
              onClick={() => setEstadoFluxo('inicial')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Nova Visualização
            </button>
          )}
        </div>
      </div>

      {/* Mensagem de Erro */}
      {mensagemErro && (
        <div className="mb-4 bg-red-950 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-1">Erro</h3>
            <p className="text-red-200">{mensagemErro}</p>
          </div>
        </div>
      )}

      {/* Mensagem de Sucesso - Visão Gerencial Salva */}
      {estadoFluxo === 'salvo' && (
        <div className="mb-4 bg-green-950 border border-green-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-1">Visão Gerencial Salva com Sucesso!</h3>
            <p className="text-green-200">A Visão Gerencial foi salva no banco de dados e está pronta para uso nos módulos financeiros.</p>
          </div>
        </div>
      )}

      {/* Cards de Validação */}
      {estadoFluxo === 'inicial' && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card % Categorizado */}
          <div className={`border rounded-lg p-4 ${
            porcentagemCategorizado === 100 
              ? 'bg-green-950 border-green-800' 
              : 'bg-amber-950 border-amber-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {porcentagemCategorizado === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400" />
                )}
                % Categorizado
              </h3>
            </div>
            <p className={`text-3xl font-bold ${
              porcentagemCategorizado === 100 ? 'text-green-400' : 'text-amber-400'
            }`}>
              {porcentagemCategorizado.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {porcentagemCategorizado === 100 
                ? 'Categorização completa! Pronto para gerar a EAP.' 
                : 'Complete a categorização para gerar a EAP Gerencial.'}
            </p>
          </div>

          {/* Card % Orçado */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">% Orçado (Referência)</h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {porcentagemOrcado.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Porcentagem de itens com custos preenchidos na planilha de Custos Orçados.
            </p>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Níveis */}
      {estadoFluxo === 'configurando' && (
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configurar Hierarquia da EAP Gerencial</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Escolha quais campos da categorização serão usados para cada nível hierárquico da EAP.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Nível 0 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nível 0 (Raiz)
              </label>
              <select
                value={configuracaoNiveis.campoNivel0}
                onChange={(e) => setConfiguracaoNiveis({
                  ...configuracaoNiveis,
                  campoNivel0: e.target.value as any,
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="etapa">Etapa</option>
                <option value="subEtapa">SubEtapa</option>
                <option value="servicoSimplificado">Serviço Simplificado</option>
              </select>
            </div>

            {/* Nível 1 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nível 1
              </label>
              <select
                value={configuracaoNiveis.campoNivel1 || ''}
                onChange={(e) => setConfiguracaoNiveis({
                  ...configuracaoNiveis,
                  campoNivel1: e.target.value ? e.target.value as any : undefined,
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum</option>
                <option value="etapa">Etapa</option>
                <option value="subEtapa">SubEtapa</option>
                <option value="servicoSimplificado">Serviço Simplificado</option>
              </select>
            </div>

            {/* Nível 2 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nível 2
              </label>
              <select
                value={configuracaoNiveis.campoNivel2 || ''}
                onChange={(e) => setConfiguracaoNiveis({
                  ...configuracaoNiveis,
                  campoNivel2: e.target.value ? e.target.value as any : undefined,
                })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum</option>
                <option value="etapa">Etapa</option>
                <option value="subEtapa">SubEtapa</option>
                <option value="servicoSimplificado">Serviço Simplificado</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGerarVisualizacao}
              disabled={carregando}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Gerar Visualização
                </>
              )}
            </button>
            <button
              onClick={() => setEstadoFluxo('inicial')}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Visualização da EAP */}
      {(estadoFluxo === 'visualizando' || estadoFluxo === 'salvo') && itensVisaoGerencial.length > 0 && (
        <>
          {/* KPIs */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Total de Etapas</p>
              <p className="text-xl font-bold text-purple-400 font-mono">
                {itensVisaoGerencial.filter(i => i.nivel === 0).length}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Total de SubEtapas</p>
              <p className="text-xl font-bold text-blue-400 font-mono">
                {itensVisaoGerencial.filter(i => i.nivel === 1).length}
              </p>
            </div>
            <div className="bg-slate-900 border border-green-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Valor Global do Contrato</p>
              <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(totais.precoTotalVenda)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Custo Total Proj.</p>
              <p className="text-lg font-bold text-white font-mono">{formatCurrency(totais.custoTotal)}</p>
            </div>
            <div className="bg-slate-900 border border-purple-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">% Margem Projetada</p>
              <p className={`text-lg font-bold font-mono ${
                totais.margem > 15 ? 'text-green-400' : 
                totais.margem > 5 ? 'text-amber-400' : 
                'text-red-400'
              }`}>
                {formatPercent(totais.margem)}
              </p>
            </div>
            <div className="bg-slate-900 border border-green-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">R$ Lucro Bruto Projetado</p>
              <p className={`text-lg font-bold font-mono ${
                totais.lucroProjetado > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(totais.lucroProjetado)}
              </p>
            </div>
          </div>

          {/* Controles de Níveis */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Níveis:
            </span>
            {getNiveisDisponiveis().map((nivel) => {
              const itensDoNivel = itensVisaoGerencial.filter((i) => i.nivel === nivel && i.tipo === 'AGRUPADOR');
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

          {/* Tabela */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itensOrdenaveis} strategy={verticalListSortingStrategy}>
              <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <div className="max-h-[calc(100vh-400px)] overflow-auto">
                  <table className="table-engineering w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-900 shadow-lg">
                        {modoReorganizar && <th className="w-8 bg-slate-900 border-b-2 border-r border-slate-700 py-4"></th>}
                        <th className="w-12 bg-slate-900 border-b-2 border-r border-slate-700 py-4"></th>
                        
                        {/* Código com filtro */}
                        <th className={`w-28 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'codigo' ? 'relative' : ''}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs">Código</span>
                            <button
                              onClick={(e) => abrirFiltro('codigo', e)}
                              className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                                filtroAberto === 'codigo' || filtros.has('codigo') ? 'text-blue-400' : 'text-slate-500'
                              }`}
                              title="Filtrar Código"
                            >
                              <Filter className="w-3 h-3" />
                            </button>
                          </div>
                          {filtroAberto === 'codigo' && elementoFiltro && (
                            <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white">Filtrar por Código</h3>
                                <button
                                  onClick={() => {
                                    setFiltroAberto(null);
                                    setElementoFiltro(null);
                                  }}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="mb-3">
                                <button
                                  onClick={() => limparFiltro('codigo')}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Limpar filtro
                                </button>
                              </div>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {obterValoresUnicos('codigo').map((valor) => {
                                  const valoresSelecionados = filtros.get('codigo') || new Set();
                                  const estaSelecionado = valoresSelecionados.has(valor);
                                  return (
                                    <label
                                      key={valor}
                                      className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={estaSelecionado}
                                        onChange={() => toggleFiltro('codigo', valor)}
                                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-slate-300 flex-1 truncate font-mono" title={valor}>
                                        {valor || '(vazio)'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              {filtros.has('codigo') && (filtros.get('codigo')?.size || 0) > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                  <p className="text-xs text-slate-400">
                                    {filtros.get('codigo')?.size} código(s) selecionado(s)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                        
                        {/* Discriminação com filtro */}
                        <th className={`min-w-[300px] bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'discriminacao' ? 'relative' : ''}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs">Estrutura Gerencial</span>
                            <button
                              onClick={(e) => abrirFiltro('discriminacao', e)}
                              className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                                filtroAberto === 'discriminacao' || filtros.has('discriminacao') ? 'text-blue-400' : 'text-slate-500'
                              }`}
                              title="Filtrar Descrição"
                            >
                              <Filter className="w-3 h-3" />
                            </button>
                          </div>
                          {filtroAberto === 'discriminacao' && elementoFiltro && (
                            <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white">Filtrar por Descrição</h3>
                                <button
                                  onClick={() => {
                                    setFiltroAberto(null);
                                    setElementoFiltro(null);
                                  }}
                                  className="text-slate-400 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="mb-3">
                                <button
                                  onClick={() => limparFiltro('discriminacao')}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Limpar filtro
                                </button>
                              </div>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {obterValoresUnicos('discriminacao').map((valor) => {
                                  const valoresSelecionados = filtros.get('discriminacao') || new Set();
                                  const estaSelecionado = valoresSelecionados.has(valor);
                                  return (
                                    <label
                                      key={valor}
                                      className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={estaSelecionado}
                                        onChange={() => toggleFiltro('discriminacao', valor)}
                                        className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                        {valor || '(vazio)'}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                              {filtros.has('discriminacao') && (filtros.get('discriminacao')?.size || 0) > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                  <p className="text-xs text-slate-400">
                                    {filtros.get('discriminacao')?.size} item(ns) selecionado(s)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                        
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo MAT (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo M.O. (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo Contratos (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo Eq/Fr (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo TOTAL (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Valor de Venda (R$)</th>
                        <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Lucro Projetado (R$)</th>
                        <th className="number-cell w-24 bg-slate-900 border-b-2 border-slate-700 text-xs py-4 px-1">Margem (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleItems.length === 0 ? (
                        <tr>
                          <td colSpan={modoReorganizar ? 13 : 12} className="text-center py-8 text-slate-400">
                            Nenhum item encontrado.
                          </td>
                        </tr>
                      ) : (
                        getVisibleItems.map((item) => {
                          const filhos = itensVisaoGerencial.filter(i => i.parentId === item.id);
                          const temFilhos = filhos.length > 0;
                          
                          // Log para debug
                          if (item.nivel === 0) {
                            console.log(`Item nível 0: "${item.discriminacao}" (id: ${item.id})`, {
                              temFilhos,
                              totalFilhos: filhos.length,
                              filhosIds: filhos.map(f => ({ id: f.id, parentId: f.parentId, nivel: f.nivel }))
                            });
                          }
                          
                          const estaExpandido = expandedRows.has(item.id);
                          const podeArrastar = modoReorganizar && item.nivel !== 3 && itensOrdenaveis.includes(item.id);

                          if (podeArrastar) {
                            return (
                              <SortableHierarchyRow
                                key={item.id}
                                id={item.id}
                                item={item}
                                isEditMode={modoReorganizar}
                                expandedRows={expandedRows}
                                toggleRow={toggleRow}
                                temFilhos={temFilhos}
                                estaExpandido={estaExpandido}
                                getColorByLevel={getColorByLevel}
                                getCorPorMargem={getCorPorMargem}
                              />
                            );
                          }

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-800 ${item.tipo === 'AGRUPADOR' ? 'bg-slate-850' : ''} ${
                                item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
                              } ${item.nivel === 3 ? 'text-slate-500' : ''}`}
                            >
                              {modoReorganizar && <td className="w-8 py-1 px-1"></td>}
                              <td className={`py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                {/* Mostrar seta apenas para níveis 0 e 1 (não para nível 2) */}
                                {temFilhos && item.nivel !== 2 ? (
                                  <button
                                    onClick={() => toggleRow(item.id)}
                                    className="p-0.5 hover:bg-slate-700 rounded"
                                  >
                                    {estaExpandido ? (
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-4"></div>
                                )}
                              </td>
                              <td className={`py-1 px-2 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''} ${item.nivel === 3 ? 'text-slate-500' : ''}`}>
                                <span
                                  className={`font-mono text-xs ${getColorByLevel(item.nivel, item.tipo)}`}
                                  style={{ paddingLeft: `${item.nivel * 12}px` }}
                                >
                                  {item.codigo}
                                </span>
                              </td>
                              <td className={`py-1 px-2 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''} ${item.nivel === 3 ? 'text-slate-500' : ''}`}>
                                <div className="flex items-center gap-1">
                                  {/* Seta para nível 2 (Serviço Simplificado) dentro da célula da discriminação */}
                                  {temFilhos && item.nivel === 2 && (
                                    <button
                                      onClick={() => toggleRow(item.id)}
                                      className="p-0.5 hover:bg-slate-700 rounded flex-shrink-0"
                                    >
                                      {estaExpandido ? (
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-slate-400" />
                                      )}
                                    </button>
                                  )}
                                  <span className={`text-xs ${
                                    item.nivel === 0 ? 'font-bold text-white' :
                                    item.nivel === 1 ? 'font-semibold text-white' :
                                    item.nivel === 2 ? 'font-normal text-slate-300' :
                                    'font-normal text-slate-500'
                                  }`}>
                                    {item.discriminacao}
                                  </span>
                                </div>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
                                  {formatCurrency(item.custoMat)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
                                  {formatCurrency(item.custoMO)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
                                  {formatCurrency(item.custoContratos)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
                                  {formatCurrency(item.custoEqFr)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : 'text-amber-500'}>
                                  {formatCurrency(item.custoTotal)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : ''}`}>
                                <span className={
                                  item.nivel === 3 ? 'text-slate-500 font-normal' :
                                  item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-semibold text-white' : 
                                  'text-slate-300 font-normal'
                                }>
                                  {formatCurrency(item.precoTotalVenda)}
                                </span>
                              </td>
                              <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : 'font-normal'}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : getCorPorMargem(item.margem)}>
                                  {formatCurrency(item.lucroProjetado)}
                                </span>
                              </td>
                              <td className={`number-cell text-xs py-1 px-1 ${item.tipo === 'AGRUPADOR' && item.nivel !== 2 ? 'font-bold' : 'font-normal'}`}>
                                <span className={item.nivel === 3 ? 'text-slate-500' : getCorPorMargem(item.margem)}>
                                  {formatPercent(item.margem)}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Footer com totais */}
                <div className="bg-slate-800 border-t-2 border-slate-700">
                  <table className="table-engineering w-full border-collapse text-xs">
                    <tbody>
                      <tr>
                        <td colSpan={modoReorganizar ? 4 : 3} className="py-1 px-1"></td>
                        <td className="w-28 currency-cell font-bold text-white py-1 px-1 text-xs whitespace-nowrap">
                          TOTAL GERAL:
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className="text-amber-500">
                            {formatCurrency(totais.custoMat)}
                          </span>
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className="text-amber-500">
                            {formatCurrency(totais.custoMO)}
                          </span>
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className="text-amber-500">
                            {formatCurrency(totais.custoContratos)}
                          </span>
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className="text-amber-500">
                            {formatCurrency(totais.custoEqFr)}
                          </span>
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className="text-amber-500">
                            {formatCurrency(totais.custoTotal)}
                          </span>
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs text-white py-1 px-1 whitespace-nowrap">
                          {formatCurrency(totais.precoTotalVenda)}
                        </td>
                        <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className={getCorPorMargem(totais.margem)}>
                            {formatCurrency(totais.lucroProjetado)}
                          </span>
                        </td>
                        <td className="w-24 number-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                          <span className={getCorPorMargem(totais.margem)}>
                            {formatPercent(totais.margem)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Informações */}
      {estadoFluxo === 'inicial' && (
        <div className="mt-4 bg-blue-950 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>ℹ️ Sobre a Visão Gerencial:</strong> Esta visão consolida os dados das planilhas de{' '}
            <strong>Custos Orçados</strong> e <strong>Categorização</strong>, agrupando os itens conforme a configuração hierárquica escolhida.
            Complete a categorização (100%) e clique em <strong>Atualizar da Categorização</strong> para começar.
          </p>
        </div>
      )}
    </div>
  );
}
