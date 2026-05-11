'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Banknote, Filter, ClipboardList } from 'lucide-react';

export default function BancosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API/banco
  const bancos = [
    {
      id: 'BANK-001',
      nome: 'Conta Principal',
      banco: 'Banco do Brasil',
      agencia: '1234-5',
      conta: '12345-6',
      saldo: 1500000.00,
      status: 'Ativo',
    },
  ];

  const filteredBancos = bancos.filter((banco) =>
    banco.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banco.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banco.agencia.includes(searchTerm) ||
    banco.conta.includes(searchTerm)
  );

  const totalSaldo = filteredBancos.reduce((sum, b) => sum + b.saldo, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Bancos</h1>
        <p className="text-slate-400">Cadastro das Contas Bancárias (Carteiras) de onde o dinheiro sai</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Contas</p>
          <p className="text-2xl font-bold text-white">{filteredBancos.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Contas Ativas</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredBancos.filter((b) => b.status === 'Ativo').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Saldo Total</p>
          <p className="text-xl font-bold text-green-400 font-mono">
            R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                placeholder="Nome, Banco, Agência, Conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Bancos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Banco</th>
                <th>Agência</th>
                <th>Conta</th>
                <th className="number-cell">Saldo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBancos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhuma conta bancária encontrada
                  </td>
                </tr>
              ) : (
                filteredBancos.map((banco) => (
                  <tr key={banco.id} className="hover:bg-slate-800">
                    <td>
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-slate-400" />
                        <p className="font-medium text-white">{banco.nome}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm">{banco.banco}</p>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm font-mono">{banco.agencia}</p>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm font-mono">{banco.conta}</p>
                    </td>
                    <td className="number-cell">
                      <p className="text-green-400 font-mono font-semibold">
                        R$ {banco.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        banco.status === 'Ativo' 
                          ? 'bg-green-900 text-green-400' 
                          : 'bg-red-900 text-red-400'
                      }`}>
                        {banco.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/fin/cad/bancos/${banco.id}`}
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