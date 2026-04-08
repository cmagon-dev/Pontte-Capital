'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, Pencil, Trash2, Users, ShieldCheck } from 'lucide-react';
import { excluirUsuario } from '@/app/actions/usuarios';
import { useRouter } from 'next/navigation';

type PerfilUsuario = 'ADMIN' | 'ENGENHARIA' | 'FINANCEIRO' | 'APROVADOR';
type StatusUsuario = 'ATIVO' | 'INATIVO';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  createdAt: Date;
}

const PERFIL_LABELS: Record<PerfilUsuario, string> = {
  ADMIN: 'Administrador',
  ENGENHARIA: 'Engenharia',
  FINANCEIRO: 'Financeiro',
  APROVADOR: 'Aprovador',
};

const PERFIL_COLORS: Record<PerfilUsuario, string> = {
  ADMIN: 'bg-purple-900 text-purple-300 border border-purple-700',
  ENGENHARIA: 'bg-blue-900 text-blue-300 border border-blue-700',
  FINANCEIRO: 'bg-green-900 text-green-300 border border-green-700',
  APROVADOR: 'bg-amber-900 text-amber-300 border border-amber-700',
};

export default function UsuariosTable({ usuarios }: { usuarios: Usuario[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState<PerfilUsuario | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusUsuario | ''>('');
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const filtrados = usuarios.filter((u) => {
    const matchSearch =
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPerfil = filtroPerfil ? u.perfil === filtroPerfil : true;
    const matchStatus = filtroStatus ? u.status === filtroStatus : true;
    return matchSearch && matchPerfil && matchStatus;
  });

  const handleExcluir = (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const resultado = await excluirUsuario(id);
      if (resultado.sucesso) {
        router.refresh();
      } else {
        alert(resultado.erro || 'Erro ao excluir usuário');
      }
      setDeletingId(null);
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filtroPerfil}
          onChange={(e) => setFiltroPerfil(e.target.value as PerfilUsuario | '')}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="ENGENHARIA">Engenharia</option>
          <option value="FINANCEIRO">Financeiro</option>
          <option value="APROVADOR">Aprovador</option>
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusUsuario | '')}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">E-mail</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Perfil</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Criado em</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-10 h-10 text-slate-600" />
                      <span>
                        {searchTerm || filtroPerfil || filtroStatus
                          ? 'Nenhum usuário encontrado com os filtros aplicados.'
                          : 'Nenhum usuário cadastrado ainda.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-slate-300 uppercase">
                            {usuario.nome.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-white">{usuario.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${PERFIL_COLORS[usuario.perfil]}`}>
                        <ShieldCheck className="w-3 h-3" />
                        {PERFIL_LABELS[usuario.perfil]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        usuario.status === 'ATIVO'
                          ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}>
                        {usuario.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/usuarios/${usuario.id}/editar`}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                          title="Editar usuário"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleExcluir(usuario.id, usuario.nome)}
                          disabled={isPending && deletingId === usuario.id}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
            <p className="text-xs text-slate-500">
              Exibindo {filtrados.length} de {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
