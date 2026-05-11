import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const usuario = await db.usuario.findUnique({
          where: { email: credentials.email },
          include: {
            perfil: {
              include: {
                permissoes: {
                  include: { permissao: true },
                },
              },
            },
            fundosVinculados: { select: { fundoId: true } },
            construtorasVinculadas: { select: { construtoraId: true } },
            fiadorConstrutorasVinculadas: { select: { construtoraId: true } },
            fiadorObrasVinculadas: { select: { obraId: true } },
          },
        });

        if (!usuario || !usuario.senha) return null;
        if (usuario.status !== 'ATIVO') return null;

        const senhaValida = await bcrypt.compare(credentials.senha, usuario.senha);
        if (!senhaValida) return null;

        const permissoes = usuario.perfil.permissoes.map((pp) => pp.permissao.chave);
        const tipoEscopo = usuario.perfil.tipoEscopo; // GLOBAL | FUNDO | CONSTRUTORA
        const fundoIds = usuario.fundosVinculados.map((f) => f.fundoId);
        const construtoraIds = usuario.construtorasVinculadas.map((c) => c.construtoraId);
        const fiadorConstrutoraIds = usuario.fiadorConstrutorasVinculadas.map((c) => c.construtoraId);
        const fiadorObraIds = usuario.fiadorObrasVinculadas.map((o) => o.obraId);

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfilNome: usuario.perfil.nome,
          permissoes,
          tipoEscopo,
          fundoIds,
          construtoraIds,
          fiadorConstrutoraIds,
          fiadorObraIds,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          perfilNome: string;
          permissoes: string[];
          tipoEscopo: string;
          fundoIds: string[];
          construtoraIds: string[];
          fiadorConstrutoraIds: string[];
          fiadorObraIds: string[];
        };
        token.id = u.id;
        token.perfilNome = u.perfilNome;
        token.permissoes = u.permissoes;
        token.tipoEscopo = u.tipoEscopo;
        token.fundoIds = u.fundoIds;
        token.construtoraIds = u.construtoraIds;
        token.fiadorConstrutoraIds = u.fiadorConstrutoraIds;
        token.fiadorObraIds = u.fiadorObraIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.perfilNome = token.perfilNome as string;
        session.user.permissoes = token.permissoes as string[];
        session.user.tipoEscopo = token.tipoEscopo as string;
        session.user.fundoIds = token.fundoIds as string[];
        session.user.construtoraIds = token.construtoraIds as string[];
        session.user.fiadorConstrutoraIds = token.fiadorConstrutoraIds as string[];
        session.user.fiadorObraIds = token.fiadorObraIds as string[];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
