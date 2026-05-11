'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { listarExtratoCaixaSaldoPerformado } from '@/app/actions/operacoes';

type ExtratoItem = Awaited<ReturnType<typeof listarExtratoCaixaSaldoPerformado>>[number];

export default function CaixaSaldoPerformadoPage({ params }: { params: { construtoraId: string } }) {
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') ?? '';
  const [extrato, setExtrato] = useState<ExtratoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      if (!obraId) {
        setExtrato([]);
        setLoading(false);
        return;
      }
      const dados = await listarExtratoCaixaSaldoPerformado(obraId);
      setExtrato(dados);
      setLoading(false);
    };
    carregar();
  }, [obraId]);

  const saldoAtual = useMemo(() => {
    return extrato.reduce((saldo, item) => {
      const valor = Number(item.valor);
      if (item.tipo === 'CREDITO' || item.tipo === 'AJUSTE_CREDITO') return saldo + valor;
      return saldo - valor;
    }, 0);
  }, [extrato]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Wallet className="w-7 h-7 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Extrato do Caixa de Saldo Performado</h1>
            <p className="text-slate-400">Saldo atual: {formatCurrency(saldoAtual)}</p>
          </div>
        </div>
      </div>

      {!obraId ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">
          Selecione uma obra na tela de solicitações para visualizar o extrato.
        </div>
      ) : loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">Carregando extrato...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descricao</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {extrato.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Nenhum lancamento encontrado para esta obra.
                  </td>
                </tr>
              ) : (
                extrato.map((item) => {
                  const credito = item.tipo === 'CREDITO' || item.tipo === 'AJUSTE_CREDITO';
                  return (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${credito ? 'bg-green-900/40 text-green-400' : 'bg-orange-900/40 text-orange-400'}`}>
                          {credito ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {credito ? 'Credito' : 'Debito'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{item.descricao}</td>
                      <td className={`px-4 py-3 text-sm font-mono ${credito ? 'text-green-400' : 'text-orange-400'}`}>
                        {credito ? '+' : '-'} {formatCurrency(Number(item.valor))}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(item.createdAt.toString())}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
