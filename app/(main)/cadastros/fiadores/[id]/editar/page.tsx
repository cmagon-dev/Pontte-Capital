import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarFiadorForm from './EditarFiadorForm';

export default async function EditarFiadorPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const fiador = await db.fiador.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!fiador) {
    notFound();
  }

  // Preparar dados para o formulário
  const initialData = {
    id: fiador.id,
    codigo: fiador.codigo,
    tipo: fiador.tipo as 'PF' | 'PJ',
    nome: fiador.nome,
    cpfCnpj: fiador.cpfCnpj,
    rg: fiador.rg || '',
    estadoCivil: fiador.estadoCivil || '',
    dataNascimento: fiador.dataNascimento 
      ? new Date(fiador.dataNascimento).toISOString().split('T')[0]
      : '',
    nomeFantasia: fiador.nomeFantasia || '',
    inscricaoEstadual: fiador.inscricaoEstadual || '',
    endereco: fiador.endereco || '',
    cidade: fiador.cidade || '',
    estado: fiador.estado || '',
    cep: fiador.cep || '',
    telefone: fiador.telefone || '',
    email: fiador.email || '',
    aprovadorFinanceiro: fiador.aprovadorFinanceiro,
  };

  return <EditarFiadorForm initialData={initialData} />;
}
