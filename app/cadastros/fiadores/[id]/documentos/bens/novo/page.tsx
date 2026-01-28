'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Home, MapPin, Loader2, AlertCircle, FileText, Upload, X, Plus } from 'lucide-react';
import { criarBem } from '@/app/actions/bens';
import { criarDocumentoBem } from '@/app/actions/documentos';
import { formatCurrency } from '@/lib/utils/format';

export default function NovoBemPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    tipo: 'Imóvel',
    descricao: '',
    valor: '',
    rendaMensal: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    matricula: '',
    cartorio: '',
    status: 'Livre',
    observacoes: '',
  });

  const [documentos, setDocumentos] = useState<Array<{ tipo: string; arquivo: File | null }>>([
    { tipo: '', arquivo: null },
  ]);

  const tiposBens = ['Imóvel', 'Veículo', 'Investimentos', 'Outros'];

  const tiposDocumentosPorBem: Record<string, string[]> = {
    Imóvel: ['Matrícula de Imóvel', 'ITBI', 'IPTU', 'Contrato de Compra e Venda', 'Avaliação', 'Certidão de Ônus', 'Escritura'],
    Veículo: ['CRLV', 'CRV', 'Avaliação Veicular', 'Contrato de Financiamento', 'Certidão de Ônus'],
    Investimentos: ['Extrato Bancário', 'Aplicações Financeiras', 'Ações', 'Comprovante de Saldo', 'Outros'],
    Outros: ['Contrato', 'Avaliação', 'Documento Comprobatório', 'Outros'],
  };

  // Função para formatar valor monetário no input
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Função para converter string formatada em número
  const parseCurrencyString = (value: string): number => {
    const numValue = parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
    return isNaN(numValue) ? 0 : numValue;
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const addDocumento = () => {
    setDocumentos([...documentos, { tipo: '', arquivo: null }]);
  };

  const removeDocumento = (index: number) => {
    if (documentos.length > 1) {
      setDocumentos(documentos.filter((_, i) => i !== index));
    }
  };

  const updateDocumento = (index: number, field: 'tipo' | 'arquivo', value: string | File | null) => {
    const newDocs = [...documentos];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocumentos(newDocs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.descricao || !formData.valor) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    // Validar documentos (se tiver pelo menos um com arquivo, deve ter tipo)
    const docsComArquivo = documentos.filter(doc => doc.arquivo !== null);
    for (const doc of docsComArquivo) {
      if (!doc.tipo) {
        alert('Por favor, selecione o tipo de todos os documentos anexados');
        return;
      }
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Criar o bem primeiro
      const payload = {
        fiadorId: params.id,
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

      const resultBem = await criarBem(payload);

      if (!resultBem.success) {
        setServerError(resultBem.message || 'Erro ao salvar bem');
        setIsSubmitting(false);
        return;
      }

      // 2. Salvar documentos se houver
      if (docsComArquivo.length > 0 && resultBem.bemId) {
        for (const doc of docsComArquivo) {
          const formDataDoc = new FormData();
          formDataDoc.append('bemId', resultBem.bemId);
          formDataDoc.append('fiadorId', params.id);
          formDataDoc.append('categoria', 'Bem em Garantia');
          formDataDoc.append('tipo', doc.tipo);
          formDataDoc.append('file', doc.arquivo!);

          const resultDoc = await criarDocumentoBem(formDataDoc);
          
          if (!resultDoc.success) {
            console.warn('Erro ao salvar documento:', resultDoc.message);
            // Continua mesmo se um documento falhar
          }
        }
      }

      // Sucesso - redirecionar
      router.push(`/cadastros/fiadores/${params.id}/documentos?tab=bens`);
      router.refresh();

    } catch (error) {
      console.error('Erro ao criar bem:', error);
      setServerError('Erro inesperado ao salvar. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fiadores/${params.id}/documentos?tab=bens`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Adicionar Bem em Garantia</h1>
            <p className="text-slate-400">Cadastro de Bem e Documentos Comprobatórios</p>
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
                  placeholder={
                    formData.tipo === 'Imóvel'
                      ? 'Ex: Apartamento - Av. Faria Lima, 2000'
                      : formData.tipo === 'Veículo'
                        ? 'Ex: Honda Civic 2020'
                        : 'Descreva o bem'
                  }
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
                  placeholder="0,00"
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
                {formData.valor && (
                  <p className="text-xs text-green-400 mt-1 font-mono">{formatCurrency(parseCurrencyString(formData.valor))}</p>
                )}
              </div>
              {(formData.tipo === 'Imóvel' || formData.tipo === 'Investimentos') && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Renda Mensal (R$) {formData.tipo === 'Imóvel' ? '(opcional)' : ''}</label>
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
                    placeholder="0,00"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                  {formData.rendaMensal && (
                    <p className="text-xs text-blue-400 mt-1 font-mono">{formatCurrency(parseCurrencyString(formData.rendaMensal))}</p>
                  )}
                  {formData.tipo === 'Imóvel' && (
                    <p className="text-xs text-slate-500 mt-1">Renda do imóvel (aluguel ou arrendamento)</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Endereço (Apenas para Imóveis) */}
          {formData.tipo === 'Imóvel' && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localização do Imóvel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">Endereço Completo *</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Ex: Av. Faria Lima, 2000 - Jardim Paulista"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cidade *</label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Estado *</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
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
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dados da Matrícula (Apenas para Imóveis) */}
          {formData.tipo === 'Imóvel' && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Dados da Matrícula</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Número da Matrícula</label>
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Ex: 12345-6"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cartório de Registro</label>
                  <input
                    type="text"
                    value={formData.cartorio}
                    onChange={(e) => setFormData({ ...formData, cartorio: e.target.value })}
                    placeholder="Ex: 1º Cartório de Registro de Imóveis"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Documentos Comprobatórios */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Comprobatórios
              </h2>
              <button
                type="button"
                onClick={addDocumento}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Documento
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Anexe documentos que comprovem a propriedade e valor do bem (opcional)</p>
            
            <div className="space-y-4">
              {documentos.map((doc, index) => (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Documento #{index + 1}</span>
                    {documentos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDocumento(index)}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tipo de Documento</label>
                      <select
                        value={doc.tipo}
                        onChange={(e) => updateDocumento(index, 'tipo', e.target.value)}
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
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              // Validar tamanho (máximo 10MB)
                              if (e.target.files[0].size > 10 * 1024 * 1024) {
                                alert('Arquivo muito grande. Tamanho máximo: 10MB');
                                return;
                              }
                              updateDocumento(index, 'arquivo', e.target.files[0]);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />
                      </div>
                      {doc.arquivo && (
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          {doc.arquivo.name} ({(doc.arquivo.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              placeholder="Informações adicionais sobre o bem, condições especiais, etc..."
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/fiadores/${params.id}/documentos?tab=bens`}
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
                  Salvar Bem
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
