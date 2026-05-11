'use server';

import { db as prisma } from '@/lib/db';
import { Prisma, TipoOperacao, StatusWorkflowOperacao, StatusFinanceiroOperacao, TipoLancamentoSaldoPerformado } from '@prisma/client';
import { buscarConfigTaxas } from './config-taxas';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcularEncargos(
  valorTotal: number,
  dataReferencia: Date,
  taxaJurosMensal: number,
  taxaAdministrativa: number,
  tipoTaxaAdministrativa: string
) {
  const hoje = new Date();
  const diasCorridos = Math.max(
    0,
    Math.ceil((dataReferencia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  );
  const jurosProjetados = valorTotal * taxaJurosMensal * (diasCorridos / 30);
  const taxasAdministrativas =
    tipoTaxaAdministrativa === 'PERCENTUAL'
      ? valorTotal * taxaAdministrativa
      : taxaAdministrativa;
  const valorDesagio = jurosProjetados + taxasAdministrativas;
  const valorBruto = valorTotal + valorDesagio;
  const percentualDesagio = valorTotal > 0 ? (valorDesagio / valorTotal) * 100 : 0;

  return { jurosProjetados, taxasAdministrativas, valorDesagio, valorBruto, percentualDesagio };
}

async function gerarCodigoOperacao(construtoraId: string): Promise<string> {
  const ano = new Date().getFullYear();
  const count = await prisma.operacao.count({
    where: { construtoraId },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `OP-${seq}/${ano}`;
}

type LedgerCreditoDisponivel = {
  id: string;
  codigoOrigem: string;
  valorDisponivel: number;
};
const STATUS_FINANCEIRO_ABERTOS: StatusFinanceiroOperacao[] = ['ABERTO', 'VENCIDO'];

async function sincronizarStatusFinanceiroPorVencimento(client: Prisma.TransactionClient | typeof prisma = prisma) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await client.operacao.updateMany({
    where: {
      statusWorkflow: 'APROVADA',
      statusFinanceiro: 'ABERTO',
      dataReferencia: { lt: hoje },
    },
    data: { statusFinanceiro: 'VENCIDO' },
  });

  await client.operacao.updateMany({
    where: {
      statusWorkflow: 'APROVADA',
      statusFinanceiro: 'VENCIDO',
      dataReferencia: { gte: hoje },
    },
    data: { statusFinanceiro: 'ABERTO' },
  });
}

async function calcularSaldoPerformadoDisponivel(
  tx: Prisma.TransactionClient,
  obraId: string
): Promise<number> {
  const lancamentos = await tx.saldoPerformadoLancamento.findMany({
    where: { obraId },
    select: { tipo: true, valor: true },
  });

  return lancamentos.reduce((saldo, lancamento) => {
    const valor = Number(lancamento.valor);
    if (lancamento.tipo === 'CREDITO' || lancamento.tipo === 'AJUSTE_CREDITO') return saldo + valor;
    return saldo - valor;
  }, 0);
}

async function registrarLancamentoSaldoPerformado(
  tx: Prisma.TransactionClient,
  data: {
    construtoraId: string;
    obraId: string;
    tipo: TipoLancamentoSaldoPerformado;
    valor: number;
    operacaoOrigemId?: string | null;
    operacaoDestinoId?: string | null;
    observacoes?: string | null;
  }
) {
  const saldoAtual = await calcularSaldoPerformadoDisponivel(tx, data.obraId);
  const proximoSaldo =
    data.tipo === 'CREDITO' || data.tipo === 'AJUSTE_CREDITO'
      ? saldoAtual + data.valor
      : saldoAtual - data.valor;

  return tx.saldoPerformadoLancamento.create({
    data: {
      construtoraId: data.construtoraId,
      obraId: data.obraId,
      tipo: data.tipo,
      valor: data.valor,
      saldoAposLancamento: proximoSaldo,
      operacaoOrigemId: data.operacaoOrigemId ?? null,
      operacaoDestinoId: data.operacaoDestinoId ?? null,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function listarCreditosDisponiveisSaldoPerformado(
  tx: Prisma.TransactionClient,
  obraId: string
): Promise<LedgerCreditoDisponivel[]> {
  const creditos = await tx.saldoPerformadoLancamento.findMany({
    where: {
      obraId,
      tipo: { in: ['CREDITO', 'AJUSTE_CREDITO'] },
    },
    select: {
      id: true,
      valor: true,
      operacaoOrigem: { select: { codigo: true } },
      alocacoesCredito: { select: { valorAlocado: true } },
      createdAt: true,
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return creditos
    .map((credito) => {
      const totalAlocado = credito.alocacoesCredito.reduce((sum, alocacao) => sum + Number(alocacao.valorAlocado), 0);
      const disponivel = Number(credito.valor) - totalAlocado;
      return {
        id: credito.id,
        codigoOrigem: credito.operacaoOrigem?.codigo ?? 'LEGADO',
        valorDisponivel: disponivel,
      };
    })
    .filter((credito) => credito.valorDisponivel > 0.0001);
}

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

export interface ApropriacaoOrcInput {
  subEtapaCodigo: string;
  subEtapaDescricao: string;
  etapaNome: string;
  percentual: number;
  valor: number;
  percentualComprado?: number;
  itemVisaoGerencialId?: string | null;
  tipoCusto: 'DIRETO' | 'INDIRETO';
  subcategoriaDireta?: string | null;
  itemCustoIndiretoId?: string | null;
}

export interface OrdemPagamentoInput {
  credorId: string;
  tipoDocumento: string;
  numeroDocumento: string;
  valorTotal: number;
  tipoPagamento: string;
  codigoBarras?: string;
  observacoes?: string;
  apropriacoesOrcamentarias: ApropriacaoOrcInput[];
}

export interface CriarOperacaoInput {
  construtoraId: string;
  obraId: string;
  tipo: TipoOperacao;
  dataReferencia: Date;
  ordens: OrdemPagamentoInput[];
  medicaoId?: string | null;
  observacoes?: string;
  operacoesRecompradas?: string[];
  saldoPerformadoConsumido?: number;
  nfNumero?: string;
}

export interface RecompraInput {
  operacaoAPerformarId: string;
  valorRecomprado: number;
}

export interface CriarOperacaoPerformadaInput {
  construtoraId: string;
  obraId: string;
  /** ID da PrevisaoMedicao do módulo de engenharia (null para reajuste/complemento) */
  previsaoMedicaoId?: string | null;
  /** Descrição da referência da NF quando for reajuste/complemento (sem medição) */
  nfReferencia?: string | null;
  nfNumero: string;
  nfDataEmissao?: Date | null;
  /** Valor bruto da NF (antes de retenções) */
  nfValorBruto: number;
  /** Retenções (ISS, IR, INSS, etc.) */
  nfRetencoes: number;
  /** Valor líquido = bruto - retenções — usado para cálculos de recompra e taxas */
  nfValor: number;
  dataReferencia: Date;
  recompras: RecompraInput[];
  observacoes?: string;
}

// ---------------------------------------------------------------------------
// Criar operação genérica
// ---------------------------------------------------------------------------

export async function criarOperacao(data: CriarOperacaoInput, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const config = await buscarConfigTaxas(data.construtoraId);
  const codigo = await gerarCodigoOperacao(data.construtoraId);

  const valorTotalOrdens = data.ordens.reduce((sum, o) => sum + o.valorTotal, 0);
  const saldoConsumido = data.saldoPerformadoConsumido ?? 0;
  const valorBaseEncargos = Math.max(0, valorTotalOrdens - saldoConsumido);
  const encargos = calcularEncargos(
    valorBaseEncargos,
    data.dataReferencia,
    config.taxaJurosMensal,
    config.taxaAdministrativa,
    config.tipoTaxaAdministrativa
  );

  const tipoDocMap: Record<string, string> = {
    NOTA_FISCAL: 'NOTA_FISCAL',
    PEDIDO_COMPRA: 'PEDIDO_COMPRA',
    CONTRATO: 'CONTRATO',
    RECIBO: 'RECIBO',
    OUTRO: 'OUTRO',
    'Nota Fiscal': 'NOTA_FISCAL',
    'Pedido de Compra': 'PEDIDO_COMPRA',
    'Contrato': 'CONTRATO',
    'Recibo': 'RECIBO',
  };

  const tipoPagMap: Record<string, string> = {
    PIX: 'PIX',
    TED: 'TED',
    BOLETO: 'BOLETO',
    CARTAO: 'CARTAO',
    Transferência: 'TED',
    Boleto: 'BOLETO',
    'Nota Fiscal': 'NOTA_FISCAL',
  };

  const operacao = await client.operacao.create({
    data: {
      codigo,
      construtoraId: data.construtoraId,
      obraId: data.obraId,
      medicaoId: data.medicaoId ?? null,
      tipo: data.tipo,
      dataReferencia: data.dataReferencia,
      valorTotalOrdens: valorTotalOrdens,
      taxaJurosMensal: config.taxaJurosMensal,
      taxaAdministrativa: config.taxaAdministrativa,
      jurosProjetados: encargos.jurosProjetados,
      taxasAdministrativas: encargos.taxasAdministrativas,
      valorDesagio: encargos.valorDesagio,
      valorBruto: encargos.valorBruto,
      percentualDesagio: encargos.percentualDesagio,
      observacoes: data.observacoes ?? null,
      operacoesRecompradas: data.operacoesRecompradas ?? undefined,
      saldoPerformadoConsumido: saldoConsumido > 0 ? saldoConsumido : null,
      nfNumero: data.nfNumero ?? null,
      ordens: {
        create: data.ordens.map((o) => ({
          credorId: o.credorId,
          tipoDocumento: (tipoDocMap[o.tipoDocumento] ?? 'OUTRO') as any,
          tipoDocumentoNome: (o.tipoDocumento || null) as any,
          numeroDocumento: o.numeroDocumento,
          valorTotal: o.valorTotal,
          tipoPagamento: (tipoPagMap[o.tipoPagamento] ?? 'PIX') as any,
          codigoBarras: o.codigoBarras ?? null,
          observacoes: o.observacoes ?? null,
          apropriacoesOrcamentarias: {
            create: o.apropriacoesOrcamentarias.map((ap) => ({
              subEtapaCodigo: ap.subEtapaCodigo,
              subEtapaDescricao: ap.subEtapaDescricao,
              etapaNome: ap.etapaNome,
              percentual: ap.percentual,
              valor: ap.valor,
              percentualComprado: ap.tipoCusto === 'DIRETO' ? (ap.percentualComprado ?? 0) : 0,
              itemVisaoGerencialId: ap.tipoCusto === 'DIRETO' ? (ap.itemVisaoGerencialId ?? null) : null,
              tipoCusto: ap.tipoCusto as any,
              subcategoriaDireta: ap.tipoCusto === 'DIRETO' ? (ap.subcategoriaDireta ?? null) : null,
              itemCustoIndiretoId: ap.tipoCusto === 'INDIRETO' ? (ap.itemCustoIndiretoId ?? null) : null,
            })),
          },
        })),
      },
    },
    include: { ordens: true },
  });

  return operacao;
}

export async function buscarSaldoPerformadoDisponivel(obraId: string): Promise<{
  total: number;
  operacoes: Array<{ id: string; valorDisponivel: number; codigo: string }>;
}> {
  return prisma.$transaction(async (tx) => {
    const creditos = await listarCreditosDisponiveisSaldoPerformado(tx, obraId);
    const total = creditos.reduce((sum, credito) => sum + credito.valorDisponivel, 0);
    return {
      total,
      operacoes: creditos.map((credito) => ({
        id: credito.id,
        codigo: credito.codigoOrigem,
        valorDisponivel: credito.valorDisponivel,
      })),
    };
  });
}

export async function buscarResumoCaixaSaldoPerformado(obraId: string) {
  return prisma.$transaction(async (tx) => {
    const saldoAtual = await calcularSaldoPerformadoDisponivel(tx, obraId);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const lancamentosMes = await tx.saldoPerformadoLancamento.findMany({
      where: { obraId, createdAt: { gte: inicioMes } },
      select: { tipo: true, valor: true },
    });

    const creditosMes = lancamentosMes
      .filter((item) => item.tipo === 'CREDITO' || item.tipo === 'AJUSTE_CREDITO')
      .reduce((sum, item) => sum + Number(item.valor), 0);

    const debitosMes = lancamentosMes
      .filter((item) => item.tipo === 'DEBITO' || item.tipo === 'AJUSTE_DEBITO')
      .reduce((sum, item) => sum + Number(item.valor), 0);

    return { saldoAtual, creditosMes, debitosMes };
  });
}

export async function listarExtratoCaixaSaldoPerformado(obraId: string) {
  const lancamentos = await prisma.saldoPerformadoLancamento.findMany({
    where: { obraId },
    include: {
      operacaoOrigem: { select: { id: true, codigo: true, tipo: true } },
      operacaoDestino: { select: { id: true, codigo: true, tipo: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return lancamentos.map((item) => ({
    ...item,
    descricao:
      item.tipo === 'CREDITO' || item.tipo === 'AJUSTE_CREDITO'
        ? `Sobra da operacao performada ${item.operacaoOrigem?.codigo ?? 'LEGADO'}`
        : `Consumido pela operacao a performar ${item.operacaoDestino?.codigo ?? 'LEGADO'}`,
  }));
}

export async function criarOperacaoAPerformar(data: Omit<CriarOperacaoInput, 'tipo'>) {
  return prisma.$transaction(async (tx) => {
    const creditosDisponiveis = await listarCreditosDisponiveisSaldoPerformado(tx, data.obraId);
    const saldoTotalDisponivel = creditosDisponiveis.reduce((sum, credito) => sum + credito.valorDisponivel, 0);
    const valorTotalOrdens = data.ordens.reduce((sum, o) => sum + o.valorTotal, 0);
    const saldoConsumido = Math.min(saldoTotalDisponivel, valorTotalOrdens);

    const operacao = await criarOperacao({
      ...data,
      tipo: 'A_PERFORMAR',
      saldoPerformadoConsumido: saldoConsumido > 0 ? saldoConsumido : undefined,
    }, tx);

    if (saldoConsumido <= 0) {
      return operacao;
    }

    const debito = await registrarLancamentoSaldoPerformado(tx, {
      construtoraId: data.construtoraId,
      obraId: data.obraId,
      tipo: 'DEBITO',
      valor: saldoConsumido,
      operacaoDestinoId: operacao.id,
      observacoes: `Consumo por operacao A_PERFORMAR ${operacao.codigo}`,
    });

    let restante = saldoConsumido;
    for (const credito of creditosDisponiveis) {
      if (restante <= 0) break;
      const valorAlocado = Math.min(restante, credito.valorDisponivel);
      if (valorAlocado <= 0) continue;
      await tx.saldoPerformadoAlocacao.create({
        data: {
          lancamentoCreditoId: credito.id,
          lancamentoDebitoId: debito.id,
          valorAlocado,
        },
      });
      restante -= valorAlocado;
    }

    return operacao;
  });
}

export async function criarOperacaoPerformada(input: CriarOperacaoPerformadaInput) {
  const totalRecomprado = input.recompras.reduce((sum, r) => sum + r.valorRecomprado, 0);
  const config = await buscarConfigTaxas(input.construtoraId);
  const codigo = await gerarCodigoOperacao(input.construtoraId);
  const encargos = calcularEncargos(
    input.nfValor,
    input.dataReferencia,
    config.taxaJurosMensal,
    config.taxaAdministrativa,
    config.tipoTaxaAdministrativa
  );
  const valorOperadoComEncargos = encargos.valorBruto;

  if (totalRecomprado > valorOperadoComEncargos) {
    throw new Error(
      `Total recomprado (${totalRecomprado}) excede o valor operado com encargos (${valorOperadoComEncargos}).`
    );
  }

  return prisma.$transaction(async (tx) => {
    const operacao = await tx.operacao.create({
      data: {
        codigo,
        construtoraId: input.construtoraId,
        obraId: input.obraId,
        previsaoMedicaoId: input.previsaoMedicaoId ?? null,
        nfReferencia: input.nfReferencia ?? null,
        tipo: 'PERFORMADA',
        dataReferencia: input.dataReferencia,
        nfNumero: input.nfNumero,
        nfDataEmissao: input.nfDataEmissao ?? null,
        nfValorBruto: input.nfValorBruto,
        nfRetencoes: input.nfRetencoes,
        valorTotalOrdens: input.nfValor,
        taxaJurosMensal: config.taxaJurosMensal,
        taxaAdministrativa: config.taxaAdministrativa,
        jurosProjetados: encargos.jurosProjetados,
        taxasAdministrativas: encargos.taxasAdministrativas,
        valorDesagio: encargos.valorDesagio,
        valorBruto: encargos.valorBruto,
        percentualDesagio: encargos.percentualDesagio,
        observacoes: input.observacoes ?? null,
        ordens: {
          create: [
            {
              credorId: null,
              tipoDocumento: 'NOTA_FISCAL',
              tipoDocumentoNome: 'NF de Medição',
              numeroDocumento: input.nfNumero,
              valorTotal: input.nfValor,
              tipoPagamento: 'PIX',
            },
          ],
        },
      },
      include: { ordens: true },
    });

    for (const recompra of input.recompras) {
      const opAPerformar = await tx.operacao.findUnique({
        where: { id: recompra.operacaoAPerformarId },
        select: { valorTotalOrdens: true, valorRecomprado: true },
      });
      if (!opAPerformar) continue;

      const novoRecomprado = Number(opAPerformar.valorRecomprado ?? 0) + recompra.valorRecomprado;
      const totalOp = Number(opAPerformar.valorTotalOrdens);
      const totalLiquidada = novoRecomprado >= totalOp;

      await tx.recompraOperacao.create({
        data: {
          operacaoPerformadaId: operacao.id,
          operacaoAPerformarId: recompra.operacaoAPerformarId,
          valorRecomprado: recompra.valorRecomprado,
          tipo: totalLiquidada ? 'TOTAL' : 'PARCIAL',
        },
      });

      await tx.operacao.update({
        where: { id: recompra.operacaoAPerformarId },
        data: {
          valorRecomprado: novoRecomprado,
          statusRecompra: totalLiquidada ? 'TOTAL' : 'PARCIAL',
        },
      });
    }

    const saldoResidual = valorOperadoComEncargos - totalRecomprado;
    if (saldoResidual > 0.005) {
      await registrarLancamentoSaldoPerformado(tx, {
        construtoraId: input.construtoraId,
        obraId: input.obraId,
        tipo: 'CREDITO',
        valor: saldoResidual,
        operacaoOrigemId: operacao.id,
        observacoes: `Sobra da operacao performada ${codigo} (NF ${input.nfNumero})`,
      });
    }

    return operacao;
  });
}

export async function criarOperacaoSaldoPerformado(data: Omit<CriarOperacaoInput, 'tipo'>) {
  return criarOperacao({ ...data, tipo: 'SALDO_PERFORMADO' });
}

export async function listarOperacoesAPerformarAbertas(obraId: string) {
  await sincronizarStatusFinanceiroPorVencimento();
  return prisma.operacao.findMany({
    where: {
      obraId,
      tipo: 'A_PERFORMAR',
      statusFinanceiro: { in: STATUS_FINANCEIRO_ABERTOS },
    },
    select: {
      id: true,
      codigo: true,
      dataReferencia: true,
      valorTotalOrdens: true,
      valorRecomprado: true,
      statusRecompra: true,
      statusWorkflow: true,
      ordens: {
        select: {
          id: true,
          numeroDocumento: true,
          valorTotal: true,
          tipoDocumentoNome: true,
          credor: { select: { id: true, nome: true } },
        },
      },
    },
    orderBy: { dataReferencia: 'asc' },
  });
}

// ---------------------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------------------

export interface FiltrosOperacoes {
  tipo?: TipoOperacao;
  statusWorkflow?: StatusWorkflowOperacao;
  statusFinanceiro?: StatusFinanceiroOperacao;
  obraId?: string;
}

export async function listarOperacoesPorConstrutora(
  construtoraId: string,
  filtros?: FiltrosOperacoes
) {
  await sincronizarStatusFinanceiroPorVencimento();
  return prisma.operacao.findMany({
    where: {
      construtoraId,
      ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros?.statusWorkflow ? { statusWorkflow: filtros.statusWorkflow } : {}),
      ...(filtros?.statusFinanceiro ? { statusFinanceiro: filtros.statusFinanceiro } : {}),
      ...(filtros?.obraId ? { obraId: filtros.obraId } : {}),
    },
    include: {
      ordens: {
        include: {
          credor: true,
          apropriacoesOrcamentarias: { include: { itemCustoIndireto: true } },
          documentos: true,
        },
      },
      obra: { select: { id: true, nome: true, codigo: true } },
      aprovador: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listarOperacoesPorObra(obraId: string, filtros?: FiltrosOperacoes) {
  await sincronizarStatusFinanceiroPorVencimento();
  return prisma.operacao.findMany({
    where: {
      obraId,
      ...(filtros?.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros?.statusWorkflow ? { statusWorkflow: filtros.statusWorkflow } : {}),
      ...(filtros?.statusFinanceiro ? { statusFinanceiro: filtros.statusFinanceiro } : {}),
    },
    include: {
      ordens: {
        include: { credor: true, apropriacoesOrcamentarias: { include: { itemCustoIndireto: true } } },
      },
      aprovador: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function buscarOperacaoPorId(id: string) {
  await sincronizarStatusFinanceiroPorVencimento();
  const operacao = await prisma.operacao.findUnique({
    where: { id },
    include: {
      ordens: {
        include: {
          credor: true,
          apropriacoesOrcamentarias: {
            include: {
              itemCustoIndireto: true,
              itemVisaoGerencial: {
                select: {
                  id: true,
                  codigo: true,
                  discriminacao: true,
                  nivel: true,
                  versaoVisaoGerencialId: true,
                },
              },
            },
          },
          documentos: {
            select: {
              id: true,
              nomeArquivo: true,
              caminhoArquivo: true,
              tipoArquivo: true,
              tamanhoBytes: true,
            },
          },
        },
      },
      obra: true,
      construtora: { select: { id: true, razaoSocial: true, cnpj: true } },
      aprovador: { select: { id: true, nome: true } },
    },
  });

  if (!operacao) return null;

  // Coleta as versões únicas referenciadas pelas apropriações
  const versoesIds = new Set<string>();
  for (const ordem of operacao.ordens) {
    for (const ap of ordem.apropriacoesOrcamentarias) {
      const item = ap.itemVisaoGerencial;
      if (item?.versaoVisaoGerencialId) {
        versoesIds.add(item.versaoVisaoGerencialId);
      }
    }
  }

  // Carrega todos os itens das versões referenciadas de uma vez (para traversal por parentId)
  const itensPorVersao = new Map<string, Map<string, { id: string; codigo: string; discriminacao: string; parentId: string | null }>>();
  for (const versaoId of versoesIds) {
    const itens = await prisma.itemVisaoGerencial.findMany({
      where: { versaoVisaoGerencialId: versaoId },
      select: { id: true, codigo: true, discriminacao: true, parentId: true },
    });
    const mapa = new Map(itens.map((i) => [i.id, i]));
    itensPorVersao.set(versaoId, mapa);
  }

  // Constrói a cadeia de ancestrais de um item usando parentId real
  function buildAncestorChain(
    itemId: string,
    versaoId: string
  ): Array<{ codigo: string; discriminacao: string }> {
    const mapa = itensPorVersao.get(versaoId);
    if (!mapa) return [];

    const chain: Array<{ codigo: string; discriminacao: string }> = [];
    let current = mapa.get(itemId);
    while (current?.parentId) {
      const parent = mapa.get(current.parentId);
      if (!parent) break;
      chain.unshift({ codigo: parent.codigo, discriminacao: parent.discriminacao });
      current = parent;
    }
    return chain;
  }

  // Enriquece cada apropriação com a lista real de ancestrais
  const ordensEnriquecidas = operacao.ordens.map((ordem) => ({
    ...ordem,
    apropriacoesOrcamentarias: ordem.apropriacoesOrcamentarias.map((ap) => {
      const item = ap.itemVisaoGerencial;
      if (!item) return { ...ap, ancestores: [] as Array<{ codigo: string; discriminacao: string }> };
      const ancestores = buildAncestorChain(item.id, item.versaoVisaoGerencialId);
      return { ...ap, ancestores };
    }),
  }));

  return { ...operacao, ordens: ordensEnriquecidas };
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

async function exigeAprovacaoFiadorPorOperacao(operacaoId: string): Promise<boolean> {
  const operacao = await prisma.operacao.findUnique({
    where: { id: operacaoId },
    select: {
      obra: {
        select: {
          vinculosFiadores: {
            select: {
              fiador: { select: { aprovadorFinanceiro: true } },
            },
          },
        },
      },
    },
  });

  if (!operacao) throw new Error('Operação não encontrada');
  return operacao.obra.vinculosFiadores.some((v) => v.fiador.aprovadorFinanceiro);
}

function resolverPapelAprovacao(
  permissoes: string[],
  operacao: { exigeAprovacaoFiador: boolean; aprovacaoFundoStatus: string; aprovacaoFiadorStatus: string }
): 'FUNDO' | 'FIADOR' {
  const podeFundo = permissoes.includes('aprovacoes:financeiro:aprovar');
  const podeFiador = permissoes.includes('aprovacoes:fiador:aprovar');

  if (!podeFundo && !podeFiador) {
    throw new Error('Sem permissão para aprovar operações');
  }

  if (podeFundo && operacao.aprovacaoFundoStatus === 'PENDENTE') return 'FUNDO';
  if (podeFiador && operacao.exigeAprovacaoFiador && operacao.aprovacaoFiadorStatus === 'PENDENTE') return 'FIADOR';
  if (podeFundo) return 'FUNDO';
  if (podeFiador) return 'FIADOR';

  throw new Error('Não há etapa pendente para este aprovador');
}

export async function aprovarOperacao(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Não autenticado');

  return prisma.$transaction(async (tx) => {
    const operacao = await tx.operacao.findUnique({
      where: { id },
      select: {
        id: true,
        tipo: true,
        statusWorkflow: true,
        exigeAprovacaoFiador: true,
        aprovacaoFundoStatus: true,
        aprovacaoFiadorStatus: true,
      },
    });

    if (!operacao || operacao.statusWorkflow !== 'EM_APROVACAO_FINANCEIRA') {
      throw new Error('Operação não está em aprovação financeira');
    }

    const papel = resolverPapelAprovacao(session.user.permissoes ?? [], operacao);

    if (papel === 'FUNDO' && operacao.aprovacaoFundoStatus !== 'PENDENTE') {
      throw new Error('Aprovação do fundo já foi processada');
    }
    if (papel === 'FIADOR' && operacao.aprovacaoFiadorStatus !== 'PENDENTE') {
      throw new Error('Aprovação do fiador já foi processada');
    }

    const dataAgora = new Date();
    const fundoStatus = papel === 'FUNDO' ? 'APROVADA' : operacao.aprovacaoFundoStatus;
    const fiadorStatus = papel === 'FIADOR' ? 'APROVADA' : operacao.aprovacaoFiadorStatus;
    const operacaoAprovada = fundoStatus === 'APROVADA' && (!operacao.exigeAprovacaoFiador || fiadorStatus === 'APROVADA');

    const atualizada = await tx.operacao.update({
      where: { id },
      data: {
        aprovacaoFundoStatus: fundoStatus,
        aprovacaoFiadorStatus: fiadorStatus,
        ...(papel === 'FUNDO'
          ? { aprovacaoFundoData: dataAgora, aprovacaoFundoPorId: session.user.id, aprovacaoFundoMotivo: null }
          : { aprovacaoFiadorData: dataAgora, aprovacaoFiadorPorId: session.user.id, aprovacaoFiadorMotivo: null }),
        statusWorkflow: operacaoAprovada ? 'APROVADA' : 'EM_APROVACAO_FINANCEIRA',
        dataAprovacao: operacaoAprovada ? dataAgora : null,
        aprovadorId: operacaoAprovada ? session.user.id : null,
      },
    });

    await tx.operacaoAprovacaoHistorico.create({
      data: {
        operacaoId: id,
        usuarioId: session.user.id,
        papel,
        decisao: 'APROVADA',
      },
    });

    if (operacaoAprovada && operacao.tipo === 'PERFORMADA') {
      const recompras = await tx.recompraOperacao.findMany({
        where: { operacaoPerformadaId: id },
        select: { operacaoAPerformarId: true },
      });
      if (recompras.length > 0) {
        await tx.operacao.updateMany({
          where: {
            id: { in: recompras.map((r) => r.operacaoAPerformarId) },
            statusRecompra: 'TOTAL',
          },
          data: { statusFinanceiro: 'LIQUIDADO' },
        });
      }
    }

    return atualizada;
  });
}

export async function rejeitarOperacao(id: string, motivo: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error('Não autenticado');

  return prisma.$transaction(async (tx) => {
    const operacao = await tx.operacao.findUnique({
      where: { id },
      select: {
        id: true,
        statusWorkflow: true,
        exigeAprovacaoFiador: true,
        aprovacaoFundoStatus: true,
        aprovacaoFiadorStatus: true,
      },
    });

    if (!operacao || operacao.statusWorkflow !== 'EM_APROVACAO_FINANCEIRA') {
      throw new Error('Operação não está em aprovação financeira');
    }

    const papel = resolverPapelAprovacao(session.user.permissoes ?? [], operacao);
    const dataAgora = new Date();

    const atualizada = await tx.operacao.update({
      where: { id },
      data: {
        statusWorkflow: 'REJEITADA',
        dataRejeicao: dataAgora,
        aprovadorId: session.user.id,
        motivoRejeicao: motivo,
        ...(papel === 'FUNDO'
          ? {
              aprovacaoFundoStatus: 'REJEITADA',
              aprovacaoFundoData: dataAgora,
              aprovacaoFundoPorId: session.user.id,
              aprovacaoFundoMotivo: motivo,
            }
          : {
              aprovacaoFiadorStatus: 'REJEITADA',
              aprovacaoFiadorData: dataAgora,
              aprovacaoFiadorPorId: session.user.id,
              aprovacaoFiadorMotivo: motivo,
            }),
      },
    });

    await tx.operacaoAprovacaoHistorico.create({
      data: {
        operacaoId: id,
        usuarioId: session.user.id,
        papel,
        decisao: 'REJEITADA',
        motivo,
      },
    });

    return atualizada;
  });
}

export async function liquidarOperacao(id: string, dataPagamento: Date) {
  await prisma.operacao.updateMany({
    where: { id, statusFinanceiro: { in: STATUS_FINANCEIRO_ABERTOS } },
    data: { statusFinanceiro: 'LIQUIDADO', dataPagamentoEfetiva: dataPagamento },
  });
  return prisma.operacao.findUnique({ where: { id } });
}

/**
 * Envia para aprovação técnica (Pontte). A operação fica em EM_APROVACAO_TECNICA
 * até que a equipe técnica aprove (vai para EM_APROVACAO_FINANCEIRA) ou rejeite (REJEITADA).
 */
export async function enviarParaAprovacao(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissoes?.includes('fin:operacoes:editar')) {
    throw new Error('Sem permissão para enviar operações para aprovação');
  }

  return prisma.operacao.update({
    where: { id, statusWorkflow: 'EM_EDICAO' },
    data: {
      statusWorkflow: 'EM_APROVACAO_TECNICA',
      dataFinalizacao: new Date(),
      aprovacaoTecnicaStatus: 'PENDENTE',
      aprovacaoTecnicaData: null,
      aprovacaoTecnicaMotivo: null,
      aprovacaoTecnicaPorId: null,
      aprovacaoFundoStatus: 'PENDENTE',
      aprovacaoFundoData: null,
      aprovacaoFundoMotivo: null,
      aprovacaoFundoPorId: null,
      aprovacaoFiadorStatus: 'PENDENTE',
      aprovacaoFiadorData: null,
      aprovacaoFiadorMotivo: null,
      aprovacaoFiadorPorId: null,
      dataAprovacao: null,
      dataRejeicao: null,
      motivoRejeicao: null,
      aprovadorId: null,
    },
  });
}

/**
 * Aprovação técnica (Pontte). Transita EM_APROVACAO_TECNICA -> EM_APROVACAO_FINANCEIRA.
 * Resolve aqui o `exigeAprovacaoFiador` para a etapa financeira seguinte.
 */
export async function aprovarTecnica(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissoes?.includes('aprovacoes:engenharia:aprovar')) {
    throw new Error('Sem permissão para aprovação técnica');
  }

  return prisma.$transaction(async (tx) => {
    const operacao = await tx.operacao.findUnique({
      where: { id },
      select: { id: true, statusWorkflow: true },
    });

    if (!operacao || operacao.statusWorkflow !== 'EM_APROVACAO_TECNICA') {
      throw new Error('Operação não está em aprovação técnica');
    }

    const precisaFiador = await exigeAprovacaoFiadorPorOperacao(id);
    const dataAgora = new Date();

    const atualizada = await tx.operacao.update({
      where: { id },
      data: {
        statusWorkflow: 'EM_APROVACAO_FINANCEIRA',
        aprovacaoTecnicaStatus: 'APROVADA',
        aprovacaoTecnicaData: dataAgora,
        aprovacaoTecnicaPorId: session.user.id,
        aprovacaoTecnicaMotivo: null,
        exigeAprovacaoFiador: precisaFiador,
        aprovacaoFundoStatus: 'PENDENTE',
        aprovacaoFundoData: null,
        aprovacaoFundoMotivo: null,
        aprovacaoFundoPorId: null,
        aprovacaoFiadorStatus: precisaFiador ? 'PENDENTE' : 'APROVADA',
        aprovacaoFiadorData: precisaFiador ? null : dataAgora,
        aprovacaoFiadorMotivo: null,
        aprovacaoFiadorPorId: null,
      },
    });

    await tx.operacaoAprovacaoHistorico.create({
      data: {
        operacaoId: id,
        usuarioId: session.user.id,
        papel: 'TECNICA',
        decisao: 'APROVADA',
      },
    });

    return atualizada;
  });
}

/**
 * Rejeição técnica (Pontte). Transita EM_APROVACAO_TECNICA -> REJEITADA.
 * O `motivo` é obrigatório e fica disponível para a construtora corrigir e reenviar.
 */
export async function rejeitarTecnica(id: string, motivo: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissoes?.includes('aprovacoes:engenharia:aprovar')) {
    throw new Error('Sem permissão para aprovação técnica');
  }
  if (!motivo || motivo.trim().length === 0) {
    throw new Error('Motivo da rejeição é obrigatório');
  }

  return prisma.$transaction(async (tx) => {
    const operacao = await tx.operacao.findUnique({
      where: { id },
      select: { id: true, statusWorkflow: true },
    });

    if (!operacao || operacao.statusWorkflow !== 'EM_APROVACAO_TECNICA') {
      throw new Error('Operação não está em aprovação técnica');
    }

    const dataAgora = new Date();

    const atualizada = await tx.operacao.update({
      where: { id },
      data: {
        statusWorkflow: 'REJEITADA',
        aprovacaoTecnicaStatus: 'REJEITADA',
        aprovacaoTecnicaData: dataAgora,
        aprovacaoTecnicaPorId: session.user.id,
        aprovacaoTecnicaMotivo: motivo,
        dataRejeicao: dataAgora,
        aprovadorId: session.user.id,
        motivoRejeicao: motivo,
      },
    });

    await tx.operacaoAprovacaoHistorico.create({
      data: {
        operacaoId: id,
        usuarioId: session.user.id,
        papel: 'TECNICA',
        decisao: 'REJEITADA',
        motivo,
      },
    });

    return atualizada;
  });
}

export async function excluirOperacao(id: string) {
  // Garante que só pode excluir operações ainda em edição
  const operacao = await prisma.operacao.findUnique({
    where: { id },
    select: { statusWorkflow: true },
  });
  if (!operacao) throw new Error('Operação não encontrada');
  if (operacao.statusWorkflow !== 'EM_EDICAO') {
    throw new Error('Apenas operações em edição podem ser excluídas');
  }

  // Remove recompras vinculadas antes de excluir (para evitar FK violation)
  await prisma.recompraOperacao.deleteMany({
    where: { OR: [{ operacaoPerformadaId: id }, { operacaoAPerformarId: id }] },
  });

  return prisma.operacao.delete({ where: { id } });
}

export interface AtualizarOperacaoBasicaInput {
  dataReferencia?: string;
  observacoes?: string | null;
  // Campos específicos de Performada
  nfNumero?: string | null;
  nfDataEmissao?: string | null;
  nfValorBruto?: number | null;
  nfRetencoes?: number | null;
  nfReferencia?: string | null;
}

export async function atualizarOperacaoBasica(
  id: string,
  data: AtualizarOperacaoBasicaInput
) {
  const operacao = await prisma.operacao.findUnique({
    where: { id },
    select: { statusWorkflow: true },
  });
  if (!operacao) throw new Error('Operação não encontrada');
  if (operacao.statusWorkflow !== 'EM_EDICAO') {
    throw new Error('Apenas operações em edição podem ser alteradas');
  }

  return prisma.operacao.update({
    where: { id },
    data: {
      ...(data.dataReferencia ? { dataReferencia: new Date(data.dataReferencia) } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      ...(data.nfNumero !== undefined ? { nfNumero: data.nfNumero } : {}),
      ...(data.nfDataEmissao !== undefined
        ? { nfDataEmissao: data.nfDataEmissao ? new Date(data.nfDataEmissao) : null }
        : {}),
      ...(data.nfValorBruto !== undefined ? { nfValorBruto: data.nfValorBruto } : {}),
      ...(data.nfRetencoes !== undefined ? { nfRetencoes: data.nfRetencoes } : {}),
      ...(data.nfReferencia !== undefined ? { nfReferencia: data.nfReferencia } : {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Ordens de Pagamento — edição individual
// ---------------------------------------------------------------------------

export interface AtualizarOrdemInput {
  tipoDocumentoNome?: string | null;
  numeroDocumento?: string;
  valorTotal?: number;
  tipoPagamento?: string;
  codigoBarras?: string | null;
  observacoes?: string | null;
}

export async function excluirOrdemPagamento(ordemId: string) {
  const ordem = await prisma.ordemPagamento.findUnique({
    where: { id: ordemId },
    select: {
      operacaoId: true,
      operacao: {
        select: {
          statusWorkflow: true,
          construtoraId: true,
          dataReferencia: true,
          saldoPerformadoConsumido: true,
        },
      },
    },
  });
  if (!ordem) throw new Error('Ordem não encontrada');
  if (ordem.operacao.statusWorkflow !== 'EM_EDICAO') {
    throw new Error('A operação não está em modo de edição');
  }

  await prisma.ordemPagamento.delete({ where: { id: ordemId } });

  const ordensRestantes = await prisma.ordemPagamento.findMany({
    where: { operacaoId: ordem.operacaoId },
    select: { valorTotal: true },
  });
  const novoTotal = ordensRestantes.reduce((sum, o) => sum + Number(o.valorTotal), 0);
  const saldoConsumido = Number(ordem.operacao.saldoPerformadoConsumido ?? 0);
  const valorBase = Math.max(0, novoTotal - saldoConsumido);

  const config = await buscarConfigTaxas(ordem.operacao.construtoraId);
  const encargos = calcularEncargos(
    valorBase,
    ordem.operacao.dataReferencia,
    config.taxaJurosMensal,
    config.taxaAdministrativa,
    config.tipoTaxaAdministrativa
  );

  await prisma.operacao.update({
    where: { id: ordem.operacaoId },
    data: { valorTotalOrdens: novoTotal, ...encargos },
  });
}

export async function atualizarOrdemCompleta(
  ordemId: string,
  data: {
    credorId?: string | null;
    tipoDocumento: string;
    tipoDocumentoNome?: string | null;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    codigoBarras?: string | null;
    observacoes?: string | null;
    apropriacoesOrcamentarias: ApropriacaoOrcInput[];
  }
) {
  const ordem = await prisma.ordemPagamento.findUnique({
    where: { id: ordemId },
    select: {
      operacaoId: true,
      operacao: {
        select: {
          statusWorkflow: true,
          construtoraId: true,
          dataReferencia: true,
          saldoPerformadoConsumido: true,
        },
      },
    },
  });
  if (!ordem) throw new Error('Ordem não encontrada');
  if (ordem.operacao.statusWorkflow !== 'EM_EDICAO') {
    throw new Error('A operação não está em modo de edição');
  }

  const tipoDocMap: Record<string, string> = {
    NOTA_FISCAL: 'NOTA_FISCAL', PEDIDO_COMPRA: 'PEDIDO_COMPRA',
    CONTRATO: 'CONTRATO', RECIBO: 'RECIBO', OUTRO: 'OUTRO',
  };
  const tipoPagMap: Record<string, string> = {
    PIX: 'PIX', TED: 'TED', BOLETO: 'BOLETO', CARTAO: 'CARTAO',
    Transferência: 'TED', Boleto: 'BOLETO',
  };

  // Deleta apropriações antigas e recria
  await prisma.apropriacaoOrcamentaria.deleteMany({ where: { ordemPagamentoId: ordemId } });

  await prisma.ordemPagamento.update({
    where: { id: ordemId },
    data: {
      credorId: data.credorId ?? null,
      tipoDocumento: (tipoDocMap[data.tipoDocumento] ?? 'OUTRO') as any,
      tipoDocumentoNome: data.tipoDocumentoNome ?? data.tipoDocumento ?? null,
      numeroDocumento: data.numeroDocumento,
      valorTotal: data.valorTotal,
      tipoPagamento: (tipoPagMap[data.tipoPagamento] ?? 'PIX') as any,
      codigoBarras: data.codigoBarras ?? null,
      observacoes: data.observacoes ?? null,
      apropriacoesOrcamentarias: {
        create: data.apropriacoesOrcamentarias.map((ap) => ({
          subEtapaCodigo: ap.subEtapaCodigo,
          subEtapaDescricao: ap.subEtapaDescricao,
          etapaNome: ap.etapaNome,
          percentual: ap.percentual,
          valor: ap.valor,
          percentualComprado: ap.tipoCusto === 'DIRETO' ? (ap.percentualComprado ?? 0) : 0,
          itemVisaoGerencialId: ap.tipoCusto === 'DIRETO' ? (ap.itemVisaoGerencialId ?? null) : null,
          tipoCusto: ap.tipoCusto as any,
          subcategoriaDireta: ap.tipoCusto === 'DIRETO' ? (ap.subcategoriaDireta ?? null) : null,
          itemCustoIndiretoId: ap.tipoCusto === 'INDIRETO' ? (ap.itemCustoIndiretoId ?? null) : null,
        })),
      },
    },
  });

  // Recalcula totais da operação
  const ordensAtuais = await prisma.ordemPagamento.findMany({
    where: { operacaoId: ordem.operacaoId },
    select: { valorTotal: true },
  });
  const novoTotal = ordensAtuais.reduce((sum, o) => sum + Number(o.valorTotal), 0);
  const saldoConsumido = Number(ordem.operacao.saldoPerformadoConsumido ?? 0);
  const valorBase = Math.max(0, novoTotal - saldoConsumido);

  const config = await buscarConfigTaxas(ordem.operacao.construtoraId);
  const encargos = calcularEncargos(
    valorBase,
    ordem.operacao.dataReferencia,
    config.taxaJurosMensal,
    config.taxaAdministrativa,
    config.tipoTaxaAdministrativa
  );

  await prisma.operacao.update({
    where: { id: ordem.operacaoId },
    data: { valorTotalOrdens: novoTotal, ...encargos },
  });
}

export async function atualizarOrdemPagamento(ordemId: string, data: AtualizarOrdemInput) {
  const ordem = await prisma.ordemPagamento.findUnique({
    where: { id: ordemId },
    select: {
      operacaoId: true,
      operacao: {
        select: {
          statusWorkflow: true,
          construtoraId: true,
          dataReferencia: true,
          saldoPerformadoConsumido: true,
        },
      },
    },
  });
  if (!ordem) throw new Error('Ordem não encontrada');
  if (ordem.operacao.statusWorkflow !== 'EM_EDICAO') {
    throw new Error('A operação não está em modo de edição');
  }

  const tipoPagMap: Record<string, string> = {
    PIX: 'PIX', TED: 'TED', BOLETO: 'BOLETO', CARTAO: 'CARTAO',
  };

  await prisma.ordemPagamento.update({
    where: { id: ordemId },
    data: {
      ...(data.tipoDocumentoNome !== undefined ? { tipoDocumentoNome: data.tipoDocumentoNome } : {}),
      ...(data.numeroDocumento ? { numeroDocumento: data.numeroDocumento } : {}),
      ...(data.valorTotal !== undefined ? { valorTotal: data.valorTotal } : {}),
      ...(data.tipoPagamento ? { tipoPagamento: (tipoPagMap[data.tipoPagamento] ?? 'PIX') as any } : {}),
      ...(data.codigoBarras !== undefined ? { codigoBarras: data.codigoBarras } : {}),
      ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
    },
  });

  if (data.valorTotal !== undefined) {
    const ordensAtuais = await prisma.ordemPagamento.findMany({
      where: { operacaoId: ordem.operacaoId },
      select: { valorTotal: true },
    });
    const novoTotal = ordensAtuais.reduce((sum, o) => sum + Number(o.valorTotal), 0);
    const saldoConsumido = Number(ordem.operacao.saldoPerformadoConsumido ?? 0);
    const valorBase = Math.max(0, novoTotal - saldoConsumido);

    const config = await buscarConfigTaxas(ordem.operacao.construtoraId);
    const encargos = calcularEncargos(
      valorBase,
      ordem.operacao.dataReferencia,
      config.taxaJurosMensal,
      config.taxaAdministrativa,
      config.tipoTaxaAdministrativa
    );

    await prisma.operacao.update({
      where: { id: ordem.operacaoId },
      data: { valorTotalOrdens: novoTotal, ...encargos },
    });
  }
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export async function calcularResumoOperacoes(construtoraId: string) {
  await sincronizarStatusFinanceiroPorVencimento();
  const operacoes = await prisma.operacao.findMany({
    where: { construtoraId },
    select: {
      tipo: true,
      statusFinanceiro: true,
      statusWorkflow: true,
      valorTotalOrdens: true,
    },
  });

  const aPerformar = operacoes.filter((o) => o.tipo === 'A_PERFORMAR');
  const performadas = operacoes.filter((o) => o.tipo === 'PERFORMADA');
  const saldoPerformado = operacoes.filter((o) => o.tipo === 'SALDO_PERFORMADO');

  const somarValor = (list: typeof operacoes) =>
    list.reduce((sum, o) => sum + Number(o.valorTotalOrdens), 0);

  const aPerformarAbertas = aPerformar.filter((o) => STATUS_FINANCEIRO_ABERTOS.includes(o.statusFinanceiro));
  const performadasAbertas = performadas.filter((o) => STATUS_FINANCEIRO_ABERTOS.includes(o.statusFinanceiro));

  return {
    totalOperacoes: operacoes.length,
    // À performar
    totalAPerformar: aPerformar.length,
    aPerformarAbertas: aPerformarAbertas.length,
    aPerformarLiquidadas: aPerformar.filter((o) => o.statusFinanceiro === 'LIQUIDADO').length,
    valorAPerformarAberto: somarValor(aPerformarAbertas),
    // Performadas
    totalPerformadas: performadas.length,
    performadasAbertas: performadasAbertas.length,
    performadasLiquidadas: performadas.filter((o) => o.statusFinanceiro === 'LIQUIDADO').length,
    valorPerformadasAberto: somarValor(performadasAbertas),
    // Saldo performado
    totalSaldoPerformado: saldoPerformado.length,
    // Totais
    totalAbertas: operacoes.filter((o) => STATUS_FINANCEIRO_ABERTOS.includes(o.statusFinanceiro)).length,
    totalLiquidadas: operacoes.filter((o) => o.statusFinanceiro === 'LIQUIDADO').length,
    valorTotalAberto: somarValor(operacoes.filter((o) => STATUS_FINANCEIRO_ABERTOS.includes(o.statusFinanceiro))),
    // Em aprovação (técnica + financeira agrupadas)
    emAprovacao: operacoes.filter(
      (o) =>
        o.statusWorkflow === 'EM_APROVACAO_TECNICA' ||
        o.statusWorkflow === 'EM_APROVACAO_FINANCEIRA',
    ).length,
  };
}

// ---------------------------------------------------------------------------
// % Comprado acumulado por item da EAP (por obra)
// ---------------------------------------------------------------------------

// Retorna Record<itemVisaoGerencialId, percentualCompradoAcumulado>
// Usa o UUID real do ItemVisaoGerencial como chave, pois a árvore EAP Gerencial
// agora usa esses IDs diretamente (itens nivel 2 da VersaoVisaoGerencial).
export async function buscarAcumuladoCompradoPorObra(
  obraId: string
): Promise<Record<string, number>> {
  const apropriacoes = await prisma.apropriacaoOrcamentaria.findMany({
    where: {
      itemVisaoGerencialId: { not: null },
      ordemPagamento: {
        operacao: { obraId },
      },
    },
    select: {
      itemVisaoGerencialId: true,
      percentualComprado: true,
    },
  });

  const acumulado: Record<string, number> = {};
  for (const ap of apropriacoes) {
    if (!ap.itemVisaoGerencialId) continue;
    acumulado[ap.itemVisaoGerencialId] =
      (acumulado[ap.itemVisaoGerencialId] ?? 0) + Number(ap.percentualComprado);
  }
  return acumulado;
}
