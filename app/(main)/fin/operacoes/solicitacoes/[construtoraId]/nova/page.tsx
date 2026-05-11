'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Plus, X, PlayCircle, QrCode, Banknote, Barcode, CreditCard, Calculator, Sparkles } from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { calcularProjecaoEncargos, DEFAULT_TAXA_CONFIG } from '@/lib/types/operations';
import { criarOperacaoAPerformar, buscarSaldoPerformadoDisponivel } from '@/app/actions/operacoes';
import { buscarConfigTaxas } from '@/app/actions/config-taxas';
import { buscarCredores } from '@/app/actions/credores';
import NovoPagamentoModal from '@/app/components/NovoPagamentoModal';

type CredorSimples = { id: string; nome: string; cpfCnpj: string };

function NovaOperacaoContent({ params }: { params: { construtoraId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') || '';

  const [obraNome, setObraNome] = useState('');
  const [obraCodigo, setObraCodigo] = useState('');
  const [dataReferencia, setDataReferencia] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credores, setCredores] = useState<CredorSimples[]>([]);
  const [taxaConfig, setTaxaConfig] = useState(DEFAULT_TAXA_CONFIG);
  const [submitting, setSubmitting] = useState(false);
  const [saldoPerformadoInfo, setSaldoPerformadoInfo] = useState<{
    total: number;
    operacoes: Array<{ id: string; valorDisponivel: number; codigo: string }>;
  } | null>(null);

  const [ordensPagamento, setOrdensPagamento] = useState<Array<{
    id: string;
    credorId: string;
    credorNome: string;
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    codigoBarras?: string;
    documentos: File[];
    observacoes?: string;
    apropriacoesOrcamentarias: any[];
  }>>([]);

  const carregar = useCallback(async () => {
    if (!obraId) {
      alert('Obra não informada. Redirecionando...');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
      return;
    }

    // Buscar dados da obra
    const resObra = await fetch(`/api/construtoras/${params.construtoraId}/obras`).catch(() => null);
    if (resObra?.ok) {
      const data = await resObra.json();
      const obra = data.obras?.find((o: any) => o.id === obraId);
      if (obra) {
        setObraNome(obra.nome);
        setObraCodigo(obra.codigo);
      }
    }

    // Buscar credores, taxas e saldo performado
    const [credoresDB, config, saldoInfo] = await Promise.all([
      buscarCredores(params.construtoraId),
      buscarConfigTaxas(params.construtoraId),
      buscarSaldoPerformadoDisponivel(obraId),
    ]);
    setCredores(credoresDB.map((c: any) => ({ id: c.id, nome: c.nome, cpfCnpj: c.cpfCnpj })));
    setTaxaConfig({
      taxaJurosMensal: config.taxaJurosMensal,
      taxaAdministrativa: config.taxaAdministrativa,
      tipoTaxaAdministrativa: config.tipoTaxaAdministrativa,
    });
    setSaldoPerformadoInfo(saldoInfo);
  }, [obraId, params.construtoraId, router]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleNovoPagamento = (pagamento: {
    credorId: string;
    documentos: File[];
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    codigoBarras?: string;
    observacoes?: string;
    apropriacoesOrcamentarias: any[];
  }) => {
    const credor = credores.find((c) => c.id === pagamento.credorId);
    setOrdensPagamento([...ordensPagamento, {
      id: `tmp-${Date.now()}`,
      credorId: pagamento.credorId,
      credorNome: credor?.nome || 'Credor Desconhecido',
      tipoDocumento: pagamento.tipoDocumento,
      numeroDocumento: pagamento.numeroDocumento,
      valorTotal: pagamento.valorTotal,
      tipoPagamento: pagamento.tipoPagamento,
      codigoBarras: pagamento.codigoBarras,
      documentos: pagamento.documentos, // mantém File[] para upload posterior
      observacoes: pagamento.observacoes,
      apropriacoesOrcamentarias: pagamento.apropriacoesOrcamentarias,
    }]);
    setIsModalOpen(false);
  };

  const removeOrdem = (id: string) => setOrdensPagamento(ordensPagamento.filter((o) => o.id !== id));

  const totalOrdens = ordensPagamento.reduce((sum, o) => sum + o.valorTotal, 0);
  const saldoDisponivel = saldoPerformadoInfo?.total ?? 0;
  const saldoConsumido = Math.min(saldoDisponivel, totalOrdens);
  const valorBaseEncargos = Math.max(0, totalOrdens - saldoConsumido);

  const projecaoEncargos = useMemo(() => {
    if (!dataReferencia || totalOrdens === 0) return null;
    return calcularProjecaoEncargos(valorBaseEncargos, dataReferencia, 'TO_PERFORM', taxaConfig);
  }, [dataReferencia, valorBaseEncargos, taxaConfig, totalOrdens]);

  const desagioProjetado = projecaoEncargos?.totalEncargos || 0;
  const valorBruto = valorBaseEncargos + desagioProjetado;
  const percentualDesagio = valorBaseEncargos > 0 ? (desagioProjetado / valorBaseEncargos) * 100 : 0;

  const handleCriarOperacao = async () => {
    if (!dataReferencia) { alert('Informe a data de referência'); return; }
    if (ordensPagamento.length === 0) { alert('Adicione pelo menos uma ordem de pagamento'); return; }

    setSubmitting(true);
    try {
      const operacao = await criarOperacaoAPerformar({
        construtoraId: params.construtoraId,
        obraId,
        dataReferencia: new Date(dataReferencia),
        ordens: ordensPagamento.map((o) => ({
          credorId: o.credorId,
          tipoDocumento: o.tipoDocumento,
          numeroDocumento: o.numeroDocumento,
          valorTotal: o.valorTotal,
          tipoPagamento: o.tipoPagamento,
          codigoBarras: o.codigoBarras,
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

      // Upload de arquivos para cada ordem que tem anexos
      const ordensComArquivos = ordensPagamento.filter((o) => o.documentos.length > 0);
      if (ordensComArquivos.length > 0 && operacao.ordens) {
        await Promise.allSettled(
          operacao.ordens.map(async (ordemCriada: any, idx: number) => {
            const ordemOriginal = ordensPagamento[idx];
            if (!ordemOriginal?.documentos?.length) return;

            const form = new FormData();
            ordemOriginal.documentos.forEach((f) => form.append('arquivos', f));
            await fetch(`/api/ordens-pagamento/${ordemCriada.id}/documentos`, {
              method: 'POST',
              body: form,
            });
          })
        );
      }

      alert('Operação criada com sucesso!');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar operação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!obraId) {
    return <div className="p-8 text-center"><p className="text-slate-400">Carregando...</p></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Operação Financeira</h1>
            <p className="text-slate-400">Obra: {obraCodigo} {obraNome && `- ${obraNome}`}</p>
          </div>
        </div>
      </div>

      {/* Configuração */}
      <div className="bg-slate-900 border border-blue-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Configuração da Operação *</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo de Operação *</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-950/30 border-2 border-blue-500 rounded-lg">
              <PlayCircle className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-400">À Performar</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Data Prevista para Recompra/Medição *</label>
            <input type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Card: Saldo Performado Disponível */}
      {saldoDisponivel > 0 && totalOrdens > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-emerald-300">Saldo Performado Disponível</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-emerald-900/50">
              <span className="text-slate-300">Valor total da operação</span>
              <span className="font-mono text-white font-semibold">{formatCurrency(totalOrdens)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-emerald-900/50">
              <span className="text-emerald-300">Saldo Performado disponível</span>
              <span className="font-mono text-emerald-400 font-semibold">
                − {formatCurrency(saldoConsumido)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-300 font-semibold">
                Valor sobre o qual incidirão juros
              </span>
              <span className="font-mono text-blue-400 font-bold text-base">
                {formatCurrency(valorBaseEncargos)}
              </span>
            </div>
          </div>
          {saldoConsumido < saldoDisponivel && (
            <p className="mt-3 text-xs text-emerald-400/70">
              Saldo disponível total: {formatCurrency(saldoDisponivel)} — abatimento limitado ao valor
              da operação.
            </p>
          )}
        </div>
      )}

      {/* Ordens de Pagamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ordens de Pagamento
          </h2>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Novo Pagamento
          </button>
        </div>
        {ordensPagamento.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Nenhuma ordem de pagamento adicionada</p>
            <p className="text-sm text-slate-500">Clique em "Novo Pagamento" para adicionar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Documento</th>
                  <th className="bg-slate-900 border-b border-slate-700">Credor</th>
                  <th className="bg-slate-900 border-b border-slate-700 number-cell">Valor</th>
                  <th className="bg-slate-900 border-b border-slate-700">Tipo Pagamento</th>
                  <th className="bg-slate-900 border-b border-slate-700">Apropriação de Custos</th>
                  <th className="bg-slate-900 border-b border-slate-700 w-16">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensPagamento.map((ordem) => (
                  <tr key={ordem.id} className="hover:bg-slate-800">
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{ordem.tipoDocumento}</p>
                          <p className="text-xs text-slate-400 font-mono">{ordem.numeroDocumento}</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="text-slate-300">{ordem.credorNome}</p></td>
                    <td className="number-cell"><p className="text-green-400 font-mono font-semibold">{formatCurrency(ordem.valorTotal)}</p></td>
                    <td>
                      <div className="flex items-center gap-2">
                        {ordem.tipoPagamento === 'PIX' ? <QrCode className="w-4 h-4" /> : ordem.tipoPagamento === 'BOLETO' ? <Barcode className="w-4 h-4" /> : ordem.tipoPagamento === 'TED' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        <span className="text-slate-300">{ordem.tipoPagamento}</span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {ordem.apropriacoesOrcamentarias.map((ap: any, i: number) => (
                          <div key={i} className="text-xs flex items-center gap-1">
                            <span className={`px-1 py-0.5 rounded text-xs font-medium ${ap.tipoCusto === 'INDIRETO' ? 'bg-orange-900/40 text-orange-300' : 'bg-blue-900/40 text-blue-300'}`}>
                              {ap.tipoCusto === 'INDIRETO' ? 'Ind.' : 'Dir.'}
                            </span>
                            <span className="text-slate-300">
                              {ap.tipoCusto === 'INDIRETO' ? (ap.itemCustoIndiretoNome || 'Indireto') : (ap.subEtapaDescription || ap.subEtapaDescricao || ap.subEtapaCode)}
                            </span>
                            <span className="text-cyan-400 font-mono ml-1">{formatPercent(parseFloat(String(ap.percentual).replace(',', '.')) || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => removeOrdem(ordem.id)} className="p-1.5 hover:bg-slate-700 rounded text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 border-t-2 border-slate-700">
                  <td colSpan={2} className="text-right py-3 px-4"><span className="text-white font-semibold">Total:</span></td>
                  <td className="number-cell py-3 px-4"><span className="text-green-400 font-mono font-bold text-lg">{formatCurrency(totalOrdens)}</span></td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Juros Projetados */}
      {dataReferencia && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Juros Projetados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">
                {saldoConsumido > 0 ? 'Base de cálculo (após saldo performado)' : 'Valor Líquido'}
              </label>
              <p className="text-green-400 font-mono font-semibold text-lg">{formatCurrency(valorBaseEncargos)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Taxa Administrativa</label>
              <p className="text-cyan-400 font-mono font-semibold text-lg">{formatPercent(taxaConfig.taxaAdministrativa * 100)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Taxa de Juros Mensal</label>
              <p className="text-cyan-400 font-mono font-semibold text-lg">{formatPercent(taxaConfig.taxaJurosMensal * 100)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Deságio Projetado</label>
              <p className="text-orange-400 font-mono font-semibold text-lg">{formatCurrency(desagioProjetado)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Valor Bruto</label>
              <p className="text-green-400 font-mono font-semibold text-lg">{formatCurrency(valorBruto)}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">% de Deságio</label>
              <p className="text-orange-400 font-mono font-semibold text-lg">{formatPercent(percentualDesagio)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center justify-end gap-4">
        <Link href={`/fin/operacoes/solicitacoes/${params.construtoraId}`} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
          Cancelar
        </Link>
        <button onClick={handleCriarOperacao} disabled={!dataReferencia || ordensPagamento.length === 0 || submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? 'Criando...' : 'Criar Operação'}
        </button>
      </div>

      {obraId && (
        <NovoPagamentoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          obraId={obraId}
          construtoraId={params.construtoraId}
          onConfirm={handleNovoPagamento}
        />
      )}
    </div>
  );
}

export default function NovaOperacaoPage({ params }: { params: { construtoraId: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-center"><p className="text-slate-400">Carregando...</p></div>}>
      <NovaOperacaoContent params={params} />
    </Suspense>
  );
}
