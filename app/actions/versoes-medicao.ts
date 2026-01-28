"use server";

import { db } from "@/lib/db";
import { TipoAlteracaoItem, TipoAditivo } from "@prisma/client";

/**
 * Cria o mapeamento de itens entre duas versões de orçamento
 * Compara itens por código e identifica alterações
 */
export async function criarMapeamentoVersoes(
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  // Buscar itens de ambas as versões
  const itensAntigos = await db.itemOrcamento.findMany({
    where: { versaoId: versaoAnteriorId },
    select: { 
      id: true, 
      codigo: true, 
      quantidade: true, 
      precoUnitarioVenda: true,
      discriminacao: true,
      unidade: true,
      tipo: true
    }
  });
  
  const itensNovos = await db.itemOrcamento.findMany({
    where: { versaoId: versaoNovaId },
    select: { 
      id: true, 
      codigo: true, 
      quantidade: true, 
      precoUnitarioVenda: true,
      discriminacao: true,
      unidade: true,
      tipo: true
    }
  });
  
  // Criar mapa por código para lookup rápido
  const mapaAntigo = new Map(itensAntigos.map(i => [i.codigo, i]));
  const mapaNovo = new Map(itensNovos.map(i => [i.codigo, i]));
  
  const mapeamentos = [];
  
  // Processar todos os códigos únicos (união dos dois conjuntos)
  const todosCodigosSet = new Set([...mapaAntigo.keys(), ...mapaNovo.keys()]);
  
  for (const codigo of todosCodigosSet) {
    const itemAntigo = mapaAntigo.get(codigo);
    const itemNovo = mapaNovo.get(codigo);
    
    if (itemAntigo && itemNovo) {
      // Item existe em ambas versões - verificar alterações
      const qtdMudou = itemAntigo.quantidade?.toString() !== itemNovo.quantidade?.toString();
      const precoMudou = itemAntigo.precoUnitarioVenda?.toString() !== itemNovo.precoUnitarioVenda?.toString();
      
      let tipoAlteracao: TipoAlteracaoItem = 'MANTIDO';
      if (qtdMudou && precoMudou) {
        tipoAlteracao = 'QUANTIDADE_E_PRECO_ALTERADOS';
      } else if (qtdMudou) {
        tipoAlteracao = 'QUANTIDADE_ALTERADA';
      } else if (precoMudou) {
        tipoAlteracao = 'PRECO_ALTERADO';
      }
      
      mapeamentos.push({
        codigo,
        itemAnteriorId: itemAntigo.id,
        itemNovoId: itemNovo.id,
        tipoAlteracao,
        quantidadeAnterior: itemAntigo.quantidade,
        quantidadeNova: itemNovo.quantidade,
        precoAnterior: itemAntigo.precoUnitarioVenda,
        precoNovo: itemNovo.precoUnitarioVenda,
        discriminacao: itemNovo.discriminacao,
        unidade: itemNovo.unidade,
      });
    } else if (itemNovo) {
      // Item novo (só existe na versão nova) - ADITIVO
      mapeamentos.push({
        codigo,
        itemAnteriorId: null,
        itemNovoId: itemNovo.id,
        tipoAlteracao: 'ADICIONADO' as TipoAlteracaoItem,
        quantidadeAnterior: null,
        quantidadeNova: itemNovo.quantidade,
        precoAnterior: null,
        precoNovo: itemNovo.precoUnitarioVenda,
        discriminacao: itemNovo.discriminacao,
        unidade: itemNovo.unidade,
      });
    } else if (itemAntigo) {
      // Item removido (só existe na versão antiga) - GLOSA
      mapeamentos.push({
        codigo,
        itemAnteriorId: itemAntigo.id,
        itemNovoId: null,
        tipoAlteracao: 'REMOVIDO' as TipoAlteracaoItem,
        quantidadeAnterior: itemAntigo.quantidade,
        quantidadeNova: null,
        precoAnterior: itemAntigo.precoUnitarioVenda,
        precoNovo: null,
        discriminacao: itemAntigo.discriminacao,
        unidade: itemAntigo.unidade,
      });
    }
  }
  
  return mapeamentos;
}

/**
 * Analisa o impacto de migrar de uma versão para outra
 * Retorna estatísticas detalhadas e impacto financeiro
 */
export async function analisarImpactoVersao(
  obraId: string,
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  // Criar mapeamento de itens
  const mapeamento = await criarMapeamentoVersoes(versaoAnteriorId, versaoNovaId);
  
  // Calcular estatísticas
  const estatisticas = {
    itensAdicionados: mapeamento.filter(m => m.tipoAlteracao === 'ADICIONADO').length,
    itensRemovidos: mapeamento.filter(m => m.tipoAlteracao === 'REMOVIDO').length,
    itensAlterados: mapeamento.filter(m => 
      m.tipoAlteracao === 'QUANTIDADE_ALTERADA' || 
      m.tipoAlteracao === 'PRECO_ALTERADO' ||
      m.tipoAlteracao === 'QUANTIDADE_E_PRECO_ALTERADOS'
    ).length,
    itensMantidos: mapeamento.filter(m => m.tipoAlteracao === 'MANTIDO').length,
  };
  
  // Calcular impacto financeiro
  const totalAnterior = mapeamento.reduce((sum, m) => {
    const qtd = Number(m.quantidadeAnterior || 0);
    const preco = Number(m.precoAnterior || 0);
    return sum + (qtd * preco);
  }, 0);
  
  const totalNovo = mapeamento.reduce((sum, m) => {
    const qtd = Number(m.quantidadeNova || 0);
    const preco = Number(m.precoNovo || 0);
    return sum + (qtd * preco);
  }, 0);
  
  const delta = totalNovo - totalAnterior;
  const percentualVariacao = totalAnterior > 0 
    ? ((totalNovo - totalAnterior) / totalAnterior) * 100 
    : 0;
  
  return {
    mapeamento,
    estatisticas,
    impactoFinanceiro: {
      totalAnterior,
      totalNovo,
      delta,
      percentualVariacao,
    },
  };
}

/**
 * Salva o mapeamento de versões no banco de dados
 * Cria registro no histórico e persiste todos os mapeamentos de itens
 */
export async function salvarMapeamentoVersoes(
  obraId: string,
  versaoAnteriorId: string,
  versaoNovaId: string,
  tipoAlteracao: TipoAditivo,
  numeroAditivo?: number,
  descricao?: string,
  usuarioId?: string
) {
  // Analisar impacto
  const analise = await analisarImpactoVersao(obraId, versaoAnteriorId, versaoNovaId);
  
  // Criar registro de histórico e mapeamentos em uma transação
  const resultado = await db.$transaction(async (tx) => {
    // Criar histórico
    const historico = await tx.historicoVersaoMedicao.create({
      data: {
        obraId,
        versaoAnteriorId,
        versaoNovaId,
        tipoAlteracao,
        numeroAditivo,
        descricao,
        usuarioId,
        itensAdicionados: analise.estatisticas.itensAdicionados,
        itensRemovidos: analise.estatisticas.itensRemovidos,
        itensAlterados: analise.estatisticas.itensAlterados,
        itensMantidos: analise.estatisticas.itensMantidos,
      }
    });
    
    // Criar mapeamentos individuais de itens
    const mapeamentosData = analise.mapeamento.map(m => ({
      obraId,
      versaoAnteriorId,
      versaoNovaId,
      itemAnteriorId: m.itemAnteriorId,
      itemNovoId: m.itemNovoId,
      codigo: m.codigo,
      tipoAlteracao: m.tipoAlteracao,
      quantidadeAnterior: m.quantidadeAnterior,
      quantidadeNova: m.quantidadeNova,
      precoAnterior: m.precoAnterior,
      precoNovo: m.precoNovo,
    }));
    
    // Inserir mapeamentos em lote
    await tx.mapeamentoItemVersao.createMany({
      data: mapeamentosData,
      skipDuplicates: true, // Evitar erro se já existir
    });
    
    return { historico, mapeamentos: mapeamentosData.length };
  });
  
  return resultado;
}

/**
 * Busca o mapeamento de versões já salvo no banco
 */
export async function buscarMapeamentoSalvo(
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  const mapeamentos = await db.mapeamentoItemVersao.findMany({
    where: {
      versaoAnteriorId,
      versaoNovaId,
    },
    orderBy: {
      codigo: 'asc'
    }
  });
  
  return mapeamentos;
}

/**
 * Busca o histórico de versões de uma obra
 */
export async function buscarHistoricoVersoes(obraId: string) {
  const historico = await db.historicoVersaoMedicao.findMany({
    where: { obraId },
    include: {
      versaoAnterior: {
        select: { numero: true, nome: true }
      },
      versaoNova: {
        select: { numero: true, nome: true }
      }
    },
    orderBy: {
      dataAtualizacao: 'desc'
    }
  });
  
  return historico;
}

/**
 * Verifica se já existe um mapeamento entre duas versões
 */
export async function verificarMapeamentoExistente(
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  const count = await db.mapeamentoItemVersao.count({
    where: {
      versaoAnteriorId,
      versaoNovaId,
    }
  });
  
  return count > 0;
}

/**
 * Recalcula percentuais de medições quando há alteração de quantidade contratual
 * Mantém quantidades absolutas, recalcula percentuais baseado na nova quantidade
 */
export async function recalcularPercentuaisMedicoes(
  obraId: string,
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  // Buscar mapeamento
  const mapeamentos = await db.mapeamentoItemVersao.findMany({
    where: {
      obraId,
      versaoAnteriorId,
      versaoNovaId,
      OR: [
        { tipoAlteracao: 'QUANTIDADE_ALTERADA' },
        { tipoAlteracao: 'QUANTIDADE_E_PRECO_ALTERADOS' }
      ]
    }
  });

  if (mapeamentos.length === 0) {
    return { 
      success: true, 
      itensRecalculados: 0,
      message: 'Nenhum item com alteração de quantidade encontrado' 
    };
  }

  // Processar cada item alterado
  let itensRecalculados = 0;
  let medicoesAtualizadas = 0;

  await db.$transaction(async (tx) => {
    for (const mapeamento of mapeamentos) {
      const qtdNova = Number(mapeamento.quantidadeNova || 0);
      
      if (qtdNova === 0) continue; // Evitar divisão por zero

      // Buscar todas as medições deste item
      const itensPrevisao = await tx.itemPrevisaoMedicao.findMany({
        where: {
          itemOrcamentoId: mapeamento.itemNovoId,
          previsaoMedicao: {
            obraId,
          }
        },
        include: {
          previsaoMedicao: {
            select: {
              status: true
            }
          }
        }
      });

      // Recalcular percentuais para medições NÃO concluídas
      for (const item of itensPrevisao) {
        // Só recalcular se a medição não estiver REALIZADA (concluída)
        if (item.previsaoMedicao.status === 'REALIZADA') {
          continue; // Pular medições concluídas
        }

        const quantidadeMedida = Number(item.quantidadePrevista);
        const novoPercentual = (quantidadeMedida / qtdNova) * 100;

        await tx.itemPrevisaoMedicao.update({
          where: { id: item.id },
          data: {
            percentualPrevisto: novoPercentual,
          }
        });

        medicoesAtualizadas++;
      }

      itensRecalculados++;
    }
  });

  return {
    success: true,
    itensRecalculados,
    medicoesAtualizadas,
    message: `${itensRecalculados} itens recalculados, ${medicoesAtualizadas} medições atualizadas`
  };
}

/**
 * Migra medições de uma versão antiga para uma nova versão
 * Recalcula percentuais e atualiza referências
 */
export async function migrarMedicoesParaNovaVersao(
  obraId: string,
  versaoAnteriorId: string,
  versaoNovaId: string
) {
  // Buscar todas as previsões de medição da obra
  const previsoes = await db.previsaoMedicao.findMany({
    where: {
      obraId,
      versaoOrcamentoId: versaoAnteriorId,
    }
  });

  if (previsoes.length === 0) {
    return {
      success: true,
      previsoesMigradas: 0,
      message: 'Nenhuma medição encontrada para migrar'
    };
  }

  // Atualizar todas as previsões para a nova versão
  await db.previsaoMedicao.updateMany({
    where: {
      obraId,
      versaoOrcamentoId: versaoAnteriorId,
    },
    data: {
      versaoOrcamentoId: versaoNovaId,
      versaoReferenciaId: versaoAnteriorId, // Salvar referência da versão original
    }
  });

  // Recalcular percentuais
  const recalculo = await recalcularPercentuaisMedicoes(
    obraId,
    versaoAnteriorId,
    versaoNovaId
  );

  return {
    success: true,
    previsoesMigradas: previsoes.length,
    ...recalculo,
    message: `${previsoes.length} medições migradas. ${recalculo.message}`
  };
}
