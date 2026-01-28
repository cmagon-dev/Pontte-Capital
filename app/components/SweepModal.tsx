'use client';

import { useState, useMemo } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { calcularProjecaoEncargos, DEFAULT_TAXA_CONFIG } from '@/lib/types/operations';

interface OperacaoAPerformar {
  id: string;
  numero: string;
  dataSolicitacao: string;
  credor: { nome: string; cnpj: string };
  valor: number;
  projecaoEncargos?: {
    dataReferencia: string;
    totalEncargos: number;
    jurosProjetados: number;
    taxasProjetadas: number;
  };
  dataLiquidacaoPrevista?: string;
  statusFinanceiro: string;
}

interface SweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  operacoesAPerformar: OperacaoAPerformar[]; // Operações à performar em aberto disponíveis para recompra
  onConfirmarRecompra: (operacoesSelecionadas: string[], valorTotalRecompra: number) => void;
}

export default function SweepModal({
  isOpen,
  onClose,
  operacoesAPerformar,
  onConfirmarRecompra,
}: SweepModalProps) {
  const [operacoesSelecionadas, setOperacoesSelecionadas] = useState<Set<string>>(new Set());
  const [dataRecompra, setDataRecompra] = useState<string>('');

  // Calcular total de recompra
  const calculosRecompra = useMemo(() => {
    let valorPrincipalTotal = 0;
    let jurosProjetadosTotal = 0;
    let jurosRealizadosTotal = 0;
    let taxasTotal = 0;

    operacoesAPerformar.forEach((op) => {
      if (operacoesSelecionadas.has(op.id)) {
        valorPrincipalTotal += op.valor;

        // Juros projetados (calculados na criação)
        if (op.projecaoEncargos) {
          jurosProjetadosTotal += op.projecaoEncargos.jurosProjetados;
          taxasTotal += op.projecaoEncargos.taxasProjetadas;
        }

        // Recalcular juros realizado com data efetiva de hoje (se diferente da projetada)
        if (dataRecompra) {
          const projecaoRealizada = calcularProjecaoEncargos(
            op.valor,
            dataRecompra,
            'TO_PERFORM',
            DEFAULT_TAXA_CONFIG
          );
          jurosRealizadosTotal += projecaoRealizada.jurosProjetados;
        }
      }
    });

    const diferencaJuros = jurosRealizadosTotal - jurosProjetadosTotal;
    const valorTotalRecompra = valorPrincipalTotal + jurosRealizadosTotal + taxasTotal;

    return {
      valorPrincipalTotal,
      jurosProjetadosTotal,
      jurosRealizadosTotal,
      taxasTotal,
      diferencaJuros,
      valorTotalRecompra,
    };
  }, [operacoesSelecionadas, operacoesAPerformar, dataRecompra]);

  const toggleOperacao = (operacaoId: string) => {
    const newSelection = new Set(operacoesSelecionadas);
    if (newSelection.has(operacaoId)) {
      newSelection.delete(operacaoId);
    } else {
      newSelection.add(operacaoId);
    }
    setOperacoesSelecionadas(newSelection);
  };

  const handleConfirmar = () => {
    if (operacoesSelecionadas.size === 0) {
      alert('Selecione pelo menos uma operação à performar para recomprar');
      return;
    }

    if (!dataRecompra) {
      alert('Informe a data de recompra');
      return;
    }

    onConfirmarRecompra(
      Array.from(operacoesSelecionadas),
      calculosRecompra.valorTotalRecompra
    );
    
    // Reset
    setOperacoesSelecionadas(new Set());
    setDataRecompra('');
    onClose();
  };

  if (!isOpen) return null;

  // Filtrar apenas operações à performar em aberto
  const operacoesDisponiveis = operacoesAPerformar.filter(
    (op) => op.statusFinanceiro === 'Aberto'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-blue-400" />
              Encontro de Contas - Recompra de Operações à Performar
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Selecione as operações à performar que serão liquidadas por esta operação performada
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Data de Recompra */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data de Recompra (Data Efetiva) *
            </label>
            <input
              type="date"
              value={dataRecompra}
              onChange={(e) => setDataRecompra(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              A data efetiva será usada para recalcular os juros realizados vs. projetados
            </p>
          </div>

          {/* Lista de Operações à Performar Disponíveis */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Operações à Performar Disponíveis para Recompra
            </h3>
            {operacoesDisponiveis.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">Nenhuma operação à performar em aberto disponível</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {operacoesDisponiveis.map((operacao) => {
                  const isSelected = operacoesSelecionadas.has(operacao.id);
                  const jurosRealizado = dataRecompra
                    ? calcularProjecaoEncargos(
                        operacao.valor,
                        dataRecompra,
                        'TO_PERFORM',
                        DEFAULT_TAXA_CONFIG
                      ).jurosProjetados
                    : operacao.projecaoEncargos?.jurosProjetados || 0;
                  const diferencaJuros =
                    (operacao.projecaoEncargos?.jurosProjetados || 0) - jurosRealizado;
                  const valorTotalOperacao = operacao.valor + jurosRealizado + (operacao.projecaoEncargos?.taxasProjetadas || 0);

                  return (
                    <div
                      key={operacao.id}
                      onClick={() => toggleOperacao(operacao.id)}
                      className={`
                        bg-slate-800 border-2 rounded-lg p-4 cursor-pointer transition-colors
                        ${isSelected ? 'border-blue-500 bg-blue-950/20' : 'border-slate-700 hover:border-blue-600'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-blue-400" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-white font-mono">{operacao.numero}</p>
                              <p className="text-sm text-slate-400">
                                {operacao.credor.nome} - {formatDate(operacao.dataSolicitacao)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400 font-mono">
                                {formatCurrency(valorTotalOperacao)}
                              </p>
                              <p className="text-xs text-slate-500">Total a recomprar</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-slate-700">
                            <div>
                              <p className="text-xs text-slate-500">Principal</p>
                              <p className="text-sm font-semibold text-white font-mono">
                                {formatCurrency(operacao.valor)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Juros Realizado</p>
                              <p className="text-sm font-semibold text-amber-400 font-mono">
                                {formatCurrency(jurosRealizado)}
                              </p>
                              {diferencaJuros !== 0 && (
                                <p className={`text-xs mt-0.5 ${diferencaJuros > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {diferencaJuros > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(diferencaJuros))}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Taxas</p>
                              <p className="text-sm font-semibold text-purple-400 font-mono">
                                {formatCurrency(operacao.projecaoEncargos?.taxasProjetadas || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Data Prevista</p>
                              <p className="text-sm text-slate-300">
                                {operacao.dataLiquidacaoPrevista
                                  ? formatDate(operacao.dataLiquidacaoPrevista)
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo de Cálculos */}
          {operacoesSelecionadas.size > 0 && (
            <div className="bg-blue-950/20 border border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-400" />
                Resumo da Recompra
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Valor Principal Total</p>
                  <p className="text-lg font-bold text-white font-mono">
                    {formatCurrency(calculosRecompra.valorPrincipalTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Juros Realizados</p>
                  <p className="text-lg font-bold text-amber-400 font-mono">
                    {formatCurrency(calculosRecompra.jurosRealizadosTotal)}
                  </p>
                  {calculosRecompra.diferencaJuros !== 0 && (
                    <p className={`text-xs mt-1 ${calculosRecompra.diferencaJuros > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      Diferença: {formatCurrency(Math.abs(calculosRecompra.diferencaJuros))}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Taxas</p>
                  <p className="text-lg font-bold text-purple-400 font-mono">
                    {formatCurrency(calculosRecompra.taxasTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total a Recomprar</p>
                  <p className="text-xl font-bold text-green-400 font-mono">
                    {formatCurrency(calculosRecompra.valorTotalRecompra)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={operacoesSelecionadas.size === 0 || !dataRecompra}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Confirmar Recompra ({operacoesSelecionadas.size} operação(ões))
          </button>
        </div>
      </div>
    </div>
  );
}
