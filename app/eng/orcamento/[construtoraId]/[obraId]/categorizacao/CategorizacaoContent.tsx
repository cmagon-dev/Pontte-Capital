'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, ChevronRight, ChevronDown, ArrowLeft, X, Layers, GitBranch, CheckCircle, Filter, AlertCircle, Upload, Download, FileSpreadsheet, Trash2, History, Settings, Plus, Edit, Trash2 as TrashIcon, Save } from 'lucide-react';
import { formatQuantity } from '@/lib/utils/format';
import { sincronizarCategorizacaoDaPlanilha, verificarAtualizacoesPlanilhaCategorizacao, buscarCategorizacao, atualizarItemCategorizacao, atualizarItensCategorizacaoEmLote } from '@/app/actions/orcamento';
import { 
  listarEtapas, criarEtapa, atualizarEtapa, excluirEtapa,
  listarSubEtapas, criarSubEtapa, atualizarSubEtapa, excluirSubEtapa,
  listarServicosSimplificados, criarServicoSimplificado, atualizarServicoSimplificado, excluirServicoSimplificado
} from '@/app/actions/categorizacao-listas';
import SearchableSelect from '@/app/components/SearchableSelect';

// --- TIPAGENS ---

type CategorizacaoItemBackend = {
  itemId: string;
  codigo: string;
  discriminacao: string;
  unidade: string | null;
  quantidade: number;
  nivel: number;
  tipo: 'AGRUPADOR' | 'ITEM';
  parentId: string | null;
  referencia: string | null;
  ordem: number | null;
  etapa: string | null;
  subEtapa: string | null;
  servicoSimplificado: string | null;
};

type CategorizacaoItem = {
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
  // Categorização
  etapa: string;
  subEtapa: string;
  servicoSimplificado: string;
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

interface CategorizacaoContentProps {
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
  categorizacao: {
    versaoId: string;
    versaoNumero: number;
    versaoNome: string;
    versaoUpdatedAt: string;
    itens: CategorizacaoItemBackend[];
  } | null;
}

export default function CategorizacaoContent({
  params,
  obra,
  versaoAtiva,
  versaoContratualAtiva,
  versoes: versoesIniciais,
  categorizacao: categorizacaoInicial,
}: CategorizacaoContentProps) {
  
  // Converter itens do backend para formato do componente
  const converterCategorizacaoParaPlanilha = (itens: CategorizacaoItemBackend[] | null | undefined): CategorizacaoItem[] => {
    if (!itens || itens.length === 0) {
      return [];
    }
    
    // Criar mapa de itens por ID
    const itensMap = new Map<string, CategorizacaoItem>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

    // Primeiro, criar todos os itens
    itens.forEach((item, index) => {
      const categorizacaoItem: CategorizacaoItem = {
        id: item.itemId,
        item: item.codigo,
        referencia: item.referencia || '',
        descricao: item.discriminacao,
        unidade: item.unidade || '',
        quantidade: item.quantidade,
        nivel: item.nivel,
        tipo: item.tipo === 'AGRUPADOR' ? 'agrupador' : 'item',
        filhos: [],
        parentId: item.parentId || undefined,
        etapa: item.etapa || '',
        subEtapa: item.subEtapa || '',
        servicoSimplificado: item.servicoSimplificado || '',
      };
      itensMap.set(item.itemId, categorizacaoItem);

      // Mapear filhos com ordem
      if (item.parentId) {
        if (!filhosMap.has(item.parentId)) {
          filhosMap.set(item.parentId, []);
        }
        filhosMap.get(item.parentId)!.push({
          id: item.itemId,
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

    // Fallback: garantir que todos os filhos sejam mapeados
    itensMap.forEach((item) => {
      if (item.tipo === 'agrupador') {
        const filhosEncontrados: Array<{ id: string; ordem: number }> = [];
        itens.forEach((subItem, index) => {
          if (subItem.parentId === item.id) {
            filhosEncontrados.push({
              id: subItem.itemId,
              ordem: subItem.ordem !== null && subItem.ordem !== undefined ? subItem.ordem : index,
            });
          }
        });
        
        if (filhosEncontrados.length > 0) {
          filhosEncontrados.sort((a, b) => {
            const itemA = itensMap.get(a.id);
            const itemB = itensMap.get(b.id);
            if (!itemA || !itemB) return 0;
            
            if (a.ordem !== b.ordem) {
              return a.ordem - b.ordem;
            }
            
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

  const categorizacaoItensIniciais = categorizacaoInicial 
    ? converterCategorizacaoParaPlanilha(categorizacaoInicial.itens) 
    : [];
  
  // Inicializar com níveis recolhidos (Set vazio)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [categorizacaoItens, setCategorizacaoItens] = useState<CategorizacaoItem[]>(categorizacaoItensIniciais);
  const [temAtualizacoes, setTemAtualizacoes] = useState(false);
  const [versaoParaExcluir, setVersaoParaExcluir] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [atualizandoDaPlanilha, setAtualizandoDaPlanilha] = useState(false);
  const [versaoSelecionada, setVersaoSelecionada] = useState<string | null>(
    categorizacaoInicial?.versaoId || versaoAtiva?.id || null
  );
  const [carregandoVersao, setCarregandoVersao] = useState(false);
  const [versaoCarregando, setVersaoCarregando] = useState<string | null>(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState<Map<string, Set<string>>>(new Map());
  const [filtroAberto, setFiltroAberto] = useState<string | null>(null);
  const [elementoFiltro, setElementoFiltro] = useState<HTMLElement | null>(null);
  const [buscaFiltro, setBuscaFiltro] = useState<string>('');

  // Estados para gerenciar listas
  const [mostrarModalLista, setMostrarModalLista] = useState<'etapa' | 'subEtapa' | 'servico' | null>(null);
  const [etapas, setEtapas] = useState<Array<{ id: string; nome: string; ordem: number | null }>>([]);
  const [subEtapas, setSubEtapas] = useState<Array<{ id: string; nome: string; ordem: number | null }>>([]);
  const [servicos, setServicos] = useState<Array<{ id: string; nome: string; ordem: number | null }>>([]);
  const [editandoItem, setEditandoItem] = useState<{ tipo: 'etapa' | 'subEtapa' | 'servico'; id: string; nome: string; ordem: number | null } | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novaOrdem, setNovaOrdem] = useState<number | null>(null);
  const [carregandoListas, setCarregandoListas] = useState(false);

  // Estado para modo de edição
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvandoItem, setSalvandoItem] = useState<string | null>(null);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<Map<string, { etapa: string | null; subEtapa: string | null; servicoSimplificado: string | null }>>(new Map());
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  
  // Estados para edição em massa
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());
  const [mostrarPainelMassa, setMostrarPainelMassa] = useState(false);
  const [etapaMassa, setEtapaMassa] = useState<string>('');
  const [subEtapaMassa, setSubEtapaMassa] = useState<string>('');
  const [servicoMassa, setServicoMassa] = useState<string>('');
  
  // Estados para importação de listas
  const [mostrarImportarLista, setMostrarImportarLista] = useState(false);
  const [arquivoListaImportar, setArquivoListaImportar] = useState<File | null>(null);
  const [importandoLista, setImportandoLista] = useState(false);

  // Carregar listas quando abrir modal ou entrar em modo de edição
  useEffect(() => {
    if (mostrarModalLista || modoEdicao) {
      carregarListas();
    }
  }, [mostrarModalLista, modoEdicao]);

  // Limpar seleção quando sair do modo de edição
  useEffect(() => {
    if (!modoEdicao) {
      setItensSelecionados(new Set());
      setMostrarPainelMassa(false);
    }
  }, [modoEdicao]);

  // Verificar atualizações periodicamente
  useEffect(() => {
    if (!versaoContratualAtiva) return;
    
    const verificar = async () => {
      const resultado = await verificarAtualizacoesPlanilhaCategorizacao(
        params.obraId,
        categorizacaoInicial?.versaoId
      );
      if (resultado.success) {
        setTemAtualizacoes(resultado.temAtualizacoes || false);
      }
    };

    verificar();
    const interval = setInterval(verificar, 5000);
    return () => clearInterval(interval);
  }, [params.obraId, categorizacaoInicial?.versaoId, versaoContratualAtiva]);

  // Função para carregar todas as listas
  const carregarListas = async () => {
    setCarregandoListas(true);
    try {
      const [etapasRes, subEtapasRes, servicosRes] = await Promise.all([
        listarEtapas(),
        listarSubEtapas(),
        listarServicosSimplificados(),
      ]);

      if (etapasRes.success && etapasRes.etapas) {
        setEtapas(etapasRes.etapas);
      }
      if (subEtapasRes.success && subEtapasRes.subEtapas) {
        setSubEtapas(subEtapasRes.subEtapas);
      }
      if (servicosRes.success && servicosRes.servicos) {
        setServicos(servicosRes.servicos);
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error);
    } finally {
      setCarregandoListas(false);
    }
  };

  // Listas com opção "(não categorizado)" para edição em massa
  const etapasComNaoCategorizado = useMemo(() => [
    { id: '__NAO_CATEGORIZADO__', nome: '(não categorizado)', ordem: null },
    ...etapas,
  ], [etapas]);

  const subEtapasComNaoCategorizado = useMemo(() => [
    { id: '__NAO_CATEGORIZADO__', nome: '(não categorizado)', ordem: null },
    ...subEtapas,
  ], [subEtapas]);

  const servicosComNaoCategorizado = useMemo(() => [
    { id: '__NAO_CATEGORIZADO__', nome: '(não categorizado)', ordem: null },
    ...servicos,
  ], [servicos]);

  // Função para abrir modal de edição de lista
  const abrirModalLista = (tipo: 'etapa' | 'subEtapa' | 'servico') => {
    setMostrarModalLista(tipo);
    setEditandoItem(null);
    setNovoNome('');
    setNovaOrdem(null);
  };

  // Função para criar novo item na lista
  const criarItemLista = async () => {
    if (!novoNome.trim() || !mostrarModalLista) return;

    try {
      let resultado;
      if (mostrarModalLista === 'etapa') {
        resultado = await criarEtapa(novoNome.trim(), novaOrdem || undefined);
      } else if (mostrarModalLista === 'subEtapa') {
        resultado = await criarSubEtapa(novoNome.trim(), novaOrdem || undefined);
      } else {
        resultado = await criarServicoSimplificado(novoNome.trim(), novaOrdem || undefined);
      }

      if (resultado.success) {
        await carregarListas();
        setNovoNome('');
        setNovaOrdem(null);
      } else {
        alert(resultado.error || 'Erro ao criar item');
      }
    } catch (error: any) {
      console.error('Erro ao criar item:', error);
      alert(error.message || 'Erro ao criar item');
    }
  };

  // Função para editar item da lista
  const editarItemLista = (item: { id: string; nome: string; ordem: number | null }) => {
    setEditandoItem(item);
    setNovoNome(item.nome);
    setNovaOrdem(item.ordem);
  };

  // Função para salvar edição de item
  const salvarEdicaoItem = async () => {
    if (!editandoItem || !novoNome.trim()) return;

    try {
      let resultado;
      if (editandoItem.tipo === 'etapa') {
        resultado = await atualizarEtapa(editandoItem.id, { nome: novoNome.trim(), ordem: novaOrdem || undefined });
      } else if (editandoItem.tipo === 'subEtapa') {
        resultado = await atualizarSubEtapa(editandoItem.id, { nome: novoNome.trim(), ordem: novaOrdem || undefined });
      } else {
        resultado = await atualizarServicoSimplificado(editandoItem.id, { nome: novoNome.trim(), ordem: novaOrdem || undefined });
      }

      if (resultado.success) {
        await carregarListas();
        setEditandoItem(null);
        setNovoNome('');
        setNovaOrdem(null);
      } else {
        alert(resultado.error || 'Erro ao atualizar item');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar item:', error);
      alert(error.message || 'Erro ao atualizar item');
    }
  };

  // Função para excluir item da lista
  const excluirItemLista = async (id: string, tipo: 'etapa' | 'subEtapa' | 'servico') => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      let resultado;
      if (tipo === 'etapa') {
        resultado = await excluirEtapa(id);
      } else if (tipo === 'subEtapa') {
        resultado = await excluirSubEtapa(id);
      } else {
        resultado = await excluirServicoSimplificado(id);
      }

      if (resultado.success) {
        await carregarListas();
      } else {
        alert(resultado.error || 'Erro ao excluir item');
      }
    } catch (error: any) {
      console.error('Erro ao excluir item:', error);
      alert(error.message || 'Erro ao excluir item');
    }
  };

  // Função para importar lista do Excel
  const importarListaDoExcel = async () => {
    if (!arquivoListaImportar || !mostrarModalLista) {
      alert('Selecione um arquivo para importar');
      return;
    }

    setImportandoLista(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoListaImportar);
      formData.append('tipo', mostrarModalLista);

      const response = await fetch('/api/categorizacao-listas/importar', {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Erro ao importar lista');
      }

      // Mostrar mensagem detalhada
      let mensagem = resultado.message || 'Lista importada com sucesso!';
      if (resultado.erros && resultado.erros.length > 0) {
        mensagem += `\n\nErros encontrados: ${resultado.totalErros || resultado.erros.length}`;
        if (resultado.erros && resultado.erros.length > 0) {
          mensagem += '\n\nPrimeiros erros:\n' + resultado.erros.slice(0, 5).join('\n');
          if (resultado.totalErros > 5) {
            mensagem += `\n\n... e mais ${resultado.totalErros - 5} erro(s). Verifique o console do servidor para detalhes.`;
          }
        }
      }
      
      console.log('Resultado completo da importação:', resultado);
      alert(mensagem);
      await carregarListas();
      setArquivoListaImportar(null);
      setMostrarImportarLista(false);
    } catch (error: any) {
      console.error('Erro ao importar lista:', error);
      console.error('Tipo enviado:', mostrarModalLista);
      alert(error.message || 'Erro ao importar lista');
    } finally {
      setImportandoLista(false);
    }
  };

  // Sincronizar dados quando a versão inicial mudar
  useEffect(() => {
    if (categorizacaoInicial && categorizacaoInicial.versaoId) {
      if (versaoSelecionada === categorizacaoInicial.versaoId) {
        const itensConvertidos = converterCategorizacaoParaPlanilha(categorizacaoInicial.itens);
        setCategorizacaoItens(itensConvertidos);
        setExpandedRows(new Set());
      }
      else if (!versaoSelecionada) {
        setVersaoSelecionada(categorizacaoInicial.versaoId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorizacaoInicial?.versaoId]);

  // Função para carregar uma versão específica
  const carregarVersao = async (versaoId: string) => {
    if (carregandoVersao || versaoSelecionada === versaoId) return;
    
    setCarregandoVersao(true);
    setVersaoCarregando(versaoId);
    try {
      const resultado = await buscarCategorizacao(params.obraId, versaoId);
      if (resultado.success && resultado.versaoId && resultado.itens) {
        const itensConvertidos = converterCategorizacaoParaPlanilha(resultado.itens);
        
        setCategorizacaoItens(itensConvertidos);
        setVersaoSelecionada(versaoId);
        setExpandedRows(new Set());
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
  const itemCorrespondeFiltros = (item: CategorizacaoItem): boolean => {
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
    if (filtros.has('etapa')) {
      const valoresFiltro = filtros.get('etapa')!;
      const etapa = item.etapa || '';
      if (valoresFiltro.size > 0 && !valoresFiltro.has(etapa)) {
        return false;
      }
    }
    if (filtros.has('subEtapa')) {
      const valoresFiltro = filtros.get('subEtapa')!;
      const subEtapa = item.subEtapa || '';
      if (valoresFiltro.size > 0 && !valoresFiltro.has(subEtapa)) {
        return false;
      }
    }
    if (filtros.has('servicoSimplificado')) {
      const valoresFiltro = filtros.get('servicoSimplificado')!;
      const servicoSimplificado = item.servicoSimplificado || '';
      if (valoresFiltro.size > 0 && !valoresFiltro.has(servicoSimplificado)) {
        return false;
      }
    }
    
    return true;
  };

  // Função para encontrar todos os ancestrais de um item
  const encontrarAncestrais = (itemId: string, itensMap: Map<string, CategorizacaoItem>): Set<string> => {
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

  // Função para encontrar todos os descendentes de um item
  const encontrarDescendentes = (itemId: string, itensMap: Map<string, CategorizacaoItem>): Set<string> => {
    const descendentes = new Set<string>();
    const item = itensMap.get(itemId);
    
    if (!item) return descendentes;
    
    const processar = (currentItem: CategorizacaoItem) => {
      if (currentItem.filhos && currentItem.filhos.length > 0) {
        currentItem.filhos.forEach(filhoId => {
          descendentes.add(filhoId);
          const filho = itensMap.get(filhoId);
          if (filho) {
            processar(filho); // Recursivo para pegar todos os níveis
          }
        });
      }
    };
    
    processar(item);
    return descendentes;
  };

  // Função para obter itens visíveis (com hierarquia e filtros)
  const getVisibleItems = (): CategorizacaoItem[] => {
    if (!categorizacaoItens || categorizacaoItens.length === 0) {
      return [];
    }
    
    const itensMap = new Map<string, CategorizacaoItem>();
    categorizacaoItens.forEach(item => {
      itensMap.set(item.id, item);
    });
    
    // Se não há filtros, retornar todos os itens normalmente
    if (filtros.size === 0) {
      const visible: CategorizacaoItem[] = [];
      const processItem = (item: CategorizacaoItem) => {
        visible.push(item);
        if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
          item.filhos.forEach((filhoId) => {
            const filho = itensMap.get(filhoId);
            if (filho) processItem(filho);
          });
        }
      };
      
      let itensRaiz = categorizacaoItens.filter((i) => i.nivel === 0);
      if (itensRaiz.length === 0) {
        itensRaiz = categorizacaoItens.filter((i) => !i.parentId);
      }
      if (itensRaiz.length === 0 && categorizacaoItens.length > 0) {
        const menorNivel = Math.min(...categorizacaoItens.map(i => i.nivel));
        itensRaiz = categorizacaoItens.filter((i) => i.nivel === menorNivel);
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
    categorizacaoItens.forEach(item => {
      if (itemCorrespondeFiltros(item)) {
        itensFiltrados.add(item.id);
      }
    });
    
    // Para cada item filtrado, adicionar todos os seus ancestrais E descendentes
    const itensVisiveis = new Set<string>(itensFiltrados);
    
    // Adicionar ancestrais (para mostrar os pais dos itens filtrados)
    itensFiltrados.forEach(itemId => {
      const ancestrais = encontrarAncestrais(itemId, itensMap);
      ancestrais.forEach(ancestralId => {
        itensVisiveis.add(ancestralId);
      });
    });
    
    // Adicionar descendentes (para mostrar os filhos dos agrupadores filtrados)
    itensFiltrados.forEach(itemId => {
      const item = itensMap.get(itemId);
      if (item && item.tipo === 'agrupador') {
        const descendentes = encontrarDescendentes(itemId, itensMap);
        descendentes.forEach(descendenteId => {
          itensVisiveis.add(descendenteId);
        });
      }
    });
    
    // Processar hierarquia normalmente, mas só incluir itens visíveis
    const visible: CategorizacaoItem[] = [];
    const processItem = (item: CategorizacaoItem) => {
      if (!itensVisiveis.has(item.id)) {
        return;
      }
      
      visible.push(item);
      
      if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
        item.filhos.forEach((filhoId) => {
          const filho = itensMap.get(filhoId);
          if (filho) processItem(filho);
        });
      }
    };
    
    let itensRaiz = categorizacaoItens.filter((i) => i.nivel === 0);
    if (itensRaiz.length === 0) {
      itensRaiz = categorizacaoItens.filter((i) => !i.parentId);
    }
    if (itensRaiz.length === 0 && categorizacaoItens.length > 0) {
      const menorNivel = Math.min(...categorizacaoItens.map(i => i.nivel));
      itensRaiz = categorizacaoItens.filter((i) => i.nivel === menorNivel);
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
    if (filtros.size === 0 || !categorizacaoItens || categorizacaoItens.length === 0) {
      return;
    }

    const itensMap = new Map<string, CategorizacaoItem>();
    categorizacaoItens.forEach(item => {
      itensMap.set(item.id, item);
    });

    const itensFiltrados = new Set<string>();
    categorizacaoItens.forEach(item => {
      if (itemCorrespondeFiltros(item)) {
        itensFiltrados.add(item.id);
      }
    });

    const agrupadoresParaExpandir = new Set<string>();
    
    // Expandir ancestrais dos itens filtrados
    itensFiltrados.forEach(itemId => {
      const ancestrais = encontrarAncestrais(itemId, itensMap);
      ancestrais.forEach(ancestralId => {
        const ancestral = itensMap.get(ancestralId);
        if (ancestral && ancestral.tipo === 'agrupador') {
          agrupadoresParaExpandir.add(ancestralId);
        }
      });
    });
    
    // Expandir os próprios agrupadores filtrados (para mostrar seus filhos)
    itensFiltrados.forEach(itemId => {
      const item = itensMap.get(itemId);
      if (item && item.tipo === 'agrupador') {
        agrupadoresParaExpandir.add(itemId);
      }
    });

    if (agrupadoresParaExpandir.size > 0) {
      setExpandedRows((prev) => {
        const newExpanded = new Set(prev);
        agrupadoresParaExpandir.forEach(id => {
          newExpanded.add(id);
        });
        return newExpanded;
      });
    }
  }, [filtros, categorizacaoItens]);

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
        const itensDoNivel0 = categorizacaoItens.filter((i) => i.nivel === 0 && i.tipo === 'agrupador');
        const todosExpandidos = itensDoNivel0.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel0.forEach((item) => {
            newExpanded.delete(item.id);
          });
          categorizacaoItens.forEach((item) => {
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
          const itensDoNivelAnterior = categorizacaoItens.filter(
            (i) => i.nivel === n && i.tipo === 'agrupador'
          );
          itensDoNivelAnterior.forEach((item) => {
            newExpanded.add(item.id);
          });
        }

        const itensDoNivel = categorizacaoItens.filter(
          (i) => i.nivel === nivel && i.tipo === 'agrupador'
        );
        const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

        if (todosExpandidos) {
          itensDoNivel.forEach((item) => {
            newExpanded.delete(item.id);
          });
          categorizacaoItens.forEach((item) => {
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
    categorizacaoItens.forEach((item) => {
      if (item.tipo === 'agrupador') {
        niveis.add(item.nivel);
      }
    });
    return Array.from(niveis).sort((a, b) => a - b);
  };

  // Funções para filtros
  const obterValoresUnicos = (campo: string): string[] => {
    const valores = new Set<string>();
    categorizacaoItens.forEach((item) => {
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
        case 'etapa':
          valor = item.etapa || '';
          break;
        case 'subEtapa':
          valor = item.subEtapa || '';
          break;
        case 'servicoSimplificado':
          valor = item.servicoSimplificado || '';
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
    if (filtroAberto === campo) {
      setFiltroAberto(null);
      setElementoFiltro(null);
      setBuscaFiltro('');
      return;
    }
    const button = event.currentTarget;
    const th = button.closest('th') as HTMLElement;
    if (th) {
      setElementoFiltro(th);
      setFiltroAberto(campo);
      setBuscaFiltro('');
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
    if (atualizandoDaPlanilha) {
      return;
    }
    setAtualizandoDaPlanilha(true);
    try {
      const resultado = await sincronizarCategorizacaoDaPlanilha(params.obraId);
      if (resultado.success) {
        let mensagem = '';
        if (resultado.novaVersaoCriada) {
          mensagem = `Nova versão de categorização criada por conta de nova planilha contratual!\n\n`;
        }
        if (resultado.itensCriados || resultado.itensAtualizados || resultado.itensExcluidos) {
          mensagem += `Planilha atualizada com sucesso!\n\n` +
            `${resultado.itensCriados || 0} itens criados\n` +
            `${resultado.itensAtualizados || 0} itens atualizados\n` +
            `${resultado.itensExcluidos || 0} itens excluídos`;
        } else {
          mensagem += 'Planilha atualizada com sucesso da planilha contratual!';
        }
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error(resultado.error || 'Erro ao atualizar');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      setAtualizandoDaPlanilha(false);
      alert(error.message || 'Erro ao atualizar da planilha contratual');
    }
  };

  // Função para exportar categorização para Excel
  const exportarCategorizacao = async () => {
    if (!versaoSelecionada) {
      alert('Nenhuma versão selecionada para exportar');
      return;
    }

    try {
      // Exportar a versão selecionada com a categorização atual
      const response = await fetch(`/api/orcamento/exportar-categorizacao?obraId=${params.obraId}&versaoId=${versaoSelecionada}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao exportar categorização');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Buscar o número da versão para incluir no nome do arquivo
      const versao = versoes.find(v => v.id === versaoSelecionada);
      const numeroVersao = versao ? `v${versao.numero}` : 'atual';
      
      a.href = url;
      a.download = `categorizacao-${obra.codigo}-${numeroVersao}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Categorização exportada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao exportar categorização:', error);
      alert(error.message || 'Erro ao exportar categorização');
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
      const response = await fetch('/api/orcamento/excluir-versao-categorizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId: params.obraId,
          versaoId: versaoId,
          permitirQualquerVersao: true,
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

  // Calcular % categorizado da obra
  const calcularPercentualCategorizado = (): number => {
    const itensServico = categorizacaoItens.filter((i) => i.tipo === 'item');
    
    if (itensServico.length === 0) return 0;
    
    const servicosCategorizados = itensServico.filter((item) => {
      return item.etapa || item.subEtapa || item.servicoSimplificado;
    }).length;
    
    return itensServico.length > 0 ? (servicosCategorizados / itensServico.length) * 100 : 0;
  };

  const percentualCategorizado = calcularPercentualCategorizado();

  // Formatar data
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

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Função para atualizar categorização de um item (salva apenas localmente)
  const atualizarCategorizacaoItem = (
    itemId: string,
    etapa: string | null,
    subEtapa: string | null,
    servicoSimplificado: string | null
  ) => {
    // Atualizar o item localmente (visualmente)
    setCategorizacaoItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, etapa: etapa || '', subEtapa: subEtapa || '', servicoSimplificado: servicoSimplificado || '' }
          : item
      )
    );

    // Adicionar às alterações pendentes
    setAlteracoesPendentes((prev) => {
      const novas = new Map(prev);
      novas.set(itemId, { etapa, subEtapa, servicoSimplificado });
      return novas;
    });
  };

  // Funções para edição em massa
  const toggleSelecaoItem = (itemId: string) => {
    setItensSelecionados((prev) => {
      const novoSet = new Set(prev);
      if (novoSet.has(itemId)) {
        novoSet.delete(itemId);
      } else {
        novoSet.add(itemId);
      }
      return novoSet;
    });
  };

  const selecionarTodosVisiveis = () => {
    const itensVisiveis = visibleItems
      .filter((item) => item.tipo === 'item') // Apenas itens (não agrupadores)
      .map((item) => item.id);
    setItensSelecionados(new Set(itensVisiveis));
  };

  const desselecionarTodos = () => {
    setItensSelecionados(new Set());
  };

  const aplicarEdicaoEmMassa = () => {
    if (itensSelecionados.size === 0) {
      alert('Nenhum item selecionado');
      return;
    }

    if (!etapaMassa && !subEtapaMassa && !servicoMassa) {
      alert('Selecione pelo menos uma categoria para aplicar');
      return;
    }

    const qtdSelecionados = itensSelecionados.size;

    // Aplicar categorização para todos os itens selecionados
    itensSelecionados.forEach((itemId) => {
      const item = categorizacaoItens.find((i) => i.id === itemId);
      if (item) {
        // Processar valores: 
        // - Se estiver vazio: manter valor atual
        // - Se for "(não categorizado)": definir como null
        // - Caso contrário: usar o novo valor
        const novaEtapa = etapaMassa 
          ? (etapaMassa === '(não categorizado)' ? null : etapaMassa)
          : item.etapa || null;
        
        const novaSubEtapa = subEtapaMassa 
          ? (subEtapaMassa === '(não categorizado)' ? null : subEtapaMassa)
          : item.subEtapa || null;
        
        const novoServico = servicoMassa 
          ? (servicoMassa === '(não categorizado)' ? null : servicoMassa)
          : item.servicoSimplificado || null;

        atualizarCategorizacaoItem(itemId, novaEtapa, novaSubEtapa, novoServico);
      }
    });

    // Limpar seleção e fechar painel
    setItensSelecionados(new Set());
    setMostrarPainelMassa(false);
    setEtapaMassa('');
    setSubEtapaMassa('');
    setServicoMassa('');

    alert(`${qtdSelecionados} item(ns) atualizado(s)! Clique em "Salvar" para confirmar as alterações.`);
  };

  // Função para salvar todas as alterações pendentes
  const salvarAlteracoesPendentes = async () => {
    // Esta função só é chamada quando há alterações pendentes
    if (alteracoesPendentes.size === 0) {
      console.warn('salvarAlteracoesPendentes chamada sem alterações pendentes');
      setModoEdicao(false);
      return;
    }

    setSalvandoAlteracoes(true);
    try {
      // Preparar array de atualizações para processamento em lote
      const atualizacoes = Array.from(alteracoesPendentes.entries()).map(([itemId, dados]) => ({
        itemId,
        etapa: dados.etapa,
        subEtapa: dados.subEtapa,
        servicoSimplificado: dados.servicoSimplificado,
      }));

      // Informar usuário se houver muitas atualizações
      if (atualizacoes.length > 50) {
        console.log(`⏳ Salvando ${atualizacoes.length} itens em lotes. Isso pode levar alguns segundos...`);
      }

      // Usar atualização em lote (muito mais rápido!)
      const resultado = await atualizarItensCategorizacaoEmLote(params.obraId, atualizacoes);

      if (!resultado.success && resultado.error) {
        alert(`Erro ao salvar alterações: ${resultado.error}`);
        // Não limpa as alterações pendentes para permitir nova tentativa
      } else if (resultado.atualizados > 0) {
        // Mostrar mensagem com ou sem falhas
        const mensagem = resultado.message || `${resultado.atualizados} item(ns) atualizado(s) com sucesso!`;
        alert(mensagem);
        
        setAlteracoesPendentes(new Map()); // Limpar alterações pendentes
        setModoEdicao(false); // Sair do modo de edição
        
        // Salvar estado da interface antes de recarregar
        const estadoSalvo = {
          expandedRows: new Set(expandedRows),
          filtros: new Map(filtros),
          scrollPosition: window.scrollY,
        };
        
        // Recarregar dados da versão selecionada para sincronizar
        if (versaoSelecionada) {
          setCarregandoVersao(true);
          try {
            const resultado = await buscarCategorizacao(params.obraId, versaoSelecionada);
            if (resultado.success && resultado.versaoId && resultado.itens) {
              const itensConvertidos = converterCategorizacaoParaPlanilha(resultado.itens);
              
              // Restaurar dados
              setCategorizacaoItens(itensConvertidos);
              
              // Restaurar estado da interface
              setExpandedRows(estadoSalvo.expandedRows);
              setFiltros(estadoSalvo.filtros);
              
              // Restaurar posição de scroll após um pequeno delay
              setTimeout(() => {
                window.scrollTo(0, estadoSalvo.scrollPosition);
              }, 100);
            }
          } catch (error: any) {
            console.error('Erro ao recarregar dados:', error);
          } finally {
            setCarregandoVersao(false);
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar alterações:', error);
      alert(error.message || 'Erro ao salvar alterações');
    } finally {
      setSalvandoAlteracoes(false);
    }
  };

  // Função para cancelar edição e restaurar dados originais
  const cancelarEdicao = async () => {
    if (alteracoesPendentes.size > 0) {
      const confirmar = confirm(
        `Você tem ${alteracoesPendentes.size} alteração(ões) não salva(s). Deseja realmente sair sem salvar?`
      );
      if (!confirmar) return;
    }

    // Salvar estado da interface antes de recarregar
    const estadoSalvo = {
      expandedRows: new Set(expandedRows),
      filtros: new Map(filtros),
      scrollPosition: window.scrollY,
    };

    // Recarregar dados originais da versão selecionada (restaura tudo)
    if (versaoSelecionada) {
      setCarregandoVersao(true);
      try {
        const resultado = await buscarCategorizacao(params.obraId, versaoSelecionada);
        if (resultado.success && resultado.versaoId && resultado.itens) {
          const itensConvertidos = converterCategorizacaoParaPlanilha(resultado.itens);
          
          // Restaurar dados
          setCategorizacaoItens(itensConvertidos);
          
          // Restaurar estado da interface
          setExpandedRows(estadoSalvo.expandedRows);
          setFiltros(estadoSalvo.filtros);
          
          // Restaurar posição de scroll após um pequeno delay
          setTimeout(() => {
            window.scrollTo(0, estadoSalvo.scrollPosition);
          }, 100);
        }
      } catch (error: any) {
        console.error('Erro ao restaurar dados:', error);
        alert(error.message || 'Erro ao restaurar dados');
      } finally {
        setCarregandoVersao(false);
      }
    }
    
    setAlteracoesPendentes(new Map());
    setModoEdicao(false);
  };

  return (
    <div className="p-8 relative">
      {/* Overlay de loading */}
      {atualizandoDaPlanilha && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 flex flex-col items-center gap-4">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-white text-lg font-semibold">Atualizando planilha de categorização...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Categorização - {obra.codigo}</h1>
            <p className="text-slate-400">Categorização de Etapas, Sub-etapas e Serviços Simplificados</p>
            <p className="text-slate-500 text-sm mt-1">{obra.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de Atualizar da Planilha - PRIMEIRO */}
          <button
            onClick={atualizarDaPlanilhaContratual}
            disabled={
              modoEdicao ||
              atualizandoDaPlanilha || 
              !versaoContratualAtiva || 
              (versaoAtiva !== null && !temAtualizacoes)
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              atualizandoDaPlanilha
                ? 'bg-slate-600 text-white cursor-wait'
                : modoEdicao || !versaoContratualAtiva || (versaoAtiva !== null && !temAtualizacoes)
                  ? 'bg-slate-700 text-white cursor-not-allowed opacity-50'
                  : temAtualizacoes || versaoAtiva === null
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-slate-600 text-white hover:bg-slate-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              modoEdicao
                ? 'Saia do modo de edição primeiro'
                : !versaoContratualAtiva 
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
            onClick={exportarCategorizacao}
            disabled={!versaoSelecionada}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            title={versaoSelecionada ? "Exportar categorização da versão selecionada" : "Selecione uma versão para exportar"}
          >
            <Download className="w-5 h-5" />
            Exportar Categorização
          </button>
        </div>
      </div>


      {/* Painel de Edição em Massa */}
      {mostrarPainelMassa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Edição em Massa - {itensSelecionados.size} item(ns) selecionado(s)
              </h2>
              <button
                onClick={() => {
                  setMostrarPainelMassa(false);
                  setEtapaMassa('');
                  setSubEtapaMassa('');
                  setServicoMassa('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Selecione as categorias que deseja aplicar para todos os itens selecionados. 
              Deixe em branco os campos que não deseja alterar.
            </p>

            <div className="space-y-4 mb-6">
              {/* Etapa */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Etapa (opcional)
                </label>
                <SearchableSelect
                  value={etapaMassa}
                  onChange={setEtapaMassa}
                  options={etapasComNaoCategorizado}
                  placeholder="(não alterar)"
                />
              </div>

              {/* SubEtapa */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  SubEtapa (opcional)
                </label>
                <SearchableSelect
                  value={subEtapaMassa}
                  onChange={setSubEtapaMassa}
                  options={subEtapasComNaoCategorizado}
                  placeholder="(não alterar)"
                />
              </div>

              {/* Serviço Simplificado */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Serviço Simplificado (opcional)
                </label>
                <SearchableSelect
                  value={servicoMassa}
                  onChange={setServicoMassa}
                  options={servicosComNaoCategorizado}
                  placeholder="(não alterar)"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setMostrarPainelMassa(false);
                  setEtapaMassa('');
                  setSubEtapaMassa('');
                  setServicoMassa('');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarEdicaoEmMassa}
                disabled={!etapaMassa && !subEtapaMassa && !servicoMassa}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                <Layers className="w-5 h-5" />
                Aplicar para {itensSelecionados.size} item(ns)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

        {/* Itens Selecionados (aparece apenas em modo de edição) */}
        {modoEdicao && (
          <div className={`border rounded-lg p-3 ${
            itensSelecionados.size > 0
              ? 'bg-blue-900/30 border-blue-600'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex items-start gap-2">
              <div className={`p-1.5 rounded-lg ${
                itensSelecionados.size > 0
                  ? 'bg-blue-800'
                  : 'bg-slate-800'
              }`}>
                <Layers className={`w-4 h-4 ${
                  itensSelecionados.size > 0
                    ? 'text-blue-400'
                    : 'text-slate-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs mb-1 ${
                  itensSelecionados.size > 0
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-400'
                }`}>
                  Edição em Massa
                </p>
                <p className={`text-xs leading-tight ${
                  itensSelecionados.size > 0
                    ? 'text-blue-300 font-medium'
                    : 'text-slate-500'
                }`}>
                  {itensSelecionados.size > 0
                    ? `${itensSelecionados.size} item(ns) selecionado(s)`
                    : 'Nenhum item selecionado'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* % Categorizado da Obra */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">% Categorizado da Obra</p>
          <p className={`text-xl font-bold font-mono ${
            percentualCategorizado === 100 ? 'text-green-400' : 
            percentualCategorizado >= 75 ? 'text-blue-400' : 
            percentualCategorizado >= 50 ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            {formatPercent(percentualCategorizado)}
          </p>
        </div>
        
        {/* Total de Itens */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Total de Itens</p>
          <p className="text-xl font-bold text-white font-mono">
            {categorizacaoItens.filter((i) => i.tipo === 'item').length}
          </p>
        </div>
      </div>

      {/* Versões da Planilha */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Versões da Planilha de Categorização</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {versoesIniciais.length > 0 ? (
              (() => {
                const versoesOrdenadas = [...versoesIniciais].sort((a, b) => b.numero - a.numero);
                const ultimaVersao = versoesOrdenadas[0];
                
                return versoesOrdenadas.map((versao) => {
                  const isAtiva = versao.id === versaoAtiva?.id;
                  const isSelecionada = versao.id === versaoSelecionada;
                  const podeExcluir = versao.id === ultimaVersao.id;
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
                          e.stopPropagation();
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
                  ? 'Nenhuma versão de categorização encontrada. Clique em "Atualizar da Planilha" para criar a primeira versão.'
                  : 'Nenhuma versão encontrada. Importe uma planilha contratual primeiro.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controles de Níveis e Edição */}
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Níveis:
          </span>
          {getNiveisDisponiveis().map((nivel) => {
            const itensDoNivel = categorizacaoItens.filter((i) => i.nivel === nivel && i.tipo === 'agrupador');
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

        {/* Botão de Editar/Salvar - MOVIDO PARA CÁ */}
        <div className="flex items-center gap-2">
          {/* Botão de Cancelar (aparece apenas em modo de edição com alterações) */}
          {modoEdicao && alteracoesPendentes.size > 0 && (
            <button
              onClick={cancelarEdicao}
              disabled={salvandoAlteracoes}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancelar e descartar alterações"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          )}

          <button
            onClick={
              modoEdicao 
                ? (alteracoesPendentes.size > 0 ? salvarAlteracoesPendentes : cancelarEdicao)
                : () => setModoEdicao(true)
            }
            disabled={salvandoAlteracoes}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              salvandoAlteracoes
                ? 'bg-slate-600 text-white cursor-wait'
                : modoEdicao && alteracoesPendentes.size > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : modoEdicao
                    ? 'bg-slate-600 text-white hover:bg-slate-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={
              salvandoAlteracoes
                ? 'Salvando alterações...'
                : modoEdicao && alteracoesPendentes.size > 0
                  ? `Salvar ${alteracoesPendentes.size} alteração(ões)`
                  : modoEdicao
                    ? 'Sair do modo de edição (restaura dados originais)'
                    : 'Ativar modo de edição'
            }
          >
            {salvandoAlteracoes ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : modoEdicao && alteracoesPendentes.size > 0 ? (
              <Save className="w-5 h-5" />
            ) : modoEdicao ? (
              <X className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
            {salvandoAlteracoes
              ? 'Salvando...'
              : modoEdicao && alteracoesPendentes.size > 0
                ? `Salvar (${alteracoesPendentes.size})`
                : modoEdicao
                  ? 'Sair da Edição'
                  : 'Editar Categorização'}
          </button>

          {/* Botão de Edição em Massa (aparece apenas em modo de edição) */}
          {modoEdicao && (
            <button
              onClick={() => setMostrarPainelMassa(true)}
              disabled={itensSelecionados.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={itensSelecionados.size > 0 ? `Editar ${itensSelecionados.size} item(ns) selecionado(s)` : 'Selecione itens para editar em massa'}
            >
              <Layers className="w-5 h-5" />
              {itensSelecionados.size > 0 ? `Editar (${itensSelecionados.size})` : 'Editar em Massa'}
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Categorização */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <table className="table-engineering w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 shadow-lg">
                {/* Coluna de Seleção em Massa */}
                {modoEdicao && (
                  <th className="w-10 bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2">
                    <input
                      type="checkbox"
                      checked={itensSelecionados.size > 0 && itensSelecionados.size === visibleItems.filter(i => i.tipo === 'item').length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selecionarTodosVisiveis();
                        } else {
                          desselecionarTodos();
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                      title="Selecionar/Desselecionar todos"
                    />
                  </th>
                )}
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
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
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
                        {obterValoresUnicos('item')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
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
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
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
                        {obterValoresUnicos('descricao')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
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
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
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
                        {obterValoresUnicos('unidade')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
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
                <th className={`min-w-[200px] bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'etapa' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Etapa</span>
                    <div className="flex items-center gap-1">
                      {modoEdicao && (
                        <button
                          onClick={() => abrirModalLista('etapa')}
                          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                          title="Editar lista de etapas"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => abrirFiltro('etapa', e)}
                        className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                          filtroAberto === 'etapa' || filtros.has('etapa') ? 'text-blue-400' : 'text-slate-500'
                        }`}
                        title="Filtrar Etapa"
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {filtroAberto === 'etapa' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Etapa</h3>
                        <button
                          onClick={() => {
                            setFiltroAberto(null);
                            setElementoFiltro(null);
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="mb-3">
                        <button
                          onClick={() => limparFiltro('etapa')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('etapa')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
                          const valoresSelecionados = filtros.get('etapa') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('etapa', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('etapa') && (filtros.get('etapa')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('etapa')?.size} etapa(s) selecionada(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className={`min-w-[200px] bg-slate-900 border-b-2 border-r border-slate-700 py-4 px-2 ${filtroAberto === 'subEtapa' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Sub-etapa</span>
                    <div className="flex items-center gap-1">
                      {modoEdicao && (
                        <button
                          onClick={() => abrirModalLista('subEtapa')}
                          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                          title="Editar lista de subetapas"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => abrirFiltro('subEtapa', e)}
                        className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                          filtroAberto === 'subEtapa' || filtros.has('subEtapa') ? 'text-blue-400' : 'text-slate-500'
                        }`}
                        title="Filtrar Sub-etapa"
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {filtroAberto === 'subEtapa' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Sub-etapa</h3>
                        <button
                          onClick={() => {
                            setFiltroAberto(null);
                            setElementoFiltro(null);
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="mb-3">
                        <button
                          onClick={() => limparFiltro('subEtapa')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('subEtapa')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
                          const valoresSelecionados = filtros.get('subEtapa') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('subEtapa', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('subEtapa') && (filtros.get('subEtapa')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('subEtapa')?.size} sub-etapa(s) selecionada(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
                <th className={`min-w-[250px] bg-slate-900 border-b-2 border-slate-700 py-4 px-2 ${filtroAberto === 'servicoSimplificado' ? 'relative' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs">Serviço Simplificado</span>
                    <div className="flex items-center gap-1">
                      {modoEdicao && (
                        <button
                          onClick={() => abrirModalLista('servico')}
                          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                          title="Editar lista de serviços"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => abrirFiltro('servicoSimplificado', e)}
                        className={`p-1 hover:bg-slate-700 rounded transition-colors ${
                          filtroAberto === 'servicoSimplificado' || filtros.has('servicoSimplificado') ? 'text-blue-400' : 'text-slate-500'
                        }`}
                        title="Filtrar Serviço Simplificado"
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {filtroAberto === 'servicoSimplificado' && elementoFiltro && (
                    <div className="absolute left-full top-0 ml-2 z-[100] filtro-modal bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Filtrar por Serviço Simplificado</h3>
                        <button
                          onClick={() => {
                            setFiltroAberto(null);
                            setElementoFiltro(null);
                            setBuscaFiltro('');
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mb-3">
                        <input
                          type="text"
                          value={buscaFiltro}
                          onChange={(e) => setBuscaFiltro(e.target.value)}
                          placeholder="Buscar..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      <div className="mb-3">
                        <button
                          onClick={() => limparFiltro('servicoSimplificado')}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Limpar filtro
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {obterValoresUnicos('servicoSimplificado')
                          .filter((valor) => 
                            !buscaFiltro || 
                            (valor || '(vazio)').toLowerCase().includes(buscaFiltro.toLowerCase())
                          )
                          .map((valor) => {
                          const valoresSelecionados = filtros.get('servicoSimplificado') || new Set();
                          const estaSelecionado = valoresSelecionados.has(valor);
                          return (
                            <label
                              key={valor}
                              className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={estaSelecionado}
                                onChange={() => toggleFiltro('servicoSimplificado', valor)}
                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-300 flex-1 truncate" title={valor}>
                                {valor || '(vazio)'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {filtros.has('servicoSimplificado') && (filtros.get('servicoSimplificado')?.size || 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            {filtros.get('servicoSimplificado')?.size} serviço(s) selecionado(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={modoEdicao ? 9 : 8} className="text-center py-8 text-slate-400">
                    {versaoAtiva ? 'Nenhum item encontrado nesta versão.' : 'Nenhuma versão ativa. Importe uma planilha contratual primeiro.'}
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800 ${item.tipo === 'agrupador' ? 'bg-slate-850' : ''} ${
                      item.nivel === 0 ? 'border-t-2 border-slate-700' : ''
                    } ${itensSelecionados.has(item.id) ? 'bg-blue-900 bg-opacity-20' : ''}`}
                  >
                    {/* Coluna de Seleção em Massa */}
                    {modoEdicao && (
                      <td className="py-1 px-2 text-center">
                        {item.tipo === 'item' ? (
                          <input
                            type="checkbox"
                            checked={itensSelecionados.has(item.id)}
                            onChange={() => toggleSelecaoItem(item.id)}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-slate-700">-</span>
                        )}
                      </td>
                    )}
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
                    <td className={`py-1 px-2 text-xs ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao ? (
                        <SearchableSelect
                          value={item.etapa || ''}
                          onChange={(novaEtapa) => {
                            atualizarCategorizacaoItem(item.id, novaEtapa || null, item.subEtapa || null, item.servicoSimplificado || null);
                          }}
                          options={etapas}
                          placeholder="(não categorizado)"
                          disabled={salvandoItem === item.id}
                        />
                      ) : (
                        <span className={item.etapa ? 'text-green-400 font-normal' : 'text-slate-600 font-normal'}>
                          {item.etapa || '(não categorizado)'}
                        </span>
                      )}
                    </td>
                    <td className={`py-1 px-2 text-xs ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao ? (
                        <SearchableSelect
                          value={item.subEtapa || ''}
                          onChange={(novaSubEtapa) => {
                            atualizarCategorizacaoItem(item.id, item.etapa || null, novaSubEtapa || null, item.servicoSimplificado || null);
                          }}
                          options={subEtapas}
                          placeholder="(não categorizado)"
                          disabled={salvandoItem === item.id}
                        />
                      ) : (
                        <span className={item.subEtapa ? 'text-blue-400 font-normal' : 'text-slate-600 font-normal'}>
                          {item.subEtapa || '(não categorizado)'}
                        </span>
                      )}
                    </td>
                    <td className={`py-1 px-2 text-xs ${item.tipo === 'agrupador' ? 'font-bold' : ''}`}>
                      {item.tipo === 'agrupador' ? (
                        <span className="text-slate-700">-</span>
                      ) : modoEdicao ? (
                        <SearchableSelect
                          value={item.servicoSimplificado || ''}
                          onChange={(novoServico) => {
                            atualizarCategorizacaoItem(item.id, item.etapa || null, item.subEtapa || null, novoServico || null);
                          }}
                          options={servicos}
                          placeholder="(não categorizado)"
                          disabled={salvandoItem === item.id}
                        />
                      ) : (
                        <span className={item.servicoSimplificado ? 'text-purple-400 font-normal' : 'text-slate-600 font-normal'}>
                          {item.servicoSimplificado || '(não categorizado)'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
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

      {/* Modal de Edição de Listas */}
      {mostrarModalLista && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Editar Lista de {mostrarModalLista === 'etapa' ? 'Etapas' : mostrarModalLista === 'subEtapa' ? 'SubEtapas' : 'Serviços Simplificados'}
              </h2>
              <button
                onClick={() => {
                  setMostrarModalLista(null);
                  setEditandoItem(null);
                  setNovoNome('');
                  setNovaOrdem(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Botões de importar e baixar modelo */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setMostrarImportarLista(!mostrarImportarLista)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {mostrarImportarLista ? 'Cancelar Importação' : 'Importar do Excel'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/categorizacao-listas/exportar-modelo?tipo=${mostrarModalLista}`);
                      if (!response.ok) {
                        throw new Error('Erro ao baixar modelo');
                      }
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `modelo-${mostrarModalLista === 'etapa' ? 'etapas' : mostrarModalLista === 'subEtapa' ? 'subetapas' : 'servicos'}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error: any) {
                      console.error('Erro ao baixar modelo:', error);
                      alert(error.message || 'Erro ao baixar modelo');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                  title="Baixar modelo do Excel"
                >
                  <Download className="w-4 h-4" />
                  Baixar Modelo
                </button>
              </div>

              {/* Formulário de importar */}
              {mostrarImportarLista && (
                <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-2">Importar do Excel</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    O arquivo deve conter as colunas: <strong>Nome</strong> e <strong>Ordem</strong> (opcional)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setArquivoListaImportar(e.target.files?.[0] || null)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <button
                      onClick={importarListaDoExcel}
                      disabled={!arquivoListaImportar || importandoLista}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded text-white text-sm flex items-center gap-1"
                    >
                      {importandoLista ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Importar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário de criar/editar */}
              <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-2">
                  {editandoItem ? 'Editar Item' : 'Adicionar Novo Item'}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  />
                  <input
                    type="number"
                    value={novaOrdem || ''}
                    onChange={(e) => setNovaOrdem(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Ordem"
                    className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                  />
                  {editandoItem ? (
                    <>
                      <button
                        onClick={salvarEdicaoItem}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditandoItem(null);
                          setNovoNome('');
                          setNovaOrdem(null);
                        }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={criarItemLista}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de itens */}
              {carregandoListas ? (
                <div className="text-center py-8 text-slate-400">Carregando...</div>
              ) : (
                <div className="space-y-2">
                  {(mostrarModalLista === 'etapa' ? etapas : mostrarModalLista === 'subEtapa' ? subEtapas : servicos).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-slate-800 rounded border border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-white">{item.nome}</div>
                        {item.ordem !== null && (
                          <div className="text-xs text-slate-400">Ordem: {item.ordem}</div>
                        )}
                      </div>
                      <button
                        onClick={() => editarItemLista({ ...item, tipo: mostrarModalLista })}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluirItemLista(item.id, mostrarModalLista)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(mostrarModalLista === 'etapa' ? etapas : mostrarModalLista === 'subEtapa' ? subEtapas : servicos).length === 0 && (
                    <div className="text-center py-8 text-slate-400">Nenhum item cadastrado</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
