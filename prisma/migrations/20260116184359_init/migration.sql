-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'usuario',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fundos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "saldoDisponivel" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "obrasAtivas" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fundos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construtoras" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "endereco" TEXT NOT NULL,
    "complemento" TEXT,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "rating" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "exposicaoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "risco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construtoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "socios" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "participacao" TEXT NOT NULL,
    "cargo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias_construtoras" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Corrente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_bancarias_construtoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_construtoras" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_construtoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiadores" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "razaoSocial" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bens" (
    "id" TEXT NOT NULL,
    "fiadorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "valor" DECIMAL(15,2) NOT NULL,
    "matricula" TEXT,
    "cartorio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Livre',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "prazoMedioPagamento" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fontes_recurso" (
    "id" TEXT NOT NULL,
    "contratanteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fontes_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "fundoId" TEXT,
    "contratanteId" TEXT NOT NULL,
    "numeroContrato" TEXT NOT NULL,
    "numeroEdital" TEXT,
    "objeto" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "valorGlobal" DECIMAL(15,2) NOT NULL,
    "enderecoObra" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "gerenteEngenhariaId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilha_contratual" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "versaoId" TEXT,
    "nomeVersao" TEXT,
    "tipoVersao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCriacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planilha_contratual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planilha_itens" (
    "id" TEXT NOT NULL,
    "planilhaContratualId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "precoUnitario" DECIMAL(15,2) NOT NULL,
    "precoTotal" DECIMAL(15,2) NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'item',
    "categoriaId" TEXT,
    "ordem" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planilha_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custos_orcados" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "versaoId" TEXT,
    "versaoPlanilhaContratualId" TEXT,
    "nomeVersao" TEXT,
    "tipoVersao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCriacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custos_orcados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custo_itens" (
    "id" TEXT NOT NULL,
    "custosOrcadosId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "custoMat" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "custoMO" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "custoContratos" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "custoEqFr" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "custoTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "precoVenda" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lucroProjetado" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "margem" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'item',
    "ordem" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custo_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronograma_versoes" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nomeVersao" TEXT NOT NULL,
    "tipoVersao" TEXT NOT NULL DEFAULT 'baseline',
    "ativa" BOOLEAN NOT NULL DEFAULT false,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCriacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronograma_versoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronograma_tarefas" (
    "id" TEXT NOT NULL,
    "cronogramaVersaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataTermino" TIMESTAMP(3),
    "duracao" INTEGER,
    "predecessoras" TEXT[],
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'item',
    "ordem" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cronograma_tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operacoes_financeiras" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "obraId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL,
    "dataLiquidacaoPrevista" TIMESTAMP(3),
    "statusFinanceiro" TEXT NOT NULL DEFAULT 'Aberto',
    "credorId" TEXT,
    "fundoId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projecaoEncargos" JSONB,

    CONSTRAINT "operacoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fundos_cnpj_key" ON "fundos"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "construtoras_cnpj_key" ON "construtoras"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "contas_bancarias_construtoras_construtoraId_key" ON "contas_bancarias_construtoras"("construtoraId");

-- CreateIndex
CREATE UNIQUE INDEX "fiadores_cnpj_key" ON "fiadores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "contratantes_cnpj_key" ON "contratantes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "obras_construtoraId_numeroContrato_key" ON "obras"("construtoraId", "numeroContrato");

-- AddForeignKey
ALTER TABLE "socios" ADD CONSTRAINT "socios_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "construtoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias_construtoras" ADD CONSTRAINT "contas_bancarias_construtoras_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "construtoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_construtoras" ADD CONSTRAINT "documentos_construtoras_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "construtoras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bens" ADD CONSTRAINT "bens_fiadorId_fkey" FOREIGN KEY ("fiadorId") REFERENCES "fiadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fontes_recurso" ADD CONSTRAINT "fontes_recurso_contratanteId_fkey" FOREIGN KEY ("contratanteId") REFERENCES "contratantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "construtoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_fundoId_fkey" FOREIGN KEY ("fundoId") REFERENCES "fundos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_contratanteId_fkey" FOREIGN KEY ("contratanteId") REFERENCES "contratantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilha_contratual" ADD CONSTRAINT "planilha_contratual_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planilha_itens" ADD CONSTRAINT "planilha_itens_planilhaContratualId_fkey" FOREIGN KEY ("planilhaContratualId") REFERENCES "planilha_contratual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custos_orcados" ADD CONSTRAINT "custos_orcados_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custo_itens" ADD CONSTRAINT "custo_itens_custosOrcadosId_fkey" FOREIGN KEY ("custosOrcadosId") REFERENCES "custos_orcados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_versoes" ADD CONSTRAINT "cronograma_versoes_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_tarefas" ADD CONSTRAINT "cronograma_tarefas_cronogramaVersaoId_fkey" FOREIGN KEY ("cronogramaVersaoId") REFERENCES "cronograma_versoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
