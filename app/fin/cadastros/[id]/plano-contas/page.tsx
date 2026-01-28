import Link from 'next/link';
import { ArrowLeft, Plus, Building2 } from 'lucide-react';
import { buscarPlanosContas } from '@/app/actions/plano-contas';
import { db } from '@/lib/db';
import { ListaPlanosContas } from './ListaPlanosContas';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

export default async function PlanoContasPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const construtora = await db.construtora.findUnique({
    where: { id: params.id },
  });

  if (!construtora) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">Construtora não encontrada</p>
        </div>
      </div>
    );
  }

  const planos = await buscarPlanosContas(params.id);

  const entidade = {
    id: params.id,
    nome: construtora.razaoSocial,
    tipo: 'Construtora',
    cnpj: formatarCPFouCNPJ(construtora.cnpj),
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/fin/cadastros/${params.id}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Plano de Contas - {entidade.nome}</h1>
              <p className="text-slate-400">Estrutura DRE - Demonstração do Resultado do Exercício</p>
              <p className="text-slate-500 text-sm mt-1">{entidade.tipo} - CNPJ: {entidade.cnpj}</p>
            </div>
          </div>
        </div>
        <Link
          href={`/fin/cadastros/${params.id}/plano-contas/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Plano de Contas
        </Link>
      </div>

      {/* Nota sobre DRE */}
      <div className="mb-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Plano de Contas DRE:</strong> Estruturado no formato de Demonstração do Resultado do Exercício para construção civil,
          incluindo linhas de resultado como Receita Líquida, Lucro Bruto, EBITDA, EBIT, LAIR e Lucro Líquido para análise gerencial completa.
        </p>
      </div>

      {/* Componente client-side com filtros e listagem */}
      <ListaPlanosContas planos={planos} construtoraId={params.id} />
    </div>
  );
}
