import { notFound } from 'next/navigation';
import { buscarObraPorId } from '@/app/actions/obras';
import NovoAditivoForm from './NovoAditivoForm';

export default async function NovoAditivoPage({ params }: { params: { id: string } }) {
  const obra = await buscarObraPorId(params.id);

  if (!obra) {
    notFound();
  }

  return (
    <div className="p-8">
      <NovoAditivoForm obra={obra} />
    </div>
  );
}
