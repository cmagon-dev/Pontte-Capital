'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';

export default function NovaFonteRecursoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo: 'Convenio' as 'Convenio' | 'FinanciamentoPublico' | 'FinanciamentoPrivado' | 'RecursoProprio' | 'Outro',
    descricao: '',
    orgaoFonte: '',
    numeroContrato: '',
    valorTotal: '',
    tempoMedioPagamento: '',
    observacoes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Em produção, aqui faria a chamada à API
    // const response = await fetch('/api/fontes-recurso', { method: 'POST', body: JSON.stringify(formData) });

    setIsSubmitting(false);
    router.push('/cadastros/contratantes');
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
            <h1 className="text-3xl font-bold text-white mb-2">Nova Fonte de Recurso</h1>
            <p className="text-slate-400">Cadastro de fontes de recurso para obras</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados Básicos */}
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
                  required
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
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Convênio FNDE - Programa Nacional de Educação"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Órgão Fonte</label>
                <input
                  type="text"
                  value={formData.orgaoFonte}
                  onChange={(e) => setFormData({ ...formData, orgaoFonte: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: FNDE, BNDES"
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
                <label className="block text-sm text-slate-400 mb-2">Valor Total *</label>
                <input
                  type="text"
                  value={formData.valorTotal}
                  onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="R$ 0,00"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tempo Médio Pagamento (dias) *</label>
                <input
                  type="number"
                  value={formData.tempoMedioPagamento}
                  onChange={(e) => setFormData({ ...formData, tempoMedioPagamento: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="45"
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

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Link
              href="/cadastros/contratantes"
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
