'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Target, Filter, ClipboardList } from 'lucide-react';

export function ListaCentrosCusto({ centrosCusto, construtoraId }: { centrosCusto: any[], construtoraId: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCentros = centrosCusto.filter((centro) =>
    centro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    centro.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (centro.tipo && centro.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusLabel = (status: string) => {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status: string) => {
    return status === 'ATIVO' 
      ? 'bg-green-900 text-green-400' 
      : 'bg-slate-700 text-slate-300';
  };

  const getTipoLabel = (tipo: string | null) => {
    if (!tipo) return '-';
    const tipos: Record<string, string> = {
      'ADMINISTRATIVO': 'Administrativo',
      'OBRA': 'Obra',
      'DEPARTAMENTO': 'Departamento',
    };
    return tipos[tipo] || tipo;
  };

  const centrosAtivos = filteredCentros.filter((c) => c.status === 'ATIVO').length;

  return (
    <>
      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Centros</p>
          <p className="text-2xl font-bold text-white">{filteredCentros.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Centros Ativos</p>
          <p className="text-2xl font-bold text-green-400">{centrosAtivos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Nome, Código, Tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Centros de Custo */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Código</th>
                  <th className="bg-slate-900 border-b border-slate-700">Nome</th>
                  <th className="bg-slate-900 border-b border-slate-700">Tipo</th>
                  <th className="bg-slate-900 border-b border-slate-700">Descrição</th>
                  <th className="bg-slate-900 border-b border-slate-700">Nível</th>
                  <th className="bg-slate-900 border-b border-slate-700">Status</th>
                  <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCentros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum centro de custo encontrado
                    </td>
                  </tr>
                ) : (
                  filteredCentros.map((centro) => (
                    <tr key={centro.id} className="hover:bg-slate-800">
                      <td>
                        <p className="text-slate-400 text-sm font-mono">{centro.codigo}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-slate-400" />
                          <p className="font-medium text-white">{centro.nome}</p>
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-1 rounded text-xs bg-purple-900 text-purple-400">
                          {getTipoLabel(centro.tipo)}
                        </span>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{centro.descricao || '-'}</p>
                      </td>
                      <td>
                        <p className="text-slate-400 text-sm font-mono">Nível {centro.nivel}</p>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(centro.status)}`}>
                          {getStatusLabel(centro.status)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/fin/cadastros/${construtoraId}/centro-custo/${centro.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ClipboardList className="w-4 h-4" />
                          Visualizar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
