import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      perfilNome: string;
      permissoes: string[];
      tipoEscopo: string;       // GLOBAL | FUNDO | CONSTRUTORA
      fundoIds: string[];       // preenchido quando tipoEscopo = FUNDO
      construtoraIds: string[]; // preenchido quando tipoEscopo = CONSTRUTORA
      fiadorConstrutoraIds: string[]; // preenchido quando tipoEscopo = FIADOR (por construtora)
      fiadorObraIds: string[];        // preenchido quando tipoEscopo = FIADOR (por obra)
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    perfilNome: string;
    permissoes: string[];
    tipoEscopo: string;
    fundoIds: string[];
    construtoraIds: string[];
    fiadorConstrutoraIds: string[];
    fiadorObraIds: string[];
  }
}
