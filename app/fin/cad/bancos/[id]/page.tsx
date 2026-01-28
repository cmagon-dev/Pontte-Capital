'use client';

import { Banknote } from 'lucide-react';

export default function BancosDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Bancos</h1>
        <p className="text-slate-400">Cadastro das Contas Bancárias (Carteiras) de onde o dinheiro sai</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-slate-400">Configuração de saldo inicial e integração com Open Finance</p>
        <p className="text-slate-400 mt-2">ID: {params.id}</p>
      </div>
    </div>
  );
}