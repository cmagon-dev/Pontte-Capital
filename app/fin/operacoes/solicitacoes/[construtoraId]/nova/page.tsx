'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Plus, X, Eye, DollarSign, PlayCircle, QrCode, Banknote, Barcode, CreditCard, Calculator } from 'lucide-react';
import { getConstrutoraById, getObraById } from '@/lib/mock-data';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';
import { OperationType, calcularProjecaoEncargos, DEFAULT_TAXA_CONFIG } from '@/lib/types/operations';
import NovoPagamentoModal from '@/app/components/NovoPagamentoModal';

function NovaOperacaoContent({ params }: { params: { construtoraId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') || '';

  const construtora = getConstrutoraById(params.construtoraId);
  const obra = obraId ? getObraById(obraId) : null;

  const [tipoOperacao, setTipoOperacao] = useState<OperationType>('TO_PERFORM');
  const [dataReferencia, setDataReferencia] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para Ordens de Pagamento
  const [ordensPagamento, setOrdensPagamento] = useState<Array<{
    id: string;
    credorId: string;
    credorNome: string;
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    documentos: string[];
    apropriacoesOrcamentarias: any[];
    apropriacoesFinanceiras: any[];
  }>>([]);

  // Verificar se obraId foi fornecido
  useEffect(() => {
    if (!obraId) {
      alert('Obra não informada. Redirecionando...');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
    }
  }, [obraId, router, params.construtoraId]);

  const handleNovoPagamento = (pagamento: {
    credorId: string;
    documentos: File[];
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    codigoBarras?: string;
    apropriacoesOrcamentarias: any[];
    apropriacoesFinanceiras: any[];
  }) => {
    // Buscar nome do credor (mock)
    const credores = [
      { id: 'CRED-001', nome: 'Fornecedor ABC Ltda' },
      { id: 'CRED-002', nome: 'Empreiteiro XYZ' },
    ];
    const credor = credores.find((c) => c.id === pagamento.credorId);

    const novaOrdem = {
      id: `OP-${Date.now()}`,
      credorId: pagamento.credorId,
      credorNome: credor?.nome || 'Credor Desconhecido',
      tipoDocumento: pagamento.tipoDocumento,
      numeroDocumento: pagamento.numeroDocumento,
      valorTotal: pagamento.valorTotal,
      tipoPagamento: pagamento.tipoPagamento,
      documentos: pagamento.documentos.map((doc) => doc.name),
      apropriacoesOrcamentarias: pagamento.apropriacoesOrcamentarias,
      apropriacoesFinanceiras: pagamento.apropriacoesFinanceiras,
    };

    setOrdensPagamento([...ordensPagamento, novaOrdem]);
    setIsModalOpen(false);
  };

  const removeOrdemPagamento = (id: string) => {
    setOrdensPagamento(ordensPagamento.filter((op) => op.id !== id));
  };

  const totalOrdens = ordensPagamento.reduce((sum, op) => sum + op.valorTotal, 0);

  // Calcular projeção de juros quando data de referência estiver preenchida
  const projecaoEncargos = useMemo(() => {
    if (!dataReferencia || totalOrdens === 0) {
      return null;
    }
    return calcularProjecaoEncargos(totalOrdens, dataReferencia, tipoOperacao, DEFAULT_TAXA_CONFIG);
  }, [dataReferencia, totalOrdens, tipoOperacao]);

  // Calcular valores para exibição
  const valorLiquido = totalOrdens;
  const taxaOperacaoPercentual = DEFAULT_TAXA_CONFIG.taxaAdministrativa * 100; // Converter para percentual
  const taxaJurosMensalPercentual = DEFAULT_TAXA_CONFIG.taxaJurosMensal * 100; // Converter para percentual
  const desagioProjetado = projecaoEncargos?.totalEncargos || 0;
  const valorBruto = valorLiquido + desagioProjetado;
  const percentualDesagio = valorLiquido > 0 ? (desagioProjetado / valorLiquido) * 100 : 0;

  if (!obraId || !obra) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Operação Financeira</h1>
            <p className="text-slate-400">Obra: {obra.numeroContrato} - {obra.objeto.substring(0, 60)}...</p>
          </div>
        </div>
      </div>

      {/* Configuração da Operação */}
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
            <label className="block text-sm text-slate-400 mb-2">
              Data Prevista para Recompra/Medição *
            </label>
            <input
              type="date"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ordens de Pagamento */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ordens de Pagamento
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
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
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-engineering w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-slate-900 border-b border-slate-700">Documento</th>
                    <th className="bg-slate-900 border-b border-slate-700">Credor</th>
                    <th className="bg-slate-900 border-b border-slate-700 number-cell">Valor</th>
                    <th className="bg-slate-900 border-b border-slate-700">Tipo de Pagamento</th>
                    <th className="bg-slate-900 border-b border-slate-700">Documentos Anexados</th>
                    <th className="bg-slate-900 border-b border-slate-700">Apropriação Orçamentária</th>
                    <th className="bg-slate-900 border-b border-slate-700">Apropriação Financeira</th>
                    <th className="bg-slate-900 border-b border-slate-700 w-16">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordensPagamento.map((ordem) => {
                    // Ícone do tipo de pagamento
                    const getTipoPagamentoIcon = () => {
                      switch (ordem.tipoPagamento) {
                        case 'PIX':
                          return <QrCode className="w-4 h-4" />;
                        case 'Transferência':
                          return <Banknote className="w-4 h-4" />;
                        case 'Boleto':
                          return <Barcode className="w-4 h-4" />;
                        default:
                          return <CreditCard className="w-4 h-4" />;
                      }
                    };

                    // Formatar apropriações orçamentárias (serviços com %)
                    const formatarApropriacoesOrcamentarias = () => {
                      if (ordem.apropriacoesOrcamentarias.length === 0) {
                        return <span className="text-slate-400">-</span>;
                      }
                      
                      return (
                        <div className="space-y-1">
                          {ordem.apropriacoesOrcamentarias.map((ap, index) => {
                            const percentualNum = parseFloat(ap.percentual?.replace(',', '.') || '0');
                            return (
                              <div key={index} className="text-xs">
                                <span className="text-slate-300">{ap.subEtapaDescription || ap.subEtapaCode || 'Serviço'}</span>
                                <span className="text-cyan-400 font-mono ml-1">
                                  {formatPercent(percentualNum)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    };

                    // Formatar apropriações financeiras (contas com %)
                    const formatarApropriacoesFinanceiras = () => {
                      if (ordem.apropriacoesFinanceiras.length === 0) {
                        return <span className="text-slate-400">-</span>;
                      }
                      
                      return (
                        <div className="space-y-1">
                          {ordem.apropriacoesFinanceiras.map((ap, index) => {
                            const percentualNum = parseFloat(ap.percentual?.replace(',', '.') || '0');
                            return (
                              <div key={index} className="text-xs">
                                <span className="text-slate-300">{ap.contaNome || 'Conta'}</span>
                                <span className="text-purple-400 font-mono ml-1">
                                  {formatPercent(percentualNum)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    };

                    return (
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
                        <td>
                          <p className="text-slate-300">{ordem.credorNome}</p>
                        </td>
                        <td className="number-cell">
                          <p className="text-green-400 font-mono font-semibold">{formatCurrency(ordem.valorTotal)}</p>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {getTipoPagamentoIcon()}
                            <span className="text-slate-300">{ordem.tipoPagamento}</span>
                          </div>
                        </td>
                        <td>
                          <p className="text-slate-300">
                            {ordem.documentos.length} arquivo(s)
                          </p>
                        </td>
                        <td>
                          {formatarApropriacoesOrcamentarias()}
                        </td>
                        <td>
                          {formatarApropriacoesFinanceiras()}
                        </td>
                        <td>
                          <button
                            onClick={() => removeOrdemPagamento(ordem.id)}
                            className="p-1.5 hover:bg-slate-700 rounded text-red-400 transition-colors"
                            title="Remover ordem de pagamento"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800 border-t-2 border-slate-700">
                    <td colSpan={2} className="text-right py-3 px-4">
                      <span className="text-white font-semibold">Total das Ordens de Pagamento:</span>
                    </td>
                    <td className="number-cell py-3 px-4">
                      <span className="text-green-400 font-mono font-bold text-lg">{formatCurrency(totalOrdens)}</span>
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bloco de Informações de Juros Projetados */}
      {dataReferencia && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Juros Projetados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Valor Líquido</label>
              <p className="text-green-400 font-mono font-semibold text-lg">
                {formatCurrency(valorLiquido)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Taxa de Operação</label>
              <p className="text-cyan-400 font-mono font-semibold text-lg">
                {formatPercent(taxaOperacaoPercentual)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Taxa de Juros Mensal</label>
              <p className="text-cyan-400 font-mono font-semibold text-lg">
                {formatPercent(taxaJurosMensalPercentual)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Deságio Projetado</label>
              <p className="text-orange-400 font-mono font-semibold text-lg">
                {formatCurrency(desagioProjetado)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">Valor Bruto</label>
              <p className="text-green-400 font-mono font-semibold text-lg">
                {formatCurrency(valorBruto)}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <label className="block text-xs text-slate-400 mb-1">% de Deságio da Operação</label>
              <p className="text-orange-400 font-mono font-semibold text-lg">
                {formatPercent(percentualDesagio)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={() => {
            if (!dataReferencia) {
              alert('Informe a data de referência');
              return;
            }
            if (ordensPagamento.length === 0) {
              alert('Adicione pelo menos uma ordem de pagamento');
              return;
            }
            // Em produção, salvaria a operação
            alert('Operação criada com sucesso!');
            router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
          }}
          disabled={!dataReferencia || ordensPagamento.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          Criar Operação
        </button>
      </div>

      {/* Modal Novo Pagamento */}
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
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    }>
      <NovaOperacaoContent params={params} />
    </Suspense>
  );
}