'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FluxoFinanceiroProjetadoPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Fluxo Financeiro Projetado</h1>
            <p className="text-slate-400">Projeção e análise do fluxo de caixa da obra</p>
          </div>
        </div>
      </div>

      {/* Conteúdo será desenvolvido posteriormente */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-400">Conteúdo em desenvolvimento...</p>
      </div>
    </div>
  );
}
