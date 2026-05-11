'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, TrendingUp, Calendar, Download, Building2, FileText } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';

export default function DetalhesReajustePage({ params }: { params: { id: string; reajusteId: string } }) {
  const contratoId = params.id;
  const reajusteId = params.reajusteId;

  // Em produção, buscar dados do reajuste pelo ID
  const reajuste = {
    id: reajusteId,
    dataBase: '2024-01',
    indice: 'INCC',
    percentual: 5.2,
    valorReajuste: 250000,
    dataAplicacao: '2024-02-01',
    arquivo: 'memoria_calculo_reajuste_001_2024.xlsx',
    contratoRelacionado: {
      id: contratoId,
      numero: '001/2024',
      objeto: 'Reforma e Ampliação da Escola Municipal Santa Rita',
    },
  };

  // Função auxiliar para formatar data base (YYYY-MM)
  const formatDateBase = (dateString: string) => {
    if (dateString.includes('-') && dateString.length === 7) {
      // Formato YYYY-MM (data base)
      const [year, month] = dateString.split('-');
      return `${month}/${year}`;
    }
    return formatDate(dateString);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${contratoId}?tab=reajustes`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Reajuste {reajuste.indice}</h1>
              <span className="px-3 py-1 bg-green-900 text-green-400 rounded text-sm font-semibold">
                Aplicado
              </span>
            </div>
            <p className="text-slate-400">Detalhes do Reajuste Contratual</p>
          </div>
        </div>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${contratoId}/reajustes/${reajusteId}/editar`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          Editar Reajuste
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Reajuste */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Informações do Reajuste
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data Base</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-white font-mono">{formatDateBase(reajuste.dataBase)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Índice Aplicado</label>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-white font-medium text-lg">{reajuste.indice}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Percentual Acumulado</label>
                <p className="text-white font-mono text-2xl font-bold">{formatPercent(reajuste.percentual)}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor do Reajuste</label>
                <p className="text-green-400 font-bold font-mono text-2xl">
                  {formatCurrency(reajuste.valorReajuste)}
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data de Aplicação</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-white">{formatDate(reajuste.dataAplicacao)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documento */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Documentação</h2>
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-white font-medium">{reajuste.arquivo}</p>
                  <p className="text-sm text-slate-400">Memória de Cálculo</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contrato Relacionado */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Contrato Relacionado</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Contrato
                </label>
                <Link
                  href={`/eng/contratos/contratos-obras/obra/${contratoId}`}
                  className="text-blue-400 hover:text-blue-300 font-medium block"
                >
                  {reajuste.contratoRelacionado.numero}
                </Link>
                <p className="text-sm text-slate-400 mt-1">{reajuste.contratoRelacionado.objeto}</p>
              </div>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-2">Importante</h3>
            <p className="text-sm text-blue-300">
              Este reajuste será aplicado dinamicamente no momento da medição. O valor não altera os
              preços na tabela de orçamento, mas cria uma rubrica separada na fatura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
