import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { listarPermissoes } from '@/app/actions/perfis';
import PerfilForm from '../PerfilForm';

export default async function NovoPerfil() {
  const resultado = await listarPermissoes();
  const permissoes = resultado.sucesso ? resultado.dados! : [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/parametros/perfis"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Perfis
        </Link>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Novo Perfil</h1>
            <p className="text-slate-400 mt-1">Defina um novo perfil de acesso</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <PerfilForm permissoes={permissoes} />
      </div>
    </div>
  );
}
