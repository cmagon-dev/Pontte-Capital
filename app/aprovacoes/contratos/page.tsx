'use client';

import { useState } from 'react';
import { FileText, Plus, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AprovacoesContratosPage() {
  const [activeTab, setActiveTab] = useState<'contratos' | 'aditivos' | 'reajustes' | 'empenhos'>('contratos');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria de API
  const contratos = [
    {
      id: 'CT-001',
      numero: '001/2024',
      objeto: 'Reforma e Ampliação da Escola Municipal Santa Rita',
      construtora: 'Construtora ABC Ltda',
      valor: 12500000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-15',
    },
  ];

  const aditivos = [
    {
      id: 'AD-001',
      contrato: '001/2024',
      tipo: 'Aditivo',
      valor: 500000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-20',
    },
  ];

  const reajustes = [
    {
      id: 'RJ-001',
      contrato: '001/2024',
      indice: 'INCC',
      percentual: 5.2,
      valor: 650000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-25',
    },
  ];

  const empenhos = [
    {
      id: 'EM-001',
      contrato: '001/2024',
      numero: 'EMP-001/2024',
      valor: 2000000.00,
      status: 'Pendente',
      solicitante: 'Eng. João Silva',
      dataSolicitacao: '2024-01-18',
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

  const filteredContratos = contratos.filter((c) =>
    c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.construtora.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAditivos = aditivos.filter((a) =>
    a.contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReajustes = reajustes.filter((r) =>
    r.contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.indice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmpenhos = empenhos.filter((e) =>
    e.contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.numero.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Aprovações - Contratos</h1>
        <p className="text-slate-400">Aprovação de contratos, aditivos, reajustes e empenhos</p>
      </div>

      {/* Abas Internas */}
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('contratos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'contratos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contratos
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('aditivos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'aditivos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Aditivos/Supressões
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reajustes')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'reajustes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reajustes
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('empenhos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'empenhos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Empenhos
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
      {activeTab === 'contratos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Objeto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Construtora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredContratos.map((contrato) => (
                  <tr key={contrato.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{contrato.numero}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{contrato.objeto}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{contrato.construtora}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {contrato.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(contrato.status)}`}>
                        {getStatusIcon(contrato.status)}
                        {contrato.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{contrato.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{contrato.dataSolicitacao}</td>
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

      {activeTab === 'aditivos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAditivos.map((aditivo) => (
                  <tr key={aditivo.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{aditivo.contrato}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{aditivo.tipo}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {aditivo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(aditivo.status)}`}>
                        {getStatusIcon(aditivo.status)}
                        {aditivo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{aditivo.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{aditivo.dataSolicitacao}</td>
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

      {activeTab === 'reajustes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Índice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Percentual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReajustes.map((reajuste) => (
                  <tr key={reajuste.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{reajuste.contrato}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{reajuste.indice}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{reajuste.percentual}%</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {reajuste.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(reajuste.status)}`}>
                        {getStatusIcon(reajuste.status)}
                        {reajuste.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{reajuste.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{reajuste.dataSolicitacao}</td>
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

      {activeTab === 'empenhos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Contrato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Solicitante</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEmpenhos.map((empenho) => (
                  <tr key={empenho.id} className="hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm text-white">{empenho.contrato}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{empenho.numero}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">R$ {empenho.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(empenho.status)}`}>
                        {getStatusIcon(empenho.status)}
                        {empenho.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{empenho.solicitante}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{empenho.dataSolicitacao}</td>
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
