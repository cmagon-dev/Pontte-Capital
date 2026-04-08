'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { atualizarUsuario } from '@/app/actions/usuarios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

type PerfilUsuario = 'ADMIN' | 'ENGENHARIA' | 'FINANCEIRO' | 'APROVADOR';
type StatusUsuario = 'ATIVO' | 'INATIVO';

interface UsuarioData {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
}

export default function EditarUsuarioForm({ usuario }: { usuario: UsuarioData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [form, setForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    senha: '',
    perfil: usuario.perfil,
    status: usuario.status,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErro(null);
    setSucesso(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    startTransition(async () => {
      const resultado = await atualizarUsuario(usuario.id, form);
      if (resultado.sucesso) {
        setSucesso(true);
        setForm((prev) => ({ ...prev, senha: '' }));
        router.refresh();
      } else {
        setErro(resultado.erro || 'Erro desconhecido');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Nome completo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            E-mail <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Nova Senha
            <span className="text-slate-500 font-normal ml-1">(deixe em branco para manter a atual)</span>
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              name="senha"
              value={form.senha}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Perfil de Acesso <span className="text-red-400">*</span>
            </label>
            <select
              name="perfil"
              value={form.perfil}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ADMIN">Administrador</option>
              <option value="ENGENHARIA">Engenharia</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="APROVADOR">Aprovador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="p-3 bg-emerald-900/40 border border-emerald-700 rounded-lg text-emerald-300 text-sm">
          Usuário atualizado com sucesso!
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
        <button
          type="button"
          onClick={() => router.push('/admin/usuarios')}
          className="px-4 py-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Alterações'
          )}
        </button>
      </div>
    </form>
  );
}
