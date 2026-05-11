import Link from 'next/link';
import { Building2, Eye, PlayCircle, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { db } from '@/lib/db';
import { calcularResumoOperacoes } from '@/app/actions/operacoes';

async function getConstrutoras() {
  return db.construtora.findMany({
    select: { id: true, razaoSocial: true, cnpj: true },
    orderBy: { razaoSocial: 'asc' },
  });
}

export default async function SolicitacoesPage() {
  const construtoras = await getConstrutoras();

  const resumos = await Promise.all(
    construtoras.map(async (c) => ({
      construtora: c,
      resumo: await calcularResumoOperacoes(c.id),
    }))
  );

  const totalGeral = resumos.reduce((sum, r) => sum + r.resumo.totalOperacoes, 0);
  const totalAbertas = resumos.reduce((sum, r) => sum + r.resumo.totalAbertas, 0);
  const totalLiquidadas = resumos.reduce((sum, r) => sum + r.resumo.totalLiquidadas, 0);
  const valorTotalAberto = resumos.reduce((sum, r) => sum + r.resumo.valorTotalAberto, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Operações Fin.</h1>
        <p className="text-slate-400">Acompanhamento de operações financeiras agrupadas por Construtora</p>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Operações</p>
          <p className="text-2xl font-bold text-blue-400">{totalGeral}</p>
        </div>
        <div className="bg-slate-900 border border-orange-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Abertas</p>
          <p className="text-2xl font-bold text-orange-400">{totalAbertas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Liquidadas</p>
          <p className="text-2xl font-bold text-green-400">{totalLiquidadas}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Total Aberto</p>
          <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(valorTotalAberto)}</p>
        </div>
      </div>

      {/* Lista por Construtora */}
      <div className="space-y-4">
        {resumos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">Nenhuma construtora cadastrada</p>
          </div>
        ) : (
          resumos.map(({ construtora, resumo }) => (
            <div key={construtora.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              {/* Cabeçalho */}
              <div className="bg-slate-800 border-b border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white">{construtora.razaoSocial}</h3>
                      <p className="text-sm text-slate-400 font-mono mt-1">{construtora.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Total de Operações</p>
                      <p className="text-2xl font-bold text-white">{resumo.totalOperacoes}</p>
                    </div>
                    <Link
                      href={`/fin/operacoes/solicitacoes/${construtora.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Obras
                    </Link>
                  </div>
                </div>
              </div>

              {/* Resumo de Operações */}
              <div className="p-3 border-b border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* À Performar */}
                  <div className="bg-slate-800 border border-blue-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <PlayCircle className="w-3 h-3 text-blue-400" />
                      <p className="text-xs font-semibold text-white">À Performar</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{resumo.totalAPerformar}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{resumo.aPerformarAbertas}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{resumo.aPerformarLiquidadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(resumo.valorAPerformarAberto)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Performadas */}
                  <div className="bg-slate-800 border border-purple-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <p className="text-xs font-semibold text-white">Performadas</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{resumo.totalPerformadas}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{resumo.performadasAbertas}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{resumo.performadasLiquidadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(resumo.valorPerformadasAberto)}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Geral */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      <p className="text-xs font-semibold text-white">Geral</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <p className="text-xs text-slate-500">Total: <span className="text-white font-semibold">{resumo.totalOperacoes}</span></p>
                        <p className="text-xs text-slate-500">Abertas: <span className="text-orange-400 font-semibold">{resumo.totalAbertas}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Liquidadas: <span className="text-green-400 font-semibold">{resumo.totalLiquidadas}</span></p>
                        <p className="text-xs text-slate-500">Valor: <span className="text-green-400 font-semibold font-mono text-xs">{formatCurrency(resumo.valorTotalAberto)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
