'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { criarPerfil, atualizarPerfil } from '@/app/actions/perfis';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIAS_PERMISSOES } from '@/lib/permissoes';

interface PermissaoItem {
  id: string;
  chave: string;
  descricao: string;
  categoria: string;
}

interface PerfilFormProps {
  permissoes: PermissaoItem[];
  perfil?: {
    id: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    permissoes: { permissao: { chave: string } }[];
  };
}

export default function PerfilForm({ permissoes, perfil }: PerfilFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(CATEGORIAS_PERMISSOES as unknown as string[]);

  const chavesIniciais = perfil?.permissoes.map((pp) => pp.permissao.chave) ?? [];

  const [form, setForm] = useState({
    nome: perfil?.nome ?? '',
    descricao: perfil?.descricao ?? '',
    ativo: perfil?.ativo ?? true,
    tipoEscopo: (perfil as { tipoEscopo?: string } | undefined)?.tipoEscopo ?? 'GLOBAL',
    permissoesSelecionadas: new Set<string>(chavesIniciais),
  });

  const toggleCategoria = (cat: string) => {
    setCategoriasAbertas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const togglePermissao = (chave: string) => {
    setForm((prev) => {
      const novo = new Set(prev.permissoesSelecionadas);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return { ...prev, permissoesSelecionadas: novo };
    });
  };

  const toggleCategoriaToda = (cat: string, chavesCategoria: string[]) => {
    const todasSelecionadas = chavesCategoria.every((c) => form.permissoesSelecionadas.has(c));
    setForm((prev) => {
      const novo = new Set(prev.permissoesSelecionadas);
      chavesCategoria.forEach((c) => {
        if (todasSelecionadas) novo.delete(c);
        else novo.add(c);
      });
      return { ...prev, permissoesSelecionadas: novo };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const data = {
        nome: form.nome,
        descricao: form.descricao || undefined,
        ativo: form.ativo,
        tipoEscopo: form.tipoEscopo,
        permissoes: Array.from(form.permissoesSelecionadas),
      };

      const resultado = perfil
        ? await atualizarPerfil(perfil.id, data)
        : await criarPerfil(data);

      if (resultado.sucesso) {
        router.push('/admin/parametros/perfis');
        router.refresh();
      } else {
        setErro(resultado.erro || 'Erro desconhecido');
      }
    });
  };

  const permissoesPorCategoria = CATEGORIAS_PERMISSOES.reduce<Record<string, PermissaoItem[]>>(
    (acc, cat) => {
      acc[cat] = permissoes.filter((p) => p.categoria === cat);
      return acc;
    },
    {}
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Nome do Perfil <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            placeholder="Ex: Aprovador Financeiro"
            required
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Descrição
          </label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
            placeholder="Descreva brevemente as responsabilidades deste perfil"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Tipo de Escopo <span className="text-red-400">*</span>
          </label>
          <select
            value={form.tipoEscopo}
            onChange={(e) => setForm((p) => ({ ...p, tipoEscopo: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="GLOBAL">Global — acesso irrestrito (Pontte / Interno)</option>
            <option value="FUNDO">Fundo — restrito ao(s) fundo(s) vinculado(s)</option>
            <option value="CONSTRUTORA">Construtora — restrito à(s) construtora(s) vinculada(s)</option>
            <option value="FIADOR">Fiador — restrito à(s) obra(s)/construtora(s) vinculada(s)</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {form.tipoEscopo === 'GLOBAL' && 'Usuários com este perfil veem dados de todas as obras e operações.'}
            {form.tipoEscopo === 'FUNDO' && 'Usuários verão apenas obras/operações do fundo vinculado à conta deles.'}
            {form.tipoEscopo === 'CONSTRUTORA' && 'Usuários verão apenas obras da construtora vinculada à conta deles.'}
            {form.tipoEscopo === 'FIADOR' && 'Usuários verão apenas operações das obras/construtoras vinculadas para aprovação de fiador.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            checked={form.ativo}
            onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="ativo" className="text-sm text-slate-300">Perfil ativo</label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          Permissões
          <span className="ml-2 text-xs text-slate-500">
            ({form.permissoesSelecionadas.size} selecionadas)
          </span>
        </h3>

        <div className="space-y-2">
          {CATEGORIAS_PERMISSOES.map((cat) => {
            const itens = permissoesPorCategoria[cat] ?? [];
            if (itens.length === 0) return null;
            const aberta = categoriasAbertas.includes(cat);
            const chavesCategoria = itens.map((p) => p.chave);
            const todasSelecionadas = chavesCategoria.every((c) => form.permissoesSelecionadas.has(c));
            const algumasSelecionadas = chavesCategoria.some((c) => form.permissoesSelecionadas.has(c));

            return (
              <div key={cat} className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-200 flex-1"
                  >
                    {aberta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {cat}
                    <span className="text-xs text-slate-500 font-normal">
                      ({chavesCategoria.filter((c) => form.permissoesSelecionadas.has(c)).length}/{itens.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategoriaToda(cat, chavesCategoria)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      todasSelecionadas
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : algumasSelecionadas
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {todasSelecionadas ? 'Desmarcar todas' : 'Marcar todas'}
                  </button>
                </div>

                {aberta && (
                  <div className="border-t border-slate-700 divide-y divide-slate-700/50">
                    {itens.map((perm) => (
                      <label
                        key={perm.chave}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissoesSelecionadas.has(perm.chave)}
                          onChange={() => togglePermissao(perm.chave)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm text-slate-200">{perm.descricao}</p>
                          <p className="text-xs text-slate-500 font-mono">{perm.chave}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {erro && (
        <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {erro}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
        <button
          type="button"
          onClick={() => router.push('/admin/parametros/perfis')}
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
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            perfil ? 'Salvar Alterações' : 'Criar Perfil'
          )}
        </button>
      </div>
    </form>
  );
}
