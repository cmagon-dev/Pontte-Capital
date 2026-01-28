'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users, Filter, ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

type Credor = {
  id: string;
  codigo: string;
  tipo: string;
  nome: string;
  cpfCnpj: string;
  status: string;
  valorPendente: number;
};

export function ListaCredores({ credores, construtoraId }: { credores: any[], construtoraId: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCredores = credores.filter((credor) =>
    credor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credor.cpfCnpj.includes(searchTerm.replace(/\D/g, '')) ||
    credor.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    credor.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPendente = filteredCredores.reduce((sum, c) => sum + Number(c.valorPendente || 0), 0);

  // Mapear tipo para exibição
  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'FORNECEDOR': 'Fornecedor',
      'EMPREITEIRO': 'Empreiteiro',
      'FUNCIONARIO': 'Funcionário',
    };
    return tipos[tipo] || tipo;
  };

  // Mapear status para exibição
  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'ATIVO': 'Ativo',
      'INATIVO': 'Inativo',
      'BLOQUEADO': 'Bloqueado',
    };
    return statuses[status] || status;
  };

  return (
    <>
      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Credores</p>
          <p className="text-2xl font-bold text-white">{filteredCredores.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Credores Ativos</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredCredores.filter((c) => c.status === 'ATIVO').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total Pendente</p>
          <p className="text-xl font-bold text-amber-400 font-mono">{formatCurrency(totalPendente)}</p>
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
                placeholder="Nome, CNPJ/CPF, Tipo, Código..."
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
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Código</th>
                  <th className="bg-slate-900 border-b border-slate-700">Nome</th>
                  <th className="bg-slate-900 border-b border-slate-700">Tipo</th>
                  <th className="bg-slate-900 border-b border-slate-700">CNPJ/CPF</th>
                  <th className="bg-slate-900 border-b border-slate-700">Status</th>
                  <th className="number-cell bg-slate-900 border-b border-slate-700">Valor Pendente</th>
                  <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Nenhum credor encontrado
                    </td>
                  </tr>
                ) : (
                  filteredCredores.map((credor) => (
                    <tr key={credor.id} className="hover:bg-slate-800">
                      <td>
                        <p className="text-slate-400 text-sm font-mono">{credor.codigo}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <p className="font-medium text-white">{credor.nome}</p>
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-400">
                          {getTipoLabel(credor.tipo)}
                        </span>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm font-mono">{formatarCPFouCNPJ(credor.cpfCnpj)}</p>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          credor.status === 'ATIVO' 
                            ? 'bg-green-900 text-green-400' 
                            : credor.status === 'BLOQUEADO'
                            ? 'bg-red-900 text-red-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {getStatusLabel(credor.status)}
                        </span>
                      </td>
                      <td className="number-cell">
                        <p className="text-white font-mono">{formatCurrency(Number(credor.valorPendente || 0))}</p>
                      </td>
                      <td>
                        <Link
                          href={`/fin/cadastros/${construtoraId}/credores/${credor.id}`}
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
    </>
  );
}
