import { notFound } from 'next/navigation';
import { buscarEmpenhoPorId } from '@/app/actions/empenhos';
import { db } from '@/lib/db';
import EditarEmpenhoForm from './EditarEmpenhoForm';

export default async function EditarEmpenhoPage({
  params,
}: {
  params: { id: string; empenhoId: string };
}) {
  const empenho = await buscarEmpenhoPorId(params.empenhoId);

  if (!empenho) {
    notFound();
  }

  // Buscar documentos do empenho
  const documentos = await db.documento.findMany({
    where: { empenhoId: params.empenhoId },
    orderBy: { createdAt: 'desc' },
  });

  // Converter Decimal para Number
  const empenhoFormatado = {
    ...empenho,
    valor: Number(empenho.valor),
    saldoAtual: Number(empenho.saldoAtual),
    alertaMinimo: empenho.alertaMinimo ? Number(empenho.alertaMinimo) : null,
  };

  return (
    <div className="p-8">
      <EditarEmpenhoForm empenho={empenhoFormatado} initialDocumentos={documentos} />
    </div>
  );
}
