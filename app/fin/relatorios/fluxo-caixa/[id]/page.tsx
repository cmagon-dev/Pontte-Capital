'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function FluxoCaixaDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Fluxo de Caixa</h1>
        <p className="text-slate-400">Detalhes do Relatório ID: {params.id}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2">Saldo Atual</h3>
          <p className="text-2xl font-bold text-green-400 font-mono">R$ 5.250.000,00</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2">Próximos 30 dias</h3>
          <p className="text-2xl font-bold text-amber-400 font-mono">R$ -1.200.000,00</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm text-slate-400 mb-2">Tendência</h3>
          <TrendingDown className="w-8 h-8 text-amber-400" />
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-slate-400">Gráfico de Fluxo de Caixa será renderizado aqui</p>
      </div>
    </div>
  );
}