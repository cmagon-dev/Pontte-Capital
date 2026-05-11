'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, BarChart3, Filter, ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export default function ResumoFinanceiroPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API/banco
  const relatorios = [
    {
      id: 'RF-001',
      nome: 'Resumo Financeiro - Janeiro 2024',
      periodo: '2024-01',
      receitas: 4500000.00,
      despesas: 3100000.00,
      saldo: 1400000.00,
      dataGeracao: '2024-01-31',
    },
  ];

  const filteredRelatorios = relatorios.filter((rel) =>
    rel.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.periodo.includes(searchTerm)
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Resumo Financeiro</h1>
        <p className="text-slate-400">DRE / Budget - Relatório de Auditoria de Custos</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Relatórios</p>
          <p className="text-2xl font-bold text-white">{filteredRelatorios.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Receitas Totais</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {formatCurrency(filteredRelatorios.reduce((sum, r) => sum + r.receitas, 0))}
          </p>
        </div>
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Saldo Total</p>
          <p className="text-xl font-bold text-blue-400 font-mono">
            {formatCurrency(filteredRelatorios.reduce((sum, r) => sum + r.saldo, 0))}
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
                placeholder="ID, Nome, Período..."
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
                <th>Período</th>
                <th className="number-cell">Receitas</th>
                <th className="number-cell">Despesas</th>
                <th className="number-cell">Saldo</th>
                <th>Data Geração</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRelatorios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhum relatório encontrado
                  </td>
                </tr>
              ) : (
                filteredRelatorios.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-800">
                    <td className="font-mono text-blue-400">{rel.id}</td>
                    <td className="text-white">{rel.nome}</td>
                    <td className="text-slate-300">{rel.periodo}</td>
                    <td className="currency-cell text-green-400 font-semibold">
                      {formatCurrency(rel.receitas)}
                    </td>
                    <td className="currency-cell text-red-400 font-semibold">
                      {formatCurrency(rel.despesas)}
                    </td>
                    <td className={`currency-cell font-semibold ${
                      rel.saldo >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(rel.saldo)}
                    </td>
                    <td className="text-slate-400 text-sm">{rel.dataGeracao}</td>
                    <td>
                      <Link
                        href={`/fin/relatorios/resumo-financeiro/${rel.id}`}
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