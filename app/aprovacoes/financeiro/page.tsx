'use client';

import { useState } from 'react';
import { DollarSign, Search, CheckCircle2, XCircle, Clock, Building2, Wallet } from 'lucide-react';

export default function AprovacoesFinanceiroPage() {
  const [activeTab, setActiveTab] = useState<'cadastros' | 'operacoes'>('cadastros');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API
  const cadastros = [
    {
      id: 'CAD-001',
      tipo: 'Banco',
      descricao: 'Conta Principal - Banco do Brasil',
      construtora: 'Construtora ABC Ltda',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-15',
    },
    {
      id: 'CAD-002',
      tipo: 'Credor',
      descricao: 'Fornecedor ABC Ltda',
      construtora: 'Construtora ABC Ltda',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-16',
    },
  ];

  const operacoes = [
    {
      id: 'OP-001',
      tipo: 'Solicitação de Pagamento',
      descricao: 'Pagamento de fornecedor - Fatura 001/2024',
      valor: 45000.00,
      construtora: 'Construtora ABC Ltda',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-20',
    },
    {
      id: 'OP-002',
      tipo: 'Saldo Performado',
      descricao: 'Liberação de saldo performado - Obra 001/2024',
      valor: 500000.00,
      construtora: 'Construtora ABC Ltda',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-22',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-green-900 text-green-400';
      case 'Rejeitado':
        return 'bg-red-900 text-red-400';
      case 'Pendente':
        return 'bg-amber-900 text-amber-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Rejeitado':
        return <XCircle className="w-4 h-4" />;
      case 'Pendente':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredCadastros = cadastros.filter((c) =>
    c.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.construtora.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOperacoes = operacoes.filter((o) =>
    o.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.construtora.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações - Financeiro</h1>
        <p className="text-slate-400">Aprovação de cadastros financeiros e operações</p>
      </div>

      {/* Abas Internas */}
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cadastros')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'cadastros'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Cadastros
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operacoes')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'operacoes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Operações
            </div>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'cadastros' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Construtora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCadastros.map((cadastro) => (
                  <tr key={cadastro.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{cadastro.tipo}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{cadastro.descricao}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{cadastro.construtora}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(cadastro.status)}`}>
                        {getStatusIcon(cadastro.status)}
                        {cadastro.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{cadastro.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{cadastro.dataSolicitacao}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                          Aprovar
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'operacoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Construtora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOperacoes.map((operacao) => (
                  <tr key={operacao.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{operacao.tipo}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{operacao.descricao}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {operacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{operacao.construtora}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(operacao.status)}`}>
                        {getStatusIcon(operacao.status)}
                        {operacao.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{operacao.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{operacao.dataSolicitacao}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                          Aprovar
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                          Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
