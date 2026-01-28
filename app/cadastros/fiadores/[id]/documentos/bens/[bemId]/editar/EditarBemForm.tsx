'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Home, MapPin, Loader2, AlertCircle, FileText, Trash2, Eye, Upload, Plus, X } from 'lucide-react';
import { atualizarBem, excluirBem } from '@/app/actions/bens';
import { criarDocumentoBem, excluirDocumento } from '@/app/actions/documentos';
import { formatCurrency } from '@/lib/utils/format';

interface Documento {
  id: string;
  tipo: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataUpload: Date;
}

interface EditarBemFormProps {
  bemId: string;
  fiadorId: string;
  initialData: {
    tipo: string;
    descricao: string;
    valor: string;
    rendaMensal: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    matricula: string;
    cartorio: string;
    status: string;
    observacoes: string;
  };
  documentos: Documento[];
}

export default function EditarBemForm({ bemId, fiadorId, initialData, documentos: documentosIniciais }: EditarBemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState(documentosIniciais);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  
  // Upload de novos documentos
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [novoDocumento, setNovoDocumento] = useState<{ tipo: string; arquivo: File | null }>({ tipo: '', arquivo: null });
  
  const [formData, setFormData] = useState(initialData);

  const tiposBens = ['Imóvel', 'Veículo', 'Investimentos', 'Outros'];

  const tiposDocumentosPorBem: Record<string, string[]> = {
    Imóvel: ['Matrícula de Imóvel', 'ITBI', 'IPTU', 'Contrato de Compra e Venda', 'Avaliação', 'Certidão de Ônus', 'Escritura'],
    Veículo: ['CRLV', 'CRV', 'Avaliação Veicular', 'Contrato de Financiamento', 'Certidão de Ônus'],
    Investimentos: ['Extrato Bancário', 'Aplicações Financeiras', 'Ações', 'Comprovante de Saldo', 'Outros'],
    Outros: ['Contrato', 'Avaliação', 'Documento Comprobatório', 'Outros'],
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const parseCurrencyString = (value: string): number => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(numValue) ? 0 : numValue;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleExcluirBem = async () => {
    if (!confirm('Tem certeza que deseja excluir este bem? Esta ação não pode ser desfeita e todos os documentos vinculados serão excluídos.')) {
      return;
    }

    setIsDeleting(true);
    setServerError(null);

    try {
      const result = await excluirBem(bemId, fiadorId);

      if (!result.success) {
        setServerError(result.message || 'Erro ao excluir bem');
        setIsDeleting(false);
        return;
      }

      router.push(`/cadastros/fiadores/${fiadorId}/documentos?tab=bens`);
      router.refresh();

    } catch (error) {
      console.error('Erro ao excluir bem:', error);
      setServerError('Erro inesperado ao excluir. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const handleExcluirDocumento = async (docId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    setDeletingDocId(docId);

    try {
      const result = await excluirDocumento(docId, fiadorId, 'fiador');

      if (!result.success) {
        alert(result.message || 'Erro ao excluir documento');
        setDeletingDocId(null);
        return;
      }

      // Remover documento da lista
      setDocumentos(documentos.filter(doc => doc.id !== docId));
      setDeletingDocId(null);

    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro inesperado ao excluir documento');
      setDeletingDocId(null);
    }
  };

  const handleUploadDocumento = async () => {
    if (!novoDocumento.arquivo || !novoDocumento.tipo) {
      alert('Selecione um arquivo e o tipo de documento');
      return;
    }

    setUploadingDoc(true);

    try {
      const formDataDoc = new FormData();
      formDataDoc.append('bemId', bemId);
      formDataDoc.append('fiadorId', fiadorId);
      formDataDoc.append('categoria', 'Bem em Garantia');
      formDataDoc.append('tipo', novoDocumento.tipo);
      formDataDoc.append('file', novoDocumento.arquivo);

      const result = await criarDocumentoBem(formDataDoc);

      if (!result.success) {
        alert(result.message || 'Erro ao enviar documento');
        setUploadingDoc(false);
        return;
      }

      // Recarregar página para atualizar lista de documentos
      router.refresh();
      setShowUploadSection(false);
      setNovoDocumento({ tipo: '', arquivo: null });
      setUploadingDoc(false);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro inesperado ao fazer upload');
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.valor) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        fiadorId: fiadorId,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: formData.valor,
        rendaMensal: formData.rendaMensal || '',
        endereco: formData.tipo === 'Imóvel' ? formData.endereco : '',
        cidade: formData.tipo === 'Imóvel' ? formData.cidade : '',
        estado: formData.tipo === 'Imóvel' ? formData.estado : '',
        cep: formData.tipo === 'Imóvel' ? formData.cep.replace(/\D/g, '') : '',
        matricula: formData.tipo === 'Imóvel' ? formData.matricula : '',
        cartorio: formData.tipo === 'Imóvel' ? formData.cartorio : '',
        status: formData.status,
        observacoes: formData.observacoes || '',
      };

      const result = await atualizarBem(bemId, payload);

      if (!result.success) {
        setServerError(result.message || 'Erro ao atualizar bem');
        setIsSubmitting(false);
        return;
      }

      router.push(`/cadastros/fiadores/${fiadorId}/documentos?tab=bens`);
      router.refresh();

    } catch (error) {
      console.error('Erro ao atualizar bem:', error);
      setServerError('Erro inesperado ao atualizar. Tente novamente.');
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Editar Bem em Garantia</h1>
            <p className="text-slate-400">Atualização de Dados do Bem e Documentos</p>
          </div>
        </div>
        <button
          onClick={handleExcluirBem}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              Excluir Bem
            </>
          )}
        </button>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Dados do Bem */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Dados do Bem
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Bem *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {tiposBens.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Livre">Livre (Sem ônus)</option>
                  <option value="Penhorado">Penhorado</option>
                  <option value="Hipotecado">Hipotecado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Descrição do Bem *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Valor Estimado (R$) *</label>
                <input
                  type="text"
                  value={formData.valor}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    if (numericValue) {
                      const numValue = parseFloat(numericValue) / 100;
                      const formatted = formatNumber(numValue);
                      setFormData({ ...formData, valor: formatted });
                    } else {
                      setFormData({ ...formData, valor: '' });
                    }
                  }}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
                {formData.valor && (
                  <p className="text-xs text-green-400 mt-1 font-mono">{formatCurrency(parseCurrencyString(formData.valor))}</p>
                )}
              </div>
              {(formData.tipo === 'Imóvel' || formData.tipo === 'Investimentos') && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Renda Mensal (R$)</label>
                  <input
                    type="text"
                    value={formData.rendaMensal}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '');
                      if (numericValue) {
                        const numValue = parseFloat(numericValue) / 100;
                        const formatted = formatNumber(numValue);
                        setFormData({ ...formData, rendaMensal: formatted });
                      } else {
                        setFormData({ ...formData, rendaMensal: '' });
                      }
                    }}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  {formData.rendaMensal && (
                    <p className="text-xs text-blue-400 mt-1 font-mono">{formatCurrency(parseCurrencyString(formData.rendaMensal))}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Endereço (Apenas para Imóveis) */}
          {formData.tipo === 'Imóvel' && (
            <>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Localização do Imóvel
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-slate-400 mb-2">Endereço Completo</label>
                    <input
                      type="text"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CEP</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      maxLength={9}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Dados da Matrícula</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Número da Matrícula</label>
                    <input
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Cartório de Registro</label>
                    <input
                      type="text"
                      value={formData.cartorio}
                      onChange={(e) => setFormData({ ...formData, cartorio: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Documentos Anexados */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Comprobatórios ({documentos.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowUploadSection(!showUploadSection)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Documento
              </button>
            </div>

            {/* Seção de Upload */}
            {showUploadSection && (
              <div className="mb-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Novo Documento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tipo de Documento</label>
                    <select
                      value={novoDocumento.tipo}
                      onChange={(e) => setNovoDocumento({ ...novoDocumento, tipo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      {tiposDocumentosPorBem[formData.tipo]?.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Arquivo</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          if (e.target.files[0].size > 10 * 1024 * 1024) {
                            alert('Arquivo muito grande. Tamanho máximo: 10MB');
                            return;
                          }
                          setNovoDocumento({ ...novoDocumento, arquivo: e.target.files[0] });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {novoDocumento.arquivo && (
                      <p className="text-xs text-green-400 mt-1">{novoDocumento.arquivo.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadSection(false);
                      setNovoDocumento({ tipo: '', arquivo: null });
                    }}
                    className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadDocumento}
                    disabled={uploadingDoc || !novoDocumento.arquivo || !novoDocumento.tipo}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Documentos */}
            {documentos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum documento anexado</p>
            ) : (
              <div className="space-y-2">
                {documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-white font-medium">{doc.tipo}</p>
                        <p className="text-xs text-slate-400">{doc.nomeArquivo} • {formatDate(doc.dataUpload)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.caminhoArquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-700 rounded text-blue-400 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleExcluirDocumento(doc.id)}
                        disabled={deletingDocId === doc.id}
                        className="p-2 hover:bg-red-600 rounded text-red-400 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        {deletingDocId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Informações adicionais sobre o bem..."
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
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
