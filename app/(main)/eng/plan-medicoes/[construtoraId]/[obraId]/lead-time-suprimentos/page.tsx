import { db as prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import LeadTimeSuprimentosContent from './LeadTimeSuprimentosContent';

interface PageProps {
  params: Promise<{
    construtoraId: string;
    obraId: string;
  }>;
}

export default async function LeadTimeSuprimentosPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { obraId } = resolvedParams;

  // Buscar obra
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    select: {
      id: true,
      nome: true,
      codigo: true,
    },
  });

  if (!obra) {
    notFound();
  }

  // Buscar versão ativa de categorização
  const versaoCategorizacao = await prisma.versaoCategorizacao.findFirst({
    where: {
      obraId: obraId,
      status: 'ATIVA',
    },
    select: {
      id: true,
      nome: true,
      numero: true,
      numeroRevisao: true,
    },
  });

  // Se não houver categorização ativa, exibir mensagem
  if (!versaoCategorizacao) {
    return (
      <div className="p-8">
        <div className="bg-amber-900 border border-amber-800 rounded-lg p-4">
          <p className="text-amber-300">
            Nenhuma versão de categorização ativa encontrada para esta obra.
            Por favor, crie e ative uma categorização primeiro.
          </p>
        </div>
      </div>
    );
  }

  // Formatar nome da versão de categorização
  const nomeVersaoCategorizacao = versaoCategorizacao.numeroRevisao > 0
    ? `${versaoCategorizacao.nome} - Revisão ${versaoCategorizacao.numeroRevisao.toString().padStart(2, '0')}`
    : versaoCategorizacao.nome;

  return (
    <LeadTimeSuprimentosContent 
      params={resolvedParams} 
      obra={obra}
      versaoCategorizacao={{
        id: versaoCategorizacao.id,
        nome: nomeVersaoCategorizacao,
        numero: versaoCategorizacao.numero,
      }}
    />
  );
}
