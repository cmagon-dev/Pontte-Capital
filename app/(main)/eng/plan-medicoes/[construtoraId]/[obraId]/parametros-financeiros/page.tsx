import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { buscarObraPorId } from '@/app/actions/obras';
import ParametrosFinanceirosForm from './ParametrosFinanceirosForm';

export default async function ParametrosFinanceirosPage({
  params,
}: {
  params: { construtoraId: string; obraId: string };
}) {
  const obra = await buscarObraPorId(params.obraId);

  if (!obra) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Parâmetros Financeiros</h1>
          <p className="text-slate-400">
            {obra.codigo} — {obra.nome}
          </p>
        </div>
      </div>

      <ParametrosFinanceirosForm
        obraId={obra.id}
        parametrosIniciais={{
          bdi: obra.bdi != null ? Number(obra.bdi) : null,
          encargos: obra.encargos != null ? Number(obra.encargos) : null,
          indiceReajuste: obra.indiceReajuste ?? null,
          periodicidadeMedicao: obra.periodicidadeMedicao ?? null,
        }}
      />
    </div>
  );
}

