'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, Filter, Eye, ClipboardList, FolderKanban, Plus, FileText, DollarSign, CheckCircle2, Clock, XCircle, PlayCircle, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { getAllObras, getAllConstrutoras, getAllFundos } from '@/lib/mock-data';

export default function SolicitacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroConstrutora, setFiltroConstrutora] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');

  // Dados das obras, construtoras e fundos
  const obras = getAllObras();
  const construtoras = getAllConstrutoras();
  const fundos = getAllFundos();

  // Agrupar obras por construtora (solicitações são por construtora)
  const obrasPorConstrutora = useMemo(() => {
    const agrupamento: Record<string, {
      construtoraId: string;
      construtoraNome: string;
      construtoraCnpj: string;
      obras: Array<{
        obraId: string;
        obraNumeroContrato: string;
        obraObjeto: string;
        obraStatus: string;
        obraValorGlobal: number;
        fundoId: string;
        fundoNome: string;
      }>;
    }> = {};

    obras.forEach((obra) => {
      const construtora = construtoras.find((c) => c.id === obra.construtoraId);
      
      if (!agrupamento[obra.construtoraId]) {
        agrupamento[obra.construtoraId] = {
          construtoraId: obra.construtoraId,
          construtoraNome: construtora?.razaoSocial || obra.construtoraNome,
          construtoraCnpj: construtora?.cnpj || '',
          obras: [],
        };
      }

      const fundo = fundos.find((f) => f.id === obra.fundoId);
      agrupamento[obra.construtoraId].obras.push({
        obraId: obra.id,
        obraNumeroContrato: obra.numeroContrato,
        obraObjeto: obra.objeto,
        obraStatus: obra.status,
        obraValorGlobal: obra.valorGlobal,
        fundoId: obra.fundoId,
        fundoNome: fundo?.nome || obra.fundoNome,
      });
    });

    return Object.values(agrupamento);
  }, [obras, construtoras, fundos]);

  // Adicionar dados de operações por construtora (mock) - separado por tipo
  const operacoesPorConstrutora = obrasPorConstrutora.map((grupo) => ({
    ...grupo,
    // Operações à Performar
    totalAPerformar: 3, // Mock
    aPerformarAbertas: 2, // Mock
    aPerformarLiquidadas: 1, // Mock
    valorAPerformarAberto: 80000.00, // Mock
    // Operações Performadas
    totalPerformadas: 2, // Mock
    performadasAbertas: 0, // Mock
    performadasLiquidadas: 2, // Mock
    valorPerformadasAberto: 0.00, // Mock
    // Totais Gerais
    totalSolicitacoes: 5, // Mock
    solicitacoesPendentes: 2, // Mock
    solicitacoesAprovadas: 3, // Mock
    valorTotalPendente: 80000.00, // Mock
  }));

  // Filtros
  const filteredSolicitacoes = useMemo(() => {
    return operacoesPorConstrutora.filter((grupo) => {
      const matchSearchConstrutora = grupo.construtoraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.construtoraCnpj.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSearchObra = grupo.obras.some((obra) =>
        obra.obraNumeroContrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.obraObjeto.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchSearch = matchSearchConstrutora || matchSearchObra;
      const matchConstrutora = filtroConstrutora === 'todas' || grupo.construtoraId === filtroConstrutora;
      
      // Filtrar por status (simplificado - em produção seria por solicitação individual)
      const matchStatus = filtroStatus === 'todas';
      
      return matchSearch && matchConstrutora && matchStatus;
    });
  }, [operacoesPorConstrutora, searchTerm, filtroConstrutora, filtroStatus]);

  // Opções de filtro
  const construtorasOptions = [
    { id: 'todas', nome: 'Todas as Construtoras' },
    ...construtoras.map((c) => ({ id: c.id, nome: c.razaoSocial })),
  ];

  const statusOptions = [
    { id: 'todas', nome: 'Todos os Status' },
    { id: 'Pendente', nome: 'Pendente' },
    { id: 'Aprovada', nome: 'Aprovada' },
    { id: 'Rejeitada', nome: 'Rejeitada' },
    { id: 'Paga', nome: 'Paga' },
  ];

  // Totais
  const totalSolicitacoes = filteredSolicitacoes.reduce((sum, c) => sum + c.totalSolicitacoes, 0);
  const totalPendentes = filteredSolicitacoes.reduce((sum, c) => sum + c.solicitacoesPendentes, 0);
  const valorTotalPendente = filteredSolicitacoes.reduce((sum, c) => sum + c.valorTotalPendente, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Operações Fin.</h1>
        <p className="text-slate-400">Acompanhamento de operações financeiras agrupadas por Construtora</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Operações</p>
          <p className="text-2xl font-bold text-blue-400">{totalSolicitacoes}</p>
        </div>
        <div className="bg-slate-900 border border-orange-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Abertas</p>
          <p className="text-2xl font-bold text-orange-400">{totalPendentes}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Liquidadas</p>
          <p className="text-2xl font-bold text-green-400">{totalSolicitacoes - totalPendentes}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total Aberto</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(valorTotalPendente)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Construtora, Obra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Construtora
            </label>
            <select
              value={filtroConstrutora}
              onChange={(e) => setFiltroConstrutora(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {construtorasOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
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

      {/* Lista Agrupada por Construtora */}
      <div className="space-y-4">
        {filteredSolicitacoes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">Nenhuma solicitação encontrada com os filtros aplicados</p>
          </div>
        ) : (
          filteredSolicitacoes.map((grupo) => (
            <div key={grupo.construtoraId} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              {/* Cabeçalho do Grupo - Construtora */}
              <div className="bg-slate-800 border-b border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{grupo.construtoraNome}</h3>
                        {grupo.construtoraCnpj && (
                          <p className="text-sm text-slate-400 font-mono mt-1">{grupo.construtoraCnpj}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Total de Operações</p>
                      <p className="text-2xl font-bold text-white">{grupo.totalSolicitacoes}</p>
                    </div>
                    <Link
                      href={`/fin/operacoes/solicitacoes/${grupo.construtoraId}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Obras
                    </Link>
                  </div>
                </div>
              </div>

              {/* Resumo de Operações - Compacto */}
              <div className="p-3 bg-slate-850 border-b border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Operações à Performar */}
                  <div className="bg-slate-800 border border-blue-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <PlayCircle className="w-3 h-3 text-blue-400" />
                      <p className="text-xs font-semibold text-white">À Performar</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{grupo.totalAPerformar}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{grupo.aPerformarAbertas}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{grupo.aPerformarLiquidadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(grupo.valorAPerformarAberto)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Operações Performadas */}
                  <div className="bg-slate-800 border border-purple-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <p className="text-xs font-semibold text-white">Performadas</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{grupo.totalPerformadas}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{grupo.performadasAbertas}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{grupo.performadasLiquidadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(grupo.valorPerformadasAberto)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo Geral */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      <p className="text-xs font-semibold text-white">Geral</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{grupo.totalSolicitacoes}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{grupo.solicitacoesPendentes}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{grupo.solicitacoesAprovadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(grupo.valorTotalPendente)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
