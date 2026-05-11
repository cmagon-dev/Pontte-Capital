'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Eye, 
  EyeOff,
  Trash2,
  Settings,
  Layers,
  Edit2,
  Save,
  X,
  ChevronsDown,
  ChevronsUp,
  Eraser,
  Loader2,
  CheckCircle,
  Lock,
  AlertCircle,
  Info,
  Download
} from 'lucide-react';
import { formatCurrency, formatQuantity, formatNumber, formatPercent } from '@/lib/utils/format';
import {
  buscarPrevisoesPorObra,
  criarPrevisaoMedicao,
  atualizarPrevisaoMedicao,
  deletarPrevisaoMedicao,
  substituirItensMedicao,
  concluirPrevisaoMedicao,
  type PrevisaoMedicao as PrevisaoMedicaoDB,
  type ItemPrevisaoMedicao,
} from '@/lib/api/previsoes-medicao-client';
import VisaoGerencialMedicoes from './VisaoGerencialMedicoes';
import BadgeAlteracao from './components/BadgeAlteracao';
import ModalAnaliseVersao from './components/ModalAnaliseVersao';
import ModalComparacaoVersoes from './components/ModalComparacaoVersoes';
import ModalHistoricoAditivos from './components/ModalHistoricoAditivos';
import ModalExportarMedicoes from './components/ModalExportarMedicoes';

// --- TIPAGENS ---

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
  ordem: number | null;
};

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

type Medicao = {
  id: string;
  nome: string;
  dataPrevisao: string;
  numero: number; // Número sequencial da medição (1ª, 2ª, 3ª...)
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

interface PrevisoesMedicoesContentProps {
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
    itens: Array<ItemVersao>;
  };
  versaoCategorizacao?: {
    id: string;
    itens: Array<{
      id: string;
      codigo: string;
      etapa: string | null;
      subEtapa: string | null;
      servicoSimplificado: string | null;
    }>;
  } | null;
  versaoVisaoGerencial?: {
    id: string;
    nome: string;
    itens: Array<any>; // Será tipado depois
  } | null;
}

export default function PrevisoesMedicoesContent({
  params,
  obra,
  versaoAtiva,
  versaoCategorizacao,
  versaoVisaoGerencial,
}: PrevisoesMedicoesContentProps) {
  
  // Estados
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [todasMedicoesVisiveis, setTodasMedicoesVisiveis] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [valoresMedicoes, setValoresMedicoes] = useState<Map<string, Map<string, ValorMedicao>>>(new Map());
  const [mostrarModalNovaMedicao, setMostrarModalNovaMedicao] = useState(false);
  const [nomeMedicao, setNomeMedicao] = useState('');
  const [dataMedicao, setDataMedicao] = useState(new Date().toISOString().split('T')[0]);
  const [valoresDigitacao, setValoresDigitacao] = useState<Map<string, string>>(new Map());
  const [medicaoEditando, setMedicaoEditando] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [dataEdicao, setDataEdicao] = useState('');
  const [dataRealMedicao, setDataRealMedicao] = useState('');
  const [acumuladoVisivel, setAcumuladoVisivel] = useState(true);
  const [celulaEditando, setCelulaEditando] = useState<{ itemId: string; medicaoId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [previsoesBanco, setPrevisoesBanco] = useState<PrevisaoMedicaoDB[]>([]);
  const [mostrarModalConcluir, setMostrarModalConcluir] = useState(false);
  const [medicaoParaConcluir, setMedicaoParaConcluir] = useState<string | null>(null);
  const [modoRevisaoFinal, setModoRevisaoFinal] = useState(false);
  
  // Estados para controle de versionamento
  const [versaoSelecionada, setVersaoSelecionada] = useState(versaoAtiva.id);
  const [novaVersaoDetectada, setNovaVersaoDetectada] = useState(false);
  const [versaoAnterior, setVersaoAnterior] = useState<string | null>(null);
  const [mapeamentoAlteracoes, setMapeamentoAlteracoes] = useState<Map<string, any>>(new Map());
  const [recalculando, setRecalculando] = useState(false);
  
  // Estados para modal de análise
  const [modalAnaliseAberto, setModalAnaliseAberto] = useState(false);
  const [dadosAnalise, setDadosAnalise] = useState<any>(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  
  // Estados para modal de comparação
  const [modalComparacaoAberto, setModalComparacaoAberto] = useState(false);
  
  // Estados para modal de histórico
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [dadosHistorico, setDadosHistorico] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  
  // Estados para modal de exportação
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);

  // Converter itens do banco para formato do componente
  const converterItensParaPlanilha = (itens: ItemVersao[]): PlanilhaItem[] => {
    if (!itens || itens.length === 0) return [];
    
    const itensMap = new Map<string, PlanilhaItem>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

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

      if (item.parentId) {
        if (!filhosMap.has(item.parentId)) {
          filhosMap.set(item.parentId, []);
        }
        filhosMap.get(item.parentId)!.push({
          id: item.id,
          ordem: item.ordem !== null && item.ordem !== undefined ? item.ordem : index,
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

    return Array.from(itensMap.values());
  };

  const planilhaItens = useMemo(() => converterItensParaPlanilha(versaoAtiva.itens), [versaoAtiva.itens]);

  // Criar Map de categorização usando CÓDIGO como chave (não ID)
  // Isso permite mapear entre ItemOrcamento, ItemCategorizacao e ItemCustoOrcado
  const mapCategorizacaoPorCodigo = useMemo(() => {
    const map = new Map<string, { etapa: string; subEtapa: string; servicoSimplificado: string }>();
    
    if (versaoCategorizacao?.itens) {
      versaoCategorizacao.itens.forEach(item => {
        map.set(item.codigo, {
          etapa: item.etapa || '',
          subEtapa: item.subEtapa || '',
          servicoSimplificado: item.servicoSimplificado || ''
        });
      });
    }
    
    return map;
  }, [versaoCategorizacao]);

  // Criar Map de ID → Código para facilitar lookup
  const mapIdParaCodigo = useMemo(() => {
    const map = new Map<string, string>();
    
    versaoAtiva.itens.forEach(item => {
      map.set(item.id, item.codigo);
    });
    
    return map;
  }, [versaoAtiva.itens]);

  // Criar Map de Código → ID (inverso) para buscar valores na EAP Gerencial
  const mapCodigoParaId = useMemo(() => {
    const map = new Map<string, string>();
    
    versaoAtiva.itens.forEach(item => {
      map.set(item.codigo, item.id);
    });
    
    return map;
  }, [versaoAtiva.itens]);

  // Carregar previsões do banco ao montar
  useEffect(() => {
    carregarPrevisoesDoBanco();
  }, [obra.id]);

  // Detectar nova versão de orçamento
  useEffect(() => {
    const verificarNovaVersao = async () => {
      if (previsoesBanco.length === 0) return;
      
      // Pegar versão da primeira medição (referência)
      const versaoReferencia = previsoesBanco[0]?.versaoOrcamentoId;
      
      if (versaoReferencia && versaoReferencia !== versaoAtiva.id) {
        setNovaVersaoDetectada(true);
        setVersaoAnterior(versaoReferencia);
        
        // Carregar mapeamento de alterações
        try {
          const { criarMapeamentoVersoes } = await import('@/app/actions/versoes-medicao');
          const mapeamento = await criarMapeamentoVersoes(versaoReferencia, versaoAtiva.id);
          
          // Criar Map usando código como chave
          const mapaAlteracoes = new Map();
          mapeamento.forEach((item: any) => {
            mapaAlteracoes.set(item.codigo, item);
          });
          
          setMapeamentoAlteracoes(mapaAlteracoes);
        } catch (error) {
          console.error('Erro ao carregar mapeamento de versões:', error);
        }
      }
    };
    
    verificarNovaVersao();
  }, [previsoesBanco, versaoAtiva.id]);

  async function carregarPrevisoesDoBanco() {
    try {
      setLoading(true);
      const previsoes = await buscarPrevisoesPorObra(obra.id);
      setPrevisoesBanco(previsoes);

      if (previsoes.length > 0) {
        // Converter previsões do banco para formato do componente
        const medicoesConvertidas: Medicao[] = previsoes.map((prev, idx) => ({
          id: prev.id,
          nome: prev.nome,
          dataPrevisao: typeof prev.dataPrevisao === 'string' 
            ? prev.dataPrevisao.split('T')[0] 
            : new Date(prev.dataPrevisao).toISOString().split('T')[0],
          numero: prev.numero,
          ordem: prev.ordem,
          visivel: true,
          tipo: prev.tipo === 'QUANTIDADE' ? 'quantidade' : 'percentual',
          status: prev.status,
        }));

        setMedicoes(medicoesConvertidas);

        // Carregar valores das medições
        const novosValores = new Map<string, Map<string, ValorMedicao>>();
        
        previsoes.forEach((previsao) => {
          if (previsao.itens) {
            previsao.itens.forEach((item) => {
              const itemOrcamentoId = item.itemOrcamentoId || item.itemCustoOrcadoId;
              if (!itemOrcamentoId) return;

              if (!novosValores.has(itemOrcamentoId)) {
                novosValores.set(itemOrcamentoId, new Map());
              }

              const medicoesItem = novosValores.get(itemOrcamentoId)!;
              
              medicoesItem.set(previsao.id, {
                quantidade: Number(item.quantidadePrevista || 0),
                percentual: Number(item.percentualPrevisto || 0),
                valorTotal: Number(item.valorPrevisto || 0),
                percentualTotal: Number(item.percentualPrevisto || 0),
              });
            });
          }
        });

        setValoresMedicoes(novosValores);
      } else {
        // Se não há previsões, deixar vazio (usuário adiciona manualmente)
        setMedicoes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar previsões:', error);
      // Em caso de erro, deixar vazio
      setMedicoes([]);
    } finally {
      setLoading(false);
    }
  }

  // Calcular totais dos agrupadores
  const calcularTotalAgrupador = (item: PlanilhaItem): number => {
    if (item.tipo === 'item') {
      return item.precoTotal;
    }
    
    let total = 0;
    item.filhos.forEach((filhoId) => {
      const filho = planilhaItens.find((i) => i.id === filhoId);
      if (filho) {
        total += calcularTotalAgrupador(filho);
      }
    });
    return total;
  };

  const planilhaItensComTotais = useMemo(() => {
    return planilhaItens.map((item) => ({
      ...item,
      precoTotal: item.tipo === 'agrupador' ? calcularTotalAgrupador(item) : item.precoTotal,
    }));
  }, [planilhaItens]);

  // Visibilidade dos itens
  const isRowVisible = (item: PlanilhaItem): boolean => {
    if (item.nivel === 0) return true;
    
    let current = item;
    while (current.parentId) {
      const parent = planilhaItens.find((i) => i.id === current.parentId);
      if (!parent || !expandedRows.has(parent.id)) {
        return false;
      }
      current = parent;
    }
    return true;
  };

  const visibleItems = useMemo(() => {
    const itensRaiz = planilhaItensComTotais.filter((item) => item.nivel === 0);
    const resultado: PlanilhaItem[] = [];

    const adicionarItemEFilhos = (item: PlanilhaItem) => {
      resultado.push(item);
      
      if (item.tipo === 'agrupador' && expandedRows.has(item.id)) {
        item.filhos.forEach((filhoId) => {
          const filho = planilhaItensComTotais.find((i) => i.id === filhoId);
          if (filho) {
            adicionarItemEFilhos(filho);
          }
        });
      }
    };

    itensRaiz.forEach((item) => adicionarItemEFilhos(item));
    return resultado;
  }, [planilhaItensComTotais, expandedRows]);

  // Funções
  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
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

  const expandirTodos = () => {
    const todosIds = planilhaItensComTotais
      .filter((item) => item.tipo === 'agrupador')
      .map((item) => item.id);
    setExpandedRows(new Set(todosIds));
  };

  const recolherTodos = () => {
    setExpandedRows(new Set());
  };

  const adicionarMedicao = async () => {
    try {
      setSalvando(true);

      // Calcular próximo número sequencial
      const proximoNumero = medicoes.length > 0 
        ? Math.max(...medicoes.map(m => m.numero || m.ordem)) + 1 
        : 1;
      
      // Gerar nome automático (1ª Medição, 2ª Medição, etc.)
      const nomeAutomatico = `${proximoNumero}ª Medição`;

      // Criar previsão no banco
      const novaPrevisao = await criarPrevisaoMedicao({
        obraId: obra.id,
        nome: nomeAutomatico,
        dataPrevisao: dataMedicao,
        ordem: proximoNumero,
        tipo: 'PERCENTUAL',
        versaoOrcamentoId: versaoAtiva.id,
        itens: [], // Começa sem itens, serão adicionados ao editar
      });

      // Adicionar à lista local
      const novaMedicao: Medicao = {
        id: novaPrevisao.id,
        nome: novaPrevisao.nome,
        dataPrevisao: typeof novaPrevisao.dataPrevisao === 'string'
          ? novaPrevisao.dataPrevisao.split('T')[0]
          : new Date(novaPrevisao.dataPrevisao).toISOString().split('T')[0],
        numero: novaPrevisao.numero,
        ordem: novaPrevisao.ordem,
        visivel: true,
        tipo: novaPrevisao.tipo === 'QUANTIDADE' ? 'quantidade' : 'percentual',
      };

      setMedicoes([...medicoes, novaMedicao]);
      setMostrarModalNovaMedicao(false);
      setDataMedicao(new Date().toISOString().split('T')[0]);

      // Recarregar previsões do banco
      await carregarPrevisoesDoBanco();
    } catch (error: any) {
      console.error('Erro ao adicionar medição:', error);
      alert('Erro ao adicionar medição: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };

  const alterarTipoMedicao = (medicaoId: string, novoTipo: 'percentual' | 'quantidade') => {
    setMedicoes(medicoes.map(m => 
      m.id === medicaoId ? { ...m, tipo: novoTipo } : m
    ));
  };

  const iniciarEdicaoMedicao = (medicao: Medicao) => {
    // Verificar se medição está concluída
    const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
    if (previsaoBanco?.status === 'REALIZADA') {
      alert('❌ Não é possível editar uma medição concluída!\n\n🔒 Esta medição está bloqueada.');
      return;
    }

    setMedicaoEditando(medicao.id);
    setDataEdicao(medicao.dataPrevisao);
    // Inicializar data real com a data de hoje
    setDataRealMedicao(new Date().toISOString().split('T')[0]);
  };

  const salvarEdicaoMedicao = async () => {
    if (!medicaoEditando) return;
    
    try {
      setSalvando(true);

      const medicao = medicoes.find(m => m.id === medicaoEditando);
      if (!medicao) return;

      // Atualizar data se foi alterada
      if (dataEdicao && !medicao.id.startsWith('temp-')) {
        await atualizarPrevisaoMedicao(medicao.id, {
          dataPrevisao: dataEdicao,
        });
      }

      // Salvar todos os valores da medição no banco
      await salvarMedicaoEspecifica(medicao.id);

      // Recarregar dados do banco
      await carregarPrevisoesDoBanco();
      
      setMedicaoEditando(null);
      setDataEdicao('');
      
      alert(`${medicao.nome} salva com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao salvar edição: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };

  const cancelarEdicaoMedicao = async () => {
    try {
      // Recarregar dados do banco para descartar alterações locais
      await carregarPrevisoesDoBanco();
      
      setMedicaoEditando(null);
      setDataEdicao('');
    } catch (error) {
      console.error('Erro ao cancelar edição:', error);
      setMedicaoEditando(null);
      setDataEdicao('');
    }
  };

  const removerMedicao = async (id: string) => {
    // Verificar se medição está concluída
    const previsaoBanco = previsoesBanco.find(p => p.id === id);
    if (previsaoBanco?.status === 'REALIZADA') {
      alert('❌ Não é possível remover uma medição concluída!\n\n🔒 Esta medição está bloqueada.');
      return;
    }

    if (confirm('Deseja realmente remover esta medição?')) {
      try {
        setSalvando(true);

        // Se não for uma medição temporária, deletar do banco
        if (!id.startsWith('temp-')) {
          await deletarPrevisaoMedicao(id);
        }

        setMedicoes(medicoes.filter(m => m.id !== id));
        
        // Remover valores desta medição
        const novosValores = new Map(valoresMedicoes);
        novosValores.forEach((medicoesItem) => {
          medicoesItem.delete(id);
        });
        setValoresMedicoes(novosValores);

        // Recarregar previsões do banco
        await carregarPrevisoesDoBanco();
      } catch (error: any) {
        console.error('Erro ao remover medição:', error);
        alert('Erro ao remover medição: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setSalvando(false);
      }
    }
  };

  const limparMedicao = (id: string) => {
    if (confirm('Deseja realmente zerar todos os valores desta medição?')) {
      const novosValores = new Map(valoresMedicoes);
      
      // Zerar todos os valores da medição
      novosValores.forEach((medicoesItem) => {
        if (medicoesItem.has(id)) {
          medicoesItem.set(id, {
            quantidade: 0,
            percentual: 0,
            valorTotal: 0,
            percentualTotal: 0,
          });
        }
      });
      
      setValoresMedicoes(novosValores);
    }
  };

  const toggleVisibilidadeMedicao = (id: string) => {
    setMedicoes(medicoes.map(m => 
      m.id === id ? { ...m, visivel: !m.visivel } : m
    ));
  };

  const toggleTodasMedicoes = () => {
    const novoEstado = !todasMedicoesVisiveis;
    setTodasMedicoesVisiveis(novoEstado);
    setMedicoes(medicoes.map(m => ({ ...m, visivel: novoEstado })));
  };

  const atualizarValorMedicao = (itemId: string, medicaoId: string, campo: 'quantidade' | 'percentual', valor: number) => {
    const item = planilhaItensComTotais.find(i => i.id === itemId);
    if (!item || item.tipo === 'agrupador') return;

    // Validar se valor negativo causaria acumulado negativo
    if (valor < 0) {
      const validacao = validarMedicaoNegativa(item, medicaoId, valor, campo);
      if (!validacao.valido) {
        alert(`❌ Medição Negativa Inválida\n\n${validacao.mensagem}`);
        return;
      }
    }

    const novosValores = new Map(valoresMedicoes);
    if (!novosValores.has(itemId)) {
      novosValores.set(itemId, new Map());
    }

    const medicoesItem = novosValores.get(itemId)!;

    if (campo === 'quantidade') {
      // Permitir valores negativos (desmedição)
      const novaQuantidade = valor;
      const novoPercentual = item.quantidade > 0 ? (novaQuantidade / item.quantidade) * 100 : 0;
      const novoValorTotal = item.quantidade > 0 ? (item.precoTotal / item.quantidade) * novaQuantidade : 0;
      const novoPercentualTotal = item.precoTotal > 0 ? (novoValorTotal / item.precoTotal) * 100 : 0;

      medicoesItem.set(medicaoId, {
        quantidade: novaQuantidade,
        percentual: novoPercentual,
        valorTotal: novoValorTotal,
        percentualTotal: novoPercentualTotal,
      });
    } else {
      // Permitir valores negativos (desmedição)
      const novoPercentual = valor;
      const novaQuantidade = (item.quantidade * novoPercentual) / 100;
      const novoValorTotal = (item.precoTotal * novoPercentual) / 100;
      const novoPercentualTotal = novoPercentual;

      medicoesItem.set(medicaoId, {
        quantidade: novaQuantidade,
        percentual: novoPercentual,
        valorTotal: novoValorTotal,
        percentualTotal: novoPercentualTotal,
      });
    }

    setValoresMedicoes(novosValores);
  };

  // Função para salvar uma medição específica (usada internamente)
  const salvarMedicaoEspecifica = async (medicaoId: string, mostrarAlert: boolean = false) => {
    const medicao = medicoes.find(m => m.id === medicaoId);
    if (!medicao) return;

    // Se for temporária, criar no banco primeiro
    if (medicao.id.startsWith('temp-')) {
      const novaPrevisao = await criarPrevisaoMedicao({
        obraId: obra.id,
        nome: medicao.nome,
        dataPrevisao: medicao.dataPrevisao,
        ordem: medicao.ordem,
        tipo: medicao.tipo === 'quantidade' ? 'QUANTIDADE' : 'PERCENTUAL',
        versaoOrcamentoId: versaoAtiva.id,
        itens: [],
      });

      // Atualizar ID local
      const medicaoIndex = medicoes.findIndex(m => m.id === medicao.id);
      if (medicaoIndex !== -1) {
        medicoes[medicaoIndex].id = novaPrevisao.id;
        medicoes[medicaoIndex].numero = novaPrevisao.numero;
      }
      medicao.id = novaPrevisao.id;
      medicao.numero = novaPrevisao.numero;
    }

    // Coletar todos os itens com valores para esta medição
    const itensParaSalvar: any[] = [];

    valoresMedicoes.forEach((medicoesItem, itemId) => {
      const valor = medicoesItem.get(medicao.id);
      if (valor && (valor.quantidade > 0 || valor.percentual > 0 || valor.valorTotal > 0)) {
        // Buscar código do item e depois a categorização usando o código
        const codigoItem = mapIdParaCodigo.get(itemId);
        const categorizacao = codigoItem ? mapCategorizacaoPorCodigo.get(codigoItem) : undefined;
        
        itensParaSalvar.push({
          itemOrcamentoId: itemId,
          itemCustoOrcadoId: itemId,
          quantidadePrevista: valor.quantidade,
          percentualPrevisto: valor.percentual,
          valorPrevisto: valor.valorTotal,
          // Adicionar campos de categorização
          etapa: categorizacao?.etapa || null,
          subEtapa: categorizacao?.subEtapa || null,
          servicoSimplificado: categorizacao?.servicoSimplificado || null,
        });
      }
    });

    // Substituir os itens existentes pelos novos (deleta e recria)
    if (itensParaSalvar.length > 0) {
      await substituirItensMedicao(medicao.id, itensParaSalvar, medicao.numero);
    }
  };

  // Funções para concluir medições
  const iniciarConclusaoMedicao = () => {
    setMostrarModalConcluir(true);
  };

  const selecionarMedicaoParaConcluir = (medicaoId: string) => {
    setMedicaoParaConcluir(medicaoId);
    setMostrarModalConcluir(false);
    setModoRevisaoFinal(true);
    // Ativar edição automaticamente para permitir revisão
    setMedicaoEditando(medicaoId);
    const medicao = medicoes.find(m => m.id === medicaoId);
    if (medicao) {
      setDataEdicao(medicao.dataPrevisao);
    }
  };

  const cancelarRevisaoFinal = async () => {
    // Recarregar dados do banco para descartar alterações
    await carregarPrevisoesDoBanco();
    setModoRevisaoFinal(false);
    setMedicaoParaConcluir(null);
    setMedicaoEditando(null);
    setDataEdicao('');
  };

  const concluirMedicaoFinal = async () => {
    if (!medicaoParaConcluir) return;

    const medicao = medicoes.find(m => m.id === medicaoParaConcluir);
    if (!medicao) return;

    // Confirmar ação
    const confirmacao = confirm(
      `⚠️ ATENÇÃO!\n\nVocê está prestes a concluir a "${medicao.nome}".\n\n` +
      `Após a conclusão:\n` +
      `✅ Os valores serão salvos no banco\n` +
      `🔒 A medição será BLOQUEADA para edição\n` +
      `❌ NÃO será mais possível alterar\n\n` +
      `Deseja realmente concluir?`
    );

    if (!confirmacao) return;

    try {
      setSalvando(true);

      // 1. Salvar os valores editados (se houver)
      await salvarMedicaoEspecifica(medicaoParaConcluir);

      // 2. Marcar medição como REALIZADA (concluída) com data real
      await concluirPrevisaoMedicao(medicaoParaConcluir, dataRealMedicao || new Date().toISOString());

      // 3. Recarregar dados do banco
      await carregarPrevisoesDoBanco();

      // 4. Sair do modo de revisão
      setModoRevisaoFinal(false);
      setMedicaoParaConcluir(null);
      setDataRealMedicao('');

      alert(`✅ ${medicao.nome} foi concluída com sucesso!\n\n🔒 Esta medição está agora bloqueada para edição.`);
    } catch (error: any) {
      console.error('Erro ao concluir medição:', error);
      alert('Erro ao concluir medição: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSalvando(false);
    }
  };

  // Funções de formatação para digitação
  const formatarParaDigitacao = (valor: string, forcaNegativo: boolean = false): string => {
    // Detecta se tem sinal negativo
    const temNegativo = valor.startsWith('-') || forcaNegativo;
    
    // Remove tudo exceto números
    let apenasNumeros = valor.replace(/[^\d]/g, '');
    
    if (!apenasNumeros) {
      return temNegativo ? '-0,00' : '0,00';
    }
    
    // Remove zeros à esquerda
    apenasNumeros = apenasNumeros.replace(/^0+/, '') || '0';
    
    // Garante pelo menos 3 dígitos (para ter centavos)
    while (apenasNumeros.length < 3) {
      apenasNumeros = '0' + apenasNumeros;
    }
    
    // Separa inteiro e decimal
    const parteInteira = apenasNumeros.slice(0, -2);
    const parteDecimal = apenasNumeros.slice(-2);
    
    // Adiciona pontos de milhar
    const inteiroFormatado = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    const valorFinal = `${inteiroFormatado},${parteDecimal}`;
    return temNegativo ? `-${valorFinal}` : valorFinal;
  };

  const converterParaNumero = (valorFormatado: string): number => {
    // Detecta se é negativo
    const isNegativo = valorFormatado.startsWith('-');
    
    // Remove pontos de milhar, sinal negativo, e substitui vírgula por ponto
    const valorLimpo = valorFormatado.replace(/[-.]/g, '').replace(',', '.');
    const numero = parseFloat(valorLimpo) || 0;
    
    return isNegativo ? -numero : numero;
  };

  const obterValorDigitacao = (itemId: string, medicaoId: string, tipo: 'quantidade' | 'percentual'): string => {
    const chave = `${itemId}-${medicaoId}-${tipo}`;
    return valoresDigitacao.get(chave) || '';
  };

  const setValorDigitacao = (itemId: string, medicaoId: string, tipo: 'quantidade' | 'percentual', valor: string) => {
    const chave = `${itemId}-${medicaoId}-${tipo}`;
    const novosValores = new Map(valoresDigitacao);
    novosValores.set(chave, valor);
    setValoresDigitacao(novosValores);
  };

  const limparValorDigitacao = (itemId: string, medicaoId: string, tipo: 'quantidade' | 'percentual') => {
    const chave = `${itemId}-${medicaoId}-${tipo}`;
    const novosValores = new Map(valoresDigitacao);
    novosValores.delete(chave);
    setValoresDigitacao(novosValores);
  };

  const obterValorMedicao = (itemId: string, medicaoId: string): ValorMedicao => {
    return valoresMedicoes.get(itemId)?.get(medicaoId) || {
      quantidade: 0,
      percentual: 0,
      valorTotal: 0,
      percentualTotal: 0,
    };
  };

  // Calcular totais de medição para agrupadores
  const calcularTotalMedicaoAgrupador = (agrupador: PlanilhaItem, medicaoId: string): ValorMedicao => {
    let totalValor = 0;
    let totalQuantidade = 0;
    
    const calcularFilhos = (itemId: string) => {
      const item = planilhaItensComTotais.find(i => i.id === itemId);
      if (!item) return;
      
      if (item.tipo === 'item') {
        const valorMedicao = obterValorMedicao(item.id, medicaoId);
        totalValor += valorMedicao.valorTotal;
        totalQuantidade += valorMedicao.quantidade;
      } else if (item.tipo === 'agrupador') {
        item.filhos.forEach(filhoId => calcularFilhos(filhoId));
      }
    };
    
    agrupador.filhos.forEach(filhoId => calcularFilhos(filhoId));
    
    const percentualTotal = agrupador.precoTotal > 0 ? (totalValor / agrupador.precoTotal) * 100 : 0;
    const percentualQuantidade = agrupador.quantidade > 0 ? (totalQuantidade / agrupador.quantidade) * 100 : 0;
    
    return {
      quantidade: totalQuantidade,
      percentual: percentualQuantidade,
      valorTotal: totalValor,
      percentualTotal: percentualTotal,
    };
  };

  // Calcular valores acumulados (soma de todas as medições)
  const calcularValorAcumulado = (item: PlanilhaItem): ValorMedicao => {
    let totalQuantidade = 0;
    let totalValor = 0;
    
    if (item.tipo === 'item') {
      // Para itens, soma todas as medições
      medicoes.forEach((medicao) => {
        const valor = obterValorMedicao(item.id, medicao.id);
        totalQuantidade += valor.quantidade;
        totalValor += valor.valorTotal;
      });
    } else {
      // Para agrupadores, soma os acumulados dos filhos
      const calcularFilhos = (itemId: string) => {
        const filho = planilhaItensComTotais.find(i => i.id === itemId);
        if (!filho) return;
        
        if (filho.tipo === 'item') {
          medicoes.forEach((medicao) => {
            const valor = obterValorMedicao(filho.id, medicao.id);
            totalQuantidade += valor.quantidade;
            totalValor += valor.valorTotal;
          });
        } else if (filho.tipo === 'agrupador') {
          filho.filhos.forEach(filhoId => calcularFilhos(filhoId));
        }
      };
      
      item.filhos.forEach(filhoId => calcularFilhos(filhoId));
    }
    
    const percentualTotal = item.precoTotal > 0 ? (totalValor / item.precoTotal) * 100 : 0;
    const percentualQuantidade = item.quantidade > 0 ? (totalQuantidade / item.quantidade) * 100 : 0;
    
    return {
      quantidade: totalQuantidade,
      percentual: percentualQuantidade,
      valorTotal: totalValor,
      percentualTotal: percentualTotal,
    };
  };

  // Calcular saldo do serviço (quantidade prevista - acumulado)
  const calcularSaldoServico = (item: PlanilhaItem): ValorMedicao => {
    const valorAcumulado = calcularValorAcumulado(item);
    
    const quantidadeSaldo = item.quantidade - valorAcumulado.quantidade;
    const percentualSaldo = item.quantidade > 0 ? (quantidadeSaldo / item.quantidade) * 100 : 0;
    const valorTotalSaldo = item.precoTotal - valorAcumulado.valorTotal;
    const percentualTotalSaldo = item.precoTotal > 0 ? (valorTotalSaldo / item.precoTotal) * 100 : 0;
    
    return {
      quantidade: quantidadeSaldo,
      percentual: percentualSaldo,
      valorTotal: valorTotalSaldo,
      percentualTotal: percentualTotalSaldo,
    };
  };

  // Filtrar medições visíveis (ou apenas a que está em revisão final)
  const medicoesVisiveis = modoRevisaoFinal && medicaoParaConcluir
    ? medicoes.filter(m => m.id === medicaoParaConcluir)
    : medicoes.filter(m => m.visivel);
  
  const totalGeral = planilhaItensComTotais
    .filter((i) => i.nivel === 0)
    .reduce((sum, i) => sum + i.precoTotal, 0);

  // Função para determinar a cor baseada no percentual acumulado
  const obterCorPorPercentualAcumulado = (item: PlanilhaItem): string => {
    const valorAcumulado = calcularValorAcumulado(item);
    const percentual = valorAcumulado.percentualTotal;
    const isAgrupador = item.tipo === 'agrupador';
    
    if (percentual > 100) {
      // Vermelho - Mais de 100% (mais escuro para agrupadores)
      return isAgrupador ? 'text-red-400' : 'text-red-300';
    } else if (percentual === 100) {
      // Verde - Exatamente 100% (mais escuro para agrupadores)
      return isAgrupador ? 'text-green-400' : 'text-green-300';
    } else if (percentual > 0) {
      // Amarelo - Entre 0% e 100% (mais escuro para agrupadores)
      return isAgrupador ? 'text-yellow-400' : 'text-yellow-300';
    } else {
      // Branco - 0%
      return isAgrupador ? 'text-white' : 'text-slate-300';
    }
  };

  // Função para determinar o tipo de badge baseado no mapeamento
  const determinarTipoBadge = (mapeamento: any, item?: PlanilhaItem): 'ajustado-glosa' | 'ajustado-aditivo' | 'adicionado' | 'retirado' | 'concluido-retirado' | null => {
    if (!mapeamento) return null;
    
    const tipo = mapeamento.tipoAlteracao;
    
    if (tipo === 'ADICIONADO') {
      return 'adicionado';
    } else if (tipo === 'REMOVIDO') {
      // Verificar se item foi 100% medido antes de ser removido
      if (item && itemConcluidoERemovido(item)) {
        return 'concluido-retirado';
      }
      return 'retirado';
    } else if (tipo === 'QUANTIDADE_ALTERADA' || tipo === 'QUANTIDADE_E_PRECO_ALTERADOS') {
      // Se quantidade diminuiu = glosa, se aumentou = aditivo
      const qtdAnterior = Number(mapeamento.quantidadeAnterior || 0);
      const qtdNova = Number(mapeamento.quantidadeNova || 0);
      
      if (qtdNova > qtdAnterior) {
        return 'ajustado-aditivo';
      } else if (qtdNova < qtdAnterior) {
        return 'ajustado-glosa';
      }
    }
    
    return null;
  };

  /**
   * Recalcula percentuais de todas as medições de um item quando a quantidade contratual muda
   * Mantém as quantidades absolutas medidas, recalcula os percentuais baseado na nova quantidade
   * 
   * @param itemId - ID do item no orçamento
   * @param codigoItem - Código do item (para buscar no mapeamento)
   * @param quantidadeOriginal - Quantidade da versão anterior
   * @param quantidadeNova - Quantidade da nova versão
   */
  const recalcularPercentuaisParaItem = (
    itemId: string,
    codigoItem: string,
    quantidadeOriginal: number,
    quantidadeNova: number
  ) => {
    if (quantidadeNova === 0) {
      console.warn(`Item ${codigoItem}: quantidade nova é zero, não é possível recalcular percentuais`);
      return;
    }

    // Buscar medições deste item
    const medicoesDoItem = valoresMedicoes.get(itemId);
    if (!medicoesDoItem) {
      return; // Item não tem medições
    }

    // Criar nova referência do Map para forçar re-render
    const novosValoresMedicoes = new Map(valoresMedicoes);
    const novasMedicoesItem = new Map(medicoesDoItem);

    // Recalcular percentual para cada medição
    novasMedicoesItem.forEach((valor, medicaoId) => {
      // Manter quantidade absoluta medida
      const quantidadeMedida = valor.quantidade;
      
      // Recalcular percentual baseado na nova quantidade contratual
      const novoPercentual = (quantidadeMedida / quantidadeNova) * 100;
      
      // Atualizar valor
      novasMedicoesItem.set(medicaoId, {
        ...valor,
        percentual: novoPercentual,
        percentualTotal: novoPercentual,
      });
    });

    // Atualizar no estado
    novosValoresMedicoes.set(itemId, novasMedicoesItem);
    setValoresMedicoes(novosValoresMedicoes);

    console.log(
      `Item ${codigoItem}: Percentuais recalculados. ` +
      `Qtd: ${quantidadeOriginal} → ${quantidadeNova}`
    );
  };

  /**
   * Recalcula percentuais de todos os itens afetados por mudanças de versão
   * Deve ser chamado após migração ou quando necessário atualizar cálculos
   */
  const recalcularTodosPercentuais = () => {
    if (mapeamentoAlteracoes.size === 0) {
      console.log('Nenhum mapeamento de alterações disponível');
      return;
    }

    let itensRecalculados = 0;

    mapeamentoAlteracoes.forEach((mapeamento, codigo) => {
      // Apenas recalcular itens que tiveram alteração de quantidade
      if (
        mapeamento.tipoAlteracao === 'QUANTIDADE_ALTERADA' ||
        mapeamento.tipoAlteracao === 'QUANTIDADE_E_PRECO_ALTERADOS'
      ) {
        const qtdAnterior = Number(mapeamento.quantidadeAnterior || 0);
        const qtdNova = Number(mapeamento.quantidadeNova || 0);

        if (qtdNova > 0 && qtdAnterior !== qtdNova) {
          // Buscar o item no planilhaItens pelo código
          const item = planilhaItens.find(i => i.item === codigo);
          
          if (item) {
            recalcularPercentuaisParaItem(
              item.id,
              codigo,
              qtdAnterior,
              qtdNova
            );
            itensRecalculados++;
          }
        }
      }
    });

    console.log(`Recálculo concluído: ${itensRecalculados} itens atualizados`);
  };

  /**
   * Abre o modal de análise de impacto
   */
  const abrirModalAnalise = async () => {
    if (!versaoAnterior) {
      console.error('Versão anterior não definida');
      return;
    }

    try {
      setCarregandoAnalise(true);
      
      // Buscar análise de impacto
      const { analisarImpactoVersao } = await import('@/app/actions/versoes-medicao');
      const analise = await analisarImpactoVersao(
        obra.id,
        versaoAnterior,
        versaoAtiva.id
      );

      setDadosAnalise(analise);
      setModalAnaliseAberto(true);
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
      alert('Erro ao carregar análise de impacto. Verifique o console para mais detalhes.');
    } finally {
      setCarregandoAnalise(false);
    }
  };

  /**
   * Confirma a migração para nova versão
   */
  const confirmarMigracao = async () => {
    if (!versaoAnterior) {
      console.error('Versão anterior não definida');
      return;
    }

    try {
      // Migrar medições para nova versão
      const { migrarMedicoesParaNovaVersao } = await import('@/app/actions/versoes-medicao');
      const resultado = await migrarMedicoesParaNovaVersao(
        obra.id,
        versaoAnterior,
        versaoAtiva.id
      );

      console.log('Migração concluída:', resultado);

      // Recarregar dados
      await carregarPrevisoesDoBanco();

      // Fechar modal
      setModalAnaliseAberto(false);
      setNovaVersaoDetectada(false);

      alert(`Migração concluída com sucesso!\n\n${resultado.message}`);
    } catch (error) {
      console.error('Erro ao migrar versões:', error);
      alert('Erro ao migrar versões. Verifique o console para mais detalhes.');
      throw error;
    }
  };

  /**
   * Abre o modal de comparação detalhada entre versões
   */
  const abrirModalComparacao = () => {
    if (!versaoAnterior || mapeamentoAlteracoes.size === 0) {
      alert('Não há dados suficientes para comparação.');
      return;
    }
    setModalComparacaoAberto(true);
  };

  /**
   * Carrega e abre o modal de histórico de aditivos
   */
  const abrirModalHistorico = async () => {
    try {
      setCarregandoHistorico(true);
      
      // Buscar histórico completo da obra
      const { buscarHistoricoVersoes } = await import('@/app/actions/versoes-medicao');
      const historico = await buscarHistoricoVersoes(obra.id);

      // Enriquecer dados com impacto financeiro se disponível
      const historicoEnriquecido = await Promise.all(
        historico.map(async (item: any) => {
          try {
            const { analisarImpactoVersao } = await import('@/app/actions/versoes-medicao');
            const analise = await analisarImpactoVersao(
              obra.id,
              item.versaoAnteriorId,
              item.versaoNovaId
            );
            
            return {
              ...item,
              impactoFinanceiro: analise.impactoFinanceiro,
            };
          } catch (error) {
            console.error('Erro ao buscar impacto financeiro:', error);
            return item;
          }
        })
      );

      setDadosHistorico(historicoEnriquecido);
      setModalHistoricoAberto(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      alert('Erro ao carregar histórico de alterações. Verifique o console para mais detalhes.');
    } finally {
      setCarregandoHistorico(false);
    }
  };

  /**
   * Exporta medições selecionadas
   */
  const exportarMedicoes = async (
    medicoesIds: string[],
    planilhas: string[],
    tipoEap: 'completa' | 'resumida',
    formato: string
  ) => {
    try {
      const queryParams = new URLSearchParams({
        obraId: obra.id,
        medicoesIds: JSON.stringify(medicoesIds),
        planilhas: JSON.stringify(planilhas),
        tipoEap,
        formato,
      });
      
      const response = await fetch(`/api/previsoes-medicao/exportar?${queryParams}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao exportar');
      }
      
      // Download do arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const tipoTexto = tipoEap === 'completa' ? 'completa' : 'resumida';
      a.download = `medicoes-${tipoTexto}-${obra.codigo}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Erro ao exportar medições:', error);
      alert(error.message || 'Erro ao exportar medições');
      throw error;
    }
  };

  /**
   * Verifica se um item foi removido (glosa)
   */
  const itemFoiRemovido = (codigoItem: string): boolean => {
    const mapeamento = mapeamentoAlteracoes.get(codigoItem);
    return mapeamento?.tipoAlteracao === 'REMOVIDO';
  };

  /**
   * Verifica se um item foi 100% concluído E depois removido
   */
  const itemConcluidoERemovido = (item: PlanilhaItem): boolean => {
    const removido = itemFoiRemovido(item.item);
    if (!removido) return false;
    
    // Verificar se já foi 100% medido
    const valorAcumulado = calcularValorAcumulado(item);
    return valorAcumulado.percentualTotal >= 100;
  };

  /**
   * Verifica se uma medição tem valor negativo (desmedição)
   */
  const medicaoTemValorNegativo = (itemId: string, medicaoId: string): boolean => {
    const valor = obterValorMedicao(itemId, medicaoId);
    return valor.quantidade < 0 || valor.percentual < 0;
  };

  /**
   * Valida se uma nova quantidade/percentual negativo causaria acumulado negativo
   */
  const validarMedicaoNegativa = (item: PlanilhaItem, medicaoId: string, novoValor: number, tipo: 'quantidade' | 'percentual'): {
    valido: boolean;
    mensagem?: string;
  } => {
    // Calcular acumulado sem a medição atual
    let acumuladoSemAtual = 0;
    
    medicoes.forEach((med) => {
      if (med.id !== medicaoId) {
        const valor = obterValorMedicao(item.id, med.id);
        acumuladoSemAtual += tipo === 'quantidade' ? valor.quantidade : valor.percentual;
      }
    });

    const novoAcumulado = acumuladoSemAtual + novoValor;

    if (novoAcumulado < 0) {
      return {
        valido: false,
        mensagem: `Valor negativo causaria acumulado negativo (${novoAcumulado.toFixed(2)}). O acumulado total não pode ser menor que zero.`
      };
    }

    return { valido: true };
  };

  /**
   * Executa o recálculo de percentuais e persiste no banco de dados
   */
  const executarRecalculoCompleto = async () => {
    if (!versaoAnterior) {
      console.error('Versão anterior não definida');
      return;
    }

    try {
      setRecalculando(true);

      // Recalcular na interface (imediato)
      recalcularTodosPercentuais();

      // Persistir no banco de dados
      const { recalcularPercentuaisMedicoes } = await import('@/app/actions/versoes-medicao');
      const resultado = await recalcularPercentuaisMedicoes(
        obra.id,
        versaoAnterior,
        versaoAtiva.id
      );

      console.log('Recálculo completo:', resultado);

      // Recarregar dados do banco
      await carregarPrevisoesDoBanco();

      alert(`Recálculo concluído com sucesso!\n\n${resultado.message}`);
    } catch (error) {
      console.error('Erro ao recalcular percentuais:', error);
      alert('Erro ao recalcular percentuais. Verifique o console para mais detalhes.');
    } finally {
      setRecalculando(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando previsões de medição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Indicador de salvamento */}
      {salvando && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Previsões de Medições</h1>
            <p className="text-slate-400">{obra.nome} - {obra.construtora.razaoSocial}</p>
          </div>
        </div>
        
        {/* Botões do Topo */}
        <div className="flex items-center gap-3">
          {/* Botão de Exportar Medições */}
          <button
            onClick={() => setModalExportacaoAberto(true)}
            disabled={salvando || medicoes.length === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed border border-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            title="Exportar medições"
          >
            <Download className="w-4 h-4" />
            Exportar Medições
          </button>

          {/* Botão de Histórico */}
          <button
            onClick={abrirModalHistorico}
            disabled={carregandoHistorico}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed border border-slate-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {carregandoHistorico ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Histórico de Alterações
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner de Nova Versão Detectada */}
      {novaVersaoDetectada && (
        <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  Nova versão de orçamento disponível
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Uma nova versão da planilha contratual foi criada. 
                  Clique em "Ver Detalhes" para analisar as alterações ou "Recalcular" para atualizar percentuais.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setNovaVersaoDetectada(false)}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Mais Tarde
              </button>
              <button
                onClick={executarRecalculoCompleto}
                disabled={recalculando}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                {recalculando ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Recalculando...
                  </>
                ) : (
                  'Recalcular Percentuais'
                )}
              </button>
              <button
                onClick={abrirModalAnalise}
                disabled={carregandoAnalise}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                {carregandoAnalise ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Ver Detalhes'
                )}
              </button>
              <button
                onClick={abrirModalComparacao}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Layers className="w-3 h-3" />
                Comparar Versões
              </button>
              <div className="relative group">
                <button
                  disabled
                  className="px-4 py-1.5 bg-purple-600/50 text-white/50 text-sm rounded-lg cursor-not-allowed flex items-center gap-2"
                >
                  <Lock className="w-3 h-3" />
                  Migrar para Nova Versão
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-10">
                  <p className="text-xs text-slate-300">
                    Funcionalidade em desenvolvimento. Permitirá migrar automaticamente todas as medições para a nova versão do orçamento.
                  </p>
                  <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card: Medições Abertas */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Medições Abertas</p>
              <p className="text-2xl font-bold text-yellow-400">
                {previsoesBanco.filter(p => p.status !== 'REALIZADA').length}
              </p>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Card: Medições Concluídas */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Medições Concluídas</p>
              <p className="text-2xl font-bold text-green-400">
                {previsoesBanco.filter(p => p.status === 'REALIZADA').length}
              </p>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        {/* Card: Valor Medido (apenas medições concluídas) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">Valor Medido</p>
            <p className="text-lg font-bold text-blue-400">
              {(() => {
                const medicoesConcluidas = previsoesBanco.filter(p => p.status === 'REALIZADA').map(p => p.id);
                const valorMedido = planilhaItensComTotais
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => {
                    const calcularValorMedicoesConcluidas = (item: PlanilhaItem): number => {
                      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
                        return item.filhos.reduce((sumFilho, filhoId) => {
                          const filho = planilhaItensComTotais.find(i => i.id === filhoId);
                          return sumFilho + (filho ? calcularValorMedicoesConcluidas(filho) : 0);
                        }, 0);
                      } else {
                        return medicoesConcluidas.reduce((sumMed, medicaoId) => {
                          const valor = valoresMedicoes.get(item.id)?.get(medicaoId);
                          return sumMed + (valor?.valorTotal || 0);
                        }, 0);
                      }
                    };
                    return sum + calcularValorMedicoesConcluidas(item);
                  }, 0);
                return formatCurrency(valorMedido);
              })()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {(() => {
                const medicoesConcluidas = previsoesBanco.filter(p => p.status === 'REALIZADA').map(p => p.id);
                const valorMedido = planilhaItensComTotais
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => {
                    const calcularValorMedicoesConcluidas = (item: PlanilhaItem): number => {
                      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
                        return item.filhos.reduce((sumFilho, filhoId) => {
                          const filho = planilhaItensComTotais.find(i => i.id === filhoId);
                          return sumFilho + (filho ? calcularValorMedicoesConcluidas(filho) : 0);
                        }, 0);
                      } else {
                        return medicoesConcluidas.reduce((sumMed, medicaoId) => {
                          const valor = valoresMedicoes.get(item.id)?.get(medicaoId);
                          return sumMed + (valor?.valorTotal || 0);
                        }, 0);
                      }
                    };
                    return sum + calcularValorMedicoesConcluidas(item);
                  }, 0);
                return formatPercent((valorMedido / totalGeral) * 100);
              })()} do contrato
            </p>
          </div>
        </div>

        {/* Card: Valor Acumulado (apenas medições concluídas) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">Valor Acumulado</p>
            <p className="text-lg font-bold text-cyan-400">
              {(() => {
                const medicoesConcluidas = previsoesBanco.filter(p => p.status === 'REALIZADA').map(p => p.id);
                const valorAcumulado = planilhaItensComTotais
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => {
                    const calcularValorMedicoesConcluidas = (item: PlanilhaItem): number => {
                      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
                        return item.filhos.reduce((sumFilho, filhoId) => {
                          const filho = planilhaItensComTotais.find(i => i.id === filhoId);
                          return sumFilho + (filho ? calcularValorMedicoesConcluidas(filho) : 0);
                        }, 0);
                      } else {
                        return medicoesConcluidas.reduce((sumMed, medicaoId) => {
                          const valor = valoresMedicoes.get(item.id)?.get(medicaoId);
                          return sumMed + (valor?.valorTotal || 0);
                        }, 0);
                      }
                    };
                    return sum + calcularValorMedicoesConcluidas(item);
                  }, 0);
                return formatCurrency(valorAcumulado);
              })()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Medições finalizadas
            </p>
          </div>
        </div>

        {/* Card: Saldo Contratual (considerando apenas medições concluídas) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">Saldo Contratual</p>
            <p className="text-lg font-bold text-purple-400">
              {(() => {
                const medicoesConcluidas = previsoesBanco.filter(p => p.status === 'REALIZADA').map(p => p.id);
                const valorMedido = planilhaItensComTotais
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => {
                    const calcularValorMedicoesConcluidas = (item: PlanilhaItem): number => {
                      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
                        return item.filhos.reduce((sumFilho, filhoId) => {
                          const filho = planilhaItensComTotais.find(i => i.id === filhoId);
                          return sumFilho + (filho ? calcularValorMedicoesConcluidas(filho) : 0);
                        }, 0);
                      } else {
                        return medicoesConcluidas.reduce((sumMed, medicaoId) => {
                          const valor = valoresMedicoes.get(item.id)?.get(medicaoId);
                          return sumMed + (valor?.valorTotal || 0);
                        }, 0);
                      }
                    };
                    return sum + calcularValorMedicoesConcluidas(item);
                  }, 0);
                return formatCurrency(totalGeral - valorMedido);
              })()}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {(() => {
                const medicoesConcluidas = previsoesBanco.filter(p => p.status === 'REALIZADA').map(p => p.id);
                const valorMedido = planilhaItensComTotais
                  .filter(item => item.nivel === 0)
                  .reduce((sum, item) => {
                    const calcularValorMedicoesConcluidas = (item: PlanilhaItem): number => {
                      if (item.tipo === 'agrupador' && item.filhos && item.filhos.length > 0) {
                        return item.filhos.reduce((sumFilho, filhoId) => {
                          const filho = planilhaItensComTotais.find(i => i.id === filhoId);
                          return sumFilho + (filho ? calcularValorMedicoesConcluidas(filho) : 0);
                        }, 0);
                      } else {
                        return medicoesConcluidas.reduce((sumMed, medicaoId) => {
                          const valor = valoresMedicoes.get(item.id)?.get(medicaoId);
                          return sumMed + (valor?.valorTotal || 0);
                        }, 0);
                      }
                    };
                    return sum + calcularValorMedicoesConcluidas(item);
                  }, 0);
                return formatPercent(((totalGeral - valorMedido) / totalGeral) * 100);
              })()} restante
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Versão */}
      {versaoAnterior && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-slate-400">Visualizar por versão:</label>
          <select
            value={versaoSelecionada}
            onChange={(e) => setVersaoSelecionada(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={versaoAtiva.id}>
              {versaoAtiva.nome} - v{versaoAtiva.numero} (ATIVA)
            </option>
            <option value={versaoAnterior}>
              Versão Anterior (Histórica)
            </option>
          </select>
          
          {versaoSelecionada !== versaoAtiva.id && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Visualizando dados históricos
            </span>
          )}
        </div>
      )}

      {/* Barra de ferramentas */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        {modoRevisaoFinal ? (
          // Modo Revisão Final
          <div className="flex flex-col gap-2">
            <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Modo Revisão Final
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Revise os valores da {medicoes.find(m => m.id === medicaoParaConcluir)?.nome}. Ao concluir, a medição será bloqueada para edição.
            </p>
          </div>
        ) : (
          // Indicador de Versão de Referência (movido para esta linha)
          <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-800 rounded-lg px-4 py-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Versão de Referência:</span>
            <span className="text-sm font-semibold text-blue-400">
              {versaoAtiva.nome} (v{versaoAtiva.numero})
            </span>
            <span className="text-xs text-slate-500 ml-2">
              {versaoAtiva.tipo === 'BASELINE' ? 'Baseline' : 'Revisão'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!modoRevisaoFinal && (
            <>
              {/* Concluir Medições */}
              <button
                onClick={iniciarConclusaoMedicao}
                disabled={salvando || medicoes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Concluir e bloquear uma medição"
              >
                <CheckCircle className="w-4 h-4" />
                Concluir Medições
              </button>

              {/* Adicionar Medição */}
              <button
                onClick={() => setMostrarModalNovaMedicao(true)}
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Adicionar Medição
              </button>
            </>
          )}

          {modoRevisaoFinal && (
            <>
              {/* Cancelar Revisão */}
              <button
                onClick={cancelarRevisaoFinal}
                disabled={salvando}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancelar Revisão
              </button>

              {/* Concluir Medição */}
              <button
                onClick={concluirMedicaoFinal}
                disabled={salvando}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Concluindo...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Concluir e Bloquear Medição
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controles de Níveis e Medições */}
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        {/* Lado Esquerdo: Níveis */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Lado Direito: Medições */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão Toggle Expandir/Recolher Todas as Medições */}
          {(() => {
            const todasVisiveis = medicoes.every(m => m.visivel);
            const algumasVisiveis = medicoes.some(m => m.visivel);
            
            return (
              <button
                onClick={() => {
                  if (todasVisiveis) {
                    setMedicoes(medicoes.map(m => ({ ...m, visivel: false })));
                  } else {
                    setMedicoes(medicoes.map(m => ({ ...m, visivel: true })));
                  }
                }}
                className={`p-2 rounded-lg transition-colors ${
                  todasVisiveis
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : algumasVisiveis
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={todasVisiveis ? 'Recolher todas as medições' : 'Expandir todas as medições'}
              >
                {todasVisiveis ? <ChevronsUp className="w-4 h-4" /> : <ChevronsDown className="w-4 h-4" />}
              </button>
            );
          })()}

          {/* Checkboxes das Medições */}
          {medicoes.map((medicao, index) => (
            <div
              key={medicao.id}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
                medicao.visivel
                  ? 'bg-blue-900/30 border-blue-700'
                  : 'bg-slate-800 border-slate-700 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={medicao.visivel}
                onChange={() => toggleVisibilidadeMedicao(medicao.id)}
                className="w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-300">
                {index + 1}ª
              </span>
            </div>
          ))}

          {/* Checkbox do Acumulado */}
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-all ${
              acumuladoVisivel
                ? 'bg-purple-900/30 border-purple-700'
                : 'bg-slate-800 border-slate-700 opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={acumuladoVisivel}
              onChange={() => setAcumuladoVisivel(!acumuladoVisivel)}
              className="w-3 h-3 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs font-semibold text-slate-300">
              Acumulado
            </span>
          </div>
        </div>
      </div>

      {/* Título da Planilha de Medições */}
      <div className="mb-4 mt-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Layers className="w-7 h-7 text-blue-400" />
          Visão EAP Contratual
        </h2>
        <p className="text-slate-400 mt-1">
          Planilha de medições organizada pela estrutura EAP contratual
        </p>
      </div>

      {/* Tabela */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <table className="table-engineering w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-900">
              <tr className="bg-slate-900 shadow-lg">
                <th rowSpan={2} className="w-12 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4"></th>
                <th rowSpan={2} className="w-32 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-2">
                  <span className="text-xs">Item</span>
                </th>
                <th rowSpan={2} className="w-32 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-2">
                  <span className="text-xs">Referência</span>
                </th>
                <th rowSpan={2} className="min-w-[300px] bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-2">
                  <span className="text-xs">Serviço (Descrição)</span>
                </th>
                <th rowSpan={2} className="w-24 bg-slate-900 border-b-4 border-r-2 border-slate-700 py-4 px-1">
                  <span className="text-xs">Unidade</span>
                </th>
                <th rowSpan={2} className="number-cell w-32 bg-slate-900 border-b-4 border-r-2 border-slate-700 text-xs py-4 px-1">Quantidade</th>
                <th rowSpan={2} className="number-cell w-40 bg-slate-900 border-b-4 border-r-2 border-slate-700 text-xs py-4 px-1">Preço Unitário</th>
                <th rowSpan={2} className="number-cell w-40 bg-slate-900 border-b-4 border-r-2 border-slate-700 text-xs py-4 px-1">Preço Total</th>
                
                {/* Colunas de Medições */}
                {medicoesVisiveis.map((medicao, idx) => {
                  const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                  const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                  
                  return (
                  <th 
                    key={medicao.id} 
                    colSpan={4}
                    className="bg-blue-900/30 border-b py-3 px-2"
                    style={{ 
                      borderLeftWidth: '3px', 
                      borderRightWidth: '3px',
                      borderLeftColor: 'rgb(71 85 105)',
                      borderRightColor: 'rgb(71 85 105)'
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-center">
                          <div className="text-xs font-bold text-blue-400 flex items-center justify-center gap-2">
                            {medicao.nome}
                            {estaConcluida && (
                                <span className="px-2 py-0.5 bg-green-900/50 border border-green-700 rounded text-green-400 text-[10px] font-semibold flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  CONCLUÍDA
                                </span>
                              )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            <span className="mr-1">Data Prevista:</span>
                            {medicaoEditando === medicao.id && !modoRevisaoFinal && !estaConcluida ? (
                              <input
                                type="date"
                                value={dataEdicao}
                                onChange={(e) => setDataEdicao(e.target.value)}
                                className="px-2 py-0.5 bg-slate-800 border border-blue-500 rounded text-white text-xs focus:outline-none"
                              />
                            ) : (
                              <span>{new Date(medicao.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                          {medicaoEditando === medicao.id && modoRevisaoFinal && !estaConcluida && (
                            <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span className="mr-1 font-semibold">Data Real:</span>
                              <input
                                type="date"
                                value={dataRealMedicao}
                                onChange={(e) => setDataRealMedicao(e.target.value)}
                                className="px-2 py-0.5 bg-amber-900/20 border border-amber-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                                placeholder="Data da medição"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <>
                                {!modoRevisaoFinal && (
                                  <button
                                    onClick={() => toggleVisibilidadeMedicao(medicao.id)}
                                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                                    title="Ocultar medição"
                                  >
                                    <EyeOff className="w-3 h-3" />
                                  </button>
                                )}
                                
                                {/* Botões de Edição - Apenas se não estiver concluída */}
                                {!estaConcluida && !modoRevisaoFinal && (
                                  medicaoEditando === medicao.id ? (
                                    <>
                                      {/* Botão Salvar - Aparece apenas no modo edição */}
                                      <button
                                        onClick={() => salvarEdicaoMedicao()}
                                        disabled={salvando}
                                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Salvar alterações no banco de dados"
                                      >
                                        <Save className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                        onClick={() => limparMedicao(medicao.id)}
                                        className="p-1 hover:bg-yellow-900 rounded text-yellow-400 hover:text-yellow-300"
                                        title={`Limpar todos os valores de ${medicao.tipo === 'quantidade' ? 'Quantidade' : 'Percentual (%)'}`}
                                      >
                                        <Eraser className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                        onClick={cancelarEdicaoMedicao}
                                        className="p-1 hover:bg-red-900 rounded text-red-400 hover:text-red-300"
                                        title="Cancelar edição (descartar alterações)"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => iniciarEdicaoMedicao(medicao)}
                                      className="p-1 hover:bg-blue-900 rounded text-blue-400 hover:text-blue-300"
                                      title="Editar configurações da medição"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )
                                )}

                                {estaConcluida && !modoRevisaoFinal && (
                                  <span className="px-2 py-1 text-[10px] text-green-400 bg-green-900/20 rounded border border-green-800">
                                    Bloqueada
                                  </span>
                                )}
                                
                                {!estaConcluida && !modoRevisaoFinal && (
                                  <button
                                    onClick={() => removerMedicao(medicao.id)}
                                    className="p-1 hover:bg-red-900 rounded text-slate-400 hover:text-red-400"
                                    title="Remover medição"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                        </div>
                      </div>
                    </div>
                  </th>
                  );
                })}

                {/* Coluna Acumulado */}
                {acumuladoVisivel && (
                  <th 
                    colSpan={4}
                    className="bg-purple-900/30 border-b py-3 px-2"
                    style={{ 
                      borderLeftWidth: '3px', 
                      borderRightWidth: '3px',
                      borderLeftColor: 'rgb(71 85 105)',
                      borderRightColor: 'rgb(71 85 105)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 text-center">
                        <div className="text-xs font-bold text-purple-400">Acumulado</div>
                        <div className="text-xs text-slate-400 mt-1">Total de todas as medições</div>
                      </div>
                      <button
                        onClick={() => setAcumuladoVisivel(false)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                        title="Ocultar acumulado"
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                )}
              </tr>
              <tr className="bg-slate-900">
                {medicoesVisiveis.map((medicao) => (
                  <React.Fragment key={`medicao-header-${medicao.id}`}>
                    <th 
                      className="number-cell w-32 bg-blue-900/20 border-b-4 text-xs py-2 px-1"
                      style={{ 
                        borderLeftWidth: '3px',
                        borderLeftColor: 'rgb(71 85 105)'
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={medicao.tipo === 'quantidade'}
                          onChange={() => alterarTipoMedicao(medicao.id, 'quantidade')}
                          disabled={(() => {
                            const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                            const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                            return medicaoEditando !== medicao.id || modoRevisaoFinal || estaConcluida;
                          })()}
                          className={`w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 ${
                            (() => {
                              const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                              const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                              return medicaoEditando !== medicao.id || modoRevisaoFinal || estaConcluida;
                            })() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={(() => {
                            const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                            const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                            if (estaConcluida) return 'Medição concluída - não pode ser alterada';
                            if (modoRevisaoFinal) return 'Tipo não pode ser alterado na revisão final';
                            return medicaoEditando !== medicao.id ? 'Clique em Editar para alterar' : 'Marcar para entrada por Quantidade';
                          })()}
                        />
                        <span>Quant.</span>
                      </div>
                    </th>
                    <th className="number-cell w-32 bg-blue-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="checkbox"
                          checked={medicao.tipo === 'percentual'}
                          onChange={() => alterarTipoMedicao(medicao.id, 'percentual')}
                          disabled={(() => {
                            const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                            const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                            return medicaoEditando !== medicao.id || modoRevisaoFinal || estaConcluida;
                          })()}
                          className={`w-3 h-3 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 ${
                            (() => {
                              const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                              const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                              return medicaoEditando !== medicao.id || modoRevisaoFinal || estaConcluida;
                            })() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          title={(() => {
                            const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                            const estaConcluida = previsaoBanco?.status === 'REALIZADA';
                            if (estaConcluida) return 'Medição concluída - não pode ser alterada';
                            if (modoRevisaoFinal) return 'Tipo não pode ser alterado na revisão final';
                            return medicaoEditando !== medicao.id ? 'Clique em Editar para alterar' : 'Marcar para entrada por Percentual';
                          })()}
                        />
                        <span>Quant.(%)</span>
                      </div>
                    </th>
                    <th className="number-cell w-40 bg-blue-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1">
                      Total (R$)
                    </th>
                    <th 
                      className="number-cell w-32 bg-blue-900/20 border-b-4 text-xs py-2 px-1"
                      style={{ 
                        borderRightWidth: '3px',
                        borderRightColor: 'rgb(71 85 105)'
                      }}
                    >
                      Total (%)
                    </th>
                  </React.Fragment>
                ))}

                {/* Sub-colunas do Acumulado */}
                {acumuladoVisivel && (
                  <>
                    <th 
                      className="number-cell w-32 bg-purple-900/20 border-b-4 text-xs py-2 px-1"
                      style={{ 
                        borderLeftWidth: '3px',
                        borderLeftColor: 'rgb(71 85 105)'
                      }}
                    >
                      Quant.
                    </th>
                    <th className="number-cell w-32 bg-purple-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1">
                      Quant.(%)
                    </th>
                    <th className="number-cell w-40 bg-purple-900/20 border-b-4 border-r border-slate-700 text-xs py-2 px-1">
                      Total (R$)
                    </th>
                    <th 
                      className="number-cell w-32 bg-purple-900/20 border-b-4 text-xs py-2 px-1"
                      style={{ 
                        borderRightWidth: '3px',
                        borderRightColor: 'rgb(71 85 105)'
                      }}
                    >
                      Total (%)
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={8 + (medicoesVisiveis.length * 4)} className="text-center py-8 text-slate-400">
                    Nenhum item encontrado nesta versão.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <>
                    {/* Linha de Saldo (aparece quando a célula está sendo editada) */}
                    {celulaEditando?.itemId === item.id && item.tipo === 'item' && (
                      <tr className="bg-blue-950/30">
                        <td colSpan={8}></td>
                        {medicoesVisiveis.map((medicao) => {
                          if (medicao.id === celulaEditando.medicaoId) {
                            const saldo = calcularSaldoServico(item);
                            return (
                              <td 
                                key={medicao.id}
                                colSpan={4} 
                                className="py-2 px-3"
                                style={{ 
                                  borderLeftWidth: '3px',
                                  borderRightWidth: '3px',
                                  borderLeftColor: 'rgb(71 85 105)',
                                  borderRightColor: 'rgb(71 85 105)'
                                }}
                              >
                                <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-2 shadow-xl">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-[10px] font-bold text-yellow-400">Saldo do Serviço:</div>
                                    {(() => {
                                      const valorAcumulado = calcularValorAcumulado(item);
                                      const itemCompleto = valorAcumulado.percentualTotal >= 100 || saldo.percentualTotal <= 0;
                                      
                                      return (
                                        <button
                                          type="button"
                                          disabled={itemCompleto}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            
                                            if (medicao.tipo === 'quantidade') {
                                              const valorString = saldo.quantidade.toFixed(2).replace('.', '');
                                              const valorFormatado = formatarParaDigitacao(valorString);
                                              setValorDigitacao(item.id, medicao.id, 'quantidade', valorFormatado);
                                              atualizarValorMedicao(item.id, medicao.id, 'quantidade', saldo.quantidade);
                                            } else {
                                              const valorString = saldo.percentualTotal.toFixed(2).replace('.', '');
                                              const valorFormatado = formatarParaDigitacao(valorString);
                                              setValorDigitacao(item.id, medicao.id, 'percentual', valorFormatado);
                                              atualizarValorMedicao(item.id, medicao.id, 'percentual', saldo.percentualTotal);
                                            }
                                          }}
                                          className={`flex items-center gap-1 px-2 py-1 rounded text-white transition-colors ${
                                            itemCompleto
                                              ? 'bg-slate-600 cursor-not-allowed opacity-50'
                                              : 'bg-yellow-600 hover:bg-yellow-700'
                                          }`}
                                        >
                                          <span className="text-[10px] font-semibold">
                                            {itemCompleto ? 'Item Completo' : 'Concluir Item'}
                                          </span>
                                        </button>
                                      );
                                    })()}
                                  </div>
                                  <div className="grid grid-cols-4 gap-1">
                                    <div className="text-center">
                                      <div className="text-[9px] text-slate-400 mb-0.5">Quant.</div>
                                      <div className="text-[10px] font-mono text-white font-semibold">{formatQuantity(saldo.quantidade)}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-[9px] text-slate-400 mb-0.5">Quant. (%)</div>
                                      <div className="text-[10px] font-mono text-white font-semibold">{formatPercent(saldo.percentual)}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-[9px] text-slate-400 mb-0.5">Total (R$)</div>
                                      <div className="text-[10px] font-mono text-white font-semibold">{formatCurrency(saldo.valorTotal)}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-[9px] text-slate-400 mb-0.5">Total (%)</div>
                                      <div className="text-[10px] font-mono text-white font-semibold">{formatPercent(saldo.percentualTotal)}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          }
                          return <td key={medicao.id} colSpan={4}></td>;
                        })}
                        {acumuladoVisivel && <td colSpan={4}></td>}
                      </tr>
                    )}
                    
                    <tr
                      key={item.id}
                      className={`
                        ${itemFoiRemovido(item.item) ? 'opacity-50 bg-red-950/10' : 'hover:bg-slate-800'} 
                        ${item.tipo === 'agrupador' ? 'bg-slate-850' : ''} 
                        ${item.nivel === 0 ? 'border-t-2 border-slate-700' : ''}
                      `}
                    >
                    <td className="py-1 px-1">
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
                    <td className="py-1 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${
                            item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'
                          } ${itemFoiRemovido(item.item) ? 'line-through text-red-400' : ''}`}
                          style={{ paddingLeft: `${item.nivel * 12}px` }}
                        >
                          {item.item}
                        </span>
                        {/* Badge de alteração */}
                        {mapeamentoAlteracoes.has(item.item) && (() => {
                          const mapeamento = mapeamentoAlteracoes.get(item.item);
                          const tipoBadge = determinarTipoBadge(mapeamento, item);
                          
                          if (!tipoBadge) return null;
                          
                          return (
                            <BadgeAlteracao 
                              tipo={tipoBadge}
                              quantidadeAnterior={mapeamento.quantidadeAnterior}
                              quantidadeNova={mapeamento.quantidadeNova}
                              precoAnterior={mapeamento.precoAnterior}
                              precoNovo={mapeamento.precoNovo}
                              numeroAditivo={mapeamento.numeroAditivo}
                            />
                          );
                        })()}
                      </div>
                    </td>
                    <td className="py-1 px-2 font-mono text-xs">
                      <span className={`${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'} ${itemFoiRemovido(item.item) ? 'line-through text-red-400' : ''}`}>
                        {item.referencia || '-'}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span className={`text-xs ${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'} ${itemFoiRemovido(item.item) ? 'line-through text-red-400' : ''}`}>
                        {item.descricao}
                        {itemFoiRemovido(item.item) && (
                          <span className="ml-2 text-[10px] text-red-400 font-semibold">(ITEM REMOVIDO)</span>
                        )}
                      </span>
                    </td>
                    <td className="text-center text-xs py-1 px-1">
                      {item.tipo === 'agrupador' ? (
                        <span className={`${obterCorPorPercentualAcumulado(item)} font-bold`}>-</span>
                      ) : (
                        <span className={`text-xs ${obterCorPorPercentualAcumulado(item)} font-normal`}>{item.unidade}</span>
                      )}
                    </td>
                    <td className="number-cell text-xs py-1 px-1">
                      {item.tipo === 'agrupador' ? (
                        <span className={`${obterCorPorPercentualAcumulado(item)} font-bold`}>-</span>
                      ) : (
                        <span className={`font-mono ${obterCorPorPercentualAcumulado(item)} font-normal`}>{item.quantidade > 0 ? formatQuantity(item.quantidade) : '-'}</span>
                      )}
                    </td>
                    <td className="number-cell text-xs py-1 px-1">
                      {item.tipo === 'agrupador' ? (
                        <span className={`${obterCorPorPercentualAcumulado(item)} font-bold`}>-</span>
                      ) : (
                        <span className={`font-mono ${obterCorPorPercentualAcumulado(item)} font-normal`}>{item.precoUnitario > 0 ? formatCurrency(item.precoUnitario) : '-'}</span>
                      )}
                    </td>
                    <td className="number-cell text-xs py-1 px-1">
                      <span className={`font-mono ${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                        {item.precoTotal > 0 ? formatCurrency(item.precoTotal) : '-'}
                      </span>
                    </td>

                    {/* Colunas de Medições */}
                    {medicoesVisiveis.map((medicao) => {
                      const valor = item.tipo === 'agrupador' 
                        ? calcularTotalMedicaoAgrupador(item, medicao.id)
                        : obterValorMedicao(item.id, medicao.id);
                      const isItem = item.tipo === 'item';
                      const tipoMedicao = medicao.tipo;

                      return (
                        <React.Fragment key={`medicao-${medicao.id}-item-${item.id}`}>
                          {/* Coluna Quant. - Editável se tipo === 'quantidade' */}
                          <td 
                            className={`number-cell py-1 px-2 border-r ${isItem ? 'bg-blue-950/20' : 'bg-slate-800/50'}`}
                            style={{ 
                              borderLeftWidth: '3px',
                              borderLeftColor: 'rgb(71 85 105)'
                            }}
                          >
                            {isItem ? (
                              tipoMedicao === 'quantidade' ? (
                                (medicaoEditando === medicao.id || modoRevisaoFinal) ? (
                                  (() => {
                                    const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                                    const estaConcluida = previsaoBanco?.status === 'REALIZADA' && !modoRevisaoFinal;
                                    
                                    return estaConcluida ? (
                                      <span className={`text-xs font-mono font-normal ${
                                        valor.quantidade < 0 ? 'text-red-400 font-bold' : 
                                        valor.quantidade > 0 ? 'text-slate-400' : 'text-slate-300'
                                      }`}>
                                        {valor.quantidade < 0 && '⚠️ '}{formatQuantity(valor.quantidade)}
                                      </span>
                                    ) : (
                                      <input
                                        type="text"
                                        value={obterValorDigitacao(item.id, medicao.id, 'quantidade') || (valor.quantidade !== 0 ? formatarParaDigitacao(Math.abs(valor.quantidade).toFixed(2).replace('.', ''), valor.quantidade < 0) : '')}
                                        disabled={itemFoiRemovido(item.item)}
                                        onFocus={(e) => {
                                          setCelulaEditando({ itemId: item.id, medicaoId: medicao.id });
                                          if (!obterValorDigitacao(item.id, medicao.id, 'quantidade')) {
                                            setValorDigitacao(item.id, medicao.id, 'quantidade', '');
                                          }
                                          e.target.select();
                                        }}
                                        onChange={(e) => {
                                          const valorDigitado = e.target.value;
                                          if (valorDigitado === '' || valorDigitado === '-') {
                                            setValorDigitacao(item.id, medicao.id, 'quantidade', valorDigitado);
                                            atualizarValorMedicao(item.id, medicao.id, 'quantidade', 0);
                                            return;
                                          }
                                          const valorFormatado = formatarParaDigitacao(valorDigitado);
                                          setValorDigitacao(item.id, medicao.id, 'quantidade', valorFormatado);
                                          
                                          const valorNumerico = converterParaNumero(valorFormatado);
                                          atualizarValorMedicao(item.id, medicao.id, 'quantidade', valorNumerico);
                                        }}
                                        onBlur={(e) => {
                                          setCelulaEditando(null);
                                          limparValorDigitacao(item.id, medicao.id, 'quantidade');
                                        }}
                                        className="w-full px-1 py-1 bg-slate-800 border border-slate-700 rounded text-white text-[10px] text-right font-mono focus:border-blue-500 focus:outline-none"
                                        placeholder="0,00"
                                      />
                                    );
                                  })()
                                ) : (
                                  <span className={`text-xs font-mono font-normal ${valor.quantidade > 0 ? 'text-slate-400' : 'text-slate-300'}`}>{formatQuantity(valor.quantidade)}</span>
                                )
                              ) : (
                                <span className={`text-xs font-mono font-normal ${
                                  valor.quantidade < 0 ? 'text-red-400 font-bold' :
                                  valor.quantidade > 0 ? 'text-slate-400' : 'text-slate-300'
                                }`}>
                                  {valor.quantidade < 0 && '⚠️ '}{formatQuantity(valor.quantidade)}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-white font-mono font-bold">-</span>
                            )}
                          </td>
                          
                          {/* Coluna Quant.(%) - Editável se tipo === 'percentual' */}
                          <td className={`number-cell py-1 px-2 border-r ${isItem ? 'bg-blue-950/20' : 'bg-slate-800/50'} border-slate-700`}>
                            {isItem ? (
                              tipoMedicao === 'percentual' ? (
                                (medicaoEditando === medicao.id || modoRevisaoFinal) ? (
                                  (() => {
                                    const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                                    const estaConcluida = previsaoBanco?.status === 'REALIZADA' && !modoRevisaoFinal;
                                    
                                    return estaConcluida ? (
                                      <span className={`text-xs font-mono font-normal ${
                                        valor.percentual < 0 ? 'text-red-400 font-bold' :
                                        valor.percentual > 0 ? 'text-blue-400' : 'text-slate-300'
                                      }`}>
                                        {valor.percentual < 0 && '⚠️ '}{formatPercent(valor.percentual)}
                                      </span>
                                    ) : (
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={obterValorDigitacao(item.id, medicao.id, 'percentual') || (valor.percentual !== 0 ? formatarParaDigitacao(Math.abs(valor.percentual).toFixed(2).replace('.', ''), valor.percentual < 0) : '')}
                                          disabled={itemFoiRemovido(item.item)}
                                          onFocus={(e) => {
                                            setCelulaEditando({ itemId: item.id, medicaoId: medicao.id });
                                            if (!obterValorDigitacao(item.id, medicao.id, 'percentual')) {
                                              setValorDigitacao(item.id, medicao.id, 'percentual', '');
                                            }
                                            e.target.select();
                                          }}
                                          onChange={(e) => {
                                            const valorDigitado = e.target.value;
                                            if (valorDigitado === '' || valorDigitado === '-') {
                                              setValorDigitacao(item.id, medicao.id, 'percentual', valorDigitado);
                                              atualizarValorMedicao(item.id, medicao.id, 'percentual', 0);
                                              return;
                                            }
                                            const valorFormatado = formatarParaDigitacao(valorDigitado);
                                            setValorDigitacao(item.id, medicao.id, 'percentual', valorFormatado);
                                            
                                            const valorNumerico = converterParaNumero(valorFormatado);
                                            atualizarValorMedicao(item.id, medicao.id, 'percentual', valorNumerico);
                                          }}
                                          onBlur={(e) => {
                                            setCelulaEditando(null);
                                            limparValorDigitacao(item.id, medicao.id, 'percentual');
                                          }}
                                          className="w-full px-1 py-1 pr-5 bg-slate-800 border border-slate-700 rounded text-white text-[10px] text-right font-mono focus:border-blue-500 focus:outline-none"
                                          placeholder="0,00"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">%</span>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <span className={`text-xs font-mono font-normal ${valor.percentual > 0 ? 'text-blue-400' : 'text-slate-300'}`}>{formatPercent(valor.percentual)}</span>
                                )
                              ) : (
                                <span className={`text-xs font-mono font-normal ${
                                  valor.percentual < 0 ? 'text-red-400 font-bold' :
                                  valor.percentual > 0 ? 'text-blue-400' : 'text-slate-300'
                                }`}>
                                  {valor.percentual < 0 && '⚠️ '}{formatPercent(valor.percentual)}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-white font-mono font-bold">-</span>
                            )}
                          </td>
                          
                          {/* Coluna Total (R$) - Sempre calculado */}
                          <td className={`number-cell py-1 px-2 border-r font-mono text-xs border-slate-700`}>
                            <span className={`${
                              valor.valorTotal < 0 ? 'text-red-400 font-bold' : obterCorPorPercentualAcumulado(item)
                            } ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                              {valor.valorTotal !== 0 ? (
                                <>
                                  {valor.valorTotal < 0 && '⚠️ '}{formatCurrency(valor.valorTotal)}
                                </>
                              ) : '-'}
                            </span>
                          </td>
                          
                          {/* Coluna Total (%) - Sempre calculado - BORDA GROSSA */}
                          <td 
                            className="number-cell py-1 px-2 font-mono text-xs"
                            style={{ 
                              borderRightWidth: '3px',
                              borderRightColor: 'rgb(71 85 105)'
                            }}
                          >
                            <span className={`${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                              {valor.percentualTotal > 0 ? formatPercent(valor.percentualTotal) : '-'}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Colunas do Acumulado */}
                    {acumuladoVisivel && (() => {
                      const valorAcumulado = calcularValorAcumulado(item);
                      const isItem = item.tipo === 'item';
                      
                      return (
                        <>
                          {/* Coluna Quant. Acumulada */}
                          <td 
                            className={`number-cell py-1 px-2 border-r ${isItem ? 'bg-purple-950/20' : 'bg-slate-800/50'}`}
                            style={{ 
                              borderLeftWidth: '3px',
                              borderLeftColor: 'rgb(71 85 105)'
                            }}
                          >
                            {isItem ? (
                              <span className={`text-xs font-mono font-normal ${valorAcumulado.quantidade > 0 ? 'text-slate-300' : 'text-slate-300'}`}>
                                {valorAcumulado.quantidade > 0 ? formatQuantity(valorAcumulado.quantidade) : '-'}
                              </span>
                            ) : (
                              <span className={`text-xs font-mono font-bold ${valorAcumulado.quantidade > 0 ? 'text-slate-300' : 'text-white'}`}>
                                {valorAcumulado.quantidade > 0 ? formatQuantity(valorAcumulado.quantidade) : '-'}
                              </span>
                            )}
                          </td>
                          
                          {/* Coluna Quant.(%) Acumulada */}
                          <td className={`number-cell py-1 px-2 border-r ${isItem ? 'bg-purple-950/20' : 'bg-slate-800/50'} border-slate-700`}>
                            {isItem ? (
                              <span className={`text-xs font-mono font-normal ${valorAcumulado.percentual > 0 ? 'text-purple-400' : 'text-slate-300'}`}>
                                {valorAcumulado.percentual > 0 ? formatPercent(valorAcumulado.percentual) : '-'}
                              </span>
                            ) : (
                              <span className={`text-xs font-mono font-bold ${valorAcumulado.percentual > 0 ? 'text-purple-400' : 'text-white'}`}>
                                {valorAcumulado.percentual > 0 ? formatPercent(valorAcumulado.percentual) : '-'}
                              </span>
                            )}
                          </td>
                          
                          {/* Coluna Total (R$) Acumulado */}
                          <td className={`number-cell py-1 px-2 border-r border-slate-700`}>
                            <span className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                              {valorAcumulado.valorTotal > 0 ? formatCurrency(valorAcumulado.valorTotal) : '-'}
                            </span>
                          </td>
                          
                          {/* Coluna Total (%) Acumulado - BORDA GROSSA */}
                          <td 
                            className="number-cell py-1 px-2"
                            style={{ 
                              borderRightWidth: '3px',
                              borderRightColor: 'rgb(71 85 105)'
                            }}
                          >
                            <span className={`font-mono text-xs ${obterCorPorPercentualAcumulado(item)} ${item.tipo === 'agrupador' ? 'font-bold' : 'font-normal'}`}>
                              {valorAcumulado.percentualTotal > 0 ? formatPercent(valorAcumulado.percentualTotal) : '-'}
                            </span>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                  </>
                ))
              )}
              
              {/* Linha de Totais */}
              <tr className="bg-slate-800 border-t-2 border-slate-600 font-bold sticky bottom-0 z-10">
                <td colSpan={7} className="py-2 px-2 text-right text-white text-xs">TOTAL GERAL:</td>
                <td className="number-cell py-2 px-1 text-white font-mono text-xs">{formatCurrency(totalGeral)}</td>
                {medicoesVisiveis.map((medicao) => {
                  // Calcular total desta medição específica
                  const totalMedicao = planilhaItensComTotais
                    .filter(item => item.nivel === 0)
                    .reduce((sum, item) => {
                      const valor = item.tipo === 'agrupador' 
                        ? calcularTotalMedicaoAgrupador(item, medicao.id)
                        : obterValorMedicao(item.id, medicao.id);
                      return sum + valor.valorTotal;
                    }, 0);
                  
                  const percentualMedicao = totalGeral > 0 ? (totalMedicao / totalGeral) * 100 : 0;
                  
                  return (
                    <React.Fragment key={`medicao-total-${medicao.id}`}>
                      <td 
                        className="number-cell py-2 px-2 border-r text-slate-400 font-mono text-xs"
                        style={{ 
                          borderLeftWidth: '3px',
                          borderLeftColor: 'rgb(71 85 105)'
                        }}
                      >-</td>
                      <td className="number-cell py-2 px-2 border-r text-slate-400 font-mono text-xs border-slate-700">-</td>
                      <td className="number-cell py-2 px-2 border-r font-mono text-xs font-bold border-slate-700"
                        style={{ color: 'rgb(96 165 250)' }}>
                        {formatCurrency(totalMedicao)}
                      </td>
                      <td 
                        className="number-cell py-2 px-2 font-mono text-xs font-bold"
                        style={{ 
                          borderRightWidth: '3px',
                          borderRightColor: 'rgb(71 85 105)',
                          color: 'rgb(96 165 250)'
                        }}
                      >
                        {percentualMedicao > 0 ? formatPercent(percentualMedicao) : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}

                {/* Células do Acumulado na linha de totais */}
                {acumuladoVisivel && (() => {
                  const totalAcumulado = planilhaItensComTotais
                    .filter(item => item.nivel === 0)
                    .reduce((sum, item) => sum + calcularValorAcumulado(item).valorTotal, 0);
                  
                  const percentualAcumulado = totalGeral > 0 ? (totalAcumulado / totalGeral) * 100 : 0;
                  
                  return (
                    <React.Fragment key="acumulado-total">
                      <td 
                        className="number-cell py-2 px-2 border-r text-slate-400 font-mono text-xs"
                        style={{ 
                          borderLeftWidth: '3px',
                          borderLeftColor: 'rgb(71 85 105)'
                        }}
                      >-</td>
                      <td className="number-cell py-2 px-2 border-r text-slate-400 font-mono text-xs border-slate-700">-</td>
                      <td className="number-cell py-2 px-2 border-r font-mono text-xs font-bold border-slate-700"
                        style={{ color: 'rgb(192 132 252)' }}>
                        {formatCurrency(totalAcumulado)}
                      </td>
                      <td 
                        className="number-cell py-2 px-2 font-mono text-xs font-bold"
                        style={{ 
                          borderRightWidth: '3px',
                          borderRightColor: 'rgb(71 85 105)',
                          color: 'rgb(192 132 252)'
                        }}
                      >
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

      {/* Separador e Seção Visão Gerencial */}
      {versaoVisaoGerencial && versaoVisaoGerencial.itens && versaoVisaoGerencial.itens.length > 0 && (
        <>
          <div className="my-8 border-t-2 border-slate-700"></div>

          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Layers className="w-7 h-7 text-purple-400" />
              Visão EAP Gerencial
            </h2>
            <p className="text-slate-400 mt-1">
              Valores das medições agregados pela estrutura EAP de Visão Gerencial (somente leitura)
            </p>
          </div>

          <VisaoGerencialMedicoes
            versaoVisaoGerencial={versaoVisaoGerencial}
            medicoes={medicoesVisiveis}
            valoresMedicoes={valoresMedicoes}
            acumuladoVisivel={acumuladoVisivel}
            mapCodigoParaId={mapCodigoParaId}
          />
        </>
      )}

      {/* Modal Concluir Medições */}
      {mostrarModalConcluir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h3 className="text-xl font-bold text-white mb-4">Concluir Medições</h3>
            
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Selecione a medição para revisão final e conclusão. Após concluir, a medição será bloqueada permanentemente.</span>
              </p>
            </div>

            <div className="space-y-3">
              {medicoes
                .filter(m => {
                  // Buscar status da medição no banco
                  const previsaoBanco = previsoesBanco.find(p => p.id === m.id);
                  return !previsaoBanco || previsaoBanco.status !== 'REALIZADA';
                })
                .map((medicao) => {
                  const previsaoBanco = previsoesBanco.find(p => p.id === medicao.id);
                  const itensCount = previsaoBanco?.itens?.length || 0;
                  const statusAtual = previsaoBanco?.status || 'PREVISTA';
                  
                  return (
                    <button
                      key={medicao.id}
                      onClick={() => selecionarMedicaoParaConcluir(medicao.id)}
                      className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-lg hover:border-green-500 hover:bg-slate-750 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-white font-semibold flex items-center gap-2">
                            {medicao.nome}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              statusAtual === 'PREVISTA' ? 'bg-blue-900/50 border border-blue-700 text-blue-400' :
                              statusAtual === 'EM_MEDICAO' ? 'bg-yellow-900/50 border border-yellow-700 text-yellow-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {statusAtual === 'PREVISTA' ? 'Prevista' : 
                               statusAtual === 'EM_MEDICAO' ? 'Em Medição' : 
                               statusAtual}
                            </span>
                          </div>
                          <div className="text-slate-400 text-sm mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(medicao.dataPrevisao).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span>{itensCount} {itensCount === 1 ? 'item' : 'itens'} lançado{itensCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="text-green-400 group-hover:text-green-300 transition-colors">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      </div>
                    </button>
                  );
                })}

              {medicoes.filter(m => {
                const previsaoBanco = previsoesBanco.find(p => p.id === m.id);
                return !previsaoBanco || previsaoBanco.status !== 'REALIZADA';
              }).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>Nenhuma medição disponível para conclusão.</p>
                  <p className="text-sm mt-2">Todas as medições já foram concluídas.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setMostrarModalConcluir(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Medição */}
      {mostrarModalNovaMedicao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Nova Medição</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  O nome será gerado automaticamente: <span className="font-bold">{medicoes.length + 1}ª Medição</span>
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Data Prevista</label>
                <input
                  type="date"
                  value={dataMedicao}
                  onChange={(e) => setDataMedicao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setMostrarModalNovaMedicao(false);
                  setDataMedicao(new Date().toISOString().split('T')[0]);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarMedicao}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análise de Versão */}
      {modalAnaliseAberto && dadosAnalise && versaoAnterior && (
        <ModalAnaliseVersao
          isOpen={modalAnaliseAberto}
          onClose={() => setModalAnaliseAberto(false)}
          versaoAnterior={{
            numero: versaoAtiva.numero - 1, // Assumindo que é sequencial
            nome: 'Versão Anterior',
          }}
          versaoNova={{
            numero: versaoAtiva.numero,
            nome: versaoAtiva.nome,
          }}
          estatisticas={dadosAnalise.estatisticas}
          impactoFinanceiro={dadosAnalise.impactoFinanceiro}
          mapeamento={dadosAnalise.mapeamento}
          onConfirmarMigracao={confirmarMigracao}
        />
      )}

      {/* Modal de Comparação de Versões */}
      {modalComparacaoAberto && versaoAnterior && (
        <ModalComparacaoVersoes
          isOpen={modalComparacaoAberto}
          onClose={() => setModalComparacaoAberto(false)}
          versaoAnterior={{
            numero: versaoAtiva.numero - 1,
            nome: 'Versão Anterior',
          }}
          versaoNova={{
            numero: versaoAtiva.numero,
            nome: versaoAtiva.nome,
          }}
          mapeamento={Array.from(mapeamentoAlteracoes.values())}
        />
      )}

      {/* Modal de Histórico de Aditivos */}
      {modalHistoricoAberto && (
        <ModalHistoricoAditivos
          isOpen={modalHistoricoAberto}
          onClose={() => setModalHistoricoAberto(false)}
          historico={dadosHistorico}
          nomeObra={obra.nome}
        />
      )}

      {/* Modal de Exportação de Medições */}
      <ModalExportarMedicoes
        isOpen={modalExportacaoAberto}
        onClose={() => setModalExportacaoAberto(false)}
        medicoes={medicoes}
        onExportar={exportarMedicoes}
        temVisaoGerencial={!!versaoVisaoGerencial}
      />
    </div>
  );
}
