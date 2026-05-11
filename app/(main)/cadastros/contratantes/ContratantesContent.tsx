'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Landmark, TrendingUp, AlertCircle, Shield } from 'lucide-react';

interface ContratanteFormatado {
  id: string;
  codigo: string;
  codigoFormatado: string;
  razaoSocial: string;
  cnpj: string;
  cnpjFormatado: string;
  cidade: string;
  estado: string;
  createdAt: Date;
  // Indicadores de Risco
  score: number | null;
  classificacaoRisco: 'Baixo' | 'Médio' | 'Alto' | null;
  taxaAtraso: number | null;
}

interface ContratantesContentProps {
  contratantes: ContratanteFormatado[];
}

export default function ContratantesContent({ contratantes }: ContratantesContentProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContratantes = contratantes.filter(
    (c) =>
      (c.codigoFormatado && String(c.codigoFormatado).toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm) ||
      c.cnpjFormatado.includes(searchTerm) ||
      (c.cidade && c.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.estado && c.estado.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função auxiliar para cor do risco
  const getRiscoColor = (risco: 'Baixo' | 'Médio' | 'Alto' | null) => {
    if (!risco) return 'bg-slate-700 text-slate-400';
    switch (risco) {
      case 'Baixo':
        return 'bg-green-900/30 text-green-400 border border-green-500/30';
      case 'Médio':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30';
      case 'Alto':
        return 'bg-red-900/30 text-red-400 border border-red-500/30';
    }
  };

  // Função auxiliar para cor do score
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <>
      {/* Filtro */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Código, Razão Social, CNPJ ou Cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Razão Social</th>
                <th>CNPJ</th>
                <th>Cidade/UF</th>
                <th className="text-center">Score</th>
                <th className="text-center">Risco</th>
                <th className="text-center">Taxa Atraso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContratantes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    {searchTerm ? 'Nenhum contratante encontrado com esse termo.' : 'Nenhum contratante cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filteredContratantes.map((contratante) => (
                  <tr
                    key={contratante.id}
                    className="hover:bg-slate-800"
                  >
                    <td>
                      <span className="font-mono text-white font-medium">{contratante.codigoFormatado}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{contratante.razaoSocial}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-slate-300">{contratante.cnpjFormatado}</span>
                    </td>
                    <td>
                      <span className="text-slate-300">
                        {contratante.cidade && contratante.estado 
                          ? `${contratante.cidade}/${contratante.estado}`
                          : contratante.cidade || contratante.estado || '-'}
                      </span>
                    </td>
                    <td className="text-center">
                      {contratante.score !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="w-3 h-3 text-slate-400" />
                          <span className={`font-bold ${getScoreColor(contratante.score)}`}>
                            {contratante.score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      {contratante.classificacaoRisco ? (
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getRiscoColor(contratante.classificacaoRisco)}`}>
                          {contratante.classificacaoRisco}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      {contratante.taxaAtraso !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3 text-slate-400" />
                          <span className={`font-bold ${
                            contratante.taxaAtraso > 10 ? 'text-red-400' : 
                            contratante.taxaAtraso > 5 ? 'text-yellow-400' : 
                            'text-green-400'
                          }`}>
                            {contratante.taxaAtraso.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cadastros/contratantes/${contratante.id}/cadastro`}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          Cadastro
                        </Link>
                        <span className="text-slate-600">|</span>
                        <Link
                          href={`/cadastros/contratantes/${contratante.id}/analise`}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          Análise
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
    </>
  );
}
