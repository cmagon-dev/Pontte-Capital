'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, FileText, Building2, Camera, Filter, Eye, ClipboardList } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

type Obra = {
  id: string;
  numeroContrato: string;
  numeroEdital: string | null;
  objeto: string;
  contratante: string;
  construtora: {
    id: string;
    nome: string;
  };
  fundo: {
    id: string | null;
    nome: string | null;
  };
  valorGlobal: number;
  dataInicio: string | null;
  dataFim: string | null;
  enderecoObra: string | null;
  status: string;
  totalPlantas: number;
  totalPontos: number;
  totalFotos: number;
};

type Construtora = {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
};

export default function Registros360PorConstrutoraContent({
  params,
  construtora,
  obras,
}: {
  params: { construtoraId: string };
  construtora: Construtora;
  obras: Obra[];
}) {
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

  const filteredObras = obras.filter((obra) => {
    const matchSearch =
      obra.numeroContrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.objeto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.contratante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.numeroEdital?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filtroStatus === 'todas' || obra.status === filtroStatus;
    
    return matchSearch && matchStatus;
  });

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

  const totalValorGlobal = filteredObras.reduce((sum, obra) => sum + obra.valorGlobal, 0);
  const obrasAtivas = filteredObras.filter((o) => o.status === 'Ativa').length;
  const obrasAtrasadas = filteredObras.filter((o) => o.status === 'Atrasada').length;
  const totalPlantas = filteredObras.reduce((sum, o) => sum + o.totalPlantas, 0);
  const totalPontos = filteredObras.reduce((sum, o) => sum + o.totalPontos, 0);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <Link
            href="/eng/registros-360"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Construtoras
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Camera className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Registros 360º</h1>
              <p className="text-slate-400">{construtora.razaoSocial}</p>
              {construtora.cnpj && (
                <p className="text-sm text-slate-500 font-mono mt-1">{construtora.cnpj}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-white">{filteredObras.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Obras Ativas</p>
          <p className="text-2xl font-bold text-green-400">{obrasAtivas}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Obras Atrasadas</p>
          <p className="text-2xl font-bold text-red-400">{obrasAtrasadas}</p>
        </div>
        <div className="bg-slate-900 border border-purple-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total Plantas</p>
          <p className="text-2xl font-bold text-purple-400">{totalPlantas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total Pontos</p>
          <p className="text-2xl font-bold text-green-400">{totalPontos}</p>
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
                placeholder="Contrato, Objeto, Contratante..."
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
                <th>Contrato/Edital</th>
                <th>Objeto</th>
                <th>Contratante</th>
                <th className="number-cell">Valor Global</th>
                <th>Plantas</th>
                <th>Pontos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredObras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma obra encontrada com os filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredObras.map((obra) => (
                  <tr key={obra.id} className="hover:bg-slate-800">
                    <td>
                      <div>
                        <p className="font-medium text-white">{obra.numeroContrato}</p>
                        {obra.numeroEdital && (
                          <p className="text-xs text-slate-400 font-mono">{obra.numeroEdital}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="max-w-md">
                        <p className="text-white text-sm">{obra.objeto}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-300 text-sm">{obra.contratante}</p>
                    </td>
                    <td className="number-cell">
                      <p className="font-mono text-white">{formatCurrency(obra.valorGlobal)}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-mono">{obra.totalPlantas}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-white font-mono">{obra.totalPontos}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(obra.status)}`}>
                        {obra.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/eng/registros-360/${params.construtoraId}/${obra.id}/configuracoes`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        {obra.totalPlantas > 0 ? 'Gerenciar Plantas' : 'Criar Plantas'}
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
