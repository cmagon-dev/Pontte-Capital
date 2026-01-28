import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { db } from '@/lib/db';
import { FormularioCredor } from '../FormularioCredor';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

export default async function NovoCredorPage({ params }: { params: { id: string } }) {
  // Buscar construtora
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

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/cadastros/${params.id}/credores`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Novo Credor</h1>
            <p className="text-slate-400">Cadastro de Fornecedor, Empreiteiro ou Funcionário</p>
            <p className="text-slate-500 text-sm mt-1">
              Construtora: {construtora.razaoSocial} - CNPJ: {formatarCPFouCNPJ(construtora.cnpj)}
            </p>
          </div>
        </div>
      </div>

      <FormularioCredor construtoraId={params.id} />
    </div>
  );
}
