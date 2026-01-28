'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, CheckCircle2, XCircle, Clock, Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default function AprovacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');

  // Dados mockados - em produção viria de API/banco
  const aprovacoes = [
    {
      id: 'APR-001',
      operacaoId: 'OP-001',
      numero: '001/2024',
      construtora: 'Construtora ABC Ltda',
      obra: '001/2024 - Reforma e Ampliação da Escola Municipal Santa Rita',
      valor: 45000.00,
      dataSolicitacao: '2024-01-15',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
    },
    {
      id: 'APR-002',
      operacaoId: 'OP-004',
      numero: '004/2024',
      construtora: 'Construtora ABC Ltda',
      obra: '001/2024 - Reforma e Ampliação da Escola Municipal Santa Rita',
      valor: 35000.00,
      dataSolicitacao: '2024-01-22',
      status: 'Aprovada',
      solicitante: 'Eng. Maria Santos',
      aprovador: 'Eng. Carlos Mendes',
      dataAprovacao: '2024-01-23',
    },
  ];

  const statusOptions = [
    { id: 'todas', nome: 'Todas' },
    { id: 'Pendente', nome: 'Pendente' },
    { id: 'Aprovada', nome: 'Aprovada' },
    { id: 'Rejeitada', nome: 'Rejeitada' },
  ];

  const filteredAprovacoes = aprovacoes.filter((apr) => {
    const matchSearch =
      apr.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apr.construtora.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apr.obra.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todas' || apr.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações</h1>
        <p className="text-slate-400">Workflow de aprovação de operações financeiras</p>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Número, Construtora, Obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Aprovações */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-900 border-b border-slate-700">Número</th>
                <th className="bg-slate-900 border-b border-slate-700">Construtora</th>
                <th className="bg-slate-900 border-b border-slate-700">Obra</th>
                <th className="bg-slate-900 border-b border-slate-700 number-cell">Valor</th>
                <th className="bg-slate-900 border-b border-slate-700">Data Solicitação</th>
                <th className="bg-slate-900 border-b border-slate-700">Status</th>
                <th className="bg-slate-900 border-b border-slate-700">Solicitante</th>
                <th className="bg-slate-900 border-b border-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAprovacoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma aprovação encontrada
                  </td>
                </tr>
              ) : (
                filteredAprovacoes.map((apr) => {
                  const getStatusColor = () => {
                    switch (apr.status) {
                      case 'Pendente':
                        return 'bg-amber-900 text-amber-400';
                      case 'Aprovada':
                        return 'bg-green-900 text-green-400';
                      case 'Rejeitada':
                        return 'bg-red-900 text-red-400';
                      default:
                        return 'bg-slate-700 text-slate-300';
                    }
                  };

                  const getStatusIcon = () => {
                    switch (apr.status) {
                      case 'Pendente':
                        return <Clock className="w-4 h-4" />;
                      case 'Aprovada':
                        return <CheckCircle2 className="w-4 h-4" />;
                      case 'Rejeitada':
                        return <XCircle className="w-4 h-4" />;
                      default:
                        return null;
                    }
                  };

                  return (
                    <tr key={apr.id} className="hover:bg-slate-800">
                      <td>
                        <p className="font-medium text-white font-mono">{apr.numero}</p>
                      </td>
                      <td>
                        <p className="text-slate-300">{apr.construtora}</p>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{apr.obra.substring(0, 60)}...</p>
                      </td>
                      <td className="number-cell">
                        <p className="text-green-400 font-mono font-semibold">{formatCurrency(apr.valor)}</p>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{formatDate(apr.dataSolicitacao)}</p>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-semibold ${getStatusColor()}`}>
                          {getStatusIcon()}
                          {apr.status}
                        </span>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{apr.solicitante}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                            Aprovar
                          </button>
                          <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
