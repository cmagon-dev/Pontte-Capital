'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, DollarSign, Calendar, Clock, FileText, Loader2, Trash2, Download, X } from 'lucide-react';
import { atualizarAditivo, excluirAditivo } from '@/app/actions/aditivos';
import { formatDate } from '@/lib/utils/format';

interface Obra {
  id: string;
  codigo: string;
  nome: string;
}

interface Documento {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataUpload: Date | string;
}

interface Aditivo {
  id: string;
  obraId: string;
  numero: number;
  tipo: string;
  dataAssinatura: Date | string | null;
  justificativa: string | null;
  valorAditivo: any;
  valorGlosa: any;
  tipoUnidadePrazo: string | null;
  prazoVigencia: number | null;
  prazoExecucao: number | null;
  status: string;
  obra: Obra;
}

interface EditarAditivoFormProps {
  aditivo: Aditivo;
  documentos: Documento[];
}

export default function EditarAditivoForm({ aditivo, documentos: initialDocumentos }: EditarAditivoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState(initialDocumentos);
  
  const [formData, setFormData] = useState({
    tipo: aditivo.tipo as 'VALOR' | 'PRAZO',
    dataAssinatura: aditivo.dataAssinatura ? new Date(aditivo.dataAssinatura).toISOString().split('T')[0] : '',
    justificativa: aditivo.justificativa || '',
    // Campos de Valor
    valorAditivo: aditivo.valorAditivo ? Number(aditivo.valorAditivo).toFixed(2).replace('.', ',') : '',
    valorGlosa: aditivo.valorGlosa ? Number(aditivo.valorGlosa).toFixed(2).replace('.', ',') : '',
    // Campos de Prazo
    tipoUnidadePrazo: (aditivo.tipoUnidadePrazo || 'MESES') as 'DIAS' | 'MESES',
    prazoVigencia: aditivo.prazoVigencia?.toString() || '',
    prazoExecucao: aditivo.prazoExecucao?.toString() || '',
    // Status
    status: aditivo.status,
  });

  const [arquivos, setArquivos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: any = {
        obraId: aditivo.obraId,
        tipo: formData.tipo,
        dataAssinatura: formData.dataAssinatura || null,
        justificativa: formData.justificativa || null,
        status: formData.status,
      };

      if (formData.tipo === 'VALOR') {
        payload.valorAditivo = formData.valorAditivo ? parseFloat(formData.valorAditivo.replace(/\./g, '').replace(',', '.')) : null;
        payload.valorGlosa = formData.valorGlosa ? parseFloat(formData.valorGlosa.replace(/\./g, '').replace(',', '.')) : null;
      } else {
        payload.tipoUnidadePrazo = formData.tipoUnidadePrazo;
        payload.prazoVigencia = formData.prazoVigencia ? parseInt(formData.prazoVigencia) : null;
        payload.prazoExecucao = formData.prazoExecucao ? parseInt(formData.prazoExecucao) : null;
      }

      const result = await atualizarAditivo(aditivo.id, payload);

      if (!result.success) {
        setServerError(result.message);
        setIsSubmitting(false);
        return;
      }

      // Upload de novos arquivos
      if (arquivos.length > 0) {
        await handleUploadArquivos();
      }

      alert(result.message);
      router.push(`/eng/contratos/contratos-obras/obra/${aditivo.obraId}?tab=aditivos`);
      
    } catch (error) {
      console.error('Erro ao atualizar aditivo:', error);
      setServerError('Erro inesperado ao atualizar aditivo.');
      setIsSubmitting(false);
    }
  };

  const handleUploadArquivos = async () => {
    if (arquivos.length === 0) return;

    setIsUploading(true);
    try {
      for (const arquivo of arquivos) {
        const formData = new FormData();
        formData.append('file', arquivo);
        formData.append('aditivoId', aditivo.id);
        formData.append('obraId', aditivo.obraId);

        const response = await fetch('/api/aditivos/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Adicionar à lista local
          const novoDoc: Documento = {
            id: Math.random().toString(),
            nomeArquivo: arquivo.name,
            caminhoArquivo: result.caminhoArquivo,
            dataUpload: new Date(),
          };
          setDocumentos([novoDoc, ...documentos]);
        }
      }
      setArquivos([]);
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

  const handleExcluirDocumento = async (documentoId: string) => {
    if (!confirm('Deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocumentos(documentos.filter(d => d.id !== documentoId));
        alert('Documento excluído com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const handleExcluirAditivo = async () => {
    if (!confirm(`Tem certeza que deseja excluir o Aditivo nº ${aditivo.numero}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await excluirAditivo(aditivo.id, aditivo.obraId);

    if (result.success) {
      alert(result.message);
      router.push(`/eng/contratos/contratos-obras/obra/${aditivo.obraId}?tab=aditivos`);
      router.refresh();
    } else {
      alert(result.message);
      setIsDeleting(false);
    }
  };

  const formatCurrencyValue = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d)(\d{2})$/, '$1,$2').replace(/(?=(\d{3})+(\D))\B/g, '.');
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/eng/contratos/contratos-obras/obra/${aditivo.obraId}?tab=aditivos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">Editar Aditivo nº {aditivo.numero}</h1>
          <p className="text-slate-400">{aditivo.obra.codigo} - {aditivo.obra.nome}</p>
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

        {/* Campos de Valor */}
        {formData.tipo === 'VALOR' && (
          <div className="bg-green-950 border border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor do Aditivo *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                  <input
                    type="text"
                    value={formatCurrencyValue(formData.valorAditivo.replace(/\D/g, ''))}
                    onChange={(e) => setFormData({ ...formData, valorAditivo: e.target.value.replace(/\D/g, '') })}
                    required
                    className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor de Glosas</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
                  <input
                    type="text"
                    value={formatCurrencyValue(formData.valorGlosa.replace(/\D/g, ''))}
                    onChange={(e) => setFormData({ ...formData, valorGlosa: e.target.value.replace(/\D/g, '') })}
                    className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campos de Prazo */}
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
                <label className="block text-sm text-slate-400 mb-2">Prazo de Vigência</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.prazoVigencia}
                    onChange={(e) => setFormData({ ...formData, prazoVigencia: e.target.value })}
                    min="0"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400">{formData.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Prazo de Execução</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.prazoExecucao}
                    onChange={(e) => setFormData({ ...formData, prazoExecucao: e.target.value })}
                    min="0"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-400">{formData.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentos Anexados */}
        {documentos.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Documentos Anexados</h2>
            <div className="space-y-2">
              {documentos.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <a
                      href={doc.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      {doc.nomeArquivo}
                      <Download className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-slate-500">
                      {formatDate(doc.dataUpload)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExcluirDocumento(doc.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Excluir documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adicionar Novos Arquivos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Adicionar Novos Documentos
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Anexar Novos Documentos (múltiplos PDFs)</label>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            
            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">Novos arquivos ({arquivos.length}):</p>
                {arquivos.map((arquivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleExcluirAditivo}
            disabled={isDeleting || isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Excluir Aditivo
              </>
            )}
          </button>

          <div className="flex gap-4">
            <Link
              href={`/eng/contratos/contratos-obras/obra/${aditivo.obraId}?tab=aditivos`}
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
                  {isUploading ? 'Enviando arquivos...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
