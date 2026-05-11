'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { criarUsuario } from '@/app/actions/usuarios';
import { Eye, EyeOff, Loader2, Landmark, Building2, HardHat } from 'lucide-react';

interface Perfil {
  id: string;
  nome: string;
  tipoEscopo: string;
}

interface EntidadeVinculo {
  id: string;
  razaoSocial: string;
  codigo: string;
}

interface ObraVinculo {
  id: string;
  nome: string;
  codigo: string;
  construtoraId: string;
  construtora: { razaoSocial: string };
}

export default function NovoUsuarioForm({
  perfis,
  fundos,
  construtoras,
  obras,
}: {
  perfis: Perfil[];
  fundos: EntidadeVinculo[];
  construtoras: EntidadeVinculo[];
  obras: ObraVinculo[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfilId: perfis[0]?.id ?? '',
    status: 'ATIVO' as const,
    fundoIds: new Set<string>(),
    construtoraIds: new Set<string>(),
    fiadorConstrutoraIds: new Set<string>(),
    fiadorObraIds: new Set<string>(),
  });

  const perfilSelecionado = perfis.find((p) => p.id === form.perfilId);
  const tipoEscopo = perfilSelecionado?.tipoEscopo ?? 'GLOBAL';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErro(null);
  };

  const toggleFundo = (id: string) => {
    setForm((prev) => {
      const novo = new Set(prev.fundoIds);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return { ...prev, fundoIds: novo };
    });
  };

  const toggleConstrutora = (id: string) => {
    setForm((prev) => {
      const novo = new Set(prev.construtoraIds);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return { ...prev, construtoraIds: novo };
    });
  };

  const toggleFiadorConstrutora = (id: string) => {
    setForm((prev) => {
      const novo = new Set(prev.fiadorConstrutoraIds);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return { ...prev, fiadorConstrutoraIds: novo };
    });
  };

  const toggleFiadorObra = (id: string) => {
    setForm((prev) => {
      const novo = new Set(prev.fiadorObraIds);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return { ...prev, fiadorObraIds: novo };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const resultado = await criarUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        perfilId: form.perfilId,
        status: form.status,
        fundoIds: Array.from(form.fundoIds),
        construtoraIds: Array.from(form.construtoraIds),
        fiadorConstrutoraIds: Array.from(form.fiadorConstrutoraIds),
        fiadorObraIds: Array.from(form.fiadorObraIds),
      });
      if (resultado.sucesso) {
        router.push('/admin/usuarios');
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
            placeholder="Ex: João Silva"
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
            placeholder="joao.silva@empresa.com"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Senha <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              name="senha"
              value={form.senha}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
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
              name="perfilId"
              value={form.perfilId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
            {tipoEscopo !== 'GLOBAL' && (
              <p className="text-xs text-amber-400 mt-1">
                {tipoEscopo === 'FUNDO' && 'Vincule um ou mais fundos abaixo.'}
                {tipoEscopo === 'CONSTRUTORA' && 'Vincule uma ou mais construtoras abaixo.'}
              </p>
            )}
            {tipoEscopo === 'FIADOR' && (
              <p className="text-xs text-amber-400 mt-1">
                Vincule construtoras e/ou obras específicas do escopo do fiador.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
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

        {/* Vínculos com Fundos */}
        {tipoEscopo === 'FUNDO' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-400" />
              Fundos Vinculados
              <span className="text-slate-500 font-normal text-xs">({form.fundoIds.size} selecionado{form.fundoIds.size !== 1 ? 's' : ''})</span>
            </label>
            {fundos.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhum fundo cadastrado.</p>
            ) : (
              <div className="bg-slate-800 rounded-lg divide-y divide-slate-700">
                {fundos.map((fundo) => (
                  <label key={fundo.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.fundoIds.has(fundo.id)}
                      onChange={() => toggleFundo(fundo.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm text-slate-200">{fundo.razaoSocial}</p>
                      <p className="text-xs text-slate-500">{fundo.codigo}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vínculos com Construtoras */}
        {tipoEscopo === 'CONSTRUTORA' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Construtoras Vinculadas
              <span className="text-slate-500 font-normal text-xs">({form.construtoraIds.size} selecionada{form.construtoraIds.size !== 1 ? 's' : ''})</span>
            </label>
            {construtoras.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Nenhuma construtora cadastrada.</p>
            ) : (
              <div className="bg-slate-800 rounded-lg divide-y divide-slate-700">
                {construtoras.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.construtoraIds.has(c.id)}
                      onChange={() => toggleConstrutora(c.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm text-slate-200">{c.razaoSocial}</p>
                      <p className="text-xs text-slate-500">{c.codigo}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vínculos do escopo FIADOR */}
        {tipoEscopo === 'FIADOR' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Construtoras (escopo fiador)
                <span className="text-slate-500 font-normal text-xs">({form.fiadorConstrutoraIds.size} selecionada{form.fiadorConstrutoraIds.size !== 1 ? 's' : ''})</span>
              </label>
              <div className="bg-slate-800 rounded-lg divide-y divide-slate-700">
                {construtoras.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.fiadorConstrutoraIds.has(c.id)}
                      onChange={() => toggleFiadorConstrutora(c.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm text-slate-200">{c.razaoSocial}</p>
                      <p className="text-xs text-slate-500">{c.codigo}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-blue-400" />
                Obras específicas (escopo fiador)
                <span className="text-slate-500 font-normal text-xs">({form.fiadorObraIds.size} selecionada{form.fiadorObraIds.size !== 1 ? 's' : ''})</span>
              </label>
              <div className="bg-slate-800 rounded-lg divide-y divide-slate-700 max-h-52 overflow-auto">
                {obras.map((obra) => (
                  <label key={obra.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.fiadorObraIds.has(obra.id)}
                      onChange={() => toggleFiadorObra(obra.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm text-slate-200">{obra.codigo} - {obra.nome}</p>
                      <p className="text-xs text-slate-500">{obra.construtora.razaoSocial}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {erro && (
        <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{erro}</div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
        <button
          type="button"
          onClick={() => router.push('/admin/usuarios')}
          className="px-4 py-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
          ) : 'Criar Usuário'}
        </button>
      </div>
    </form>
  );
}
