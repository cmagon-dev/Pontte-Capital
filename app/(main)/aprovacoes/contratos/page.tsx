import { Construction, FileText } from 'lucide-react';

export const metadata = {
  title: 'Aprovações - Contratos',
};

export default function AprovacoesContratosPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações - Contratos</h1>
        <p className="text-slate-400">
          Aprovação de contratos, aditivos, reajustes e empenhos
        </p>
      </div>

      <div className="bg-slate-900 border border-amber-800/50 rounded-lg p-10 text-center">
        <div className="flex justify-center mb-4">
          <Construction className="w-16 h-16 text-amber-400" />
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Em construção</h2>
        <p className="text-slate-400 max-w-2xl mx-auto mb-6">
          Esta área será desenvolvida em um próximo módulo. Quando estiver
          pronta, vai listar contratos, aditivos, reajustes e empenhos
          aguardando aprovação — alimentados pelo banco de dados real.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <FileText className="w-4 h-4" />
          <span>Status: planejado (sem dados mockados)</span>
        </div>
      </div>
    </div>
  );
}
