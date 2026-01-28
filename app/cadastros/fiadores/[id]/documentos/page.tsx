import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import DocumentosContent from './DocumentosContent';

export default async function DocumentosFiadorPage({ params }: { params: { id: string } }) {
  // Verificar se o fiador existe
  const fiador = await db.fiador.findUnique({
    where: { id: params.id },
  });

  if (!fiador) {
    notFound();
  }

  // Buscar documentos do fiador
  const documentos = await db.documento.findMany({
    where: { fiadorId: params.id },
    orderBy: { dataUpload: 'desc' },
  });

  // Buscar bens do fiador
  const bens = await db.bem.findMany({
    where: { fiadorId: params.id },
    include: {
      documentos: {
        orderBy: { dataUpload: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calcular documentos vencidos
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const documentosVencidos = documentos.filter((doc) => {
    if (!doc.dataValidade) return false;
    const validade = new Date(doc.dataValidade);
    validade.setHours(0, 0, 0, 0);
    return validade < hoje;
  });

  // Calcular patrimônio total
  const totalPatrimonio = bens.reduce((sum, bem) => {
    return sum + Number(bem.valor);
  }, 0);

  // Converter bens para o formato esperado pelo componente
  const bensFormatados = bens.map((bem) => ({
    ...bem,
    valor: Number(bem.valor),
    rendaMensal: bem.rendaMensal ? Number(bem.rendaMensal) : null,
  }));

  return (
    <DocumentosContent 
      params={params} 
      documentos={documentos} 
      documentosVencidos={documentosVencidos.length}
      bens={bensFormatados}
      totalPatrimonio={totalPatrimonio}
    />
  );
}
