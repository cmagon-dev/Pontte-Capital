'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Building2, Eye, Camera } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

type ConstrutoraComObras = {
  construtoraId: string;
  construtoraNome: string;
  construtoraCnpj: string | null;
  totalObras: number;
  obrasAtivas: number;
  obrasAtrasadas: number;
  valorTotal: number;
  totalPlantas: number;
  totalPontos: number;
  totalFotos: number;
};

export default function Registros360Content({
  construtoras,
}: {
  construtoras: ConstrutoraComObras[];
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar construtoras por busca
  const filteredConstrutoras = construtoras.filter((c) =>
    c.construtoraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.construtoraCnpj && c.construtoraCnpj.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Totais gerais
  const totalConstrutoras = filteredConstrutoras.length;
  const totalObras = filteredConstrutoras.reduce((sum, c) => sum + c.totalObras, 0);
  const totalPlantas = filteredConstrutoras.reduce((sum, c) => sum + c.totalPlantas, 0);
  const totalPontos = filteredConstrutoras.reduce((sum, c) => sum + c.totalPontos, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Registros 360º</h1>
        <p className="text-slate-400">
          Selecione uma construtora para gerenciar os registros 360º de suas obras
        </p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Construtoras</p>
          <p className="text-2xl font-bold text-white">{totalConstrutoras}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-blue-400">{totalObras}</p>
        </div>
        <div className="bg-slate-900 border border-purple-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Plantas</p>
          <p className="text-2xl font-bold text-purple-400">{totalPlantas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Pontos</p>
          <p className="text-2xl font-bold text-green-400">{totalPontos}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar construtora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Construtoras */}
      <div className="space-y-4">
        {filteredConstrutoras.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">Nenhuma construtora encontrada com os filtros aplicados</p>
          </div>
        ) : (
          filteredConstrutoras.map((grupo) => (
            <div key={grupo.construtoraId} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              {/* Cabeçalho da Construtora */}
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
                  <div className="ml-4 text-right">
                    <p className="text-xs text-slate-500 mb-1">Total de Obras</p>
                    <p className="text-2xl font-bold text-white">{grupo.totalObras}</p>
                  </div>
                </div>
              </div>

              {/* Informações da Construtora */}
              <div className="p-4 bg-slate-850 border-b border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Obras Ativas</p>
                    <p className="text-xl font-bold text-green-400 font-mono">{grupo.obrasAtivas}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Obras Atrasadas</p>
                    <p className="text-xl font-bold text-red-400 font-mono">{grupo.obrasAtrasadas}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Valor Total</p>
                    <p className="text-lg font-bold text-green-400 font-mono">{formatCurrency(grupo.valorTotal)}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Total Plantas</p>
                    <p className="text-xl font-bold text-purple-400 font-mono">{grupo.totalPlantas}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Total Pontos</p>
                    <p className="text-xl font-bold text-blue-400 font-mono">{grupo.totalPontos}</p>
                  </div>
                </div>
              </div>

              {/* Link para ver obras */}
              <div className="p-4">
                <Link
                  href={`/eng/registros-360/${grupo.construtoraId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Obras desta Construtora
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
