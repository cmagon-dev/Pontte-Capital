import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ROTAS_PERMISSOES: Record<string, string[]> = {
  '/aprovacoes/engenharia': ['aprovacoes:engenharia:ver'],
  '/aprovacoes/financeiro': ['aprovacoes:financeiro:ver', 'aprovacoes:fiador:ver'],
  '/fin': ['fin:ver'],
  '/eng': ['eng:ver'],
  '/admin': ['admin:ver'],
  '/cadastros': ['cadastros:ver'],
  '/dashboard': ['dashboard:ver'],
};

function getPermissoesNecessarias(pathname: string): string[] | null {
  for (const [prefixo, permissoes] of Object.entries(ROTAS_PERMISSOES)) {
    if (pathname === prefixo || pathname.startsWith(prefixo + '/')) {
      return permissoes;
    }
  }
  return null;
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const permissoesNecessarias = getPermissoesNecessarias(pathname);

    if (permissoesNecessarias) {
      const permissoes = (token.permissoes as string[]) ?? [];
      const possuiAlgumaPermissao = permissoesNecessarias.some((permissao) => permissoes.includes(permissao));
      if (!possuiAlgumaPermissao) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
