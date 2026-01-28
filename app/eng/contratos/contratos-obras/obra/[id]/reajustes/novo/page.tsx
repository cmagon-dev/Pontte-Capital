import { notFound } from 'next/navigation';
import { buscarObraPorId } from '@/app/actions/obras';
import NovoReajusteForm from './NovoReajusteForm';

export default async function NovoReajustePage({ params }: { params: { id: string } }) {
  const obra = await buscarObraPorId(params.id);

  if (!obra) {
    notFound();
  }

  return (
    <div className="p-8">
      <NovoReajusteForm obra={obra} />
    </div>
  );
}
