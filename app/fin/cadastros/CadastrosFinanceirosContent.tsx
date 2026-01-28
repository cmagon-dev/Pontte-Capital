'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Building2, Eye, Users, Banknote, FolderTree, BarChart3, Building } from 'lucide-react';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

interface Construtora {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  cidade: string | null;
  estado: string | null;
  totalObras: number;
  totalCredores: number;
  totalContas: number;
  totalPlanos: number;
  totalCentrosCusto: number;
}

interface CadastrosFinanceirosContentProps {
  construtoras: Construtora[];
  totalConstrutoras: number;
  totalCredores: number;
  totalContas: number;
}

export default function CadastrosFinanceirosContent({
  construtoras,
  totalConstrutoras,
  totalCredores,
  totalContas,
}: CadastrosFinanceirosContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar construtoras por busca
  const filteredConstrutoras = useMemo(() => {
    return construtoras.filter((c) =>
      c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [construtoras, searchTerm]);

  // Totais filtrados
  const totalConstrutorasFiltradas = filteredConstrutoras.length;
  const totalCredoresFiltrados = filteredConstrutoras.reduce((sum, c) => sum + c.totalCredores, 0);
  const totalContasFiltradas = filteredConstrutoras.reduce((sum, c) => sum + c.totalContas, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Cadastros Financeiros</h1>
        <p className="text-slate-400">
          Selecione uma construtora para gerenciar os cadastros financeiros
        </p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Construtoras</p>
          <p className="text-2xl font-bold text-white">{totalConstrutorasFiltradas}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Credores</p>
          <p className="text-2xl font-bold text-blue-400">{totalCredoresFiltrados}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Contas</p>
          <p className="text-2xl font-bold text-green-400">{totalContasFiltradas}</p>
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
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              {searchTerm ? 'Nenhuma construtora encontrada com os filtros aplicados' : 'Nenhuma construtora cadastrada'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-slate-500">
                Execute o seed do banco de dados para criar dados de exemplo
              </p>
            )}
          </div>
        ) : (
          filteredConstrutoras.map((construtora) => (
            <div key={construtora.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              {/* Cabeçalho da Construtora */}
              <div className="bg-slate-800 border-b border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-lg font-bold text-white">{construtora.razaoSocial}</h3>
                        {construtora.nomeFantasia && (
                          <p className="text-sm text-slate-400 mt-1">{construtora.nomeFantasia}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="font-mono">{formatarCPFouCNPJ(construtora.cnpj)}</span>
                          <span>•</span>
                          <span>{construtora.codigo}</span>
                          {construtora.cidade && construtora.estado && (
                            <>
                              <span>•</span>
                              <span>{construtora.cidade}/{construtora.estado}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-slate-500 mb-1">Total de Obras</p>
                    <p className="text-2xl font-bold text-white">{construtora.totalObras}</p>
                  </div>
                </div>
              </div>

              {/* Informações dos Cadastros */}
              <div className="p-4 bg-slate-850 border-b border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4 text-slate-400" />
                      <p className="text-xs text-slate-400">Obras</p>
                    </div>
                    <p className="text-xl font-bold text-white">{construtora.totalObras}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-slate-400">Credores</p>
                    </div>
                    <p className="text-xl font-bold text-blue-400">{construtora.totalCredores}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-slate-400">Contas</p>
                    </div>
                    <p className="text-xl font-bold text-green-400">{construtora.totalContas}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderTree className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-slate-400">Planos</p>
                    </div>
                    <p className="text-xl font-bold text-purple-400">{construtora.totalPlanos}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-slate-400">Centros Custo</p>
                    </div>
                    <p className="text-xl font-bold text-amber-400">{construtora.totalCentrosCusto}</p>
                  </div>
                </div>
              </div>

              {/* Link para ver cadastros */}
              <div className="p-4">
                <Link
                  href={`/fin/cadastros/${construtora.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Cadastros Financeiros desta Construtora
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
