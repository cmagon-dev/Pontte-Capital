import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import UsuariosTable from './UsuariosTable';
import { listarUsuarios } from '@/app/actions/usuarios';

export default async function UsuariosPage() {
  const resultado = await listarUsuarios();
  const usuarios = resultado.sucesso ? (resultado.dados ?? []) : [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Usuários do Sistema</h1>
          </div>
          <p className="text-slate-400">Gerencie os usuários e suas permissões de acesso</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </Link>
      </div>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
