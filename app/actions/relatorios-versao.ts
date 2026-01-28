"use server";

import { db } from "@/lib/db";

/**
 * Gera relatório de medição com informações de versionamento
 */
export async function gerarRelatorioMedicaoComVersao(
  obraId: string,
  medicaoId: string
) {
  // Buscar medição com versão
  const medicao = await db.previsaoMedicao.findUnique({
    where: { id: medicaoId },
    include: {
      versaoOrcamento: {
        select: {
          id: true,
          numero: true,
          nome: true,
          dataVersao: true,
        }
      },
      versaoReferencia: {
        select: {
          id: true,
          numero: true,
          nome: true,
          dataVersao: true,
        }
      },
      itens: {
        include: {
          itemOrcamento: {
            select: {
              codigo: true,
              discriminacao: true,
              unidade: true,
              quantidade: true,
              precoUnitarioVenda: true,
            }
          }
        }
      }
    }
  });

  if (!medicao) {
    throw new Error('Medição não encontrada');
  }

  // Verificar se houve migração de versão
  const migrada = medicao.versaoReferenciaId && medicao.versaoReferenciaId !== medicao.versaoOrcamentoId;

  // Calcular totais
  const totais = {
    quantidadeTotal: 0,
    valorTotal: 0,
    percentualMedio: 0,
  };

  medicao.itens.forEach(item => {
    totais.quantidadeTotal += Number(item.quantidadePrevista || 0);
    totais.valorTotal += Number(item.valorPrevisto || 0);
    totais.percentualMedio += Number(item.percentualPrevisto || 0);
  });

  if (medicao.itens.length > 0) {
    totais.percentualMedio = totais.percentualMedio / medicao.itens.length;
  }

  return {
    medicao: {
      id: medicao.id,
      numero: medicao.numero,
      tipo: medicao.tipo,
      status: medicao.status,
      dataPrevista: medicao.dataPrevista,
      dataInicio: medicao.dataInicio,
      dataFim: medicao.dataFim,
    },
    versao: {
      atual: medicao.versaoOrcamento,
      original: medicao.versaoReferencia,
      foiMigrada: migrada,
    },
    itens: medicao.itens.map(item => ({
      codigo: item.itemOrcamento.codigo,
      discriminacao: item.itemOrcamento.discriminacao,
      unidade: item.itemOrcamento.unidade,
      quantidadeContratual: item.itemOrcamento.quantidade,
      quantidadeMedida: item.quantidadePrevista,
      percentual: item.percentualPrevisto,
      precoUnitario: item.itemOrcamento.precoUnitarioVenda,
      valorTotal: item.valorPrevisto,
    })),
    totais,
  };
}

/**
 * Gera relatório consolidado de todas as versões da obra
 */
export async function gerarRelatorioConsolidadoVersoes(obraId: string) {
  // Buscar todas as versões da obra
  const versoes = await db.versaoOrcamento.findMany({
    where: { obraId },
    orderBy: { numero: 'asc' },
    select: {
      id: true,
      numero: true,
      nome: true,
      dataVersao: true,
      ativa: true,
      _count: {
        select: {
          itens: true,
        }
      }
    }
  });

  // Buscar histórico de alterações
  const historico = await db.historicoVersaoMedicao.findMany({
    where: { obraId },
    orderBy: { dataAtualizacao: 'desc' },
    select: {
      id: true,
      dataAtualizacao: true,
      tipoAlteracao: true,
      numeroAditivo: true,
      descricao: true,
      itensAdicionados: true,
      itensRemovidos: true,
      itensAlterados: true,
      itensMantidos: true,
      versaoAnterior: {
        select: {
          numero: true,
          nome: true,
        }
      },
      versaoNova: {
        select: {
          numero: true,
          nome: true,
        }
      }
    }
  });

  // Calcular totais por versão
  const totaisPorVersao = await Promise.all(
    versoes.map(async (versao) => {
      const itens = await db.itemOrcamento.findMany({
        where: { versaoId: versao.id },
        select: {
          quantidade: true,
          precoUnitarioVenda: true,
        }
      });

      const total = itens.reduce((sum, item) => {
        const qtd = Number(item.quantidade || 0);
        const preco = Number(item.precoUnitarioVenda || 0);
        return sum + (qtd * preco);
      }, 0);

      return {
        versaoId: versao.id,
        versaoNumero: versao.numero,
        versaoNome: versao.nome,
        totalItens: versao._count.itens,
        valorTotal: total,
      };
    })
  );

  // Calcular impacto acumulado
  let valorInicial = totaisPorVersao[0]?.valorTotal || 0;
  const impactoAcumulado = totaisPorVersao.map((versao, index) => {
    if (index === 0) {
      return {
        ...versao,
        delta: 0,
        percentualVariacao: 0,
      };
    }

    const valorAnterior = totaisPorVersao[index - 1].valorTotal;
    const delta = versao.valorTotal - valorAnterior;
    const percentualVariacao = valorAnterior > 0 ? (delta / valorAnterior) * 100 : 0;
    const percentualDoInicial = valorInicial > 0 ? ((versao.valorTotal - valorInicial) / valorInicial) * 100 : 0;

    return {
      ...versao,
      delta,
      percentualVariacao,
      percentualDoInicial,
    };
  });

  return {
    obra: {
      id: obraId,
      totalVersoes: versoes.length,
      versaoAtiva: versoes.find(v => v.ativa),
    },
    versoes: impactoAcumulado,
    historico: historico.map(h => ({
      id: h.id,
      data: h.dataAtualizacao,
      tipo: h.tipoAlteracao,
      numeroAditivo: h.numeroAditivo,
      descricao: h.descricao,
      estatisticas: {
        adicionados: h.itensAdicionados,
        removidos: h.itensRemovidos,
        alterados: h.itensAlterados,
        mantidos: h.itensMantidos,
      },
      transicao: {
        de: `${h.versaoAnterior.nome} (v${h.versaoAnterior.numero})`,
        para: `${h.versaoNova.nome} (v${h.versaoNova.numero})`,
      }
    })),
    resumo: {
      valorInicial: valorInicial,
      valorFinal: totaisPorVersao[totaisPorVersao.length - 1]?.valorTotal || 0,
      variacaoTotal: (totaisPorVersao[totaisPorVersao.length - 1]?.valorTotal || 0) - valorInicial,
      percentualVariacaoTotal: valorInicial > 0 
        ? (((totaisPorVersao[totaisPorVersao.length - 1]?.valorTotal || 0) - valorInicial) / valorInicial) * 100 
        : 0,
      totalAditivos: historico.filter(h => h.tipoAlteracao === 'ADITIVO').length,
      totalRevisoes: historico.filter(h => h.tipoAlteracao === 'REVISAO').length,
      totalGlosas: historico.filter(h => h.tipoAlteracao === 'GLOSA').length,
    }
  };
}

/**
 * Busca informações de versão para uma medição específica
 */
export async function buscarInfoVersaoMedicao(medicaoId: string) {
  const medicao = await db.previsaoMedicao.findUnique({
    where: { id: medicaoId },
    select: {
      versaoOrcamentoId: true,
      versaoReferenciaId: true,
      versaoOrcamento: {
        select: {
          numero: true,
          nome: true,
          dataVersao: true,
        }
      },
      versaoReferencia: {
        select: {
          numero: true,
          nome: true,
          dataVersao: true,
        }
      }
    }
  });

  if (!medicao) {
    return null;
  }

  const foiMigrada = medicao.versaoReferenciaId && 
                      medicao.versaoReferenciaId !== medicao.versaoOrcamentoId;

  return {
    versaoAtual: medicao.versaoOrcamento,
    versaoOriginal: medicao.versaoReferencia,
    foiMigrada,
    mensagem: foiMigrada 
      ? `Esta medição foi criada na ${medicao.versaoReferencia?.nome} (v${medicao.versaoReferencia?.numero}) e migrada para ${medicao.versaoOrcamento.nome} (v${medicao.versaoOrcamento.numero})`
      : `Esta medição foi criada na ${medicao.versaoOrcamento.nome} (v${medicao.versaoOrcamento.numero})`
  };
}
