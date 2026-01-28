'use client';

import { Users, AlertTriangle } from 'lucide-react';

export default function CredoresDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Credores</h1>
        <p className="text-slate-400">Cadastro Unificado de Fornecedores, Empreiteiros e Funcionários</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-white font-semibold">Validação Bancária (Anti-Fraude)</span>
        </div>
        <p className="text-sm text-slate-400">
          O sistema verifica se o titular da conta bancária corresponde ao cadastro do fornecedor
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-slate-400">Detalhes do credor ID: {params.id}</p>
      </div>
    </div>
  );
}