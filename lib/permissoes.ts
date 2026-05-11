export const PERMISSOES = {
  // Dashboard
  'dashboard:ver': { descricao: 'Ver dashboard', categoria: 'Dashboard' },
  // Cadastros
  'cadastros:ver': { descricao: 'Ver cadastros', categoria: 'Cadastros' },
  'cadastros:editar': { descricao: 'Criar e editar cadastros', categoria: 'Cadastros' },
  // Engenharia
  'eng:ver': { descricao: 'Ver módulo Engenharia', categoria: 'Engenharia' },
  'eng:orcamento:editar': { descricao: 'Criar e editar orçamentos', categoria: 'Engenharia' },
  'eng:medicoes:editar': { descricao: 'Criar e editar medições', categoria: 'Engenharia' },
  'eng:contratos:editar': { descricao: 'Criar e editar contratos', categoria: 'Engenharia' },
  'eng:acompanhamento:ver': { descricao: 'Ver acompanhamento de obras', categoria: 'Engenharia' },
  // Financeiro
  'fin:ver': { descricao: 'Ver módulo Financeiro', categoria: 'Financeiro' },
  'fin:operacoes:criar': { descricao: 'Criar operações financeiras', categoria: 'Financeiro' },
  'fin:operacoes:editar': { descricao: 'Editar operações financeiras', categoria: 'Financeiro' },
  'fin:cadastros:editar': { descricao: 'Gerenciar cadastros financeiros', categoria: 'Financeiro' },
  // Aprovações Técnicas (Equipe Pontte/Engenharia)
  'aprovacoes:engenharia:ver': { descricao: 'Ver fila de aprovações técnicas', categoria: 'Aprovações' },
  'aprovacoes:engenharia:aprovar': { descricao: 'Aprovar/rejeitar itens técnicos', categoria: 'Aprovações' },
  // Aprovações Financeiras (Equipe Fundo)
  'aprovacoes:financeiro:ver': { descricao: 'Ver fila de aprovações financeiras', categoria: 'Aprovações' },
  'aprovacoes:financeiro:aprovar': { descricao: 'Aprovar/rejeitar operações financeiras', categoria: 'Aprovações' },
  // Aprovações de Fiador
  'aprovacoes:fiador:ver': { descricao: 'Ver fila de aprovações financeiras como fiador', categoria: 'Aprovações' },
  'aprovacoes:fiador:aprovar': { descricao: 'Aprovar/rejeitar operações financeiras como fiador', categoria: 'Aprovações' },
  // Admin
  'admin:ver': { descricao: 'Ver painel de administração', categoria: 'Admin' },
  'admin:usuarios:gerenciar': { descricao: 'Gerenciar usuários', categoria: 'Admin' },
  'admin:perfis:gerenciar': { descricao: 'Gerenciar perfis e permissões', categoria: 'Admin' },
  'admin:tenant:usuarios:gerenciar': { descricao: 'Gerenciar usuários apenas do próprio escopo', categoria: 'Admin' },
  'admin:tenant:perfis:gerenciar': { descricao: 'Gerenciar perfis apenas do próprio escopo', categoria: 'Admin' },
} as const;

export type ChavePermissao = keyof typeof PERMISSOES;

export const CATEGORIAS_PERMISSOES = [
  'Dashboard',
  'Cadastros',
  'Engenharia',
  'Financeiro',
  'Aprovações',
  'Admin',
] as const;

export type CategoriaPermissao = (typeof CATEGORIAS_PERMISSOES)[number];

export function permissoesPorCategoria(): Record<string, { chave: ChavePermissao; descricao: string }[]> {
  const resultado: Record<string, { chave: ChavePermissao; descricao: string }[]> = {};
  for (const [chave, valor] of Object.entries(PERMISSOES)) {
    const cat = valor.categoria;
    if (!resultado[cat]) resultado[cat] = [];
    resultado[cat].push({ chave: chave as ChavePermissao, descricao: valor.descricao });
  }
  return resultado;
}
