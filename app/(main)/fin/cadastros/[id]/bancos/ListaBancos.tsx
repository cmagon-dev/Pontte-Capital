'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Banknote, Filter, ClipboardList, QrCode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export function ListaBancos({ contas, construtoraId }: { contas: any[], construtoraId: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContas = contas.filter((conta) =>
    conta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.nomeBanco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conta.banco.includes(searchTerm) ||
    conta.agencia.includes(searchTerm) ||
    conta.conta.includes(searchTerm) ||
    conta.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSaldo = filteredContas.reduce((sum, c) => sum + Number(c.saldoAtual || 0), 0);

  // Mapear status para exibição
  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'ATIVA': 'Ativa',
      'INATIVA': 'Inativa',
      'ENCERRADA': 'Encerrada',
    };
    return statuses[status] || status;
  };

  // Extrair chaves PIX
  const getChavesPix = (conta: any) => {
    const chaves: any[] = [];
    
    if (conta.chavePix) {
      chaves.push({ tipo: conta.tipoChavePix, valor: conta.chavePix });
    }
    
    if (conta.chavesPix && Array.isArray(conta.chavesPix)) {
      chaves.push(...conta.chavesPix);
    }
    
    return chaves;
  };

  return (
    <>
      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Contas</p>
          <p className="text-2xl font-bold text-white">{filteredContas.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Contas Ativas</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredContas.filter((c) => c.status === 'ATIVA').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Saldo Total</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(totalSaldo)}</p>
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
                placeholder="Nome, Banco, Agência, Conta, Código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Bancos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-auto">
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Código</th>
                  <th className="bg-slate-900 border-b border-slate-700">Nome</th>
                  <th className="bg-slate-900 border-b border-slate-700">Banco</th>
                  <th className="bg-slate-900 border-b border-slate-700">Agência</th>
                  <th className="bg-slate-900 border-b border-slate-700">Conta</th>
                  <th className="bg-slate-900 border-b border-slate-700">Chaves PIX</th>
                  <th className="number-cell bg-slate-900 border-b border-slate-700">Saldo</th>
                  <th className="bg-slate-900 border-b border-slate-700">Status</th>
                  <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400">
                      Nenhuma conta bancária encontrada
                    </td>
                  </tr>
                ) : (
                  filteredContas.map((conta) => {
                    const chavesPix = getChavesPix(conta);
                    
                    return (
                      <tr key={conta.id} className="hover:bg-slate-800">
                        <td>
                          <p className="text-slate-400 text-sm font-mono">{conta.codigo}</p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-slate-400" />
                            <p className="font-medium text-white">{conta.nome}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-slate-300 text-sm">{conta.nomeBanco}</p>
                          <p className="text-slate-500 text-xs font-mono">{conta.banco}</p>
                        </td>
                        <td>
                          <p className="text-slate-300 text-sm font-mono">
                            {conta.agencia}{conta.agenciaDigito ? `-${conta.agenciaDigito}` : ''}
                          </p>
                        </td>
                        <td>
                          <p className="text-slate-300 text-sm font-mono">
                            {conta.conta}-{conta.contaDigito}
                          </p>
                        </td>
                        <td>
                          {chavesPix.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {chavesPix.slice(0, 2).map((chave, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <QrCode className="w-3 h-3 text-purple-400" />
                                  <span className="text-xs text-slate-400">{chave.tipo}:</span>
                                  <span className="text-xs text-slate-300 font-mono truncate max-w-[150px]">
                                    {chave.valor || chave.chave}
                                  </span>
                                </div>
                              ))}
                              {chavesPix.length > 2 && (
                                <span className="text-xs text-slate-500">+{chavesPix.length - 2} mais</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Sem chaves PIX</span>
                          )}
                        </td>
                        <td className="number-cell">
                          <p className="text-green-400 font-mono font-semibold">
                            {formatCurrency(Number(conta.saldoAtual || 0))}
                          </p>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            conta.status === 'ATIVA' 
                              ? 'bg-green-900 text-green-400' 
                              : conta.status === 'ENCERRADA'
                              ? 'bg-red-900 text-red-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {getStatusLabel(conta.status)}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/fin/cadastros/${construtoraId}/bancos/${conta.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ClipboardList className="w-4 h-4" />
                            Visualizar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
