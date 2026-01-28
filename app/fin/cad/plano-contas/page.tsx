'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, Filter, ClipboardList } from 'lucide-react';

export default function PlanoContasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API/banco
  const planosContas = [
    {
      id: 'PC-001',
      nome: 'Plano de Contas Principal',
      descricao: 'Estrutura contábil completa da empresa',
      status: 'Ativo',
      totalContas: 150,
      ultimaAtualizacao: '2024-01-15',
    },
  ];

  const filteredPlanos = planosContas.filter((plano) =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Plano de Contas</h1>
        <p className="text-slate-400">Espinha Dorsal da Contabilidade Gerencial (DRE)</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Planos</p>
          <p className="text-2xl font-bold text-white">{filteredPlanos.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Planos Ativos</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredPlanos.filter((p) => p.status === 'Ativo').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Contas</p>
          <p className="text-2xl font-bold text-blue-400">
            {filteredPlanos.reduce((sum, p) => sum + p.totalContas, 0)}
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
                placeholder="Nome, Descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Planos de Contas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Total de Contas</th>
                <th>Status</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlanos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum plano de contas encontrado
                  </td>
                </tr>
              ) : (
                filteredPlanos.map((plano) => (
                  <tr key={plano.id} className="hover:bg-slate-800">
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <p className="font-medium text-white">{plano.nome}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm">{plano.descricao}</p>
                    </td>
                    <td className="number-cell">
                      <p className="text-white font-mono">{plano.totalContas}</p>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        plano.status === 'Ativo' 
                          ? 'bg-green-900 text-green-400' 
                          : 'bg-red-900 text-red-400'
                      }`}>
                        {plano.status}
                      </span>
                    </td>
                    <td>
                      <p className="text-slate-400 text-sm">{plano.ultimaAtualizacao}</p>
                    </td>
                    <td>
                      <Link
                        href={`/fin/cad/plano-contas/${plano.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Gerenciar
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