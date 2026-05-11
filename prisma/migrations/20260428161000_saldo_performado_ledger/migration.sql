-- CreateEnum
CREATE TYPE "TipoLancamentoSaldoPerformado" AS ENUM ('CREDITO', 'DEBITO', 'AJUSTE_CREDITO', 'AJUSTE_DEBITO');

-- CreateTable
CREATE TABLE "SaldoPerformadoLancamento" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "tipo" "TipoLancamentoSaldoPerformado" NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "saldoAposLancamento" DECIMAL(18,2),
    "operacaoOrigemId" TEXT,
    "operacaoDestinoId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaldoPerformadoLancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoPerformadoAlocacao" (
    "id" TEXT NOT NULL,
    "lancamentoCreditoId" TEXT NOT NULL,
    "lancamentoDebitoId" TEXT NOT NULL,
    "valorAlocado" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaldoPerformadoAlocacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaldoPerformadoLancamento_construtoraId_obraId_createdAt_idx" ON "SaldoPerformadoLancamento"("construtoraId", "obraId", "createdAt");

-- CreateIndex
CREATE INDEX "SaldoPerformadoLancamento_obraId_createdAt_idx" ON "SaldoPerformadoLancamento"("obraId", "createdAt");

-- CreateIndex
CREATE INDEX "SaldoPerformadoLancamento_operacaoOrigemId_idx" ON "SaldoPerformadoLancamento"("operacaoOrigemId");

-- CreateIndex
CREATE INDEX "SaldoPerformadoLancamento_operacaoDestinoId_idx" ON "SaldoPerformadoLancamento"("operacaoDestinoId");

-- CreateIndex
CREATE INDEX "SaldoPerformadoAlocacao_lancamentoCreditoId_idx" ON "SaldoPerformadoAlocacao"("lancamentoCreditoId");

-- CreateIndex
CREATE INDEX "SaldoPerformadoAlocacao_lancamentoDebitoId_idx" ON "SaldoPerformadoAlocacao"("lancamentoDebitoId");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoPerformadoAlocacao_lancamentoCreditoId_lancamentoDebitoId_key" ON "SaldoPerformadoAlocacao"("lancamentoCreditoId", "lancamentoDebitoId");

-- AddForeignKey
ALTER TABLE "SaldoPerformadoLancamento" ADD CONSTRAINT "SaldoPerformadoLancamento_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoPerformadoLancamento" ADD CONSTRAINT "SaldoPerformadoLancamento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoPerformadoLancamento" ADD CONSTRAINT "SaldoPerformadoLancamento_operacaoOrigemId_fkey" FOREIGN KEY ("operacaoOrigemId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoPerformadoLancamento" ADD CONSTRAINT "SaldoPerformadoLancamento_operacaoDestinoId_fkey" FOREIGN KEY ("operacaoDestinoId") REFERENCES "Operacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoPerformadoAlocacao" ADD CONSTRAINT "SaldoPerformadoAlocacao_lancamentoCreditoId_fkey" FOREIGN KEY ("lancamentoCreditoId") REFERENCES "SaldoPerformadoLancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoPerformadoAlocacao" ADD CONSTRAINT "SaldoPerformadoAlocacao_lancamentoDebitoId_fkey" FOREIGN KEY ("lancamentoDebitoId") REFERENCES "SaldoPerformadoLancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: créditos a partir de operações SALDO_PERFORMADO legadas
INSERT INTO "SaldoPerformadoLancamento" (
  "id", "construtoraId", "obraId", "tipo", "valor", "operacaoOrigemId", "observacoes", "createdAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || op."id"),
  op."construtoraId",
  op."obraId",
  'CREDITO'::"TipoLancamentoSaldoPerformado",
  (op."valorTotalOrdens" - COALESCE(op."valorRecomprado", 0)),
  op."id",
  CONCAT('Migracao legado SALDO_PERFORMADO ', op."codigo"),
  op."createdAt"
FROM "Operacao" op
WHERE op."tipo" = 'SALDO_PERFORMADO' AND (op."valorTotalOrdens" - COALESCE(op."valorRecomprado", 0)) > 0;

-- Backfill: débitos agregados por A_PERFORMAR legada
INSERT INTO "SaldoPerformadoLancamento" (
  "id", "construtoraId", "obraId", "tipo", "valor", "operacaoDestinoId", "observacoes", "createdAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || op."id" || 'debito'),
  op."construtoraId",
  op."obraId",
  'DEBITO'::"TipoLancamentoSaldoPerformado",
  op."saldoPerformadoConsumido",
  op."id",
  CONCAT('Migracao consumo legado A_PERFORMAR ', op."codigo"),
  op."createdAt"
FROM "Operacao" op
WHERE op."tipo" = 'A_PERFORMAR' AND COALESCE(op."saldoPerformadoConsumido", 0) > 0;
