import Link from 'next/link';
import { ArrowLeft, Building2, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { buscarPlanoContasPorId, buscarContasContabeis } from '@/app/actions/plano-contas';
import { ArvoreContasDRE } from './ArvoreContasDRE';

export default async function DetalhesPlanoContasPage({ 
  params 
}: { 
  params: { id: string; planoContasId: string } 
}) {
  const plano = await buscarPlanoContasPorId(params.planoContasId);

  if (!plano) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">Plano de contas não encontrado</p>
        </div>
      </div>
    );
  }

  const contas = await buscarContasContabeis(params.planoContasId);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/fin/cadastros/${params.id}/plano-contas`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{plano.nome}</h1>
              <p className="text-slate-400">Estrutura DRE - Demonstração do Resultado do Exercício</p>
              <p className="text-slate-500 text-sm mt-1">
                Código: {plano.codigo} • {contas.length} contas cadastradas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info sobre DRE */}
      <div className="mb-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 font-semibold mb-2">Sobre a Estrutura DRE</p>
            <div className="text-sm text-blue-200 space-y-1">
              <p>• <strong>Contas Analíticas:</strong> Recebem lançamentos contábeis diretos</p>
              <p>• <strong>Contas Sintéticas:</strong> Totalizam automaticamente suas contas filhas</p>
              <p>• <strong>Linhas de Resultado:</strong> Calculadas automaticamente (Receita Líquida, Lucro Bruto, EBITDA, EBIT, LAIR, Lucro Líquido)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Legenda:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-300">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-300">Custos/Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-300">Linhas de Resultado</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300">Conta Analítica</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300">Conta Sintética</span>
          </div>
        </div>
      </div>

      {/* Árvore Hierárquica da DRE */}
      <ArvoreContasDRE contas={contas} planoId={params.planoContasId} construtoraId={params.id} />
    </div>
  );
}
