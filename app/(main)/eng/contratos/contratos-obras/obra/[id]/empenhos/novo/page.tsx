import { notFound } from 'next/navigation';
import { buscarObraPorId } from '@/app/actions/obras';
import NovoEmpenhoForm from './NovoEmpenhoForm';

export default async function NovoEmpenhoPage({ params }: { params: { id: string } }) {
  const obra = await buscarObraPorId(params.id);

  if (!obra) {
    notFound();
  }

  return (
    <div className="p-8">
      <NovoEmpenhoForm obra={obra} />
    </div>
  );
}
