'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Receipt,
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
  Download,
} from 'lucide-react';
import { atualizarEmpenho, excluirEmpenho } from '@/app/actions/empenhos';

interface Obra {
  id: string;
  codigo: string;
  nome: string;
}

interface Documento {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  createdAt: Date;
}

interface Empenho {
  id: string;
  numero: number;
  numeroNE: string;
  dataEmissao: Date;
  valor: number;
  saldoAtual: number;
  tipo: string;
  alertaMinimo: number | null;
  observacoes: string | null;
  status: string;
  obra: Obra;
}

interface EditarEmpenhoFormProps {
  empenho: Empenho;
  initialDocumentos: Documento[];
}

export default function EditarEmpenhoForm({
  empenho,
  initialDocumentos,
}: EditarEmpenhoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    numeroNE: empenho.numeroNE,
    dataEmissao: new Date(empenho.dataEmissao).toISOString().split('T')[0],
    valor: String(empenho.valor * 100), // Converter para centavos
    tipo: empenho.tipo,
    alertaMinimo: empenho.alertaMinimo ? String(empenho.alertaMinimo * 100) : '',
    observacoes: empenho.observacoes || '',
    status: empenho.status,
  });

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>(initialDocumentos);

  const tipos = [
    { value: 'ORIGINAL', label: 'Empenho Original' },
    { value: 'REFORCO', label: 'Reforço (Adicional)' },
    { value: 'ANULACAO', label: 'Anulação (Redução)' },
  ];

  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'ESGOTADO', label: 'Esgotado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparar dados
      const payload = {
        numeroNE: formData.numeroNE,
        dataEmissao: formData.dataEmissao,
        valor: parseFloat(formData.valor.replace(/\D/g, '')) / 100,
        tipo: formData.tipo,
        alertaMinimo: formData.alertaMinimo
          ? parseFloat(formData.alertaMinimo.replace(/\D/g, '')) / 100
          : null,
        observacoes: formData.observacoes || null,
        status: formData.status,
      };

      console.log('📤 Payload:', payload);

      // Atualizar empenho
      const result = await atualizarEmpenho(empenho.id, payload);

      if (!result.success) {
        setServerError(result.message);
        setIsSubmitting(false);
        return;
      }

      console.log(`✅ Empenho atualizado!`);
      console.log(`📁 Arquivos para upload: ${arquivos.length}`);

      // Se houver novos arquivos, fazer upload
      if (arquivos.length > 0) {
        await handleUploadArquivos();
      }

      alert(result.message);
      router.push(`/eng/contratos/contratos-obras/obra/${empenho.obra.id}?tab=empenhos`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar empenho:', error);
      setServerError('Erro inesperado ao atualizar empenho. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const handleUploadArquivos = async () => {
    if (arquivos.length === 0) return;

    console.log(`📤 Iniciando upload de ${arquivos.length} arquivo(s)...`);
    setIsUploading(true);

    try {
      for (const arquivo of arquivos) {
        console.log(`📤 Uploading: ${arquivo.name}`);
        const formData = new FormData();
        formData.append('file', arquivo);
        formData.append('empenhoId', empenho.id);
        formData.append('obraId', empenho.obra.id);

        const response = await fetch('/api/empenhos/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          console.log(`✅ Upload bem-sucedido: ${arquivo.name}`);
        } else {
          console.error(`❌ Erro ao fazer upload de ${arquivo.name}:`, result.message);
        }
      }
      console.log('✅ Todos os uploads concluídos');
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExcluirDocumento = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/documentos/${docId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setDocumentos(documentos.filter((d) => d.id !== docId));
        alert('Documento excluído com sucesso!');
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento');
    }
  };

  const handleExcluirEmpenho = async () => {
    if (
      !confirm(
        'Tem certeza que deseja excluir este empenho? Esta ação não pode ser desfeita!'
      )
    )
      return;

    try {
      const result = await excluirEmpenho(empenho.id);

      if (result.success) {
        alert(result.message);
        router.push(`/eng/contratos/contratos-obras/obra/${empenho.obra.id}?tab=empenhos`);
        router.refresh();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir empenho:', error);
      alert('Erro ao excluir empenho');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('📎 Arquivos selecionados:', files);
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log('✅ Array de arquivos:', fileArray);
      setArquivos(fileArray);
    } else {
      console.log('⚠️ Nenhum arquivo selecionado');
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
          href={`/eng/contratos/contratos-obras/obra/${empenho.obra.id}?tab=empenhos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">
            Editar Empenho #{empenho.numero}
          </h1>
          <p className="text-slate-400">
            {empenho.obra.codigo} - {empenho.obra.nome}
          </p>
        </div>
        <button
          onClick={handleExcluirEmpenho}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Empenho
        </button>
      </div>

      {serverError && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Empenho */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Dados da Nota de Empenho
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Número da NE *</label>
              <input
                type="text"
                value={formData.numeroNE}
                onChange={(e) => setFormData({ ...formData, numeroNE: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Data de Emissão *</label>
              <input
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Empenho *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {tipos.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {formData.tipo === 'ANULACAO' && (
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Anulação reduz o saldo empenhado total da obra
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Valor (R$) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={formatCurrency(formData.valor)}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value.replace(/\D/g, '') })
                  }
                  required
                  className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Alerta de Saldo Mínimo (R$) - Opcional
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  value={formData.alertaMinimo ? formatCurrency(formData.alertaMinimo) : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertaMinimo: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full pl-12 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-slate-400 mb-2">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Informações adicionais sobre o empenho..."
            />
          </div>
        </div>

        {/* Documentos Anexados */}
        {documentos.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos Anexados ({documentos.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-slate-800 p-3 rounded"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <a
                      href={doc.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white hover:text-blue-400 truncate"
                    >
                      {doc.nomeArquivo}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.caminhoArquivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleExcluirDocumento(doc.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Novos Documentos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Adicionar Novos Documentos
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Anexar novos documentos (múltiplos PDFs)
            </label>

            <input
              type="file"
              id="file-upload-empenho-edit"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-empenho-edit"
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-white">
                {arquivos.length > 0
                  ? `${arquivos.length} arquivo(s) selecionado(s)`
                  : 'Clique para selecionar arquivos'}
              </span>
            </label>

            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">Arquivos selecionados ({arquivos.length}):</p>
                {arquivos.map((arquivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-800 p-3 rounded"
                  >
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
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Formatos aceitos: PDF, Imagens (PNG, JPG)
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${empenho.obra.id}?tab=empenhos`}
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
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
