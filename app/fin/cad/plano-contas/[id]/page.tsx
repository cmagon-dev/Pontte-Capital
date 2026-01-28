'use client';

import { FileText } from 'lucide-react';

export default function PlanoContasDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Plano de Contas</h1>
        <p className="text-slate-400">Espinha Dorsal da Contabilidade Gerencial (DRE)</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-slate-400">Tree Grid hierárquico (Ex: Despesas &gt; Obras &gt; Materiais &gt; Cimento)</p>
        <p className="text-slate-400 mt-2">ID: {params.id}</p>
      </div>
    </div>
  );
}