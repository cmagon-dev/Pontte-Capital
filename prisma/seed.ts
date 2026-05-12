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
  ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
})
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

// ----------------------------------------------------------------------------
// IMPORTANTE: este seed cria APENAS o RBAC (permissões, perfis, usuários teste).
//
// Mocks de negócio (Construtora ABC, credores, contas bancárias, plano de
// contas DRE legado etc.) foram removidos em 2026-05-12. Dados de negócio
// devem ser cadastrados via UI ou por scripts dedicados em `scripts/`.
// ----------------------------------------------------------------------------

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

  console.log('✅ Seed concluído (apenas RBAC).')
  console.log('ℹ️  Dados de negócio (construtoras, credores, bancos, obras, etc.) devem ser cadastrados via UI.')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
