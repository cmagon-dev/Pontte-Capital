'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import { criarDocumentoFundo } from '@/app/actions/documentos';

export default function UploadDocumentoFundoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    tipo: '',
    dataValidade: '',
    observacoes: '',
  });

  // Tipos de documentos específicos para FIDC
  const tiposDocumentos = [
    'Regulamento do Fundo',
    'Estatuto do Fundo',
    'Contrato Social',
    'Procuração',
    'Instituto de Pagamento',
    'Ata de Constituição',
    'Ata de Assembleia',
    'Alteração Contratual',
    'Certidão CVM',
    'Certidão de Regularidade',
    'Regulamento de Assembleia',
    'Política de Investimento',
    'Outros'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validar tamanho (máximo 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fundoId', params.id);
      formDataToSend.append('categoria', 'Jurídico'); // Mantém categoria no banco (pode ser genérica)
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('dataValidade', formData.dataValidade || '');
      formDataToSend.append('observacoes', formData.observacoes || '');
      formDataToSend.append('file', file);

      const result = await criarDocumentoFundo(formDataToSend);

      if (!result.success) {
        setServerError(result.message || 'Erro ao enviar documento');
        setIsSubmitting(false);
        return;
      }

      router.push(`/cadastros/fundos/${params.id}/documentos`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      setServerError('Erro de comunicação com o servidor. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fundos/${params.id}/documentos`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload de Documento</h1>
            <p className="text-slate-400">Regulamento e Documentos do Fundo FIDC</p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{serverError}</p>
        </div>
      )}

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
                {tiposDocumentos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {(formData.tipo === 'Regulamento do Fundo' || formData.tipo === 'Procuração' || formData.tipo === 'Estatuto do Fundo') && (
                <p className="text-xs text-amber-400 mt-2">⚠️ Documento essencial para operação do FIDC</p>
              )}
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                  <p className="text-xs text-slate-500 mt-4">Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)</p>
                </>
              )}
            </div>
          </div>

          {/* Data de Validade */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Data de Validade
            </h2>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data de Validade (opcional)</label>
              <input
                type="date"
                value={formData.dataValidade}
                onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">Documentos com validade serão monitorados automaticamente</p>
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
              placeholder="Informações adicionais sobre o documento..."
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/fundos/${params.id}/documentos`}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!file || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Enviar Documento
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
