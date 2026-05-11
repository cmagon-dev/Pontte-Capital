-- Migration: adiciona aprovacao tecnica como etapa do workflow de operacao
-- PR1 do modulo de Operacoes Financeiras

-- ============================================================================
-- 1. Atualiza enum StatusWorkflowOperacao
-- ============================================================================
-- Substitui o valor 'EM_APROVACAO' por dois novos:
--   - 'EM_APROVACAO_TECNICA'    : nova etapa intermediaria (Pontte)
--   - 'EM_APROVACAO_FINANCEIRA' : equivalente ao antigo EM_APROVACAO (Fundo/Fiador)
-- Banco esta zerado neste momento, mas mantemos o pattern correto para producao.

ALTER TYPE "StatusWorkflowOperacao" RENAME TO "StatusWorkflowOperacao_old";

CREATE TYPE "StatusWorkflowOperacao" AS ENUM (
  'EM_EDICAO',
  'FINALIZADA',
  'EM_APROVACAO_TECNICA',
  'EM_APROVACAO_FINANCEIRA',
  'APROVADA',
  'REJEITADA'
);

-- Migra valores antigos: EM_APROVACAO -> EM_APROVACAO_FINANCEIRA, demais mapeados 1:1
ALTER TABLE "Operacao"
  ALTER COLUMN "statusWorkflow" DROP DEFAULT,
  ALTER COLUMN "statusWorkflow" TYPE "StatusWorkflowOperacao"
    USING (
      CASE "statusWorkflow"::text
        WHEN 'EM_APROVACAO' THEN 'EM_APROVACAO_FINANCEIRA'
        ELSE "statusWorkflow"::text
      END
    )::"StatusWorkflowOperacao",
  ALTER COLUMN "statusWorkflow" SET DEFAULT 'EM_EDICAO';

DROP TYPE "StatusWorkflowOperacao_old";

-- ============================================================================
-- 2. Adiciona TECNICA ao enum PapelAprovacaoOperacao
-- ============================================================================

ALTER TYPE "PapelAprovacaoOperacao" ADD VALUE 'TECNICA' BEFORE 'FUNDO';

-- ============================================================================
-- 3. Adiciona colunas de aprovacao tecnica em Operacao
-- ============================================================================

ALTER TABLE "Operacao"
  ADD COLUMN "aprovacaoTecnicaStatus" "StatusAprovacaoPapel" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "aprovacaoTecnicaData" TIMESTAMP(3),
  ADD COLUMN "aprovacaoTecnicaMotivo" TEXT,
  ADD COLUMN "aprovacaoTecnicaPorId" TEXT;

-- ============================================================================
-- 4. FK e indice
-- ============================================================================

ALTER TABLE "Operacao"
  ADD CONSTRAINT "Operacao_aprovacaoTecnicaPorId_fkey"
  FOREIGN KEY ("aprovacaoTecnicaPorId") REFERENCES "usuarios"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Operacao_aprovacaoTecnicaStatus_idx"
  ON "Operacao"("aprovacaoTecnicaStatus");
