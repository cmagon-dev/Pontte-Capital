/**
 * Tipos TypeScript para o Módulo de Operações Financeiras
 * Lastro Fintech - Modelo Dual Tranche
 */

// Tipo de operação
export type OperationType = 'TO_PERFORM' | 'PERFORMED';

// Status de workflow
export type WorkflowStatus = 'EM_EDICAO' | 'FINALIZADA' | 'EM_APROVACAO' | 'APROVADA' | 'REJEITADA';

// Status financeiro
export type FinancialStatus = 'ABERTO' | 'VENCIDO' | 'LIQUIDADO';

// Apropriação orçamentária (Visão Gerencial - obrigatório no nível SUBETAPA)
export interface BudgetAppropriation {
  subStageId: string; // ID da subetapa (item nível 2 da Visão Gerencial)
  subStageCode: string; // Código hierárquico (ex: "1.1.1")
  subStageDescription: string; // Descrição da subetapa
  etapa: string; // Etapa pai
  percentual: number; // Percentual de apropriação (deve somar 100%)
  valor: number; // Valor calculado (principal * percentual / 100)
}

export const SUBCATEGORIAS_DIRETAS_LABELS: Record<string, string> = {
  MATERIAL: 'Material',
  MAO_OBRA_SUB: 'MO Subempreitada',
  CONTRATOS: 'Contratos (MAT+MO)',
  EQUIP_FRETE: 'Equip. e Fretes',
};

// Credor/Fornecedor
export interface Credor {
  id: string;
  nome: string;
  tipo: 'Fornecedor' | 'Empreiteiro' | 'Funcionário';
  cnpj?: string;
  cpf?: string;
}

// Documento anexado
export interface OperationDocument {
  id: string;
  nomeArquivo: string;
  tipo: 'Pedido de Compra' | 'Nota Fiscal' | 'Contrato';
  numeroDocumento: string;
  dataUpload: string;
  urlArquivo: string;
}

// Projeção de encargos (juros e taxas)
export interface ChargesProjection {
  dataReferencia: string; // Data de referência para cálculo
  taxaMensal: number; // Taxa de juros mensal (em decimal, ex: 0.015 para 1.5%)
  diasCorridos: number; // Dias entre hoje e data de referência
  jurosProjetados: number; // Valor calculado: principal * taxa * (dias/30)
  taxasProjetadas: number; // Taxas administrativas/outras
  totalEncargos: number; // jurosProjetados + taxasProjetadas
}

// Operação Financeira
export interface Operation {
  id: string;
  numero: string; // Ex: "001/2024"
  tipoOperacao: OperationType;
  
  // Dados básicos
  obraId: string;
  credor: Credor;
  documento: OperationDocument;
  valorPrincipal: number;
  dataSolicitacao: string;
  
  // Projeção de encargos (obrigatório na criação)
  projecaoEncargos: ChargesProjection;
  dataLiquidacaoPrevista: string; // dataReferencia da projeção
  
  // Status
  statusWorkflow: WorkflowStatus;
  statusFinanceiro: FinancialStatus;
  
  // Apropriações (obrigatórias - devem somar 100% cada)
  apropriacoesOrcamentarias: BudgetAppropriation[]; // Visão Gerencial - nível SUBETAPA
  
  // Dados de aprovação
  dataAprovacao?: string;
  aprovador?: string;
  
  // Dados de pagamento/liquidação
  dataPagamento?: string;
  dataLiquidacaoEfetiva?: string;
  
  // Relacionamento de recompras (apenas para PERFORMED)
  operacoesRecompradas?: string[]; // IDs das operações TO_PERFORM que foram liquidadas por esta
  
  // Relacionamento de recompra (apenas para TO_PERFORM liquidado)
  recompradaPor?: string; // ID da operação PERFORMED que liquidou esta
  
  // Observações
  observacoes?: string;
}

// Configuração de taxas (mockado por enquanto, viria de configuração do sistema)
export interface TaxaConfig {
  taxaJurosMensal: number; // Taxa mensal (ex: 0.015 para 1.5% ao mês)
  taxaAdministrativa: number; // Taxa fixa ou percentual
  tipoTaxaAdministrativa: 'FIXA' | 'PERCENTUAL';
}

// Mock de configuração de taxas (em produção viria de banco/config)
export const DEFAULT_TAXA_CONFIG: TaxaConfig = {
  taxaJurosMensal: 0.015, // 1.5% ao mês
  taxaAdministrativa: 0.005, // 0.5%
  tipoTaxaAdministrativa: 'PERCENTUAL',
};

/**
 * Calcula a projeção de encargos (juros e taxas) para uma operação
 * @param valorPrincipal Valor principal da operação
 * @param dataReferencia Data futura de referência (data de recompra ou pagamento)
 * @param tipoOperacao Tipo de operação (afeta o cálculo)
 * @param config Configuração de taxas
 */
export function calcularProjecaoEncargos(
  valorPrincipal: number,
  dataReferencia: string,
  tipoOperacao: OperationType,
  config: TaxaConfig = DEFAULT_TAXA_CONFIG
): ChargesProjection {
  const hoje = new Date();
  const dataRef = new Date(dataReferencia);
  const diasCorridos = Math.max(0, Math.ceil((dataRef.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calcular juros: principal * taxa mensal * (dias / 30)
  const jurosProjetados = valorPrincipal * config.taxaJurosMensal * (diasCorridos / 30);
  
  // Calcular taxas administrativas
  let taxasProjetadas = 0;
  if (config.tipoTaxaAdministrativa === 'PERCENTUAL') {
    taxasProjetadas = valorPrincipal * config.taxaAdministrativa;
  } else {
    taxasProjetadas = config.taxaAdministrativa;
  }
  
  return {
    dataReferencia,
    taxaMensal: config.taxaJurosMensal,
    diasCorridos,
    jurosProjetados,
    taxasProjetadas,
    totalEncargos: jurosProjetados + taxasProjetadas,
  };
}

/**
 * Valida se a soma das apropriações orçamentárias é 100%
 */
export function validarApropriacoesOrcamentarias(apropriacoes: BudgetAppropriation[]): boolean {
  const total = apropriacoes.reduce((sum, ap) => sum + ap.percentual, 0);
  return Math.abs(total - 100) < 0.01; // Tolerância de 0.01%
}

/**
 * Valida se uma apropriação está no nível SERVIÇO (nível 3 - tem servicoSimplificado preenchido)
 */
export function isSubEtapa(item: { nivel: number; tipo: string; servicoSimplificado?: string }): boolean {
  return item.tipo === 'item' && !!item.servicoSimplificado && item.servicoSimplificado.trim() !== '';
}
