'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Upload, FileSpreadsheet, ChevronRight, ChevronDown, ArrowLeft, Edit2, Save, Plus, ArrowUp, ArrowDown, X, Trash2, History, Layers, GitBranch, CheckCircle, AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import { formatCurrency, formatQuantity, formatNumber } from '@/lib/utils/format';

// --- TIPAGENS ---

// Tipo que define exatamente o que vem do Banco de Dados (incluindo ordem)
type ItemVersao = {
  id: string;
  codigo: string;
  discriminacao: string;
  unidade: string | null;
  quantidade: number | null;
  precoUnitarioVenda: number | null;
  precoTotalVenda: number;
  nivel: number;
  tipo: 'AGRUPADOR' | 'ITEM';
  referencia: string | null;
  parentId: string | null;
  ordem: number | null; // Campo crucial para ordenação
};

// Tipo para os itens processados no Frontend (com filhos mapeados)
type PlanilhaItem = {
  id: string;
  item: string;
  referencia: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  nivel: number;
  tipo: 'agrupador' | 'item';
  filhos: string[];
  parentId?: string;
};

type VersaoPlanilha = {
  id: string;
  nome: string;
  tipo: 'BASELINE' | 'REVISAO';
  dataCriacao: string;
  dataAtualizacao: string;
  status: 'ATIVA' | 'OBSOLETA';
  numero: number;
};

interface PlanilhaContratualContentProps {
  params: { construtoraId: string; obraId: string };
  obra: {
    id: string;
    codigo: string;
    nome: string;
    construtora: {
      razaoSocial: string;
    };
  };
  versaoAtiva: {
    id: string;
    nome: string;
    tipo: 'BASELINE' | 'REVISAO';
    numero: number;
    itens: Array<ItemVersao>; // Usa o tipo correto com 'ordem'
  } | null;
  versoes: VersaoPlanilha[];
}

export default function PlanilhaContratualContent({
  params,
  obra,
  versaoAtiva,
  versoes: versoesIniciais,
}: PlanilhaContratualContentProps) {
  
  // Converter itens do banco para formato do componente
  const converterItensParaPlanilha = (itens: ItemVersao[] | null | undefined): PlanilhaItem[] => {
    if (!itens || itens.length === 0) {
      return [];
    }
    
    // Criar mapa de itens por ID
    const itensMap = new Map<string, PlanilhaItem>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

    // Primeiro, criar todos os itens
    itens.forEach((item, index) => {
      const planilhaItem: PlanilhaItem = {
        id: item.id,
        item: item.codigo,
        referencia: item.referencia || '',
        descricao: item.discriminacao,
        unidade: item.unidade || '',
        quantidade: item.quantidade !== null && item.quantidade !== undefined ? Number(item.quantidade) : 0,
        precoUnitario: item.precoUnitarioVenda !== null && item.precoUnitarioVenda !== undefined ? Number(item.precoUnitarioVenda) : 0,
        precoTotal: Number(item.precoTotalVenda),
        nivel: item.nivel,
        tipo: item.tipo === 'AGRUPADOR' ? 'agrupador' : 'item',
        filhos: [],
        parentId: item.parentId || undefined,
      };
      itensMap.set(item.id, planilhaItem);

      // Mapear filhos
      if (item.parentId) {
        if (!filhosMap.has(item.parentId)) {
          filhosMap.set(item.parentId, []);
        }
        filhosMap.get(item.parentId)!.push({
          id: item.id,
          // 'ordem' agora é reconhecido corretamente pelo TS
          ordem: item.ordem !== null && item.ordem !== undefined ? item.ordem : index,
        });
      }
    });

    // Atualizar filhos ordenados por ordem
    filhosMap.forEach((filhos, parentId) => {
      const parent = itensMap.get(parentId);
      if (parent) {
        // Ordenar filhos pela ordem
        filhos.sort((a, b) => a.ordem - b.ordem);
        parent.filhos = filhos.map(f => f.id);
      }
    });

    // Verificação adicional: se um item é agrupador mas não tem filhos mapeados,
    // procurar filhos baseados no parentId dos outros itens (fallback)
    itensMap.forEach((item) => {
      if (item.tipo === 'agrupador' && item.filhos.length === 0) {
        const filhosEncontrados: string[] = [];
        itensMap.forEach((outroItem) => {
          if (outroItem.parentId === item.id) {
            filhosEncontrados.push(outroItem.id);
          }
        });
        if (filhosEncontrados.length > 0) {
          // Ordenar pelos códigos para manter ordem se não tiver ordem numérica
          filhosEncontrados.sort((a, b) => {
            const itemA = itensMap.get(a);
            const itemB = itensMap.get(b);
            if (!itemA || !itemB) return 0;
            const partesA = itemA.item.split('.').map(Number);
            const partesB = itemB.item.split('.').map(Number);
            const maxLen = Math.max(partesA.length, partesB.length);
            for (let i = 0; i < maxLen; i++) {
              const valA = partesA[i] || 0;
              const valB = partesB[i] || 0;
              if (valA !== valB) return valA - valB;
            }
            return 0;
          });
          item.filhos = filhosEncontrados;
        }
      }
    });

    // Debug: Log de agrupadores e seus filhos
    itensMap.forEach((item) => {
      if (item.tipo === 'agrupador') {
        console.log('Agrupador', item.item, 'tem filhos:', item.filhos.length, item.filhos);
      }
    });

    return Array.from(itensMap.values());
  };

  const planilhaItensIniciais = versaoAtiva && versaoAtiva.itens ? converterItensParaPlanilha(versaoAtiva.itens) : [];
  
  // Inicializar com níveis recolhidos (Set vazio)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [modoEdicao, setModoEdicao] = useState(false);
  const [itemEditando, setItemEditando] = useState<string | null>(null);
  const [campoEditando, setCampoEditando] = useState<string | null>(null);
  const [valorEditando, setValorEditando] = useState<string>('');
  const [versoes, setVersoes] = useState<VersaoPlanilha[]>(versoesIniciais);
  const [versaoAtivaId, setVersaoAtivaId] = useState<string>(versaoAtiva?.id || '');
  const [mostrarModalNovaVersao, setMostrarModalNovaVersao] = useState(false);
  const [nomeNovaVersao, setNomeNovaVersao] = useState('');
  const [planilhaItens, setPlanilhaItens] = useState<PlanilhaItem[]>(planilhaItensIniciais);

  // Função para recalcular totais dos agrupadores
  const recalcularTotaisAgrupadores = (itens: PlanilhaItem[]): PlanilhaItem[] => {
    const itensOrdenados = [...itens].sort((a, b) => b.nivel - a.nivel);
    const itensMap = new Map(itens.map(item => [item.id, { ...item }]));
    
    for (const item of itensOrdenados) {
      if (item.tipo === 'agrupador') {
        let total = 0;
        item.filhos.forEach((filhoId) => {
          const filho = itensMap.get(filhoId);
          if (filho) {
            total += filho.precoTotal;
          }
        });
        
        const itemAtualizado = itensMap.get(item.id);
        if (itemAtualizado) {
          itemAtualizado.precoTotal = total;
          itensMap.set(item.id, itemAtualizado);
        }
      }
    }
    
    return Array.from(itensMap.values());
  };

  const planilhaItensComTotais = useMemo(() => {
    if (planilhaItens.length === 0) return [];
    return recalcularTotaisAgrupadores(planilhaItens);
  }, [planilhaItens]);

  const [versaoParaExcluir, setVersaoParaExcluir] = useState<string | null>(null);
  const [isExcluindo, setIsExcluindo] = useState(false);
  const [mostrarModalDiagnostico, setMostrarModalDiagnostico] = useState(false);
  const [dadosDiagnostico, setDadosDiagnostico] = useState<{
    totalItens: number;
    orfaos: number;
    agrupadoresVazios: number;
    parentIdsInvalidos: number;
    totalDuplicados: number;
    itensDuplicados?: Array<{ codigo: string; quantidade: number; ids: string[] }>;
    exemplosOrfaos?: Array<{ codigo: string; nivel: number; tipo: string }>;
  } | null>(null);
  const [carregandoDiagnostico, setCarregandoDiagnostico] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState<Map<string, Set<string>>>(new Map());
  const [filtroAberto, setFiltroAberto] = useState<string | null>(null);
  const [elementoFiltro, setElementoFiltro] = useState<HTMLElement | null>(null);

  // Atualizar quando versão ativa mudar
  useEffect(() => {
    if (versaoAtiva && versaoAtiva.itens && versaoAtiva.itens.length > 0) {
      const itensConvertidos = converterItensParaPlanilha(versaoAtiva.itens);
      setPlanilhaItens(itensConvertidos);
      setVersaoAtivaId(versaoAtiva.id);
      // CORREÇÃO: Set<string> explícito
      const newSet = new Set<string>();
      setExpandedRows(newSet);
      
    } else {
      setPlanilhaItens([]);
      setVersaoAtivaId('');
      // CORREÇÃO: Set<string> explícito
      const newSet = new Set<string>();
      setExpandedRows(newSet);
    }
  }, [versaoAtiva?.id]);


  // Fechar filtro ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroAberto) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filtro-modal') && !target.closest('button[title*="Filtrar"]')) {
          setFiltroAberto(null);
          setElementoFiltro(null);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && filtroAberto) {
        setFiltroAberto(null);
        setElementoFiltro(null);
      }
    };

    if (filtroAberto) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [filtroAberto]);

  const toggleRow = (itemId: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  };

  const toggleNivel = (nivel: number) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      
      if (nivel === 0) {
        const itensDoNivel0 = planilhaItensComTotais.filter((i) => i.nivel === 0 && i.tipo === 'agrupador');
        const todosExpandidos = itensDoNivel0.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          // Recolher nível 0 e todos os subníveis
          itensDoNivel0.forEach((item) => {
            newExpanded.delete(item.id);
          });
          // Recolher todos os níveis > 0
          planilhaItensComTotais.forEach((item) => {
            if (item.nivel > 0 && item.tipo === 'agrupador') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          // Expandir apenas nível 0
          itensDoNivel0.forEach((item) => {
            newExpanded.add(item.id);
          });
        }
      } else {
        // Para níveis > 0: primeiro expandir todos os níveis anteriores
        for (let n = 0; n < nivel; n++) {
          const itensDoNivelAnterior = planilhaItensComTotais.filter(
            (i) => i.nivel === n && i.tipo === 'agrupador'
          );
          itensDoNivelAnterior.forEach((item) => {
            newExpanded.add(item.id);
          });
        }

        // Depois, expandir/recolher o nível especificado
        const itensDoNivel = planilhaItensComTotais.filter(
          (i) => i.nivel === nivel && i.tipo === 'agrupador'
        );
        const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          // Recolher o nível
          itensDoNivel.forEach((item) => {
            newExpanded.delete(item.id);
          });
          // Recolher também todos os níveis posteriores
          planilhaItensComTotais.forEach((item) => {
            if (item.nivel > nivel && item.tipo === 'agrupador') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          // Expandir o nível
          itensDoNivel.forEach((item) => {
            newExpanded.add(item.id);
          });
        }
      }

      return newExpanded;
    });
  };

  const getNiveisDisponiveis = (): number[] => {
    const niveis = new Set<number>();
    planilhaItensComTotais.forEach((item) => {
      if (item.tipo === 'agrupador') {
        niveis.add(item.nivel);
      }
    });
    return Array.from(niveis).sort((a, b) => a - b);
  };

  // Função para verificar se um item corresponde aos filtros
  const itemCorrespondeFiltros = (item: PlanilhaItem): boolean => {
    if (filtros.size === 0) return true;
    
    // Verificar filtro de Item (código)
    if (filtros.has('item')) {
      const valoresFiltro = filtros.get('item')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.item)) {
        return false;
      }
    }
    
    // Verificar filtro de Referência
    if (filtros.has('referencia')) {
      const valoresFiltro = filtros.get('referencia')!;
      if (valoresFiltro.size > 0) {
        const ref = item.referencia || '';
        if (!valoresFiltro.has(ref)) {
          return false;
        }
      }
    }
    
    // Verificar filtro de Descrição
    if (filtros.has('descricao')) {
      const valoresFiltro = filtros.get('descricao')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.descricao)) {
        return false;
      }
    }
    
    // Verificar filtro de Unidade
    if (filtros.has('unidade')) {
      const valoresFiltro = filtros.get('unidade')!;
      if (valoresFiltro.size > 0) {
        const unidade = item.unidade || '';
        if (!valoresFiltro.has(unidade)) {
          return false;
        }
      }
    }
    
    // Verificar filtro de Tipo
    if (filtros.has('tipo')) {
      const valoresFiltro = filtros.get('tipo')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.tipo)) {
        return false;
      }
    }
    
    return true;
  };

  // Função para encontrar todos os ancestrais de um item
  const encontrarAncestrais = (itemId: string, itensMap: Map<string, PlanilhaItem>): Set<string> => {
    const ancestrais = new Set<string>();
    let currentId: string | undefined = itemId;
    
    while (currentId) {
      const item = itensMap.get(currentId);
      if (!item || !item.parentId) break;
      
      ancestrais.add(item.parentId);
      currentId = item.parentId;
    }
    
    return ancestrais;
  };

  const obterValoresUnicos = (campo: string): string[] => {
    const valores = new Set<string>();
    planilhaItensComTotais.forEach((item) => {
      let valor = '';
      switch (campo) {
        case 'item':
          valor = item.item;
          break;
        case 'referencia':
          valor = item.referencia || '';
          break;
        case 'descricao':
          valor = item.descricao;
          break;
        case 'unidade':
          valor = item.unidade || '';
          break;
        case 'tipo':
          valor = item.tipo;
          break;
      }
      if (valor) {
        valores.add(valor);
      }
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
    // Se o filtro já estiver aberto para este campo, fechar
    if (filtroAberto === campo) {
      setFiltroAberto(null);
      setElementoFiltro(null);
      return;
    }
    // Encontrar o elemento th pai (cabeçalho)
    const button = event.currentTarget;
    const th = button.closest('th') as HTMLElement;
    if (th) {
      setElementoFiltro(th);
      setFiltroAberto(campo);
    }
  };


  // Função para obter itens visíveis (com hierarquia e filtros)
  const getVisibleItems = (): PlanilhaItem[] => {
    if (!planilhaItensComTotais || planilhaItensComTotais.length === 0) {
      return [];
    }
    
    // Criar mapa de itens por ID para acesso rápido
    const itensMap = new Map<string, PlanilhaItem>();
    planilhaItensComTotais.forEach(item => {
      itensMap.set(item.id, item);
    });
    
    // Se não há filtros, retornar todos os itens normalmente
    if (filtros.size === 0) {
      const visible: PlanilhaItem[] = [];
      const processItem = (item: PlanilhaItem) => {
        visible.push(item);
        // Se é agrupador e está expandido, processar filhos na ordem correta
        if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
          // Filhos já estão ordenados na propriedade filhos
          item.filhos.forEach((filhoId) => {
            const filho = itensMap.get(filhoId);
            if (filho) processItem(filho);
          });
        }
      };
      
      // Primeiro, tentar encontrar itens de nível 0
      let itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === 0);
      
      // Se não há itens de nível 0, usar itens sem parentId como raiz
      if (itensRaiz.length === 0) {
        itensRaiz = planilhaItensComTotais.filter((i) => !i.parentId);
      }
      
      // Se ainda não há itens raiz, usar o menor nível encontrado
      if (itensRaiz.length === 0 && planilhaItensComTotais.length > 0) {
        const menorNivel = Math.min(...planilhaItensComTotais.map(i => i.nivel));
        itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === menorNivel);
      }
      
      if (itensRaiz.length === 0) {
        return [];
      }
      
      // Ordenar itens raiz pela ordem
      itensRaiz.sort((a, b) => {
        // Comparar códigos hierárquicos para ordenação
        const partesA = a.item.split('.').map(Number);
        const partesB = b.item.split('.').map(Number);
        const maxLen = Math.max(partesA.length, partesB.length);
        
        for (let i = 0; i < maxLen; i++) {
          const valA = partesA[i] || 0;
          const valB = partesB[i] || 0;
          if (valA !== valB) return valA - valB;
        }
        return 0;
      });
      
      itensRaiz.forEach(processItem);
      return visible;
    }
    
    // Com filtros: identificar itens que correspondem aos filtros
    const itensFiltrados = new Set<string>();
    planilhaItensComTotais.forEach(item => {
      if (itemCorrespondeFiltros(item)) {
        itensFiltrados.add(item.id);
      }
    });
    
    // Para cada item filtrado, adicionar todos os seus ancestrais
    const itensVisiveis = new Set<string>(itensFiltrados);
    itensFiltrados.forEach(itemId => {
      const ancestrais = encontrarAncestrais(itemId, itensMap);
      ancestrais.forEach(ancestralId => {
        itensVisiveis.add(ancestralId);
      });
    });
    
    // Processar hierarquia normalmente, mas só incluir itens visíveis
    const visible: PlanilhaItem[] = [];
    const processItem = (item: PlanilhaItem) => {
      // Só incluir se estiver no conjunto de itens visíveis
      if (!itensVisiveis.has(item.id)) {
        return;
      }
      
      visible.push(item);
      
      // Se é agrupador e está expandido, processar filhos na ordem correta
      if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
        // Filhos já estão ordenados na propriedade filhos
        item.filhos.forEach((filhoId) => {
          const filho = itensMap.get(filhoId);
          if (filho) processItem(filho);
        });
      }
    };
    
    // Primeiro, tentar encontrar itens de nível 0
    let itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === 0);
    
    // Se não há itens de nível 0, usar itens sem parentId como raiz
    if (itensRaiz.length === 0) {
      itensRaiz = planilhaItensComTotais.filter((i) => !i.parentId);
    }
    
    // Se ainda não há itens raiz, usar o menor nível encontrado
    if (itensRaiz.length === 0 && planilhaItensComTotais.length > 0) {
      const menorNivel = Math.min(...planilhaItensComTotais.map(i => i.nivel));
      itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === menorNivel);
    }
    
    if (itensRaiz.length === 0) {
      return [];
    }
    
    // Ordenar itens raiz pela ordem
    itensRaiz.sort((a, b) => {
      // Comparar códigos hierárquicos para ordenação
      const partesA = a.item.split('.').map(Number);
      const partesB = b.item.split('.').map(Number);
      const maxLen = Math.max(partesA.length, partesB.length);
      
      for (let i = 0; i < maxLen; i++) {
        const valA = partesA[i] || 0;
        const valB = partesB[i] || 0;
        if (valA !== valB) return valA - valB;
      }
      return 0;
    });
    
    itensRaiz.forEach(processItem);
    return visible;
  };

  const visibleItems = getVisibleItems();

  // Expandir automaticamente agrupadores pais quando há filtros ativos
  useEffect(() => {
    if (filtros.size === 0 || !planilhaItensComTotais || planilhaItensComTotais.length === 0) {
      return;
    }

    const itensMap = new Map<string, PlanilhaItem>();
    planilhaItensComTotais.forEach(item => {
      itensMap.set(item.id, item);
    });

    // Identificar itens que correspondem aos filtros
    const itensFiltrados = new Set<string>();
    planilhaItensComTotais.forEach(item => {
      if (itemCorrespondeFiltros(item)) {
        itensFiltrados.add(item.id);
      }
    });

    // Para cada item filtrado, encontrar todos os seus ancestrais e expandi-los
    const agrupadoresParaExpandir = new Set<string>();
    itensFiltrados.forEach(itemId => {
      const ancestrais = encontrarAncestrais(itemId, itensMap);
      ancestrais.forEach(ancestralId => {
        const ancestral = itensMap.get(ancestralId);
        if (ancestral && ancestral.tipo === 'agrupador') {
          agrupadoresParaExpandir.add(ancestralId);
        }
      });
    });

    // Expandir os agrupadores necessários
    if (agrupadoresParaExpandir.size > 0) {
      setExpandedRows((prev) => {
        const newExpanded = new Set(prev);
        agrupadoresParaExpandir.forEach(id => {
          newExpanded.add(id);
        });
        return newExpanded;
      });
    }
  }, [filtros, planilhaItensComTotais]);

  const ultimaVersao = versoes.length > 0 
    ? versoes.sort((a, b) => b.numero - a.numero)[0]
    : null;

  const podeEditarOuExcluir = (versaoId: string): boolean => {
    return ultimaVersao?.id === versaoId;
  };

  const ativarVersao = async (versaoId: string) => {
    if (versaoId === versaoAtivaId) return;

    try {
      const response = await fetch('/api/orcamento/ativar-versao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId: params.obraId,
          versaoId,
        }),
      });

      if (response.ok) {
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Erro ao ativar versão:', error);
      alert('Erro ao ativar versão');
    }
  };

  const excluirVersao = async (versaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta versão? Esta ação não pode ser desfeita.')) {
      return;
    }

    setVersaoParaExcluir(versaoId);
    setIsExcluindo(true);
    try {
      const response = await fetch('/api/orcamento/excluir-versao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId: params.obraId,
          versaoId,
          permitirQualquerVersao: false, // Planilha contratual só permite excluir da última para a primeira
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Se houver versões de custos baseadas nesta versão, mostrar mensagem mais detalhada
        if (data.versoesCustos && data.versoesCustos.length > 0) {
          const nomesVersoes = data.versoesCustos.map((v: any) => v.nome).join('\n- ');
          alert(`Não é possível excluir esta versão da planilha contratual.\n\nExistem versões de custos orçados baseadas nela:\n- ${nomesVersoes}\n\nExclua primeiro as versões de custos orçados.`);
        } else {
          throw new Error(data.error || 'Erro ao excluir versão');
        }
        return;
      }

      alert('Versão excluída com sucesso!');
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao excluir versão:', error);
      alert(error.message || 'Erro ao excluir versão');
    } finally {
      setIsExcluindo(false);
      setVersaoParaExcluir(null);
      setVersaoParaExcluir(null);
    }
  };

  const editarVersao = (versaoId: string) => {
    if (versaoId === versaoAtivaId) {
      setModoEdicao(true);
    } else {
      alert('Por favor, ative esta versão antes de editá-la.');
    }
  };

  const iniciarEdicao = (itemId: string, campo: string) => {
    if (!modoEdicao) return;
    
    const item = planilhaItensComTotais.find((i) => i.id === itemId);
    if (!item) return;
    
    setItemEditando(itemId);
    setCampoEditando(campo);
    
    let valor = '';
    switch (campo) {
      case 'item':
        valor = item.item;
        break;
      case 'referencia':
        valor = item.referencia;
        break;
      case 'descricao':
        valor = item.descricao;
        break;
      case 'unidade':
        valor = item.unidade;
        break;
      case 'quantidade':
        valor = formatQuantity(item.quantidade);
        break;
      case 'precoUnitario':
        valor = item.precoUnitario > 0 ? formatNumber(item.precoUnitario) : '';
        break;
      case 'precoTotal':
        valor = item.precoTotal > 0 ? formatNumber(item.precoTotal) : '';
        break;
    }
    
    setValorEditando(valor);
  };

  const salvarEdicao = async () => {
    if (!itemEditando || !campoEditando) return;
    
    const item = planilhaItensComTotais.find((i) => i.id === itemEditando);
    if (!item) return;

    try {
      const dadosAtualizacao: any = {};
      let precisaRecalcularHierarquia = false;

      switch (campoEditando) {
        case 'item':
          if (valorEditando !== item.item) {
            dadosAtualizacao.codigo = valorEditando.trim();
            precisaRecalcularHierarquia = true;
          }
          break;
        case 'referencia':
          dadosAtualizacao.referencia = valorEditando.trim() || null;
          break;
        case 'descricao':
          dadosAtualizacao.discriminacao = valorEditando.trim();
          break;
        case 'unidade':
          dadosAtualizacao.unidade = valorEditando.trim() || null;
          break;
        case 'quantidade':
          const qtdStr = valorEditando.replace(/[^\d.,]/g, '');
          const temVirgulaQtd = qtdStr.includes(',');
          const temPontoQtd = qtdStr.includes('.');
          let qtd: number | undefined;
          if (temVirgulaQtd && temPontoQtd) {
            const ultimaVirgula = qtdStr.lastIndexOf(',');
            const parteInteira = qtdStr.substring(0, ultimaVirgula).replace(/\./g, '');
            const parteDecimal = qtdStr.substring(ultimaVirgula + 1);
            qtd = parseFloat(`${parteInteira}.${parteDecimal}`);
          } else if (temVirgulaQtd) {
            qtd = parseFloat(qtdStr.replace(',', '.'));
          } else if (temPontoQtd) {
            const pontos = (qtdStr.match(/\./g) || []).length;
            qtd = pontos > 1 ? parseFloat(qtdStr.replace(/\./g, '')) : parseFloat(qtdStr);
          } else {
            qtd = parseFloat(qtdStr);
          }
          if (!isNaN(qtd) && qtd !== undefined) {
            dadosAtualizacao.quantidade = qtd;
          }
          break;
        case 'precoUnitario':
          const precoStr = valorEditando.replace(/[^\d.,]/g, '');
          const temVirgulaPreco = precoStr.includes(',');
          const temPontoPreco = precoStr.includes('.');
          let preco: number | undefined;
          if (temVirgulaPreco && temPontoPreco) {
            const ultimaVirgula = precoStr.lastIndexOf(',');
            const parteInteira = precoStr.substring(0, ultimaVirgula).replace(/\./g, '');
            const parteDecimal = precoStr.substring(ultimaVirgula + 1);
            preco = parseFloat(`${parteInteira}.${parteDecimal}`);
          } else if (temVirgulaPreco) {
            preco = parseFloat(precoStr.replace(',', '.'));
          } else if (temPontoPreco) {
            const pontos = (precoStr.match(/\./g) || []).length;
            preco = pontos > 1 ? parseFloat(precoStr.replace(/\./g, '')) : parseFloat(precoStr);
          } else {
            preco = parseFloat(precoStr);
          }
          if (!isNaN(preco) && preco !== undefined) {
            dadosAtualizacao.precoUnitarioVenda = preco;
          }
          break;
        case 'precoTotal':
          const totalStr = valorEditando.replace(/[^\d.,]/g, '');
          const temVirgulaTotal = totalStr.includes(',');
          const temPontoTotal = totalStr.includes('.');
          let total: number | undefined;
          if (temVirgulaTotal && temPontoTotal) {
            const ultimaVirgula = totalStr.lastIndexOf(',');
            const parteInteira = totalStr.substring(0, ultimaVirgula).replace(/\./g, '');
            const parteDecimal = totalStr.substring(ultimaVirgula + 1);
            total = parseFloat(`${parteInteira}.${parteDecimal}`);
          } else if (temVirgulaTotal) {
            total = parseFloat(totalStr.replace(',', '.'));
          } else if (temPontoTotal) {
            const pontos = (totalStr.match(/\./g) || []).length;
            total = pontos > 1 ? parseFloat(totalStr.replace(/\./g, '')) : parseFloat(totalStr);
          } else {
            total = parseFloat(totalStr);
          }
          if (!isNaN(total) && total !== undefined) {
            dadosAtualizacao.precoTotalVenda = total;
          }
          break;
      }

      if (Object.keys(dadosAtualizacao).length === 0) {
        cancelarEdicao();
        return;
      }

      const response = await fetch('/api/orcamento/atualizar-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemEditando,
          dados: dadosAtualizacao,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar alteração');
      }

      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao salvar edição:', error);
      alert(error.message || 'Erro ao salvar alteração');
    } finally {
      cancelarEdicao();
    }
  };

  const cancelarEdicao = () => {
    setItemEditando(null);
    setCampoEditando(null);
    setValorEditando('');
  };

  // Calcular total geral apenas com base nos itens visíveis (como subtotal do Excel)
  // Quando há filtros, soma apenas os itens finais (tipo 'item') visíveis
  // Quando não há filtros, soma todos os itens de nível 0 (comportamento original)
  const totalGeral = useMemo(() => {
    if (filtros.size > 0) {
      // Com filtros: somar apenas os itens finais (tipo 'item') que estão visíveis
      // Isso funciona como SUBTOTAL do Excel - soma apenas as linhas visíveis
      return visibleItems
        .filter((i) => i.tipo === 'item')
        .reduce((sum, i) => sum + i.precoTotal, 0);
    } else {
      // Sem filtros: somar todos os itens de nível 0 (comportamento original)
      return planilhaItensComTotais
        .filter((i) => i.nivel === 0)
        .reduce((sum, i) => sum + i.precoTotal, 0);
    }
  }, [visibleItems, filtros.size, planilhaItensComTotais]);

  // Calcular estatísticas de totalizadoras por nível
  const totalizadorasPorNivel = new Map<number, number>();
  planilhaItensComTotais.forEach((item) => {
    if (item.tipo === 'agrupador') {
      const count = totalizadorasPorNivel.get(item.nivel) || 0;
      totalizadorasPorNivel.set(item.nivel, count + 1);
    }
  });

  // Total de linhas de serviço (itens que não são agrupadores)
  const totalLinhasServico = planilhaItensComTotais.filter((i) => i.tipo === 'item').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const executarDiagnostico = async () => {
    setCarregandoDiagnostico(true);
    setMostrarModalDiagnostico(true);
    
    try {
      const response = await fetch(`/api/orcamento/debug-hierarquia?obraId=${params.obraId}`);
      const resultado = await response.json();
      
      if (resultado.success) {
        setDadosDiagnostico({
          totalItens: resultado.totalItens,
          orfaos: resultado.orfaos,
          agrupadoresVazios: resultado.agrupadoresVazios,
          parentIdsInvalidos: resultado.parentIdsInvalidos,
          totalDuplicados: resultado.totalDuplicados || 0,
          itensDuplicados: resultado.itensDuplicados || [],
          exemplosOrfaos: resultado.exemplosOrfaos || [],
        });
      } else {
        alert(`Erro ao executar diagnóstico: ${resultado.error}`);
        setMostrarModalDiagnostico(false);
      }
    } catch (error: any) {
      console.error('Erro ao executar diagnóstico:', error);
      alert(`Erro ao executar diagnóstico: ${error.message}`);
      setMostrarModalDiagnostico(false);
    } finally {
      setCarregandoDiagnostico(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Planilha Contratual - {obra.codigo}</h1>
            <p className="text-slate-400">A Receita - O que o Governo Paga (Espelho da Planilha Orçamentária Vencedora)</p>
            <p className="text-slate-500 text-sm mt-1">{obra.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {modoEdicao ? (
            <>
              <button
                onClick={() => {
                  setModoEdicao(false);
                  cancelarEdicao();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-5 h-5" />
                Cancelar Edição
              </button>
            </>
          ) : (
            <>
              <button
                onClick={executarDiagnostico}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                title="Diagnosticar problemas de hierarquia"
              >
                <AlertTriangle className="w-5 h-5" />
                🔍 Diagnosticar Erros
              </button>
              <Link
                href={`/eng/orcamento/${params.construtoraId}/${params.obraId}/planilha-contratual/importar`}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar/Configurar
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-start justify-between gap-6">
            {/* Lado esquerdo: Total de Serviços */}
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total de Serviços</p>
              <p className="text-2xl font-bold text-white">{totalLinhasServico}</p>
              <p className="text-xs text-slate-500 mt-1">Linhas de serviço no orçamento</p>
            </div>
            
            {/* Lado direito: Totalizadoras por Nível */}
            <div className="flex-1 border-l border-slate-700 pl-6">
              <p className="text-xs text-slate-400 mb-2">Totalizadoras por Nível:</p>
              <div className="space-y-1">
                {Array.from(totalizadorasPorNivel.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([nivel, quantidade]) => (
                    <div key={nivel} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Nível {nivel}:</span>
                      <span className="text-white font-semibold">{quantidade}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Global do Contrato</p>
          <p className="text-2xl font-bold text-green-400 font-mono">{formatCurrency(totalGeral)}</p>
        </div>
      </div>

      {/* Versões da Planilha */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Versões da Planilha</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {versoes
              .sort((a, b) => b.numero - a.numero)
              .map((versao) => {
                const podeEditarExcluir = podeEditarOuExcluir(versao.id);
                const isUltimaVersao = ultimaVersao?.id === versao.id;

                return (
                  <div
                    key={versao.id}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      versao.id === versaoAtivaId
                        ? 'bg-blue-950 border-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div
                      className={`flex-1 cursor-pointer ${versao.id === versaoAtivaId ? '' : 'hover:border-slate-600 hover:bg-slate-750'}`}
                      onClick={() => ativarVersao(versao.id)}
                    >
                      <div className="flex items-center gap-2">
                        {versao.id === versaoAtivaId && <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${versao.id === versaoAtivaId ? 'text-blue-400' : 'text-slate-400'}`}>
                              {versao.nome}
                            </span>
                            {versao.tipo === 'BASELINE' && (
                              <span className="px-2 py-0.5 bg-amber-900 text-amber-400 rounded text-xs font-semibold">
                                BASE LINE
                              </span>
                            )}
                            {versao.tipo === 'REVISAO' && (
                              <span className="px-2 py-0.5 bg-purple-900 text-purple-400 rounded text-xs font-semibold">
                                REVISÃO
                              </span>
                            )}
                            {isUltimaVersao && (
                              <span className="px-2 py-0.5 bg-green-900 text-green-400 rounded text-xs font-semibold">
                                ÚLTIMA
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 space-y-1">
                            <div>
                              Criado em {formatDateTime(versao.dataCriacao)}
                            </div>
                            {versao.dataAtualizacao && versao.dataAtualizacao !== versao.dataCriacao && (
                              <div className="text-slate-600">
                                Última edição: {formatDateTime(versao.dataAtualizacao)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                      {podeEditarExcluir && (
                        <button
                          onClick={() => editarVersao(versao.id)}
                          className="p-2 hover:bg-blue-900/50 rounded text-blue-400 hover:text-blue-300 transition-colors"
                          title="Editar versão"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => excluirVersao(versao.id)}
                        disabled={isExcluindo || !isUltimaVersao}
                        className={`p-2 rounded transition-colors ${
                          isUltimaVersao
                            ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300'
                            : 'text-slate-600 cursor-not-allowed opacity-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isUltimaVersao ? 'Excluir versão' : 'Apenas a última versão pode ser excluída'}
                      >
                        {isExcluindo && versaoParaExcluir === versao.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {!podeEditarExcluir && false && (
                      <div className="ml-2 text-xs text-slate-600 italic">
                        Versão anterior
                      </div>
                    )}
                  </div>
                );
              })}
            {versoes.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">
                Nenhuma alteração registrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles de Níveis */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Níveis:
        </span>
        {getNiveisDisponiveis().map((nivel) => {
          const itensDoNivel = planilhaItensComTotais.filter((i) => i.nivel === nivel && i.tipo === 'agrupador');
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

      {/* Tabela da Planilha */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <table className="table-engineering w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 shadow-lg">
                <th className="w-12 bg-slate-900 border-b-2 border-r border-slate-700 py-4"></th>
                {modoEdicao && <th className="w-24 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 text-xs font-semibold text-slate-300">Ações</th>}
                <th className={`w-32 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'item' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Item</span>
                    <button
                      onClick={(e) => abrirFiltro('item', e)}
                      className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                        filtroAberto === 'item' || filtros.has('item') ? 'text-blue-400' : 'text-slate-500'
                      }`}
                      title="Filtrar Item"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                  {filtroAberto === 'item' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Item</h3>
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
                          onClick={() => limparFiltro('item')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('item').map((valor) => {
                          const valoresSelecionados = filtros.get('item') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('item', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('item') && (filtros.get('item')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('item')?.size} item(ns) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className={`w-32 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'referencia' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Referência</span>
                    <button
                      onClick={(e) => abrirFiltro('referencia', e)}
                      className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                        filtroAberto === 'referencia' || filtros.has('referencia') ? 'text-blue-400' : 'text-slate-500'
                      }`}
                      title="Filtrar Referência"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                  {filtroAberto === 'referencia' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Referência</h3>
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
                          onClick={() => limparFiltro('referencia')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('referencia').map((valor) => {
                          const valoresSelecionados = filtros.get('referencia') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('referencia', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('referencia') && (filtros.get('referencia')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('referencia')?.size} item(ns) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className={`min-w-[300px] bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'descricao' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Serviço (Descrição)</span>
                    <button
                      onClick={(e) => abrirFiltro('descricao', e)}
                      className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                        filtroAberto === 'descricao' || filtros.has('descricao') ? 'text-blue-400' : 'text-slate-500'
                      }`}
                      title="Filtrar Descrição"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                  {filtroAberto === 'descricao' && elementoFiltro && (
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
                          onClick={() => limparFiltro('descricao')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('descricao').map((valor) => {
                          const valoresSelecionados = filtros.get('descricao') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('descricao', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('descricao') && (filtros.get('descricao')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('descricao')?.size} item(ns) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className={`w-24 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-1 ${filtroAberto === 'unidade' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Unidade</span>
                    <button
                      onClick={(e) => abrirFiltro('unidade', e)}
                      className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                        filtroAberto === 'unidade' || filtros.has('unidade') ? 'text-blue-400' : 'text-slate-500'
                      }`}
                      title="Filtrar Unidade"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                  {filtroAberto === 'unidade' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Unidade</h3>
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
                          onClick={() => limparFiltro('unidade')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('unidade').map((valor) => {
                          const valoresSelecionados = filtros.get('unidade') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('unidade', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('unidade') && (filtros.get('unidade')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('unidade')?.size} item(ns) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className="number-cell w-32 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Quantidade</th>
                <th className="number-cell w-40 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Preço Unitário (com BDI)</th>
                <th className="number-cell w-40 bg-slate-900 border-b-2 border-slate-700 text-xs py-4 px-1">Preço Total (com BDI)</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={modoEdicao ? 9 : 8} className="text-center py-8 text-slate-400">
                    {versaoAtiva ? 'Nenhum item encontrado nesta versão.' : 'Nenhuma versão ativa. Importe uma planilha para começar.'}
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800 ${item.tipo === 'agrupador' ? 'bg-slate-850' : ''} ${
                      item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
                    } ${itemEditando === item.id ? 'bg-blue-950/30' : ''}`}
                  >
                    <td className={`py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
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
                    {modoEdicao && (
                      <td className={`py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                        <button
                          onClick={() => iniciarEdicao(item.id, 'item')}
                          className="p-1 hover:bg-blue-900 rounded text-blue-400"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                    <td className={`py-1 px-2 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {modoEdicao && itemEditando === item.id && campoEditando === 'item' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white font-mono text-xs"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`font-mono text-xs ${
                            item.tipo === 'agrupador' ? 'text-blue-400 font-bold' : 'text-slate-300 font-normal'
                          } ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          style={{ paddingLeft: `${item.nivel * 12}px` }}
                          onClick={() => modoEdicao && iniciarEdicao(item.id, 'item')}
                        >
                          {item.item}
                        </span>
                      )}
                    </td>
                    <td className={`py-1 px-2 font-mono text-slate-400 text-xs ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {modoEdicao && itemEditando === item.id && campoEditando === 'referencia' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white font-mono text-xs"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${item.tipo === 'agrupador' ? '' : 'font-normal'} ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          onClick={() => modoEdicao && iniciarEdicao(item.id, 'referencia')}
                        >
                          {item.referencia || '-'}
                        </span>
                      )}
                    </td>
                    <td className={`py-1 px-2 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {modoEdicao && itemEditando === item.id && campoEditando === 'descricao' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white text-xs"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-xs ${item.tipo === 'agrupador' ? 'font-semibold text-white' : 'text-slate-300 font-normal'} ${
                            modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''
                          }`}
                          onClick={() => modoEdicao && iniciarEdicao(item.id, 'descricao')}
                        >
                          {item.descricao}
                        </span>
                      )}
                    </td>
                    <td className={`text-center text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao && itemEditando === item.id && campoEditando === 'unidade' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white text-xs text-center"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-xs ${item.tipo === 'agrupador' ? 'text-slate-700' : 'text-slate-300 font-normal'} ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          onClick={() => modoEdicao && item.tipo !== 'agrupador' && iniciarEdicao(item.id, 'unidade')}
                        >
                          {item.unidade}
                        </span>
                      )}
                    </td>
                    <td className={`number-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao && itemEditando === item.id && campoEditando === 'quantidade' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white font-mono text-xs text-right"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`text-xs ${item.tipo === 'agrupador' ? 'text-slate-700' : 'text-slate-300 font-normal'} ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          onClick={() => modoEdicao && item.tipo !== 'agrupador' && iniciarEdicao(item.id, 'quantidade')}
                        >
                          {formatQuantity(item.quantidade)}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao && itemEditando === item.id && campoEditando === 'precoUnitario' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white font-mono text-xs text-right"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${item.tipo === 'agrupador' ? '' : 'font-normal'} ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          onClick={() => modoEdicao && item.tipo !== 'agrupador' && iniciarEdicao(item.id, 'precoUnitario')}
                        >
                          {item.precoUnitario > 0 ? formatCurrency(item.precoUnitario) : '-'}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        formatCurrency(item.precoTotal)
                      ) : modoEdicao && itemEditando === item.id && campoEditando === 'precoTotal' ? (
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          onBlur={salvarEdicao}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao();
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className="w-full px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white font-mono text-xs text-right"
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${item.tipo === 'agrupador' ? '' : 'font-normal'} ${modoEdicao ? 'cursor-pointer hover:bg-blue-900/30 px-1 py-0.5 rounded' : ''}`}
                          onClick={() => modoEdicao && item.tipo !== 'agrupador' && iniciarEdicao(item.id, 'precoTotal')}
                        >
                          {formatCurrency(item.precoTotal)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Total Geral - Fora da área de scroll, sempre visível */}
        <div className="bg-slate-800 border-t-2 border-slate-700">
          <table className="table-engineering w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td colSpan={modoEdicao ? 7 : 6} className="py-1 px-1"></td>
                <td className="w-40 currency-cell font-bold text-white py-1 px-1 text-xs whitespace-nowrap">
                  TOTAL GERAL:
                </td>
                <td className="w-40 currency-cell font-bold text-xs text-white py-1 px-1 whitespace-nowrap">
                  {formatCurrency(totalGeral)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Alterações */}
      <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Histórico de Alterações</h2>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          <div className="p-3 space-y-2">
            {versoes
              .sort((a, b) => new Date(b.dataAtualizacao || b.dataCriacao).getTime() - new Date(a.dataAtualizacao || a.dataCriacao).getTime())
              .map((versao) => (
                <div
                  key={versao.id}
                  className="text-xs text-slate-400 border-l-2 border-slate-700 pl-3 py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300">{versao.nome}</span>
                    {versao.status === 'ATIVA' && (
                      <span className="px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded text-[10px] font-semibold">
                        ATIVA
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    <div className="text-slate-500">
                      Criado em {formatDateTime(versao.dataCriacao)}
                    </div>
                    {versao.dataAtualizacao && versao.dataAtualizacao !== versao.dataCriacao && (
                      <div className="text-slate-500">
                        Última edição: {formatDateTime(versao.dataAtualizacao)}
                      </div>
                    )}
                    {versao.tipo === 'BASELINE' && (
                      <div className="text-amber-400/70 text-[10px]">
                        Tipo: Base Line
                      </div>
                    )}
                    {versao.tipo === 'REVISAO' && (
                      <div className="text-purple-400/70 text-[10px]">
                        Tipo: Revisão
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {versoes.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">
                Nenhuma alteração registrada
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de Diagnóstico */}
      {mostrarModalDiagnostico && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                Diagnóstico de Hierarquia
              </h2>
              <button
                onClick={() => {
                  setMostrarModalDiagnostico(false);
                  setDadosDiagnostico(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {carregandoDiagnostico ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-slate-400 mt-4">Executando diagnóstico...</p>
                <p className="text-slate-500 text-sm mt-2">Verifique o terminal do servidor para logs detalhados</p>
              </div>
            ) : dadosDiagnostico ? (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">📊 Estatísticas Gerais</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total de Itens:</span>
                      <span className="text-white font-bold">{dadosDiagnostico.totalItens}</span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${dadosDiagnostico.orfaos > 0 ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    {dadosDiagnostico.orfaos > 0 ? '🔴' : '✅'} Itens Órfãos
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Itens Órfãos (Nível {'>'} 0 sem Pai):</span>
                      <span className={`font-bold ${dadosDiagnostico.orfaos > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {dadosDiagnostico.orfaos}
                      </span>
                    </div>
                    {dadosDiagnostico.orfaos > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-700">
                        <p className="text-sm text-red-300 mb-2">⚠️ PROBLEMA CRÍTICO: Itens com nível {'>'} 0 mas parentId === null</p>
                        <p className="text-xs text-slate-400 mb-2">Isso indica que a Passada 2 da importação falhou em vincular os pais.</p>
                        {dadosDiagnostico.exemplosOrfaos && dadosDiagnostico.exemplosOrfaos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-300 mb-1 font-semibold">Exemplos de Órfãos:</p>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                              {dadosDiagnostico.exemplosOrfaos.map((exemplo, idx) => (
                                <li key={idx}>
                                  Código: <span className="font-mono text-red-300">{exemplo.codigo}</span> | 
                                  Nível: {exemplo.nivel} | 
                                  Tipo: {exemplo.tipo}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">Verifique o terminal do servidor para ver todos os órfãos e análise detalhada.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${dadosDiagnostico.agrupadoresVazios > 0 ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {dadosDiagnostico.agrupadoresVazios > 0 ? '🟡' : '✅'} Agrupadores Vazios
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Agrupadores sem filhos:</span>
                    <span className={`font-bold ${dadosDiagnostico.agrupadoresVazios > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {dadosDiagnostico.agrupadoresVazios}
                    </span>
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${dadosDiagnostico.parentIdsInvalidos > 0 ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {dadosDiagnostico.parentIdsInvalidos > 0 ? '🔴' : '✅'} ParentIds Inválidos
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">ParentIds que não existem:</span>
                    <span className={`font-bold ${dadosDiagnostico.parentIdsInvalidos > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {dadosDiagnostico.parentIdsInvalidos}
                    </span>
                  </div>
                </div>


                <div className={`rounded-lg p-4 ${dadosDiagnostico.totalDuplicados > 0 ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}>
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    {dadosDiagnostico.totalDuplicados > 0 ? '🔴' : '✅'} Códigos Duplicados
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Códigos Duplicados:</span>
                      <span className={`font-bold ${dadosDiagnostico.totalDuplicados > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {dadosDiagnostico.totalDuplicados}
                      </span>
                    </div>
                    {dadosDiagnostico.totalDuplicados > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-700">
                        <p className="text-sm text-red-300 mb-2">⚠️ PROBLEMA CRÍTICO: Códigos duplicados encontrados na planilha</p>
                        <p className="text-xs text-slate-400 mb-2">Isso pode causar problemas na hierarquia e nos cálculos. Corrija os códigos duplicados na planilha.</p>
                        {dadosDiagnostico.itensDuplicados && dadosDiagnostico.itensDuplicados.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-300 mb-1 font-semibold">Códigos Duplicados:</p>
                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                              {dadosDiagnostico.itensDuplicados.map((duplicado, idx) => (
                                <li key={idx}>
                                  Código <span className="font-mono text-red-300">{duplicado.codigo}</span> aparece{' '}
                                  <span className="font-bold text-red-400">{duplicado.quantidade}</span> vezes
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 mt-2">Verifique o terminal do servidor para ver todos os códigos duplicados e análise detalhada.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 mt-4">
                  <p className="text-sm text-slate-400">
                    💡 <strong>Dica:</strong> Para ver os códigos completos dos órfãos e análise detalhada, 
                    verifique o terminal do servidor onde os logs completos foram impressos.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setMostrarModalDiagnostico(false);
                  setDadosDiagnostico(null);
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}