'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getFonteRecursoById } from '@/lib/mock-data';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils/format';

export default function CadastroFonteRecursoPage({ params }: { params: { id: string } }) {
  const fonteRecurso = getFonteRecursoById(params.id);
  
  if (!fonteRecurso) {
    return (
      <div className="p-8">
        <div className="bg-red-950 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-400">Fonte de Recurso não encontrada</p>
          <Link href="/cadastros/contratantes" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'dados' | 'risco'>('dados');
  const [formData, setFormData] = useState({
    tipo: fonteRecurso.tipo,
    descricao: fonteRecurso.descricao,
    orgaoFonte: fonteRecurso.orgaoFonte || '',
    numeroContrato: fonteRecurso.numeroContrato || '',
    valorTotal: formatCurrency(fonteRecurso.valorTotal),
    saldoDisponivel: formatCurrency(fonteRecurso.saldoDisponivel),
    observacoes: fonteRecurso.observacoes || '',
  });

  const [indicadoresRisco, setIndicadoresRisco] = useState({
    risco: fonteRecurso.risco,
    tempoMedioPagamento: fonteRecurso.indicadoresRisco.tempoMedioPagamento.toString(),
    taxaAtraso: fonteRecurso.indicadoresRisco.taxaAtraso.toString(),
    quantidadeAtrasos: fonteRecurso.indicadoresRisco.quantidadeAtrasos.toString(),
    maiorAtraso: fonteRecurso.indicadoresRisco.maiorAtraso.toString(),
    ultimoAtraso: fonteRecurso.indicadoresRisco.ultimoAtraso || '',
  });

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'Baixo':
        return 'bg-green-900 text-green-400';
      case 'Médio':
        return 'bg-amber-900 text-amber-400';
      case 'Alto':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusPagamentoColor = (atraso: number) => {
    if (atraso === 0) return 'text-green-400';
    if (atraso <= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const tiposFonte = [
    { value: 'Convenio', label: 'Convênio' },
    { value: 'FinanciamentoPublico', label: 'Financiamento Público' },
    { value: 'FinanciamentoPrivado', label: 'Financiamento Privado' },
    { value: 'RecursoProprio', label: 'Recursos Próprios' },
    { value: 'Outro', label: 'Outro' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/cadastros/contratantes"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Fonte de Recurso</h1>
            <p className="text-slate-400">Dados da fonte de recurso e indicadores de risco</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Save className="w-5 h-5" />
          Salvar
        </button>
      </div>

      {/* Abas */}
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'dados'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dados da Fonte
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('risco')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'risco'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Indicadores de Risco
            </div>
          </button>
        </div>
      </div>

      {/* Tab: Dados da Fonte */}
      {activeTab === 'dados' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Dados da Fonte de Recurso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as typeof formData.tipo })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {tiposFonte.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Descrição *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Órgão Fonte</label>
                <input
                  type="text"
                  value={formData.orgaoFonte}
                  onChange={(e) => setFormData({ ...formData, orgaoFonte: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Nº Contrato/Convênio</label>
                <input
                  type="text"
                  value={formData.numeroContrato}
                  onChange={(e) => setFormData({ ...formData, numeroContrato: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor Total</label>
                <input
                  type="text"
                  value={formData.valorTotal}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Saldo Disponível</label>
                <input
                  type="text"
                  value={formData.saldoDisponivel}
                  readOnly
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono opacity-60"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Indicadores de Risco */}
      {activeTab === 'risco' && (
        <div className="space-y-6">
          {/* Campos Editáveis de Risco */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Indicadores de Risco e Confiabilidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Classificação de Risco *</label>
                <select
                  value={indicadoresRisco.risco}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, risco: e.target.value as 'Baixo' | 'Médio' | 'Alto' })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Baixo">Baixo</option>
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tempo Médio de Pagamento (dias) *</label>
                <input
                  type="number"
                  value={indicadoresRisco.tempoMedioPagamento}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, tempoMedioPagamento: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Taxa de Atraso (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={indicadoresRisco.taxaAtraso}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, taxaAtraso: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="12.5"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Quantidade de Atrasos</label>
                <input
                  type="number"
                  value={indicadoresRisco.quantidadeAtrasos}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, quantidadeAtrasos: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Maior Atraso (dias)</label>
                <input
                  type="number"
                  value={indicadoresRisco.maiorAtraso}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, maiorAtraso: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data do Último Atraso</label>
                <input
                  type="date"
                  value={indicadoresRisco.ultimoAtraso}
                  onChange={(e) => setIndicadoresRisco({ ...indicadoresRisco, ultimoAtraso: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Resumo de Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Tempo Médio Pagamento</p>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <p className="text-2xl font-bold text-white">{indicadoresRisco.tempoMedioPagamento} dias</p>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Taxa de Atraso</p>
              <p className={`text-2xl font-bold ${parseFloat(indicadoresRisco.taxaAtraso) > 20 ? 'text-red-400' : parseFloat(indicadoresRisco.taxaAtraso) > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                {formatPercent(parseFloat(indicadoresRisco.taxaAtraso))}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Quantidade de Atrasos</p>
              <p className="text-2xl font-bold text-white">{indicadoresRisco.quantidadeAtrasos}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Maior Atraso</p>
              <p className="text-2xl font-bold text-red-400">{indicadoresRisco.maiorAtraso} dias</p>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Histórico de Pagamentos
              </h2>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="table-engineering w-full">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className="number-cell">Valor</th>
                    <th>Atraso</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fonteRecurso.indicadoresRisco.historicoPagamentos.map((pagamento, index) => (
                    <tr key={index} className="hover:bg-slate-800">
                      <td className="text-slate-300">{formatDate(pagamento.data)}</td>
                      <td className="currency-cell">{formatCurrency(pagamento.valor)}</td>
                      <td>
                        <span className={getStatusPagamentoColor(pagamento.atraso)}>
                          {pagamento.atraso === 0 ? 'Em dia' : `${pagamento.atraso} dias`}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {pagamento.status === 'Pago' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : pagamento.status === 'Atrasado' ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-400" />
                          )}
                          <span className={`text-sm ${
                            pagamento.status === 'Pago' ? 'text-green-400' :
                            pagamento.status === 'Atrasado' ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {pagamento.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análise de Risco */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Análise de Risco
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-sm text-slate-400">Classificação de Risco</p>
                  <p className="text-lg font-bold text-white">{indicadoresRisco.risco}</p>
                </div>
                <span className={`px-4 py-2 rounded-lg font-bold ${getRiscoColor(indicadoresRisco.risco)}`}>
                  {indicadoresRisco.risco}
                </span>
              </div>
              {indicadoresRisco.ultimoAtraso && (
                <div className="p-4 bg-amber-950/30 border border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-400">
                    <strong>Último Atraso:</strong> {formatDate(indicadoresRisco.ultimoAtraso)}
                  </p>
                </div>
              )}
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Recomendações:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                  {indicadoresRisco.risco === 'Alto' && (
                    <>
                      <li>Revisar condições de pagamento antes de aprovar novas operações</li>
                      <li>Considerar exigência de garantias adicionais</li>
                      <li>Monitorar pagamentos com maior frequência</li>
                    </>
                  )}
                  {indicadoresRisco.risco === 'Médio' && (
                    <>
                      <li>Monitorar histórico de pagamentos regularmente</li>
                      <li>Estabelecer limites de crédito conservadores</li>
                    </>
                  )}
                  {indicadoresRisco.risco === 'Baixo' && (
                    <li>Fonte de recurso com histórico positivo - operações podem ser aprovadas normalmente</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
