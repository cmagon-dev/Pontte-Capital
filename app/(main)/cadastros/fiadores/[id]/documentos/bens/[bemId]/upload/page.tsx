'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, X, Home } from 'lucide-react';

export default function UploadDocumentoBemPage({ params }: { params: { id: string; bemId: string } }) {
  const router = useRouter();
  const fiadorId = params.id;
  const bemId = params.bemId;
  
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    observacoes: '',
  });

  // Em produção, buscar tipo do bem pelo ID para filtrar tipos de documentos
  const tipoBem = 'Imóvel';

  const tiposDocumentosPorBem: Record<string, string[]> = {
    Imóvel: ['Matrícula de Imóvel', 'ITBI', 'IPTU', 'Contrato de Compra e Venda', 'Avaliação', 'Outros'],
    Veículo: ['CRLV', 'CRV', 'Avaliação Veicular', 'Contrato de Financiamento', 'Outros'],
    Investimentos: ['Extrato Bancário', 'Aplicações Financeiras', 'Ações', 'Outros'],
    Outros: ['Contrato', 'Avaliação', 'Documento Comprobatório', 'Outros'],
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/cadastros/fiadores/${fiadorId}/documentos?tab=bens`);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fiadores/${fiadorId}/documentos?tab=bens`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload de Documento do Bem</h1>
            <p className="text-slate-400">Anexar Documento Comprobatório ao Bem</p>
          </div>
        </div>
      </div>

      {/* Info do Bem */}
      <div className="mb-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Home className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-white font-medium">Apartamento - Av. Faria Lima, 2000</p>
            <p className="text-sm text-slate-400">Bem vinculado a este documento</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Tipo de Documento */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Tipo de Documento
            </h2>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecione o tipo</option>
                {tiposDocumentosPorBem[tipoBem]?.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Arquivo
            </h2>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-600 transition-colors">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-12 h-12 text-blue-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-slate-700 rounded text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Arraste e solte o arquivo aqui ou clique para selecionar</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Selecionar Arquivo
                  </label>
                  <p className="text-xs text-slate-500 mt-4">Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Informações sobre o documento..."
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/fiadores/${fiadorId}/documentos?tab=bens`}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!file}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Enviar Documento
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
