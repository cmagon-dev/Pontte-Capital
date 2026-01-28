import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Plus, Building2 } from 'lucide-react';
import { buscarCredores } from '@/app/actions/credores';
import { db } from '@/lib/db';
import { ListaCredores } from './ListaCredores';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

export default async function CredoresPage({ params }: { params: { id: string } }) {
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

  const credores = await buscarCredores(params.id);

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
              <h1 className="text-3xl font-bold text-white mb-2">Credores - {entidade.nome}</h1>
              <p className="text-slate-400">Cadastro Unificado de Fornecedores, Empreiteiros e Funcionários</p>
              <p className="text-slate-500 text-sm mt-1">{entidade.tipo} - CNPJ: {entidade.cnpj}</p>
            </div>
          </div>
        </div>
        <Link
          href={`/fin/cadastros/${params.id}/credores/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Credor
        </Link>
      </div>

      {/* Alert sobre Validação Bancária */}
      <div className="bg-slate-900 border border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="text-white font-semibold">Validação Bancária (Anti-Fraude)</span>
        </div>
        <p className="text-sm text-slate-400">
          O sistema verifica se o titular da conta bancária corresponde ao cadastro do fornecedor
        </p>
      </div>

      {/* Componente client-side com filtros e tabela */}
      <ListaCredores credores={credores} construtoraId={params.id} />
    </div>
  );
}