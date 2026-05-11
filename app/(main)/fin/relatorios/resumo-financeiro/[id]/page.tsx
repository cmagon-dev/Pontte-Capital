'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils/format';

export default function ResumoFinanceiroDetailPage({ params }: { params: { id: string } }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['RECEITAS', 'DESPESAS']));

  // Estrutura de dados modelo para o banco de dados
  // DRE / Budget - Relatório de Auditoria de Custos
  const resumo = [
    {
      id: 'RECEITAS',
      categoria: 'RECEITAS',
      nivel: 0,
      orcadoOriginal: 5000000,
      comprometido: 0,
      realizado: 4500000,
      saldo: 4500000,
      filhos: ['RECEITAS-OBRAS'],
    },
    {
      id: 'RECEITAS-OBRAS',
      categoria: '  └─ Obras',
      nivel: 1,
      orcadoOriginal: 5000000,
      comprometido: 0,
      realizado: 4500000,
      saldo: 4500000,
      filhos: [],
    },
    {
      id: 'DESPESAS',
      categoria: 'DESPESAS',
      nivel: 0,
      orcadoOriginal: 3500000,
      comprometido: 3200000,
      realizado: 3100000,
      saldo: -3100000,
      filhos: ['DESPESAS-MATERIAIS', 'DESPESAS-MO', 'DESPESAS-EQUIPAMENTOS'],
    },
    {
      id: 'DESPESAS-MATERIAIS',
      categoria: '  └─ Materiais',
      nivel: 1,
      orcadoOriginal: 1500000,
      comprometido: 1450000,
      realizado: 1400000,
      saldo: -1400000,
      filhos: [],
    },
    {
      id: 'DESPESAS-MO',
      categoria: '  └─ Mão de Obra',
      nivel: 1,
      orcadoOriginal: 1200000,
      comprometido: 1100000,
      realizado: 1050000,
      saldo: -1050000,
      filhos: [],
    },
    {
      id: 'DESPESAS-EQUIPAMENTOS',
      categoria: '  └─ Equipamentos',
      nivel: 1,
      orcadoOriginal: 800000,
      comprometido: 650000,
      realizado: 650000,
      saldo: -650000,
      filhos: [],
    },
  ];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getVisibleItems = () => {
    const visible: typeof resumo = [];
    const processItem = (item: (typeof resumo)[0]) => {
      visible.push(item);
      if (item.filhos.length > 0 && expandedRows.has(item.id)) {
        item.filhos.forEach((filhoId) => {
          const filho = resumo.find((i) => i.id === filhoId);
          if (filho) processItem(filho);
        });
      }
    };
    resumo.filter((i) => i.nivel === 0).forEach(processItem);
    return visible;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/fin/relatorios/resumo-financeiro"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resumo Financeiro</h1>
          <p className="text-slate-400">DRE / Budget - Relatório de Auditoria de Custos</p>
          <p className="text-slate-500 text-sm mt-1">ID: {params.id}</p>
        </div>
      </div>

      {/* Tabela de Resumo Financeiro */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Categoria</th>
                <th className="number-cell">Orçado Original (Meta)</th>
                <th className="number-cell">Comprometido (Pedidos)</th>
                <th className="number-cell">Realizado (Pago)</th>
                <th className="number-cell">Saldo</th>
                <th>Desvio %</th>
              </tr>
            </thead>
            <tbody>
              {getVisibleItems().map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-800 ${item.nivel === 0 ? 'bg-slate-850 border-t-2 border-slate-700 font-bold' : ''}`}
                >
                  <td>
                    {item.filhos.length > 0 ? (
                      <button onClick={() => toggleRow(item.id)} className="p-1 hover:bg-slate-700 rounded">
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-6"></div>
                    )}
                  </td>
                  <td>
                    <span
                      className={item.nivel === 0 ? 'text-white' : 'text-slate-300'}
                      style={{ paddingLeft: `${item.nivel * 16}px` }}
                    >
                      {item.categoria}
                    </span>
                  </td>
                  <td className="currency-cell">{formatCurrency(item.orcadoOriginal)}</td>
                  <td className="currency-cell">{formatCurrency(item.comprometido)}</td>
                  <td className="currency-cell">{formatCurrency(item.realizado)}</td>
                  <td className={`currency-cell font-semibold ${item.saldo < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(item.saldo)}
                  </td>
                  <td>
                    <span
                      className={`font-semibold ${
                        item.orcadoOriginal > 0
                          ? Math.abs(((item.realizado - item.orcadoOriginal) / item.orcadoOriginal) * 100) > 10
                            ? 'text-red-400'
                            : 'text-green-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.orcadoOriginal > 0
                        ? formatPercent(((item.realizado - item.orcadoOriginal) / item.orcadoOriginal) * 100)
                        : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}