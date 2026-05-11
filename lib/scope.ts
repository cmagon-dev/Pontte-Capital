import { Session } from 'next-auth';

/**
 * Retorna o filtro Prisma para `where` em queries de Obra ou Operacao,
 * respeitando o tipoEscopo do usuário logado.
 *
 * - GLOBAL: sem filtro (vê tudo — usuários Pontte)
 * - CONSTRUTORA: filtra por construtoraId
 * - FUNDO: filtra obras que têm VinculoFundo para o(s) fundo(s) do usuário
 *
 * Para Operacao, o campo é diretamente construtoraId (igual ao de Obra).
 * Para Medicao, o filtro vai no relacionamento obra: { ... }
 */
export function getObraScopeFilter(session: Session): Record<string, unknown> {
  const { tipoEscopo, fundoIds, construtoraIds, fiadorConstrutoraIds, fiadorObraIds } = session.user;

  if (tipoEscopo === 'GLOBAL') return {};

  if (tipoEscopo === 'CONSTRUTORA') {
    if (!construtoraIds.length) return nenhum();
    return { construtoraId: { in: construtoraIds } };
  }

  if (tipoEscopo === 'FUNDO') {
    if (!fundoIds.length) return nenhum();
    // Obra tem VinculoFundo (1:1). Filtra obras cujo fundo vinculado
    // está na lista de fundos do usuário.
    return {
      vinculoFundo: { fundoId: { in: fundoIds } },
    };
  }

  if (tipoEscopo === 'FIADOR') {
    const filtros: Record<string, unknown>[] = [];
    if (fiadorConstrutoraIds.length > 0) {
      filtros.push({ construtoraId: { in: fiadorConstrutoraIds } });
    }
    if (fiadorObraIds.length > 0) {
      filtros.push({ id: { in: fiadorObraIds } });
    }
    if (filtros.length === 0) return nenhum();
    if (filtros.length === 1) return filtros[0];
    return { OR: filtros };
  }

  return nenhum();
}

/**
 * Filtro para Operacao: usa construtoraId diretamente (igual a Obra)
 * ou, para escopo FUNDO, navega pela obra.
 */
export function getOperacaoScopeFilter(session: Session): Record<string, unknown> {
  const { tipoEscopo, fundoIds, construtoraIds, fiadorConstrutoraIds, fiadorObraIds } = session.user;

  if (tipoEscopo === 'GLOBAL') return {};

  if (tipoEscopo === 'CONSTRUTORA') {
    if (!construtoraIds.length) return nenhum();
    return { construtoraId: { in: construtoraIds } };
  }

  if (tipoEscopo === 'FUNDO') {
    if (!fundoIds.length) return nenhum();
    return {
      obra: { vinculoFundo: { fundoId: { in: fundoIds } } },
    };
  }

  if (tipoEscopo === 'FIADOR') {
    const filtros: Record<string, unknown>[] = [];
    if (fiadorConstrutoraIds.length > 0) {
      filtros.push({ construtoraId: { in: fiadorConstrutoraIds } });
    }
    if (fiadorObraIds.length > 0) {
      filtros.push({ obraId: { in: fiadorObraIds } });
    }
    if (filtros.length === 0) return nenhum();
    if (filtros.length === 1) return filtros[0];
    return { OR: filtros };
  }

  return nenhum();
}

/**
 * Filtro para Medicao: navega via obra.
 */
export function getMedicaoScopeFilter(session: Session): Record<string, unknown> {
  const { tipoEscopo, fundoIds, construtoraIds, fiadorConstrutoraIds, fiadorObraIds } = session.user;

  if (tipoEscopo === 'GLOBAL') return {};

  if (tipoEscopo === 'CONSTRUTORA') {
    if (!construtoraIds.length) return nenhum();
    return { obra: { construtoraId: { in: construtoraIds } } };
  }

  if (tipoEscopo === 'FUNDO') {
    if (!fundoIds.length) return nenhum();
    return {
      obra: { vinculoFundo: { fundoId: { in: fundoIds } } },
    };
  }

  if (tipoEscopo === 'FIADOR') {
    const filtros: Record<string, unknown>[] = [];
    if (fiadorConstrutoraIds.length > 0) {
      filtros.push({ obra: { construtoraId: { in: fiadorConstrutoraIds } } });
    }
    if (fiadorObraIds.length > 0) {
      filtros.push({ obraId: { in: fiadorObraIds } });
    }
    if (filtros.length === 0) return nenhum();
    if (filtros.length === 1) return filtros[0];
    return { OR: filtros };
  }

  return nenhum();
}

/** Retorna um filtro que nunca encontra nada (fallback seguro). */
function nenhum(): Record<string, unknown> {
  return { id: '__nenhum__' };
}
