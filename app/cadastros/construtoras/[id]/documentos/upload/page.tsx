'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import { criarDocumento } from '@/app/actions/documentos';

export default function UploadDocumentoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaParam = searchParams?.get('categoria') || 'Jurídico';
  
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    categoria: categoriaParam,
    tipo: '',
    dataValidade: '',
    observacoes: '',
  });

  // Atualizar categoria quando o parâmetro mudar
  useEffect(() => {
    if (categoriaParam) {
      setFormData(prev => ({ ...prev, categoria: categoriaParam, tipo: '' }));
    }
  }, [categoriaParam]);

  const categorias = ['Jurídico', 'Fiscal', 'Financeiro'];
  const tiposPorCategoria: Record<string, string[]> = {
    Jurídico: ['Contrato Social', 'Estatuto', 'Ata de Assembleia', 'Alteração Contratual', 'Outros'],
    Fiscal: ['CND Federal', 'CND Estadual', 'CND Municipal', 'FGTS', 'Trabalhista', 'Outros'],
    Financeiro: ['Balanço Patrimonial', 'DRE', 'Demonstração de Fluxo de Caixa', 'Certidão Negativa de Débitos', 'Outros'],
  };

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
    setIsSubmitting(true);
    setServerError(null);

    if (!file) {
      setServerError('Por favor, selecione um arquivo');
      setIsSubmitting(false);
      return;
    }

    if (!formData.tipo) {
      setServerError('Por favor, selecione o tipo de documento');
      setIsSubmitting(false);
      return;
    }

    try {
      // Criar FormData para enviar arquivo
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('construtoraId', params.id);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('tipo', formData.tipo);
      formDataToSend.append('dataValidade', formData.dataValidade || '');
      formDataToSend.append('observacoes', formData.observacoes || '');

      const result = await criarDocumento(formDataToSend);

      if (!result.success) {
        setServerError(result.message || 'Erro ao enviar documento');
        setIsSubmitting(false);
        return;
      }

      router.push(`/cadastros/construtoras/${params.id}/documentos`);
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
            href={`/cadastros/construtoras/${params.id}/documentos`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload de Documento</h1>
            <p className="text-slate-400">Anexar Novo Documento ao Cofre Digital</p>
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
          {/* Seleção de Categoria e Tipo */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Classificação do Documento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Categoria *</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => {
                    setFormData({ ...formData, categoria: e.target.value, tipo: '' });
                  }}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Documento *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione o tipo</option>
                  {tiposPorCategoria[formData.categoria]?.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-12 h-12 text-blue-400" />
                    <div className="text-left">
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="p-1 hover:bg-slate-700 rounded text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">
                    Arraste e solte o arquivo aqui ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
                  <p className="text-xs text-slate-500 mt-4">
                    Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Data de Validade */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Validade e Observações
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Data de Validade</label>
                <input
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  O sistema verifica automaticamente documentos vencidos e bloqueia desembolsos
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Observações sobre o documento..."
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/construtoras/${params.id}/documentos`}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!file || isSubmitting || !formData.tipo}
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
