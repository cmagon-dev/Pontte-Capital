-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FaseOrcamento" AS ENUM ('PLANILHA_CONTRATUAL', 'CUSTOS_ORCADOS', 'CATEGORIZACAO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusVersao" AS ENUM ('ATIVA', 'OBSOLETA');

-- CreateEnum
CREATE TYPE "TipoVersao" AS ENUM ('BASELINE', 'REVISAO');

-- CreateEnum
CREATE TYPE "TipoItemOrcamento" AS ENUM ('AGRUPADOR', 'ITEM');

-- CreateEnum
CREATE TYPE "TipoPlanta" AS ENUM ('IMPLANTACAO', 'PAVIMENTO');

-- CreateEnum
CREATE TYPE "TipoMedicao" AS ENUM ('QUANTIDADE', 'PERCENTUAL');

-- CreateEnum
CREATE TYPE "StatusPrevisaoMedicao" AS ENUM ('PREVISTA', 'EM_MEDICAO', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoAlteracaoItem" AS ENUM ('MANTIDO', 'ADICIONADO', 'REMOVIDO', 'QUANTIDADE_ALTERADA', 'PRECO_ALTERADO', 'QUANTIDADE_E_PRECO_ALTERADOS');

-- CreateEnum
CREATE TYPE "TipoAditivo" AS ENUM ('ADITIVO', 'REVISAO', 'GLOSA');

-- CreateEnum
CREATE TYPE "TipoCredor" AS ENUM ('FORNECEDOR', 'EMPREITEIRO', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "TipoContaContabil" AS ENUM ('ANALITICA', 'SINTETICA', 'LINHA_RESULTADO');

-- CreateEnum
CREATE TYPE "NaturezaConta" AS ENUM ('DEVEDORA', 'CREDORA');

-- CreateEnum
CREATE TYPE "CategoriaDRE" AS ENUM ('RECEITA_BRUTA', 'DEDUCOES_RECEITA', 'RECEITA_LIQUIDA', 'CUSTO_SERVICOS', 'LUCRO_BRUTO', 'DESPESAS_COMERCIAIS', 'DESPESAS_ADMINISTRATIVAS', 'DESPESAS_PESSOAL', 'OUTRAS_DESPESAS_OPERACIONAIS', 'EBITDA', 'DEPRECIACAO_AMORTIZACAO', 'EBIT', 'RECEITAS_FINANCEIRAS', 'DESPESAS_FINANCEIRAS', 'RESULTADO_FINANCEIRO', 'LAIR', 'IMPOSTOS_LUCRO', 'LUCRO_LIQUIDO');

-- CreateEnum
CREATE TYPE "TipoCalculoDRE" AS ENUM ('SOMA', 'SUBTRACAO', 'FORMULA');

-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'ENGENHARIA', 'FINANCEIRO', 'APROVADOR');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "Construtora" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "contaBancaria" JSONB,
    "email" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "inscricaoEstadual" TEXT,
    "nomeFantasia" TEXT,
    "socios" JSONB,
    "telefone" TEXT,

    CONSTRAINT "Construtora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fundo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "contaBancaria" JSONB,
    "email" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "inscricaoEstadual" TEXT,
    "nomeFantasia" TEXT,
    "socios" JSONB,
    "telefone" TEXT,

    CONSTRAINT "Fundo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fiador" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "rg" TEXT,
    "estadoCivil" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "nomeFantasia" TEXT,
    "inscricaoEstadual" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "telefone" TEXT,
    "aprovadorFinanceiro" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fiador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contratante" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "contaBancaria" JSONB,
    "email" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "inscricaoEstadual" TEXT,
    "nomeFantasia" TEXT,
    "socios" JSONB,
    "telefone" TEXT,

    CONSTRAINT "Contratante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FonteRecurso" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "esfera" TEXT NOT NULL,
    "orgao" TEXT,
    "instituicao" TEXT,
    "numeroProcesso" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FonteRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicao" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "dataAprovacao" TIMESTAMP(3),
    "valorMedido" DECIMAL(18,2) NOT NULL,
    "valorAcumulado" DECIMAL(18,2) NOT NULL,
    "saldoContrato" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obra" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "contratanteId" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "prazoMeses" INTEGER,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "prazoExecucaoMeses" INTEGER,
    "dataInicioExecucao" TIMESTAMP(3),
    "dataFimExecucao" TIMESTAMP(3),
    "valorContrato" DECIMAL(18,2) NOT NULL,
    "cno" TEXT,
    "art" TEXT,
    "alvara" TEXT,
    "recursoFinanceiro" TEXT,
    "fonteRecursoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aditivo" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataAssinatura" TIMESTAMP(3),
    "justificativa" TEXT,
    "valorAditivo" DECIMAL(18,2),
    "valorGlosa" DECIMAL(18,2),
    "tipoUnidadePrazo" TEXT,
    "prazoVigencia" INTEGER,
    "prazoExecucao" INTEGER,
    "nomeArquivo" TEXT,
    "caminhoArquivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ELABORACAO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reajuste" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataBase" TEXT NOT NULL,
    "indice" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valorReajuste" DECIMAL(18,2) NOT NULL,
    "dataAplicacao" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "nomeArquivo" TEXT,
    "caminhoArquivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empenho" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "numeroNE" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "saldoAtual" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL,
    "alertaMinimo" DECIMAL(18,2),
    "observacoes" TEXT,
    "nomeArquivo" TEXT,
    "caminhoArquivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empenho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoFundo" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "fundoId" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valorAlocado" DECIMAL(18,2) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinculoFundo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoFiador" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "fiadorId" TEXT NOT NULL,
    "percentualGarantia" DECIMAL(5,2) NOT NULL,
    "valorGarantia" DECIMAL(18,2) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinculoFiador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoBemGarantia" (
    "id" TEXT NOT NULL,
    "vinculoFiadorId" TEXT NOT NULL,
    "bemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinculoBemGarantia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operacao" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "medicaoId" TEXT NOT NULL,
    "valorSolicitado" DECIMAL(18,2) NOT NULL,
    "taxaJurosMensal" DECIMAL(10,4) NOT NULL,
    "taxaFlat" DECIMAL(10,4) NOT NULL,
    "valorDesagio" DECIMAL(18,2) NOT NULL,
    "valorLiquido" DECIMAL(18,2) NOT NULL,
    "dataOperacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bem" (
    "id" TEXT NOT NULL,
    "fiadorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "rendaMensal" DECIMAL(18,2),
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "matricula" TEXT,
    "cartorio" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Livre',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT,
    "fundoId" TEXT,
    "fiadorId" TEXT,
    "contratanteId" TEXT,
    "bemId" TEXT,
    "obraId" TEXT,
    "aditivoId" TEXT,
    "reajusteId" TEXT,
    "empenhoId" TEXT,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataValidade" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoOrcamento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "fase" "FaseOrcamento" NOT NULL DEFAULT 'PLANILHA_CONTRATUAL',
    "status" "StatusVersao" NOT NULL DEFAULT 'ATIVA',
    "tipo" "TipoVersao" NOT NULL,
    "dataBase" TIMESTAMP(3),
    "observacoes" TEXT,
    "obraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersaoOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" TEXT NOT NULL,
    "versaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "discriminacao" TEXT NOT NULL,
    "unidade" TEXT,
    "quantidade" DECIMAL(12,4),
    "precoUnitarioVenda" DECIMAL(18,2),
    "precoTotalVenda" DECIMAL(18,2) NOT NULL,
    "tipo" "TipoItemOrcamento" NOT NULL,
    "referencia" TEXT,
    "parentId" TEXT,
    "etapa" TEXT,
    "subEtapa" TEXT,
    "grupoCusto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoCustoOrcado" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroRevisao" INTEGER NOT NULL,
    "status" "StatusVersao" NOT NULL DEFAULT 'ATIVA',
    "tipo" "TipoVersao" NOT NULL,
    "versaoContratualId" TEXT NOT NULL,
    "observacoes" TEXT,
    "obraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersaoCustoOrcado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCustoOrcado" (
    "id" TEXT NOT NULL,
    "versaoCustoOrcadoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "discriminacao" TEXT NOT NULL,
    "unidade" TEXT,
    "quantidade" DECIMAL(12,4),
    "precoUnitarioVenda" DECIMAL(18,2),
    "precoTotalVenda" DECIMAL(18,2) NOT NULL,
    "tipo" "TipoItemOrcamento" NOT NULL,
    "referencia" TEXT,
    "parentId" TEXT,
    "etapa" TEXT,
    "subEtapa" TEXT,
    "grupoCusto" TEXT,
    "valorMaterial" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorMaoDeObra" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorEquipamento" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorVerba" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoUnitarioTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lucroProjetado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "margem" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCustoOrcado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoCategorizacao" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroRevisao" INTEGER NOT NULL,
    "status" "StatusVersao" NOT NULL DEFAULT 'ATIVA',
    "tipo" "TipoVersao" NOT NULL,
    "versaoContratualId" TEXT NOT NULL,
    "observacoes" TEXT,
    "obraId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersaoCategorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCategorizacao" (
    "id" TEXT NOT NULL,
    "versaoCategorizacaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "discriminacao" TEXT NOT NULL,
    "unidade" TEXT,
    "quantidade" DECIMAL(12,4),
    "tipo" "TipoItemOrcamento" NOT NULL,
    "referencia" TEXT,
    "parentId" TEXT,
    "etapa" TEXT,
    "subEtapa" TEXT,
    "servicoSimplificado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoVisaoGerencial" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "numeroRevisao" INTEGER NOT NULL,
    "status" "StatusVersao" NOT NULL DEFAULT 'ATIVA',
    "tipo" "TipoVersao" NOT NULL,
    "versaoCustoOrcadoId" TEXT NOT NULL,
    "versaoCategorizacaoId" TEXT NOT NULL,
    "observacoes" TEXT,
    "obraId" TEXT NOT NULL,
    "campoNivel0" TEXT NOT NULL,
    "campoNivel1" TEXT,
    "campoNivel2" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VersaoVisaoGerencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVisaoGerencial" (
    "id" TEXT NOT NULL,
    "versaoVisaoGerencialId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "discriminacao" TEXT NOT NULL,
    "tipo" "TipoItemOrcamento" NOT NULL,
    "parentId" TEXT,
    "custoMat" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoMO" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoContratos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoEqFr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "custoTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "precoTotalVenda" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lucroProjetado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "margem" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemVisaoGerencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoItemVisaoGerencial" (
    "id" TEXT NOT NULL,
    "itemVisaoGerencialId" TEXT NOT NULL,
    "itemCustoOrcadoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinculoItemVisaoGerencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantaBaixa" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoPlanta" NOT NULL,
    "imagemUrl" TEXT,
    "ordem" INTEGER,
    "setorPaiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantaBaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "plantaBaixaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PontoMonitoramento" (
    "id" TEXT NOT NULL,
    "plantaBaixaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PontoMonitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto360" (
    "id" TEXT NOT NULL,
    "pontoMonitoramentoId" TEXT NOT NULL,
    "dataCaptura" TIMESTAMP(3) NOT NULL,
    "urlArquivo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Foto360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etapa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubEtapa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoSimplificado" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "leadTimeMaterial" INTEGER,
    "leadTimeMaoDeObra" INTEGER,
    "leadTimeContratos" INTEGER,
    "leadTimeEquipamentos" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoSimplificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrevisaoMedicao" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataPrevisao" TIMESTAMP(3) NOT NULL,
    "dataRealMedicao" TIMESTAMP(3),
    "ordem" INTEGER NOT NULL,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "tipo" "TipoMedicao" NOT NULL DEFAULT 'QUANTIDADE',
    "observacoes" TEXT,
    "status" "StatusPrevisaoMedicao" NOT NULL DEFAULT 'PREVISTA',
    "versaoOrcamentoId" TEXT,
    "versaoCustoOrcadoId" TEXT,
    "versaoCategorizacaoId" TEXT,
    "versaoVisaoGerencialId" TEXT,
    "versaoReferenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrevisaoMedicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPrevisaoMedicao" (
    "id" TEXT NOT NULL,
    "previsaoMedicaoId" TEXT NOT NULL,
    "numeroMedicao" INTEGER NOT NULL DEFAULT 1,
    "itemOrcamentoId" TEXT,
    "itemCustoOrcadoId" TEXT,
    "itemCategorizacaoId" TEXT,
    "itemVisaoGerencialId" TEXT,
    "etapa" TEXT,
    "subEtapa" TEXT,
    "servicoSimplificado" TEXT,
    "quantidadePrevista" DECIMAL(12,4) NOT NULL,
    "percentualPrevisto" DECIMAL(5,2) NOT NULL,
    "valorPrevisto" DECIMAL(18,2) NOT NULL,
    "quantidadeAcumulada" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "percentualAcumulado" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "valorAcumulado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoQuantidade" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "saldoPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "saldoValor" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPrevisaoMedicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoVersaoMedicao" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "versaoAnteriorId" TEXT NOT NULL,
    "versaoNovaId" TEXT NOT NULL,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoAlteracao" "TipoAditivo" NOT NULL,
    "numeroAditivo" INTEGER,
    "descricao" TEXT,
    "usuarioId" TEXT,
    "itensAdicionados" INTEGER NOT NULL DEFAULT 0,
    "itensRemovidos" INTEGER NOT NULL DEFAULT 0,
    "itensAlterados" INTEGER NOT NULL DEFAULT 0,
    "itensMantidos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HistoricoVersaoMedicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapeamentoItemVersao" (
    "id" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,
    "versaoAnteriorId" TEXT NOT NULL,
    "versaoNovaId" TEXT NOT NULL,
    "itemAnteriorId" TEXT,
    "itemNovoId" TEXT,
    "codigo" TEXT NOT NULL,
    "tipoAlteracao" "TipoAlteracaoItem" NOT NULL,
    "quantidadeAnterior" DECIMAL(12,4),
    "quantidadeNova" DECIMAL(12,4),
    "precoAnterior" DECIMAL(18,2),
    "precoNovo" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapeamentoItemVersao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credor" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "tipo" "TipoCredor" NOT NULL,
    "tipoPessoa" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "agenciaDigito" TEXT,
    "conta" TEXT,
    "contaDigito" TEXT,
    "tipoConta" TEXT,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "rg" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "valorPendente" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaBancaria" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "nomeBanco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "agenciaDigito" TEXT,
    "conta" TEXT NOT NULL,
    "contaDigito" TEXT NOT NULL,
    "tipoConta" TEXT NOT NULL,
    "chavePix" TEXT,
    "tipoChavePix" TEXT,
    "chavesPix" JSONB,
    "saldoAtual" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoDisponivel" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "dataAtualizacaoSaldo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "permiteSaque" BOOLEAN NOT NULL DEFAULT true,
    "permiteDeposito" BOOLEAN NOT NULL DEFAULT true,
    "permiteTransferencia" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoContas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "isPadrao" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "obraIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanoContas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaContabil" (
    "id" TEXT NOT NULL,
    "planoContasId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "parentId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoContaContabil" NOT NULL,
    "natureza" "NaturezaConta" NOT NULL,
    "aceitaLancamento" BOOLEAN NOT NULL DEFAULT true,
    "categoriaDRE" "CategoriaDRE",
    "tipoCalculo" "TipoCalculoDRE",
    "formula" TEXT,
    "categoria" TEXT,
    "subcategoria" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaContabil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'ENGENHARIA',
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCusto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "obraIds" JSONB,
    "tipo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Construtora_codigo_key" ON "Construtora"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Construtora_cnpj_key" ON "Construtora"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Fundo_codigo_key" ON "Fundo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fundo_cnpj_key" ON "Fundo"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Fiador_codigo_key" ON "Fiador"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fiador_cpfCnpj_key" ON "Fiador"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Contratante_codigo_key" ON "Contratante"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Contratante_cnpj_key" ON "Contratante"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "FonteRecurso_codigo_key" ON "FonteRecurso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Medicao_obraId_numero_key" ON "Medicao"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Aditivo_obraId_numero_key" ON "Aditivo"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Reajuste_obraId_numero_key" ON "Reajuste"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Empenho_obraId_numero_key" ON "Empenho"("obraId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "VinculoFundo_obraId_key" ON "VinculoFundo"("obraId");

-- CreateIndex
CREATE UNIQUE INDEX "Operacao_codigo_key" ON "Operacao"("codigo");

-- CreateIndex
CREATE INDEX "VersaoOrcamento_obraId_status_idx" ON "VersaoOrcamento"("obraId", "status");

-- CreateIndex
CREATE INDEX "VersaoOrcamento_obraId_fase_idx" ON "VersaoOrcamento"("obraId", "fase");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoOrcamento_obraId_numero_key" ON "VersaoOrcamento"("obraId", "numero");

-- CreateIndex
CREATE INDEX "ItemOrcamento_versaoId_idx" ON "ItemOrcamento"("versaoId");

-- CreateIndex
CREATE INDEX "ItemOrcamento_versaoId_nivel_idx" ON "ItemOrcamento"("versaoId", "nivel");

-- CreateIndex
CREATE INDEX "ItemOrcamento_versaoId_parentId_idx" ON "ItemOrcamento"("versaoId", "parentId");

-- CreateIndex
CREATE INDEX "ItemOrcamento_versaoId_tipo_idx" ON "ItemOrcamento"("versaoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemOrcamento_versaoId_codigo_key" ON "ItemOrcamento"("versaoId", "codigo");

-- CreateIndex
CREATE INDEX "VersaoCustoOrcado_obraId_status_idx" ON "VersaoCustoOrcado"("obraId", "status");

-- CreateIndex
CREATE INDEX "VersaoCustoOrcado_versaoContratualId_idx" ON "VersaoCustoOrcado"("versaoContratualId");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoCustoOrcado_obraId_numero_key" ON "VersaoCustoOrcado"("obraId", "numero");

-- CreateIndex
CREATE INDEX "ItemCustoOrcado_versaoCustoOrcadoId_idx" ON "ItemCustoOrcado"("versaoCustoOrcadoId");

-- CreateIndex
CREATE INDEX "ItemCustoOrcado_versaoCustoOrcadoId_nivel_idx" ON "ItemCustoOrcado"("versaoCustoOrcadoId", "nivel");

-- CreateIndex
CREATE INDEX "ItemCustoOrcado_versaoCustoOrcadoId_parentId_idx" ON "ItemCustoOrcado"("versaoCustoOrcadoId", "parentId");

-- CreateIndex
CREATE INDEX "ItemCustoOrcado_versaoCustoOrcadoId_tipo_idx" ON "ItemCustoOrcado"("versaoCustoOrcadoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCustoOrcado_versaoCustoOrcadoId_codigo_key" ON "ItemCustoOrcado"("versaoCustoOrcadoId", "codigo");

-- CreateIndex
CREATE INDEX "VersaoCategorizacao_obraId_status_idx" ON "VersaoCategorizacao"("obraId", "status");

-- CreateIndex
CREATE INDEX "VersaoCategorizacao_versaoContratualId_idx" ON "VersaoCategorizacao"("versaoContratualId");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoCategorizacao_obraId_numero_key" ON "VersaoCategorizacao"("obraId", "numero");

-- CreateIndex
CREATE INDEX "ItemCategorizacao_versaoCategorizacaoId_idx" ON "ItemCategorizacao"("versaoCategorizacaoId");

-- CreateIndex
CREATE INDEX "ItemCategorizacao_versaoCategorizacaoId_nivel_idx" ON "ItemCategorizacao"("versaoCategorizacaoId", "nivel");

-- CreateIndex
CREATE INDEX "ItemCategorizacao_versaoCategorizacaoId_parentId_idx" ON "ItemCategorizacao"("versaoCategorizacaoId", "parentId");

-- CreateIndex
CREATE INDEX "ItemCategorizacao_versaoCategorizacaoId_tipo_idx" ON "ItemCategorizacao"("versaoCategorizacaoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategorizacao_versaoCategorizacaoId_codigo_key" ON "ItemCategorizacao"("versaoCategorizacaoId", "codigo");

-- CreateIndex
CREATE INDEX "VersaoVisaoGerencial_obraId_status_idx" ON "VersaoVisaoGerencial"("obraId", "status");

-- CreateIndex
CREATE INDEX "VersaoVisaoGerencial_versaoCustoOrcadoId_idx" ON "VersaoVisaoGerencial"("versaoCustoOrcadoId");

-- CreateIndex
CREATE INDEX "VersaoVisaoGerencial_versaoCategorizacaoId_idx" ON "VersaoVisaoGerencial"("versaoCategorizacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoVisaoGerencial_obraId_numero_key" ON "VersaoVisaoGerencial"("obraId", "numero");

-- CreateIndex
CREATE INDEX "ItemVisaoGerencial_versaoVisaoGerencialId_idx" ON "ItemVisaoGerencial"("versaoVisaoGerencialId");

-- CreateIndex
CREATE INDEX "ItemVisaoGerencial_versaoVisaoGerencialId_nivel_idx" ON "ItemVisaoGerencial"("versaoVisaoGerencialId", "nivel");

-- CreateIndex
CREATE INDEX "ItemVisaoGerencial_versaoVisaoGerencialId_parentId_idx" ON "ItemVisaoGerencial"("versaoVisaoGerencialId", "parentId");

-- CreateIndex
CREATE INDEX "ItemVisaoGerencial_versaoVisaoGerencialId_tipo_idx" ON "ItemVisaoGerencial"("versaoVisaoGerencialId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVisaoGerencial_versaoVisaoGerencialId_codigo_key" ON "ItemVisaoGerencial"("versaoVisaoGerencialId", "codigo");

-- CreateIndex
CREATE INDEX "VinculoItemVisaoGerencial_itemVisaoGerencialId_idx" ON "VinculoItemVisaoGerencial"("itemVisaoGerencialId");

-- CreateIndex
CREATE INDEX "VinculoItemVisaoGerencial_itemCustoOrcadoId_idx" ON "VinculoItemVisaoGerencial"("itemCustoOrcadoId");

-- CreateIndex
CREATE UNIQUE INDEX "VinculoItemVisaoGerencial_itemVisaoGerencialId_itemCustoOrc_key" ON "VinculoItemVisaoGerencial"("itemVisaoGerencialId", "itemCustoOrcadoId");

-- CreateIndex
CREATE INDEX "PlantaBaixa_obraId_idx" ON "PlantaBaixa"("obraId");

-- CreateIndex
CREATE INDEX "PlantaBaixa_setorPaiId_idx" ON "PlantaBaixa"("setorPaiId");

-- CreateIndex
CREATE INDEX "Setor_plantaBaixaId_idx" ON "Setor"("plantaBaixaId");

-- CreateIndex
CREATE INDEX "PontoMonitoramento_plantaBaixaId_idx" ON "PontoMonitoramento"("plantaBaixaId");

-- CreateIndex
CREATE INDEX "PontoMonitoramento_status_idx" ON "PontoMonitoramento"("status");

-- CreateIndex
CREATE INDEX "Foto360_pontoMonitoramentoId_idx" ON "Foto360"("pontoMonitoramentoId");

-- CreateIndex
CREATE INDEX "Foto360_dataCaptura_idx" ON "Foto360"("dataCaptura");

-- CreateIndex
CREATE UNIQUE INDEX "Etapa_nome_key" ON "Etapa"("nome");

-- CreateIndex
CREATE INDEX "Etapa_ativo_idx" ON "Etapa"("ativo");

-- CreateIndex
CREATE INDEX "Etapa_ordem_idx" ON "Etapa"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "SubEtapa_nome_key" ON "SubEtapa"("nome");

-- CreateIndex
CREATE INDEX "SubEtapa_ativo_idx" ON "SubEtapa"("ativo");

-- CreateIndex
CREATE INDEX "SubEtapa_ordem_idx" ON "SubEtapa"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "ServicoSimplificado_nome_key" ON "ServicoSimplificado"("nome");

-- CreateIndex
CREATE INDEX "ServicoSimplificado_ativo_idx" ON "ServicoSimplificado"("ativo");

-- CreateIndex
CREATE INDEX "ServicoSimplificado_ordem_idx" ON "ServicoSimplificado"("ordem");

-- CreateIndex
CREATE INDEX "PrevisaoMedicao_obraId_idx" ON "PrevisaoMedicao"("obraId");

-- CreateIndex
CREATE INDEX "PrevisaoMedicao_obraId_status_idx" ON "PrevisaoMedicao"("obraId", "status");

-- CreateIndex
CREATE INDEX "PrevisaoMedicao_dataPrevisao_idx" ON "PrevisaoMedicao"("dataPrevisao");

-- CreateIndex
CREATE UNIQUE INDEX "PrevisaoMedicao_obraId_numero_key" ON "PrevisaoMedicao"("obraId", "numero");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_previsaoMedicaoId_idx" ON "ItemPrevisaoMedicao"("previsaoMedicaoId");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_numeroMedicao_idx" ON "ItemPrevisaoMedicao"("numeroMedicao");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_itemOrcamentoId_idx" ON "ItemPrevisaoMedicao"("itemOrcamentoId");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_itemCustoOrcadoId_idx" ON "ItemPrevisaoMedicao"("itemCustoOrcadoId");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_itemCategorizacaoId_idx" ON "ItemPrevisaoMedicao"("itemCategorizacaoId");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_itemVisaoGerencialId_idx" ON "ItemPrevisaoMedicao"("itemVisaoGerencialId");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_etapa_idx" ON "ItemPrevisaoMedicao"("etapa");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_subEtapa_idx" ON "ItemPrevisaoMedicao"("subEtapa");

-- CreateIndex
CREATE INDEX "ItemPrevisaoMedicao_servicoSimplificado_idx" ON "ItemPrevisaoMedicao"("servicoSimplificado");

-- CreateIndex
CREATE INDEX "HistoricoVersaoMedicao_obraId_idx" ON "HistoricoVersaoMedicao"("obraId");

-- CreateIndex
CREATE INDEX "HistoricoVersaoMedicao_versaoAnteriorId_idx" ON "HistoricoVersaoMedicao"("versaoAnteriorId");

-- CreateIndex
CREATE INDEX "HistoricoVersaoMedicao_versaoNovaId_idx" ON "HistoricoVersaoMedicao"("versaoNovaId");

-- CreateIndex
CREATE INDEX "MapeamentoItemVersao_obraId_idx" ON "MapeamentoItemVersao"("obraId");

-- CreateIndex
CREATE INDEX "MapeamentoItemVersao_versaoAnteriorId_idx" ON "MapeamentoItemVersao"("versaoAnteriorId");

-- CreateIndex
CREATE INDEX "MapeamentoItemVersao_versaoNovaId_idx" ON "MapeamentoItemVersao"("versaoNovaId");

-- CreateIndex
CREATE INDEX "MapeamentoItemVersao_codigo_idx" ON "MapeamentoItemVersao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "MapeamentoItemVersao_versaoAnteriorId_versaoNovaId_codigo_key" ON "MapeamentoItemVersao"("versaoAnteriorId", "versaoNovaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Credor_codigo_key" ON "Credor"("codigo");

-- CreateIndex
CREATE INDEX "Credor_construtoraId_idx" ON "Credor"("construtoraId");

-- CreateIndex
CREATE INDEX "Credor_construtoraId_tipo_idx" ON "Credor"("construtoraId", "tipo");

-- CreateIndex
CREATE INDEX "Credor_construtoraId_status_idx" ON "Credor"("construtoraId", "status");

-- CreateIndex
CREATE INDEX "Credor_cpfCnpj_idx" ON "Credor"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Credor_construtoraId_cpfCnpj_key" ON "Credor"("construtoraId", "cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_codigo_key" ON "ContaBancaria"("codigo");

-- CreateIndex
CREATE INDEX "ContaBancaria_construtoraId_idx" ON "ContaBancaria"("construtoraId");

-- CreateIndex
CREATE INDEX "ContaBancaria_construtoraId_status_idx" ON "ContaBancaria"("construtoraId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_construtoraId_banco_agencia_conta_key" ON "ContaBancaria"("construtoraId", "banco", "agencia", "conta");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoContas_codigo_key" ON "PlanoContas"("codigo");

-- CreateIndex
CREATE INDEX "PlanoContas_construtoraId_idx" ON "PlanoContas"("construtoraId");

-- CreateIndex
CREATE INDEX "PlanoContas_construtoraId_isPadrao_idx" ON "PlanoContas"("construtoraId", "isPadrao");

-- CreateIndex
CREATE INDEX "PlanoContas_construtoraId_status_idx" ON "PlanoContas"("construtoraId", "status");

-- CreateIndex
CREATE INDEX "ContaContabil_planoContasId_idx" ON "ContaContabil"("planoContasId");

-- CreateIndex
CREATE INDEX "ContaContabil_planoContasId_nivel_idx" ON "ContaContabil"("planoContasId", "nivel");

-- CreateIndex
CREATE INDEX "ContaContabil_planoContasId_parentId_idx" ON "ContaContabil"("planoContasId", "parentId");

-- CreateIndex
CREATE INDEX "ContaContabil_planoContasId_tipo_idx" ON "ContaContabil"("planoContasId", "tipo");

-- CreateIndex
CREATE INDEX "ContaContabil_planoContasId_categoriaDRE_idx" ON "ContaContabil"("planoContasId", "categoriaDRE");

-- CreateIndex
CREATE UNIQUE INDEX "ContaContabil_planoContasId_codigo_key" ON "ContaContabil"("planoContasId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_codigo_key" ON "CentroCusto"("codigo");

-- CreateIndex
CREATE INDEX "CentroCusto_construtoraId_idx" ON "CentroCusto"("construtoraId");

-- CreateIndex
CREATE INDEX "CentroCusto_construtoraId_status_idx" ON "CentroCusto"("construtoraId", "status");

-- CreateIndex
CREATE INDEX "CentroCusto_parentId_idx" ON "CentroCusto"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_construtoraId_codigo_key" ON "CentroCusto"("construtoraId", "codigo");

-- AddForeignKey
ALTER TABLE "Medicao" ADD CONSTRAINT "Medicao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_contratanteId_fkey" FOREIGN KEY ("contratanteId") REFERENCES "Contratante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obra" ADD CONSTRAINT "Obra_fonteRecursoId_fkey" FOREIGN KEY ("fonteRecursoId") REFERENCES "FonteRecurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aditivo" ADD CONSTRAINT "Aditivo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reajuste" ADD CONSTRAINT "Reajuste_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empenho" ADD CONSTRAINT "Empenho_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoFundo" ADD CONSTRAINT "VinculoFundo_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoFundo" ADD CONSTRAINT "VinculoFundo_fundoId_fkey" FOREIGN KEY ("fundoId") REFERENCES "Fundo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoFiador" ADD CONSTRAINT "VinculoFiador_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoFiador" ADD CONSTRAINT "VinculoFiador_fiadorId_fkey" FOREIGN KEY ("fiadorId") REFERENCES "Fiador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoBemGarantia" ADD CONSTRAINT "VinculoBemGarantia_vinculoFiadorId_fkey" FOREIGN KEY ("vinculoFiadorId") REFERENCES "VinculoFiador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoBemGarantia" ADD CONSTRAINT "VinculoBemGarantia_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_medicaoId_fkey" FOREIGN KEY ("medicaoId") REFERENCES "Medicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bem" ADD CONSTRAINT "Bem_fiadorId_fkey" FOREIGN KEY ("fiadorId") REFERENCES "Fiador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_fundoId_fkey" FOREIGN KEY ("fundoId") REFERENCES "Fundo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_fiadorId_fkey" FOREIGN KEY ("fiadorId") REFERENCES "Fiador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_contratanteId_fkey" FOREIGN KEY ("contratanteId") REFERENCES "Contratante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_bemId_fkey" FOREIGN KEY ("bemId") REFERENCES "Bem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_aditivoId_fkey" FOREIGN KEY ("aditivoId") REFERENCES "Aditivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_reajusteId_fkey" FOREIGN KEY ("reajusteId") REFERENCES "Reajuste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_empenhoId_fkey" FOREIGN KEY ("empenhoId") REFERENCES "Empenho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoOrcamento" ADD CONSTRAINT "VersaoOrcamento_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_versaoId_fkey" FOREIGN KEY ("versaoId") REFERENCES "VersaoOrcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoCustoOrcado" ADD CONSTRAINT "VersaoCustoOrcado_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoCustoOrcado" ADD CONSTRAINT "VersaoCustoOrcado_versaoContratualId_fkey" FOREIGN KEY ("versaoContratualId") REFERENCES "VersaoOrcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCustoOrcado" ADD CONSTRAINT "ItemCustoOrcado_versaoCustoOrcadoId_fkey" FOREIGN KEY ("versaoCustoOrcadoId") REFERENCES "VersaoCustoOrcado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoCategorizacao" ADD CONSTRAINT "VersaoCategorizacao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoCategorizacao" ADD CONSTRAINT "VersaoCategorizacao_versaoContratualId_fkey" FOREIGN KEY ("versaoContratualId") REFERENCES "VersaoOrcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCategorizacao" ADD CONSTRAINT "ItemCategorizacao_versaoCategorizacaoId_fkey" FOREIGN KEY ("versaoCategorizacaoId") REFERENCES "VersaoCategorizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoVisaoGerencial" ADD CONSTRAINT "VersaoVisaoGerencial_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoVisaoGerencial" ADD CONSTRAINT "VersaoVisaoGerencial_versaoCustoOrcadoId_fkey" FOREIGN KEY ("versaoCustoOrcadoId") REFERENCES "VersaoCustoOrcado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VersaoVisaoGerencial" ADD CONSTRAINT "VersaoVisaoGerencial_versaoCategorizacaoId_fkey" FOREIGN KEY ("versaoCategorizacaoId") REFERENCES "VersaoCategorizacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVisaoGerencial" ADD CONSTRAINT "ItemVisaoGerencial_versaoVisaoGerencialId_fkey" FOREIGN KEY ("versaoVisaoGerencialId") REFERENCES "VersaoVisaoGerencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoItemVisaoGerencial" ADD CONSTRAINT "VinculoItemVisaoGerencial_itemVisaoGerencialId_fkey" FOREIGN KEY ("itemVisaoGerencialId") REFERENCES "ItemVisaoGerencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VinculoItemVisaoGerencial" ADD CONSTRAINT "VinculoItemVisaoGerencial_itemCustoOrcadoId_fkey" FOREIGN KEY ("itemCustoOrcadoId") REFERENCES "ItemCustoOrcado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantaBaixa" ADD CONSTRAINT "PlantaBaixa_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantaBaixa" ADD CONSTRAINT "PlantaBaixa_setorPaiId_fkey" FOREIGN KEY ("setorPaiId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setor" ADD CONSTRAINT "Setor_plantaBaixaId_fkey" FOREIGN KEY ("plantaBaixaId") REFERENCES "PlantaBaixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PontoMonitoramento" ADD CONSTRAINT "PontoMonitoramento_plantaBaixaId_fkey" FOREIGN KEY ("plantaBaixaId") REFERENCES "PlantaBaixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto360" ADD CONSTRAINT "Foto360_pontoMonitoramentoId_fkey" FOREIGN KEY ("pontoMonitoramentoId") REFERENCES "PontoMonitoramento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrevisaoMedicao" ADD CONSTRAINT "PrevisaoMedicao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrevisaoMedicao" ADD CONSTRAINT "PrevisaoMedicao_versaoReferenciaId_fkey" FOREIGN KEY ("versaoReferenciaId") REFERENCES "VersaoOrcamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPrevisaoMedicao" ADD CONSTRAINT "ItemPrevisaoMedicao_previsaoMedicaoId_fkey" FOREIGN KEY ("previsaoMedicaoId") REFERENCES "PrevisaoMedicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoVersaoMedicao" ADD CONSTRAINT "HistoricoVersaoMedicao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoVersaoMedicao" ADD CONSTRAINT "HistoricoVersaoMedicao_versaoAnteriorId_fkey" FOREIGN KEY ("versaoAnteriorId") REFERENCES "VersaoOrcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoVersaoMedicao" ADD CONSTRAINT "HistoricoVersaoMedicao_versaoNovaId_fkey" FOREIGN KEY ("versaoNovaId") REFERENCES "VersaoOrcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapeamentoItemVersao" ADD CONSTRAINT "MapeamentoItemVersao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credor" ADD CONSTRAINT "Credor_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancaria" ADD CONSTRAINT "ContaBancaria_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoContas" ADD CONSTRAINT "PlanoContas_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaContabil" ADD CONSTRAINT "ContaContabil_planoContasId_fkey" FOREIGN KEY ("planoContasId") REFERENCES "PlanoContas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CentroCusto" ADD CONSTRAINT "CentroCusto_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;
