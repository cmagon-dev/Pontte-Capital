'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Receipt, Upload, Calendar, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { criarEmpenho } from '@/app/actions/empenhos';

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: any;
}

interface NovoEmpenhoFormProps {
  obra: Obra;
}

export default function NovoEmpenhoForm({ obra }: NovoEmpenhoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    numeroNE: '',
    dataEmissao: '',
    valor: '',
    tipo: 'ORIGINAL',
    alertaMinimo: '',
    observacoes: '',
    status: 'ATIVO',
  });

  const [arquivos, setArquivos] = useState<File[]>([]);

  const tipos = [
    { value: 'ORIGINAL', label: 'Empenho Original' },
    { value: 'REFORCO', label: 'Reforço (Adicional)' },
    { value: 'ANULACAO', label: 'Anulação (Redução)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparar dados
      const payload = {
        obraId: obra.id,
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

      // Criar empenho
      const result = await criarEmpenho(payload);

      if (!result.success) {
        setServerError(result.message);
        setIsSubmitting(false);
        return;
      }

      console.log(`✅ Empenho criado! ID: ${result.data.id}`);
      console.log(`📁 Arquivos para upload: ${arquivos.length}`);

      // Se houver arquivos, fazer upload
      if (arquivos.length > 0 && result.data) {
        await handleUploadArquivos(result.data.id);
      }

      alert(result.message);
      router.push(`/eng/contratos/contratos-obras/obra/${obra.id}?tab=empenhos`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao criar empenho:', error);
      setServerError('Erro inesperado ao criar empenho. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const handleUploadArquivos = async (empenhoId: string) => {
    if (arquivos.length === 0) {
      console.log('⚠️ Nenhum arquivo para upload');
      return;
    }

    console.log(`📤 Iniciando upload de ${arquivos.length} arquivo(s)...`);
    setIsUploading(true);

    try {
      for (const arquivo of arquivos) {
        console.log(`📤 Uploading: ${arquivo.name}`);
        const formData = new FormData();
        formData.append('file', arquivo);
        formData.append('empenhoId', empenhoId);
        formData.append('obraId', obra.id);

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
          href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=empenhos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Novo Empenho</h1>
          <p className="text-slate-400">
            {obra.codigo} - {obra.nome}
          </p>
        </div>
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
                placeholder="NE-2026-001"
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
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
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
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">
                Alerta de Saldo Mínimo (R$) - Opcional
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">R$</span>
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
              <p className="mt-1 text-xs text-slate-500">
                Sistema alertará quando o saldo do empenho atingir este valor
              </p>
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

        {/* Upload de Arquivos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentos da Nota de Empenho
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Anexar Nota de Empenho (múltiplos PDFs)
            </label>

            {/* Input File Customizado */}
            <input
              type="file"
              id="file-upload-empenho"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-empenho"
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
            href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=empenhos`}
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
                Salvar Empenho
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
