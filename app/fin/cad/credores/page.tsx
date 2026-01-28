'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users, Filter, ClipboardList, Building2 } from 'lucide-react';

export default function CredoresPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API/banco
  const credores = [
    {
      id: 'CRED-001',
      nome: 'Fornecedor ABC Ltda',
      tipo: 'Fornecedor',
      cnpj: '12.345.678/0001-90',
      status: 'Ativo',
      totalPendente: 45000.00,
    },
  ];

  const filteredCredores = credores.filter((credor) =>
    credor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credor.cnpj.includes(searchTerm) ||
    credor.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Credores</h1>
        <p className="text-slate-400">Cadastro Unificado de Fornecedores, Empreiteiros e Funcionários</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Credores</p>
          <p className="text-2xl font-bold text-white">{filteredCredores.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Credores Ativos</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredCredores.filter((c) => c.status === 'Ativo').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total Pendente</p>
          <p className="text-xl font-bold text-amber-400 font-mono">
            R$ {filteredCredores.reduce((sum, c) => sum + c.totalPendente, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                placeholder="Nome, CNPJ, Tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Credores */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>CNPJ/CPF</th>
                <th>Status</th>
                <th className="number-cell">Valor Pendente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhum credor encontrado
                  </td>
                </tr>
              ) : (
                filteredCredores.map((credor) => (
                  <tr key={credor.id} className="hover:bg-slate-800">
                    <td>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <p className="font-medium text-white">{credor.nome}</p>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-400">{credor.tipo}</span>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm font-mono">{credor.cnpj}</p>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        credor.status === 'Ativo' 
                          ? 'bg-green-900 text-green-400' 
                          : 'bg-red-900 text-red-400'
                      }`}>
                        {credor.status}
                      </span>
                    </td>
                    <td className="number-cell">
                      <p className="text-white font-mono">
                        R$ {credor.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td>
                      <Link
                        href={`/fin/cad/credores/${credor.id}`}
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