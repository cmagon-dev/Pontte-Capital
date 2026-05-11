import Link from 'next/link';
import { ShieldCheck, Plus, Users, CheckSquare } from 'lucide-react';
import { listarPerfis } from '@/app/actions/perfis';
import ExcluirPerfilButton from './ExcluirPerfilButton';

export default async function PerfisPage() {
  const resultado = await listarPerfis();
  const perfis = resultado.sucesso ? resultado.dados : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Perfis e Permissões</h1>
            <p className="text-slate-400 mt-1">Gerencie os perfis de acesso do sistema</p>
          </div>
        </div>
        <Link
          href="/admin/parametros/perfis/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Perfil
        </Link>
      </div>

      {!resultado.sucesso && (
        <div className="p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 mb-6">
          {resultado.erro}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {perfis!.map((perfil) => (
          <div
            key={perfil.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{perfil.nome}</h3>
                  <div className="text-[11px] text-slate-500 mb-1">Escopo: {(perfil as { tipoEscopo?: string }).tipoEscopo ?? 'GLOBAL'}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    perfil.ativo
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-700 text-slate-400 border border-slate-600'
                  }`}>
                    {perfil.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <ExcluirPerfilButton
                id={perfil.id}
                nome={perfil.nome}
                totalUsuarios={perfil._count.usuarios}
              />
            </div>

            {perfil.descricao && (
              <p className="text-sm text-slate-400 mb-4">{perfil.descricao}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                {perfil._count.permissoes} permissões
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {perfil._count.usuarios} usuários
              </span>
            </div>

            <Link
              href={`/admin/parametros/perfis/${perfil.id}`}
              className="block w-full text-center px-4 py-2 bg-slate-800 text-slate-300 text-sm rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            >
              Editar Perfil
            </Link>
          </div>
        ))}

        {perfis!.length === 0 && (
          <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum perfil cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
