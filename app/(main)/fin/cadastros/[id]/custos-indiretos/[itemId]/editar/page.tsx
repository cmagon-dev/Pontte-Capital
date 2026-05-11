'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { buscarItemCustoIndireto, atualizarItemCustoIndireto } from '@/app/actions/custos-indiretos';

export default function EditarItemCustoPage({ params }: { params: { id: string; itemId: string } }) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    buscarItemCustoIndireto(params.itemId).then((item) => {
      if (!item) { alert('Item não encontrado.'); router.back(); return; }
      setNome(item.nome);
      setDescricao(item.descricao || '');
      setAtivo(item.ativo);
      setCarregando(false);
    });
  }, [params.itemId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { alert('Informe o nome do item.'); return; }
    setSalvando(true);
    try {
      await atualizarItemCustoIndireto(params.itemId, { nome, descricao: descricao || undefined, ativo });
      router.push(`/fin/cadastros/${params.id}/custos-indiretos`);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar item.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <div className="p-8 text-slate-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/cadastros/${params.id}/custos-indiretos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Editar Item de Custo Indireto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAtivo(!ativo)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              ativo ? 'bg-green-600' : 'bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              ativo ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-slate-300">{ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/fin/cadastros/${params.id}/custos-indiretos`}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
