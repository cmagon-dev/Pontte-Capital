'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, Filter, ClipboardList, Layers, Star } from 'lucide-react';
import { BotaoExcluirPlano } from './BotaoExcluirPlano';

export function ListaPlanosContas({ planos, construtoraId }: { planos: any[], construtoraId: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlanos = planos.filter((plano) =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plano.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plano.descricao && plano.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const planoPadrao = filteredPlanos.find((p) => p.isPadrao);
  const outrosPlanos = filteredPlanos.filter((p) => !p.isPadrao);

  const getStatusLabel = (status: string) => {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  };

  const getStatusColor = (status: string) => {
    return status === 'ATIVO' 
      ? 'bg-green-900 text-green-400' 
      : 'bg-slate-700 text-slate-300';
  };

  const totalContas = filteredPlanos.reduce((sum, p) => sum + (p._count?.contas || 0), 0);
  const planosAtivos = filteredPlanos.filter((p) => p.status === 'ATIVO').length;

  return (
    <>
      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Planos</p>
          <p className="text-2xl font-bold text-white">{filteredPlanos.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Planos Ativos</p>
          <p className="text-2xl font-bold text-green-400">{planosAtivos}</p>
        </div>
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Contas</p>
          <p className="text-2xl font-bold text-blue-400 font-mono">{totalContas}</p>
        </div>
      </div>

      {/* Plano Padrão */}
      {planoPadrao && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-bold text-white">Plano de Contas Padrão (DRE)</h2>
          </div>
          <div className="bg-amber-950/30 border-2 border-amber-800 rounded-lg p-6 hover:border-amber-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {planoPadrao.nome}
                      <span className="px-2 py-1 bg-amber-900 text-amber-400 rounded text-xs font-semibold">
                        PADRÃO
                      </span>
                    </h3>
                    <p className="text-slate-300 text-sm mt-1">{planoPadrao.descricao}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total de Contas</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{planoPadrao._count?.contas || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(planoPadrao.status)}`}>
                      {getStatusLabel(planoPadrao.status)}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={`/fin/cadastros/${construtoraId}/plano-contas/${planoPadrao.id}`}
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Ver Estrutura DRE
              </Link>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Código, Nome, Descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Outros Planos de Contas */}
      {outrosPlanos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Outros Planos de Contas</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-engineering w-full">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th>Descrição</th>
                    <th className="number-cell">Total de Contas</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {outrosPlanos.map((plano) => (
                    <tr key={plano.id} className="hover:bg-slate-800">
                      <td>
                        <span className="font-mono text-blue-400">{plano.codigo}</span>
                      </td>
                      <td>
                        <p className="text-white font-medium">{plano.nome}</p>
                      </td>
                      <td>
                        <p className="text-slate-300 text-sm">{plano.descricao}</p>
                      </td>
                      <td className="number-cell">
                        <p className="font-mono text-white">{plano._count?.contas || 0}</p>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(plano.status)}`}>
                          {getStatusLabel(plano.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/fin/cadastros/${construtoraId}/plano-contas/${plano.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ClipboardList className="w-4 h-4" />
                            Visualizar
                          </Link>
                          <BotaoExcluirPlano planoId={plano.id} construtoraId={construtoraId} isPadrao={plano.isPadrao} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredPlanos.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Nenhum plano de contas encontrado</p>
          <p className="text-slate-500 text-sm mt-2">Crie o primeiro plano de contas para começar</p>
        </div>
      )}

      {/* Nota sobre Múltiplos Planos */}
      <div className="mt-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Estrutura DRE:</strong> O plano de contas segue o formato de Demonstração do Resultado do Exercício,
          com todas as linhas de resultado (Receita Líquida, Lucro Bruto, EBITDA, EBIT, LAIR, Lucro Líquido) calculadas
          automaticamente. Você pode criar múltiplos planos para diferentes tipos de obras.
        </p>
      </div>
    </>
  );
}
