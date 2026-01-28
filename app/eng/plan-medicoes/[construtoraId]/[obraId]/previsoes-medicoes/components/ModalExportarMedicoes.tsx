'use client';

import React, { useState, useMemo } from 'react';
import { X, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

type Medicao = {
  id: string;
  nome: string;
  dataPrevisao: string;
  numero: number;
  status?: 'PREVISTA' | 'EM_MEDICAO' | 'REALIZADA' | 'CANCELADA';
};

interface ModalExportarMedicoesProps {
  isOpen: boolean;
  onClose: () => void;
  medicoes: Medicao[];
  onExportar: (
    medicoesIds: string[],
    planilhas: string[],
    tipoEap: 'completa' | 'resumida',
    formato: string
  ) => void;
  temVisaoGerencial: boolean;
}

export default function ModalExportarMedicoes({
  isOpen,
  onClose,
  medicoes,
  onExportar,
  temVisaoGerencial,
}: ModalExportarMedicoesProps) {
  const [medicoesSelecionadas, setMedicoesSelecionadas] = useState<Set<string>>(new Set());
  const [planilhaContratual, setPlanilhaContratual] = useState(true);
  const [planilhaGerencial, setPlanilhaGerencial] = useState(false);
  const [tipoEap, setTipoEap] = useState<'completa' | 'resumida'>('completa');
  const [formato, setFormato] = useState<'excel' | 'pdf'>('excel');
  const [exportando, setExportando] = useState(false);

  // Ordenar medições por número
  const medicoesOrdenadas = useMemo(() => {
    return [...medicoes].sort((a, b) => a.numero - b.numero);
  }, [medicoes]);

  // Identificar a última medição selecionada
  const ultimaMedicaoSelecionada = useMemo(() => {
    if (medicoesSelecionadas.size === 0) return null;
    
    const numeros = Array.from(medicoesSelecionadas)
      .map(id => medicoes.find(m => m.id === id)?.numero)
      .filter(n => n !== undefined) as number[];
    
    return Math.max(...numeros);
  }, [medicoesSelecionadas, medicoes]);

  const toggleMedicao = (medicaoId: string) => {
    const novaSelecao = new Set(medicoesSelecionadas);
    if (novaSelecao.has(medicaoId)) {
      novaSelecao.delete(medicaoId);
    } else {
      novaSelecao.add(medicaoId);
    }
    setMedicoesSelecionadas(novaSelecao);
  };

  const selecionarTodasMedicoes = () => {
    if (medicoesSelecionadas.size === medicoes.length) {
      setMedicoesSelecionadas(new Set());
    } else {
      setMedicoesSelecionadas(new Set(medicoes.map(m => m.id)));
    }
  };

  const handleExportar = async () => {
    // Validações
    if (medicoesSelecionadas.size === 0) {
      alert('Selecione pelo menos uma medição');
      return;
    }

    if (!planilhaContratual && !planilhaGerencial) {
      alert('Selecione pelo menos uma planilha');
      return;
    }

    const planilhas: string[] = [];
    if (planilhaContratual) planilhas.push('contratual');
    if (planilhaGerencial) planilhas.push('gerencial');

    setExportando(true);
    try {
      await onExportar(
        Array.from(medicoesSelecionadas),
        planilhas,
        tipoEap,
        formato
      );
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExportando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Exportar Medições</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seleção de Medições */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">
                Selecionar Medições
              </label>
              <button
                onClick={selecionarTodasMedicoes}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {medicoesSelecionadas.size === medicoes.length
                  ? 'Desmarcar todas'
                  : 'Selecionar todas'}
              </button>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {medicoesOrdenadas.map((medicao) => {
                const isUltimaSelecionada =
                  medicoesSelecionadas.has(medicao.id) &&
                  medicao.numero === ultimaMedicaoSelecionada;
                
                return (
                  <label
                    key={medicao.id}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                      medicoesSelecionadas.has(medicao.id)
                        ? 'bg-blue-600/20 hover:bg-blue-600/30'
                        : 'hover:bg-slate-700'
                    } ${isUltimaSelecionada ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={medicoesSelecionadas.has(medicao.id)}
                      onChange={() => toggleMedicao(medicao.id)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {medicao.numero}ª Medição
                        </span>
                        {isUltimaSelecionada && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                            Última selecionada
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {medicao.nome} • {new Date(medicao.dataPrevisao).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            
            {ultimaMedicaoSelecionada && (
              <p className="text-xs text-slate-400 mt-2">
                O acumulado será calculado até a {ultimaMedicaoSelecionada}ª medição
              </p>
            )}
          </div>

          {/* Seleção de Planilhas */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Planilhas a Exportar
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={planilhaContratual}
                  onChange={(e) => setPlanilhaContratual(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-white font-medium">Visão EAP Contratual</div>
                  <div className="text-sm text-slate-400">
                    Estrutura hierárquica do orçamento contratual
                  </div>
                </div>
              </label>

              {temVisaoGerencial && (
                <label className="flex items-center gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={planilhaGerencial}
                    onChange={(e) => setPlanilhaGerencial(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-white font-medium">Visão EAP Gerencial</div>
                    <div className="text-sm text-slate-400">
                      Agrupamento por etapa, subetapa e serviço
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Tipo de EAP */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Tipo de Exportação
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="radio"
                  name="tipoEap"
                  value="completa"
                  checked={tipoEap === 'completa'}
                  onChange={(e) => setTipoEap(e.target.value as 'completa' | 'resumida')}
                  className="w-4 h-4 mt-0.5 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-white font-medium">EAP Completa</div>
                  <div className="text-sm text-slate-400">
                    Exporta toda a estrutura hierárquica, incluindo itens sem medição
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="radio"
                  name="tipoEap"
                  value="resumida"
                  checked={tipoEap === 'resumida'}
                  onChange={(e) => setTipoEap(e.target.value as 'completa' | 'resumida')}
                  className="w-4 h-4 mt-0.5 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-white font-medium">EAP Resumida (Apenas Itens Medidos)</div>
                  <div className="text-sm text-slate-400">
                    Exporta apenas itens que possuem medição + seus totalizadores na hierarquia
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Formato de Exportação
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="radio"
                  name="formato"
                  value="excel"
                  checked={formato === 'excel'}
                  onChange={(e) => setFormato(e.target.value as 'excel' | 'pdf')}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-white font-medium">Excel (.xlsx)</div>
                  <div className="text-sm text-slate-400">
                    Planilha editável com múltiplas abas
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="radio"
                  name="formato"
                  value="pdf"
                  checked={formato === 'pdf'}
                  onChange={(e) => setFormato(e.target.value as 'excel' | 'pdf')}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500"
                />
                <FileText className="w-5 h-5 text-red-400" />
                <div>
                  <div className="text-white font-medium">PDF</div>
                  <div className="text-sm text-slate-400">
                    Documento para impressão em formato paisagem
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={exportando}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportar}
            disabled={exportando || medicoesSelecionadas.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {exportando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
