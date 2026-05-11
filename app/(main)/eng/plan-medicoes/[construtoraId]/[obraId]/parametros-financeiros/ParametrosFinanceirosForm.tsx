'use client';

import { useState } from 'react';
import { DollarSign, Save, TrendingUp, Calendar, Percent } from 'lucide-react';
import { atualizarParametrosFinanceiros } from '@/app/actions/obras';

interface Props {
  obraId: string;
  parametrosIniciais: {
    bdi: number | null;
    encargos: number | null;
    indiceReajuste: string | null;
    periodicidadeMedicao: number | null;
  };
}

const indices = ['INCC', 'IPCA', 'IGPM', 'INPC'];

export default function ParametrosFinanceirosForm({ obraId, parametrosIniciais }: Props) {
  const [form, setForm] = useState({
    bdi: parametrosIniciais.bdi != null ? String(parametrosIniciais.bdi) : '',
    encargos: parametrosIniciais.encargos != null ? String(parametrosIniciais.encargos) : '',
    indiceReajuste: parametrosIniciais.indiceReajuste ?? '',
    periodicidadeMedicao:
      parametrosIniciais.periodicidadeMedicao != null
        ? String(parametrosIniciais.periodicidadeMedicao)
        : '',
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);
    setSalvando(true);

    try {
      const resultado = await atualizarParametrosFinanceiros(obraId, {
        bdi: form.bdi ? parseFloat(form.bdi) : null,
        encargos: form.encargos ? parseFloat(form.encargos) : null,
        indiceReajuste: form.indiceReajuste || null,
        periodicidadeMedicao: form.periodicidadeMedicao ? parseInt(form.periodicidadeMedicao, 10) : null,
      });

      if (resultado.success) {
        setMensagem({ tipo: 'sucesso', texto: 'Parâmetros salvos com sucesso!' });
      } else {
        setMensagem({ tipo: 'erro', texto: resultado.message ?? 'Erro ao salvar.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Ocorreu um erro inesperado.' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mensagem && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-950 border-green-800 text-green-400'
              : 'bg-red-950 border-red-800 text-red-400'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {/* BDI e Encargos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Percent className="w-5 h-5 text-amber-400" />
          Taxas e Encargos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              BDI — Benefícios e Despesas Indiretas (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.bdi}
                onChange={(e) => setForm({ ...form, bdi: e.target.value })}
                placeholder="Ex: 25.00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Percentual sobre o custo direto para cobrir despesas indiretas e lucro.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Encargos Sociais (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.encargos}
                onChange={(e) => setForm({ ...form, encargos: e.target.value })}
                placeholder="Ex: 118.00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Percentual de encargos sociais incidentes sobre a mão de obra.
            </p>
          </div>
        </div>
      </div>

      {/* Reajuste e Periodicidade */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Reajuste e Periodicidade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Índice de Reajuste Padrão</label>
            <select
              value={form.indiceReajuste}
              onChange={(e) => setForm({ ...form, indiceReajuste: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Selecione —</option>
              {indices.map((idx) => (
                <option key={idx} value={idx}>
                  {idx}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Índice utilizado como base para cálculo de reajustes contratuais.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Periodicidade das Medições (meses)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                max="12"
                value={form.periodicidadeMedicao}
                onChange={(e) => setForm({ ...form, periodicidadeMedicao: e.target.value })}
                placeholder="Ex: 1"
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Intervalo em meses entre cada medição (ex: 1 = mensal, 3 = trimestral).
            </p>
          </div>
        </div>
      </div>

      {/* Resumo dos Parâmetros */}
      {(form.bdi || form.encargos) && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Impacto nos Custos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {form.bdi && (
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">BDI Configurado</p>
                <p className="text-2xl font-bold text-amber-400">{parseFloat(form.bdi).toFixed(2)}%</p>
              </div>
            )}
            {form.encargos && (
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Encargos Sociais</p>
                <p className="text-2xl font-bold text-blue-400">{parseFloat(form.encargos).toFixed(2)}%</p>
              </div>
            )}
            {form.bdi && form.encargos && (
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Multiplicador Total</p>
                <p className="text-2xl font-bold text-green-400">
                  {((1 + parseFloat(form.bdi) / 100) * (1 + parseFloat(form.encargos) / 100)).toFixed(4)}x
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <Save className="w-5 h-5" />
          {salvando ? 'Salvando...' : 'Salvar Parâmetros'}
        </button>
      </div>
    </form>
  );
}
