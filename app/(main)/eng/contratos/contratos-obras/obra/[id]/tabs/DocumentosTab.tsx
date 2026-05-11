'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Eye, Trash2, Plus, AlertCircle, Loader2, Building2, User, MapPin, Calendar, DollarSign, FileCheck, Edit, Save, X } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { atualizarObra } from '@/app/actions/obras';

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  esfera: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
  prazoMeses?: number | null;
  dataInicio?: Date | string | null;
  dataFim?: Date | string | null;
  prazoExecucaoMeses?: number | null;
  dataInicioExecucao?: Date | string | null;
  dataFimExecucao?: Date | string | null;
  status: string;
  cno?: string | null;
  art?: string | null;
  alvara?: string | null;
  recursoFinanceiro?: string | null;
  fonteRecursoId?: string | null;
  fonteRecurso?: FonteRecurso | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  construtora: any;
  contratante?: any;
  construtoraId: string;
  contratanteId?: string | null;
}

interface DocumentosTabProps {
  obra: Obra;
  documentos: any[];
}

export default function DocumentosTab({ obra, documentos: initialDocumentos }: DocumentosTabProps) {
  const router = useRouter();
  const [documentos, setDocumentos] = useState(initialDocumentos);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<string | null>(null);
  
  // Estado para edição inline
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    nome: obra.nome,
    valorContrato: Number(obra.valorContrato).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    dataInicio: obra.dataInicio ? new Date(obra.dataInicio).toISOString().split('T')[0] : '',
    dataFim: obra.dataFim ? new Date(obra.dataFim).toISOString().split('T')[0] : '',
    dataInicioExecucao: obra.dataInicioExecucao ? new Date(obra.dataInicioExecucao).toISOString().split('T')[0] : '',
    dataFimExecucao: obra.dataFimExecucao ? new Date(obra.dataFimExecucao).toISOString().split('T')[0] : '',
    status: obra.status,
    cno: obra.cno || '',
    art: obra.art || '',
    alvara: obra.alvara || '',
    recursoFinanceiro: obra.fonteRecursoId || obra.recursoFinanceiro || '',
    endereco: obra.endereco || '',
    cidade: obra.cidade || '',
    estado: obra.estado || '',
    latitude: obra.latitude || '',
    longitude: obra.longitude || '',
  });

  // Calcular prazo em meses automaticamente
  const calcularPrazoMeses = (dataInicio: string, dataFim: string): number | null => {
    if (!dataInicio || !dataFim) return null;
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (fim <= inicio) return null;
    
    const anos = fim.getFullYear() - inicio.getFullYear();
    const meses = fim.getMonth() - inicio.getMonth();
    const dias = fim.getDate() - inicio.getDate();
    
    let totalMeses = anos * 12 + meses;
    
    if (dias > 0) {
      totalMeses += 1;
    }
    
    return totalMeses;
  };

  const prazoCalculado = calcularPrazoMeses(editData.dataInicio, editData.dataFim);
  const prazoExecucaoCalculado = calcularPrazoMeses(editData.dataInicioExecucao, editData.dataFimExecucao);

  const tiposDocumento = [
    { value: 'Contrato', label: 'Contrato Assinado' },
    { value: 'OS', label: 'Ordem de Serviço' },
    { value: 'ART', label: 'ART - Anotação de Responsabilidade Técnica' },
    { value: 'CNO', label: 'CNO - Cadastro Nacional de Obras' },
    { value: 'Alvara', label: 'Alvará' },
    { value: 'Projeto', label: 'Projeto' },
    { value: 'Planilha', label: 'Planilha Orçamentária' },
    { value: 'RecursoFinanceiro', label: 'Documento de Recurso Financeiro' },
    { value: 'Complementar', label: 'Documento Complementar' },
  ];

  const getDocumentosPorTipo = (tipo: string) => {
    return documentos.filter(doc => doc.tipo === tipo);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    setEditError(null);

    try {
      const payload = {
        nome: editData.nome,
        construtoraId: obra.construtoraId,
        contratanteId: obra.contratanteId || null,
        endereco: editData.endereco || null,
        cidade: editData.cidade || null,
        estado: editData.estado || null,
        latitude: editData.latitude || null,
        longitude: editData.longitude || null,
        prazoMeses: prazoCalculado,
        dataInicio: editData.dataInicio || null,
        dataFim: editData.dataFim || null,
        prazoExecucaoMeses: prazoExecucaoCalculado,
        dataInicioExecucao: editData.dataInicioExecucao || null,
        dataFimExecucao: editData.dataFimExecucao || null,
        valorContrato: editData.valorContrato,
        status: editData.status,
        cno: editData.cno || null,
        art: editData.art || null,
        alvara: editData.alvara || null,
        recursoFinanceiro: editData.recursoFinanceiro || null,
      };

      const result = await atualizarObra(obra.id, payload);

      if (!result.success) {
        setEditError(result.message || 'Erro ao atualizar obra');
        setIsSaving(false);
        return;
      }

      setIsEditing(false);
      // Preservar a aba atual ao fazer refresh
      const currentTab = new URLSearchParams(window.location.search).get('tab') || 'resumo';
      router.push(`/eng/contratos/contratos-obras/obra/${obra.id}?tab=${currentTab}`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setEditError('Erro inesperado ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
    // Restaurar valores originais
    setEditData({
      nome: obra.nome,
      valorContrato: Number(obra.valorContrato).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      prazoMeses: obra.prazoMeses?.toString() || '',
      dataInicio: obra.dataInicio ? new Date(obra.dataInicio).toISOString().split('T')[0] : '',
      dataFim: obra.dataFim ? new Date(obra.dataFim).toISOString().split('T')[0] : '',
      prazoExecucaoMeses: obra.prazoExecucaoMeses?.toString() || '',
      dataInicioExecucao: obra.dataInicioExecucao ? new Date(obra.dataInicioExecucao).toISOString().split('T')[0] : '',
      dataFimExecucao: obra.dataFimExecucao ? new Date(obra.dataFimExecucao).toISOString().split('T')[0] : '',
      status: obra.status,
      cno: obra.cno || '',
      art: obra.art || '',
      alvara: obra.alvara || '',
      recursoFinanceiro: obra.fonteRecursoId || obra.recursoFinanceiro || '',
      endereco: obra.endereco || '',
      cidade: obra.cidade || '',
      estado: obra.estado || '',
      latitude: obra.latitude || '',
      longitude: obra.longitude || '',
    });
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>, tipoFixo: string) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    const form = e.currentTarget; // Salvar referência ao formulário antes de operações assíncronas

    try {
      const formData = new FormData(form);
      formData.append('obraId', obra.id);
      formData.append('tipo', tipoFixo);

      console.log('📤 Enviando documento:', { obraId: obra.id, tipo: tipoFixo });

      const response = await fetch('/api/documentos/upload-obra', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erro na resposta:', result);
        throw new Error(result.error || 'Erro ao fazer upload do documento');
      }

      console.log('✅ Upload concluído:', result);
      setDocumentos(prev => [result.documento, ...prev]);
      
      // Resetar formulário de forma segura
      if (form) {
        form.reset();
      }
      
      setShowUploadForm(null);
      alert('Documento anexado com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      setUploadError(error.message || 'Erro ao fazer upload. Verifique o console para mais detalhes.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/documentos/${documentoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir documento');
      }

      setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir documento');
    }
  };

  const MiniUploadForm = ({ tipo, label }: { tipo: string; label: string }) => {
    const docs = getDocumentosPorTipo(tipo);
    const isOpen = showUploadForm === tipo;

    return (
      <div className="mt-3">
        {!isOpen ? (
          <button
            onClick={() => setShowUploadForm(tipo)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Anexar {label}
          </button>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white">Anexar {label}</h4>
              <button
                onClick={() => setShowUploadForm(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded flex items-center gap-2 text-red-200 text-sm">
                <AlertCircle className="w-4 h-4" />
                <p>{uploadError}</p>
              </div>
            )}

            <form onSubmit={(e) => handleUpload(e, tipo)} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Arquivo *</label>
                <input
                  type="file"
                  name="arquivo"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs file:cursor-pointer hover:file:bg-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Observações</label>
                <textarea
                  name="observacoes"
                  rows={2}
                  placeholder="Informações adicionais..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <input type="hidden" name="categoria" value="Técnico" />

              <button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
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
            </form>
          </div>
        )}

        {docs.length > 0 && (
          <div className="mt-3 space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded p-2">
                <div className="flex-1">
                  <p className="text-sm text-white">{doc.nomeArquivo}</p>
                  {doc.observacoes && (
                    <p className="text-xs text-slate-400 mt-1">{doc.observacoes}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Enviado em {formatDate(doc.dataUpload)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <a
                    href={`/uploads/${doc.caminhoArquivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-slate-700 rounded text-blue-400 transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 hover:bg-slate-700 rounded text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Nome da Obra e Botão Editar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Editando Contrato' : obra.nome}</h2>
          <p className="text-sm text-slate-400 mt-1">Dados completos do contrato e execução da obra</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar Dados
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Erro ao Editar */}
      {editError && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{editError}</p>
        </div>
      )}

      {/* Informações do Contrato/Obra */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">Dados do Contrato</h3>
        
        {/* Nome da Obra */}
        {isEditing && (
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">Nome da Obra *</label>
            <input
              type="text"
              value={editData.nome}
              onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
        
        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Valor do Contrato */}
          <div className="bg-slate-800 border border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <p className="text-sm text-slate-400">Valor do Contrato</p>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editData.valorContrato}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '');
                  if (numericValue) {
                    const formatted = (parseFloat(numericValue) / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    setEditData({ ...editData, valorContrato: formatted });
                  } else {
                    setEditData({ ...editData, valorContrato: '' });
                  }
                }}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xl font-mono"
              />
            ) : (
              <p className="text-2xl font-bold text-green-400 font-mono">
                {formatCurrency(Number(obra.valorContrato))}
              </p>
            )}
          </div>

          {/* Prazo Contrato */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-slate-400">Prazo Contrato</p>
            </div>
            {isEditing && prazoCalculado !== null ? (
              <div>
                <p className="text-2xl font-bold text-green-400">{prazoCalculado} meses</p>
                <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
              </div>
            ) : isEditing ? (
              <p className="text-xl text-slate-500">Informe as datas</p>
            ) : obra.prazoMeses ? (
              <p className="text-2xl font-bold text-white">{obra.prazoMeses} meses</p>
            ) : (
              <p className="text-xl text-slate-500">Não definido</p>
            )}
          </div>

          {/* Status */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileCheck className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-slate-400">Status</p>
            </div>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
              >
                <option value="NAO_INICIADA">Não Iniciada</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="PARALISADA">Paralisada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            ) : (
              <p className="text-lg font-bold text-white">
                {obra.status === 'NAO_INICIADA' && 'Não Iniciada'}
                {obra.status === 'EM_ANDAMENTO' && 'Em Andamento'}
                {obra.status === 'CONCLUIDA' && 'Concluída'}
                {obra.status === 'PARALISADA' && 'Paralisada'}
                {obra.status === 'CANCELADA' && 'Cancelada'}
              </p>
            )}
          </div>
        </div>

        {/* Vigência do Contrato e Anexar Contrato */}
        <div className="bg-slate-800 border border-blue-800 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Vigência do Contrato
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-sm text-slate-400 mb-1">Data de Início da Vigência</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dataInicio}
                  onChange={(e) => setEditData({ ...editData, dataInicio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
              ) : (
                <p className="text-white font-medium">{obra.dataInicio ? formatDate(obra.dataInicio) : 'Não definida'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Data de Término da Vigência</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dataFim}
                  onChange={(e) => setEditData({ ...editData, dataFim: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
              ) : (
                <p className="text-white font-medium">{obra.dataFim ? formatDate(obra.dataFim) : 'Não definida'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Prazo de Vigência</p>
              {isEditing && prazoCalculado !== null ? (
                <div>
                  <p className="text-white font-bold text-lg text-blue-400">{prazoCalculado} meses</p>
                  <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
                </div>
              ) : isEditing ? (
                <p className="text-slate-500">Informe as datas</p>
              ) : obra.prazoMeses ? (
                <p className="text-white font-medium">{obra.prazoMeses} meses</p>
              ) : (
                <p className="text-slate-500">Não definido</p>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <div className="border-t border-slate-700 pt-3">
              <MiniUploadForm tipo="Contrato" label="Contrato Assinado" />
            </div>
          )}
        </div>

        {/* Prazo de Execução da Obra */}
        <div className="bg-slate-800 border border-amber-800 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Prazo de Execução da Obra
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Início da Execução</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dataInicioExecucao}
                  onChange={(e) => setEditData({ ...editData, dataInicioExecucao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
              ) : (
                <p className="text-white font-medium">{obra.dataInicioExecucao ? formatDate(obra.dataInicioExecucao) : 'Não definida'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Conclusão Prevista</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dataFimExecucao}
                  onChange={(e) => setEditData({ ...editData, dataFimExecucao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                />
              ) : (
                <p className="text-white font-medium">{obra.dataFimExecucao ? formatDate(obra.dataFimExecucao) : 'Não definida'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Prazo de Execução</p>
              {isEditing && prazoExecucaoCalculado !== null ? (
                <div>
                  <p className="text-white font-bold text-lg text-amber-400">{prazoExecucaoCalculado} meses</p>
                  <p className="text-xs text-slate-500 mt-1">Calculado automaticamente</p>
                </div>
              ) : isEditing ? (
                <p className="text-slate-500">Informe as datas</p>
              ) : obra.prazoExecucaoMeses ? (
                <p className="text-white font-medium">{obra.prazoExecucaoMeses} meses</p>
              ) : (
                <p className="text-slate-500">Não definido</p>
              )}
            </div>
          </div>
          <p className="text-xs text-amber-400 mt-2">
            ℹ️ O prazo de execução pode ser diferente da vigência contratual
          </p>
        </div>

        {/* Dados da Construtora */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Construtora Contratada
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Razão Social</p>
              <p className="text-white font-medium">{obra.construtora.razaoSocial}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Código</p>
              <p className="text-white font-mono">{obra.construtora.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">CNPJ</p>
              <p className="text-white font-mono">{obra.construtora.cnpj}</p>
            </div>
            {obra.construtora.email && (
              <div>
                <p className="text-sm text-slate-400 mb-1">E-mail</p>
                <p className="text-white">{obra.construtora.email}</p>
              </div>
            )}
            {obra.construtora.telefone && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Telefone</p>
                <p className="text-white">{obra.construtora.telefone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados do Contratante */}
        {obra.contratante && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contratante (Sacado)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Razão Social</p>
                <p className="text-white font-medium">{obra.contratante.razaoSocial}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Código</p>
                <p className="text-white font-mono">{obra.contratante.codigo}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">CNPJ</p>
                <p className="text-white font-mono">{obra.contratante.cnpj}</p>
              </div>
            </div>
          </div>
        )}

        {/* Localização */}
        {(obra.endereco || obra.cidade || obra.estado || isEditing) && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Localização da Obra
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(obra.endereco || isEditing) && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-400 mb-1">Endereço</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.endereco}
                      onChange={(e) => setEditData({ ...editData, endereco: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  ) : (
                    <p className="text-white">{obra.endereco}</p>
                  )}
                </div>
              )}
              {(obra.cidade || isEditing) && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Cidade</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.cidade}
                      onChange={(e) => setEditData({ ...editData, cidade: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  ) : (
                    <p className="text-white">{obra.cidade}</p>
                  )}
                </div>
              )}
              {(obra.estado || isEditing) && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Estado</p>
                  {isEditing ? (
                    <select
                      value={editData.estado}
                      onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white"
                    >
                      <option value="">Selecione...</option>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white">{obra.estado}</p>
                  )}
                </div>
              )}
              {((obra.latitude && obra.longitude) || isEditing) && (
                <>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Latitude</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.latitude}
                        onChange={(e) => setEditData({ ...editData, latitude: e.target.value })}
                        placeholder="-23.5505"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    ) : (
                      <p className="text-white font-mono">{obra.latitude}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Longitude</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.longitude}
                        onChange={(e) => setEditData({ ...editData, longitude: e.target.value })}
                        placeholder="-46.6333"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    ) : (
                      <p className="text-white font-mono">{obra.longitude}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Documentação Técnica */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Documentação Técnica
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            {(obra.cno || isEditing) && (
              <div>
                <p className="text-sm text-slate-400 mb-1">CNO</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.cno}
                    onChange={(e) => setEditData({ ...editData, cno: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                ) : (
                  <p className="text-white font-mono">{obra.cno}</p>
                )}
              </div>
            )}
            {(obra.art || isEditing) && (
              <div>
                <p className="text-sm text-slate-400 mb-1">ART</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.art}
                    onChange={(e) => setEditData({ ...editData, art: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                ) : (
                  <p className="text-white font-mono">{obra.art}</p>
                )}
              </div>
            )}
            {(obra.alvara || isEditing) && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Alvará</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.alvara}
                    onChange={(e) => setEditData({ ...editData, alvara: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                ) : (
                  <p className="text-white font-mono">{obra.alvara}</p>
                )}
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="border-t border-slate-700 pt-3 space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">CNO - Cadastro Nacional de Obras</p>
                <MiniUploadForm tipo="CNO" label="CNO" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">ART - Anotação de Responsabilidade Técnica</p>
                <MiniUploadForm tipo="ART" label="ART" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Alvará de Construção</p>
                <MiniUploadForm tipo="Alvara" label="Alvará" />
              </div>
            </div>
          )}
        </div>

        {/* Ordem de Serviço */}
        {!isEditing && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">Ordem de Serviço</h4>
            <MiniUploadForm tipo="OS" label="Ordem de Serviço" />
          </div>
        )}

        {/* Recurso Financeiro */}
        {(obra.fonteRecurso || isEditing) && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-white mb-3">Recurso Financeiro</h4>
            <div className="mb-3">
              <p className="text-sm text-slate-400 mb-1">Fonte de Recurso</p>
              {isEditing ? (
                <p className="text-xs text-slate-500 italic">Use o formulário de edição de obra para alterar a fonte de recurso</p>
              ) : obra.fonteRecurso ? (
                <div>
                  <p className="text-white font-medium">
                    {obra.fonteRecurso.codigo} - {obra.fonteRecurso.nome}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Tipo: {obra.fonteRecurso.tipo} | Esfera: {obra.fonteRecurso.esfera}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">Nenhuma fonte de recurso vinculada</p>
              )}
            </div>
            {!isEditing && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-sm text-slate-400 mb-2">Documentos do Convênio/Financiamento/Recurso</p>
                <MiniUploadForm tipo="RecursoFinanceiro" label="Documento de Recurso" />
              </div>
            )}
          </div>
        )}

        {/* Projetos e Planilhas */}
        {!isEditing && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Projetos e Planilhas</h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400 mb-2">Projeto Executivo/Arquitetônico</p>
                <MiniUploadForm tipo="Projeto" label="Projeto" />
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Planilha Orçamentária</p>
                <MiniUploadForm tipo="Planilha" label="Planilha Orçamentária" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documentos Complementares */}
      {!isEditing && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Documentos Complementares</h3>
          <p className="text-sm text-slate-400 mb-4">
            Anexe aqui quaisquer outros documentos relacionados ao contrato que não se enquadrem nas categorias acima.
          </p>
          <MiniUploadForm tipo="Complementar" label="Documento Complementar" />
        </div>
      )}
    </div>
  );
}
