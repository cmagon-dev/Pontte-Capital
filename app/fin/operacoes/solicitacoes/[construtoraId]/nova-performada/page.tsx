'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Upload, X, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';
import { getConstrutoraById, getObraById } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils/format';

function NovaOperacaoPerformadaContent({ params }: { params: { construtoraId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraId = searchParams?.get('obraId') || '';

  const construtora = getConstrutoraById(params.construtoraId);
  const obra = obraId ? getObraById(obraId) : null;

  // Estados do formulário
  const [numeroNF, setNumeroNF] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [documentos, setDocumentos] = useState<File[]>([]);

  // Estado para operações "À Performar" selecionadas (mock - em produção viria de API)
  const [operacoesAPerformarDisponiveis, setOperacoesAPerformarDisponiveis] = useState<Array<{
    id: string;
    numero: string;
    valor: number;
    credorNome: string;
    dataLiquidacaoPrevista: string;
  }>>([]);
  
  const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<Set<string>>(new Set());

  // Verificar se obraId foi fornecido
  useEffect(() => {
    if (!obraId) {
      alert('Obra não informada. Redirecionando...');
      router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
    }
  }, [obraId, router, params.construtoraId]);

  // Carregar operações "À Performar" abertas (mock)
  useEffect(() => {
    if (obraId) {
      // Mock: operações "À Performar" abertas da obra
      const operacoes = [
        {
          id: 'OP-001',
          numero: '001/2024',
          valor: 45000.00,
          credorNome: 'Fornecedor ABC Ltda',
          dataLiquidacaoPrevista: '2024-02-15',
        },
        {
          id: 'OP-004',
          numero: '004/2024',
          valor: 35000.00,
          credorNome: 'Empreiteiro XYZ',
          dataLiquidacaoPrevista: '2024-03-01',
        },
      ];
      setOperacoesAPerformarDisponiveis(operacoes);
    }
  }, [obraId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setDocumentos([...documentos, ...filesArray]);
      e.target.value = ''; // Reset input
    }
  };

  const removeDocumento = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  const toggleOperacaoSelecionada = (opId: string) => {
    const novas = new Set(operacoesSelecionadas);
    if (novas.has(opId)) {
      novas.delete(opId);
    } else {
      novas.add(opId);
    }
    setOperacoesSelecionadas(novas);
  };

  // Calcular valor total das operações selecionadas
  const valorTotalOperacoesSelecionadas = useMemo(() => {
    return operacoesAPerformarDisponiveis
      .filter((op) => operacoesSelecionadas.has(op.id))
      .reduce((sum, op) => sum + op.valor, 0);
  }, [operacoesAPerformarDisponiveis, operacoesSelecionadas]);

  const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  const saldoResidual = valorNumerico - valorTotalOperacoesSelecionadas;

  const handleCriarOperacao = () => {
    if (!numeroNF || !valor || !dataVencimento) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    if (operacoesSelecionadas.size === 0) {
      alert('Selecione pelo menos uma operação "À Performar" para recomprar');
      return;
    }
    // Em produção, salvaria a operação
    alert('Operação Performada criada com sucesso!');
    router.push(`/fin/operacoes/solicitacoes/${params.construtoraId}`);
  };

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
          <Building2 className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Operação Performada</h1>
            <p className="text-slate-400">Obra: {obra.numeroContrato} - {obra.objeto.substring(0, 60)}...</p>
          </div>
        </div>
      </div>

      {/* Dados da NF */}
      <div className="bg-slate-900 border border-purple-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Dados da Nota Fiscal *</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Número da NF *</label>
            <input
              type="text"
              value={numeroNF}
              onChange={(e) => setNumeroNF(e.target.value)}
              placeholder="Ex: NF-12345"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Valor *</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const formatted = (parseInt(value) / 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setValor(formatted);
              }}
              placeholder="R$ 0,00"
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Data de Vencimento (Pagamento do Órgão) *</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Anexar Documentos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Anexar Documentos</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">NF/Medição/Outros</label>
            <input
              type="file"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          {documentos.length > 0 && (
            <div className="space-y-2">
              {documentos.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">{doc.name}</span>
                    <span className="text-slate-500 text-xs">({(doc.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <button
                    onClick={() => removeDocumento(index)}
                    className="p-1.5 hover:bg-slate-700 rounded text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seleção de Operações "À Performar" */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Selecionar Operações "À Performar" para Recompra *</h2>
        {operacoesAPerformarDisponiveis.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Nenhuma operação "À Performar" aberta disponível</p>
        ) : (
          <div className="space-y-2">
            {operacoesAPerformarDisponiveis.map((op) => {
              const isSelected = operacoesSelecionadas.has(op.id);
              return (
                <div
                  key={op.id}
                  onClick={() => toggleOperacaoSelecionada(op.id)}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500'
                      : 'bg-slate-800 border-slate-700 hover:border-purple-600'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-500'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-purple-400 font-semibold">{op.numero}</span>
                        <span className="text-slate-300">{op.credorNome}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>Vencimento: {formatDate(op.dataLiquidacaoPrevista)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-mono font-semibold">{formatCurrency(op.valor)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-xs text-slate-400 mb-1">Valor da NF</label>
            <p className="text-green-400 font-mono font-semibold text-lg">
              {formatCurrency(valorNumerico)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-xs text-slate-400 mb-1">Valor Total Selecionado</label>
            <p className="text-purple-400 font-mono font-semibold text-lg">
              {formatCurrency(valorTotalOperacoesSelecionadas)}
            </p>
          </div>
          <div className={`bg-slate-800 border rounded-lg p-4 ${
            saldoResidual > 0 ? 'border-orange-500' : 'border-slate-700'
          }`}>
            <label className="block text-xs text-slate-400 mb-1">Saldo Residual</label>
            <p className={`font-mono font-semibold text-lg ${
              saldoResidual > 0 ? 'text-orange-400' : 'text-slate-400'
            }`}>
              {formatCurrency(saldoResidual)}
            </p>
            {saldoResidual > 0 && (
              <p className="text-xs text-orange-400 mt-1">
                Saldo disponível para nova operação
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCriarOperacao}
          disabled={!numeroNF || !valor || !dataVencimento || operacoesSelecionadas.size === 0}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
        >
          Criar Operação Performada
        </button>
      </div>
    </div>
  );
}

export default function NovaOperacaoPerformadaPage({ params }: { params: { construtoraId: string } }) {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    }>
      <NovaOperacaoPerformadaContent params={params} />
    </Suspense>
  );
}
