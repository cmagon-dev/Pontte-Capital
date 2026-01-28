'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Building2, Calendar, MapPin, Filter, Eye, Edit } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface Construtora {
  id: string;
  codigo: string | null;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
  dataInicio: string | null;
  dataFim: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  contratante: string;
}

interface Props {
  construtora: Construtora;
  obras: Obra[];
}

export default function ContratosObrasConstrutoraContent({ construtora, obras }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');

  const statusOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'EM_ANDAMENTO', nome: 'Em Andamento' },
    { id: 'CONCLUIDA', nome: 'Concluída' },
    { id: 'PARALISADA', nome: 'Paralisada' },
    { id: 'CANCELADA', nome: 'Cancelada' },
  ];

  const filteredObras = obras.filter((obra) => {
    const matchSearch =
      obra.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.contratante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.endereco?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todas' || obra.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'bg-green-900 text-green-400';
      case 'CONCLUIDA':
        return 'bg-slate-700 text-slate-300';
      case 'PARALISADA':
        return 'bg-amber-900 text-amber-400';
      case 'CANCELADA':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      case 'CONCLUIDA':
        return 'Concluída';
      case 'PARALISADA':
        return 'Paralisada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const totalValorGlobal = filteredObras.reduce((sum, obra) => sum + obra.valorContrato, 0);
  const obrasAtivas = filteredObras.filter((o) => o.status === 'EM_ANDAMENTO').length;
  const obrasParalisadas = filteredObras.filter((o) => o.status === 'PARALISADA').length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <Link
            href="/eng/contratos/contratos-obras"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Construtoras
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Contratos de Obras</h1>
              <p className="text-slate-400">
                {construtora.codigo} - {construtora.razaoSocial}
              </p>
              <p className="text-sm text-slate-500 font-mono mt-1">{construtora.cnpj}</p>
            </div>
          </div>
        </div>
        <Link
          href={`/eng/contratos/contratos-obras/novo?construtoraId=${construtora.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Obra
        </Link>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-white">{filteredObras.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Em Andamento</p>
          <p className="text-2xl font-bold text-green-400">{obrasAtivas}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Paralisadas</p>
          <p className="text-2xl font-bold text-amber-400">{obrasParalisadas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(totalValorGlobal)}</p>
        </div>
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
                placeholder="Código, Nome da obra, Contratante, Localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Status</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
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

      {/* Tabela de Obras */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Nome da Obra</th>
                <th>Contratante</th>
                <th>Localização</th>
                <th className="number-cell">Valor do Contrato</th>
                <th>Período</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredObras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {searchTerm || filtroStatus !== 'todas'
                      ? 'Nenhuma obra encontrada com os filtros aplicados'
                      : 'Nenhuma obra cadastrada ainda para esta construtora'}
                  </td>
                </tr>
              ) : (
                filteredObras.map((obra) => (
                  <tr key={obra.id} className="hover:bg-slate-800">
                    <td>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-400 font-semibold text-sm">{obra.codigo}</span>
                          <span className="text-slate-600">•</span>
                          <p className="font-medium text-white">{obra.nome}</p>
                        </div>
                        {obra.endereco && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <p className="text-xs text-slate-500">{obra.endereco}</p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-300">{obra.contratante}</span>
                    </td>
                    <td>
                      <span className="text-slate-300 text-sm">
                        {obra.cidade && obra.estado 
                          ? `${obra.cidade}/${obra.estado}`
                          : obra.cidade || obra.estado || '-'}
                      </span>
                    </td>
                    <td className="currency-cell font-mono">{formatCurrency(obra.valorContrato)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <div className="text-xs">
                          <p className="text-slate-300">
                            {obra.dataInicio ? formatDate(new Date(obra.dataInicio)) : '-'}
                          </p>
                          {obra.dataFim && (
                            <p className="text-slate-500">
                              até {formatDate(new Date(obra.dataFim))}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(obra.status)}`}>
                        {getStatusLabel(obra.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/eng/contratos/contratos-obras/obra/${obra.id}`}
                          className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/eng/contratos/contratos-obras/obra/${obra.id}/editar`}
                          className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota sobre Estrutura de Dados */}
      <div className="mt-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Estrutura do Banco de Dados:</strong> Cada obra possui um UUID único que serve como Centro de Custo
          (CC) e ID chave para todas as tabelas futuras (financeiro, engenharia, fiscal). O sistema trata esta entidade
          como uma SPE Virtual (Sociedade de Propósito Específico) com fluxo financeiro isolado.
        </p>
      </div>
    </div>
  );
}
