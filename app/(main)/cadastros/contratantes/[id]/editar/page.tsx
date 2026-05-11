import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarContratanteForm from './EditarContratanteForm';

export default async function EditarContratantePage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const contratante = await db.contratante.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!contratante) {
    notFound();
  }

  // Preparar dados para o formulário
  const initialData = {
    id: contratante.id,
    codigo: contratante.codigo,
    razaoSocial: contratante.razaoSocial,
    nomeFantasia: contratante.nomeFantasia || '',
    cnpj: contratante.cnpj,
    inscricaoEstadual: contratante.inscricaoEstadual || '',
    endereco: contratante.endereco || '',
    cidade: contratante.cidade || '',
    estado: contratante.estado || '',
    cep: contratante.cep || '',
    telefone: contratante.telefone || '',
    email: contratante.email || '',
  };

  return <EditarContratanteForm initialData={initialData} />;
}
