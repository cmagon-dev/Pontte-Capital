import { notFound } from 'next/navigation';
import { buscarObraPorId } from '@/app/actions/obras';
import { listarFiadoresDisponiveis } from '@/app/actions/vinculos';
import VincularFiadorForm from './VincularFiadorForm';

export default async function VincularFiadorPage({ params }: { params: { id: string } }) {
  const [obra, fiadores] = await Promise.all([
    buscarObraPorId(params.id),
    listarFiadoresDisponiveis(),
  ]);

  if (!obra) {
    notFound();
  }

  return (
    <VincularFiadorForm 
      obra={{
        id: obra.id,
        codigo: obra.codigo,
        nome: obra.nome,
        valorContrato: Number(obra.valorContrato),
      }}
      fiadores={fiadores}
    />
  );
}
