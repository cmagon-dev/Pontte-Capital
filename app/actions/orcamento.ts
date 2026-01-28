'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as XLSX from 'xlsx';

// Schema de validação para importação
const ImportPlanilhaSchema = z.object({
  obraId: z.string().uuid(),
  nomeVersao: z.string().min(1, 'Nome da versão é obrigatório'),
  tipoVersao: z.enum(['BASELINE', 'REVISAO']),
  observacoes: z.string().optional(),
});

// Interface para linha da planilha
interface LinhaPlanilha {
  item: string; // Código do item (ex: "1.0", "1.1.1")
  referencia?: string; // Referência SINAPI/SICRO
  descricao: string; // Descrição do serviço
  unidade?: string; // Unidade de medida
  quantidade?: number; // Quantidade
  precoUnitario?: number; // Preço unitário
  precoTotal?: number; // Preço total
}

// Função para calcular o nível hierárquico baseado no código do item
function calcularNivel(codigo: string): number {
  const partes = codigo.split('.');
  return partes.length - 1;
}

// Função para determinar o tipo do item (ITEM ou AGRUPADOR)
function determinarTipo(linha: LinhaPlanilha): 'ITEM' | 'AGRUPADOR' {
  // Se tem quantidade E unidade preenchidos, é um serviço (ITEM)
  // Caso contrário, é um agrupador (AGRUPADOR)
  const temQuantidade = linha.quantidade !== undefined && linha.quantidade !== null && linha.quantidade > 0;
  const temUnidade = linha.unidade && linha.unidade.trim() !== '';
  
  return temQuantidade && temUnidade ? 'ITEM' : 'AGRUPADOR';
}

// Função para construir a hierarquia de itens
function construirHierarquia(linhas: LinhaPlanilha[]): Map<string, { linha: LinhaPlanilha; parentId: string | null }> {
  const hierarquia = new Map<string, { linha: LinhaPlanilha; parentId: string | null }>();
  const codigoParaLinha = new Map<string, LinhaPlanilha>();
  linhas.forEach((linha) => {
    const codigo = linha.item.trim();
    linha.item = codigo;
    codigoParaLinha.set(codigo, linha);
  });

  linhas.forEach((linha) => {
    const codigo = linha.item;
    const partes = codigo.split('.').map((parte) => parte.trim()).filter(Boolean);
    let parentId: string | null = null;

    for (let nivel = partes.length - 1; nivel > 0; nivel--) {
      const candidato = partes.slice(0, nivel).join('.');
      if (codigoParaLinha.has(candidato)) {
        parentId = candidato;
        break;
      }
    }

    hierarquia.set(codigo, { linha, parentId });
  });

  return hierarquia;
}

// Função para processar arquivo Excel
function processarPlanilhaExcel(buffer: Buffer): LinhaPlanilha[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const primeiraAba = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[primeiraAba];
  
  // Converter para JSON (array de objetos)
  const dados = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, // Usar primeira linha como cabeçalho
    defval: null, // Valores padrão como null
  }) as any[];

  if (dados.length < 2) {
    throw new Error('Planilha vazia ou sem dados');
  }

  // Identificar cabeçalhos (primeira linha)
  const cabecalhos = dados[0] as string[];
  
  // Mapear índices das colunas (case-insensitive e flexível)
  const indices: { [key: string]: number } = {};
  cabecalhos.forEach((cabecalho, index) => {
    if (!cabecalho) return;
    const cabecalhoLower = cabecalho.toLowerCase().trim();
    
    // Mapear diferentes variações de nomes de colunas
    if (cabecalhoLower.includes('item') || cabecalhoLower.includes('código')) {
      indices.item = index;
    } else if (cabecalhoLower.includes('referência') || cabecalhoLower.includes('referencia') || cabecalhoLower.includes('sinapi') || cabecalhoLower.includes('sicro')) {
      indices.referencia = index;
    } else if (cabecalhoLower.includes('descrição') || cabecalhoLower.includes('descricao') || cabecalhoLower.includes('serviço') || cabecalhoLower.includes('servico')) {
      indices.descricao = index;
    } else if (cabecalhoLower.includes('unidade')) {
      indices.unidade = index;
    } else if (cabecalhoLower.includes('quantidade') || cabecalhoLower.includes('qtd')) {
      indices.quantidade = index;
    } else if (cabecalhoLower.includes('preço unitário') || cabecalhoLower.includes('preco unitario') || cabecalhoLower.includes('unitário') || cabecalhoLower.includes('unitario') || cabecalhoLower.includes('preço unit') || cabecalhoLower.includes('preco unit')) {
      indices.precoUnitario = index;
    } else if (cabecalhoLower.includes('preço total') || cabecalhoLower.includes('preco total') || cabecalhoLower.includes('total') || cabecalhoLower.includes('valor total')) {
      indices.precoTotal = index;
    }
  });

  // Validar colunas obrigatórias
  if (indices.item === undefined || indices.descricao === undefined) {
    throw new Error('Colunas obrigatórias não encontradas: Item e Descrição são obrigatórias');
  }

  // Processar linhas de dados
  const linhas: LinhaPlanilha[] = [];
  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i] as any[];
    
    // Pular linhas vazias
    if (!linha[indices.item] || linha[indices.item].toString().trim() === '') {
      continue;
    }

    const item = String(linha[indices.item] || '').trim();
    const descricao = String(linha[indices.descricao] || '').trim();

    // Validar item e descrição
    if (!item || !descricao) {
      continue; // Pular linhas inválidas
    }

    // Função auxiliar para converter valores numéricos do Excel
    // O Excel pode retornar como número ou string formatada
    const parsearNumero = (valor: any): number | undefined => {
      if (valor === null || valor === undefined || valor === '') {
        return undefined;
      }

      // Se já é número, retornar diretamente (Excel já converteu)
      if (typeof valor === 'number') {
        return isNaN(valor) ? undefined : valor;
      }

      // Converter para string e limpar
      let str = String(valor).trim();
      
      // Se estiver vazio, retornar undefined
      if (str === '' || str === '-') {
        return undefined;
      }

      // Remover espaços e caracteres não numéricos exceto ponto, vírgula e sinal negativo
      str = str.replace(/[^\d.,-]/g, '');

      // Detectar formato brasileiro (ex: "3.404,32" ou "3404,32")
      // Formato brasileiro: ponto para milhares, vírgula para decimais
      const temVirgula = str.includes(',');
      const temPonto = str.includes('.');

      if (temVirgula && temPonto) {
        // Formato brasileiro: "3.404,32" ou "340.432,00"
        // A vírgula sempre indica decimais, pontos são separadores de milhares
        const ultimaVirgulaIndex = str.lastIndexOf(',');
        const parteInteira = str.substring(0, ultimaVirgulaIndex).replace(/\./g, '');
        const parteDecimal = str.substring(ultimaVirgulaIndex + 1);
        
        // Validar: parte decimal deve ter no máximo 2 dígitos (centavos)
        // Se tiver mais de 2 dígitos, pode ser um erro de formatação na planilha
        // Exemplo: "340.432,00" pode ser "3.404,32" com vírgula no lugar errado
        if (parteDecimal.length > 2) {
          // Tentar interpretar: pode ser que os últimos 2 dígitos sejam decimais
          // Exemplo: "340.432,00" -> parte inteira: "340432", decimal: "00"
          // Mas se o correto é "3.404,32", então "340.432" pode ser "3404.32" mal formatado
          // Vamos assumir que se a parte decimal tem mais de 2 dígitos, é um erro
          // e vamos usar apenas os últimos 2 como decimais
          const decimalCorrigido = parteDecimal.substring(parteDecimal.length - 2);
          const inteiraCorrigida = parteInteira + parteDecimal.substring(0, parteDecimal.length - 2);
          const numero = parseFloat(`${inteiraCorrigida}.${decimalCorrigido}`);
          return isNaN(numero) ? undefined : numero;
        }
        
        const numero = parseFloat(`${parteInteira}.${parteDecimal}`);
        return isNaN(numero) ? undefined : numero;
      } else if (temVirgula && !temPonto) {
        // Apenas vírgula: "3404,32" (vírgula é decimal)
        const numero = parseFloat(str.replace(',', '.'));
        return isNaN(numero) ? undefined : numero;
      } else if (!temVirgula && temPonto) {
        // Apenas ponto: pode ser formato americano "3404.32" ou brasileiro sem decimais "3.404"
        // Se tiver mais de um ponto, é formato brasileiro sem decimais
        const pontos = (str.match(/\./g) || []).length;
        if (pontos > 1) {
          // Formato brasileiro sem decimais: "3.404" -> 3404
          const numero = parseFloat(str.replace(/\./g, ''));
          return isNaN(numero) ? undefined : numero;
        } else {
          // Formato americano: "3404.32" ou pode ser decimal brasileiro mal formatado
          // Verificar se parece ser decimal (tem 2 dígitos após o ponto)
          const partes = str.split('.');
          if (partes.length === 2 && partes[1].length <= 2) {
            // Provavelmente formato americano com decimais
            const numero = parseFloat(str);
            return isNaN(numero) ? undefined : numero;
          } else {
            // Provavelmente formato brasileiro sem decimais
            const numero = parseFloat(str.replace(/\./g, ''));
            return isNaN(numero) ? undefined : numero;
          }
        }
      } else {
        // Sem ponto nem vírgula: número inteiro
        const numero = parseFloat(str);
        return isNaN(numero) ? undefined : numero;
      }
    };

    // Processar valores numéricos usando a função auxiliar
    const quantidade = indices.quantidade !== undefined
      ? parsearNumero(linha[indices.quantidade])
      : undefined;

    const precoUnitario = indices.precoUnitario !== undefined
      ? parsearNumero(linha[indices.precoUnitario])
      : undefined;

    // SEMPRE usar o precoTotal da planilha, NUNCA calcular
    // O valor total com BDI deve vir diretamente da planilha
    const precoTotal = indices.precoTotal !== undefined
      ? parsearNumero(linha[indices.precoTotal])
      : undefined;

    // Se não tem precoTotal na planilha, usar 0 (não calcular)
    const precoTotalFinal = precoTotal !== undefined ? precoTotal : 0;

    linhas.push({
      item,
      referencia: indices.referencia !== undefined ? String(linha[indices.referencia] || '').trim() : undefined,
      descricao,
      unidade: indices.unidade !== undefined ? String(linha[indices.unidade] || '').trim() : undefined,
      quantidade,
      precoUnitario,
      precoTotal: precoTotalFinal,
    });
  }

  return linhas;
}

// Server Action: Importar planilha Excel
export async function importarPlanilhaContratual(
  obraId: string,
  nomeVersao: string,
  tipoVersao: 'BASELINE' | 'REVISAO',
  arquivoBuffer: Buffer,
  observacoes?: string
) {
  try {
    // Validar dados
    const dadosValidados = ImportPlanilhaSchema.parse({
      obraId,
      nomeVersao,
      tipoVersao,
      observacoes,
    });

    // Verificar se a obra existe
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { id: true, construtoraId: true },
    });

    if (!obra) {
      return { success: false, error: 'Obra não encontrada' };
    }

    // Processar planilha Excel
    const linhas = processarPlanilhaExcel(arquivoBuffer);

    if (linhas.length === 0) {
      return { success: false, error: 'Nenhuma linha válida encontrada na planilha' };
    }

    // Construir hierarquia
    const hierarquia = construirHierarquia(linhas);

    // Mapa auxiliar para saber quais códigos têm filhos
    const filhosPorCodigo = new Map<string, string[]>();
    hierarquia.forEach((valor, codigo) => {
      if (valor.parentId) {
        const lista = filhosPorCodigo.get(valor.parentId) || [];
        lista.push(codigo);
        filhosPorCodigo.set(valor.parentId, lista);
      }
    });

    // Desativar versões anteriores se for BASELINE
    if (tipoVersao === 'BASELINE') {
      await db.versaoOrcamento.updateMany({
        where: { obraId, status: 'ATIVA' },
        data: { status: 'OBSOLETA' },
      });
    }

    // Obter próximo número de versão
    const ultimaVersao = await db.versaoOrcamento.findFirst({
      where: { obraId },
      orderBy: { numero: 'desc' },
    });

    const proximoNumero = ultimaVersao ? ultimaVersao.numero + 1 : 1;

    // Criar versão do orçamento
    const versao = await db.versaoOrcamento.create({
      data: {
        obraId,
        numero: proximoNumero,
        nome: nomeVersao,
        tipo: tipoVersao,
        status: 'ATIVA',
        fase: 'PLANILHA_CONTRATUAL',
        observacoes: observacoes || null,
      },
    });

    // Desativar outras versões ativas (apenas uma pode estar ativa)
    await db.versaoOrcamento.updateMany({
      where: {
        obraId,
        id: { not: versao.id },
        status: 'ATIVA',
      },
      data: { status: 'OBSOLETA' },
    });

    // Criar itens do orçamento (passada 1)
    const itensParaCriar: Array<{
      versaoId: string;
      codigo: string;
      nivel: number;
      ordem: number;
      discriminacao: string;
      unidade: string | null;
      quantidade: number | null;
      precoUnitarioVenda: number | null;
      precoTotalVenda: number;
      tipo: 'AGRUPADOR' | 'ITEM';
      referencia: string | null;
      parentCode: string | null;
      id?: string;
    }> = [];

    // Mapear códigos para IDs (será preenchido após criar os itens)
    const codigoParaId = new Map<string, string>();

    // Ordenar linhas por código para garantir ordem correta
    const linhasOrdenadas = Array.from(hierarquia.entries())
      .sort(([codigoA], [codigoB]) => {
        // Comparar códigos hierárquicos (ex: "1.0" < "1.1" < "1.1.1" < "2.0")
        const partesA = codigoA.split('.').map(Number);
        const partesB = codigoB.split('.').map(Number);
        const maxLen = Math.max(partesA.length, partesB.length);
        
        for (let i = 0; i < maxLen; i++) {
          const a = partesA[i] || 0;
          const b = partesB[i] || 0;
          if (a !== b) return a - b;
        }
        return 0;
      });

    // Contador de ordem por parent (chave: parentCode ou 'root' para itens sem parent)
    const ordemPorParent = new Map<string, number>();

    for (const [codigo, { linha, parentId }] of linhasOrdenadas) {
      const nivel = calcularNivel(codigo);
      const tipoBase = determinarTipo(linha);
      const tipo = filhosPorCodigo.has(codigo) ? 'AGRUPADOR' : tipoBase;

      // Obter ordem dentro do parent (ou 'root' se não tem parent)
      const parentKey = parentId || 'root';
      const ordemAtual = ordemPorParent.get(parentKey) || 0;
      ordemPorParent.set(parentKey, ordemAtual + 1);

      // Preparar dados do item
      const itemData = {
        versaoId: versao.id,
        codigo,
        nivel,
        ordem: ordemAtual,
        discriminacao: linha.descricao,
        unidade: tipo === 'ITEM' && linha.unidade ? linha.unidade : null,
        quantidade: tipo === 'ITEM' && linha.quantidade !== undefined
          ? linha.quantidade
          : null,
        precoUnitarioVenda: tipo === 'ITEM' && linha.precoUnitario !== undefined
          ? linha.precoUnitario
          : null,
        precoTotalVenda: linha.precoTotal || 0,
        tipo,
        referencia: linha.referencia || null,
        parentCode: parentId,
      };

      itensParaCriar.push(itemData);
    }

    // Passada 1: criar registros com parentId null
    for (const itemData of itensParaCriar) {
      const itemCriado = await db.itemOrcamento.create({
        data: {
          versaoId: itemData.versaoId,
          codigo: itemData.codigo,
          nivel: itemData.nivel,
          ordem: itemData.ordem,
          discriminacao: itemData.discriminacao,
          unidade: itemData.unidade,
          quantidade: itemData.quantidade,
          precoUnitarioVenda: itemData.precoUnitarioVenda,
          precoTotalVenda: itemData.precoTotalVenda,
          tipo: itemData.tipo,
          referencia: itemData.referencia,
          parentId: null,
        },
      });

      itemData.id = itemCriado.id;
      codigoParaId.set(itemData.codigo, itemCriado.id);
    }

    // Passada 2: atualizar parentId com IDs já criados
    const updates = itensParaCriar
      .filter((item) => item.parentCode)
      .map((item) => {
        const parentId = codigoParaId.get(item.parentCode!);
        if (!parentId || !item.id) return null;

        return db.itemOrcamento.update({
          where: { id: item.id },
          data: { parentId },
        });
      })
      .filter(Boolean) as Promise<unknown>[];

    await Promise.all(updates);

    // Recalcular totais dos agrupadores (bottom-up)
    await recalcularTotaisAgrupadores(versao.id);

    // Buscar construtoraId para revalidar caminhos dinâmicos
    const obraComConstrutora = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });
    
    // Revalidar caminhos
    revalidatePath(`/eng/orcamento`);
    if (obraComConstrutora) {
      revalidatePath(`/eng/orcamento/${obraComConstrutora.construtoraId}/${obraId}/planilha-contratual`, 'page');
      revalidatePath(`/eng/orcamento/${obraComConstrutora.construtoraId}/${obraId}`, 'page');
    }

    return {
      success: true,
      versaoId: versao.id,
      totalItens: itensParaCriar.length,
    };
  } catch (error: any) {
    console.error('Erro ao importar planilha:', error);
    return {
      success: false,
      error: error.message || 'Erro ao importar planilha',
    };
  }
}

// Função auxiliar para recalcular totais dos agrupadores
async function recalcularTotaisAgrupadores(versaoId: string) {
  // Buscar todos os itens da versão
  const itens = await db.itemOrcamento.findMany({
    where: { versaoId },
    orderBy: [{ nivel: 'desc' }, { ordem: 'asc' }], // Do mais profundo para o mais raso
  });

  // Mapear itens por ID
  const itensPorId = new Map(itens.map((item: typeof itens[0]) => [item.id, item]));

  // Calcular totais bottom-up (do mais profundo para o mais raso)
  for (const item of itens) {
    if (item.tipo === 'AGRUPADOR') {
      // Buscar todos os filhos diretos
      const filhos = itens.filter((i: typeof itens[0]) => i.parentId === item.id);
      
      // Soma dos preços totais dos filhos
      const totalFilhos = filhos.reduce((sum: number, filho: typeof itens[0]) => {
        return sum + Number(filho.precoTotalVenda);
      }, 0);

      // Atualizar preço total do agrupador
      if (Number(item.precoTotalVenda) !== totalFilhos) {
        await db.itemOrcamento.update({
          where: { id: item.id },
          data: {
            precoTotalVenda: totalFilhos,
          },
        });
      }
    }
  }
}

// Server Action: Buscar versão ativa do orçamento
export async function buscarVersaoAtivaOrcamento(obraId: string) {
  try {
    const versao = await db.versaoOrcamento.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          orderBy: [
            { nivel: 'asc' },
            { ordem: 'asc' },
          ],
        },
      },
    });

    return versao;
  } catch (error: any) {
    console.error('Erro ao buscar versão ativa:', error);
    return null;
  }
}

// Server Action: Listar todas as versões do orçamento
export async function listarVersoesOrcamento(obraId: string) {
  try {
    const versoes = await db.versaoOrcamento.findMany({
      where: { obraId },
      orderBy: [
        { numero: 'desc' },
      ],
    });

    return versoes;
  } catch (error: any) {
    console.error('Erro ao listar versões:', error);
    return [];
  }
}

// Server Action: Ativar versão do orçamento
export async function ativarVersaoOrcamento(obraId: string, versaoId: string) {
  try {
    // Validar que a versão pertence à obra
    const versao = await db.versaoOrcamento.findUnique({
      where: { id: versaoId },
      select: { obraId: true },
    });

    if (!versao || versao.obraId !== obraId) {
      return { success: false, error: 'Versão não encontrada ou não pertence à obra especificada' };
    }

    // Desativar todas as versões ativas
    await db.versaoOrcamento.updateMany({
      where: {
        obraId,
        status: 'ATIVA',
      },
      data: { status: 'OBSOLETA' },
    });

    // Ativar a versão selecionada
    await db.versaoOrcamento.update({
      where: { id: versaoId },
      data: { status: 'ATIVA' },
    });

    // Buscar construtoraId para revalidar caminhos dinâmicos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    revalidatePath(`/eng/orcamento`);
    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/planilha-contratual`, 'page');
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao ativar versão:', error);
    return { success: false, error: error.message };
  }
}

// Server Action: Atualizar item do orçamento
export async function atualizarItemOrcamento(
  itemId: string,
  dados: {
    codigo?: string;
    discriminacao?: string;
    unidade?: string | null;
    quantidade?: number | null;
    precoUnitarioVenda?: number | null;
    precoTotalVenda?: number;
    referencia?: string | null;
  }
) {
  try {
    const item = await db.itemOrcamento.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return { success: false, error: 'Item não encontrado' };
    }

    const novoCodigo = dados.codigo ? String(dados.codigo).trim() : undefined;

    // Se o código mudou, recalcular hierarquia
    if (novoCodigo && novoCodigo !== item.codigo) {
      const novoNivel = calcularNivel(novoCodigo);
      
      // Buscar todos os itens da versão para recalcular hierarquia
      const versao = await db.versaoOrcamento.findUnique({
        where: { id: item.versaoId },
        include: { itens: true },
      });

      if (!versao) {
        return { success: false, error: 'Versão não encontrada' };
      }

      // Criar array temporário com o código atualizado
      const itensAtualizados: LinhaPlanilha[] = versao.itens.map((i: typeof versao.itens[0]) => {
        if (i.id === itemId) {
          return {
            item: novoCodigo,
            referencia: dados.referencia !== undefined && dados.referencia !== null ? dados.referencia : (i.referencia !== null && i.referencia !== undefined ? i.referencia : undefined),
            descricao: dados.discriminacao ?? i.discriminacao,
            unidade: dados.unidade !== undefined && dados.unidade !== null ? dados.unidade : (i.unidade !== null && i.unidade !== undefined ? i.unidade : undefined),
            quantidade: dados.quantidade !== undefined && dados.quantidade !== null ? dados.quantidade : (i.quantidade !== null && i.quantidade !== undefined ? Number(i.quantidade) : undefined),
            precoUnitario: dados.precoUnitarioVenda !== undefined && dados.precoUnitarioVenda !== null ? dados.precoUnitarioVenda : (i.precoUnitarioVenda !== null && i.precoUnitarioVenda !== undefined ? Number(i.precoUnitarioVenda) : undefined),
            precoTotal: dados.precoTotalVenda !== undefined ? dados.precoTotalVenda : Number(i.precoTotalVenda),
          };
        }
        return {
          item: i.codigo,
          referencia: i.referencia !== null && i.referencia !== undefined ? i.referencia : undefined,
          descricao: i.discriminacao,
          unidade: i.unidade !== null && i.unidade !== undefined ? i.unidade : undefined,
          quantidade: i.quantidade !== null && i.quantidade !== undefined ? Number(i.quantidade) : undefined,
          precoUnitario: i.precoUnitarioVenda !== null && i.precoUnitarioVenda !== undefined ? Number(i.precoUnitarioVenda) : undefined,
          precoTotal: Number(i.precoTotalVenda),
        };
      });

      // Construir hierarquia com os códigos atualizados
      const hierarquia = construirHierarquia(itensAtualizados);
      const parentCodigo = novoCodigo ? hierarquia.get(novoCodigo)?.parentId : null;
      const parentId = parentCodigo 
        ? versao.itens.find((i: typeof versao.itens[0]) => i.codigo === parentCodigo)?.id || null
        : null;

      // Atualizar item com novo código, nível e parentId
      await db.itemOrcamento.update({
        where: { id: itemId },
        data: {
          codigo: novoCodigo,
          nivel: novoNivel,
          parentId: parentId,
          discriminacao: dados.discriminacao ?? item.discriminacao,
          unidade: dados.unidade !== undefined ? dados.unidade : item.unidade,
          quantidade: dados.quantidade !== undefined ? dados.quantidade : item.quantidade,
          precoUnitarioVenda: dados.precoUnitarioVenda !== undefined ? dados.precoUnitarioVenda : item.precoUnitarioVenda,
          precoTotalVenda: dados.precoTotalVenda !== undefined ? dados.precoTotalVenda : item.precoTotalVenda,
          referencia: dados.referencia !== undefined ? dados.referencia : item.referencia,
        },
      });

      // Atualizar parentId de todos os filhos deste item (se houver)
      // Os filhos mantêm o mesmo parentId (ID do banco), mas precisamos verificar
      // se o código do pai mudou de forma que afete a hierarquia dos filhos
      const filhos = versao.itens.filter((i: typeof versao.itens[0]) => i.parentId === itemId);
      for (const filho of filhos) {
        // Recalcular parentId do filho baseado na nova hierarquia
        // O filho mantém seu código, mas o parentId pode mudar se o código do pai mudou
        const filhoHierarquia = hierarquia.get(filho.codigo);
        if (filhoHierarquia) {
          const novoParentCodigo = filhoHierarquia.parentId;
          const novoParentId = novoParentCodigo
            ? versao.itens.find((i: typeof versao.itens[0]) => i.codigo === novoParentCodigo)?.id || itemId
            : null;
          
          // Se o parentId mudou, atualizar
          if (novoParentId !== filho.parentId) {
            await db.itemOrcamento.update({
              where: { id: filho.id },
              data: { parentId: novoParentId },
            });
          }
        }
      }

      // Recalcular totais dos agrupadores
      await recalcularTotaisAgrupadores(item.versaoId);

      // Buscar obra para revalidar caminhos dinâmicos
      const versaoAtualizada = await db.versaoOrcamento.findUnique({
        where: { id: item.versaoId },
        select: { obraId: true },
      });

      if (versaoAtualizada) {
        const obraAtualizada = await db.obra.findUnique({
          where: { id: versaoAtualizada.obraId },
          select: { construtoraId: true },
        });

        if (obraAtualizada) {
          revalidatePath(`/eng/orcamento`);
          revalidatePath(`/eng/orcamento/${obraAtualizada.construtoraId}/${versaoAtualizada.obraId}/planilha-contratual`, 'page');
          revalidatePath(`/eng/orcamento/${obraAtualizada.construtoraId}/${versaoAtualizada.obraId}`, 'page');
        }
      }

      return { success: true };
    }

    // Atualização normal (sem mudança de código)
    await db.itemOrcamento.update({
      where: { id: itemId },
      data: {
        discriminacao: dados.discriminacao ?? item.discriminacao,
        unidade: dados.unidade !== undefined ? dados.unidade : item.unidade,
        quantidade: dados.quantidade !== undefined ? dados.quantidade : item.quantidade,
        precoUnitarioVenda: dados.precoUnitarioVenda !== undefined ? dados.precoUnitarioVenda : item.precoUnitarioVenda,
        precoTotalVenda: dados.precoTotalVenda !== undefined ? dados.precoTotalVenda : item.precoTotalVenda,
        referencia: dados.referencia !== undefined ? dados.referencia : item.referencia,
      },
    });

    // Recalcular totais dos agrupadores
    await recalcularTotaisAgrupadores(item.versaoId);

    // Buscar obra para revalidar caminhos dinâmicos
    const versaoAtualizada = await db.versaoOrcamento.findUnique({
      where: { id: item.versaoId },
      select: { obraId: true },
    });

    if (versaoAtualizada) {
      const obraAtualizada = await db.obra.findUnique({
        where: { id: versaoAtualizada.obraId },
        select: { construtoraId: true },
      });

      if (obraAtualizada) {
        revalidatePath(`/eng/orcamento`);
        revalidatePath(`/eng/orcamento/${obraAtualizada.construtoraId}/${versaoAtualizada.obraId}/planilha-contratual`, 'page');
        revalidatePath(`/eng/orcamento/${obraAtualizada.construtoraId}/${versaoAtualizada.obraId}`, 'page');
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar item:', error);
    return { success: false, error: error.message };
  }
}

// Server Action: Excluir versão do orçamento (apenas a última versão)
export async function excluirVersaoOrcamento(obraId: string, versaoId: string, permitirQualquerVersao: boolean = false) {
  try {
    // Validar que a versão pertence à obra e buscar seu status e fase
    const versao = await db.versaoOrcamento.findUnique({
      where: { id: versaoId },
      select: { obraId: true, status: true, numero: true, fase: true, createdAt: true },
    });

    if (!versao || versao.obraId !== obraId) {
      return { success: false, error: 'Versão não encontrada ou não pertence à obra especificada' };
    }

    // Se for versão de PLANILHA_CONTRATUAL, verificar se há versões de CUSTOS_ORCADOS baseadas nela
    if (versao.fase === 'PLANILHA_CONTRATUAL') {
      // Buscar versões de custos orçados que podem estar baseadas nesta versão contratual
      // Verificamos pela observação (que contém a referência à versão contratual) ou pela data de criação
      const versoesCustos = await db.versaoOrcamento.findMany({
        where: {
          obraId,
          fase: 'CUSTOS_ORCADOS',
          OR: [
            {
              observacoes: {
                contains: `versão ${versao.numero}`, // Verifica se a observação menciona esta versão
              },
            },
            {
              // Se não há menção específica, verifica se foi criada após esta versão
              // e se ainda não há uma versão contratual mais recente
              createdAt: {
                gte: versao.createdAt,
              },
            },
          ],
        },
      });

      // Verificar se há versão contratual mais recente que esta
      const versaoContratualMaisRecente = await db.versaoOrcamento.findFirst({
        where: {
          obraId,
          fase: 'PLANILHA_CONTRATUAL',
          numero: {
            gt: versao.numero,
          },
        },
        orderBy: { numero: 'desc' },
      });

      // Se não há versão contratual mais recente, todas as versões de custos podem estar baseadas nesta
      // Se há versão mais recente, filtrar apenas versões criadas antes dela
      const versoesCustosBaseadas = versaoContratualMaisRecente
        ? versoesCustos.filter((v: typeof versoesCustos[0]) => v.createdAt < versaoContratualMaisRecente.createdAt)
        : versoesCustos;

      if (versoesCustosBaseadas.length > 0) {
        const nomesVersoes = versoesCustosBaseadas.map((v: typeof versoesCustosBaseadas[0]) => v.nome).join(', ');
        return {
          success: false,
          error: `Não é possível excluir esta versão da planilha contratual pois existem ${versoesCustosBaseadas.length} versão(ões) de custos orçados baseadas nela: ${nomesVersoes}. Exclua primeiro as versões de custos orçados.`,
          versoesCustos: versoesCustosBaseadas.map((v: typeof versoesCustosBaseadas[0]) => ({ id: v.id, nome: v.nome })),
        };
      }
    }

    // Se não permitir qualquer versão (planilha contratual), só pode excluir a última versão da mesma fase
    if (!permitirQualquerVersao) {
      const todasVersoesMesmaFase = await db.versaoOrcamento.findMany({
        where: {
          obraId,
          fase: versao.fase, // Filtrar apenas versões da mesma fase
        },
        orderBy: { numero: 'desc' },
      });

      if (todasVersoesMesmaFase.length === 0) {
        return { success: false, error: 'Nenhuma versão encontrada' };
      }

      const ultimaVersao = todasVersoesMesmaFase[0];

      // Se houver apenas 1 versão, permitir excluir. Caso contrário, só pode excluir a última
      if (todasVersoesMesmaFase.length > 1 && ultimaVersao.id !== versaoId) {
        return { 
          success: false, 
          error: 'Apenas a última versão criada pode ser excluída. Exclua as versões mais recentes primeiro.' 
        };
      }
    }

    // Se a versão a ser excluída estiver ativa, ativar a próxima versão mais recente da mesma fase
    if (versao.status === 'ATIVA') {
      const proximaVersao = await db.versaoOrcamento.findFirst({
        where: {
          obraId,
          fase: versao.fase, // Buscar apenas versões da mesma fase
          id: { not: versaoId },
        },
        orderBy: { numero: 'desc' },
      });

      if (proximaVersao) {
        await db.versaoOrcamento.update({
          where: { id: proximaVersao.id },
          data: { status: 'ATIVA' },
        });
      }
    }

    // Excluir a versão (cascade vai excluir os itens automaticamente)
    await db.versaoOrcamento.delete({
      where: { id: versaoId },
    });

    // Buscar construtoraId para revalidar caminhos dinâmicos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    revalidatePath(`/eng/orcamento`);
    if (obra) {
      // Revalidar apenas o caminho correspondente à fase da versão excluída
      if (versao.fase === 'PLANILHA_CONTRATUAL') {
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/planilha-contratual`, 'page');
      } else if (versao.fase === 'CUSTOS_ORCADOS') {
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'page');
      }
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir versão:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// CUSTOS ORÇADOS (Fase 2: Custos Orçados)
// ============================================================

// Server Action: Excluir versão de custos orçados
export async function excluirVersaoCustoOrcado(obraId: string, versaoId: string, permitirQualquerVersao: boolean = false) {
  try {
    // Validar que a versão pertence à obra e buscar seu status
    const versao = await db.versaoCustoOrcado.findUnique({
      where: { id: versaoId },
      select: { obraId: true, status: true, numero: true, createdAt: true },
    });

    if (!versao || versao.obraId !== obraId) {
      return { success: false, error: 'Versão não encontrada ou não pertence à obra especificada' };
    }

    // Se não permitir qualquer versão, só pode excluir a última versão
    if (!permitirQualquerVersao) {
      const todasVersoes = await db.versaoCustoOrcado.findMany({
        where: {
          obraId,
        },
        orderBy: { numero: 'desc' },
      });

      if (todasVersoes.length === 0) {
        return { success: false, error: 'Nenhuma versão encontrada' };
      }

      const ultimaVersao = todasVersoes[0];

      // Se houver apenas 1 versão, permitir excluir. Caso contrário, só pode excluir a última
      if (todasVersoes.length > 1 && ultimaVersao.id !== versaoId) {
        return { 
          success: false, 
          error: 'Apenas a última versão criada pode ser excluída. Exclua as versões mais recentes primeiro.' 
        };
      }
    }

    // Se a versão a ser excluída estiver ativa, ativar a próxima versão mais recente
    if (versao.status === 'ATIVA') {
      const proximaVersao = await db.versaoCustoOrcado.findFirst({
        where: {
          obraId,
          id: { not: versaoId },
        },
        orderBy: { numero: 'desc' },
      });

      if (proximaVersao) {
        await db.versaoCustoOrcado.update({
          where: { id: proximaVersao.id },
          data: { status: 'ATIVA' },
        });
      }
    }

    // Excluir a versão (cascade vai excluir os itens automaticamente)
    await db.versaoCustoOrcado.delete({
      where: { id: versaoId },
    });

    // Buscar construtoraId para revalidar caminhos dinâmicos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    revalidatePath(`/eng/orcamento`);
    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'page');
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'layout');
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir versão de custos orçados:', error);
    return { success: false, error: error.message };
  }
}

// Função auxiliar: Obter próximo número de revisão para uma versão contratual
async function obterProximoNumeroRevisao(obraId: string, versaoContratualId: string): Promise<number> {
  const ultimaVersaoCusto = await db.versaoCustoOrcado.findFirst({
    where: {
      obraId,
      versaoContratualId,
    },
    orderBy: { numeroRevisao: 'desc' },
  });

  return ultimaVersaoCusto ? ultimaVersaoCusto.numeroRevisao + 1 : 1;
}

// Função auxiliar: Obter próximo número de versão de custos orçados
async function obterProximoNumeroVersaoCusto(obraId: string): Promise<number> {
  const ultimaVersao = await db.versaoCustoOrcado.findFirst({
    where: { obraId },
    orderBy: { numero: 'desc' },
  });

  return ultimaVersao ? ultimaVersao.numero + 1 : 1;
}

// Função auxiliar: Copiar itens de ItemOrcamento para ItemCustoOrcado
async function copiarItensParaVersaoCusto(
  versaoContratualId: string,
  versaoCustoOrcadoId: string
): Promise<Map<string, string>> {
  // Buscar todos os itens da versão contratual
  const itensContratual = await db.itemOrcamento.findMany({
    where: { versaoId: versaoContratualId },
    orderBy: [
      { nivel: 'asc' },
      { ordem: 'asc' },
    ],
  });

  // Mapa de IDs antigos para novos (para mapear parentId)
  const idAntigoParaNovo = new Map<string, string>();
  const codigoParaIdNovo = new Map<string, string>();

  // Criar itens na versão de custos em ordem hierárquica
  for (const itemContratual of itensContratual) {
    // Determinar o novo parentId baseado no mapeamento
    const novoParentId = itemContratual.parentId 
      ? idAntigoParaNovo.get(itemContratual.parentId) || null 
      : null;

    // Calcular custos (zerados inicialmente - serão preenchidos depois)
    const valorMaterial = 0;
    const valorMaoDeObra = 0;
    const valorEquipamento = 0;
    const valorVerba = 0;
    const custoUnitarioTotal = valorMaterial + valorMaoDeObra + valorEquipamento + valorVerba;
    const quantidade = itemContratual.quantidade ? Number(itemContratual.quantidade) : 0;
    const custoTotal = custoUnitarioTotal * quantidade;
    const precoTotalVenda = Number(itemContratual.precoTotalVenda);
    const lucroProjetado = precoTotalVenda - custoTotal;
    const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

    const itemCusto = await db.itemCustoOrcado.create({
      data: {
        versaoCustoOrcadoId: versaoCustoOrcadoId,
        codigo: itemContratual.codigo,
        nivel: itemContratual.nivel,
        ordem: itemContratual.ordem,
        discriminacao: itemContratual.discriminacao,
        unidade: itemContratual.unidade,
        quantidade: itemContratual.quantidade,
        precoUnitarioVenda: itemContratual.precoUnitarioVenda,
        precoTotalVenda: itemContratual.precoTotalVenda,
        tipo: itemContratual.tipo,
        referencia: itemContratual.referencia,
        parentId: novoParentId,
        etapa: itemContratual.etapa,
        subEtapa: itemContratual.subEtapa,
        grupoCusto: itemContratual.grupoCusto,
        // Custos unitários
        valorMaterial,
        valorMaoDeObra,
        valorEquipamento,
        valorVerba,
        custoUnitarioTotal,
        custoTotal,
        lucroProjetado,
        margem,
      },
    });

    idAntigoParaNovo.set(itemContratual.id, itemCusto.id);
    codigoParaIdNovo.set(itemContratual.codigo, itemCusto.id);
  }

  return codigoParaIdNovo;
}

// Server Action: Buscar itens da planilha contratual (versão ativa) para custos orçados
export async function buscarItensPlanilhaContratual(obraId: string) {
  try {
    const versao = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versao) {
      return { success: false, error: 'Nenhuma versão ativa encontrada para esta obra' };
    }

    // Retornar apenas os campos necessários da planilha contratual
    const itens = versao.itens.map((item: typeof versao.itens[0]) => ({
      id: item.id,
      codigo: item.codigo,
      discriminacao: item.discriminacao,
      unidade: item.unidade,
      quantidade: item.quantidade ? Number(item.quantidade) : 0,
      precoTotalVenda: Number(item.precoTotalVenda),
      nivel: item.nivel,
      tipo: item.tipo,
      parentId: item.parentId,
      referencia: item.referencia,
    }));

    return {
      success: true,
      versaoId: versao.id,
      versaoNumero: versao.numero,
      versaoNome: versao.nome,
      versaoUpdatedAt: versao.updatedAt.toISOString(),
      itens,
    };
  } catch (error: any) {
    console.error('Erro ao buscar itens da planilha contratual:', error);
    return { success: false, error: error.message };
  }
}

// Server Action: Listar versões de custos orçados
export async function listarVersoesCustoOrcado(obraId: string) {
  try {
    const versoes = await db.versaoCustoOrcado.findMany({
      where: { obraId },
      include: {
        versaoContratual: {
          select: {
            nome: true,
            numero: true,
          },
        },
      },
      orderBy: [
        { numero: 'desc' },
        { numeroRevisao: 'desc' },
      ],
    });

    return versoes.map((versao: typeof versoes[0]) => ({
      id: versao.id,
      numero: versao.numero,
      nome: versao.nome,
      numeroRevisao: versao.numeroRevisao,
      tipo: versao.tipo,
      status: versao.status,
      versaoContratualId: versao.versaoContratualId,
      versaoContratualNome: versao.versaoContratual.nome,
      observacoes: versao.observacoes,
      createdAt: versao.createdAt,
      updatedAt: versao.updatedAt,
    }));
  } catch (error: any) {
    console.error('Erro ao listar versões de custos orçados:', error);
    return [];
  }
}

// Server Action: Buscar custos orçados (custos agora estão diretamente em ItemCustoOrcado)
export async function buscarCustosOrcados(obraId: string, versaoId?: string) {
  try {
    // Se versaoId foi fornecido, buscar essa versão específica
    if (versaoId) {
      const versao = await db.versaoCustoOrcado.findUnique({
        where: { id: versaoId },
        include: {
          versaoContratual: {
            select: {
              nome: true,
              numero: true,
            },
          },
        },
      });
      
      if (!versao || versao.obraId !== obraId) {
        return { 
          success: false, 
          error: 'Versão de custos orçados não encontrada.' 
        };
      }

      // Buscar todos os itens (custos agora estão diretamente em ItemCustoOrcado)
      const itens = await db.itemCustoOrcado.findMany({
        where: { versaoCustoOrcadoId: versao.id },
        orderBy: [
          { nivel: 'asc' },
          { ordem: 'asc' },
        ],
      });

      // Mapear para o formato esperado
      const custos = itens.map((item: typeof itens[0]) => ({
        itemId: item.id,
        codigo: item.codigo,
        discriminacao: item.discriminacao,
        unidade: item.unidade,
        quantidade: item.quantidade ? Number(item.quantidade) : 0,
        precoTotalVenda: Number(item.precoTotalVenda),
        nivel: item.nivel,
        tipo: item.tipo,
        parentId: item.parentId,
        referencia: item.referencia,
        ordem: item.ordem,
        custoMat: Number(item.valorMaterial),
        custoMO: Number(item.valorMaoDeObra),
        custoContratos: Number(item.valorVerba),
        custoEqFr: Number(item.valorEquipamento),
        custoUnitarioTotal: Number(item.custoUnitarioTotal),
        custoTotal: Number(item.custoTotal),
      }));

      return {
        success: true,
        versaoId: versao.id,
        versaoNumero: versao.numero,
        versaoNome: versao.nome,
        versaoNumeroRevisao: versao.numeroRevisao,
        versaoUpdatedAt: versao.updatedAt.toISOString(),
        custos,
      };
    }

    // Comportamento original: buscar versão ativa
    // Primeiro verificar se existe versão ativa da planilha contratual
    const versaoContratual = await db.versaoOrcamento.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
        fase: 'PLANILHA_CONTRATUAL',
      },
    });

    if (!versaoContratual) {
      return { 
        success: false, 
        error: 'Nenhuma versão ativa da planilha contratual encontrada. É necessário criar uma planilha contratual primeiro.' 
      };
    }

    // Buscar versão ativa de custos orçados (usando novo modelo)
    const versao = await db.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
        versaoContratualId: versaoContratual.id,
      },
      include: {
        versaoContratual: {
          select: {
            nome: true,
            numero: true,
          },
        },
      },
    });
    
    if (!versao) {
      return { 
        success: false, 
        error: 'Nenhuma versão de custos orçados encontrada. Use o botão "Atualizar da Planilha" para criar a primeira versão.' 
      };
    }

    // Buscar todos os itens (custos agora estão diretamente em ItemCustoOrcado)
    const itens = await db.itemCustoOrcado.findMany({
      where: { versaoCustoOrcadoId: versao.id },
      orderBy: [
        { nivel: 'asc' },
        { ordem: 'asc' },
      ],
    });

    // Mapear para o formato esperado
    const custos = itens.map((item: typeof itens[0]) => ({
      itemId: item.id,
      codigo: item.codigo,
      discriminacao: item.discriminacao,
      unidade: item.unidade,
      quantidade: item.quantidade ? Number(item.quantidade) : 0,
      precoTotalVenda: Number(item.precoTotalVenda),
      nivel: item.nivel,
      tipo: item.tipo,
      parentId: item.parentId,
      referencia: item.referencia,
      ordem: item.ordem,
      custoMat: Number(item.valorMaterial),
      custoMO: Number(item.valorMaoDeObra),
      custoContratos: Number(item.valorVerba),
      custoEqFr: Number(item.valorEquipamento),
      custoUnitarioTotal: Number(item.custoUnitarioTotal),
      custoTotal: Number(item.custoTotal),
    }));

    return {
      success: true,
      versaoId: versao.id,
      versaoNumero: versao.numero,
      versaoNome: versao.nome,
      versaoNumeroRevisao: versao.numeroRevisao,
      versaoUpdatedAt: versao.updatedAt.toISOString(),
      custos,
    };
  } catch (error: any) {
    console.error('Erro ao buscar custos orçados:', error);
    return { success: false, error: error.message };
  }
}

// Server Action: Verificar se há atualizações na planilha contratual
export async function verificarAtualizacoesPlanilha(obraId: string, versaoCustosId?: string) {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { 
        success: false, 
        error: 'Nenhuma versão ativa da planilha contratual encontrada',
        temAtualizacoes: false,
      };
    }

    // Se não foi passada uma versão de custos, sempre retorna que há atualizações
    if (!versaoCustosId) {
      return {
        success: true,
        temAtualizacoes: true,
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Buscar a versão de custos para comparar (usando novo modelo)
    const versaoCustos = await db.versaoCustoOrcado.findUnique({
      where: { id: versaoCustosId },
      select: { updatedAt: true, versaoContratualId: true },
    });

    if (!versaoCustos) {
      return {
        success: true,
        temAtualizacoes: true, // Se não existe versão de custos, há atualizações
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Verificar se a versão de custos está baseada na versão contratual atual
    if (versaoCustos.versaoContratualId !== versaoContratual.id) {
      return {
        success: true,
        temAtualizacoes: true, // Nova versão contratual disponível
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Comparar com a data de atualização da versão contratual
    const dataVersaoCustos = versaoCustos.updatedAt;
    const dataVersaoContratual = versaoContratual.updatedAt;

    // Verificar se a versão contratual foi atualizada após a versão de custos
    const temAtualizacoes = dataVersaoContratual > dataVersaoCustos;

    return {
      success: true,
      temAtualizacoes,
      versaoId: versaoContratual.id,
      versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Erro ao verificar atualizações:', error);
    return { success: false, error: error.message, temAtualizacoes: false };
  }
}

// Server Action: Sincronizar custos da planilha contratual (atualizar apenas itens modificados/inseridos/excluídos)
export async function sincronizarCustosDaPlanilha(obraId: string) {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { success: false, error: 'Nenhuma versão ativa da planilha contratual encontrada' };
    }

    // Buscar versão ativa de custos orçados vinculada à versão contratual atual
    let versaoCustos = await db.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
        versaoContratualId: versaoContratual.id,
      },
      include: {
        itens: true,
      },
    });
    
    // Se não encontrou versão vinculada à versão contratual atual, buscar a última versão ativa (pode estar vinculada a versão anterior)
    if (!versaoCustos) {
      versaoCustos = await db.versaoCustoOrcado.findFirst({
        where: {
          obraId,
          status: 'ATIVA',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          itens: true,
        },
      });
    }

    // Se não existe versão de custos para esta versão contratual, criar uma nova
    if (!versaoCustos) {
      // Obter próximo número de versão e número de revisão
      const proximoNumero = await obterProximoNumeroVersaoCusto(obraId);
      const proximoNumeroRevisao = await obterProximoNumeroRevisao(obraId, versaoContratual.id);

      // Criar nova versão de custos usando o nome da versão contratual
      const novaVersaoCustos = await db.versaoCustoOrcado.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome, // Usar o nome da versão contratual
          numeroRevisao: proximoNumeroRevisao,
          tipo: 'BASELINE',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de Planilha contratual - Criada a partir da planilha contratual versão ${versaoContratual.numero}`,
        },
      });

      // Copiar todos os itens da versão contratual para a versão de custos
      // A função copiarItensParaVersaoCusto já cria os itens com os custos diretamente em ItemCustoOrcado
      await copiarItensParaVersaoCusto(versaoContratual.id, novaVersaoCustos.id);

      // Contar itens criados
      const itensCustos = await db.itemCustoOrcado.findMany({
        where: { versaoCustoOrcadoId: novaVersaoCustos.id, tipo: 'ITEM' },
      });
      const itensCriados = itensCustos.length;

      // Recalcular totais dos agrupadores
      await recalcularCustosAgrupadoresVersaoCusto(novaVersaoCustos.id);

      // Buscar construtoraId para revalidar caminhos
      const obra = await db.obra.findUnique({
        where: { id: obraId },
        select: { construtoraId: true },
      });

      if (obra) {
        try {
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'page');
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'layout');
        } catch (revalidateError) {
          console.warn('Erro ao revalidar caminhos:', revalidateError);
        }
      }

      return {
        success: true,
        itensCriados,
        itensAtualizados: 0,
        itensExcluidos: 0,
        versaoId: novaVersaoCustos.id,
        novaVersaoCriada: true,
      };
    }

    // Verificar se a versão de custos está baseada na versão contratual atual
    if (versaoCustos.versaoContratualId !== versaoContratual.id) {
      // Nova versão contratual - criar nova versão de custos com revisão 01
      const proximoNumero = await obterProximoNumeroVersaoCusto(obraId);
      
      // Buscar itens da versão anterior de custos para preservar custos unitários
      const itensVersaoAnterior = await db.itemCustoOrcado.findMany({
        where: { versaoCustoOrcadoId: versaoCustos.id },
      });
      
      // Criar mapa de custos por código para busca rápida (normalizar códigos removendo espaços)
      const custosPorCodigo = new Map<string, typeof itensVersaoAnterior[0]>();
      itensVersaoAnterior.forEach((item: typeof itensVersaoAnterior[0]) => {
        const codigoNormalizado = item.codigo?.trim() || '';
        if (codigoNormalizado) {
          // Armazenar com código normalizado, mas manter referência ao item original
          custosPorCodigo.set(codigoNormalizado, item);
        }
      });
      
      console.log(`[sincronizarCustosDaPlanilha] Versão anterior encontrada: ${versaoCustos.id}, Itens: ${itensVersaoAnterior.length}, Itens com custos: ${itensVersaoAnterior.filter((i: typeof itensVersaoAnterior[0]) => Number(i.valorMaterial) > 0 || Number(i.valorMaoDeObra) > 0 || Number(i.valorEquipamento) > 0 || Number(i.valorVerba) > 0).length}`);
      
      // Desativar versão anterior
      await db.versaoCustoOrcado.update({
        where: { id: versaoCustos.id },
        data: { status: 'OBSOLETA' },
      });

      // Criar nova versão de custos baseada na nova versão contratual
      const novaVersaoCustos = await db.versaoCustoOrcado.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome,
          numeroRevisao: 1, // Começar do 1 para nova versão contratual
          tipo: 'BASELINE',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de Planilha contratual - Nova versão contratual (versão ${versaoContratual.numero})`,
        },
      });

      // Buscar itens da nova versão contratual
      const itensContratual = await db.itemOrcamento.findMany({
        where: { versaoId: versaoContratual.id },
        orderBy: [
          { nivel: 'asc' },
          { ordem: 'asc' },
        ],
      });

      // Mapa de IDs antigos para novos (para mapear parentId)
      const idAntigoParaNovo = new Map<string, string>();
      let itensCriados = 0;
      let itensAtualizados = 0;
      let itensExcluidos = 0;

      // Criar itens na nova versão preservando custos unitários quando possível
      for (const itemContratual of itensContratual) {
        // Determinar o novo parentId baseado no mapeamento
        const novoParentId = itemContratual.parentId 
          ? idAntigoParaNovo.get(itemContratual.parentId) || null 
          : null;

        // Verificar se o item existe na versão anterior para preservar custos
        // Normalizar código para comparação (remover espaços)
        const codigoNormalizado = itemContratual.codigo?.trim() || '';
        const itemAnterior = custosPorCodigo.get(codigoNormalizado);
        
        // Se existe na versão anterior, preservar custos unitários
        // Se não existe, criar com custos zerados
        const valorMaterial = itemAnterior ? Number(itemAnterior.valorMaterial) : 0;
        const valorMaoDeObra = itemAnterior ? Number(itemAnterior.valorMaoDeObra) : 0;
        const valorEquipamento = itemAnterior ? Number(itemAnterior.valorEquipamento) : 0;
        const valorVerba = itemAnterior ? Number(itemAnterior.valorVerba) : 0;
        
        // Debug: log quando encontra item anterior com custos
        if (itemAnterior && (valorMaterial > 0 || valorMaoDeObra > 0 || valorEquipamento > 0 || valorVerba > 0)) {
          console.log(`[sincronizarCustosDaPlanilha] Preservando custos para código ${codigoNormalizado}: MAT=${valorMaterial}, MO=${valorMaoDeObra}, EQ=${valorEquipamento}, VB=${valorVerba}`);
        }
        const custoUnitarioTotal = valorMaterial + valorMaoDeObra + valorEquipamento + valorVerba;
        
        const quantidade = itemContratual.quantidade ? Number(itemContratual.quantidade) : 0;
        const custoTotal = custoUnitarioTotal * quantidade;
        const precoTotalVenda = Number(itemContratual.precoTotalVenda);
        const lucroProjetado = precoTotalVenda - custoTotal;
        const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

        const itemCusto = await db.itemCustoOrcado.create({
          data: {
            versaoCustoOrcadoId: novaVersaoCustos.id,
            codigo: itemContratual.codigo,
            nivel: itemContratual.nivel,
            ordem: itemContratual.ordem,
            discriminacao: itemContratual.discriminacao,
            unidade: itemContratual.unidade,
            quantidade: itemContratual.quantidade,
            precoUnitarioVenda: itemContratual.precoUnitarioVenda,
            precoTotalVenda: itemContratual.precoTotalVenda,
            tipo: itemContratual.tipo,
            referencia: itemContratual.referencia,
            parentId: novoParentId,
            etapa: itemContratual.etapa,
            subEtapa: itemContratual.subEtapa,
            grupoCusto: itemContratual.grupoCusto,
            // Custos unitários (preservados da versão anterior se existir, senão zerados)
            valorMaterial,
            valorMaoDeObra,
            valorEquipamento,
            valorVerba,
            custoUnitarioTotal,
            custoTotal,
            lucroProjetado,
            margem,
          },
        });

        idAntigoParaNovo.set(itemContratual.id, itemCusto.id);
        
        if (itemCusto.tipo === 'ITEM') {
          if (itemAnterior) {
            itensAtualizados++;
          } else {
            itensCriados++;
          }
        }
      }

      // Contar itens excluídos (itens que estavam na versão anterior mas não estão na nova)
      const codigosContratual = new Set(itensContratual.map((i: typeof itensContratual[0]) => i.codigo));
      for (const itemAnterior of itensVersaoAnterior) {
        if (itemAnterior.tipo === 'ITEM' && !codigosContratual.has(itemAnterior.codigo)) {
          itensExcluidos++;
        }
      }

      await recalcularCustosAgrupadoresVersaoCusto(novaVersaoCustos.id);

      const obra = await db.obra.findUnique({
        where: { id: obraId },
        select: { construtoraId: true },
      });

      if (obra) {
        try {
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'page');
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'layout');
        } catch (revalidateError) {
          console.warn('Erro ao revalidar caminhos:', revalidateError);
        }
      }

      return {
        success: true,
        itensCriados,
        itensAtualizados,
        itensExcluidos,
        versaoId: novaVersaoCustos.id,
        novaVersaoCriada: true,
      };
    }

    // Comparar itens entre versão contratual e versão de custos
    const itensContratual = await db.itemOrcamento.findMany({
      where: { versaoId: versaoContratual.id },
    });

    const itensCustosMap = new Map<string, typeof versaoCustos.itens[0]>(versaoCustos.itens.map((item: typeof versaoCustos.itens[0]) => [item.codigo, item]));
    const itensContratualMap = new Map<string, typeof itensContratual[0]>(itensContratual.map((item: typeof itensContratual[0]) => [item.codigo, item]));

    let itensCriados = 0;
    let itensAtualizados = 0;
    let itensExcluidos = 0;
    let temMudancas = false;

    // Verificar se há mudanças antes de processar
    for (const itemContratual of itensContratual) {
      const itemCustos = itensCustosMap.get(itemContratual.codigo);
      if (!itemCustos) {
        temMudancas = true;
        break;
      }
      const foiModificado = 
        itemCustos.quantidade !== itemContratual.quantidade ||
        itemCustos.precoTotalVenda !== itemContratual.precoTotalVenda ||
        itemCustos.discriminacao !== itemContratual.discriminacao ||
        itemCustos.unidade !== itemContratual.unidade;
      if (foiModificado) {
        temMudancas = true;
        break;
      }
    }

    // Verificar se há itens excluídos
    if (!temMudancas) {
      for (const itemCustos of versaoCustos.itens) {
        if (!itensContratualMap.has(itemCustos.codigo)) {
          temMudancas = true;
          break;
        }
      }
    }

    // Se houver mudanças, criar nova versão
    let versaoParaAtualizar = versaoCustos;
    if (temMudancas) {
      // Obter próximo número de versão e número de revisão
      const proximoNumero = await obterProximoNumeroVersaoCusto(obraId);
      const proximoNumeroRevisao = await obterProximoNumeroRevisao(obraId, versaoContratual.id);

      // Criar nova versão de custos para atualização de planilha contratual
      const novaVersaoCustos = await db.versaoCustoOrcado.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome, // Usar o nome da versão contratual
          numeroRevisao: proximoNumeroRevisao,
          tipo: 'REVISAO',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de Planilha contratual - Atualização por conta de nova planilha contratual (versão ${versaoContratual.numero})`,
        },
      });

      // Copiar todos os itens da versão de custos atual para a nova versão
      await copiarItensCustoParaNovaVersao(versaoCustos.id, novaVersaoCustos.id);

      // Desativar versão anterior
      await db.versaoCustoOrcado.update({
        where: { id: versaoCustos.id },
        data: { status: 'OBSOLETA' },
      });

      const versaoAtualizada = await db.versaoCustoOrcado.findUnique({
        where: { id: novaVersaoCustos.id },
        include: {
          itens: true,
        },
      });

      if (!versaoAtualizada) {
        return { success: false, error: 'Erro ao criar nova versão' };
      }

      versaoParaAtualizar = versaoAtualizada;

      // Atualizar mapa de itens
      itensCustosMap.clear();
      versaoParaAtualizar.itens.forEach((item: typeof versaoParaAtualizar.itens[0]) => {
        itensCustosMap.set(item.codigo, item);
      });
    }

    // Identificar itens novos ou modificados na planilha contratual
    for (const itemContratual of itensContratual) {
      const itemCustos = itensCustosMap.get(itemContratual.codigo);

      if (!itemCustos) {
        // Item novo na planilha contratual - criar na versão de custos
        // Primeiro, encontrar o parentId correto
        let parentIdCustos: string | null = null;
        if (itemContratual.parentId) {
          const parentContratual = itensContratual.find((i: typeof itensContratual[0]) => i.id === itemContratual.parentId);
          if (parentContratual) {
            const parentCustos = itensCustosMap.get(parentContratual.codigo);
            if (parentCustos) {
              parentIdCustos = parentCustos.id;
            }
          }
        }

        // Calcular valores iniciais
        const quantidade = itemContratual.quantidade ? Number(itemContratual.quantidade) : 0;
        const precoTotalVenda = Number(itemContratual.precoTotalVenda);
        const valorMaterial = 0;
        const valorMaoDeObra = 0;
        const valorEquipamento = 0;
        const valorVerba = 0;
        const custoUnitarioTotal = 0;
        const custoTotal = 0;
        const lucroProjetado = precoTotalVenda - custoTotal;
        const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

        const novoItemCustos = await db.itemCustoOrcado.create({
          data: {
            versaoCustoOrcadoId: versaoParaAtualizar.id,
            codigo: itemContratual.codigo,
            nivel: itemContratual.nivel,
            ordem: itemContratual.ordem,
            discriminacao: itemContratual.discriminacao,
            unidade: itemContratual.unidade,
            quantidade: itemContratual.quantidade,
            precoUnitarioVenda: itemContratual.precoUnitarioVenda,
            precoTotalVenda: itemContratual.precoTotalVenda,
            tipo: itemContratual.tipo,
            referencia: itemContratual.referencia,
            parentId: parentIdCustos,
            etapa: itemContratual.etapa,
            subEtapa: itemContratual.subEtapa,
            grupoCusto: itemContratual.grupoCusto,
            // Custos unitários (zerados inicialmente)
            valorMaterial,
            valorMaoDeObra,
            valorEquipamento,
            valorVerba,
            custoUnitarioTotal,
            custoTotal,
            lucroProjetado,
            margem,
          },
        });

        if (novoItemCustos.tipo === 'ITEM') {
          itensCriados++;
        }
      } else {
        // Item existe - verificar se foi modificado (quantidade, preço, descrição)
        const foiModificado = 
          itemCustos.quantidade !== itemContratual.quantidade ||
          itemCustos.precoTotalVenda !== itemContratual.precoTotalVenda ||
          itemCustos.discriminacao !== itemContratual.discriminacao ||
          itemCustos.unidade !== itemContratual.unidade;

        if (foiModificado) {
          // Recalcular custos com a nova quantidade
          const quantidade = itemContratual.quantidade ? Number(itemContratual.quantidade) : 0;
          const precoTotalVenda = Number(itemContratual.precoTotalVenda);
          const custoUnitarioTotal = 
            Number(itemCustos.valorMaterial) +
            Number(itemCustos.valorMaoDeObra) +
            Number(itemCustos.valorEquipamento) +
            Number(itemCustos.valorVerba);
          const custoTotal = custoUnitarioTotal * quantidade;
          const lucroProjetado = precoTotalVenda - custoTotal;
          const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

          // Atualizar item mantendo os custos já lançados
          await db.itemCustoOrcado.update({
            where: { id: itemCustos.id },
            data: {
              discriminacao: itemContratual.discriminacao,
              unidade: itemContratual.unidade,
              quantidade: itemContratual.quantidade,
              precoTotalVenda: itemContratual.precoTotalVenda,
              custoUnitarioTotal,
              custoTotal,
              lucroProjetado,
              margem,
            },
          });

          itensAtualizados++;
        }
      }
    }

    // Identificar itens excluídos da planilha contratual
    for (const itemCustos of versaoParaAtualizar.itens) {
      if (!itensContratualMap.has(itemCustos.codigo)) {
        // Item foi excluído da planilha contratual - excluir da versão de custos também
        await db.itemCustoOrcado.delete({
          where: { id: itemCustos.id },
        });
        itensExcluidos++;
      }
    }

    // Recalcular totais dos agrupadores
    await recalcularCustosAgrupadoresVersaoCusto(versaoParaAtualizar.id);

    // Buscar construtoraId para revalidar caminhos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      try {
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'page');
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/custos-orcados`, 'layout');
      } catch (revalidateError) {
        // Log do erro mas não falhar a operação
        console.warn('Erro ao revalidar caminhos:', revalidateError);
      }
    }

    return {
      success: true,
      itensCriados,
      itensAtualizados,
      itensExcluidos,
      versaoId: versaoParaAtualizar.id,
      novaVersaoCriada: temMudancas,
    };
  } catch (error: any) {
    console.error('Erro ao sincronizar custos:', error);
    // Retornar mensagem de erro mais detalhada
    const errorMessage = error?.message || 'Erro desconhecido ao sincronizar custos da planilha contratual';
    return { 
      success: false, 
      error: errorMessage,
      details: error?.stack || undefined
    };
  }
}

// Server Action: Atualizar custo de um item específico (ItemCustoOrcado)
export async function atualizarCustoItem(
  itemId: string,
  dados: {
    valorMaterial?: number;
    valorMaoDeObra?: number;
    valorEquipamento?: number;
    valorVerba?: number;
  }
) {
  try {
    // Buscar o item (ItemCustoOrcado)
    const item = await db.itemCustoOrcado.findUnique({
      where: { id: itemId },
      include: {
        versaoCustoOrcado: {
          select: { obraId: true },
        },
      },
    });

    if (!item) {
      return { success: false, error: 'Item não encontrado' };
    }

    if (item.tipo === 'AGRUPADOR') {
      return { success: false, error: 'Agrupadores não podem ter custos unitários editados' };
    }

    // Atualizar custos diretamente no ItemCustoOrcado
    const valorMaterial = dados.valorMaterial !== undefined ? dados.valorMaterial : Number(item.valorMaterial);
    const valorMaoDeObra = dados.valorMaoDeObra !== undefined ? dados.valorMaoDeObra : Number(item.valorMaoDeObra);
    const valorEquipamento = dados.valorEquipamento !== undefined ? dados.valorEquipamento : Number(item.valorEquipamento);
    const valorVerba = dados.valorVerba !== undefined ? dados.valorVerba : Number(item.valorVerba);

    // Recalcular custo unitário total e custo total
    const quantidade = item.quantidade ? Number(item.quantidade) : 0;
    const custoUnitarioTotal = valorMaterial + valorMaoDeObra + valorEquipamento + valorVerba;
    const custoTotal = custoUnitarioTotal * quantidade;
    const precoTotalVenda = Number(item.precoTotalVenda);
    const lucroProjetado = precoTotalVenda - custoTotal;
    const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

    // Atualizar valores diretamente no ItemCustoOrcado
    await db.itemCustoOrcado.update({
      where: { id: item.id },
      data: {
        valorMaterial,
        valorMaoDeObra,
        valorEquipamento,
        valorVerba,
        custoUnitarioTotal,
        custoTotal,
        lucroProjetado,
        margem,
      },
    });

    // Recalcular totais dos agrupadores
    await recalcularCustosAgrupadoresVersaoCusto(item.versaoCustoOrcadoId);

    // Buscar construtoraId para revalidar caminhos
    const obra = await db.obra.findUnique({
      where: { id: item.versaoCustoOrcado.obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${item.versaoCustoOrcado.obraId}/custos-orcados`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar custo do item:', error);
    return { success: false, error: error.message };
  }
}

// Função auxiliar: Recalcular custos totais dos agrupadores (para ItemOrcamento - planilha contratual)
// Nota: ComposicaoCusto foi removido completamente - esta função não persiste mais custos
async function recalcularCustosAgrupadores(versaoId: string) {
  try {
    // Buscar todos os itens da versão (ComposicaoCusto foi removido)
    const itens = await db.itemOrcamento.findMany({
      where: { versaoId },
      orderBy: [
        { nivel: 'desc' }, // Processar do nível mais profundo para o mais raso
        { ordem: 'asc' },
      ],
    });

    // Mapa para armazenar custos totais calculados por item
    const custosPorItem = new Map<string, number>();

    // Primeiro, calcular custos dos itens (não agrupadores)
    // Nota: ItemOrcamento não tem mais ComposicaoCusto, então esta função apenas calcula totais
    // mas não persiste mais (custos estão apenas em ItemCustoOrcado)
    for (const item of itens) {
      if (item.tipo === 'ITEM') {
        // ItemOrcamento não tem mais custos, então custoTotal = 0
        custosPorItem.set(item.id, 0);
      } else if (item.tipo === 'AGRUPADOR') {
        // Para agrupadores, somar custos dos filhos
        const filhos = itens.filter((i: typeof itens[0]) => i.parentId === item.id);
        const custoTotalFilhos = filhos.reduce((sum: number, filho: typeof itens[0]) => {
          return sum + (custosPorItem.get(filho.id) || 0);
        }, 0);
        custosPorItem.set(item.id, custoTotalFilhos);
        // Nota: Não persiste mais ComposicaoCusto - custos estão apenas em ItemCustoOrcado
      }
    }
  } catch (error: any) {
    console.error('Erro ao recalcular custos dos agrupadores:', error);
    throw error;
  }
}

// Função auxiliar: Recalcular custos totais dos agrupadores para VersaoCustoOrcado
async function recalcularCustosAgrupadoresVersaoCusto(versaoCustoOrcadoId: string) {
  try {
    // Buscar todos os itens da versão (custos agora estão diretamente em ItemCustoOrcado)
    const itens = await db.itemCustoOrcado.findMany({
      where: { versaoCustoOrcadoId },
      orderBy: [
        { nivel: 'desc' }, // Processar do nível mais profundo para o mais raso
        { ordem: 'asc' },
      ],
    });

    // Mapa para armazenar custos totais calculados por item
    const custosPorItem = new Map<string, number>();

    // Primeiro, calcular custos dos itens (não agrupadores)
    for (const item of itens) {
      if (item.tipo === 'ITEM') {
        const custoTotal = Number(item.custoTotal);
        custosPorItem.set(item.id, custoTotal);
      } else if (item.tipo === 'AGRUPADOR') {
        // Para agrupadores, somar custos dos filhos
        const filhos = itens.filter((i: typeof itens[0]) => i.parentId === item.id);
        const custoTotalFilhos = filhos.reduce((sum: number, filho: typeof itens[0]) => {
          return sum + (custosPorItem.get(filho.id) || 0);
        }, 0);
        custosPorItem.set(item.id, custoTotalFilhos);

        // Atualizar custoTotal e lucro/margem do agrupador diretamente em ItemCustoOrcado
        const precoTotalVenda = Number(item.precoTotalVenda);
        const lucroProjetado = precoTotalVenda - custoTotalFilhos;
        const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotalFilhos) / precoTotalVenda) * 100 : 0;

        await db.itemCustoOrcado.update({
          where: { id: item.id },
          data: {
            custoTotal: custoTotalFilhos,
            lucroProjetado,
            margem,
          },
        });
      }
    }
  } catch (error: any) {
    console.error('Erro ao recalcular custos dos agrupadores (versão custos):', error);
    throw error;
  }
}

// Função auxiliar: Copiar itens de uma versão de custos para outra
async function copiarItensCustoParaNovaVersao(
  versaoCustoOrigemId: string,
  versaoCustoDestinoId: string
): Promise<Map<string, string>> {
  // Buscar todos os itens da versão origem (custos agora estão diretamente em ItemCustoOrcado)
  const itensOrigem = await db.itemCustoOrcado.findMany({
    where: { versaoCustoOrcadoId: versaoCustoOrigemId },
    orderBy: [
      { nivel: 'asc' },
      { ordem: 'asc' },
    ],
  });

  // Mapa de IDs antigos para novos (para mapear parentId)
  const idAntigoParaNovo = new Map<string, string>();
  const codigoParaIdNovo = new Map<string, string>();

  // Criar itens na nova versão em ordem hierárquica
  for (const itemOrigem of itensOrigem) {
    // Determinar o novo parentId baseado no mapeamento
    const novoParentId = itemOrigem.parentId ? idAntigoParaNovo.get(itemOrigem.parentId) || null : null;

    const itemNovo = await db.itemCustoOrcado.create({
      data: {
        versaoCustoOrcadoId: versaoCustoDestinoId,
        codigo: itemOrigem.codigo,
        nivel: itemOrigem.nivel,
        ordem: itemOrigem.ordem,
        discriminacao: itemOrigem.discriminacao,
        unidade: itemOrigem.unidade,
        quantidade: itemOrigem.quantidade,
        precoUnitarioVenda: itemOrigem.precoUnitarioVenda,
        precoTotalVenda: itemOrigem.precoTotalVenda,
        tipo: itemOrigem.tipo,
        referencia: itemOrigem.referencia,
        parentId: novoParentId,
        etapa: itemOrigem.etapa,
        subEtapa: itemOrigem.subEtapa,
        grupoCusto: itemOrigem.grupoCusto,
        // Copiar custos diretamente
        valorMaterial: itemOrigem.valorMaterial,
        valorMaoDeObra: itemOrigem.valorMaoDeObra,
        valorEquipamento: itemOrigem.valorEquipamento,
        valorVerba: itemOrigem.valorVerba,
        custoUnitarioTotal: itemOrigem.custoUnitarioTotal,
        custoTotal: itemOrigem.custoTotal,
        lucroProjetado: itemOrigem.lucroProjetado,
        margem: itemOrigem.margem,
      },
    });

    idAntigoParaNovo.set(itemOrigem.id, itemNovo.id);
    codigoParaIdNovo.set(itemOrigem.codigo, itemNovo.id);
  }

  return codigoParaIdNovo;
}

// Função auxiliar para copiar itens de uma versão para outra
async function copiarItensParaNovaVersao(versaoOrigemId: string, versaoDestinoId: string): Promise<Map<string, string>> {
  // Buscar todos os itens da versão origem com suas composições de custo
  const itensOrigem = await db.itemOrcamento.findMany({
    where: { versaoId: versaoOrigemId },
    orderBy: [
      { nivel: 'asc' },
      { ordem: 'asc' },
    ],
  });

  // Mapa de IDs antigos para novos (para mapear parentId)
  const idAntigoParaNovo = new Map<string, string>();
  const codigoParaIdNovo = new Map<string, string>();

  // Criar itens na nova versão em ordem hierárquica (nível por nível)
  // Primeiro criar todos os itens sem parentId (nível 0)
  for (const itemOrigem of itensOrigem) {
    // Determinar o novo parentId baseado no mapeamento
    const novoParentId = itemOrigem.parentId ? idAntigoParaNovo.get(itemOrigem.parentId) || null : null;

    const itemNovo = await db.itemOrcamento.create({
      data: {
        versaoId: versaoDestinoId,
        codigo: itemOrigem.codigo,
        nivel: itemOrigem.nivel,
        ordem: itemOrigem.ordem,
        discriminacao: itemOrigem.discriminacao,
        unidade: itemOrigem.unidade,
        quantidade: itemOrigem.quantidade,
        precoUnitarioVenda: itemOrigem.precoUnitarioVenda,
        precoTotalVenda: itemOrigem.precoTotalVenda,
        tipo: itemOrigem.tipo,
        referencia: itemOrigem.referencia,
        parentId: novoParentId,
        etapa: itemOrigem.etapa,
        subEtapa: itemOrigem.subEtapa,
        grupoCusto: itemOrigem.grupoCusto,
      },
    });

    idAntigoParaNovo.set(itemOrigem.id, itemNovo.id);
    codigoParaIdNovo.set(itemOrigem.codigo, itemNovo.id);

    // Nota: ComposicaoCusto foi removido - custos estão apenas em ItemCustoOrcado
  }

  return codigoParaIdNovo;
}

// Server Action: Importar custos orçados de arquivo Excel
export async function importarCustosOrcados(obraId: string, buffer: Buffer): Promise<{
  success: boolean;
  error?: string;
  itensAtualizados?: number;
  novaVersaoCriada?: boolean;
  versaoId?: string;
}> {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { success: false, error: 'Nenhuma versão ativa da planilha contratual encontrada' };
    }

    // Buscar versão ativa de custos orçados (custos agora estão diretamente em ItemCustoOrcado)
    const versaoCustoAtiva = await db.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
        versaoContratualId: versaoContratual.id,
      },
      include: {
        itens: true,
      },
    });

    if (!versaoCustoAtiva) {
      return { success: false, error: 'Nenhuma versão de custos orçados encontrada. Use o botão "Atualizar da Planilha" primeiro.' };
    }

    // Ler arquivo Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (dados.length === 0) {
      return { success: false, error: 'Planilha vazia' };
    }

    // Usar itens da versão de custos ativa
    const itens = versaoCustoAtiva.itens;

    // Criar mapa de itens por código
    const itensMap = new Map<string, typeof itens[0]>();
    itens.forEach((item: typeof itens[0]) => {
      itensMap.set(item.codigo, item);
    });

    // Verificar se há alterações nos custos
    let temAlteracoes = false;
    const alteracoes: Array<{ codigo: string; campo: string; valorAntigo: number; valorNovo: number }> = [];

    for (const linha of dados) {
      const codigo = String(linha['Item'] || '').trim();
      if (!codigo) continue;

      const item = itensMap.get(codigo);
      if (!item || item.tipo !== 'ITEM') continue;

      // Extrair valores de custo da planilha
      const custoMat = linha['Custo MAT (R$/Un)'] !== undefined && linha['Custo MAT (R$/Un)'] !== null && linha['Custo MAT (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo MAT (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoMO = linha['Custo M.O. (R$/Un)'] !== undefined && linha['Custo M.O. (R$/Un)'] !== null && linha['Custo M.O. (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo M.O. (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoContratos = linha['Custo Contratos (R$/Un)'] !== undefined && linha['Custo Contratos (R$/Un)'] !== null && linha['Custo Contratos (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo Contratos (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoEqFr = linha['Custo Eq/Fr (R$/Un)'] !== undefined && linha['Custo Eq/Fr (R$/Un)'] !== null && linha['Custo Eq/Fr (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo Eq/Fr (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;

      // Comparar com valores existentes (custos agora estão diretamente em ItemCustoOrcado)
      const valorMatAtual = Number(item.valorMaterial);
      const valorMOAtual = Number(item.valorMaoDeObra);
      const valorContratosAtual = Number(item.valorVerba);
      const valorEqFrAtual = Number(item.valorEquipamento);

      if (Math.abs(valorMatAtual - custoMat) > 0.01 ||
          Math.abs(valorMOAtual - custoMO) > 0.01 ||
          Math.abs(valorContratosAtual - custoContratos) > 0.01 ||
          Math.abs(valorEqFrAtual - custoEqFr) > 0.01) {
        temAlteracoes = true;
        break; // Já encontrou alteração, não precisa continuar verificando
      }
    }

    let versaoParaAtualizar: typeof versaoCustoAtiva | null = versaoCustoAtiva;
    let novaVersaoCriada = false;

    // Verificar se já existem custos lançados (não zerados) na versão atual
    // É primeira importação quando TODOS os custos unitários estão zerados
    let temCustosLancados = false;
    let totalItensComCusto = 0;
    let totalItensComCustoZerado = 0;
    
    for (const item of itens) {
      if (item.tipo === 'ITEM') {
        totalItensComCusto++;
        const custoUnitarioTotal = Number(item.valorMaterial) +
                                  Number(item.valorMaoDeObra) +
                                  Number(item.valorEquipamento) +
                                  Number(item.valorVerba);
        if (custoUnitarioTotal > 0.01) { // Tolerância para valores muito pequenos
          temCustosLancados = true;
          break;
        } else {
          totalItensComCustoZerado++;
        }
      }
    }
    
    // Se todos os itens têm custo unitário zerado, é primeira importação
    const ehPrimeiraImportacao = !temCustosLancados && totalItensComCusto > 0 && totalItensComCusto === totalItensComCustoZerado;

    // Se houver alterações E já existem custos lançados, criar nova versão com próxima revisão
    // Se não há custos lançados, apenas atualizar a versão atual (primeira importação)
    if (temAlteracoes && temCustosLancados) {
      // Obter próximo número de versão e número de revisão
      const proximoNumero = await obterProximoNumeroVersaoCusto(obraId);
      const proximoNumeroRevisao = await obterProximoNumeroRevisao(obraId, versaoContratual.id);

      // Criar nova versão REVISAO com o nome da versão contratual e número de revisão
      const novaVersao = await db.versaoCustoOrcado.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome, // Usar o nome da versão contratual
          numeroRevisao: proximoNumeroRevisao,
          tipo: 'REVISAO',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de custos - Importação de custos orçados realizada em ${new Date().toLocaleString('pt-BR')}`,
        },
      });

      // Copiar todos os itens da versão ativa para a nova versão
      await copiarItensCustoParaNovaVersao(versaoCustoAtiva.id, novaVersao.id);

      // Desativar versão anterior
      await db.versaoCustoOrcado.update({
        where: { id: versaoCustoAtiva.id },
        data: { status: 'OBSOLETA' },
      });

      versaoParaAtualizar = await db.versaoCustoOrcado.findUnique({
        where: { id: novaVersao.id },
        include: {
          itens: true,
        },
      });

      if (!versaoParaAtualizar) {
        return { success: false, error: 'Erro ao criar nova versão' };
      }

      novaVersaoCriada = true;

      // Buscar itens da nova versão (custos agora estão diretamente em ItemCustoOrcado)
      const itensNovaVersao = versaoParaAtualizar.itens;

      // Atualizar mapa de itens
      itensMap.clear();
      itensNovaVersao.forEach((item: typeof itensNovaVersao[0]) => {
        itensMap.set(item.codigo, item);
      });
    }

    // Na primeira importação, zerar todos os custos existentes
    // (custos agora estão diretamente em ItemCustoOrcado, então apenas atualizamos)
    if (ehPrimeiraImportacao) {
      // Recarregar itens para atualizar o mapa
      const itensRecarregados = await db.itemCustoOrcado.findMany({
        where: { versaoCustoOrcadoId: versaoParaAtualizar.id },
      });

      // Atualizar mapa de itens
      itensMap.clear();
      itensRecarregados.forEach((item: typeof itensRecarregados[0]) => {
        itensMap.set(item.codigo, item);
      });
    }
    
    // Criar conjunto de códigos da planilha importada para verificar quais itens estão na planilha
    const codigosNaPlanilha = new Set<string>();
    for (const linha of dados) {
      const codigo = String(linha['Item'] || '').trim();
      if (codigo) {
        codigosNaPlanilha.add(codigo);
      }
    }

    let itensAtualizados = 0;

    // Processar cada linha da planilha e atualizar custos
    for (const linha of dados) {
      const codigo = String(linha['Item'] || '').trim();
      if (!codigo) continue;

      const item = itensMap.get(codigo);
      if (!item || item.tipo !== 'ITEM') continue; // Só atualizar itens, não agrupadores

      // Extrair valores de custo (permitir valores vazios ou zero)
      const custoMat = linha['Custo MAT (R$/Un)'] !== undefined && linha['Custo MAT (R$/Un)'] !== null && linha['Custo MAT (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo MAT (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoMO = linha['Custo M.O. (R$/Un)'] !== undefined && linha['Custo M.O. (R$/Un)'] !== null && linha['Custo M.O. (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo M.O. (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoContratos = linha['Custo Contratos (R$/Un)'] !== undefined && linha['Custo Contratos (R$/Un)'] !== null && linha['Custo Contratos (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo Contratos (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;
      
      const custoEqFr = linha['Custo Eq/Fr (R$/Un)'] !== undefined && linha['Custo Eq/Fr (R$/Un)'] !== null && linha['Custo Eq/Fr (R$/Un)'] !== ''
        ? parseFloat(String(linha['Custo Eq/Fr (R$/Un)']).replace(/\./g, '').replace(',', '.')) || 0
        : 0;

      // Calcular custo unitário total e valores derivados
      const custoUnitarioTotal = custoMat + custoMO + custoContratos + custoEqFr;
      const quantidade = item.quantidade ? Number(item.quantidade) : 0;
      const custoTotal = custoUnitarioTotal * quantidade;
      const precoTotalVenda = Number(item.precoTotalVenda);
      const lucroProjetado = precoTotalVenda - custoTotal;
      const margem = precoTotalVenda > 0 ? ((precoTotalVenda - custoTotal) / precoTotalVenda) * 100 : 0;

      // Atualizar custos diretamente em ItemCustoOrcado
      await db.itemCustoOrcado.update({
        where: { id: item.id },
        data: {
          valorMaterial: custoMat,
          valorMaoDeObra: custoMO,
          valorEquipamento: custoEqFr,
          valorVerba: custoContratos,
          custoUnitarioTotal,
          custoTotal,
          lucroProjetado,
          margem,
        },
      });
      itensAtualizados++;
    }
    
    // Na primeira importação, zerar custos de itens que não estão na planilha importada
    // (itens que estão no banco mas não foram importados no Excel)
    if (ehPrimeiraImportacao) {
      // Buscar todos os itens da versão desta obra novamente
      const todosItens = await db.itemCustoOrcado.findMany({
        where: { 
          versaoCustoOrcadoId: versaoParaAtualizar.id, // Filtro específico da versão/obra
          tipo: 'ITEM',
        },
      });
      
      // Zerar custos de itens desta versão/obra que não estão na planilha importada
      for (const item of todosItens) {
        if (!codigosNaPlanilha.has(item.codigo)) {
          const precoTotalVenda = Number(item.precoTotalVenda);
          await db.itemCustoOrcado.update({
            where: { id: item.id },
            data: {
              valorMaterial: 0,
              valorMaoDeObra: 0,
              valorEquipamento: 0,
              valorVerba: 0,
              custoUnitarioTotal: 0,
              custoTotal: 0,
              lucroProjetado: precoTotalVenda,
              margem: 100,
            },
          });
        }
      }
    }

    // Recalcular custos dos agrupadores
    await recalcularCustosAgrupadoresVersaoCusto(versaoParaAtualizar.id);

    // Buscar construtoraId para revalidar o path correto
    const obraCompleta = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obraCompleta) {
      revalidatePath(`/eng/orcamento/${obraCompleta.construtoraId}/${obraId}/custos-orcados`, 'page');
    }

    return {
      success: true,
      itensAtualizados,
      novaVersaoCriada,
      versaoId: versaoParaAtualizar.id,
    };
  } catch (error: any) {
    console.error('Erro ao importar custos orçados:', error);
    return {
      success: false,
      error: error.message || 'Erro ao importar custos orçados',
    };
  }
}

// ============================================================
// ACTIONS PARA CATEGORIZAÇÃO
// ============================================================

// Função auxiliar: Obter próximo número de versão de categorização
async function obterProximoNumeroVersaoCategorizacao(obraId: string): Promise<number> {
  const ultimaVersao = await db.versaoCategorizacao.findFirst({
    where: { obraId },
    orderBy: { numero: 'desc' },
  });

  return ultimaVersao ? ultimaVersao.numero + 1 : 1;
}

// Função auxiliar: Obter próximo número de revisão para uma versão contratual (categorização)
async function obterProximoNumeroRevisaoCategorizacao(obraId: string, versaoContratualId: string): Promise<number> {
  const ultimaVersao = await db.versaoCategorizacao.findFirst({
    where: {
      obraId,
      versaoContratualId,
    },
    orderBy: { numeroRevisao: 'desc' },
  });

  return ultimaVersao ? ultimaVersao.numeroRevisao + 1 : 1;
}

// Função auxiliar: Copiar itens de ItemOrcamento para ItemCategorizacao
async function copiarItensParaVersaoCategorizacao(
  versaoContratualId: string,
  versaoCategorizacaoId: string
): Promise<Map<string, string>> {
  // Buscar todos os itens da versão contratual
  const itensContratual = await db.itemOrcamento.findMany({
    where: { versaoId: versaoContratualId },
    orderBy: [
      { nivel: 'asc' },
      { ordem: 'asc' },
    ],
  });

  // Mapa de IDs antigos para novos (para mapear parentId)
  const idAntigoParaNovo = new Map<string, string>();
  const codigoParaIdNovo = new Map<string, string>();

  // Criar itens na versão de categorização em ordem hierárquica
  for (const itemContratual of itensContratual) {
    // Determinar o novo parentId baseado no mapeamento
    const novoParentId = itemContratual.parentId 
      ? idAntigoParaNovo.get(itemContratual.parentId) || null 
      : null;

    const itemCategorizacao = await db.itemCategorizacao.create({
      data: {
        versaoCategorizacaoId: versaoCategorizacaoId,
        codigo: itemContratual.codigo,
        nivel: itemContratual.nivel,
        ordem: itemContratual.ordem,
        discriminacao: itemContratual.discriminacao,
        unidade: itemContratual.unidade,
        quantidade: itemContratual.quantidade,
        tipo: itemContratual.tipo,
        referencia: itemContratual.referencia,
        parentId: novoParentId,
        // Campos de categorização (inicialmente vazios)
        etapa: itemContratual.etapa || null,
        subEtapa: itemContratual.subEtapa || null,
        servicoSimplificado: null, // Não existe na planilha contratual
      },
    });

    idAntigoParaNovo.set(itemContratual.id, itemCategorizacao.id);
    codigoParaIdNovo.set(itemContratual.codigo, itemCategorizacao.id);
  }

  return codigoParaIdNovo;
}

// Server Action: Listar versões de categorização
export async function listarVersoesCategorizacao(obraId: string) {
  try {
    const versoes = await db.versaoCategorizacao.findMany({
      where: { obraId },
      include: {
        versaoContratual: {
          select: {
            nome: true,
            numero: true,
          },
        },
      },
      orderBy: [
        { numero: 'desc' },
        { numeroRevisao: 'desc' },
      ],
    });

    return versoes.map((versao: typeof versoes[0]) => ({
      id: versao.id,
      numero: versao.numero,
      nome: versao.nome,
      numeroRevisao: versao.numeroRevisao,
      tipo: versao.tipo,
      status: versao.status,
      versaoContratualId: versao.versaoContratualId,
      versaoContratualNome: versao.versaoContratual.nome,
      observacoes: versao.observacoes,
      createdAt: versao.createdAt,
      updatedAt: versao.updatedAt,
    }));
  } catch (error: any) {
    console.error('Erro ao listar versões de categorização:', error);
    return [];
  }
}

// Server Action: Buscar categorização
export async function buscarCategorizacao(obraId: string, versaoId?: string) {
  try {
    // Se versaoId foi fornecido, buscar essa versão específica
    if (versaoId) {
      const versao = await db.versaoCategorizacao.findUnique({
        where: { id: versaoId },
        include: {
          versaoContratual: {
            select: {
              nome: true,
              numero: true,
            },
          },
        },
      });
      
      if (!versao || versao.obraId !== obraId) {
        return { 
          success: false, 
          error: 'Versão de categorização não encontrada.' 
        };
      }

      // Buscar todos os itens
      const itens = await db.itemCategorizacao.findMany({
        where: { versaoCategorizacaoId: versao.id },
        orderBy: [
          { nivel: 'asc' },
          { ordem: 'asc' },
        ],
      });

      // Mapear para o formato esperado
      const itensCategorizacao = itens.map((item: typeof itens[0]) => ({
        itemId: item.id,
        codigo: item.codigo,
        discriminacao: item.discriminacao,
        unidade: item.unidade,
        quantidade: item.quantidade ? Number(item.quantidade) : 0,
        nivel: item.nivel,
        tipo: item.tipo,
        parentId: item.parentId,
        referencia: item.referencia,
        ordem: item.ordem,
        etapa: item.etapa || null,
        subEtapa: item.subEtapa || null,
        servicoSimplificado: item.servicoSimplificado || null,
      }));

      return {
        success: true,
        versaoId: versao.id,
        versaoNumero: versao.numero,
        versaoNome: versao.nome,
        versaoNumeroRevisao: versao.numeroRevisao,
        versaoUpdatedAt: versao.updatedAt.toISOString(),
        itens: itensCategorizacao,
      };
    }

    // Se não foi fornecido versaoId, buscar versão ativa
    const versao = await db.versaoCategorizacao.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        versaoContratual: {
          select: {
            nome: true,
            numero: true,
          },
        },
      },
    });

    if (!versao) {
      return { 
        success: false, 
        error: 'Nenhuma versão ativa de categorização encontrada.' 
      };
    }

    // Buscar todos os itens
    const itens = await db.itemCategorizacao.findMany({
      where: { versaoCategorizacaoId: versao.id },
      orderBy: [
        { nivel: 'asc' },
        { ordem: 'asc' },
      ],
    });

    // Mapear para o formato esperado
    const itensCategorizacao = itens.map((item: typeof itens[0]) => ({
      itemId: item.id,
      codigo: item.codigo,
      discriminacao: item.discriminacao,
      unidade: item.unidade,
      quantidade: item.quantidade ? Number(item.quantidade) : 0,
      nivel: item.nivel,
      tipo: item.tipo,
      parentId: item.parentId,
      referencia: item.referencia,
      ordem: item.ordem,
      etapa: item.etapa || null,
      subEtapa: item.subEtapa || null,
      servicoSimplificado: item.servicoSimplificado || null,
    }));

    return {
      success: true,
      versaoId: versao.id,
      versaoNumero: versao.numero,
      versaoNome: versao.nome,
      versaoNumeroRevisao: versao.numeroRevisao,
      versaoUpdatedAt: versao.updatedAt.toISOString(),
      itens: itensCategorizacao,
    };
  } catch (error: any) {
    console.error('Erro ao buscar categorização:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao buscar categorização' 
    };
  }
}

// Server Action: Verificar atualizações da planilha contratual para categorização
export async function verificarAtualizacoesPlanilhaCategorizacao(obraId: string, versaoCategorizacaoId?: string) {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { 
        success: false, 
        error: 'Nenhuma versão ativa da planilha contratual encontrada',
        temAtualizacoes: false,
      };
    }

    // Se não foi passada uma versão de categorização, sempre retorna que há atualizações
    if (!versaoCategorizacaoId) {
      return {
        success: true,
        temAtualizacoes: true,
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Buscar a versão de categorização para comparar
    const versaoCategorizacao = await db.versaoCategorizacao.findUnique({
      where: { id: versaoCategorizacaoId },
      select: { updatedAt: true, versaoContratualId: true },
    });

    if (!versaoCategorizacao) {
      return {
        success: true,
        temAtualizacoes: true, // Se não existe versão de categorização, há atualizações
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Verificar se a versão de categorização está baseada na versão contratual atual
    if (versaoCategorizacao.versaoContratualId !== versaoContratual.id) {
      return {
        success: true,
        temAtualizacoes: true, // Nova versão contratual disponível
        versaoId: versaoContratual.id,
        versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
      };
    }

    // Comparar com a data de atualização da versão contratual
    const dataVersaoCategorizacao = versaoCategorizacao.updatedAt;
    const dataVersaoContratual = versaoContratual.updatedAt;

    // Se a versão contratual foi atualizada depois da versão de categorização, há atualizações
    const temAtualizacoes = dataVersaoContratual > dataVersaoCategorizacao;

    return {
      success: true,
      temAtualizacoes,
      versaoId: versaoContratual.id,
      versaoUpdatedAt: versaoContratual.updatedAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Erro ao verificar atualizações:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao verificar atualizações',
      temAtualizacoes: false,
    };
  }
}

// Server Action: Sincronizar categorização da planilha contratual
export async function sincronizarCategorizacaoDaPlanilha(obraId: string) {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { success: false, error: 'Nenhuma versão ativa da planilha contratual encontrada' };
    }

    // Buscar versão ativa de categorização vinculada à versão contratual atual
    let versaoCategorizacao = await db.versaoCategorizacao.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
        versaoContratualId: versaoContratual.id,
      },
      include: {
        itens: true,
      },
    });
    
    // Se não encontrou versão vinculada à versão contratual atual, buscar a última versão ativa
    if (!versaoCategorizacao) {
      versaoCategorizacao = await db.versaoCategorizacao.findFirst({
        where: {
          obraId,
          status: 'ATIVA',
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          itens: true,
        },
      });
    }

    // Se não existe versão de categorização para esta versão contratual, criar uma nova
    if (!versaoCategorizacao) {
      // Obter próximo número de versão e número de revisão
      const proximoNumero = await obterProximoNumeroVersaoCategorizacao(obraId);
      const proximoNumeroRevisao = await obterProximoNumeroRevisaoCategorizacao(obraId, versaoContratual.id);

      // Criar nova versão de categorização usando o nome da versão contratual
      const novaVersaoCategorizacao = await db.versaoCategorizacao.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome,
          numeroRevisao: proximoNumeroRevisao,
          tipo: 'BASELINE',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de Planilha contratual - Criada a partir da planilha contratual versão ${versaoContratual.numero}`,
        },
      });

      // Copiar todos os itens da versão contratual para a versão de categorização
      await copiarItensParaVersaoCategorizacao(versaoContratual.id, novaVersaoCategorizacao.id);

      // Contar itens criados
      const itensCategorizacao = await db.itemCategorizacao.findMany({
        where: { versaoCategorizacaoId: novaVersaoCategorizacao.id, tipo: 'ITEM' },
      });
      const itensCriados = itensCategorizacao.length;

      // Buscar construtoraId para revalidar caminhos
      const obra = await db.obra.findUnique({
        where: { id: obraId },
        select: { construtoraId: true },
      });

      if (obra) {
        try {
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'layout');
        } catch (revalidateError) {
          console.warn('Erro ao revalidar caminhos:', revalidateError);
        }
      }

      return {
        success: true,
        itensCriados,
        itensAtualizados: 0,
        itensExcluidos: 0,
        versaoId: novaVersaoCategorizacao.id,
        novaVersaoCriada: true,
      };
    }

    // Verificar se a versão de categorização está baseada na versão contratual atual
    if (versaoCategorizacao.versaoContratualId !== versaoContratual.id) {
      // Nova versão contratual - criar nova versão de categorização com revisão 01
      const proximoNumero = await obterProximoNumeroVersaoCategorizacao(obraId);
      
      // Buscar itens da versão anterior de categorização para preservar categorização
      const itensVersaoAnterior = await db.itemCategorizacao.findMany({
        where: { versaoCategorizacaoId: versaoCategorizacao.id },
      });
      
      // Criar mapa de categorização por código para busca rápida
      const categorizacaoPorCodigo = new Map<string, typeof itensVersaoAnterior[0]>();
      itensVersaoAnterior.forEach((item: typeof itensVersaoAnterior[0]) => {
        const codigoNormalizado = item.codigo?.trim() || '';
        if (codigoNormalizado) {
          categorizacaoPorCodigo.set(codigoNormalizado, item);
        }
      });
      
      // Desativar versão anterior
      await db.versaoCategorizacao.update({
        where: { id: versaoCategorizacao.id },
        data: { status: 'OBSOLETA' },
      });

      // Criar nova versão de categorização baseada na nova versão contratual
      const novaVersaoCategorizacao = await db.versaoCategorizacao.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome,
          numeroRevisao: 1,
          tipo: 'BASELINE',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Atualização de Planilha contratual - Nova versão contratual (versão ${versaoContratual.numero})`,
        },
      });

      // Buscar itens da nova versão contratual
      const itensContratual = await db.itemOrcamento.findMany({
        where: { versaoId: versaoContratual.id },
        orderBy: [
          { nivel: 'asc' },
          { ordem: 'asc' },
        ],
      });

      // Mapa de IDs antigos para novos (para mapear parentId)
      const idAntigoParaNovo = new Map<string, string>();
      let itensCriados = 0;
      let itensAtualizados = 0;
      let itensExcluidos = 0;

      // Criar itens na nova versão preservando categorização quando possível
      for (const itemContratual of itensContratual) {
        // Determinar o novo parentId baseado no mapeamento
        const novoParentId = itemContratual.parentId 
          ? idAntigoParaNovo.get(itemContratual.parentId) || null 
          : null;

        // Verificar se o item existe na versão anterior para preservar categorização
        const codigoNormalizado = itemContratual.codigo?.trim() || '';
        const itemAnterior = categorizacaoPorCodigo.get(codigoNormalizado);
        
        // Preservar categorização se existir na versão anterior
        const etapa = itemAnterior?.etapa || itemContratual.etapa || null;
        const subEtapa = itemAnterior?.subEtapa || itemContratual.subEtapa || null;
        const servicoSimplificado = itemAnterior?.servicoSimplificado || null;

        const itemCategorizacao = await db.itemCategorizacao.create({
          data: {
            versaoCategorizacaoId: novaVersaoCategorizacao.id,
            codigo: itemContratual.codigo,
            nivel: itemContratual.nivel,
            ordem: itemContratual.ordem,
            discriminacao: itemContratual.discriminacao,
            unidade: itemContratual.unidade,
            quantidade: itemContratual.quantidade,
            tipo: itemContratual.tipo,
            referencia: itemContratual.referencia,
            parentId: novoParentId,
            etapa,
            subEtapa,
            servicoSimplificado,
          },
        });

        idAntigoParaNovo.set(itemContratual.id, itemCategorizacao.id);
        
        if (itemAnterior) {
          itensAtualizados++;
        } else {
          itensCriados++;
        }
      }

      // Contar itens excluídos (itens que estavam na versão anterior mas não estão na nova)
      const codigosNovos = new Set(itensContratual.map((i: typeof itensContratual[0]) => i.codigo?.trim()).filter(Boolean));
      itensExcluidos = itensVersaoAnterior.filter((i: typeof itensVersaoAnterior[0]) => {
        const codigo = i.codigo?.trim() || '';
        return codigo && !codigosNovos.has(codigo);
      }).length;

      // Buscar construtoraId para revalidar caminhos
      const obra = await db.obra.findUnique({
        where: { id: obraId },
        select: { construtoraId: true },
      });

      if (obra) {
        try {
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
          revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'layout');
        } catch (revalidateError) {
          console.warn('Erro ao revalidar caminhos:', revalidateError);
        }
      }

      return {
        success: true,
        itensCriados,
        itensAtualizados,
        itensExcluidos,
        versaoId: novaVersaoCategorizacao.id,
        novaVersaoCriada: true,
      };
    }

    // Versão contratual não mudou - apenas atualizar itens existentes
    // Buscar itens da versão contratual atual
    const itensContratual = await db.itemOrcamento.findMany({
      where: { versaoId: versaoContratual.id },
      orderBy: [
        { nivel: 'asc' },
        { ordem: 'asc' },
      ],
    });

    // Mapa de códigos da versão contratual
    const codigosContratual = new Map<string, typeof itensContratual[0]>();
    itensContratual.forEach((item: typeof itensContratual[0]) => {
      const codigo = item.codigo?.trim() || '';
      if (codigo) {
        codigosContratual.set(codigo, item);
      }
    });

    // Mapa de itens de categorização por código
    const itensCategorizacaoMap = new Map<string, typeof versaoCategorizacao.itens[0]>();
    versaoCategorizacao.itens.forEach((item: typeof versaoCategorizacao.itens[0]) => {
      const codigo = item.codigo?.trim() || '';
      if (codigo) {
        itensCategorizacaoMap.set(codigo, item);
      }
    });

    let itensCriados = 0;
    let itensAtualizados = 0;
    let itensExcluidos = 0;

    // Atualizar ou criar itens
    for (const itemContratual of itensContratual) {
      const codigo = itemContratual.codigo?.trim() || '';
      const itemCategorizacao = codigo ? itensCategorizacaoMap.get(codigo) : null;

      if (itemCategorizacao) {
        // Atualizar item existente (apenas descrição, unidade, quantidade)
        await db.itemCategorizacao.update({
          where: { id: itemCategorizacao.id },
          data: {
            discriminacao: itemContratual.discriminacao,
            unidade: itemContratual.unidade,
            quantidade: itemContratual.quantidade,
          },
        });
        itensAtualizados++;
      } else {
        // Criar novo item (preservar categorização se existir na planilha contratual)
        const novoParentId = itemContratual.parentId 
          ? versaoCategorizacao.itens.find((i: typeof versaoCategorizacao.itens[0]) => {
              const itemContratualPai = itensContratual.find((ic: typeof itensContratual[0]) => ic.id === itemContratual.parentId);
              return itemContratualPai && i.codigo === itemContratualPai.codigo;
            })?.id || null
          : null;

        await db.itemCategorizacao.create({
          data: {
            versaoCategorizacaoId: versaoCategorizacao.id,
            codigo: itemContratual.codigo,
            nivel: itemContratual.nivel,
            ordem: itemContratual.ordem,
            discriminacao: itemContratual.discriminacao,
            unidade: itemContratual.unidade,
            quantidade: itemContratual.quantidade,
            tipo: itemContratual.tipo,
            referencia: itemContratual.referencia,
            parentId: novoParentId,
            etapa: itemContratual.etapa || null,
            subEtapa: itemContratual.subEtapa || null,
            servicoSimplificado: null,
          },
        });
        itensCriados++;
      }
    }

    // Excluir itens que não estão mais na versão contratual
    const codigosContratualSet = new Set(itensContratual.map((i: typeof itensContratual[0]) => i.codigo?.trim()).filter(Boolean));
    for (const itemCategorizacao of versaoCategorizacao.itens) {
      const codigo = itemCategorizacao.codigo?.trim() || '';
      if (codigo && !codigosContratualSet.has(codigo)) {
        await db.itemCategorizacao.delete({
          where: { id: itemCategorizacao.id },
        });
        itensExcluidos++;
      }
    }

    // Buscar construtoraId para revalidar caminhos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      try {
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
        revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'layout');
      } catch (revalidateError) {
        console.warn('Erro ao revalidar caminhos:', revalidateError);
      }
    }

    return {
      success: true,
      itensCriados,
      itensAtualizados,
      itensExcluidos,
      versaoId: versaoCategorizacao.id,
      novaVersaoCriada: false,
    };
  } catch (error: any) {
    console.error('Erro ao sincronizar categorização:', error);
    return { success: false, error: error.message || 'Erro ao sincronizar categorização' };
  }
}

// Server Action: Importar categorização do Excel
export async function importarCategorizacao(obraId: string, buffer: Buffer) {
  try {
    // Buscar versão ativa da planilha contratual
    const versaoContratual = await buscarVersaoAtivaOrcamento(obraId);
    
    if (!versaoContratual) {
      return { success: false, error: 'Nenhuma versão ativa da planilha contratual encontrada' };
    }

    // Buscar versão ativa de categorização
    const versaoCategorizacaoAtiva = await db.versaoCategorizacao.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: true,
      },
    });

    if (!versaoCategorizacaoAtiva) {
      return { success: false, error: 'Nenhuma versão de categorização encontrada. Use o botão "Atualizar da Planilha" primeiro.' };
    }

    // Ler arquivo Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (dados.length === 0) {
      return { success: false, error: 'Planilha vazia' };
    }

    // Usar itens da versão de categorização ativa
    const itens = versaoCategorizacaoAtiva.itens;

    // Criar mapa de itens por código
    const itensMap = new Map<string, typeof itens[0]>();
    itens.forEach((item: typeof itens[0]) => {
      itensMap.set(item.codigo, item);
    });

    // Verificar se há alterações na categorização
    let temAlteracoes = false;
    
    for (const linha of dados) {
      const codigo = String(linha['Item'] || '').trim();
      if (!codigo) continue;

      const item = itensMap.get(codigo);
      if (!item || item.tipo !== 'ITEM') continue;

      // Extrair valores de categorização da planilha
      const etapa = linha['Etapa'] ? String(linha['Etapa']).trim() : null;
      const subEtapa = linha['SubEtapa'] ? String(linha['SubEtapa']).trim() : null;
      const servicoSimplificado = linha['Serviço Simplificado'] || linha['Servico Simplificado'] 
        ? String(linha['Serviço Simplificado'] || linha['Servico Simplificado']).trim() 
        : null;

      // Comparar com valores existentes
      const etapaAtual = item.etapa || null;
      const subEtapaAtual = item.subEtapa || null;
      const servicoSimplificadoAtual = item.servicoSimplificado || null;

      if (etapaAtual !== etapa || subEtapaAtual !== subEtapa || servicoSimplificadoAtual !== servicoSimplificado) {
        temAlteracoes = true;
        break;
      }
    }

    let versaoParaAtualizar: typeof versaoCategorizacaoAtiva | null = versaoCategorizacaoAtiva;
    let novaVersaoCriada = false;

    // Se houver alterações, criar nova versão com próxima revisão
    if (temAlteracoes) {
      // Obter próximo número de versão e número de revisão
      const proximoNumero = await obterProximoNumeroVersaoCategorizacao(obraId);
      const proximoNumeroRevisao = await obterProximoNumeroRevisaoCategorizacao(obraId, versaoContratual.id);

      // Desativar versão anterior
      await db.versaoCategorizacao.update({
        where: { id: versaoCategorizacaoAtiva.id },
        data: { status: 'OBSOLETA' },
      });

      // Criar nova versão
      const novaVersao = await db.versaoCategorizacao.create({
        data: {
          obraId,
          numero: proximoNumero,
          nome: versaoContratual.nome,
          numeroRevisao: proximoNumeroRevisao,
          tipo: 'REVISAO',
          status: 'ATIVA',
          versaoContratualId: versaoContratual.id,
          observacoes: `Importação de categorização - Revisão ${proximoNumeroRevisao.toString().padStart(2, '0')}`,
        },
      });

      // Copiar itens da versão anterior
      const idAntigoParaNovo = new Map<string, string>();
      for (const itemAntigo of itens) {
        const novoParentId = itemAntigo.parentId 
          ? idAntigoParaNovo.get(itemAntigo.parentId) || null 
          : null;

        const itemNovo = await db.itemCategorizacao.create({
          data: {
            versaoCategorizacaoId: novaVersao.id,
            codigo: itemAntigo.codigo,
            nivel: itemAntigo.nivel,
            ordem: itemAntigo.ordem,
            discriminacao: itemAntigo.discriminacao,
            unidade: itemAntigo.unidade,
            quantidade: itemAntigo.quantidade,
            tipo: itemAntigo.tipo,
            referencia: itemAntigo.referencia,
            parentId: novoParentId,
            etapa: itemAntigo.etapa,
            subEtapa: itemAntigo.subEtapa,
            servicoSimplificado: itemAntigo.servicoSimplificado,
          },
        });

        idAntigoParaNovo.set(itemAntigo.id, itemNovo.id);
      }

      versaoParaAtualizar = await db.versaoCategorizacao.findUnique({
        where: { id: novaVersao.id },
        include: { itens: true },
      });
      novaVersaoCriada = true;
    }

    if (!versaoParaAtualizar) {
      return { success: false, error: 'Erro ao criar ou buscar versão de categorização' };
    }

    // Atualizar itens com dados da planilha
    let itensAtualizados = 0;
    const codigosNaPlanilha = new Set<string>();

    for (const linha of dados) {
      const codigo = String(linha['Item'] || '').trim();
      if (!codigo) continue;

      codigosNaPlanilha.add(codigo);

      const item = itensMap.get(codigo);
      if (!item || item.tipo !== 'ITEM') continue;

      // Extrair valores de categorização da planilha
      const etapa = linha['Etapa'] ? String(linha['Etapa']).trim() : null;
      const subEtapa = linha['SubEtapa'] ? String(linha['SubEtapa']).trim() : null;
      const servicoSimplificado = linha['Serviço Simplificado'] || linha['Servico Simplificado'] 
        ? String(linha['Serviço Simplificado'] || linha['Servico Simplificado']).trim() 
        : null;

      // Atualizar categorização
      await db.itemCategorizacao.update({
        where: { id: item.id },
        data: {
          etapa,
          subEtapa,
          servicoSimplificado,
        },
      });
      itensAtualizados++;
    }

    // Buscar construtoraId para revalidar o path correto
    const obraCompleta = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obraCompleta) {
      revalidatePath(`/eng/orcamento/${obraCompleta.construtoraId}/${obraId}/categorizacao`, 'page');
    }

    return {
      success: true,
      itensAtualizados,
      novaVersaoCriada,
      versaoId: versaoParaAtualizar.id,
    };
  } catch (error: any) {
    console.error('Erro ao importar categorização:', error);
    return {
      success: false,
      error: error.message || 'Erro ao importar categorização',
    };
  }
}

// Server Action: Atualizar item de categorização
export async function atualizarItemCategorizacao(
  obraId: string,
  itemId: string,
  etapa: string | null,
  subEtapa: string | null,
  servicoSimplificado: string | null
) {
  try {
    // Verificar se o item existe e pertence à obra
    const item = await db.itemCategorizacao.findUnique({
      where: { id: itemId },
      include: {
        versaoCategorizacao: {
          select: { obraId: true, id: true },
        },
      },
    });

    if (!item) {
      return { success: false, error: 'Item não encontrado' };
    }

    if (item.versaoCategorizacao.obraId !== obraId) {
      return { success: false, error: 'Item não pertence à obra especificada' };
    }

    // Atualizar o item
    await db.itemCategorizacao.update({
      where: { id: itemId },
      data: {
        etapa,
        subEtapa,
        servicoSimplificado,
      },
    });

    // Buscar construtoraId para revalidar o path correto
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar item de categorização:', error);
    return { success: false, error: error.message || 'Erro ao atualizar item de categorização' };
  }
}

// Função otimizada para atualização em lote (batch update)
export async function atualizarItensCategorizacaoEmLote(
  obraId: string,
  atualizacoes: Array<{
    itemId: string;
    etapa: string | null;
    subEtapa: string | null;
    servicoSimplificado: string | null;
  }>
) {
  try {
    if (atualizacoes.length === 0) {
      return { success: true, atualizados: 0 };
    }

    // Buscar todos os itens de uma vez para validação
    const itemIds = atualizacoes.map((a) => a.itemId);
    const itens = await db.itemCategorizacao.findMany({
      where: {
        id: { in: itemIds },
      },
      include: {
        versaoCategorizacao: {
          select: { obraId: true },
        },
      },
    });

    // Validar se todos os itens pertencem à obra
    type ItemComVersao = typeof itens[0];
    const itensMap = new Map<string, ItemComVersao>(itens.map((item: ItemComVersao) => [item.id, item]));
    for (const itemId of itemIds) {
      const item = itensMap.get(itemId);
      if (!item) {
        return { success: false, error: `Item ${itemId} não encontrado` };
      }
      if (item.versaoCategorizacao.obraId !== obraId) {
        return { success: false, error: `Item ${itemId} não pertence à obra especificada` };
      }
    }

    // Processar em lotes usando Promise.all (sem $transaction para evitar timeout)
    const TAMANHO_LOTE = 20; // Lotes menores para maior confiabilidade
    const totalAtualizacoes = atualizacoes.length;
    let processados = 0;
    let falhas = 0;

    console.log(`🔄 Iniciando atualização em massa de ${totalAtualizacoes} itens...`);

    // Dividir em lotes e processar com Promise.all
    for (let i = 0; i < atualizacoes.length; i += TAMANHO_LOTE) {
      const lote = atualizacoes.slice(i, i + TAMANHO_LOTE);
      
      try {
        // Executar lote em paralelo (sem transação para evitar timeout)
        await Promise.all(
          lote.map((atualizacao) =>
            db.itemCategorizacao.update({
              where: { id: atualizacao.itemId },
              data: {
                etapa: atualizacao.etapa,
                subEtapa: atualizacao.subEtapa,
                servicoSimplificado: atualizacao.servicoSimplificado,
              },
            }).catch((err: any) => {
              console.error(`❌ Erro ao atualizar item ${atualizacao.itemId}:`, err.message);
              falhas++;
              return null; // Continuar mesmo com erro em um item
            })
          )
        );
        
        processados += lote.length;
        console.log(`✅ Processados ${processados}/${totalAtualizacoes} itens (${Math.round(processados/totalAtualizacoes*100)}%)`);
      } catch (loteError: any) {
        console.error(`❌ Erro ao processar lote:`, loteError.message);
        falhas += lote.length;
      }
    }

    if (falhas > 0) {
      console.warn(`⚠️ Atualização concluída com ${falhas} falha(s) de ${totalAtualizacoes} itens`);
    } else {
      console.log(`🎉 Atualização concluída: ${totalAtualizacoes} itens atualizados com sucesso!`);
    }

    // Buscar construtoraId para revalidar o path correto
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
    }

    const sucesso = totalAtualizacoes - falhas;
    return { 
      success: falhas === 0, 
      atualizados: sucesso,
      falhas: falhas,
      message: falhas > 0 
        ? `${sucesso} itens atualizados com sucesso, ${falhas} falharam`
        : `${sucesso} itens atualizados com sucesso`
    };
  } catch (error: any) {
    console.error('Erro ao atualizar itens de categorização em lote:', error);
    return { success: false, error: error.message || 'Erro ao atualizar itens de categorização em lote' };
  }
}

// Server Action: Excluir versão de categorização
export async function excluirVersaoCategorizacao(obraId: string, versaoId: string, permitirQualquerVersao: boolean = false) {
  try {
    // Validar que a versão pertence à obra e buscar seu status
    const versao = await db.versaoCategorizacao.findUnique({
      where: { id: versaoId },
      select: { obraId: true, status: true, numero: true, createdAt: true },
    });

    if (!versao || versao.obraId !== obraId) {
      return { success: false, error: 'Versão não encontrada ou não pertence à obra especificada' };
    }

    // Se não permitir qualquer versão, só pode excluir a última versão
    if (!permitirQualquerVersao) {
      const todasVersoes = await db.versaoCategorizacao.findMany({
        where: {
          obraId,
        },
        orderBy: { numero: 'desc' },
      });

      if (todasVersoes.length === 0) {
        return { success: false, error: 'Nenhuma versão encontrada' };
      }

      const ultimaVersao = todasVersoes[0];

      // Se houver apenas 1 versão, permitir excluir. Caso contrário, só pode excluir a última
      if (todasVersoes.length > 1 && ultimaVersao.id !== versaoId) {
        return { 
          success: false, 
          error: 'Apenas a última versão criada pode ser excluída. Exclua as versões mais recentes primeiro.' 
        };
      }
    }

    // Se a versão a ser excluída estiver ativa, ativar a próxima versão mais recente
    if (versao.status === 'ATIVA') {
      const proximaVersao = await db.versaoCategorizacao.findFirst({
        where: {
          obraId,
          id: { not: versaoId },
        },
        orderBy: { numero: 'desc' },
      });

      if (proximaVersao) {
        await db.versaoCategorizacao.update({
          where: { id: proximaVersao.id },
          data: { status: 'ATIVA' },
        });
      }
    }

    // Excluir a versão (cascade vai excluir os itens)
    await db.versaoCategorizacao.delete({
      where: { id: versaoId },
    });

    // Buscar construtoraId para revalidar caminhos
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: { construtoraId: true },
    });

    if (obra) {
      revalidatePath(`/eng/orcamento/${obra.construtoraId}/${obraId}/categorizacao`, 'page');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir versão de categorização:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EAP GERENCIAL
// ============================================

// Interface para item da Visão Gerencial
export interface ItemVisaoGerencial {
  id: string; // ID único gerado
  codigo: string; // Código da EAP (ex: "1.0", "1.1", "1.1.1")
  discriminacao: string; // Nome da Etapa/Subetapa/Serviço
  nivel: number; // 0 = Etapa, 1 = Subetapa, 2 = Serviço
  tipo: 'AGRUPADOR' | 'ITEM'; // AGRUPADOR para Etapa/Subetapa, ITEM para Serviço
  parentId: string | null; // ID do item pai
  ordem: number; // Ordem de exibição
  
  // Dados agregados
  unidade: string | null; // Para serviços, pode ter unidade predominante
  quantidade: number; // Soma das quantidades
  
  // Custos (soma dos itens)
  custoMat: number;
  custoMO: number;
  custoContratos: number;
  custoEqFr: number;
  custoTotal: number;
  
  // Valores de venda
  precoTotalVenda: number;
  
  // Lucro e margem
  lucroProjetado: number;
  margem: number;
  
  // Referências aos itens originais
  itensOriginais: string[]; // IDs dos itens da planilha de custos que fazem parte desta categoria
}

// Server Action: Buscar Visão Gerencial
export async function buscarVisaoGerencial(obraId: string) {
  try {
    // 1. Buscar versão ativa de Custos Orçados
    const versaoCustoOrcado = await db.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
        },
        versaoContratual: true,
      },
    });

    if (!versaoCustoOrcado) {
      return {
        success: false,
        error: 'Nenhuma versão ativa de Custos Orçados encontrada',
      };
    }

    // 2. Buscar versão ativa de Categorização
    const versaoCategorizacao = await db.versaoCategorizacao.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
        },
        versaoContratual: true,
      },
    });

    if (!versaoCategorizacao) {
      return {
        success: false,
        error: 'Nenhuma versão ativa de Categorização encontrada',
      };
    }

    // 3. Criar mapa de categorização por código de item
    const categorizacaoMap = new Map<string, { etapa: string | null; subEtapa: string | null; servicoSimplificado: string | null }>();
    versaoCategorizacao.itens.forEach((item: any) => {
      categorizacaoMap.set(item.codigo, {
        etapa: item.etapa,
        subEtapa: item.subEtapa,
        servicoSimplificado: item.servicoSimplificado,
      });
    });

    // 4. Processar itens de custos e agrupar por categorização
    const itensVisaoGerencial = processarVisaoGerencial(versaoCustoOrcado.itens, categorizacaoMap);

    // 5. Retornar dados estruturados
    return {
      success: true,
      visaoGerencial: {
        versaoCustoOrcadoId: versaoCustoOrcado.id,
        versaoCategorizacaoId: versaoCategorizacao.id,
        versaoNome: versaoCustoOrcado.nome,
        versaoNumero: versaoCustoOrcado.numero,
        versaoUpdatedAt: versaoCustoOrcado.updatedAt.toISOString(),
        itens: itensVisaoGerencial,
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar EAP gerencial:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar EAP gerencial',
    };
  }
}

// Função auxiliar para processar e agrupar itens por categorização
function processarVisaoGerencial(
  itensCustos: any[],
  categorizacaoMap: Map<string, { etapa: string | null; subEtapa: string | null; servicoSimplificado: string | null }>
): ItemVisaoGerencial[] {
  // Estrutura para armazenar agregações
  // Chave: "etapa|subetapa|servico"
  const agregacoes = new Map<string, {
    etapa: string | null;
    subEtapa: string | null;
    servicoSimplificado: string | null;
    quantidade: number;
    custoMat: number;
    custoMO: number;
    custoContratos: number;
    custoEqFr: number;
    custoTotal: number;
    precoTotalVenda: number;
    itensOriginais: string[];
    itensOriginaisCompletos: any[]; // Guardar itens completos para criar nível 3
    unidades: Map<string, number>; // Mapa para contar unidades mais frequentes
  }>();

  // Processar cada item de custo
  itensCustos.forEach((item) => {
    // Só processar ITEMs (não agrupadores)
    if (item.tipo !== 'ITEM') {
      return;
    }

    // Buscar categorização
    const cat = categorizacaoMap.get(item.codigo);
    if (!cat || !cat.etapa || !cat.subEtapa || !cat.servicoSimplificado) {
      // Ignorar itens sem categorização completa
      return;
    }

    // Criar chave única
    const chave = `${cat.etapa}|${cat.subEtapa}|${cat.servicoSimplificado}`;

    // Buscar ou criar agregação
    if (!agregacoes.has(chave)) {
      agregacoes.set(chave, {
        etapa: cat.etapa,
        subEtapa: cat.subEtapa,
        servicoSimplificado: cat.servicoSimplificado,
        quantidade: 0,
        custoMat: 0,
        custoMO: 0,
        custoContratos: 0,
        custoEqFr: 0,
        custoTotal: 0,
        precoTotalVenda: 0,
        itensOriginais: [],
        itensOriginaisCompletos: [],
        unidades: new Map(),
      });
    }

    const agregacao = agregacoes.get(chave)!;

    // Somar valores
    const quantidade = Number(item.quantidade || 0);
    const custoMat = Number(item.valorMaterial || 0) * quantidade;
    const custoMO = Number(item.valorMaoDeObra || 0) * quantidade;
    const custoContratos = Number(item.valorVerba || 0) * quantidade;
    const custoEqFr = Number(item.valorEquipamento || 0) * quantidade;
    const custoTotal = Number(item.custoTotal || 0);
    const precoTotalVenda = Number(item.precoTotalVenda || 0);

    agregacao.quantidade += quantidade;
    agregacao.custoMat += custoMat;
    agregacao.custoMO += custoMO;
    agregacao.custoContratos += custoContratos;
    agregacao.custoEqFr += custoEqFr;
    agregacao.custoTotal += custoTotal;
    agregacao.precoTotalVenda += precoTotalVenda;
    agregacao.itensOriginais.push(item.id);
    agregacao.itensOriginaisCompletos.push(item); // Guardar item completo

    // Contar unidades
    if (item.unidade) {
      const unidadeAtual = agregacao.unidades.get(item.unidade) || 0;
      agregacao.unidades.set(item.unidade, unidadeAtual + 1);
    }
  });

  // Construir hierarquia de itens
  const itensFinais: ItemVisaoGerencial[] = [];
  const etapasMap = new Map<string, { id: string; ordem: number; numeroEtapa: number }>();
  const subEtapasMap = new Map<string, { id: string; ordem: number; etapaId: string; numeroSubEtapa: number }>();
  const servicosMap = new Map<string, { id: string; numeroServico: number }>();
  
  let ordemGlobal = 0;
  let contadorEtapas = 0;
  let contadorSubEtapas = 0;
  let contadorServicos = 0;

  // Ordenar agregações por etapa > subetapa > serviço
  const agregacoesOrdenadas = Array.from(agregacoes.entries()).sort((a, b) => {
    const [chaveA] = a;
    const [chaveB] = b;
    return chaveA.localeCompare(chaveB);
  });

  agregacoesOrdenadas.forEach(([chave, dados]) => {
    const { etapa, subEtapa, servicoSimplificado } = dados;

    if (!etapa || !subEtapa || !servicoSimplificado) {
      return;
    }

    // 1. Criar/Buscar Etapa (Nível 0)
    let etapaItem = etapasMap.get(etapa);
    if (!etapaItem) {
      contadorEtapas++;
      const etapaId = `etapa-${etapa.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      etapaItem = { id: etapaId, ordem: ordemGlobal++, numeroEtapa: contadorEtapas };
      etapasMap.set(etapa, etapaItem);

      const codigoEtapa = `${contadorEtapas}.0`;

      itensFinais.push({
        id: etapaId,
        codigo: codigoEtapa,
        discriminacao: etapa,
        nivel: 0,
        tipo: 'AGRUPADOR',
        parentId: null,
        ordem: etapaItem.ordem,
        unidade: null,
        quantidade: 0,
        custoMat: 0,
        custoMO: 0,
        custoContratos: 0,
        custoEqFr: 0,
        custoTotal: 0,
        precoTotalVenda: 0,
        lucroProjetado: 0,
        margem: 0,
        itensOriginais: [],
      });
    }

    // 2. Criar/Buscar SubEtapa (Nível 1)
    const subEtapaChave = `${etapa}|${subEtapa}`;
    let subEtapaItem = subEtapasMap.get(subEtapaChave);
    if (!subEtapaItem) {
      contadorSubEtapas++;
      const subEtapaId = `subetapa-${subEtapaChave.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      const numeroSubEtapaLocal = Array.from(subEtapasMap.values()).filter(s => s.etapaId === etapaItem!.id).length + 1;
      
      subEtapaItem = {
        id: subEtapaId,
        ordem: ordemGlobal++,
        etapaId: etapaItem.id,
        numeroSubEtapa: contadorSubEtapas,
      };
      subEtapasMap.set(subEtapaChave, subEtapaItem);

      const codigoSubEtapa = `${etapaItem.numeroEtapa}.${numeroSubEtapaLocal}`;

      itensFinais.push({
        id: subEtapaId,
        codigo: codigoSubEtapa,
        discriminacao: subEtapa,
        nivel: 1,
        tipo: 'AGRUPADOR',
        parentId: etapaItem.id,
        ordem: subEtapaItem.ordem,
        unidade: null,
        quantidade: 0,
        custoMat: 0,
        custoMO: 0,
        custoContratos: 0,
        custoEqFr: 0,
        custoTotal: 0,
        precoTotalVenda: 0,
        lucroProjetado: 0,
        margem: 0,
        itensOriginais: [],
      });
    }

    // 3. Criar Serviço Simplificado (Nível 2 - AGRUPADOR)
    contadorServicos++;
    const servicoId = `servico-${chave.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${contadorServicos}`;
    
    // Determinar unidade mais frequente
    let unidadePredominante: string | null = null;
    let maxCount = 0;
    dados.unidades.forEach((count, unidade) => {
      if (count > maxCount) {
        maxCount = count;
        unidadePredominante = unidade;
      }
    });

    // Calcular lucro e margem
    const lucroProjetado = dados.precoTotalVenda - dados.custoTotal;
    const margem = dados.precoTotalVenda > 0 
      ? (lucroProjetado / dados.precoTotalVenda) * 100 
      : 0;

    // Obter código da subEtapa para montar o código do serviço
    const codigoSubEtapa = itensFinais.find(i => i.id === subEtapaItem.id)?.codigo || '';
    const numeroServicoLocal = itensFinais.filter(i => i.parentId === subEtapaItem.id && i.nivel === 2).length + 1;

    // Criar serviço simplificado como AGRUPADOR (agora tem filhos)
    const codigoServico = `${codigoSubEtapa}.${numeroServicoLocal}`;
    
    itensFinais.push({
      id: servicoId,
      codigo: codigoServico,
      discriminacao: servicoSimplificado,
      nivel: 2,
      tipo: 'AGRUPADOR',
      parentId: subEtapaItem.id,
      ordem: ordemGlobal++,
      unidade: unidadePredominante,
      quantidade: dados.quantidade,
      custoMat: dados.custoMat,
      custoMO: dados.custoMO,
      custoContratos: dados.custoContratos,
      custoEqFr: dados.custoEqFr,
      custoTotal: dados.custoTotal,
      precoTotalVenda: dados.precoTotalVenda,
      lucroProjetado,
      margem,
      itensOriginais: dados.itensOriginais,
    });
    
    servicosMap.set(chave, { id: servicoId, numeroServico: contadorServicos });

    // 4. Criar itens originais da planilha contratual (Nível 3 - ITEM)
    // Prefixar código do pai para garantir unicidade
    dados.itensOriginaisCompletos.forEach((itemOriginal, index) => {
      const quantidade = Number(itemOriginal.quantidade || 0);
      const custoMat = Number(itemOriginal.valorMaterial || 0) * quantidade;
      const custoMO = Number(itemOriginal.valorMaoDeObra || 0) * quantidade;
      const custoContratos = Number(itemOriginal.valorVerba || 0) * quantidade;
      const custoEqFr = Number(itemOriginal.valorEquipamento || 0) * quantidade;
      const custoTotal = Number(itemOriginal.custoTotal || 0);
      const precoTotalVenda = Number(itemOriginal.precoTotalVenda || 0);
      const lucroItem = precoTotalVenda - custoTotal;
      const margemItem = precoTotalVenda > 0 ? (lucroItem / precoTotalVenda) * 100 : 0;

      // Criar código único: código do serviço simplificado + índice sequencial
      const codigoUnico = `${codigoServico}.${index + 1}`;

      itensFinais.push({
        id: `${itemOriginal.id}-${contadorServicos}-${index}`, // ID único
        codigo: codigoUnico, // Código único garantido
        discriminacao: `[${itemOriginal.codigo}] ${itemOriginal.discriminacao || ''}`, // Mostrar código original na discriminação
        nivel: 3,
        tipo: 'ITEM',
        parentId: servicoId,
        ordem: ordemGlobal++,
        unidade: itemOriginal.unidade || null,
        quantidade,
        custoMat,
        custoMO,
        custoContratos,
        custoEqFr,
        custoTotal,
        precoTotalVenda,
        lucroProjetado: lucroItem,
        margem: margemItem,
        itensOriginais: [itemOriginal.id],
      });
    });
  });

  // Recalcular totais dos agrupadores (bottom-up)
  recalcularTotaisAgrupadoresVisaoGerencial(itensFinais);

  return itensFinais;
}

// Função auxiliar para recalcular totais dos agrupadores da EAP Gerencial
function recalcularTotaisAgrupadoresVisaoGerencial(itens: ItemVisaoGerencial[]) {
  // Criar mapa de itens por ID
  const itensMap = new Map<string, ItemVisaoGerencial>();
  itens.forEach(item => itensMap.set(item.id, item));

  // Processar de baixo para cima (níveis maiores primeiro - incluindo nível 3)
  const itensPorNivel = [3, 2, 1, 0].flatMap(nivel => 
    itens.filter(item => item.nivel === nivel)
  );

  itensPorNivel.forEach(item => {
    if (item.tipo === 'AGRUPADOR') {
      // Buscar todos os filhos diretos
      const filhos = itens.filter(i => i.parentId === item.id);
      
      // Somar valores dos filhos
      item.quantidade = filhos.reduce((sum, filho) => sum + filho.quantidade, 0);
      item.custoMat = filhos.reduce((sum, filho) => sum + filho.custoMat, 0);
      item.custoMO = filhos.reduce((sum, filho) => sum + filho.custoMO, 0);
      item.custoContratos = filhos.reduce((sum, filho) => sum + filho.custoContratos, 0);
      item.custoEqFr = filhos.reduce((sum, filho) => sum + filho.custoEqFr, 0);
      item.custoTotal = filhos.reduce((sum, filho) => sum + filho.custoTotal, 0);
      item.precoTotalVenda = filhos.reduce((sum, filho) => sum + filho.precoTotalVenda, 0);
      
      // Calcular lucro e margem
      item.lucroProjetado = item.precoTotalVenda - item.custoTotal;
      item.margem = item.precoTotalVenda > 0 
        ? (item.lucroProjetado / item.precoTotalVenda) * 100 
        : 0;
      
      // Coletar todos os itens originais dos filhos
      item.itensOriginais = filhos.flatMap(filho => filho.itensOriginais);
    }
  });
}

// ========================================
// EAP GERENCIAL - VALIDAÇÃO E MÉTRICAS
// ========================================

/**
 * Calcula a porcentagem de itens categorizados na versão ativa
 */
export async function calcularPorcentagemCategorizado(obraId: string) {
  'use server';
  
  try {
    // Buscar versão ativa de categorização
    const versaoCategorizacao = await db.versaoCategorizacao.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: true,
      },
    });

    if (!versaoCategorizacao) {
      return {
        success: false,
        error: 'Nenhuma versão ativa de Categorização encontrada',
        porcentagem: 0,
        totalItens: 0,
        itensCategorizados: 0,
      };
    }

    // Contar apenas ITEMs (não AGRUPADORES)
    const itensExec = versaoCategorizacao.itens.filter((item: typeof versaoCategorizacao.itens[0]) => item.tipo === 'ITEM');
    const totalItens = itensExec.length;

    // Contar itens com categorização completa (etapa, subEtapa e servicoSimplificado preenchidos)
    const itensCategorizados = itensExec.filter((item: typeof itensExec[0]) => 
      item.etapa && item.subEtapa && item.servicoSimplificado
    ).length;

    const porcentagem = totalItens > 0 ? (itensCategorizados / totalItens) * 100 : 0;

    return {
      success: true,
      porcentagem,
      totalItens,
      itensCategorizados,
      versaoId: versaoCategorizacao.id,
      versaoNome: versaoCategorizacao.nome,
    };
  } catch (error: any) {
    console.error('Erro ao calcular porcentagem categorizada:', error);
    return {
      success: false,
      error: error.message || 'Erro ao calcular porcentagem categorizada',
      porcentagem: 0,
      totalItens: 0,
      itensCategorizados: 0,
    };
  }
}

/**
 * Calcula a porcentagem de itens orçados (com custos) na versão ativa
 */
export async function calcularPorcentagemOrcado(obraId: string) {
  'use server';
  
  try {
    // Buscar versão ativa de custos orçados
    const versaoCustoOrcado = await db.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: true,
      },
    });

    if (!versaoCustoOrcado) {
      return {
        success: false,
        error: 'Nenhuma versão ativa de Custos Orçados encontrada',
        porcentagem: 0,
        totalItens: 0,
        itensOrcados: 0,
      };
    }

    // Contar apenas ITEMs (não AGRUPADORES)
    const itensExec = versaoCustoOrcado.itens.filter((item: typeof versaoCustoOrcado.itens[0]) => item.tipo === 'ITEM');
    const totalItens = itensExec.length;

    // Contar itens com pelo menos um custo preenchido (> 0)
    const itensOrcados = itensExec.filter((item: typeof itensExec[0]) => 
      Number(item.valorMaterial) > 0 ||
      Number(item.valorMaoDeObra) > 0 ||
      Number(item.valorEquipamento) > 0 ||
      Number(item.valorVerba) > 0
    ).length;

    const porcentagem = totalItens > 0 ? (itensOrcados / totalItens) * 100 : 0;

    return {
      success: true,
      porcentagem,
      totalItens,
      itensOrcados,
      versaoId: versaoCustoOrcado.id,
      versaoNome: versaoCustoOrcado.nome,
    };
  } catch (error: any) {
    console.error('Erro ao calcular porcentagem orçada:', error);
    return {
      success: false,
      error: error.message || 'Erro ao calcular porcentagem orçada',
      porcentagem: 0,
      totalItens: 0,
      itensOrcados: 0,
    };
  }
}

// ========================================
// EAP GERENCIAL - SALVAR NO BANCO
// ========================================

/**
 * Salva a EAP Gerencial no banco de dados
 */
export async function salvarVisaoGerencial(
  obraId: string,
  itens: ItemVisaoGerencial[],
  configuracaoNiveis: {
    campoNivel0: string;
    campoNivel1?: string;
    campoNivel2?: string;
  }
) {
  'use server';
  
  try {
    // 1. Buscar versões ativas de custos e categorização
    const versaoCustoOrcado = await db.versaoCustoOrcado.findFirst({
      where: { obraId, status: 'ATIVA' },
    });

    const versaoCategorizacao = await db.versaoCategorizacao.findFirst({
      where: { obraId, status: 'ATIVA' },
    });

    if (!versaoCustoOrcado || !versaoCategorizacao) {
      return {
        success: false,
        error: 'Versões ativas de Custos Orçados e/ou Categorização não encontradas',
      };
    }

    // 2. Buscar a última versão salva para gerar o próximo número
    const ultimaVersao = await db.versaoVisaoGerencial.findFirst({
      where: { obraId },
      orderBy: { numero: 'desc' },
    });

    const proximoNumero = ultimaVersao ? ultimaVersao.numero + 1 : 1;

    // 3. Desativar versão anterior (se existir)
    if (ultimaVersao && ultimaVersao.status === 'ATIVA') {
      await db.versaoVisaoGerencial.update({
        where: { id: ultimaVersao.id },
        data: { status: 'OBSOLETA' },
      });
    }

    // 4. Criar nova versão de EAP Gerencial
    const novaVersao = await db.versaoVisaoGerencial.create({
      data: {
        numero: proximoNumero,
        nome: `EAP Gerencial V${proximoNumero}`,
        numeroRevisao: 1,
        status: 'ATIVA',
        tipo: proximoNumero === 1 ? 'BASELINE' : 'REVISAO',
        versaoCustoOrcadoId: versaoCustoOrcado.id,
        versaoCategorizacaoId: versaoCategorizacao.id,
        obraId,
        campoNivel0: configuracaoNiveis.campoNivel0,
        campoNivel1: configuracaoNiveis.campoNivel1,
        campoNivel2: configuracaoNiveis.campoNivel2,
      },
    });

    // 5. Salvar itens da EAP gerencial (apenas níveis 0, 1, 2 - AGRUPADORES)
    // Níveis 3 (ITEMs originais) serão vinculados, não duplicados
    const mapaIds = new Map<string, string>(); // oldId -> newId
    const itensParaSalvar = itens.filter(item => item.nivel <= 2); // Filtrar apenas agrupadores
    
    for (const item of itensParaSalvar) {
      // Resolver o parentId usando o mapa
      const parentIdNovo = item.parentId ? (mapaIds.get(item.parentId) || null) : null;
      
      const itemCriado = await db.itemVisaoGerencial.create({
        data: {
          versaoVisaoGerencialId: novaVersao.id,
          codigo: item.codigo,
          nivel: item.nivel,
          ordem: item.ordem,
          discriminacao: item.discriminacao,
          tipo: item.tipo,
          parentId: parentIdNovo,
          custoMat: item.custoMat,
          custoMO: item.custoMO,
          custoContratos: item.custoContratos,
          custoEqFr: item.custoEqFr,
          custoTotal: item.custoTotal,
          precoTotalVenda: item.precoTotalVenda,
          lucroProjetado: item.lucroProjetado,
          margem: item.margem,
        },
      });
      
      // Guardar o mapeamento ID antigo -> ID novo
      mapaIds.set(item.id, itemCriado.id);
    }

    // 6. Criar vínculos para itens do nível 3 (itens originais da planilha de custos)
    // Esses itens não são duplicados, apenas vinculados aos seus agrupadores (nível 2)
    const itensNivel3 = itens.filter(item => item.nivel === 3);
    let totalVinculos = 0;
    
    for (const item of itensNivel3) {
      // Encontrar o ID do agrupador pai (nível 2) usando o mapa
      const agrupadorIdNovo = item.parentId ? mapaIds.get(item.parentId) : null;
      
      if (agrupadorIdNovo && item.itensOriginais && item.itensOriginais.length > 0) {
        // Pegar o ID do item original (cada item de nível 3 representa um item da planilha)
        const itemCustoOrcadoId = item.itensOriginais[0];
        
        // Criar vínculo
        await db.vinculoItemVisaoGerencial.create({
          data: {
            itemVisaoGerencialId: agrupadorIdNovo,
            itemCustoOrcadoId: itemCustoOrcadoId,
            ordem: item.ordem,
          },
        });
        
        totalVinculos++;
      }
    }

    return {
      success: true,
      versaoId: novaVersao.id,
      versaoNumero: novaVersao.numero,
      versaoNome: novaVersao.nome,
      totalItens: itensParaSalvar.length,
      totalVinculos: totalVinculos,
    };
  } catch (error: any) {
    console.error('Erro ao salvar EAP gerencial:', error);
    return {
      success: false,
      error: error.message || 'Erro ao salvar EAP gerencial',
    };
  }
}


/**
 * Busca a versão ativa da EAP Gerencial salva no banco
 */
export async function buscarVisaoGerencialSalva(obraId: string) {
  'use server';
  
  try {
    const versaoVisaoGerencial = await db.versaoVisaoGerencial.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            vinculosItens: {
              include: {
                itemCustoOrcado: true, // Incluir dados completos dos itens vinculados
              },
              orderBy: { ordem: 'asc' },
            },
          },
        },
        versaoCustoOrcado: true,
        versaoCategorizacao: true,
      },
    });

    if (!versaoVisaoGerencial) {
      return {
        success: false,
        error: 'Nenhuma versão ativa de EAP Gerencial encontrada no banco',
      };
    }

    // Converter itens do banco para o formato ItemVisaoGerencial
    const itensFinais: ItemVisaoGerencial[] = [];
    let ordemGlobal = 0;
    
    // Processar itens agrupadores (níveis 0, 1, 2)
    for (const item of versaoVisaoGerencial.itens) {
      // Adicionar item agrupador
      itensFinais.push({
        id: item.id,
        codigo: item.codigo,
        nivel: item.nivel,
        ordem: ordemGlobal++,
        discriminacao: item.discriminacao,
        tipo: item.tipo,
        parentId: item.parentId || null,
        unidade: null,
        quantidade: 0,
        custoMat: Number(item.custoMat),
        custoMO: Number(item.custoMO),
        custoContratos: Number(item.custoContratos),
        custoEqFr: Number(item.custoEqFr),
        custoTotal: Number(item.custoTotal),
        precoTotalVenda: Number(item.precoTotalVenda),
        lucroProjetado: Number(item.lucroProjetado),
        margem: Number(item.margem),
        itensOriginais: item.vinculosItens.map((v: any) => v.itemCustoOrcadoId),
      });
      
      // Se for um item de nível 2 (Serviço Simplificado) com vínculos, reconstruir itens do nível 3
      if (item.nivel === 2 && item.vinculosItens.length > 0) {
        let indexNivel3 = 1;
        
        for (const vinculo of item.vinculosItens) {
          const itemOriginal = vinculo.itemCustoOrcado;
          const quantidade = Number(itemOriginal.quantidade || 0);
          const custoMat = Number(itemOriginal.valorMaterial || 0) * quantidade;
          const custoMO = Number(itemOriginal.valorMaoDeObra || 0) * quantidade;
          const custoContratos = Number(itemOriginal.valorVerba || 0) * quantidade;
          const custoEqFr = Number(itemOriginal.valorEquipamento || 0) * quantidade;
          const custoTotal = Number(itemOriginal.custoTotal || 0);
          const precoTotalVenda = Number(itemOriginal.precoTotalVenda || 0);
          const lucroItem = precoTotalVenda - custoTotal;
          const margemItem = precoTotalVenda > 0 ? (lucroItem / precoTotalVenda) * 100 : 0;
          
          // Reconstruir item do nível 3 dinamicamente
          itensFinais.push({
            id: `${itemOriginal.id}-nivel3-${item.id}`, // ID único temporário
            codigo: `${item.codigo}.${indexNivel3}`,
            nivel: 3,
            ordem: ordemGlobal++,
            discriminacao: `[${itemOriginal.codigo}] ${itemOriginal.discriminacao || ''}`,
            tipo: 'ITEM',
            parentId: item.id,
            unidade: itemOriginal.unidade || null,
            quantidade,
            custoMat,
            custoMO,
            custoContratos,
            custoEqFr,
            custoTotal,
            precoTotalVenda,
            lucroProjetado: lucroItem,
            margem: margemItem,
            itensOriginais: [itemOriginal.id],
          });
          
          indexNivel3++;
        }
      }
    }

    return {
      success: true,
      visaoGerencial: {
        id: versaoVisaoGerencial.id,
        versaoCustoOrcadoId: versaoVisaoGerencial.versaoCustoOrcadoId,
        versaoCategorizacaoId: versaoVisaoGerencial.versaoCategorizacaoId,
        versaoNome: versaoVisaoGerencial.nome,
        versaoNumero: versaoVisaoGerencial.numero,
        versaoUpdatedAt: versaoVisaoGerencial.updatedAt.toISOString(),
        configuracaoNiveis: {
          campoNivel0: versaoVisaoGerencial.campoNivel0,
          campoNivel1: versaoVisaoGerencial.campoNivel1,
          campoNivel2: versaoVisaoGerencial.campoNivel2,
        },
        itens: itensFinais,
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar EAP gerencial salva:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar EAP gerencial salva',
    };
  }
}
