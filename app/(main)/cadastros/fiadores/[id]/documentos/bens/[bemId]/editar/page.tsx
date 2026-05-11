import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarBemForm from './EditarBemForm';

export default async function EditarBemPage({ params }: { params: { id: string; bemId: string } }) {
  // Buscar bem do banco de dados
  const bem = await db.bem.findUnique({
    where: { id: params.bemId },
    include: {
      documentos: {
        orderBy: { dataUpload: 'desc' },
      },
    },
  });

  if (!bem || bem.fiadorId !== params.id) {
    notFound();
  }

  // Preparar dados iniciais para o formulário
  const initialData = {
    tipo: bem.tipo,
    descricao: bem.descricao,
    valor: bem.valor.toString(),
    rendaMensal: bem.rendaMensal?.toString() || '',
    endereco: bem.endereco || '',
    cidade: bem.cidade || '',
    estado: bem.estado || '',
    cep: bem.cep || '',
    matricula: bem.matricula || '',
    cartorio: bem.cartorio || '',
    status: bem.status,
    observacoes: bem.observacoes || '',
  };

  return (
    <EditarBemForm 
      bemId={params.bemId}
      fiadorId={params.id}
      initialData={initialData}
      documentos={bem.documentos}
    />
  );
}
