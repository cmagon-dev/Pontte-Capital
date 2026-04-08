import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import NovoUsuarioForm from './NovoUsuarioForm';

export default function NovoUsuarioPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Usuários
        </Link>
        <div className="flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Novo Usuário</h1>
            <p className="text-slate-400 mt-1">Cadastre um novo usuário no sistema</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <NovoUsuarioForm />
      </div>
    </div>
  );
}
