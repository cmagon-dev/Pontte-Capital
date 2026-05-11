-- CreateEnum
CREATE TYPE "TipoOperacao" AS ENUM ('A_PERFORMAR', 'PERFORMADA', 'SALDO_PERFORMADO');

-- CreateEnum
CREATE TYPE "TipoLancamentoSaldoPerformado" AS ENUM ('CREDITO', 'DEBITO', 'AJUSTE_CREDITO', 'AJUSTE_DEBITO');

-- CreateEnum
CREATE TYPE "StatusWorkflowOperacao" AS ENUM ('EM_EDICAO', 'FINALIZADA', 'EM_APROVACAO', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "StatusFinanceiroOperacao" AS ENUM ('ABERTO', 'VENCIDO', 'LIQUIDADO');

-- CreateEnum
CREATE TYPE "PapelAprovacaoOperacao" AS ENUM ('FUNDO', 'FIADOR');

-- CreateEnum
CREATE TYPE "StatusAprovacaoPapel" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "TipoPagamentoOrdem" AS ENUM ('PIX', 'TED', 'BOLETO', 'CARTAO');

-- CreateEnum
CREATE TYPE "TipoDocumentoOrdem" AS ENUM ('NOTA_FISCAL', 'PEDIDO_COMPRA', 'CONTRATO', 'RECIBO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoCustoApropriacao" AS ENUM ('DIRETO', 'INDIRETO');

-- CreateEnum
CREATE TYPE "SubcategoriaCustoDireto" AS ENUM ('MATERIAL', 'MAO_OBRA_SUB', 'CONTRATOS', 'EQUIP_FRETE');

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
    "bdi" DECIMAL(5,2),
    "encargos" DECIMAL(5,2),
    "indiceReajuste" TEXT,
    "periodicidadeMedicao" INTEGER,
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
    "obraId" TEXT NOT NULL,
    "medicaoId" TEXT,
    "tipo" "TipoOperacao" NOT NULL,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFinalizacao" TIMESTAMP(3),
    "dataAprovacao" TIMESTAMP(3),
    "dataRejeicao" TIMESTAMP(3),
    "dataPagamentoPrevista" TIMESTAMP(3),
    "dataPagamentoEfetiva" TIMESTAMP(3),
    "valorTotalOrdens" DECIMAL(18,2) NOT NULL,
    "taxaJurosMensal" DECIMAL(10,4) NOT NULL,
    "taxaAdministrativa" DECIMAL(10,4) NOT NULL,
    "jurosProjetados" DECIMAL(18,2) NOT NULL,
    "taxasAdministrativas" DECIMAL(18,2) NOT NULL,
    "valorDesagio" DECIMAL(18,2) NOT NULL,
    "valorBruto" DECIMAL(18,2) NOT NULL,
    "percentualDesagio" DECIMAL(5,2) NOT NULL,
    "statusWorkflow" "StatusWorkflowOperacao" NOT NULL DEFAULT 'EM_EDICAO',
    "statusFinanceiro" "StatusFinanceiroOperacao" NOT NULL DEFAULT 'ABERTO',
    "exigeAprovacaoFiador" BOOLEAN NOT NULL DEFAULT false,
    "aprovacaoFundoStatus" "StatusAprovacaoPapel" NOT NULL DEFAULT 'PENDENTE',
    "aprovacaoFiadorStatus" "StatusAprovacaoPapel" NOT NULL DEFAULT 'PENDENTE',
    "aprovacaoFundoData" TIMESTAMP(3),
    "aprovacaoFiadorData" TIMESTAMP(3),
    "aprovacaoFundoMotivo" TEXT,
    "aprovacaoFiadorMotivo" TEXT,
    "aprovacaoFundoPorId" TEXT,
    "aprovacaoFiadorPorId" TEXT,
    "aprovadorId" TEXT,
    "motivoRejeicao" TEXT,
    "operacoesRecompradas" JSONB,
    "valorRecomprado" DECIMAL(18,2),
    "statusRecompra" TEXT,
    "saldoPerformadoConsumido" DECIMAL(18,2),
    "nfNumero" TEXT,
    "nfDataEmissao" TIMESTAMP(3),
    "nfValorBruto" DECIMAL(18,2),
    "nfRetencoes" DECIMAL(18,2),
    "previsaoMedicaoId" TEXT,
    "nfReferencia" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operacao_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "OperacaoAprovacaoHistorico" (
    "id" TEXT NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "papel" "PapelAprovacaoOperacao" NOT NULL,
    "decisao" "StatusAprovacaoPapel" NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperacaoAprovacaoHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemPagamento" (
    "id" TEXT NOT NULL,
    "operacaoId" TEXT NOT NULL,
    "credorId" TEXT,
    "tipoDocumento" "TipoDocumentoOrdem" NOT NULL DEFAULT 'OUTRO',
    "tipoDocumentoNome" TEXT,
    "numeroDocumento" TEXT NOT NULL,
    "valorTotal" DECIMAL(18,2) NOT NULL,
    "tipoPagamento" "TipoPagamentoOrdem" NOT NULL,
    "codigoBarras" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecompraOperacao" (
    "id" TEXT NOT NULL,
    "operacaoPerformadaId" TEXT NOT NULL,
    "operacaoAPerformarId" TEXT NOT NULL,
    "valorRecomprado" DECIMAL(18,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecompraOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApropriacaoOrcamentaria" (
    "id" TEXT NOT NULL,
    "ordemPagamentoId" TEXT NOT NULL,
    "itemVisaoGerencialId" TEXT,
    "subEtapaCodigo" TEXT NOT NULL,
    "subEtapaDescricao" TEXT NOT NULL,
    "etapaNome" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "percentualComprado" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tipoCusto" "TipoCustoApropriacao" NOT NULL DEFAULT 'DIRETO',
    "subcategoriaDireta" "SubcategoriaCustoDireto",
    "itemCustoIndiretoId" TEXT,

    CONSTRAINT "ApropriacaoOrcamentaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemCustoIndireto" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCustoIndireto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoOrdem" (
    "id" TEXT NOT NULL,
    "ordemPagamentoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tipoArquivo" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoOrdem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoTaxas" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "taxaJurosMensal" DECIMAL(10,4) NOT NULL,
    "taxaAdministrativa" DECIMAL(10,4) NOT NULL,
    "tipoTaxaAdministrativa" TEXT NOT NULL DEFAULT 'PERCENTUAL',
    "limiteAPerformarMensal" DECIMAL(18,2),
    "limitePerformadaMensal" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoTaxas_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "TipoDocumento" (
    "id" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoDocumento_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "perfis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tipoEscopo" TEXT NOT NULL DEFAULT 'GLOBAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_permissoes" (
    "perfilId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,

    CONSTRAINT "perfis_permissoes_pkey" PRIMARY KEY ("perfilId","permissaoId")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "perfilId" TEXT NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_fundos" (
    "usuarioId" TEXT NOT NULL,
    "fundoId" TEXT NOT NULL,

    CONSTRAINT "usuarios_fundos_pkey" PRIMARY KEY ("usuarioId","fundoId")
);

-- CreateTable
CREATE TABLE "usuarios_construtoras" (
    "usuarioId" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,

    CONSTRAINT "usuarios_construtoras_pkey" PRIMARY KEY ("usuarioId","construtoraId")
);

-- CreateTable
CREATE TABLE "usuarios_fiadores_construtoras" (
    "usuarioId" TEXT NOT NULL,
    "construtoraId" TEXT NOT NULL,

    CONSTRAINT "usuarios_fiadores_construtoras_pkey" PRIMARY KEY ("usuarioId","construtoraId")
);

-- CreateTable
CREATE TABLE "usuarios_fiadores_obras" (
    "usuarioId" TEXT NOT NULL,
    "obraId" TEXT NOT NULL,

    CONSTRAINT "usuarios_fiadores_obras_pkey" PRIMARY KEY ("usuarioId","obraId")
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
CREATE INDEX "Operacao_construtoraId_idx" ON "Operacao"("construtoraId");

-- CreateIndex
CREATE INDEX "Operacao_obraId_idx" ON "Operacao"("obraId");

-- CreateIndex
CREATE INDEX "Operacao_statusWorkflow_idx" ON "Operacao"("statusWorkflow");

-- CreateIndex
CREATE INDEX "Operacao_statusFinanceiro_idx" ON "Operacao"("statusFinanceiro");

-- CreateIndex
CREATE INDEX "Operacao_tipo_idx" ON "Operacao"("tipo");

-- CreateIndex
CREATE INDEX "Operacao_aprovacaoFundoStatus_idx" ON "Operacao"("aprovacaoFundoStatus");

-- CreateIndex
CREATE INDEX "Operacao_aprovacaoFiadorStatus_idx" ON "Operacao"("aprovacaoFiadorStatus");

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
CREATE UNIQUE INDEX "SaldoPerformadoAlocacao_lancamentoCreditoId_lancamentoDebit_key" ON "SaldoPerformadoAlocacao"("lancamentoCreditoId", "lancamentoDebitoId");

-- CreateIndex
CREATE INDEX "OperacaoAprovacaoHistorico_operacaoId_createdAt_idx" ON "OperacaoAprovacaoHistorico"("operacaoId", "createdAt");

-- CreateIndex
CREATE INDEX "OperacaoAprovacaoHistorico_usuarioId_idx" ON "OperacaoAprovacaoHistorico"("usuarioId");

-- CreateIndex
CREATE INDEX "OrdemPagamento_operacaoId_idx" ON "OrdemPagamento"("operacaoId");

-- CreateIndex
CREATE INDEX "OrdemPagamento_credorId_idx" ON "OrdemPagamento"("credorId");

-- CreateIndex
CREATE INDEX "RecompraOperacao_operacaoPerformadaId_idx" ON "RecompraOperacao"("operacaoPerformadaId");

-- CreateIndex
CREATE INDEX "RecompraOperacao_operacaoAPerformarId_idx" ON "RecompraOperacao"("operacaoAPerformarId");

-- CreateIndex
CREATE INDEX "ApropriacaoOrcamentaria_ordemPagamentoId_idx" ON "ApropriacaoOrcamentaria"("ordemPagamentoId");

-- CreateIndex
CREATE INDEX "ApropriacaoOrcamentaria_itemCustoIndiretoId_idx" ON "ApropriacaoOrcamentaria"("itemCustoIndiretoId");

-- CreateIndex
CREATE INDEX "ItemCustoIndireto_construtoraId_idx" ON "ItemCustoIndireto"("construtoraId");

-- CreateIndex
CREATE INDEX "DocumentoOrdem_ordemPagamentoId_idx" ON "DocumentoOrdem"("ordemPagamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoTaxas_construtoraId_key" ON "ConfiguracaoTaxas"("construtoraId");

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
CREATE INDEX "TipoDocumento_construtoraId_idx" ON "TipoDocumento"("construtoraId");

-- CreateIndex
CREATE INDEX "TipoDocumento_construtoraId_ativo_idx" ON "TipoDocumento"("construtoraId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDocumento_construtoraId_nome_key" ON "TipoDocumento"("construtoraId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_codigo_key" ON "ContaBancaria"("codigo");

-- CreateIndex
CREATE INDEX "ContaBancaria_construtoraId_idx" ON "ContaBancaria"("construtoraId");

-- CreateIndex
CREATE INDEX "ContaBancaria_construtoraId_status_idx" ON "ContaBancaria"("construtoraId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContaBancaria_construtoraId_banco_agencia_conta_key" ON "ContaBancaria"("construtoraId", "banco", "agencia", "conta");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_chave_key" ON "permissoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

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
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_medicaoId_fkey" FOREIGN KEY ("medicaoId") REFERENCES "Medicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_previsaoMedicaoId_fkey" FOREIGN KEY ("previsaoMedicaoId") REFERENCES "PrevisaoMedicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_aprovacaoFundoPorId_fkey" FOREIGN KEY ("aprovacaoFundoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operacao" ADD CONSTRAINT "Operacao_aprovacaoFiadorPorId_fkey" FOREIGN KEY ("aprovacaoFiadorPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "OperacaoAprovacaoHistorico" ADD CONSTRAINT "OperacaoAprovacaoHistorico_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacaoAprovacaoHistorico" ADD CONSTRAINT "OperacaoAprovacaoHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPagamento" ADD CONSTRAINT "OrdemPagamento_operacaoId_fkey" FOREIGN KEY ("operacaoId") REFERENCES "Operacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPagamento" ADD CONSTRAINT "OrdemPagamento_credorId_fkey" FOREIGN KEY ("credorId") REFERENCES "Credor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompraOperacao" ADD CONSTRAINT "RecompraOperacao_operacaoPerformadaId_fkey" FOREIGN KEY ("operacaoPerformadaId") REFERENCES "Operacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompraOperacao" ADD CONSTRAINT "RecompraOperacao_operacaoAPerformarId_fkey" FOREIGN KEY ("operacaoAPerformarId") REFERENCES "Operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApropriacaoOrcamentaria" ADD CONSTRAINT "ApropriacaoOrcamentaria_ordemPagamentoId_fkey" FOREIGN KEY ("ordemPagamentoId") REFERENCES "OrdemPagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApropriacaoOrcamentaria" ADD CONSTRAINT "ApropriacaoOrcamentaria_itemVisaoGerencialId_fkey" FOREIGN KEY ("itemVisaoGerencialId") REFERENCES "ItemVisaoGerencial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApropriacaoOrcamentaria" ADD CONSTRAINT "ApropriacaoOrcamentaria_itemCustoIndiretoId_fkey" FOREIGN KEY ("itemCustoIndiretoId") REFERENCES "ItemCustoIndireto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCustoIndireto" ADD CONSTRAINT "ItemCustoIndireto_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoOrdem" ADD CONSTRAINT "DocumentoOrdem_ordemPagamentoId_fkey" FOREIGN KEY ("ordemPagamentoId") REFERENCES "OrdemPagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoTaxas" ADD CONSTRAINT "ConfiguracaoTaxas_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "TipoDocumento" ADD CONSTRAINT "TipoDocumento_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaBancaria" ADD CONSTRAINT "ContaBancaria_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_permissoes" ADD CONSTRAINT "perfis_permissoes_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfis_permissoes" ADD CONSTRAINT "perfis_permissoes_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fundos" ADD CONSTRAINT "usuarios_fundos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fundos" ADD CONSTRAINT "usuarios_fundos_fundoId_fkey" FOREIGN KEY ("fundoId") REFERENCES "Fundo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_construtoras" ADD CONSTRAINT "usuarios_construtoras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_construtoras" ADD CONSTRAINT "usuarios_construtoras_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fiadores_construtoras" ADD CONSTRAINT "usuarios_fiadores_construtoras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fiadores_construtoras" ADD CONSTRAINT "usuarios_fiadores_construtoras_construtoraId_fkey" FOREIGN KEY ("construtoraId") REFERENCES "Construtora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fiadores_obras" ADD CONSTRAINT "usuarios_fiadores_obras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_fiadores_obras" ADD CONSTRAINT "usuarios_fiadores_obras_obraId_fkey" FOREIGN KEY ("obraId") REFERENCES "Obra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
