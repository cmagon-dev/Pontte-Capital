import { db } from '@/lib/db';
import NovoContratoForm from './NovoContratoForm';

export default async function NovoContratoPage({
  searchParams,
}: {
  searchParams: { construtoraId?: string };
}) {
  // Buscar construtoras, contratantes e fontes de recurso do banco
  const [construtoras, contratantes, fontesRecurso] = await Promise.all([
    db.construtora.findMany({
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
        nomeFantasia: true,
      },
      orderBy: { razaoSocial: 'asc' },
    }),
    db.contratante.findMany({
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
      },
      orderBy: { razaoSocial: 'asc' },
    }),
    db.fonteRecurso.findMany({
      select: {
        id: true,
        codigo: true,
        nome: true,
        tipo: true,
        status: true,
      },
      where: {
        status: 'ATIVO',
      },
      orderBy: { nome: 'asc' },
    }),
  ]);

  // ID da construtora pré-selecionada (se vier da URL)
  const construtoraIdPreSelecionada = searchParams.construtoraId;

  return (
    <NovoContratoForm 
      construtoras={construtoras} 
      contratantes={contratantes}
      fontesRecurso={fontesRecurso}
      construtoraIdPreSelecionada={construtoraIdPreSelecionada}
    />
  );
}
