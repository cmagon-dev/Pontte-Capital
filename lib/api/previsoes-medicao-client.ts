/**
 * Cliente para API de Previsões de Medição
 * 
 * Este arquivo fornece funções helper para interagir com as APIs de previsões de medição
 */

import type { PrevisaoMedicaoComItens } from "@/app/actions/previsoes-medicao";

// --------------------------------------------------------
// TIPOS
// --------------------------------------------------------

export type PrevisaoMedicao = {
  id: string;
  obraId: string;
  nome: string;
  numero: number;
  dataPrevisao: Date | string;
  dataRealMedicao?: Date | string | null;
  ordem: number;
  visivel: boolean;
  tipo: "QUANTIDADE" | "PERCENTUAL";
  observacoes?: string;
  status: "PREVISTA" | "EM_MEDICAO" | "REALIZADA" | "CANCELADA";
  versaoOrcamentoId?: string;
  versaoCustoOrcadoId?: string;
  versaoCategorizacaoId?: string;
  versaoVisaoGerencialId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  itens?: ItemPrevisaoMedicao[];
};

export type ItemPrevisaoMedicao = {
  id: string;
  previsaoMedicaoId: string;
  itemOrcamentoId?: string;
  itemCustoOrcadoId?: string;
  itemCategorizacaoId?: string;
  itemVisaoGerencialId?: string;
  etapa?: string;
  subEtapa?: string;
  servicoSimplificado?: string;
  quantidadePrevista: number | string;
  percentualPrevisto: number | string;
  valorPrevisto: number | string;
  quantidadeAcumulada: number | string;
  percentualAcumulado: number | string;
  valorAcumulado: number | string;
  saldoQuantidade: number | string;
  saldoPercentual: number | string;
  saldoValor: number | string;
  observacoes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type MedicaoAgrupada = {
  [etapa: string]: {
    etapa: string;
    subEtapas: {
      [subEtapa: string]: {
        subEtapa: string;
        servicos: {
          [servicoSimplificado: string]: {
            servicoSimplificado: string;
            quantidadeTotal: number;
            valorTotal: number;
            quantidadeMedida: number;
            valorMedido: number;
            percentualMedido: number;
            medicoes: Array<{
              previsaoId: string;
              nome: string;
              dataPrevisao: Date | string;
              quantidade: number;
              valor: number;
            }>;
          };
        };
      };
    };
  };
};

// --------------------------------------------------------
// FUNÇÕES DA API
// --------------------------------------------------------

/**
 * Buscar todas as previsões de medição de uma obra
 */
export async function buscarPrevisoesPorObra(
  obraId: string
): Promise<PrevisaoMedicao[]> {
  const response = await fetch(
    `/api/previsoes-medicao?obraId=${obraId}`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar previsões de medição");
  }

  return response.json();
}

/**
 * Buscar uma previsão de medição por ID
 */
export async function buscarPrevisaoPorId(
  id: string
): Promise<PrevisaoMedicao> {
  const response = await fetch(`/api/previsoes-medicao/${id}`);

  if (!response.ok) {
    throw new Error("Erro ao buscar previsão de medição");
  }

  return response.json();
}

/**
 * Criar uma nova previsão de medição
 */
export async function criarPrevisaoMedicao(
  data: PrevisaoMedicaoComItens
): Promise<PrevisaoMedicao> {
  const response = await fetch("/api/previsoes-medicao", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const responseText = await response.text();
    try {
      const error = JSON.parse(responseText);
      throw new Error(error.error || "Erro ao criar previsão de medição");
    } catch (parseError) {
      throw new Error(`Erro ao criar previsão: ${response.status} - ${responseText.substring(0, 200)}`);
    }
  }

  return response.json();
}

/**
 * Atualizar uma previsão de medição
 */
export async function atualizarPrevisaoMedicao(
  id: string,
  data: Partial<PrevisaoMedicaoComItens>
): Promise<PrevisaoMedicao> {
  const response = await fetch(`/api/previsoes-medicao/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao atualizar previsão de medição");
  }

  return response.json();
}

/**
 * Deletar uma previsão de medição
 */
export async function deletarPrevisaoMedicao(id: string): Promise<void> {
  const response = await fetch(`/api/previsoes-medicao/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao deletar previsão de medição");
  }
}

/**
 * Concluir uma previsão de medição (marca como REALIZADA e bloqueia edição)
 */
export async function concluirPrevisaoMedicao(
  id: string,
  dataRealMedicao?: Date | string
): Promise<PrevisaoMedicao> {
  const response = await fetch(`/api/previsoes-medicao/${id}/concluir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ dataRealMedicao }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao concluir previsão de medição");
  }

  return response.json();
}

/**
 * Atualizar um item de previsão de medição
 */
export async function atualizarItemPrevisao(
  itemId: string,
  data: {
    quantidadePrevista?: number;
    percentualPrevisto?: number;
    valorPrevisto?: number;
    observacoes?: string;
  }
): Promise<ItemPrevisaoMedicao> {
  const response = await fetch(`/api/previsoes-medicao/itens/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao atualizar item de previsão");
  }

  return response.json();
}

/**
 * Substituir todos os itens de uma medição
 */
export async function substituirItensMedicao(
  previsaoMedicaoId: string,
  itens: Array<{
    itemOrcamentoId?: string;
    itemCustoOrcadoId?: string;
    quantidadePrevista: number;
    percentualPrevisto: number;
    valorPrevisto: number;
  }>,
  numeroMedicao: number
): Promise<{ message: string }> {
  const response = await fetch(`/api/previsoes-medicao/${previsaoMedicaoId}/itens`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ itens, numeroMedicao }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao substituir itens da medição");
  }

  return await response.json();
}

/**
 * Buscar medições agrupadas por visão gerencial
 */
export async function buscarMedicoesAgrupadasPorVisaoGerencial(
  obraId: string,
  versaoVisaoGerencialId?: string
): Promise<MedicaoAgrupada> {
  let url = `/api/previsoes-medicao/visao-gerencial?obraId=${obraId}`;
  
  if (versaoVisaoGerencialId) {
    url += `&versaoVisaoGerencialId=${versaoVisaoGerencialId}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar medições agrupadas");
  }

  return response.json();
}

/**
 * Buscar resumo de medições por item
 */
export async function buscarResumoMedicoesPorItem(
  obraId: string,
  itemOrcamentoId?: string,
  itemCustoOrcadoId?: string
): Promise<ItemPrevisaoMedicao[]> {
  let url = `/api/previsoes-medicao/resumo-item?obraId=${obraId}`;

  if (itemOrcamentoId) {
    url += `&itemOrcamentoId=${itemOrcamentoId}`;
  } else if (itemCustoOrcadoId) {
    url += `&itemCustoOrcadoId=${itemCustoOrcadoId}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erro ao buscar resumo de medições");
  }

  return response.json();
}

// --------------------------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------------------------

/**
 * Formatar valor numérico de Prisma Decimal para número
 */
export function formatarValorDecimal(valor: number | string): number {
  if (typeof valor === "string") {
    return parseFloat(valor);
  }
  return valor;
}

/**
 * Calcular total de uma previsão de medição
 */
export function calcularTotalPrevisao(
  previsao: PrevisaoMedicao
): { quantidade: number; valor: number } {
  if (!previsao.itens || previsao.itens.length === 0) {
    return { quantidade: 0, valor: 0 };
  }

  const total = previsao.itens.reduce(
    (acc, item) => {
      acc.quantidade += formatarValorDecimal(item.quantidadePrevista);
      acc.valor += formatarValorDecimal(item.valorPrevisto);
      return acc;
    },
    { quantidade: 0, valor: 0 }
  );

  return total;
}

/**
 * Calcular percentual medido de um item
 */
export function calcularPercentualMedido(item: ItemPrevisaoMedicao): number {
  const quantidadeTotal =
    formatarValorDecimal(item.quantidadeAcumulada) +
    formatarValorDecimal(item.saldoQuantidade);

  if (quantidadeTotal === 0) return 0;

  return (
    (formatarValorDecimal(item.quantidadeAcumulada) / quantidadeTotal) * 100
  );
}

/**
 * Verificar se uma previsão está completa (100% medida)
 */
export function isPrevisaoCompleta(previsao: PrevisaoMedicao): boolean {
  if (!previsao.itens || previsao.itens.length === 0) return false;

  return previsao.itens.every((item) => {
    const percentual = calcularPercentualMedido(item);
    return percentual >= 100;
  });
}

/**
 * Obter cor do status da previsão
 */
export function getCorStatus(
  status: PrevisaoMedicao["status"]
): string {
  const cores = {
    PREVISTA: "bg-blue-100 text-blue-800",
    EM_MEDICAO: "bg-yellow-100 text-yellow-800",
    REALIZADA: "bg-green-100 text-green-800",
    CANCELADA: "bg-red-100 text-red-800",
  };

  return cores[status] || "bg-gray-100 text-gray-800";
}

/**
 * Formatar data para exibição
 */
export function formatarData(data: Date | string): string {
  const date = typeof data === "string" ? new Date(data) : data;
  return date.toLocaleDateString("pt-BR");
}

/**
 * Formatar moeda para exibição
 */
export function formatarMoeda(valor: number | string): string {
  const num = formatarValorDecimal(valor);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Formatar quantidade para exibição
 */
export function formatarQuantidade(
  quantidade: number | string,
  decimais: number = 2
): string {
  const num = formatarValorDecimal(quantidade);
  return num.toFixed(decimais);
}

/**
 * Formatar percentual para exibição
 */
export function formatarPercentual(percentual: number | string): string {
  const num = formatarValorDecimal(percentual);
  return `${num.toFixed(2)}%`;
}
