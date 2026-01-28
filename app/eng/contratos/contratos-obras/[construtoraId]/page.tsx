import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import ContratosObrasConstrutoraContent from './ContratosObrasConstrutoraContent';

export default async function ContratosObrasPorConstrutoraPage({ 
  params 
}: { 
  params: { construtoraId: string } 
}) {
  // Buscar construtora e suas obras do banco
  const [construtora, obras] = await Promise.all([
    db.construtora.findUnique({
      where: { id: params.construtoraId },
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true,
      },
    }),
    db.obra.findMany({
      where: { construtoraId: params.construtoraId },
      orderBy: { createdAt: 'desc' },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
        contratante: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
      },
    }),
  ]);

  if (!construtora) {
    notFound();
  }

  // Formatar dados para o componente client
  const obrasFormatadas = obras.map(obra => ({
    id: obra.id,
    codigo: obra.codigo,
    nome: obra.nome,
    valorContrato: Number(obra.valorContrato),
    dataInicio: obra.dataInicio?.toISOString() || null,
    dataFim: obra.dataFim?.toISOString() || null,
    endereco: obra.endereco,
    cidade: obra.cidade,
    estado: obra.estado,
    status: obra.status,
    contratante: obra.contratante?.razaoSocial || '-',
  }));

  return (
    <ContratosObrasConstrutoraContent 
      construtora={construtora}
      obras={obrasFormatadas}
    />
  );
}
