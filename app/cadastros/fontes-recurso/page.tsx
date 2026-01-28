import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listarFontesRecurso } from '@/app/actions/fontes-recurso';
import FontesRecursoContent from './FontesRecursoContent';

export default async function FontesRecursoPage() {
  const { data: fontes } = await listarFontesRecurso();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Fontes de Recurso</h1>
          <p className="text-slate-400">Gestão de convênios, financiamentos e recursos</p>
        </div>
        <Link
          href="/cadastros/fontes-recurso/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Fonte de Recurso
        </Link>
      </div>

      <FontesRecursoContent fontes={fontes} />
    </div>
  );
}
