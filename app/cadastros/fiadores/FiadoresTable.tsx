'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';

interface FiadorFormatado {
  id: string;
  codigo: string;
  codigoFormatado: string;
  tipo: string;
  nome: string;
  cpfCnpj: string;
  cpfCnpjFormatado: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  aprovadorFinanceiro: boolean;
  createdAt: Date;
}

interface FiadoresTableProps {
  fiadores: FiadorFormatado[];
}

export default function FiadoresTable({ fiadores }: FiadoresTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiadores = fiadores.filter((f) =>
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cpfCnpj.includes(searchTerm) ||
    (f.codigoFormatado && String(f.codigoFormatado).toLowerCase().includes(searchTerm.toLowerCase())) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar fiador por nome, CPF/CNPJ, código, email ou cidade..."
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
                <th>Nome/Razão Social</th>
                <th>CPF/CNPJ</th>
                <th>Tipo</th>
                <th>Cidade/Estado</th>
                <th>Aprovador?</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiadores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {searchTerm ? 'Nenhum fiador encontrado com os critérios de busca.' : 'Nenhum fiador cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filteredFiadores.map((fiador) => (
                  <tr key={fiador.id} className="hover:bg-slate-800">
                    <td className="font-mono text-slate-300">{fiador.codigoFormatado}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{fiador.nome}</span>
                      </div>
                    </td>
                    <td className="font-mono text-slate-300">{fiador.cpfCnpjFormatado}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        fiador.tipo === 'PF' 
                          ? 'bg-blue-900 text-blue-400' 
                          : 'bg-purple-900 text-purple-400'
                      }`}>
                        {fiador.tipo}
                      </span>
                    </td>
                    <td className="text-slate-300">
                      {fiador.cidade !== '-' ? `${fiador.cidade}/${fiador.estado}` : '-'}
                    </td>
                    <td>
                      {fiador.aprovadorFinanceiro ? (
                        <span className="px-2 py-1 bg-green-900 text-green-400 rounded text-xs font-semibold">
                          Sim
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">Não</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/cadastros/fiadores/${fiador.id}/cadastro`}
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
