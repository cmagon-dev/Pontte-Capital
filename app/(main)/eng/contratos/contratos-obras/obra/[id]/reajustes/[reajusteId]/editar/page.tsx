import { notFound } from 'next/navigation';
import { buscarReajustePorId } from '@/app/actions/reajustes';
import EditarReajusteForm from './EditarReajusteForm';

export default async function EditarReajustePage({ params }: { params: { id: string; reajusteId: string } }) {
  const { id: contratoId, reajusteId } = params;

  const reajuste = await buscarReajustePorId(reajusteId);

  if (!reajuste) {
    notFound();
  }

  return (
    <EditarReajusteForm
      contratoId={contratoId}
      reajuste={{
        id: reajuste.id,
        obraId: reajuste.obraId,
        dataBase: reajuste.dataBase,
        indice: reajuste.indice,
        percentual: Number(reajuste.percentual),
        valorReajuste: Number(reajuste.valorReajuste),
        dataAplicacao: reajuste.dataAplicacao,
        observacoes: reajuste.observacoes,
      }}
    />
  );
}
