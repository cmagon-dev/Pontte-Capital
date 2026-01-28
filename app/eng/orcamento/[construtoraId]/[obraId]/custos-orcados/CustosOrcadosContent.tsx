'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, ChevronRight, ChevronDown, ArrowLeft, X, Layers, GitBranch, CheckCircle, Filter, AlertCircle, Upload, Download, FileSpreadsheet, Trash2, History } from 'lucide-react';
import { formatCurrency, formatQuantity, formatPercent } from '@/lib/utils/format';
import { sincronizarCustosDaPlanilha, verificarAtualizacoesPlanilha, buscarCustosOrcados } from '@/app/actions/orcamento';

// --- TIPAGENS ---

type CustoItemBackend = {
  itemId: string;
  codigo: string;
  discriminacao: string;
  unidade: string | null;
  quantidade: number;
  precoTotalVenda: number;
  nivel: number;
  tipo: 'AGRUPADOR' | 'ITEM';
  parentId: string | null;
  referencia: string | null;
  ordem: number | null;
  custoMat: number;
  custoMO: number;
  custoContratos: number;
  custoEqFr: number;
  custoUnitarioTotal: number;
  custoTotal: number;
};

type CustoItem = {
  id: string;
  item: string;
  referencia: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  nivel: number;
  tipo: 'agrupador' | 'item';
  filhos: string[];
  parentId?: string;
  // Custos
  custoMat: number;
  custoMO: number;
  custoContratos: number;
  custoEqFr: number;
  custoTotal: number;
  // Venda e lucro
  precoVenda: number;
  lucroProjetado: number;
  margem: number;
};

type VersaoPlanilha = {
  id: string;
  nome: string;
  tipo: 'BASELINE' | 'REVISAO';
  dataCriacao: string;
  dataAtualizacao: string;
  status: 'ATIVA' | 'OBSOLETA';
  numero: number;
  observacoes?: string | null;
};

interface CustosOrcadosContentProps {
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
  } | null;
  versaoContratualAtiva: {
    id: string;
    nome: string;
    numero: number;
    createdAt: Date;
  } | null;
  versoes: VersaoPlanilha[];
  custosOrcados: {
    versaoId: string;
    versaoNumero: number;
    versaoNome: string;
    versaoUpdatedAt: string;
    custos: CustoItemBackend[];
  } | null;
}

export default function CustosOrcadosContent({
  params,
  obra,
  versaoAtiva,
  versaoContratualAtiva,
  versoes: versoesIniciais,
  custosOrcados: custosOrcadosIniciais,
}: CustosOrcadosContentProps) {
  
  // Converter itens do backend para formato do componente
  const converterCustosParaPlanilha = (custos: CustoItemBackend[] | null | undefined): CustoItem[] => {
    if (!custos || custos.length === 0) {
      return [];
    }
    
    // Criar mapa de itens por ID
    const itensMap = new Map<string, CustoItem>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

    // Primeiro, criar todos os itens
    custos.forEach((custo, index) => {
      const custoItem: CustoItem = {
        id: custo.itemId,
        item: custo.codigo,
        referencia: custo.referencia || '',
        descricao: custo.discriminacao,
        unidade: custo.unidade || '',
        quantidade: custo.quantidade,
        nivel: custo.nivel,
        tipo: custo.tipo === 'AGRUPADOR' ? 'agrupador' : 'item',
        filhos: [],
        parentId: custo.parentId || undefined,
        custoMat: custo.custoMat,
        custoMO: custo.custoMO,
        custoContratos: custo.custoContratos,
        custoEqFr: custo.custoEqFr,
        custoTotal: custo.custoTotal,
        precoVenda: custo.precoTotalVenda,
        lucroProjetado: custo.precoTotalVenda - custo.custoTotal,
        margem: custo.precoTotalVenda > 0 ? ((custo.precoTotalVenda - custo.custoTotal) / custo.precoTotalVenda) * 100 : 0,
      };
      itensMap.set(custo.itemId, custoItem);

      // Mapear filhos com ordem
      if (custo.parentId) {
        if (!filhosMap.has(custo.parentId)) {
          filhosMap.set(custo.parentId, []);
        }
        filhosMap.get(custo.parentId)!.push({
          id: custo.itemId,
          ordem: custo.ordem !== null && custo.ordem !== undefined ? custo.ordem : index,
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

    // Fallback: garantir que todos os filhos sejam mapeados (caso algum pai não tenha sido encontrado)
    // Isso garante que mesmo se o mapeamento inicial falhar, os filhos ainda serão encontrados
    itensMap.forEach((item) => {
      if (item.tipo === 'agrupador') {
        // Se já tem filhos mapeados, verificar se está completo
        // Se não tem filhos ou queremos garantir que está completo, procurar novamente
        const filhosEncontrados: Array<{ id: string; ordem: number }> = [];
        custos.forEach((custo, index) => {
          if (custo.parentId === item.id) {
            filhosEncontrados.push({
              id: custo.itemId,
              ordem: custo.ordem !== null && custo.ordem !== undefined ? custo.ordem : index,
            });
          }
        });
        
        // Se encontrou filhos que não estavam mapeados, atualizar
        if (filhosEncontrados.length > 0) {
          // Ordenar pelos códigos para manter ordem se não tiver ordem numérica
          filhosEncontrados.sort((a, b) => {
            const itemA = itensMap.get(a.id);
            const itemB = itensMap.get(b.id);
            if (!itemA || !itemB) return 0;
            
            // Se ambos têm ordem, usar ordem
            if (a.ordem !== b.ordem) {
              return a.ordem - b.ordem;
            }
            
            // Caso contrário, ordenar pelos códigos hierárquicos
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
          
          // Atualizar filhos (pode ser que já tenha alguns, então vamos garantir que todos estejam)
          const filhosIds = filhosEncontrados.map(f => f.id);
          if (item.filhos.length !== filhosIds.length || 
              !item.filhos.every((id, idx) => id === filhosIds[idx])) {
            item.filhos = filhosIds;
          }
        }
      }
    });

    return Array.from(itensMap.values());
  };

  const custosItensIniciais = custosOrcadosIniciais 
    ? converterCustosParaPlanilha(custosOrcadosIniciais.custos) 
    : [];
  
  // Inicializar com níveis recolhidos (Set vazio)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [custosItens, setCustosItens] = useState<CustoItem[]>(custosItensIniciais);
  const [temAtualizacoes, setTemAtualizacoes] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [arquivoImportar, setArquivoImportar] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [versaoParaExcluir, setVersaoParaExcluir] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [atualizandoDaPlanilha, setAtualizandoDaPlanilha] = useState(false);
  // Inicializar versão selecionada com a versão dos custos iniciais, ou versão ativa como fallback
  const [versaoSelecionada, setVersaoSelecionada] = useState<string | null>(
    custosOrcadosIniciais?.versaoId || versaoAtiva?.id || null
  );
  const [carregandoVersao, setCarregandoVersao] = useState(false);
  const [versaoCarregando, setVersaoCarregando] = useState<string | null>(null);

  // Função para recalcular totais dos agrupadores
  const recalcularTotaisAgrupadores = (itens: CustoItem[]): CustoItem[] => {
    const itensOrdenados = [...itens].sort((a, b) => b.nivel - a.nivel);
    const itensMap = new Map(itens.map(item => [item.id, { ...item }]));
    
    for (const item of itensOrdenados) {
      if (item.tipo === 'agrupador') {
        let custoTotal = 0;
        let precoVenda = 0;
        
        item.filhos.forEach((filhoId) => {
          const filho = itensMap.get(filhoId);
          if (filho) {
            custoTotal += filho.custoTotal;
            precoVenda += filho.precoVenda;
          }
        });
        
        const lucroProjetado = precoVenda - custoTotal;
        const margem = precoVenda > 0 ? (lucroProjetado / precoVenda) * 100 : 0;
        
        const itemAtualizado = itensMap.get(item.id);
        if (itemAtualizado) {
          itemAtualizado.custoTotal = custoTotal;
          itemAtualizado.precoVenda = precoVenda;
          itemAtualizado.lucroProjetado = lucroProjetado;
          itemAtualizado.margem = margem;
          itensMap.set(item.id, itemAtualizado);
        }
      } else {
        // Recalcular para itens
        const custoTotalUnitario = item.custoMat + item.custoMO + item.custoContratos + item.custoEqFr;
        const custoTotal = custoTotalUnitario * item.quantidade;
        const lucroProjetado = item.precoVenda - custoTotal;
        const margem = item.precoVenda > 0 ? (lucroProjetado / item.precoVenda) * 100 : 0;
        
        const itemAtualizado = itensMap.get(item.id);
        if (itemAtualizado) {
          itemAtualizado.custoTotal = custoTotal;
          itemAtualizado.lucroProjetado = lucroProjetado;
          itemAtualizado.margem = margem;
          itensMap.set(item.id, itemAtualizado);
        }
      }
    }
    
    return Array.from(itensMap.values());
  };

  const custosItensComTotais = useMemo(() => {
    if (custosItens.length === 0) return [];
    return recalcularTotaisAgrupadores(custosItens);
  }, [custosItens]);

  // Estados para filtros
  const [filtros, setFiltros] = useState<Map<string, Set<string>>>(new Map());
  const [filtroAberto, setFiltroAberto] = useState<string | null>(null);
  const [elementoFiltro, setElementoFiltro] = useState<HTMLElement | null>(null);

  // Verificar atualizações periodicamente
  useEffect(() => {
    // Verificar sempre que houver versão contratual ativa, mesmo sem custos orçados
    if (!versaoContratualAtiva) return;
    
    const verificar = async () => {
      const resultado = await verificarAtualizacoesPlanilha(
        params.obraId,
        custosOrcadosIniciais?.versaoId
      );
      if (resultado.success) {
        setTemAtualizacoes(resultado.temAtualizacoes || false);
      }
    };

    verificar();
    const interval = setInterval(verificar, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, [params.obraId, custosOrcadosIniciais?.versaoId, versaoContratualAtiva]);

  // Sincronizar dados quando a versão dos custos iniciais mudar
  // Mas só atualizar se a versão selecionada corresponder, para não perder dados ao navegar entre versões
  useEffect(() => {
    if (custosOrcadosIniciais && custosOrcadosIniciais.versaoId) {
      // Se a versão selecionada corresponde à versão dos custos iniciais, atualizar os dados
      if (versaoSelecionada === custosOrcadosIniciais.versaoId) {
        const itensConvertidos = converterCustosParaPlanilha(custosOrcadosIniciais.custos);
        setCustosItens(itensConvertidos);
        setExpandedRows(new Set());
      }
      // Se não há versão selecionada, definir como a versão dos custos iniciais
      else if (!versaoSelecionada) {
        setVersaoSelecionada(custosOrcadosIniciais.versaoId);
      }
    }
    // Não limpar os custos se custosOrcadosIniciais for null/undefined
    // Isso preserva os dados já carregados quando há atualizações disponíveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custosOrcadosIniciais?.versaoId]);

  // Função para carregar uma versão específica
  const carregarVersao = async (versaoId: string) => {
    if (carregandoVersao || versaoSelecionada === versaoId) return;
    
    setCarregandoVersao(true);
    setVersaoCarregando(versaoId);
    try {
      const resultado = await buscarCustosOrcados(params.obraId, versaoId);
      if (resultado.success && resultado.versaoId && resultado.custos) {
        const itensConvertidos = converterCustosParaPlanilha(resultado.custos);
        
        console.log('Carregando versão:', versaoId, 'Itens convertidos:', itensConvertidos.length);
        
        // Atualizar todos os estados necessários
        setCustosItens(itensConvertidos);
        setVersaoSelecionada(versaoId);
        setExpandedRows(new Set()); // Recolher todos os níveis
      } else {
        console.error('Erro ao carregar versão:', resultado.error);
        alert(resultado.error || 'Erro ao carregar versão');
      }
    } catch (error: any) {
      console.error('Erro ao carregar versão:', error);
      alert(error.message || 'Erro ao carregar versão');
    } finally {
      setCarregandoVersao(false);
      setVersaoCarregando(null);
    }
  };

  // Função para verificar se um item corresponde aos filtros
  const itemCorrespondeFiltros = (item: CustoItem): boolean => {
    if (filtros.size === 0) return true;
    
    if (filtros.has('item')) {
      const valoresFiltro = filtros.get('item')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.item)) {
        return false;
      }
    }
    if (filtros.has('descricao')) {
      const valoresFiltro = filtros.get('descricao')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.descricao)) {
        return false;
      }
    }
    if (filtros.has('unidade')) {
      const valoresFiltro = filtros.get('unidade')!;
      const unidade = item.unidade || '';
      if (valoresFiltro.size > 0 && !valoresFiltro.has(unidade)) {
        return false;
      }
    }
    if (filtros.has('tipo')) {
      const valoresFiltro = filtros.get('tipo')!;
      if (valoresFiltro.size > 0 && !valoresFiltro.has(item.tipo)) {
        return false;
      }
    }
    
    return true;
  };

  // Função para encontrar todos os ancestrais de um item
  const encontrarAncestrais = (itemId: string, itensMap: Map<string, CustoItem>): Set<string> => {
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

  // Função para obter itens visíveis (com hierarquia e filtros)
  const getVisibleItems = (): CustoItem[] => {
    if (!custosItensComTotais || custosItensComTotais.length === 0) {
      return [];
    }
    
    const itensMap = new Map<string, CustoItem>();
    custosItensComTotais.forEach(item => {
      itensMap.set(item.id, item);
    });
    
    // Se não há filtros, retornar todos os itens normalmente
    if (filtros.size === 0) {
      const visible: CustoItem[] = [];
      const processItem = (item: CustoItem) => {
        visible.push(item);
        if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
          item.filhos.forEach((filhoId) => {
            const filho = itensMap.get(filhoId);
            if (filho) processItem(filho);
          });
        }
      };
      
      let itensRaiz = custosItensComTotais.filter((i) => i.nivel === 0);
      if (itensRaiz.length === 0) {
        itensRaiz = custosItensComTotais.filter((i) => !i.parentId);
      }
      if (itensRaiz.length === 0 && custosItensComTotais.length > 0) {
        const menorNivel = Math.min(...custosItensComTotais.map(i => i.nivel));
        itensRaiz = custosItensComTotais.filter((i) => i.nivel === menorNivel);
      }
      
      if (itensRaiz.length === 0) {
        return [];
      }
      
      itensRaiz.sort((a, b) => {
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
    custosItensComTotais.forEach(item => {
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
    const visible: CustoItem[] = [];
    const processItem = (item: CustoItem) => {
      // Só incluir se estiver no conjunto de itens visíveis
      if (!itensVisiveis.has(item.id)) {
        return;
      }
      
      visible.push(item);
      
      // Se for agrupador expandido, processar filhos
      if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
        item.filhos.forEach((filhoId) => {
          const filho = itensMap.get(filhoId);
          if (filho) processItem(filho);
        });
      }
    };
    
    let itensRaiz = custosItensComTotais.filter((i) => i.nivel === 0);
    if (itensRaiz.length === 0) {
      itensRaiz = custosItensComTotais.filter((i) => !i.parentId);
    }
    if (itensRaiz.length === 0 && custosItensComTotais.length > 0) {
      const menorNivel = Math.min(...custosItensComTotais.map(i => i.nivel));
      itensRaiz = custosItensComTotais.filter((i) => i.nivel === menorNivel);
    }
    
    if (itensRaiz.length === 0) {
      return [];
    }
    
    itensRaiz.sort((a, b) => {
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
    if (filtros.size === 0 || !custosItensComTotais || custosItensComTotais.length === 0) {
      return;
    }

    const itensMap = new Map<string, CustoItem>();
    custosItensComTotais.forEach(item => {
      itensMap.set(item.id, item);
    });

    // Identificar itens que correspondem aos filtros
    const itensFiltrados = new Set<string>();
    custosItensComTotais.forEach(item => {
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
  }, [filtros, custosItensComTotais]);

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
        const itensDoNivel0 = custosItensComTotais.filter((i) => i.nivel === 0 && i.tipo === 'agrupador');
        const todosExpandidos = itensDoNivel0.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel0.forEach((item) => {
            newExpanded.delete(item.id);
          });
          custosItensComTotais.forEach((item) => {
            if (item.nivel > 0 && item.tipo === 'agrupador') {
              newExpanded.delete(item.id);
            }
          });
        } else {
          itensDoNivel0.forEach((item) => {
            newExpanded.add(item.id);
          });
        }
      } else {
        for (let n = 0; n < nivel; n++) {
          const itensDoNivelAnterior = custosItensComTotais.filter(
            (i) => i.nivel === n && i.tipo === 'agrupador'
          );
          itensDoNivelAnterior.forEach((item) => {
            newExpanded.add(item.id);
          });
        }

        const itensDoNivel = custosItensComTotais.filter(
          (i) => i.nivel === nivel && i.tipo === 'agrupador'
        );
        const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel.forEach((item) => {
            newExpanded.delete(item.id);
          });
          custosItensComTotais.forEach((item) => {
            if (item.nivel > nivel && item.tipo === 'agrupador') {
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

  const getNiveisDisponiveis = (): number[] => {
    const niveis = new Set<number>();
    custosItensComTotais.forEach((item) => {
      if (item.tipo === 'agrupador') {
        niveis.add(item.nivel);
      }
    });
    return Array.from(niveis).sort((a, b) => a - b);
  };

  // Funções para filtros
  const obterValoresUnicos = (campo: string): string[] => {
    const valores = new Set<string>();
    custosItensComTotais.forEach((item) => {
      let valor = '';
      switch (campo) {
        case 'item':
          valor = item.item;
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


  // Função para atualizar da planilha contratual
  const atualizarDaPlanilhaContratual = async () => {
    // Proteção contra múltiplas chamadas
    if (atualizandoDaPlanilha) {
      return;
    }
    setAtualizandoDaPlanilha(true);
    try {
      const resultado = await sincronizarCustosDaPlanilha(params.obraId);
      if (resultado.success) {
        let mensagem = '';
        if (resultado.novaVersaoCriada) {
          mensagem = `Nova versão de custos orçados criada por conta de nova planilha contratual!\n\n`;
        }
        if (resultado.itensCriados || resultado.itensAtualizados || resultado.itensExcluidos) {
          mensagem += `Planilha atualizada com sucesso!\n\n` +
            `${resultado.itensCriados || 0} itens criados\n` +
            `${resultado.itensAtualizados || 0} itens atualizados\n` +
            `${resultado.itensExcluidos || 0} itens excluídos`;
        } else {
          mensagem += 'Planilha atualizada com sucesso da planilha contratual!';
        }
        // Aguardar um pouco mais para garantir que o cache seja invalidado
        // e então recarregar a página para mostrar os dados atualizados
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(resultado.error || 'Erro ao atualizar');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      // Garantir que o estado seja resetado mesmo em caso de erro
      setAtualizandoDaPlanilha(false);
      alert(error.message || 'Erro ao atualizar da planilha contratual');
    }
  };

  // Função para exportar custos orçados para Excel
  const exportarCustos = async () => {
    try {
      const response = await fetch(`/api/orcamento/exportar-custos?obraId=${params.obraId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao exportar custos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custos-orcados-${obra.codigo}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Erro ao exportar custos:', error);
      alert(error.message || 'Erro ao exportar custos orçados');
    }
  };

  // Função para importar custos orçados do Excel
  const importarCustos = async () => {
    if (!arquivoImportar) {
      alert('Selecione um arquivo para importar');
      return;
    }

    setImportando(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoImportar);
      formData.append('obraId', params.obraId);

      const response = await fetch('/api/orcamento/importar-custos', {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao importar custos');
      }

      if (resultado.novaVersaoCriada) {
        alert(`Nova versão criada!\n\n${resultado.message || 'Custos importados com sucesso!'}\n\nA versão anterior foi arquivada e a nova versão está ativa.`);
      } else {
        alert(resultado.message || 'Custos importados com sucesso!');
      }
      
      setMostrarModalImportar(false);
      setArquivoImportar(null);
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao importar custos:', error);
      alert(error.message || 'Erro ao importar custos orçados');
    } finally {
      setImportando(false);
    }
  };

  // Função para excluir versão
  const excluirVersao = async (versaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta versão? Esta ação não pode ser desfeita.')) {
      return;
    }

    setVersaoParaExcluir(versaoId);
    setExcluindo(true);
    try {
      const response = await fetch('/api/orcamento/excluir-versao-custo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId: params.obraId,
          versaoId: versaoId,
          permitirQualquerVersao: true, // Custos orçados permite excluir qualquer versão
        }),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao excluir versão');
      }

      alert('Versão excluída com sucesso!');
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao excluir versão:', error);
      alert(error.message || 'Erro ao excluir versão');
    } finally {
      setExcluindo(false);
      setVersaoParaExcluir(null);
    }
  };

  // Calcular totais gerais apenas com base nos itens visíveis (como subtotal do Excel)
  // Quando há filtros, soma apenas os itens finais (tipo 'item') visíveis
  // Quando não há filtros, soma todos os itens de nível 0 (comportamento original)
  const totalGeral = useMemo(() => {
    if (filtros.size > 0) {
      // Com filtros: somar apenas os itens finais (tipo 'item') que estão visíveis
      // Isso funciona como SUBTOTAL do Excel - soma apenas as linhas visíveis
      return visibleItems
        .filter((i) => i.tipo === 'item')
        .reduce((sum, i) => sum + i.custoTotal, 0);
    } else {
      // Sem filtros: somar todos os itens de nível 0 (comportamento original)
      return custosItensComTotais
        .filter((i) => i.nivel === 0)
        .reduce((sum, i) => sum + i.custoTotal, 0);
    }
  }, [visibleItems, filtros.size, custosItensComTotais]);
  
  const totalVenda = useMemo(() => {
    if (filtros.size > 0) {
      // Com filtros: somar apenas os itens finais (tipo 'item') que estão visíveis
      return visibleItems
        .filter((i) => i.tipo === 'item')
        .reduce((sum, i) => sum + i.precoVenda, 0);
    } else {
      // Sem filtros: somar todos os itens de nível 0 (comportamento original)
      return custosItensComTotais
        .filter((i) => i.nivel === 0)
        .reduce((sum, i) => sum + i.precoVenda, 0);
    }
  }, [visibleItems, filtros.size, custosItensComTotais]);
  
  const totalLucro = useMemo(() => {
    return totalVenda - totalGeral;
  }, [totalVenda, totalGeral]);
  
  const totalMargem = useMemo(() => {
    return totalVenda > 0 ? (totalLucro / totalVenda) * 100 : 0;
  }, [totalVenda, totalLucro]);

  // Função para obter a cor baseada na margem
  const getCorPorMargem = (margem: number): string => {
    if (margem > 35) {
      return 'text-green-500'; // Verde não muito vivo
    } else if (margem >= 25) {
      return 'text-amber-500'; // Amarelo não muito vivo
    } else {
      return 'text-red-500'; // Vermelho não muito vivo
    }
  };

  // Calcular estatísticas
  const totalizadorasPorNivel = new Map<number, number>();
  custosItensComTotais.forEach((item) => {
    if (item.tipo === 'agrupador') {
      const count = totalizadorasPorNivel.get(item.nivel) || 0;
      totalizadorasPorNivel.set(item.nivel, count + 1);
    }
  });

  const totalLinhasServico = custosItensComTotais.filter((i) => i.tipo === 'item').length;

  // Calcular % orçado da obra (por quantidade de serviços)
  const calcularPercentualOrcado = (): number => {
    const itensServico = custosItensComTotais.filter((i) => i.tipo === 'item');
    
    if (itensServico.length === 0) return 0;
    
    // Contar serviços que têm pelo menos um custo lançado (maior que zero)
    const servicosOrcados = itensServico.filter((item) => {
      return item.custoMat > 0 || item.custoMO > 0 || item.custoContratos > 0 || item.custoEqFr > 0;
    }).length;
    
    // Calcular porcentagem pela quantidade
    return itensServico.length > 0 ? (servicosOrcados / itensServico.length) * 100 : 0;
  };

  const percentualOrcado = calcularPercentualOrcado();

  // Formatar data
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

  return (
    <div className="p-8 relative">
      {/* Overlay de loading */}
      {atualizandoDaPlanilha && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-white text-lg font-semibold">Atualizando planilha de custos orçados...</p>
            <p className="text-slate-400 text-sm">Aguarde enquanto processamos os dados</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Custos Orçados - {obra.codigo}</h1>
            <p className="text-slate-400">O Orçamento Executivo / Meta - Definição de Custos e Margem de Lucro</p>
            <p className="text-slate-500 text-sm mt-1">{obra.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={atualizarDaPlanilhaContratual}
            disabled={
              atualizandoDaPlanilha || 
              !versaoContratualAtiva || 
              (versaoAtiva !== null && !temAtualizacoes)
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              atualizandoDaPlanilha
                ? 'bg-slate-600 text-white cursor-wait'
                : !versaoContratualAtiva || (versaoAtiva !== null && !temAtualizacoes)
                  ? 'bg-slate-700 text-white cursor-not-allowed opacity-50'
                  : temAtualizacoes || versaoAtiva === null
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              !versaoContratualAtiva 
                ? 'Nenhuma planilha contratual disponível'
                : atualizandoDaPlanilha
                  ? 'Atualizando planilha...'
                  : versaoAtiva !== null && !temAtualizacoes
                    ? 'Todas as versões estão sincronizadas'
                    : temAtualizacoes || versaoAtiva === null
                      ? 'Há atualizações disponíveis na planilha contratual'
                      : 'Sincronizar com planilha contratual'
            }
          >
            <RefreshCw className={`w-5 h-5 ${atualizandoDaPlanilha ? 'animate-spin' : ''}`} />
            {atualizandoDaPlanilha 
              ? 'Atualizando...' 
              : 'Atualizar da Planilha'}
          </button>
          <button
            onClick={() => setMostrarModalImportar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Importar/Exportar custos orçados"
          >
            <Upload className="w-5 h-5" />
            Importar/Exportar Custos
          </button>
        </div>
      </div>

      {/* Modal de Importar/Exportar Custos */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6" />
                Importar/Exportar Custos Orçados
              </h2>
              <button
                onClick={() => {
                  setMostrarModalImportar(false);
                  setArquivoImportar(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Botão de Exportar */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-2">Exportar Planilha</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Baixe a planilha completa com todos os custos orçados para preencher no Excel.
                </p>
                <button
                  onClick={exportarCustos}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Baixar Modelo da Planilha
                </button>
              </div>

              {/* Botão de Importar */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-2">Importar Planilha</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Selecione o arquivo Excel preenchido para importar os custos unitários.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setArquivoImportar(e.target.files?.[0] || null)}
                  className="w-full mb-3 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                />
                <button
                  onClick={importarCustos}
                  disabled={!arquivoImportar || importando}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                  {importando ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Importar Custos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Aviso de Novas Versões */}
        <div className={`border rounded-lg p-3 ${
          temAtualizacoes 
            ? 'bg-amber-900/30 border-amber-600' 
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start gap-2">
            <div className={`p-1.5 rounded-lg ${
              temAtualizacoes 
                ? 'bg-amber-800' 
                : 'bg-slate-800'
            }`}>
              <AlertCircle className={`w-4 h-4 ${
                temAtualizacoes 
                  ? 'text-amber-400' 
                  : 'text-slate-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs mb-1 ${
                temAtualizacoes 
                  ? 'text-amber-400 font-semibold' 
                  : 'text-slate-400'
              }`}>
                Aviso de Novas Versões
              </p>
              <p className={`text-xs leading-tight ${
                temAtualizacoes 
                  ? 'text-amber-300 font-medium' 
                  : 'text-slate-500'
              }`}>
                {temAtualizacoes 
                  ? 'Há novas versões do orçamento disponíveis.' 
                  : 'Todas as versões sincronizadas'}
              </p>
            </div>
          </div>
        </div>
        
        {/* % Orçado da Obra */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">% Orçado da Obra</p>
          <p className={`text-xl font-bold font-mono ${
            percentualOrcado === 100 ? 'text-green-400' : 
            percentualOrcado >= 75 ? 'text-blue-400' : 
            percentualOrcado >= 50 ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            {formatPercent(percentualOrcado)}
          </p>
        </div>
        
        {/* Valor Global do Contrato */}
        <div className="bg-slate-900 border border-green-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Valor Global do Contrato</p>
          <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(totalVenda)}</p>
        </div>
        
        {/* Custo total Proj. */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Custo total Proj.</p>
          <p className="text-lg font-bold text-white font-mono">{formatCurrency(totalGeral)}</p>
        </div>
        
        {/* % Margem projetada */}
        <div className="bg-slate-900 border border-purple-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">% Margem projetada</p>
          <p className={`text-lg font-bold font-mono ${
            totalMargem > 15 ? 'text-green-400' : 
            totalMargem > 5 ? 'text-amber-400' : 
            'text-red-400'
          }`}>
            {formatPercent(totalMargem)}
          </p>
        </div>
        
        {/* R$ Lucro Bruto Projetado */}
        <div className="bg-slate-900 border border-green-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">R$ Lucro Bruto Projetado</p>
          <p className={`text-lg font-bold font-mono ${
            totalLucro > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(totalLucro)}
          </p>
        </div>
      </div>

      {/* Versões da Planilha */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Versões da Planilha de Custos Orçados</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {versoesIniciais.length > 0 ? (
              (() => {
                const versoesOrdenadas = [...versoesIniciais].sort((a, b) => b.numero - a.numero);
                const ultimaVersao = versoesOrdenadas[0]; // A última versão criada (maior número)
                
                return versoesOrdenadas.map((versao) => {
                  const isAtiva = versao.id === versaoAtiva?.id;
                  const isSelecionada = versao.id === versaoSelecionada;
                  const podeExcluir = versao.id === ultimaVersao.id; // Só pode excluir a última versão
                  const estaCarregando = versaoCarregando === versao.id;

                  return (
                    <div
                      key={versao.id}
                      onClick={() => !estaCarregando && carregarVersao(versao.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        estaCarregando
                          ? 'cursor-wait opacity-75'
                          : 'cursor-pointer'
                      } ${
                        isSelecionada
                          ? 'bg-blue-950 border-blue-600 text-white shadow-lg shadow-blue-900/50'
                          : isAtiva
                          ? 'bg-slate-800 border-blue-500 text-slate-300 hover:bg-slate-750 hover:border-blue-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {estaCarregando ? (
                            <RefreshCw className="w-4 h-4 text-blue-400 flex-shrink-0 animate-spin" />
                          ) : isSelecionada ? (
                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          ) : isAtiva ? (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          ) : null}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${isSelecionada ? 'text-blue-400' : isAtiva ? 'text-blue-300' : 'text-slate-400'}`}>
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
                            </div>
                            {versao.observacoes && (
                              <div className="mb-1">
                                {versao.observacoes.includes('Atualização de Planilha contratual') ? (
                                  <span className="px-2 py-0.5 bg-blue-900 text-blue-400 rounded text-xs font-semibold">
                                    Atualização de Planilha contratual
                                  </span>
                                ) : versao.observacoes.includes('Atualização de custos') || versao.observacoes.includes('Importação de custos') ? (
                                  <span className="px-2 py-0.5 bg-green-900 text-green-400 rounded text-xs font-semibold">
                                    Atualização de custos
                                  </span>
                                ) : null}
                              </div>
                            )}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevenir que o click no botão dispare o click do card
                          excluirVersao(versao.id);
                        }}
                        disabled={excluindo || !podeExcluir}
                        className={`p-2 rounded-lg transition-colors ${
                          podeExcluir
                            ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20'
                            : 'text-slate-600 cursor-not-allowed opacity-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={podeExcluir ? "Excluir versão" : "Apenas a última versão pode ser excluída"}
                      >
                        {excluindo && versaoParaExcluir === versao.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="text-xs text-slate-500 text-center py-4 w-full">
                {versaoContratualAtiva 
                  ? 'Nenhuma versão de custos orçados encontrada. Clique em "Atualizar da Planilha" para criar a primeira versão.'
                  : 'Nenhuma versão encontrada. Importe uma planilha contratual primeiro.'}
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
          const itensDoNivel = custosItensComTotais.filter((i) => i.nivel === nivel && i.tipo === 'agrupador');
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

      {/* Tabela de Custos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <table className="table-engineering w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 shadow-lg">
                <th className="w-12 bg-slate-900 border-b-2 border-r border-slate-700 py-4"></th>
                <th className={`w-28 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'item' ? 'relative' : ''}`}>
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
                <th className={`min-w-[300px] bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'descricao' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Descrição</span>
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
                <th className={`w-16 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-1 ${filtroAberto === 'unidade' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Un.</span>
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
                <th className="number-cell w-20 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Qtd.</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo MAT (R$/Un)</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo M.O. (R$/Un)</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo Contratos (R$/Un)</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo Eq/Fr (R$/Un)</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Custo Total</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Valor Venda</th>
                <th className="number-cell w-28 bg-slate-900 border-b-2 border-r border-slate-700 text-xs py-4 px-1">Lucro Projetado</th>
                <th className="number-cell w-24 bg-slate-900 border-b-2 border-slate-700 text-xs py-4 px-1">Margem %</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-slate-400">
                    {versaoAtiva ? 'Nenhum item encontrado nesta versão.' : 'Nenhuma versão ativa. Importe uma planilha contratual primeiro.'}
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800 ${item.tipo === 'agrupador' ? 'bg-slate-850' : ''} ${
                      item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
                    }`}
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
                    <td className={`py-1 px-2 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      <span
                        className={`font-mono text-xs ${
                          item.tipo === 'agrupador' ? 'text-blue-400 font-bold' : 'text-slate-300 font-normal'
                        }`}
                        style={{ paddingLeft: `${item.nivel * 12}px` }}
                      >
                        {item.item}
                      </span>
                    </td>
                    <td className={`py-1 px-2 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      <span className={`text-xs ${item.tipo === 'agrupador' ? 'font-semibold text-white' : 'text-slate-300 font-normal'}`}>
                        {item.descricao}
                      </span>
                    </td>
                    <td className={`text-center text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? <span className="text-slate-700">-</span> : <span className="text-slate-300 font-normal">{item.unidade}</span>}
                    </td>
                    <td className={`number-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? <span className="text-slate-700">-</span> : <span className="font-normal">{formatQuantity(item.quantidade)}</span>}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : (
                        <span className="text-amber-400 font-normal">
                          {formatCurrency(item.custoMat)}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : (
                        <span className="text-amber-400 font-normal">
                          {formatCurrency(item.custoMO)}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : (
                        <span className="text-amber-400 font-normal">
                          {formatCurrency(item.custoContratos)}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : (
                        <span className="text-amber-400 font-normal">
                          {formatCurrency(item.custoEqFr)}
                        </span>
                      )}
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      <span className="text-amber-500">
                        {formatCurrency(item.custoTotal)}
                      </span>
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      <span className={item.tipo === 'agrupador' ? 'font-semibold text-white' : 'text-slate-300 font-normal'}>
                        {formatCurrency(item.precoVenda)}
                      </span>
                    </td>
                    <td className={`currency-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                      <span className={getCorPorMargem(item.margem)}>
                        {formatCurrency(item.lucroProjetado)}
                      </span>
                    </td>
                    <td className={`number-cell text-xs py-1 px-1 ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                      <span className={getCorPorMargem(item.margem)}>
                        {formatPercent(item.margem)}
                      </span>
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
                <td colSpan={9} className="py-1 px-1"></td>
                <td className="w-28 currency-cell font-bold text-white py-1 px-1 text-xs whitespace-nowrap">
                  TOTAL GERAL:
                </td>
                <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                  <span className="text-amber-500">
                    {formatCurrency(totalGeral)}
                  </span>
                </td>
                <td className="w-28 currency-cell font-bold text-xs text-white py-1 px-1 whitespace-nowrap">
                  {formatCurrency(totalVenda)}
                </td>
                <td className="w-28 currency-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                  <span className={getCorPorMargem(totalMargem)}>
                    {formatCurrency(totalLucro)}
                  </span>
                </td>
                <td className="w-24 number-cell font-bold text-xs py-1 px-1 whitespace-nowrap">
                  <span className={getCorPorMargem(totalMargem)}>
                    {formatPercent(totalMargem)}
                  </span>
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
            {versoesIniciais
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
            {versoesIniciais.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">
                Nenhuma alteração registrada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
