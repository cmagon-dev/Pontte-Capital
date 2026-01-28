import { notFound } from 'next/navigation';
import { buscarAditivoPorId } from '@/app/actions/aditivos';
import { db } from '@/lib/db';
import EditarAditivoForm from './EditarAditivoForm';

export default async function EditarAditivoPage({ 
  params 
}: { 
  params: { id: string; aditivoId: string } 
}) {
  const [aditivo, documentos] = await Promise.all([
    buscarAditivoPorId(params.aditivoId),
    db.documento.findMany({
      where: { aditivoId: params.aditivoId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!aditivo) {
    notFound();
  }

  return (
    <div className="p-8">
      <EditarAditivoForm aditivo={aditivo} documentos={documentos} />
    </div>
  );
}
