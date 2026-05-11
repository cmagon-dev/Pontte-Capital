'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Building2, MapPin, Filter, ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface ObraFormatada {
  id: string;
  codigo: string;
  nome: string;
  contratante: string;
  valorContrato: number;
  endereco: string;
  cidade: string;
  estado: string;
  dataInicio: Date | string | null;
  dataFim: Date | string | null;
  status: string;
  statusExibicao: string;
}

interface Construtora {
  id: string;
  codigo: string | null;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
}

interface ResumoConstrutora {
  totalObras: number;
  valorTotal: number;
}

interface PlanMedicoesPorConstrutoraContentProps {
  construtora: Construtora;
  obras: ObraFormatada[];
  construtoraId: string;
  resumo: ResumoConstrutora;
}

export default function PlanMedicoesPorConstrutoraContent({
  construtora,
  obras,
  construtoraId,
  resumo,
}: PlanMedicoesPorConstrutoraContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');

  const statusOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Ativa', nome: 'Ativa' },
    { id: 'Atrasada', nome: 'Atrasada' },
    { id: 'Em Planejamento', nome: 'Em Planejamento' },
    { id: 'Finalizada', nome: 'Finalizada' },
    { id: 'Parada', nome: 'Parada' },
  ];

  const filteredObras = useMemo(() => {
    return obras.filter((obra) => {
      const matchSearch =
        obra.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.contratante.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = filtroStatus === 'todas' || obra.statusExibicao === filtroStatus;
      
      return matchSearch && matchStatus;
    });
  }, [obras, searchTerm, filtroStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'bg-green-900 text-green-400';
      case 'Atrasada':
        return 'bg-red-900 text-red-400';
      case 'Em Planejamento':
        return 'bg-blue-900 text-blue-400';
      case 'Finalizada':
        return 'bg-slate-700 text-slate-300';
      case 'Parada':
        return 'bg-amber-900 text-amber-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const formatarEndereco = (obra: ObraFormatada) => {
    const partes = [obra.endereco, obra.cidade, obra.estado].filter(Boolean);
    return partes.length > 0 ? partes.join(', ') : 'Endereço não informado';
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <Link
            href="/eng/plan-medicoes"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Construtoras
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Plan.&Medições</h1>
              <p className="text-slate-400">{construtora.razaoSocial}</p>
              {construtora.cnpj && (
                <p className="text-sm text-slate-500 font-mono mt-1">{construtora.cnpj}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-white">{resumo.totalObras}</p>
          <p className="text-xs text-slate-500 mt-1">
            Todas as obras da construtora
          </p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-white font-mono">{formatCurrency(resumo.valorTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Soma dos contratos
          </p>
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
                placeholder="Código, Nome, Contratante..."
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
                <th>Código</th>
                <th>Nome/Objeto</th>
                <th>Contratante</th>
                <th className="number-cell">Valor Contrato</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredObras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Nenhuma obra encontrada com os filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredObras.map((obra) => (
                  <tr key={obra.id} className="hover:bg-slate-800">
                    <td>
                      <p className="font-medium text-white font-mono">{obra.codigo}</p>
                    </td>
                    <td>
                      <div className="max-w-md">
                        <p className="text-white text-sm">{obra.nome}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <p className="text-xs text-slate-500">{formatarEndereco(obra)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm">{obra.contratante}</p>
                    </td>
                    <td className="number-cell">
                      <p className="font-mono text-white">{formatCurrency(obra.valorContrato)}</p>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(obra.statusExibicao)}`}>
                        {obra.statusExibicao}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/eng/plan-medicoes/${construtoraId}/${obra.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Medições
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
