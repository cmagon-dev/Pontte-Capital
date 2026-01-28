'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Banknote, MapPin } from 'lucide-react';
import { excluirFonteRecurso } from '@/app/actions/fontes-recurso';
import { useRouter } from 'next/navigation';

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  esfera: string;
  orgao: string | null;
  instituicao: string | null;
  numeroProcesso: string | null;
  status: string;
}

interface Props {
  fontes: FonteRecurso[];
}

export default function FontesRecursoContent({ fontes }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEsfera, setFilterEsfera] = useState('');

  const filteredFontes = fontes.filter(fonte => {
    const matchSearch = fonte.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       fonte.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (fonte.numeroProcesso && fonte.numeroProcesso.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = !filterTipo || fonte.tipo === filterTipo;
    const matchEsfera = !filterEsfera || fonte.esfera === filterEsfera;
    
    return matchSearch && matchTipo && matchEsfera;
  });

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a fonte "${nome}"?`)) return;

    const result = await excluirFonteRecurso(id);

    if (result.success) {
      alert('Fonte de recurso excluída com sucesso!');
      router.refresh();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-green-900 text-green-400';
      case 'EM_ANDAMENTO':
        return 'bg-blue-900 text-blue-400';
      case 'CONCLUIDO':
        return 'bg-slate-700 text-slate-300';
      case 'CANCELADO':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'CONVENIO':
        return 'Convênio';
      case 'FINANCIAMENTO':
        return 'Financiamento';
      case 'PROPRIO':
        return 'Recurso Próprio';
      case 'MISTO':
        return 'Misto';
      default:
        return tipo;
    }
  };

  return (
    <>
      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, código ou número de processo..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="CONVENIO">Convênio</option>
              <option value="FINANCIAMENTO">Financiamento</option>
              <option value="PROPRIO">Recurso Próprio</option>
              <option value="MISTO">Misto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Esfera</label>
            <select
              value={filterEsfera}
              onChange={(e) => setFilterEsfera(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="FEDERAL">Federal</option>
              <option value="ESTADUAL">Estadual</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="PRIVADO">Privado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Total de Fontes</p>
            <Banknote className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{filteredFontes.length}</p>
        </div>

        <div className="bg-slate-900 border border-green-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Fontes Ativas</p>
            <Banknote className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">
            {filteredFontes.filter(f => f.status === 'ATIVO').length}
          </p>
        </div>

        <div className="bg-slate-900 border border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Em Andamento</p>
            <Banknote className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {filteredFontes.filter(f => f.status === 'EM_ANDAMENTO').length}
          </p>
        </div>
      </div>

      {/* Lista de Fontes */}
      {filteredFontes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <Banknote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma fonte encontrada</h3>
          <p className="text-slate-400 mb-6">
            {searchTerm || filterTipo || filterEsfera
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Comece cadastrando sua primeira fonte de recurso'}
          </p>
          {!searchTerm && !filterTipo && !filterEsfera && (
            <Link
              href="/cadastros/fontes-recurso/novo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nova Fonte de Recurso
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFontes.map((fonte) => {
            return (
              <div
                key={fonte.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-blue-400 font-mono font-semibold">{fonte.codigo}</span>
                      <h3 className="text-xl font-bold text-white">{fonte.nome}</h3>
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(fonte.status)}`}>
                        {fonte.status === 'ATIVO' && 'Ativo'}
                        {fonte.status === 'EM_ANDAMENTO' && 'Em Andamento'}
                        {fonte.status === 'CONCLUIDO' && 'Concluído'}
                        {fonte.status === 'CANCELADO' && 'Cancelado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Banknote className="w-4 h-4" />
                        {getTipoLabel(fonte.tipo)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {fonte.esfera}
                      </span>
                      {fonte.numeroProcesso && <span>Processo: {fonte.numeroProcesso}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/cadastros/fontes-recurso/${fonte.id}/editar`}
                      className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(fonte.id, fonte.nome)}
                      className="p-2 hover:bg-slate-800 rounded-lg text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Tipo</p>
                    <p className="text-sm text-white font-medium">
                      {getTipoLabel(fonte.tipo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      {fonte.tipo === 'CONVENIO' ? 'Órgão' : 'Instituição'}
                    </p>
                    <p className="text-sm text-white font-medium">
                      {fonte.orgao || fonte.instituicao || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Esfera</p>
                    <p className="text-sm text-white font-medium">
                      {fonte.esfera}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
