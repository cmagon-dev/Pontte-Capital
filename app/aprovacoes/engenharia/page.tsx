'use client';

import { useState } from 'react';
import { Hammer, Search, CheckCircle2, XCircle, Clock, DollarSign, Calendar, FileText } from 'lucide-react';

export default function AprovacoesEngenhariaPage() {
  const [activeTab, setActiveTab] = useState<'orcamento' | 'planejamento' | 'medicoes'>('orcamento');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API
  const orcamentos = [
    {
      id: 'ORC-001',
      obra: 'Reforma e Ampliação da Escola Municipal Santa Rita',
      valor: 12500000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-15',
    },
  ];

  const planejamentos = [
    {
      id: 'PLN-001',
      obra: 'Reforma e Ampliação da Escola Municipal Santa Rita',
      tipo: 'Cronograma Executivo',
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-20',
    },
  ];

  const medicoes = [
    {
      id: 'MED-001',
      obra: 'Reforma e Ampliação da Escola Municipal Santa Rita',
      numero: 'BM-001/2024',
      valor: 2000000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-25',
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

  const filteredOrcamentos = orcamentos.filter((o) =>
    o.obra.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlanejamentos = planejamentos.filter((p) =>
    p.obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMedicoes = medicoes.filter((m) =>
    m.obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações - Engenharia</h1>
        <p className="text-slate-400">Aprovação de orçamentos, planejamentos e medições</p>
      </div>

      {/* Abas Internas */}
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('orcamento')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'orcamento'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Orçamento
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('planejamento')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'planejamento'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Planejamento
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medicoes')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'medicoes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Medições
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
      {activeTab === 'orcamento' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrcamentos.map((orcamento) => (
                  <tr key={orcamento.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{orcamento.obra}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {orcamento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(orcamento.status)}`}>
                        {getStatusIcon(orcamento.status)}
                        {orcamento.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{orcamento.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{orcamento.dataSolicitacao}</td>
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

      {activeTab === 'planejamento' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPlanejamentos.map((planejamento) => (
                  <tr key={planejamento.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{planejamento.obra}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{planejamento.tipo}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(planejamento.status)}`}>
                        {getStatusIcon(planejamento.status)}
                        {planejamento.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{planejamento.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{planejamento.dataSolicitacao}</td>
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

      {activeTab === 'medicoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMedicoes.map((medicao) => (
                  <tr key={medicao.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{medicao.obra}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{medicao.numero}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {medicao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(medicao.status)}`}>
                        {getStatusIcon(medicao.status)}
                        {medicao.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{medicao.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{medicao.dataSolicitacao}</td>
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
