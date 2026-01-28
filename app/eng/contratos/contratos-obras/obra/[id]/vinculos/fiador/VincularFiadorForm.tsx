'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, DollarSign, Percent, FileText, Loader2, Plus, X, Building } from 'lucide-react';
import { vincularFiador, vincularBemAoFiador, listarBensPorFiador } from '@/app/actions/vinculos';

interface Fiador {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  cpfCnpj: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
}

interface Bem {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface VincularFiadorFormProps {
  obra: Obra;
  fiadores: Fiador[];
}

export default function VincularFiadorForm({ obra, fiadores }: VincularFiadorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bensDisponiveis, setBensDisponiveis] = useState<Bem[]>([]);
  const [bensLoading, setBensLoading] = useState(false);
  const [bensSelecionados, setBensSelecionados] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    fiadorId: '',
    percentualGarantia: '',
    valorGarantia: '',
    observacoes: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Carregar bens quando o fiador é selecionado
  useEffect(() => {
    if (formData.fiadorId) {
      setBensLoading(true);
      listarBensPorFiador(formData.fiadorId).then((bens) => {
        setBensDisponiveis(bens);
        setBensLoading(false);
      });
    } else {
      setBensDisponiveis([]);
      setBensSelecionados([]);
    }
  }, [formData.fiadorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Vincular fiador
      const result = await vincularFiador({
        obraId: obra.id,
        fiadorId: formData.fiadorId,
        percentualGarantia: parseFloat(formData.percentualGarantia),
        valorGarantia: parseFloat(formData.valorGarantia.replace(/\D/g, '')) / 100,
        observacoes: formData.observacoes || null,
      });

      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Vincular bens selecionados
      if (bensSelecionados.length > 0 && result.vinculoId) {
        const bensPromises = bensSelecionados.map((bemId) =>
          vincularBemAoFiador(result.vinculoId, bemId, obra.id)
        );
        
        await Promise.all(bensPromises);
      }

      alert('Fiador vinculado com sucesso!');
      router.push(`/eng/contratos/contratos-obras/obra/${obra.id}?tab=vinculos`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular fiador');
      setIsSubmitting(false);
    }
  };

  const handleValorChange = (valor: string) => {
    const numbers = valor.replace(/\D/g, '');
    setFormData({ ...formData, valorGarantia: numbers });
  };

  const formatValorDisplay = (valor: string) => {
    const numbers = valor.replace(/\D/g, '');
    const value = parseFloat(numbers) / 100;
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const toggleBem = (bemId: string) => {
    if (bensSelecionados.includes(bemId)) {
      setBensSelecionados(bensSelecionados.filter(id => id !== bemId));
    } else {
      setBensSelecionados([...bensSelecionados, bemId]);
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">Vincular Fiador / Avalista</h1>
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
        {/* Seleção do Fiador */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Selecionar Fiador
          </h2>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Fiador / Avalista *
            </label>
            <select
              value={formData.fiadorId}
              onChange={(e) => setFormData({ ...formData, fiadorId: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecione um fiador...</option>
              {fiadores.map((fiador) => (
                <option key={fiador.id} value={fiador.id}>
                  {fiador.codigo} - {fiador.nome} ({fiador.tipo} - {fiador.cpfCnpj})
                </option>
              ))}
            </select>
            
            {fiadores.length === 0 && (
              <p className="text-amber-400 text-sm mt-2">
                Nenhum fiador cadastrado. 
                <Link href="/cadastros/fiadores/novo" className="underline ml-1">
                  Cadastrar novo fiador
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Valores e Percentuais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Garantia
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                Percentual da Garantia *
              </label>
              <input
                type="number"
                value={formData.percentualGarantia}
                onChange={(e) => setFormData({ ...formData, percentualGarantia: e.target.value })}
                min="0"
                max="100"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="50.00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentual do contrato garantido por este fiador
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor da Garantia *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={formatValorDisplay(formData.valorGarantia)}
                  onChange={(e) => handleValorChange(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Valor que o fiador está garantindo
              </p>
            </div>
          </div>
        </div>

        {/* Bens em Garantia */}
        {formData.fiadorId && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Bens em Garantia (Opcional)
            </h2>
            
            {bensLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-slate-400 mt-2">Carregando bens...</p>
              </div>
            ) : bensDisponiveis.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 mb-2">Nenhum bem disponível para este fiador</p>
                <p className="text-sm text-slate-500">
                  Bens devem estar cadastrados e com status "Livre"
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-4">
                  Selecione os bens que serão vinculados como garantia desta obra:
                </p>
                {bensDisponiveis.map((bem) => (
                  <div
                    key={bem.id}
                    onClick={() => toggleBem(bem.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      bensSelecionados.includes(bem.id)
                        ? 'bg-blue-950 border-blue-600'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={bensSelecionados.includes(bem.id)}
                            onChange={() => toggleBem(bem.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-blue-400 font-semibold">{bem.tipo}</span>
                        </div>
                        <p className="text-white font-medium ml-6">{bem.descricao}</p>
                        {bem.endereco && (
                          <p className="text-sm text-slate-400 ml-6">
                            {bem.endereco} - {bem.cidade}/{bem.estado}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-green-400 font-mono font-semibold">
                          {formatCurrency(bem.valor)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {bensSelecionados.length > 0 && (
                  <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 mt-4">
                    <p className="text-blue-300 text-sm">
                      <strong>{bensSelecionados.length}</strong> bem(ns) selecionado(s)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
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
            disabled={isSubmitting || !formData.fiadorId}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Vincular Fiador
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
