import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida no arquivo .env')
}

console.log('🔌 Conectando ao banco de dados...')
console.log('📍 Database URL:', process.env.DATABASE_URL?.substring(0, 20) + '...')

// Criar adapter para PostgreSQL
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
})
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  // Verificar se a construtora já existe
  console.log('🏗️  Verificando construtora de exemplo...')
  
  let construtora = await prisma.construtora.findUnique({
    where: { codigo: 'CD-001' }
  })
  
  if (!construtora) {
    console.log('   Criando nova construtora...')
    construtora = await prisma.construtora.create({
      data: {
        codigo: 'CD-001',
        razaoSocial: 'Construtora ABC Ltda',
        cnpj: '12345678000190',
        nomeFantasia: 'Construtora ABC',
        inscricaoEstadual: '123456789',
        endereco: 'Av. Principal, 1000',
        cidade: 'Maringá',
        estado: 'PR',
        cep: '87000000',
        telefone: '4430251234',
        email: 'contato@construtoraabc.com.br',
      },
    })
    console.log(`✅ Construtora criada: ${construtora.razaoSocial} (${construtora.codigo})`)
  } else {
    console.log(`✅ Construtora já existe: ${construtora.razaoSocial} (${construtora.codigo})`)
  }
  
  // Seed dos Cadastros Financeiros
  await seedCadastrosFinanceiros(prisma, construtora.id)
  
  console.log('✅ Seed concluído com sucesso!')
}

async function seedCadastrosFinanceiros(prisma: PrismaClient, construtoraId: string) {
  console.log('💰 Seeding cadastros financeiros...')
  
  // 1. CREDORES
  console.log('  📋 Verificando credores...')
  
  const credoresExistentes = await prisma.credor.count({
    where: { construtoraId }
  })
  
  if (credoresExistentes === 0) {
    const credores = await prisma.credor.createMany({
      data: [
        {
          codigo: 'CRED-001',
          construtoraId,
          tipo: 'FORNECEDOR',
          tipoPessoa: 'PJ',
          cpfCnpj: '11222333000144',
          nome: 'Materiais de Construção Silva Ltda',
          nomeFantasia: 'Silva Materiais',
          email: 'contato@silvamateriais.com.br',
          telefone: '4430251111',
          cidade: 'Maringá',
          estado: 'PR',
          banco: '001',
          agencia: '1234',
          conta: '12345',
          contaDigito: '6',
          tipoConta: 'CORRENTE',
          status: 'ATIVO',
        },
        {
          codigo: 'CRED-002',
          construtoraId,
          tipo: 'EMPREITEIRO',
          tipoPessoa: 'PJ',
          cpfCnpj: '22333444000155',
          nome: 'Empreiteira Santos & Filhos Ltda',
          nomeFantasia: 'Santos Empreiteira',
          email: 'contato@santosempreiteira.com.br',
          telefone: '4430252222',
          cidade: 'Maringá',
          estado: 'PR',
          status: 'ATIVO',
        },
        {
          codigo: 'CRED-003',
          construtoraId,
          tipo: 'FUNCIONARIO',
          tipoPessoa: 'PF',
          cpfCnpj: '12345678900',
          nome: 'João da Silva',
          email: 'joao.silva@email.com',
          telefone: '44999991111',
          rg: '123456789',
          status: 'ATIVO',
        },
      ],
    })
    console.log(`  ✅ ${credores.count} credores criados`)
  } else {
    console.log(`  ℹ️  ${credoresExistentes} credores já existem`)
  }
  
  // 2. CONTAS BANCÁRIAS
  console.log('  🏦 Verificando contas bancárias...')
  
  const bancosExistentes = await prisma.contaBancaria.count({
    where: { construtoraId }
  })
  
  if (bancosExistentes === 0) {
    const bancos = await prisma.contaBancaria.createMany({
      data: [
        {
          codigo: 'BANCO-001',
          construtoraId,
          nome: 'Conta Corrente Principal',
          banco: '001',
          nomeBanco: 'Banco do Brasil',
          agencia: '1234',
          conta: '123456',
          contaDigito: '7',
          tipoConta: 'CORRENTE',
          chavePix: '12345678000190',
          tipoChavePix: 'CNPJ',
          saldoAtual: 150000.00,
          saldoDisponivel: 150000.00,
          status: 'ATIVA',
        },
        {
          codigo: 'BANCO-002',
          construtoraId,
          nome: 'Conta Poupança',
          banco: '341',
          nomeBanco: 'Itaú Unibanco',
          agencia: '5678',
          conta: '789012',
          contaDigito: '3',
          tipoConta: 'POUPANCA',
          saldoAtual: 50000.00,
          saldoDisponivel: 50000.00,
          status: 'ATIVA',
        },
      ],
    })
    console.log(`  ✅ ${bancos.count} contas bancárias criadas`)
  } else {
    console.log(`  ℹ️  ${bancosExistentes} contas bancárias já existem`)
  }
  
  // 3. CENTRO DE CUSTO
  console.log('  📊 Verificando centros de custo...')
  
  const centrosCustoExistentes = await prisma.centroCusto.count({
    where: { construtoraId }
  })
  
  if (centrosCustoExistentes === 0) {
    const centrosCusto = await prisma.centroCusto.createMany({
      data: [
        {
          codigo: 'CC-001',
          construtoraId,
          nome: 'Administrativo',
          descricao: 'Despesas administrativas da empresa',
          tipo: 'ADMINISTRATIVO',
          nivel: 0,
          status: 'ATIVO',
        },
        {
          codigo: 'CC-002',
          construtoraId,
          nome: 'Obras',
          descricao: 'Custos de obras em execução',
          tipo: 'OBRA',
          nivel: 0,
          status: 'ATIVO',
        },
        {
          codigo: 'CC-003',
          construtoraId,
          nome: 'Comercial',
          descricao: 'Despesas comerciais e vendas',
          tipo: 'DEPARTAMENTO',
          nivel: 0,
          status: 'ATIVO',
        },
      ],
    })
    console.log(`  ✅ ${centrosCusto.count} centros de custo criados`)
  } else {
    console.log(`  ℹ️  ${centrosCustoExistentes} centros de custo já existem`)
  }
  
  // 4. PLANO DE CONTAS DRE
  console.log('  📈 Verificando plano de contas DRE...')
  
  let planoDRE = await prisma.planoContas.findFirst({
    where: { 
      construtoraId,
      codigo: 'PLANO-001'
    }
  })
  
  if (!planoDRE) {
    planoDRE = await prisma.planoContas.create({
      data: {
        codigo: 'PLANO-001',
        construtoraId,
        nome: 'DRE Padrão - Construção Civil',
        descricao: 'Demonstração do Resultado do Exercício para empresas de construção civil',
        isPadrao: true,
        status: 'ATIVO',
      },
    })
    
    console.log(`  ✅ Plano de contas criado: ${planoDRE.nome}`)
    console.log('  📝 Criando estrutura de contas contábeis...')
    
    // Criar contas contábeis da DRE (estrutura completa)
    await criarContasDRE(prisma, planoDRE.id)
    
    console.log('  ✅ Estrutura DRE completa criada!')
  } else {
    const totalContas = await prisma.contaContabil.count({
      where: { planoContasId: planoDRE.id }
    })
    console.log(`  ℹ️  Plano DRE já existe com ${totalContas} contas`)
  }
}

async function criarContasDRE(prisma: PrismaClient, planoContasId: string) {
  // Nível 0 - Receita Bruta
  const receitaBruta = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '1',
      nome: 'RECEITA BRUTA DE SERVIÇOS',
      nivel: 0,
      ordem: 1,
      tipo: 'SINTETICA',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'RECEITA_BRUTA',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  // Contas filhas de Receita Bruta
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '1.1', nome: 'Receita de Obras Públicas', nivel: 1, ordem: 1, parentId: receitaBruta.id, tipo: 'ANALITICA', natureza: 'CREDORA', aceitaLancamento: true, categoriaDRE: 'RECEITA_BRUTA', status: 'ATIVA' },
      { planoContasId, codigo: '1.2', nome: 'Receita de Obras Privadas', nivel: 1, ordem: 2, parentId: receitaBruta.id, tipo: 'ANALITICA', natureza: 'CREDORA', aceitaLancamento: true, categoriaDRE: 'RECEITA_BRUTA', status: 'ATIVA' },
      { planoContasId, codigo: '1.3', nome: 'Receita de Reformas e Manutenção', nivel: 1, ordem: 3, parentId: receitaBruta.id, tipo: 'ANALITICA', natureza: 'CREDORA', aceitaLancamento: true, categoriaDRE: 'RECEITA_BRUTA', status: 'ATIVA' },
    ],
  })
  
  // Nível 0 - Deduções
  const deducoes = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '2',
      nome: '(-) DEDUÇÕES DA RECEITA',
      nivel: 0,
      ordem: 2,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'DEDUCOES_RECEITA',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '2.1', nome: 'Impostos sobre Serviços - ISS', nivel: 1, ordem: 1, parentId: deducoes.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DEDUCOES_RECEITA', status: 'ATIVA' },
      { planoContasId, codigo: '2.2', nome: 'PIS sobre Receita', nivel: 1, ordem: 2, parentId: deducoes.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DEDUCOES_RECEITA', status: 'ATIVA' },
      { planoContasId, codigo: '2.3', nome: 'COFINS sobre Receita', nivel: 1, ordem: 3, parentId: deducoes.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DEDUCOES_RECEITA', status: 'ATIVA' },
    ],
  })
  
  // Receita Líquida (Linha de Resultado)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '3',
      nome: '(=) RECEITA LÍQUIDA',
      nivel: 0,
      ordem: 3,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'RECEITA_LIQUIDA',
      tipoCalculo: 'FORMULA',
      formula: '1 - 2',
      status: 'ATIVA',
    },
  })
  
  // Custos dos Serviços
  const custos = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '4',
      nome: '(-) CUSTO DOS SERVIÇOS PRESTADOS - CSP',
      nivel: 0,
      ordem: 4,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'CUSTO_SERVICOS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  const materiais = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '4.1',
      nome: 'Materiais Diretos',
      nivel: 1,
      ordem: 1,
      parentId: custos.id,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'CUSTO_SERVICOS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '4.1.1', nome: 'Materiais de Construção', nivel: 2, ordem: 1, parentId: materiais.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'CUSTO_SERVICOS', status: 'ATIVA' },
      { planoContasId, codigo: '4.1.2', nome: 'Materiais de Acabamento', nivel: 2, ordem: 2, parentId: materiais.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'CUSTO_SERVICOS', status: 'ATIVA' },
    ],
  })
  
  const maoObra = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '4.2',
      nome: 'Mão de Obra Direta',
      nivel: 1,
      ordem: 2,
      parentId: custos.id,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'CUSTO_SERVICOS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '4.2.1', nome: 'Salários - Obra', nivel: 2, ordem: 1, parentId: maoObra.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'CUSTO_SERVICOS', status: 'ATIVA' },
      { planoContasId, codigo: '4.2.2', nome: 'Encargos Sociais - Obra', nivel: 2, ordem: 2, parentId: maoObra.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'CUSTO_SERVICOS', status: 'ATIVA' },
    ],
  })
  
  // Lucro Bruto (Linha de Resultado)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '5',
      nome: '(=) LUCRO BRUTO',
      nivel: 0,
      ordem: 5,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'LUCRO_BRUTO',
      tipoCalculo: 'FORMULA',
      formula: '3 - 4',
      status: 'ATIVA',
    },
  })
  
  // Despesas Operacionais
  const despesas = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '6',
      nome: '(-) DESPESAS OPERACIONAIS',
      nivel: 0,
      ordem: 6,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'DESPESAS_ADMINISTRATIVAS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  const despAdmin = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '6.1',
      nome: 'Despesas Administrativas',
      nivel: 1,
      ordem: 1,
      parentId: despesas.id,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'DESPESAS_ADMINISTRATIVAS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '6.1.1', nome: 'Aluguéis - Escritório', nivel: 2, ordem: 1, parentId: despAdmin.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DESPESAS_ADMINISTRATIVAS', status: 'ATIVA' },
      { planoContasId, codigo: '6.1.2', nome: 'Material de Escritório', nivel: 2, ordem: 2, parentId: despAdmin.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DESPESAS_ADMINISTRATIVAS', status: 'ATIVA' },
    ],
  })
  
  // EBITDA (Linha de Resultado)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '7',
      nome: '(=) EBITDA',
      nivel: 0,
      ordem: 7,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'EBITDA',
      tipoCalculo: 'FORMULA',
      formula: '5 - 6',
      status: 'ATIVA',
    },
  })
  
  // Depreciação
  const deprec = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '8',
      nome: '(-) DEPRECIAÇÃO E AMORTIZAÇÃO',
      nivel: 0,
      ordem: 8,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'DEPRECIACAO_AMORTIZACAO',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '8.1', nome: 'Depreciação de Máquinas e Equipamentos', nivel: 1, ordem: 1, parentId: deprec.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DEPRECIACAO_AMORTIZACAO', status: 'ATIVA' },
      { planoContasId, codigo: '8.2', nome: 'Depreciação de Veículos', nivel: 1, ordem: 2, parentId: deprec.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DEPRECIACAO_AMORTIZACAO', status: 'ATIVA' },
    ],
  })
  
  // EBIT (Linha de Resultado)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '9',
      nome: '(=) EBIT - LUCRO OPERACIONAL',
      nivel: 0,
      ordem: 9,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'EBIT',
      tipoCalculo: 'FORMULA',
      formula: '7 - 8',
      status: 'ATIVA',
    },
  })
  
  // Resultado Financeiro
  const resFin = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '10',
      nome: '(+/-) RESULTADO FINANCEIRO',
      nivel: 0,
      ordem: 10,
      tipo: 'SINTETICA',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'RESULTADO_FINANCEIRO',
      tipoCalculo: 'FORMULA',
      formula: '10.1 - 10.2',
      status: 'ATIVA',
    },
  })
  
  const recFin = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '10.1',
      nome: 'Receitas Financeiras',
      nivel: 1,
      ordem: 1,
      parentId: resFin.id,
      tipo: 'SINTETICA',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'RECEITAS_FINANCEIRAS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '10.1.1', nome: 'Juros Recebidos', nivel: 2, ordem: 1, parentId: recFin.id, tipo: 'ANALITICA', natureza: 'CREDORA', aceitaLancamento: true, categoriaDRE: 'RECEITAS_FINANCEIRAS', status: 'ATIVA' },
      { planoContasId, codigo: '10.1.2', nome: 'Rendimentos de Aplicações', nivel: 2, ordem: 2, parentId: recFin.id, tipo: 'ANALITICA', natureza: 'CREDORA', aceitaLancamento: true, categoriaDRE: 'RECEITAS_FINANCEIRAS', status: 'ATIVA' },
    ],
  })
  
  const despFin = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '10.2',
      nome: '(-) Despesas Financeiras',
      nivel: 1,
      ordem: 2,
      parentId: resFin.id,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'DESPESAS_FINANCEIRAS',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '10.2.1', nome: 'Juros Pagos', nivel: 2, ordem: 1, parentId: despFin.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DESPESAS_FINANCEIRAS', status: 'ATIVA' },
      { planoContasId, codigo: '10.2.2', nome: 'Tarifas Bancárias', nivel: 2, ordem: 2, parentId: despFin.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'DESPESAS_FINANCEIRAS', status: 'ATIVA' },
    ],
  })
  
  // LAIR (Linha de Resultado)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '11',
      nome: '(=) LAIR - LUCRO ANTES DO IR',
      nivel: 0,
      ordem: 11,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'LAIR',
      tipoCalculo: 'FORMULA',
      formula: '9 + 10',
      status: 'ATIVA',
    },
  })
  
  // Impostos sobre Lucro
  const impostos = await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '12',
      nome: '(-) IMPOSTOS SOBRE O LUCRO',
      nivel: 0,
      ordem: 12,
      tipo: 'SINTETICA',
      natureza: 'DEVEDORA',
      aceitaLancamento: false,
      categoriaDRE: 'IMPOSTOS_LUCRO',
      tipoCalculo: 'SOMA',
      status: 'ATIVA',
    },
  })
  
  await prisma.contaContabil.createMany({
    data: [
      { planoContasId, codigo: '12.1', nome: 'Imposto de Renda - IRPJ', nivel: 1, ordem: 1, parentId: impostos.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'IMPOSTOS_LUCRO', status: 'ATIVA' },
      { planoContasId, codigo: '12.2', nome: 'Contribuição Social - CSLL', nivel: 1, ordem: 2, parentId: impostos.id, tipo: 'ANALITICA', natureza: 'DEVEDORA', aceitaLancamento: true, categoriaDRE: 'IMPOSTOS_LUCRO', status: 'ATIVA' },
    ],
  })
  
  // Lucro Líquido (Linha de Resultado Final)
  await prisma.contaContabil.create({
    data: {
      planoContasId,
      codigo: '13',
      nome: '(=) LUCRO LÍQUIDO DO EXERCÍCIO',
      nivel: 0,
      ordem: 13,
      tipo: 'LINHA_RESULTADO',
      natureza: 'CREDORA',
      aceitaLancamento: false,
      categoriaDRE: 'LUCRO_LIQUIDO',
      tipoCalculo: 'FORMULA',
      formula: '11 - 12',
      status: 'ATIVA',
    },
  })
  
  console.log('    ✅ Estrutura DRE com todas as contas e linhas de resultado criada')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
