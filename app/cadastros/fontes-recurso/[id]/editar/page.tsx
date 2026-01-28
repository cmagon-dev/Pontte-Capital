import { buscarFonteRecursoPorId } from '@/app/actions/fontes-recurso';
import { notFound } from 'next/navigation';
import EditarFonteRecursoForm from './EditarFonteRecursoForm';

export default async function EditarFonteRecursoPage({ params }: { params: { id: string } }) {
  const { data: fonte } = await buscarFonteRecursoPorId(params.id);

  if (!fonte) {
    notFound();
  }

  return <EditarFonteRecursoForm fonte={fonte} />;
}
