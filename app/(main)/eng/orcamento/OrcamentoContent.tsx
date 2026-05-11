'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

interface ObraFormatada {
  id: string;
  codigo: string;
  nome: string;
  status: string;
  valorContrato: number;
  percentualOrcado: number;
}

interface ConstrutoraComObras {
  construtoraId: string;
  construtoraNome: string;
  construtoraCnpj: string;
  totalObras: number;
  obrasAtivas: number;
  obrasAtrasadas: number;
  valorTotal: number;
  percentualOrcadoMedio: number;
  obras: ObraFormatada[];
}

interface OrcamentoContentProps {
  construtorasComObras: ConstrutoraComObras[];
  totalConstrutoras: number;
  totalObras: number;
  totalValor: number;
}

export default function OrcamentoContent({
  construtorasComObras,
  totalConstrutoras,
  totalObras,
  totalValor,
}: OrcamentoContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar construtoras por busca
  const filteredConstrutoras = useMemo(() => {
    return construtorasComObras.filter((c) =>
      c.construtoraNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.construtoraCnpj.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [construtorasComObras, searchTerm]);

  // Totais gerais (filtrados)
  const totalConstrutorasFiltradas = filteredConstrutoras.length;
  const totalObrasFiltradas = filteredConstrutoras.reduce((sum, c) => sum + c.totalObras, 0);
  const totalValorFiltrado = filteredConstrutoras.reduce((sum, c) => sum + c.valorTotal, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Orçamento</h1>
        <p className="text-slate-400">
          Selecione uma construtora para gerenciar o orçamento de suas obras
        </p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Construtoras</p>
          <p className="text-2xl font-bold text-white">{totalConstrutorasFiltradas}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Obras</p>
          <p className="text-2xl font-bold text-blue-400">{totalObrasFiltradas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(totalValorFiltrado)}</p>
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

              {/* Link para ver obras */}
              <div className="p-4">
                <Link
                  href={`/eng/orcamento/${grupo.construtoraId}`}
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
