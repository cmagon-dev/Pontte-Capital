'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Layers, Building2, FileText } from 'lucide-react';
import { getConstrutoraById } from '@/lib/mock-data';

export default function NovoPlanoContasPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const construtora = getConstrutoraById(params.id);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'Sintética',
    nivel: 1,
    parentId: '',
    natureza: 'Débito',
    status: 'Ativo',
    observacoes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    router.push(`/fin/cadastros/${params.id}/plano-contas`);
  };

  const tiposConta = [
    { value: 'Sintética', label: 'Conta Sintética (Agrupadora)' },
    { value: 'Analítica', label: 'Conta Analítica (Detalhada)' },
  ];

  const niveis = [
    { value: 1, label: 'Nível 1 - Raiz' },
    { value: 2, label: 'Nível 2 - Filha de Nível 1' },
    { value: 3, label: 'Nível 3 - Filha de Nível 2' },
    { value: 4, label: 'Nível 4 - Filha de Nível 3' },
    { value: 5, label: 'Nível 5 - Filha de Nível 4' },
  ];

  const naturezas = [
    { value: 'Débito', label: 'Débito (Despesas, Ativos)' },
    { value: 'Crédito', label: 'Crédito (Receitas, Passivos)' },
    { value: 'Bilateral', label: 'Bilateral (Ativo e Passivo)' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/cadastros/${params.id}/plano-contas`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Novo Plano de Contas</h1>
            <p className="text-slate-400">Cadastro de Conta Contábil - {construtora.razaoSocial}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Dados Básicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Código da Conta *</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: 1.0, 1.1, 1.1.1, etc."
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Código hierárquico da conta (Ex: 1.0, 1.1.1)</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome da Conta *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Receitas de Obras, Despesas Operacionais"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Descrição detalhada da conta contábil..."
              />
            </div>
          </div>
        </div>

        {/* Classificação Contábil */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Classificação Contábil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Conta *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {tiposConta.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nível Hierárquico *</label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {niveis.map((nivel) => (
                  <option key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Natureza da Conta *</label>
              <select
                value={formData.natureza}
                onChange={(e) => setFormData({ ...formData, natureza: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {naturezas.map((natureza) => (
                  <option key={natureza.value} value={natureza.value}>
                    {natureza.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Conta Pai (Opcional)</label>
              <input
                type="text"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                placeholder="Código da conta pai (Ex: 1.0)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Deixe vazio se for conta raiz</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Observações Internas</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Informações adicionais sobre a conta contábil..."
            />
          </div>
        </div>

        {/* Nota Informativa */}
        <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Dica:</strong> Contas sintéticas são usadas para agrupar outras contas e não devem ter lançamentos
            diretos. Contas analíticas são usadas para lançamentos específicos e não podem ter contas filhas.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/fin/cadastros/${params.id}/plano-contas`}
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
            {isSubmitting ? 'Salvando...' : 'Salvar Plano de Contas'}
          </button>
        </div>
      </form>
    </div>
  );
}
