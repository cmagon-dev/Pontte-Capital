'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, DollarSign, Percent, FileText, Loader2 } from 'lucide-react';
import { vincularFundo } from '@/app/actions/vinculos';

interface Fundo {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
}

interface VincularFundoFormProps {
  obra: Obra;
  fundos: Fundo[];
}

export default function VincularFundoForm({ obra, fundos }: VincularFundoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fundoId: '',
    percentual: '100',
    valorAlocado: obra.valorContrato.toString(),
    observacoes: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await vincularFundo({
        obraId: obra.id,
        fundoId: formData.fundoId,
        percentual: parseFloat(formData.percentual),
        valorAlocado: parseFloat(formData.valorAlocado.replace(/\D/g, '')) / 100,
        observacoes: formData.observacoes || null,
      });

      if (result.success) {
        alert(result.message);
        router.push(`/eng/contratos/contratos-obras/obra/${obra.id}?tab=vinculos`);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular fundo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValorChange = (valor: string) => {
    // Remove tudo exceto números
    const numbers = valor.replace(/\D/g, '');
    setFormData({ ...formData, valorAlocado: numbers });
  };

  const formatValorDisplay = (valor: string) => {
    const numbers = valor.replace(/\D/g, '');
    const value = parseFloat(numbers) / 100;
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/eng/contratos/contratos-obras/obra/${obra.id}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vincular Fundo Investidor</h1>
          <p className="text-slate-400">{obra.codigo} - {obra.nome}</p>
          <p className="text-slate-500 text-sm mt-1">
            Valor do Contrato: {formatCurrency(obra.valorContrato)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção do Fundo */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-400" />
            Selecionar Fundo
          </h2>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Fundo Investidor *
            </label>
            <select
              value={formData.fundoId}
              onChange={(e) => setFormData({ ...formData, fundoId: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="">Selecione um fundo...</option>
              {fundos.map((fundo) => (
                <option key={fundo.id} value={fundo.id}>
                  {fundo.codigo} - {fundo.nomeFantasia || fundo.razaoSocial} ({fundo.cnpj})
                </option>
              ))}
            </select>
            
            {fundos.length === 0 && (
              <p className="text-amber-400 text-sm mt-2">
                Nenhum fundo cadastrado. 
                <Link href="/cadastros/fundos/novo" className="underline ml-1">
                  Cadastrar novo fundo
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Valores e Percentuais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Valores e Participação
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Percentual de Participação *
              </label>
              <input
                type="number"
                value={formData.percentual}
                onChange={(e) => setFormData({ ...formData, percentual: e.target.value })}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="100.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentual do fundo neste contrato (0-100%)
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor Alocado *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={formatValorDisplay(formData.valorAlocado)}
                  onChange={(e) => handleValorChange(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-green-500"
                  placeholder="0,00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Valor que o fundo está alocando nesta obra
              </p>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Observações
          </h2>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500 resize-none"
              placeholder="Informações adicionais sobre este vínculo..."
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${obra.id}`}
            className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !formData.fundoId}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                Vincular Fundo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
