/**
 * Smoke test do PR1 - Aprovacao Tecnica
 *
 * Roda com:  npx tsx scripts/smoke-test-pr1.ts
 *
 * Valida em 3 partes:
 *  A) Schema do banco (colunas, enums, FK, indices)
 *  B) Seed (usuarios e permissoes esperados)
 *  C) Fluxo end-to-end (cria uma operacao dummy e percorre os estados)
 *     ATENCAO: a parte C simula o que as server actions fazem via queries
 *     diretas no Prisma; nao chama as actions reais (que dependem de
 *     getServerSession). Para teste real das actions, aguardar PR2 com UI.
 *
 * No final, limpa o que criou.
 */

import 'dotenv/config';
import { db } from '../lib/db';

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ${c.green}✓${c.reset} ${label}`);
    pass++;
  } else {
    console.log(`  ${c.red}✗${c.reset} ${label}${detail ? ` ${c.gray}(${detail})${c.reset}` : ''}`);
    fail++;
    failures.push(label);
  }
}

function section(title: string) {
  console.log(`\n${c.bold}${c.cyan}${title}${c.reset}`);
}

// ============================================================================
// Parte A — Schema do banco
// ============================================================================

async function partA() {
  section('A) Schema do banco');

  const enumValuesWorkflow = await db.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'StatusWorkflowOperacao'
    ORDER BY e.enumsortorder;
  `;
  const valoresWorkflow = enumValuesWorkflow.map((r) => r.enumlabel);
  check('Enum StatusWorkflowOperacao tem EM_APROVACAO_TECNICA', valoresWorkflow.includes('EM_APROVACAO_TECNICA'), valoresWorkflow.join(','));
  check('Enum StatusWorkflowOperacao tem EM_APROVACAO_FINANCEIRA', valoresWorkflow.includes('EM_APROVACAO_FINANCEIRA'));
  check('Enum StatusWorkflowOperacao NAO tem EM_APROVACAO antigo', !valoresWorkflow.includes('EM_APROVACAO'));

  const enumValuesPapel = await db.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'PapelAprovacaoOperacao'
    ORDER BY e.enumsortorder;
  `;
  const valoresPapel = enumValuesPapel.map((r) => r.enumlabel);
  check('Enum PapelAprovacaoOperacao tem TECNICA', valoresPapel.includes('TECNICA'), valoresPapel.join(','));

  const colunas = await db.$queryRaw<Array<{ column_name: string; data_type: string; is_nullable: string }>>`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Operacao'
      AND column_name IN ('aprovacaoTecnicaStatus', 'aprovacaoTecnicaData', 'aprovacaoTecnicaMotivo', 'aprovacaoTecnicaPorId');
  `;
  const colMap = new Map(colunas.map((c) => [c.column_name, c]));
  check('Coluna aprovacaoTecnicaStatus existe (NOT NULL)', colMap.get('aprovacaoTecnicaStatus')?.is_nullable === 'NO');
  check('Coluna aprovacaoTecnicaData existe (NULL)', colMap.get('aprovacaoTecnicaData')?.is_nullable === 'YES');
  check('Coluna aprovacaoTecnicaMotivo existe (NULL)', colMap.get('aprovacaoTecnicaMotivo')?.is_nullable === 'YES');
  check('Coluna aprovacaoTecnicaPorId existe (NULL)', colMap.get('aprovacaoTecnicaPorId')?.is_nullable === 'YES');

  const fk = await db.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public."Operacao"'::regclass
      AND conname = 'Operacao_aprovacaoTecnicaPorId_fkey';
  `;
  check('FK Operacao.aprovacaoTecnicaPorId -> usuarios existe', fk.length === 1);

  const idx = await db.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'Operacao'
      AND indexname = 'Operacao_aprovacaoTecnicaStatus_idx';
  `;
  check('Indice Operacao_aprovacaoTecnicaStatus_idx existe', idx.length === 1);
}

// ============================================================================
// Parte B — Seed e permissoes
// ============================================================================

async function partB() {
  section('B) Seed e permissoes');

  const permTecnica = await db.permissao.findUnique({ where: { chave: 'aprovacoes:engenharia:aprovar' } });
  check('Permissao aprovacoes:engenharia:aprovar existe no banco', !!permTecnica);

  const permFinanceira = await db.permissao.findUnique({ where: { chave: 'aprovacoes:financeiro:aprovar' } });
  check('Permissao aprovacoes:financeiro:aprovar existe no banco', !!permFinanceira);

  const aprTec = await db.usuario.findUnique({
    where: { email: 'apr-tec@pontte.com' },
    include: { perfil: { include: { permissoes: { include: { permissao: true } } } } },
  });
  if (!aprTec) {
    check('Usuario apr-tec@pontte.com existe', false, 'nao encontrado');
    return;
  }
  check('Usuario apr-tec@pontte.com existe', true);
  const permsAprTec = aprTec.perfil.permissoes.map((pp) => pp.permissao.chave);
  check('apr-tec tem aprovacoes:engenharia:aprovar', permsAprTec.includes('aprovacoes:engenharia:aprovar'));

  const aprFin = await db.usuario.findUnique({
    where: { email: 'apr-fin@pontte.com' },
    include: { perfil: { include: { permissoes: { include: { permissao: true } } } } },
  });
  if (!aprFin) {
    check('Usuario apr-fin@pontte.com existe', false, 'nao encontrado');
    return;
  }
  check('Usuario apr-fin@pontte.com existe', true);
  const permsAprFin = aprFin.perfil.permissoes.map((pp) => pp.permissao.chave);
  check('apr-fin tem aprovacoes:financeiro:aprovar', permsAprFin.includes('aprovacoes:financeiro:aprovar'));
}

// ============================================================================
// Parte C — Fluxo end-to-end (simulado via queries Prisma diretas)
// ============================================================================

async function partC() {
  section('C) Fluxo end-to-end (simulado)');

  const construtora = await db.construtora.findFirst();
  if (!construtora) {
    check('Construtora de seed encontrada', false, 'rodar prisma db seed primeiro');
    return;
  }
  check('Construtora encontrada', true, construtora.razaoSocial);

  // Garante uma obra dummy
  let obra = await db.obra.findFirst({ where: { construtoraId: construtora.id } });
  let obraCriada = false;
  if (!obra) {
    obra = await db.obra.create({
      data: {
        construtoraId: construtora.id,
        codigo: 'OBRA-SMOKE-PR1',
        nome: 'Obra Smoke Test PR1',
        endereco: 'Rua Teste, 123',
        cidade: 'Sao Paulo',
        estado: 'SP',
        valorContrato: 1000000,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        prazoMeses: 12,
        prazoExecucaoMeses: 10,
        dataInicioExecucao: new Date(),
        dataFimExecucao: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
        status: 'ATIVA',
      },
    });
    obraCriada = true;
  }
  check('Obra disponivel', !!obra, obra.nome);

  const aprTec = await db.usuario.findUnique({ where: { email: 'apr-tec@pontte.com' } });
  const aprFin = await db.usuario.findUnique({ where: { email: 'apr-fin@pontte.com' } });
  if (!aprTec || !aprFin) {
    check('Usuarios de teste presentes', false);
    return;
  }

  // 1. Cria operacao em EM_EDICAO
  const operacao = await db.operacao.create({
    data: {
      construtoraId: construtora.id,
      obraId: obra.id,
      codigo: `SMOKE-${Date.now()}`,
      tipo: 'A_PERFORMAR',
      dataReferencia: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      valorTotalOrdens: 10000,
      taxaJurosMensal: 0.015,
      taxaAdministrativa: 0.005,
      jurosProjetados: 150,
      taxasAdministrativas: 50,
      valorDesagio: 200,
      valorBruto: 10200,
      percentualDesagio: 2,
      statusWorkflow: 'EM_EDICAO',
    },
  });
  check('1. Operacao criada em EM_EDICAO', operacao.statusWorkflow === 'EM_EDICAO');

  // 2. enviarParaAprovacao -> EM_APROVACAO_TECNICA
  const aposEnvio = await db.operacao.update({
    where: { id: operacao.id, statusWorkflow: 'EM_EDICAO' },
    data: {
      statusWorkflow: 'EM_APROVACAO_TECNICA',
      dataFinalizacao: new Date(),
      aprovacaoTecnicaStatus: 'PENDENTE',
      aprovacaoFundoStatus: 'PENDENTE',
      aprovacaoFiadorStatus: 'PENDENTE',
    },
  });
  check('2. enviarParaAprovacao -> EM_APROVACAO_TECNICA', aposEnvio.statusWorkflow === 'EM_APROVACAO_TECNICA');
  check('   aprovacaoTecnicaStatus = PENDENTE', aposEnvio.aprovacaoTecnicaStatus === 'PENDENTE');

  // 3. aprovarTecnica -> EM_APROVACAO_FINANCEIRA
  const aposAprovTec = await db.operacao.update({
    where: { id: operacao.id, statusWorkflow: 'EM_APROVACAO_TECNICA' },
    data: {
      statusWorkflow: 'EM_APROVACAO_FINANCEIRA',
      aprovacaoTecnicaStatus: 'APROVADA',
      aprovacaoTecnicaData: new Date(),
      aprovacaoTecnicaPorId: aprTec.id,
      exigeAprovacaoFiador: false, // nao temos vinculo de fiador na obra de teste
      aprovacaoFiadorStatus: 'APROVADA', // auto-aprovado pois nao exige
      aprovacaoFiadorData: new Date(),
    },
  });
  check('3. aprovarTecnica -> EM_APROVACAO_FINANCEIRA', aposAprovTec.statusWorkflow === 'EM_APROVACAO_FINANCEIRA');
  check('   aprovacaoTecnicaStatus = APROVADA', aposAprovTec.aprovacaoTecnicaStatus === 'APROVADA');
  check('   aprovacaoTecnicaPorId preenchido', aposAprovTec.aprovacaoTecnicaPorId === aprTec.id);

  // Historico tecnica
  await db.operacaoAprovacaoHistorico.create({
    data: {
      operacaoId: operacao.id,
      usuarioId: aprTec.id,
      papel: 'TECNICA',
      decisao: 'APROVADA',
    },
  });

  // 4. aprovarOperacao (Fundo) -> APROVADA
  const aposAprovFundo = await db.operacao.update({
    where: { id: operacao.id, statusWorkflow: 'EM_APROVACAO_FINANCEIRA' },
    data: {
      statusWorkflow: 'APROVADA',
      aprovacaoFundoStatus: 'APROVADA',
      aprovacaoFundoData: new Date(),
      aprovacaoFundoPorId: aprFin.id,
      dataAprovacao: new Date(),
      aprovadorId: aprFin.id,
    },
  });
  check('4. aprovarOperacao (Fundo) -> APROVADA', aposAprovFundo.statusWorkflow === 'APROVADA');
  check('   aprovacaoFundoPorId preenchido', aposAprovFundo.aprovacaoFundoPorId === aprFin.id);

  // Historico final
  const historicos = await db.operacaoAprovacaoHistorico.findMany({
    where: { operacaoId: operacao.id },
    select: { papel: true, decisao: true },
  });
  check('Historico tem entrada TECNICA APROVADA', historicos.some((h) => h.papel === 'TECNICA' && h.decisao === 'APROVADA'));

  // Cleanup
  await db.operacaoAprovacaoHistorico.deleteMany({ where: { operacaoId: operacao.id } });
  await db.operacao.delete({ where: { id: operacao.id } });
  if (obraCriada) {
    await db.obra.delete({ where: { id: obra.id } });
  }
  check('Cleanup: operacao e historico removidos', true);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`${c.bold}Smoke test PR1 - Aprovacao Tecnica${c.reset}\n`);
  try {
    await partA();
    await partB();
    await partC();
  } catch (err) {
    fail++;
    console.error(`\n${c.red}Erro inesperado:${c.reset}`, err);
  }

  console.log(`\n${c.bold}Resultado${c.reset}`);
  console.log(`  ${c.green}${pass} passou${c.reset}  ${fail > 0 ? c.red : c.gray}${fail} falhou${c.reset}`);
  if (fail > 0) {
    console.log(`\n${c.red}Falhas:${c.reset}`);
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exitCode = 1;
  }
}

main().finally(() => db.$disconnect());
