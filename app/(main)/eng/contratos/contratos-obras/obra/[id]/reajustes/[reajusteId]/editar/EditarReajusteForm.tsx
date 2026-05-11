'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, TrendingUp, Upload, Calendar, X, FileText } from 'lucide-react';
import { atualizarReajuste } from '@/app/actions/reajustes';

interface ReajusteData {
  id: string;
  obraId: string;
  dataBase: string;
  indice: string;
  percentual: number | string;
  valorReajuste: number | string;
  dataAplicacao: Date | string;
  observacoes?: string | null;
}

interface Props {
  contratoId: string;
  reajuste: ReajusteData;
}

const indices = ['INCC', 'IPCA', 'IGPM', 'INPC'];

export default function EditarReajusteForm({ contratoId, reajuste }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    dataBase: reajuste.dataBase ?? '',
    indice: reajuste.indice ?? 'INCC',
    percentual: String(reajuste.percentual ?? ''),
    valorReajuste: String(reajuste.valorReajuste ?? ''),
    dataAplicacao: reajuste.dataAplicacao
      ? new Date(reajuste.dataAplicacao).toISOString().split('T')[0]
      : '',
    observacoes: reajuste.observacoes ?? '',
  });

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!formData.dataBase || !formData.percentual || !formData.valorReajuste || !formData.dataAplicacao) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await atualizarReajuste(reajuste.id, {
        obraId: reajuste.obraId,
        dataBase: formData.dataBase,
        indice: formData.indice,
        percentual: parseFloat(formData.percentual),
        valorReajuste: parseFloat(formData.valorReajuste.replace(/[^\d.]/g, '')),
        dataAplicacao: formData.dataAplicacao,
        observacoes: formData.observacoes || null,
      });

      if (!resultado.success) {
        setErro(resultado.message ?? 'Erro ao salvar.');
        return;
      }

      router.push(`/eng/contratos/contratos-obras/obra/${contratoId}?tab=reajustes`);
      router.refresh();
    } catch {
      setErro('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const formatCurrencyDisplay = (value: string) => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, '');
    setFormData({ ...formData, valorReajuste: value });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${contratoId}?tab=reajustes`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Editar Reajuste</h1>
            <p className="text-slate-400">Edição do Reajuste Contratual</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={salvando}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-4 bg-red-950 border border-red-800 rounded-lg text-red-400 text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Reajuste */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Dados do Reajuste
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data Base Inicial *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="month"
                  value={formData.dataBase}
                  onChange={(e) => setFormData({ ...formData, dataBase: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Índice Aplicado *</label>
              <select
                value={formData.indice}
                onChange={(e) => setFormData({ ...formData, indice: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {indices.map((indice) => (
                  <option key={indice} value={indice}>
                    {indice}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Percentual Acumulado (%) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.percentual}
                onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Valor do Reajuste (R$) *</label>
              <input
                type="text"
                value={formData.valorReajuste}
                onChange={handleCurrencyChange}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.valorReajuste && (
                <p className="mt-1 text-sm text-green-400">
                  {formatCurrencyDisplay(formData.valorReajuste)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data de Aplicação *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={formData.dataAplicacao}
                  onChange={(e) => setFormData({ ...formData, dataAplicacao: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Observações opcionais..."
              />
            </div>
          </div>
        </div>

        {/* Upload de Arquivo */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Documentação
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Upload de nova memória de cálculo (opcional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-white">
                    {arquivo ? arquivo.name : 'Clique para selecionar novo arquivo'}
                  </span>
                </label>
              </div>
              {arquivo && (
                <div className="mt-2 flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-white text-sm flex-1">{arquivo.name}</span>
                  <button
                    type="button"
                    onClick={() => setArquivo(null)}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
