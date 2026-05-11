'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FolderKanban } from 'lucide-react';

interface FundoFormatado {
  id: string;
  codigo: string;
  codigoFormatado: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  cnpjFormatado: string;
  cidade: string;
  estado: string;
  createdAt: Date;
}

interface FundosTableProps {
  fundos: FundoFormatado[];
}

export default function FundosTable({ fundos }: FundosTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFundos = fundos.filter((f) =>
    f.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cnpj.includes(searchTerm) ||
    (f.codigoFormatado && String(f.codigoFormatado).toLowerCase().includes(searchTerm.toLowerCase())) ||
    f.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar fundo por nome, CNPJ, código ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome do Fundo</th>
                <th>CNPJ</th>
                <th>Cidade/Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFundos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {searchTerm ? 'Nenhum fundo encontrado com os critérios de busca.' : 'Nenhum fundo cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filteredFundos.map((fundo) => (
                  <tr key={fundo.id} className="hover:bg-slate-800">
                    <td className="font-mono text-slate-300">{fundo.codigoFormatado}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{fundo.nomeFantasia}</span>
                      </div>
                    </td>
                    <td className="font-mono text-slate-300">{fundo.cnpjFormatado}</td>
                    <td className="text-slate-300">
                      {fundo.cidade !== '-' ? `${fundo.cidade}/${fundo.estado}` : '-'}
                    </td>
                    <td>
                      <Link
                        href={`/cadastros/fundos/${fundo.id}/cadastro`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Ver Detalhes
                      </Link>
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
