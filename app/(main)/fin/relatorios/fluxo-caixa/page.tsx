'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, TrendingDown, Filter, ClipboardList } from 'lucide-react';

export default function FluxoCaixaPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API/banco
  const relatorios = [
    {
      id: 'FC-001',
      nome: 'Fluxo de Caixa - Janeiro 2024',
      periodo: '2024-01',
      saldoAtual: 5250000.00,
      proximos30Dias: -1200000.00,
      tendencia: 'Negativa',
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
        <h1 className="text-3xl font-bold text-white mb-2">Fluxo de Caixa</h1>
        <p className="text-slate-400">Visão Temporal da Saúde Financeira</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Relatórios</p>
          <p className="text-2xl font-bold text-white">{filteredRelatorios.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Saldo Total Médio</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            {filteredRelatorios.length > 0
              ? `R$ ${(filteredRelatorios.reduce((sum, r) => sum + r.saldoAtual, 0) / filteredRelatorios.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'R$ 0,00'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Tendência Dominante</p>
          <p className="text-xl font-bold text-amber-400">
            {filteredRelatorios.filter((r) => r.tendencia === 'Negativa').length > 0 ? 'Negativa' : 'Positiva'}
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
                <th className="number-cell">Saldo Atual</th>
                <th className="number-cell">Próximos 30 Dias</th>
                <th>Tendência</th>
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
                      R$ {rel.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`currency-cell font-semibold ${
                      rel.proximos30Dias >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {rel.proximos30Dias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      {rel.tendencia === 'Positiva' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </td>
                    <td className="text-slate-400 text-sm">{rel.dataGeracao}</td>
                    <td>
                      <Link
                        href={`/fin/relatorios/fluxo-caixa/${rel.id}`}
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