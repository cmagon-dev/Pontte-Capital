'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Plus, X, CheckCircle2, QrCode, Banknote, Barcode, CreditCard, Wallet } from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { listarOperacoesPorObra, criarOperacaoSaldoPerformado } from '@/app/actions/operacoes';
import { buscarCredores } from '@/app/actions/credores';
import NovoPagamentoModal from '@/app/components/NovoPagamentoModal';

type CredorSimples = { id: string; nome: string; cpfCnpj: string };
type OpAPerformar = { id: string; codigo: string; valorTotalOrdens: number | string; dataReferencia: Date | string; ordens: Array<{ credor: { nome: string } }> };

function NovaSaldoPerformadoContent({ params }: { params: { construtoraId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') || '';

  const [obraNome, setObraNome] = useState('');
  const [obraCodigo, setObraCodigo] = useState('');
  const [dataReferencia, setDataReferencia] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credores, setCredores] = useState<CredorSimples[]>([]);
  const [operacoesDisponiveis, setOperacoesDisponiveis] = useState<OpAPerformar[]>([]);
  const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [ordensPagamento, setOrdensPagamento] = useState<Array<{
    id: string; credorId: string; credorNome: string; tipoDocumento: string;
    numeroDocumento: string; valorTotal: number; tipoPagamento: string;
    documentos: string[]; observacoes?: string; apropriacoesOrcamentarias: any[];
  }>>([]);

  const carregar = useCallback(async () => {
    if (!obraId) {
      alert('Obra não informada. Redirecionando...');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
      return;
    }
    const resObra = await fetch(`/api/construtoras/${params.construtoraId}/obras`).catch(() => null);
    if (resObra?.ok) {
      const data = await resObra.json();
      const obra = data.obras?.find((o: any) => o.id === obraId);
      if (obra) { setObraNome(obra.nome); setObraCodigo(obra.codigo); }
    }
    const [ops, creds] = await Promise.all([
      listarOperacoesPorObra(obraId, { tipo: 'A_PERFORMAR', statusFinanceiro: 'ABERTO' }),
      buscarCredores(params.construtoraId),
    ]);
    setOperacoesDisponiveis(ops as unknown as OpAPerformar[]);
    setCredores(creds.map((c: any) => ({ id: c.id, nome: c.nome, cpfCnpj: c.cpfCnpj })));
  }, [obraId, params.construtoraId, router]);

  useEffect(() => { carregar(); }, [carregar]);

  const toggle = (id: string) => {
    const set = new Set(operacoesSelecionadas);
    if (set.has(id)) set.delete(id); else set.add(id);
    setOperacoesSelecionadas(set);
  };

  const handleNovoPagamento = (pagamento: any) => {
    const credor = credores.find((c) => c.id === pagamento.credorId);
    setOrdensPagamento([...ordensPagamento, {
      id: `tmp-${Date.now()}`,
      credorId: pagamento.credorId,
      credorNome: credor?.nome || 'Desconhecido',
      tipoDocumento: pagamento.tipoDocumento,
      numeroDocumento: pagamento.numeroDocumento,
      valorTotal: pagamento.valorTotal,
      tipoPagamento: pagamento.tipoPagamento,
      documentos: pagamento.documentos.map((d: File) => d.name),
      observacoes: pagamento.observacoes,
      apropriacoesOrcamentarias: pagamento.apropriacoesOrcamentarias,
      apropriacoesFinanceiras: [],
    }]);
    setIsModalOpen(false);
  };

  const totalOrdens = ordensPagamento.reduce((s, o) => s + o.valorTotal, 0);
  const valorTotalSelecionado = useMemo(() =>
    operacoesDisponiveis.filter((op) => operacoesSelecionadas.has(op.id)).reduce((s, op) => s + Number(op.valorTotalOrdens), 0),
    [operacoesDisponiveis, operacoesSelecionadas]
  );
  const saldoDisponivel = valorTotalSelecionado - totalOrdens;

  const handleCriar = async () => {
    if (!dataReferencia) { alert('Informe a data de referência'); return; }
    if (ordensPagamento.length === 0) { alert('Adicione pelo menos uma ordem de pagamento'); return; }
    setSubmitting(true);
    try {
      await criarOperacaoSaldoPerformado({
        construtoraId: params.construtoraId,
        obraId,
        dataReferencia: new Date(dataReferencia),
        operacoesRecompradas: Array.from(operacoesSelecionadas),
        ordens: ordensPagamento.map((o) => ({
          credorId: o.credorId,
          tipoDocumento: o.tipoDocumento,
          numeroDocumento: o.numeroDocumento,
          valorTotal: o.valorTotal,
          tipoPagamento: o.tipoPagamento,
          observacoes: o.observacoes || undefined,
          apropriacoesOrcamentarias: o.apropriacoesOrcamentarias.map((ap: any) => ({
            subEtapaCodigo: ap.subEtapaCode || ap.subEtapaCodigo || '',
            subEtapaDescricao: ap.subEtapaDescription || ap.subEtapaDescricao || '',
            etapaNome: ap.etapa || ap.etapaNome || '',
            percentual: parseFloat(String(ap.percentual).replace(',', '.')) || 0,
            valor: parseFloat(String(ap.valor).replace(',', '.')) || 0,
            itemVisaoGerencialId: ap.tipoCusto === 'DIRETO' ? (ap.subEtapaId || null) : null,
            percentualComprado: ap.tipoCusto === 'DIRETO' ? (parseFloat(String(ap.percentualComprado || '0').replace(',', '.')) || 0) : 0,
            tipoCusto: ap.tipoCusto || 'DIRETO',
            subcategoriaDireta: ap.tipoCusto === 'DIRETO' ? (ap.subcategoriaDireta || null) : null,
            itemCustoIndiretoId: ap.tipoCusto === 'INDIRETO' ? (ap.itemCustoIndiretoId || null) : null,
          })),
        })),
      });
      alert('Operação Saldo Performado criada com sucesso!');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar operação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!obraId) return <div className="p-8 text-center"><p className="text-slate-400">Carregando...</p></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Operação Saldo Performado</h1>
            <p className="text-slate-400">Obra: {obraCodigo} {obraNome && `- ${obraNome}`}</p>
          </div>
        </div>
      </div>

      {/* Data de Referência */}
      <div className="bg-slate-900 border border-amber-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Configuração *</h2>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Data de Referência *</label>
          <input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} min={new Date().toISOString().split('T')[0]}
            className="w-full max-w-xs px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      {/* Operações À Performar para usar saldo */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Operações "À Performar" — Saldo Disponível</h2>
        {operacoesDisponiveis.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Nenhuma operação "À Performar" aberta disponível</p>
        ) : (
          <div className="space-y-2">
            {operacoesDisponiveis.map((op) => {
              const sel = operacoesSelecionadas.has(op.id);
              return (
                <div key={op.id} onClick={() => toggle(op.id)} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${sel ? 'bg-amber-950/30 border-amber-500' : 'bg-slate-800 border-slate-700 hover:border-amber-600'}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${sel ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`}>
                      {sel && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-amber-400 font-semibold">{op.codigo}</span>
                        <span className="text-slate-300">{op.ordens[0]?.credor?.nome || 'N/A'}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">Ref.: {formatDate(new Date(op.dataReferencia).toString())}</p>
                    </div>
                    <p className="text-green-400 font-mono font-semibold">{formatCurrency(Number(op.valorTotalOrdens))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ordens de Pagamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ordens de Pagamento (uso do saldo)
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Plus className="w-5 h-5" />
            Novo Pagamento
          </button>
        </div>
        {ordensPagamento.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
            <p className="text-slate-400">Nenhuma ordem adicionada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Documento</th>
                  <th className="bg-slate-900 border-b border-slate-700">Credor</th>
                  <th className="number-cell bg-slate-900 border-b border-slate-700">Valor</th>
                  <th className="bg-slate-900 border-b border-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensPagamento.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800">
                    <td><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" /><div><p className="text-white">{o.tipoDocumento}</p><p className="text-xs text-slate-400 font-mono">{o.numeroDocumento}</p></div></div></td>
                    <td><p className="text-slate-300">{o.credorNome}</p></td>
                    <td className="number-cell"><p className="text-green-400 font-mono font-semibold">{formatCurrency(o.valorTotal)}</p></td>
                    <td><button onClick={() => setOrdensPagamento(ordensPagamento.filter((x) => x.id !== o.id))} className="p-1.5 hover:bg-slate-700 rounded text-red-400"><X className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 border-t-2 border-slate-700">
                  <td colSpan={2} className="text-right py-3 px-4"><span className="text-white font-semibold">Total:</span></td>
                  <td className="number-cell py-3 px-4"><span className="text-green-400 font-mono font-bold">{formatCurrency(totalOrdens)}</span></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Resumo do Saldo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-xs text-slate-400 mb-1">Saldo À Performar Selecionado</label>
            <p className="text-amber-400 font-mono font-semibold text-lg">{formatCurrency(valorTotalSelecionado)}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-xs text-slate-400 mb-1">Total das Ordens</label>
            <p className="text-green-400 font-mono font-semibold text-lg">{formatCurrency(totalOrdens)}</p>
          </div>
          <div className={`bg-slate-800 border rounded-lg p-4 ${saldoDisponivel >= 0 ? 'border-green-500/50' : 'border-red-500'}`}>
            <label className="block text-xs text-slate-400 mb-1">Saldo Residual</label>
            <p className={`font-mono font-semibold text-lg ${saldoDisponivel >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(saldoDisponivel)}</p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end gap-4">
        <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}`} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
          Cancelar
        </Link>
        <button onClick={handleCriar} disabled={!dataReferencia || ordensPagamento.length === 0 || submitting}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Criando...' : 'Criar Saldo Performado'}
        </button>
      </div>

      {obraId && (
        <NovoPagamentoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} obraId={obraId} construtoraId={params.construtoraId} onConfirm={handleNovoPagamento} />
      )}
    </div>
  );
}

export default function NovaSaldoPerformadoPage({ params }: { params: { construtoraId: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center"><p className="text-slate-400">Carregando...</p></div>}>
      <NovaSaldoPerformadoContent params={params} />
    </Suspense>
  );
}
