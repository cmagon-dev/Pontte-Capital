'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Building2 } from 'lucide-react';

interface ConstrutoraFormatada {
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

interface ConstrutorasTableProps {
  construtoras: ConstrutoraFormatada[];
}

export default function ConstrutorasTable({ construtoras }: ConstrutorasTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConstrutoras = construtoras.filter(
    (c) =>
      (c.codigoFormatado && String(c.codigoFormatado).toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm) ||
      c.cnpjFormatado.includes(searchTerm) ||
      (c.cidade && c.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.estado && c.estado.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                <th>Nome Fantasia</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredConstrutoras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {searchTerm ? 'Nenhuma construtora encontrada com esse termo.' : 'Nenhuma construtora cadastrada ainda.'}
                  </td>
                </tr>
              ) : (
                filteredConstrutoras.map((construtora) => (
                  <tr
                    key={construtora.id}
                    className="hover:bg-slate-800"
                  >
                    <td>
                      <span className="font-mono text-white font-medium">{construtora.codigoFormatado}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{construtora.razaoSocial}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-300">{construtora.nomeFantasia}</span>
                    </td>
                    <td>
                      <span className="font-mono text-slate-300">{construtora.cnpjFormatado}</span>
                    </td>
                    <td>
                      <span className="text-slate-300">{construtora.cidade}</span>
                    </td>
                    <td>
                      <span className="text-slate-300">{construtora.estado}</span>
                    </td>
                    <td>
                      <Link
                        href={`/cadastros/construtoras/${construtora.id}/cadastro`}
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
