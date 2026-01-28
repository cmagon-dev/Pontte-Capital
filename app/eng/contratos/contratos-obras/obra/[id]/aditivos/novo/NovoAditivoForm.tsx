'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign, Calendar, Clock, FileText, Loader2, Upload } from 'lucide-react';
import { criarAditivo } from '@/app/actions/aditivos';

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: any;
}

interface NovoAditivoFormProps {
  obra: Obra;
}

export default function NovoAditivoForm({ obra }: NovoAditivoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [aditivoCriado, setAditivoCriado] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    tipo: 'VALOR' as 'VALOR' | 'PRAZO',
    dataAssinatura: '',
    justificativa: '',
    // Campos de Valor
    valorAditivo: '',
    valorGlosa: '',
    // Campos de Prazo
    tipoUnidadePrazo: 'MESES' as 'DIAS' | 'MESES',
    prazoVigencia: '',
    prazoExecucao: '',
    // Status
    status: 'EM_ELABORACAO',
  });

  const [arquivos, setArquivos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparar dados
      const payload: any = {
        obraId: obra.id,
        tipo: formData.tipo,
        dataAssinatura: formData.dataAssinatura || null,
        justificativa: formData.justificativa || null,
        status: formData.status,
      };

      // Adicionar campos específicos do tipo
      if (formData.tipo === 'VALOR') {
        // Converter de centavos para reais (dividir por 100)
        payload.valorAditivo = formData.valorAditivo ? parseFloat(formData.valorAditivo) / 100 : null;
        payload.valorGlosa = formData.valorGlosa ? parseFloat(formData.valorGlosa) / 100 : null;
      } else {
        payload.tipoUnidadePrazo = formData.tipoUnidadePrazo;
        payload.prazoVigencia = formData.prazoVigencia ? parseInt(formData.prazoVigencia) : null;
        payload.prazoExecucao = formData.prazoExecucao ? parseInt(formData.prazoExecucao) : null;
      }

      // Criar aditivo
      const result = await criarAditivo(payload);

      if (!result.success) {
        setServerError(result.message);
        setIsSubmitting(false);
        return;
      }

      setAditivoCriado(result.data);

      // Se houver arquivos, fazer upload
      if (arquivos.length > 0 && result.data) {
        await handleUploadArquivos(result.data.id);
      }

      alert(result.message);
      router.push(`/eng/contratos/contratos-obras/obra/${obra.id}?tab=aditivos`);
      router.refresh();
      
    } catch (error) {
      console.error('Erro ao criar aditivo:', error);
      setServerError('Erro inesperado ao criar aditivo. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const handleUploadArquivos = async (aditivoId: string) => {
    if (arquivos.length === 0) return;

    setIsUploading(true);
    try {
      // Fazer upload de cada arquivo
      for (const arquivo of arquivos) {
        const formData = new FormData();
        formData.append('file', arquivo);
        formData.append('aditivoId', aditivoId);
        formData.append('obraId', obra.id);

        const response = await fetch('/api/aditivos/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          console.error('Erro ao fazer upload de', arquivo.name, ':', result.message);
        }
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setArquivos(Array.from(files));
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos(arquivos.filter((_, i) => i !== index));
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = (parseInt(numbers || '0') / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=aditivos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Novo Aditivo Contratual</h1>
          <p className="text-slate-400">{obra.codigo} - {obra.nome}</p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Aditivo */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Tipo de Aditivo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              formData.tipo === 'VALOR' 
                ? 'border-green-600 bg-green-950' 
                : 'border-slate-700 hover:border-slate-600'
            }`}>
              <input
                type="radio"
                name="tipo"
                value="VALOR"
                checked={formData.tipo === 'VALOR'}
                onChange={(e) => setFormData({ ...formData, tipo: 'VALOR' })}
                className="w-4 h-4"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-white">Aditivo de Valor</span>
                </div>
                <p className="text-sm text-slate-400">
                  Alteração no valor contratual (acréscimo ou supressão)
                </p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              formData.tipo === 'PRAZO' 
                ? 'border-blue-600 bg-blue-950' 
                : 'border-slate-700 hover:border-slate-600'
            }`}>
              <input
                type="radio"
                name="tipo"
                value="PRAZO"
                checked={formData.tipo === 'PRAZO'}
                onChange={(e) => setFormData({ ...formData, tipo: 'PRAZO' })}
                className="w-4 h-4"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-white">Aditivo de Prazo</span>
                </div>
                <p className="text-sm text-slate-400">
                  Alteração nos prazos de vigência ou execução
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Dados Gerais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Dados Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data de Assinatura</label>
              <input
                type="date"
                value={formData.dataAssinatura}
                onChange={(e) => setFormData({ ...formData, dataAssinatura: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="EM_ELABORACAO">Em Elaboração</option>
                <option value="APROVADO">Aprovado</option>
                <option value="REJEITADO">Rejeitado</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Justificativa</label>
            <textarea
              value={formData.justificativa}
              onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Descreva a justificativa para este aditivo..."
            />
          </div>
        </div>

        {/* Campos específicos de Aditivo de Valor */}
        {formData.tipo === 'VALOR' && (
          <div className="bg-green-950 border border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Valor do Aditivo *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.valorAditivo)}
                    onChange={(e) => setFormData({ ...formData, valorAditivo: e.target.value.replace(/\D/g, '') })}
                    required
                    className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-green-500"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Valor adicionado (positivo) ou suprimido (negativo)</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Valor de Glosas
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.valorGlosa)}
                    onChange={(e) => setFormData({ ...formData, valorGlosa: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Valores glosados ou descontados</p>
              </div>
            </div>
          </div>
        )}

        {/* Campos específicos de Aditivo de Prazo */}
        {formData.tipo === 'PRAZO' && (
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Prazos
            </h2>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Unidade de Prazo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipoUnidadePrazo"
                    value="DIAS"
                    checked={formData.tipoUnidadePrazo === 'DIAS'}
                    onChange={(e) => setFormData({ ...formData, tipoUnidadePrazo: 'DIAS' })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Dias</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tipoUnidadePrazo"
                    value="MESES"
                    checked={formData.tipoUnidadePrazo === 'MESES'}
                    onChange={(e) => setFormData({ ...formData, tipoUnidadePrazo: 'MESES' })}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Meses</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Prazo de Vigência
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.prazoVigencia}
                    onChange={(e) => setFormData({ ...formData, prazoVigencia: e.target.value })}
                    min="0"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-slate-400">{formData.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Prazo adicional de vigência contratual</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Prazo de Execução
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.prazoExecucao}
                    onChange={(e) => setFormData({ ...formData, prazoExecucao: e.target.value })}
                    min="0"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                  <span className="text-slate-400">{formData.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Prazo adicional de execução da obra</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload de Arquivos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos do Aditivo
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Anexar Documentos (múltiplos arquivos PDF)</label>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            
            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">Arquivos selecionados ({arquivos.length}):</p>
                {arquivos.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">{arquivo.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(arquivo.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerArquivo(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=aditivos`}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUploading ? 'Fazendo upload...' : 'Salvando...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Aditivo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
