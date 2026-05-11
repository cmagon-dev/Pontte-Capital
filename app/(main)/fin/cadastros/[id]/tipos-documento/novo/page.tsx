'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { criarTipoDocumento } from '@/app/actions/tipos-documento';

export default function NovoTipoDocumentoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { alert('Informe o nome do tipo de documento.'); return; }
    setSalvando(true);
    try {
      await criarTipoDocumento(params.id, { nome, descricao: descricao || undefined });
      router.push(`/fin/cadastros/${params.id}/tipos-documento`);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar tipo de documento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/cadastros/${params.id}/tipos-documento`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Novo Tipo de Documento</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="ex: Nota Fiscal, Recibo, Contrato, Boleto..."
            required
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição opcional sobre quando usar este tipo de documento..."
            rows={3}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/fin/cadastros/${params.id}/tipos-documento`}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={salvando}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
