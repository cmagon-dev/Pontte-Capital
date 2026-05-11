import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { PERMISSOES } from '../lib/permissoes'

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

  // --------------------------------------------------------
  // RBAC: Permissões, Perfis e Usuários de teste
  // --------------------------------------------------------
  console.log('🔐 Seeding RBAC (permissões, perfis, usuários)...')

  // 1. Upsert de todas as permissões do catálogo
  for (const [chave, valor] of Object.entries(PERMISSOES)) {
    await prisma.permissao.upsert({
      where: { chave },
      update: { descricao: valor.descricao, categoria: valor.categoria },
      create: { chave, descricao: valor.descricao, categoria: valor.categoria },
    })
  }
  console.log(`  ✅ ${Object.keys(PERMISSOES).length} permissões sincronizadas`)

  // 2. Criar perfis padrão com suas permissões
  const todasChaves = Object.keys(PERMISSOES)

  // tipoEscopo: GLOBAL = Pontte/acesso irrestrito | FUNDO = scoped ao fundo | CONSTRUTORA = scoped à construtora
  const perfisPadrao = [
    {
      nome: 'Admin',
      descricao: 'Acesso total ao sistema (Pontte)',
      tipoEscopo: 'GLOBAL',
      chaves: todasChaves,
    },
    {
      nome: 'Engenharia',
      descricao: 'Equipe técnica Pontte — engenharia e aprovações técnicas',
      tipoEscopo: 'GLOBAL',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'eng:ver',
        'eng:orcamento:editar',
        'eng:medicoes:editar',
        'eng:contratos:editar',
        'eng:acompanhamento:ver',
        'aprovacoes:engenharia:ver',
        'aprovacoes:engenharia:aprovar',
      ],
    },
    {
      nome: 'Financeiro',
      descricao: 'Equipe do fundo — operações e aprovações financeiras',
      tipoEscopo: 'FUNDO',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'fin:ver',
        'fin:operacoes:criar',
        'fin:operacoes:editar',
        'fin:cadastros:editar',
        'aprovacoes:financeiro:ver',
        'aprovacoes:financeiro:aprovar',
      ],
    },
    {
      nome: 'Aprovador Técnico',
      descricao: 'Apenas aprovações técnicas de engenharia',
      tipoEscopo: 'GLOBAL',
      chaves: [
        'dashboard:ver',
        'aprovacoes:engenharia:ver',
        'aprovacoes:engenharia:aprovar',
      ],
    },
    {
      nome: 'Aprovador Financeiro',
      descricao: 'Apenas aprovações financeiras — perfil do fundo',
      tipoEscopo: 'FUNDO',
      chaves: [
        'dashboard:ver',
        'aprovacoes:financeiro:ver',
        'aprovacoes:financeiro:aprovar',
      ],
    },
    // Perfis Pontte (internos, escopo global, podem ser restritos por vínculo)
    {
      nome: 'Pontte - Admin',
      descricao: 'Usuário interno Pontte com acesso total',
      tipoEscopo: 'GLOBAL',
      chaves: todasChaves,
    },
    {
      nome: 'Pontte - Engenharia',
      descricao: 'Analista de engenharia Pontte',
      tipoEscopo: 'GLOBAL',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'eng:ver',
        'eng:orcamento:editar',
        'eng:medicoes:editar',
        'eng:contratos:editar',
        'eng:acompanhamento:ver',
        'aprovacoes:engenharia:ver',
        'aprovacoes:engenharia:aprovar',
      ],
    },
    {
      nome: 'Construtora - Visualizador',
      descricao: 'Usuário da construtora — acesso de leitura às suas obras',
      tipoEscopo: 'CONSTRUTORA',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'eng:ver',
        'eng:acompanhamento:ver',
      ],
    },
    {
      nome: 'Fundo - Visualizador',
      descricao: 'Usuário do fundo — acesso de leitura às operações do fundo',
      tipoEscopo: 'FUNDO',
      chaves: [
        'dashboard:ver',
        'fin:ver',
        'aprovacoes:financeiro:ver',
      ],
    },
    {
      nome: 'Fundo - Master',
      descricao: 'Admin delegado do fundo (gerencia usuários e perfis do próprio escopo)',
      tipoEscopo: 'FUNDO',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'fin:ver',
        'fin:operacoes:criar',
        'fin:operacoes:editar',
        'fin:cadastros:editar',
        'aprovacoes:financeiro:ver',
        'aprovacoes:financeiro:aprovar',
        'admin:ver',
        'admin:tenant:usuarios:gerenciar',
        'admin:tenant:perfis:gerenciar',
      ],
    },
    {
      nome: 'Construtora - Master',
      descricao: 'Admin delegado da construtora (gerencia usuários e perfis do próprio escopo)',
      tipoEscopo: 'CONSTRUTORA',
      chaves: [
        'dashboard:ver',
        'cadastros:ver',
        'eng:ver',
        'eng:orcamento:editar',
        'eng:medicoes:editar',
        'eng:contratos:editar',
        'eng:acompanhamento:ver',
        'admin:ver',
        'admin:tenant:usuarios:gerenciar',
        'admin:tenant:perfis:gerenciar',
      ],
    },
    {
      nome: 'Fiador - Master',
      descricao: 'Admin delegado do fiador (gerencia usuários e perfis do próprio escopo)',
      tipoEscopo: 'FIADOR',
      chaves: [
        'dashboard:ver',
        'fin:ver',
        'aprovacoes:fiador:ver',
        'aprovacoes:fiador:aprovar',
        'admin:ver',
        'admin:tenant:usuarios:gerenciar',
        'admin:tenant:perfis:gerenciar',
      ],
    },
    {
      nome: 'Fiador - Aprovador',
      descricao: 'Usuário do fiador com alçada de aprovação financeira',
      tipoEscopo: 'FIADOR',
      chaves: [
        'dashboard:ver',
        'fin:ver',
        'aprovacoes:fiador:ver',
        'aprovacoes:fiador:aprovar',
      ],
    },
    {
      nome: 'Fiador - Visualizador',
      descricao: 'Usuário do fiador apenas para visualização',
      tipoEscopo: 'FIADOR',
      chaves: [
        'dashboard:ver',
        'fin:ver',
        'aprovacoes:fiador:ver',
      ],
    },
  ]

  const perfisCriados: Record<string, string> = {}

  for (const perfilData of perfisPadrao) {
    const existente = await prisma.perfil.findUnique({ where: { nome: perfilData.nome } })
    let perfilId: string

    if (!existente) {
      const criado = await prisma.perfil.create({
        data: { nome: perfilData.nome, descricao: perfilData.descricao, tipoEscopo: perfilData.tipoEscopo },
      })
      perfilId = criado.id
    } else {
      perfilId = existente.id
      await prisma.perfil.update({
        where: { id: perfilId },
        data: { descricao: perfilData.descricao, tipoEscopo: perfilData.tipoEscopo },
      })
    }

    perfisCriados[perfilData.nome] = perfilId

    // Sincronizar permissões do perfil
    await prisma.perfilPermissao.deleteMany({ where: { perfilId } })
    const permissoesDB = await prisma.permissao.findMany({
      where: { chave: { in: perfilData.chaves } },
    })
    await prisma.perfilPermissao.createMany({
      data: permissoesDB.map((p) => ({ perfilId, permissaoId: p.id })),
    })
  }
  console.log(`  ✅ ${perfisPadrao.length} perfis padrão sincronizados`)

  // 3. Criar usuários de teste (se não existirem)
  const usuariosTeste = [
    { nome: 'Administrador', email: 'admin@pontte.com', senha: 'admin123', perfil: 'Admin' },
    { nome: 'Administrador Global', email: 'admin.global@pontte.com', senha: 'Global@123', perfil: 'Admin' },
    { nome: 'Engenheiro Teste', email: 'eng@pontte.com', senha: 'eng123', perfil: 'Engenharia' },
    { nome: 'Financeiro Teste', email: 'fin@pontte.com', senha: 'fin123', perfil: 'Financeiro' },
    { nome: 'Aprovador Técnico', email: 'apr-tec@pontte.com', senha: 'apr123', perfil: 'Aprovador Técnico' },
    { nome: 'Aprovador Financeiro', email: 'apr-fin@pontte.com', senha: 'apr123', perfil: 'Aprovador Financeiro' },
  ]

  for (const u of usuariosTeste) {
    const existente = await prisma.usuario.findUnique({ where: { email: u.email } })
    if (!existente) {
      const senhaHash = await bcrypt.hash(u.senha, 10)
      await prisma.usuario.create({
        data: {
          nome: u.nome,
          email: u.email,
          senha: senhaHash,
          perfilId: perfisCriados[u.perfil],
          status: 'ATIVO',
        },
      })
    }
  }
  console.log(`  ✅ Usuários de teste verificados`)
  console.log('  📋 Credenciais de teste:')
  console.log('     admin@pontte.com    / admin123')
  console.log('     admin.global@pontte.com / Global@123')
  console.log('     eng@pontte.com      / eng123')
  console.log('     fin@pontte.com      / fin123')
  console.log('     apr-tec@pontte.com  / apr123')
  console.log('     apr-fin@pontte.com  / apr123')

  // --------------------------------------------------------
  // Dados de negócio (construtora, credores, etc.)
  // --------------------------------------------------------
  
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
  
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function criarContasDRE_DEPRECATED(prisma: PrismaClient, planoContasId: string) {
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
