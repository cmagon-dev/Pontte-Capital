'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, Filter, ClipboardList, TrendingUp, BarChart3 } from 'lucide-react';

export default function RelatoriosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Estrutura de listagem - será implementada posteriormente
  const relatorios = [
    { id: 'REL-001', nome: 'Fluxo de Caixa', tipo: 'Fluxo de Caixa', dataGeracao: '2024-01-31', href: '/fin/relatorios/fluxo-caixa' },
    { id: 'REL-002', nome: 'Resumo Financeiro', tipo: 'Resumo Financeiro', dataGeracao: '2024-01-31', href: '/fin/relatorios/resumo-financeiro' },
  ];

  const filteredRelatorios = relatorios.filter((rel) =>
    rel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Relatórios Financeiros</h1>
        <p className="text-slate-400">Gerenciamento de relatórios do módulo financeiro</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Relatórios</p>
          <p className="text-2xl font-bold text-white">{filteredRelatorios.length}</p>
        </div>
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Tipos de Relatório</p>
          <p className="text-2xl font-bold text-blue-400">
            {new Set(filteredRelatorios.map((r) => r.tipo)).size}
          </p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Última Geração</p>
          <p className="text-xl font-bold text-green-400 text-sm">
            {filteredRelatorios.length > 0 ? filteredRelatorios[0].dataGeracao : '-'}
          </p>
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
                placeholder="ID, Nome, Tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Relatórios */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Data Geração</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRelatorios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nenhum relatório encontrado
                  </td>
                </tr>
              ) : (
                filteredRelatorios.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-800">
                    <td className="font-mono text-blue-400">{rel.id}</td>
                    <td className="text-white">{rel.nome}</td>
                    <td>
                      <span className="px-2 py-1 rounded text-xs bg-purple-900 text-purple-400">{rel.tipo}</span>
                    </td>
                    <td className="text-slate-400 text-sm">{rel.dataGeracao}</td>
                    <td>
                      <Link
                        href={rel.href}
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
  );
}