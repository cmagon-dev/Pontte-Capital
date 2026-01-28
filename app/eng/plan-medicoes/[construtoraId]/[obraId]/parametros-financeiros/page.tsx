'use client';

import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function ParametrosFinanceirosPage({ 
  params 
}: { 
  params: { construtoraId: string; obraId: string } 
}) {
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
          <h1 className="text-3xl font-bold text-white mb-2">Parâmetros Financeiros</h1>
          <p className="text-slate-400">Configuração de parâmetros e indicadores financeiros</p>
        </div>
      </div>

      {/* Conteúdo em desenvolvimento */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 bg-amber-900/20 rounded-full">
            <DollarSign className="w-16 h-16 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Em Desenvolvimento</h2>
          <p className="text-slate-400 max-w-md">
            Esta funcionalidade está sendo desenvolvida. Em breve você poderá configurar 
            os parâmetros financeiros da obra.
          </p>
        </div>
      </div>
    </div>
  );
}
