"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --------------------------------------------------------
// TIPOS
// --------------------------------------------------------

export type PrevisaoMedicaoInput = {
  obraId: string;
  nome: string;
  dataPrevisao: Date | string;
  ordem: number;
  visivel?: boolean;
  tipo?: "QUANTIDADE" | "PERCENTUAL";
  observacoes?: string;
  versaoOrcamentoId?: string;
  versaoCustoOrcadoId?: string;
  versaoCategorizacaoId?: string;
  versaoVisaoGerencialId?: string;
};

export type ItemPrevisaoMedicaoInput = {
  itemOrcamentoId?: string;
  itemCustoOrcadoId?: string;
  itemCategorizacaoId?: string;
  itemVisaoGerencialId?: string;
  etapa?: string;
  subEtapa?: string;
  servicoSimplificado?: string;
  quantidadePrevista: number;
  percentualPrevisto: number;
  valorPrevisto: number;
  observacoes?: string;
};

export type PrevisaoMedicaoComItens = PrevisaoMedicaoInput & {
  itens: ItemPrevisaoMedicaoInput[];
};

// --------------------------------------------------------
// CRIAR PREVISÃO DE MEDIÇÃO
// --------------------------------------------------------

export async function criarPrevisaoMedicao(
  data: PrevisaoMedicaoComItens
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Buscar o próximo número sequencial
    const ultimaPrevisao = await db.previsaoMedicao.findFirst({
      where: { obraId: data.obraId },
      orderBy: { numero: "desc" },
    });

    const novoNumero = ultimaPrevisao ? ultimaPrevisao.numero + 1 : 1;

    // Criar previsão com itens
    const previsao = await db.previsaoMedicao.create({
      data: {
        obraId: data.obraId,
        nome: data.nome,
        numero: novoNumero,
        dataPrevisao: new Date(data.dataPrevisao),
        ordem: data.ordem,
        visivel: data.visivel ?? true,
        tipo: data.tipo ?? "QUANTIDADE",
        observacoes: data.observacoes,
        versaoOrcamentoId: data.versaoOrcamentoId,
        versaoCustoOrcadoId: data.versaoCustoOrcadoId,
        versaoCategorizacaoId: data.versaoCategorizacaoId,
        versaoVisaoGerencialId: data.versaoVisaoGerencialId,
        itens: {
          create: data.itens.map((item) => ({
            numeroMedicao: novoNumero,
            itemOrcamentoId: item.itemOrcamentoId,
            itemCustoOrcadoId: item.itemCustoOrcadoId,
            itemCategorizacaoId: item.itemCategorizacaoId,
            itemVisaoGerencialId: item.itemVisaoGerencialId,
            etapa: item.etapa,
            subEtapa: item.subEtapa,
            servicoSimplificado: item.servicoSimplificado,
            quantidadePrevista: new Prisma.Decimal(item.quantidadePrevista),
            percentualPrevisto: new Prisma.Decimal(item.percentualPrevisto),
            valorPrevisto: new Prisma.Decimal(item.valorPrevisto),
            quantidadeAcumulada: new Prisma.Decimal(0),
            percentualAcumulado: new Prisma.Decimal(0),
            valorAcumulado: new Prisma.Decimal(0),
            saldoQuantidade: new Prisma.Decimal(0),
            saldoPercentual: new Prisma.Decimal(0),
            saldoValor: new Prisma.Decimal(0),
            observacoes: item.observacoes,
          })),
        },
      },
      include: {
        itens: true,
      },
    });

    // Recalcular acumulados após criar
    await recalcularAcumulados(data.obraId);

    revalidatePath(`/eng/plan-medicoes/${data.obraId}`);

    return {
      success: true,
      data: previsao,
    };
  } catch (error: any) {
    console.error("Erro ao criar previsão de medição:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// ATUALIZAR PREVISÃO DE MEDIÇÃO
// --------------------------------------------------------

export async function atualizarPrevisaoMedicao(
  id: string,
  data: Partial<PrevisaoMedicaoInput>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const previsao = await db.previsaoMedicao.update({
      where: { id },
      data: {
        nome: data.nome,
        dataPrevisao: data.dataPrevisao
          ? new Date(data.dataPrevisao)
          : undefined,
        ordem: data.ordem,
        visivel: data.visivel,
        tipo: data.tipo,
        observacoes: data.observacoes,
        versaoOrcamentoId: data.versaoOrcamentoId,
        versaoCustoOrcadoId: data.versaoCustoOrcadoId,
        versaoCategorizacaoId: data.versaoCategorizacaoId,
        versaoVisaoGerencialId: data.versaoVisaoGerencialId,
      },
      include: {
        itens: true,
      },
    });

    // Obter obraId para revalidação
    const previsaoAtual = await db.previsaoMedicao.findUnique({
      where: { id },
      select: { obraId: true },
    });

    if (previsaoAtual) {
      revalidatePath(`/eng/plan-medicoes/${previsaoAtual.obraId}`);
    }

    return {
      success: true,
      data: previsao,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar previsão de medição:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// CONCLUIR PREVISÃO DE MEDIÇÃO (Marca como REALIZADA)
// --------------------------------------------------------

export async function concluirPrevisaoMedicao(
  id: string,
  dataRealMedicao?: string | Date
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const previsao = await db.previsaoMedicao.update({
      where: { id },
      data: {
        status: "REALIZADA",
        dataRealMedicao: dataRealMedicao ? new Date(dataRealMedicao) : new Date(),
      },
      include: {
        itens: true,
      },
    });

    // Obter obraId para revalidação
    const previsaoAtual = await db.previsaoMedicao.findUnique({
      where: { id },
      select: { obraId: true },
    });

    if (previsaoAtual) {
      revalidatePath(`/eng/plan-medicoes/${previsaoAtual.obraId}`);
    }

    return {
      success: true,
      data: previsao,
    };
  } catch (error: any) {
    console.error("Erro ao concluir previsão de medição:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// DELETAR PREVISÃO DE MEDIÇÃO
// --------------------------------------------------------

export async function deletarPrevisaoMedicao(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar obraId antes de deletar
    const previsao = await db.previsaoMedicao.findUnique({
      where: { id },
      select: { obraId: true },
    });

    await db.previsaoMedicao.delete({
      where: { id },
    });

    // Recalcular acumulados após deletar
    if (previsao) {
      await recalcularAcumulados(previsao.obraId);
      revalidatePath(`/eng/plan-medicoes/${previsao.obraId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao deletar previsão de medição:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// BUSCAR PREVISÕES DE MEDIÇÃO POR OBRA
// --------------------------------------------------------

export async function buscarPrevisoesPorObra(obraId: string) {
  try {
    const previsoes = await db.previsaoMedicao.findMany({
      where: { obraId },
      include: {
        itens: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { numero: "asc" },
    });

    return {
      success: true,
      data: previsoes,
    };
  } catch (error: any) {
    console.error("Erro ao buscar previsões:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// BUSCAR PREVISÃO POR ID
// --------------------------------------------------------

export async function buscarPrevisaoPorId(id: string) {
  try {
    const previsao = await db.previsaoMedicao.findUnique({
      where: { id },
      include: {
        itens: true,
        obra: {
          select: {
            id: true,
            nome: true,
            codigo: true,
          },
        },
      },
    });

    return {
      success: true,
      data: previsao,
    };
  } catch (error: any) {
    console.error("Erro ao buscar previsão:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// SUBSTITUIR TODOS OS ITENS DE UMA MEDIÇÃO
// --------------------------------------------------------

export async function substituirItensMedicao(
  previsaoMedicaoId: string,
  itens: ItemPrevisaoMedicaoInput[],
  numeroMedicao: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Buscar previsão para pegar obraId
    const previsao = await db.previsaoMedicao.findUnique({
      where: { id: previsaoMedicaoId },
      select: { obraId: true },
    });

    if (!previsao) {
      return {
        success: false,
        error: "Previsão não encontrada",
      };
    }

    // Deletar todos os itens existentes desta medição
    await db.itemPrevisaoMedicao.deleteMany({
      where: { previsaoMedicaoId },
    });

    // Criar novos itens
    await db.itemPrevisaoMedicao.createMany({
      data: itens.map((item) => ({
        previsaoMedicaoId,
        numeroMedicao,
        itemOrcamentoId: item.itemOrcamentoId,
        itemCustoOrcadoId: item.itemCustoOrcadoId,
        itemCategorizacaoId: item.itemCategorizacaoId,
        itemVisaoGerencialId: item.itemVisaoGerencialId,
        etapa: item.etapa,
        subEtapa: item.subEtapa,
        servicoSimplificado: item.servicoSimplificado,
        quantidadePrevista: new Prisma.Decimal(item.quantidadePrevista),
        percentualPrevisto: new Prisma.Decimal(item.percentualPrevisto),
        valorPrevisto: new Prisma.Decimal(item.valorPrevisto),
        quantidadeAcumulada: new Prisma.Decimal(0),
        percentualAcumulado: new Prisma.Decimal(0),
        valorAcumulado: new Prisma.Decimal(0),
        saldoQuantidade: new Prisma.Decimal(0),
        saldoPercentual: new Prisma.Decimal(0),
        saldoValor: new Prisma.Decimal(0),
        observacoes: item.observacoes,
      })),
    });

    // Recalcular acumulados
    await recalcularAcumulados(previsao.obraId);

    revalidatePath(`/eng/plan-medicoes/${previsao.obraId}`);

    return {
      success: true,
      data: { message: "Itens substituídos com sucesso" },
    };
  } catch (error: any) {
    console.error("Erro ao substituir itens da medição:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// ATUALIZAR ITEM DE PREVISÃO
// --------------------------------------------------------

export async function atualizarItemPrevisao(
  itemId: string,
  data: Partial<ItemPrevisaoMedicaoInput>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const item = await db.itemPrevisaoMedicao.update({
      where: { id: itemId },
      data: {
        quantidadePrevista: data.quantidadePrevista
          ? new Prisma.Decimal(data.quantidadePrevista)
          : undefined,
        percentualPrevisto: data.percentualPrevisto
          ? new Prisma.Decimal(data.percentualPrevisto)
          : undefined,
        valorPrevisto: data.valorPrevisto
          ? new Prisma.Decimal(data.valorPrevisto)
          : undefined,
        observacoes: data.observacoes,
      },
    });

    // Buscar obraId para recalcular acumulados
    const previsao = await db.previsaoMedicao.findUnique({
      where: { id: item.previsaoMedicaoId },
      select: { obraId: true },
    });

    if (previsao) {
      await recalcularAcumulados(previsao.obraId);
      revalidatePath(`/eng/plan-medicoes/${previsao.obraId}`);
    }

    return {
      success: true,
      data: item,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar item de previsão:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// RECALCULAR ACUMULADOS
// --------------------------------------------------------

async function recalcularAcumulados(obraId: string) {
  try {
    // Buscar todas as previsões da obra ordenadas por data
    const previsoes = await db.previsaoMedicao.findMany({
      where: { obraId },
      include: {
        itens: true,
      },
      orderBy: [{ dataPrevisao: "asc" }, { numero: "asc" }],
    });

    // Agrupar itens por itemOrcamentoId ou itemCustoOrcadoId
    const itensPorCodigo: Record<
      string,
      {
        quantidadeTotal: number;
        valorTotal: number;
        acumuladoQuantidade: number;
        acumuladoValor: number;
      }
    > = {};

    // Primeiro, buscar as quantidades totais dos itens
    for (const previsao of previsoes) {
      for (const item of previsao.itens) {
        const chave =
          item.itemOrcamentoId || item.itemCustoOrcadoId || item.id;

        if (!itensPorCodigo[chave]) {
          // Buscar quantidade total do item original
          let quantidadeTotal = 0;
          let valorTotal = 0;

          if (item.itemOrcamentoId) {
            const itemOriginal = await db.itemOrcamento.findUnique({
              where: { id: item.itemOrcamentoId },
            });
            if (itemOriginal) {
              quantidadeTotal = Number(itemOriginal.quantidade || 0);
              valorTotal = Number(itemOriginal.precoTotalVenda || 0);
            }
          } else if (item.itemCustoOrcadoId) {
            const itemOriginal = await db.itemCustoOrcado.findUnique({
              where: { id: item.itemCustoOrcadoId },
            });
            if (itemOriginal) {
              quantidadeTotal = Number(itemOriginal.quantidade || 0);
              valorTotal = Number(itemOriginal.precoTotalVenda || 0);
            }
          }

          itensPorCodigo[chave] = {
            quantidadeTotal,
            valorTotal,
            acumuladoQuantidade: 0,
            acumuladoValor: 0,
          };
        }
      }
    }

    // Agora calcular acumulados e atualizar cada item
    for (const previsao of previsoes) {
      for (const item of previsao.itens) {
        const chave =
          item.itemOrcamentoId || item.itemCustoOrcadoId || item.id;
        const dados = itensPorCodigo[chave];

        // Acumular
        dados.acumuladoQuantidade += Number(item.quantidadePrevista);
        dados.acumuladoValor += Number(item.valorPrevisto);

        // Calcular percentual acumulado
        const percentualAcumulado =
          dados.quantidadeTotal > 0
            ? (dados.acumuladoQuantidade / dados.quantidadeTotal) * 100
            : 0;

        // Calcular saldos
        const saldoQuantidade = dados.quantidadeTotal - dados.acumuladoQuantidade;
        const saldoValor = dados.valorTotal - dados.acumuladoValor;
        const saldoPercentual = 100 - percentualAcumulado;

        // Atualizar item
        await db.itemPrevisaoMedicao.update({
          where: { id: item.id },
          data: {
            quantidadeAcumulada: new Prisma.Decimal(dados.acumuladoQuantidade),
            percentualAcumulado: new Prisma.Decimal(percentualAcumulado),
            valorAcumulado: new Prisma.Decimal(dados.acumuladoValor),
            saldoQuantidade: new Prisma.Decimal(
              Math.max(0, saldoQuantidade)
            ),
            saldoPercentual: new Prisma.Decimal(
              Math.max(0, saldoPercentual)
            ),
            saldoValor: new Prisma.Decimal(Math.max(0, saldoValor)),
          },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao recalcular acumulados:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// BUSCAR MEDIÇÕES AGRUPADAS POR VISÃO GERENCIAL
// --------------------------------------------------------

export async function buscarMedicoesAgrupadasPorVisaoGerencial(
  obraId: string,
  versaoVisaoGerencialId?: string
) {
  try {
    // Buscar todas as previsões da obra
    const previsoes = await db.previsaoMedicao.findMany({
      where: {
        obraId,
        ...(versaoVisaoGerencialId && { versaoVisaoGerencialId }),
      },
      include: {
        itens: true,
      },
      orderBy: { numero: "asc" },
    });

    // Agrupar por etapa -> subEtapa -> servicoSimplificado
    const agrupado: Record<
      string,
      {
        etapa: string;
        subEtapas: Record<
          string,
          {
            subEtapa: string;
            servicos: Record<
              string,
              {
                servicoSimplificado: string;
                quantidadeTotal: number;
                valorTotal: number;
                quantidadeMedida: number;
                valorMedido: number;
                percentualMedido: number;
                medicoes: Array<{
                  previsaoId: string;
                  nome: string;
                  dataPrevisao: Date;
                  quantidade: number;
                  valor: number;
                }>;
              }
            >;
          }
        >;
      }
    > = {};

    for (const previsao of previsoes) {
      for (const item of previsao.itens) {
        const etapa = item.etapa || "Sem Etapa";
        const subEtapa = item.subEtapa || "Sem SubEtapa";
        const servicoSimplificado =
          item.servicoSimplificado || "Sem Serviço";

        // Inicializar estrutura se não existir
        if (!agrupado[etapa]) {
          agrupado[etapa] = {
            etapa,
            subEtapas: {},
          };
        }
        if (!agrupado[etapa].subEtapas[subEtapa]) {
          agrupado[etapa].subEtapas[subEtapa] = {
            subEtapa,
            servicos: {},
          };
        }
        if (
          !agrupado[etapa].subEtapas[subEtapa].servicos[servicoSimplificado]
        ) {
          agrupado[etapa].subEtapas[subEtapa].servicos[servicoSimplificado] =
            {
              servicoSimplificado,
              quantidadeTotal: Number(item.saldoQuantidade || 0) +
                Number(item.quantidadeAcumulada || 0),
              valorTotal: Number(item.saldoValor || 0) +
                Number(item.valorAcumulado || 0),
              quantidadeMedida: 0,
              valorMedido: 0,
              percentualMedido: 0,
              medicoes: [],
            };
        }

        const servico =
          agrupado[etapa].subEtapas[subEtapa].servicos[servicoSimplificado];

        // Acumular valores
        servico.quantidadeMedida += Number(item.quantidadePrevista || 0);
        servico.valorMedido += Number(item.valorPrevisto || 0);

        // Adicionar medição
        servico.medicoes.push({
          previsaoId: previsao.id,
          nome: previsao.nome,
          dataPrevisao: previsao.dataPrevisao,
          quantidade: Number(item.quantidadePrevista || 0),
          valor: Number(item.valorPrevisto || 0),
        });

        // Calcular percentual
        if (servico.quantidadeTotal > 0) {
          servico.percentualMedido =
            (servico.quantidadeMedida / servico.quantidadeTotal) * 100;
        }
      }
    }

    return {
      success: true,
      data: agrupado,
    };
  } catch (error: any) {
    console.error("Erro ao buscar medições agrupadas:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// --------------------------------------------------------
// BUSCAR RESUMO DE MEDIÇÕES POR ITEM
// --------------------------------------------------------

export async function buscarResumoMedicoesPorItem(
  obraId: string,
  itemOrcamentoId?: string,
  itemCustoOrcadoId?: string
) {
  try {
    const where: any = {};

    if (itemOrcamentoId) {
      where.itemOrcamentoId = itemOrcamentoId;
    } else if (itemCustoOrcadoId) {
      where.itemCustoOrcadoId = itemCustoOrcadoId;
    }

    const itens = await db.itemPrevisaoMedicao.findMany({
      where: {
        previsaoMedicao: {
          obraId,
        },
        ...where,
      },
      include: {
        previsaoMedicao: {
          select: {
            id: true,
            nome: true,
            numero: true,
            dataPrevisao: true,
            status: true,
          },
        },
      },
      orderBy: {
        previsaoMedicao: {
          numero: "asc",
        },
      },
    });

    return {
      success: true,
      data: itens,
    };
  } catch (error: any) {
    console.error("Erro ao buscar resumo de medições:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
