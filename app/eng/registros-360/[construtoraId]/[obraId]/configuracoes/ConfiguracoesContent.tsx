'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Camera, Calendar, CheckCircle2, Clock, AlertCircle, Search, Upload, Edit2, X, Loader2, Crop, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { uploadPlantaBaixa, atualizarPlantaBaixa, excluirPlantaBaixa } from '@/app/actions/canteiro-360';
import dynamic from 'next/dynamic';

// Importar PDFAreaSelector dinamicamente para evitar problemas de SSR
const PDFAreaSelector = dynamic(() => import('./PDFAreaSelector'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-white">Carregando seletor de área...</p>
      </div>
    </div>
  ),
});

type PlantaBaixa = {
  id: string;
  titulo: string;
  dataCriacao: string;
  status: 'Ativa' | 'Em Configuração' | 'Arquivada';
  tipo: 'implantacao' | 'pavimento';
  totalPontos: number;
  totalFotos: number;
  totalSetores?: number;
};

type Obra = {
  id: string;
  codigo: string;
  nome: string;
  numeroContrato?: string;
  objeto?: string;
};

type Construtora = {
  id: string;
  razaoSocial: string;
};

export default function ConfiguracoesContent({
  params,
  plantas,
  obra,
  construtora,
}: {
  params: { construtoraId: string; obraId: string };
  plantas: PlantaBaixa[];
  obra: Obra;
  construtora: Construtora;
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'IMPLANTACAO' as 'IMPLANTACAO' | 'PAVIMENTO',
    arquivo: null as File | null,
  });
  const [mostrarSeletorArea, setMostrarSeletorArea] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfCarregado, setPdfCarregado] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [plantaSelecionada, setPlantaSelecionada] = useState<PlantaBaixa | null>(null);
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [formDataEditar, setFormDataEditar] = useState({
    nome: '',
    tipo: 'IMPLANTACAO' as 'IMPLANTACAO' | 'PAVIMENTO',
  });

  const filteredPlantas = plantas.filter((planta) =>
    planta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    planta.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa':
        return 'bg-green-900 text-green-400 border-green-800';
      case 'Em Configuração':
        return 'bg-blue-900 text-blue-400 border-blue-800';
      case 'Arquivada':
        return 'bg-slate-700 text-slate-400 border-slate-600';
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativa':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'Em Configuração':
        return <Clock className="w-4 h-4" />;
      case 'Arquivada':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'implantacao' 
      ? 'bg-purple-900 text-purple-400 border-purple-800' 
      : 'bg-blue-900 text-blue-400 border-blue-800';
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <Link
            href={`/eng/registros-360/${params.construtoraId}/${params.obraId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Visualizador
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Camera className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Gerenciar Plantas</h1>
              <p className="text-slate-400">{obra.codigo} - {obra.nome}</p>
              <p className="text-slate-500 text-sm mt-1">Construtora: {construtora.razaoSocial}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload Nova Planta
        </button>
      </div>

      {/* KPIs Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Plantas</p>
          <p className="text-2xl font-bold text-white">{filteredPlantas.length}</p>
        </div>
        <div className="bg-slate-900 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Plantas Ativas</p>
          <p className="text-2xl font-bold text-green-400">
            {filteredPlantas.filter((p) => p.status === 'Ativa').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Pontos</p>
          <p className="text-2xl font-bold text-blue-400">
            {filteredPlantas.reduce((sum, p) => sum + p.totalPontos, 0)}
          </p>
        </div>
        <div className="bg-slate-900 border border-purple-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Total de Fotos</p>
          <p className="text-2xl font-bold text-purple-400">
            {filteredPlantas.reduce((sum, p) => sum + p.totalFotos, 0)}
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabela de Plantas */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-engineering w-full">
            <thead>
              <tr>
                <th>Planta</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Pontos</th>
                <th>Setores</th>
                <th>Fotos</th>
                <th>Data Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlantas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Nenhuma planta encontrada
                  </td>
                </tr>
              ) : (
                filteredPlantas.map((planta) => (
                  <tr key={planta.id} className="hover:bg-slate-800">
                    <td>
                      <div>
                        <p className="font-medium text-white">{planta.titulo}</p>
                        <p className="text-xs text-slate-400 font-mono">{planta.id}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${getTipoColor(planta.tipo)}`}>
                        {planta.tipo === 'implantacao' ? 'Implantação' : 'Pavimento'}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 w-fit ${getStatusColor(planta.status)}`}>
                        {getStatusIcon(planta.status)}
                        {planta.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-white font-mono">{planta.totalPontos}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-white font-mono">{planta.totalSetores ?? '-'}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-white font-mono">{planta.totalFotos}</span>
                    </td>
                    <td className="text-slate-400 text-sm">
                      {formatDate(planta.dataCriacao)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/eng/registros-360/${params.construtoraId}/${params.obraId}/configuracoes/${planta.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Marcações
                        </Link>
                        <button
                          onClick={() => {
                            setPlantaSelecionada(planta);
                            setFormDataEditar({
                              nome: planta.titulo,
                              tipo: planta.tipo === 'implantacao' ? 'IMPLANTACAO' : 'PAVIMENTO',
                            });
                            setModalEditarAberto(true);
                          }}
                          className="inline-flex items-center justify-center p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setPlantaSelecionada(planta);
                            setModalExcluirAberto(true);
                          }}
                          className="inline-flex items-center justify-center p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Upload */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Upload Nova Planta</h2>
              <button
                onClick={() => {
                  setModalAberto(false);
                  setFormData({ nome: '', tipo: 'IMPLANTACAO', arquivo: null });
                  setImagemSelecionada(null);
                  setPdfCarregado(false);
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                  }
                }}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
                disabled={uploading}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.arquivo || !formData.nome.trim()) {
                  alert('Por favor, preencha todos os campos e selecione um arquivo PDF.');
                  return;
                }

                if (!imagemSelecionada) {
                  alert('Por favor, selecione a área da planta no PDF antes de fazer o upload.');
                  return;
                }

                setUploading(true);
                try {
                  // Converter data URL em File
                  const response = await fetch(imagemSelecionada);
                  const blob = await response.blob();
                  const imagemFile = new File([blob], `${formData.nome}_imagem.png`, { type: 'image/png' });

                  const uploadFormData = new FormData();
                  uploadFormData.append('file', imagemFile); // Enviar a imagem da área selecionada
                  uploadFormData.append('pdfFile', formData.arquivo); // Enviar também o PDF original
                  uploadFormData.append('obraId', params.obraId);
                  uploadFormData.append('nome', formData.nome);
                  uploadFormData.append('tipo', formData.tipo);

                  const resultado = await uploadPlantaBaixa(uploadFormData);

                  if (resultado.success) {
                    setModalAberto(false);
                    setFormData({ nome: '', tipo: 'IMPLANTACAO', arquivo: null });
                    setImagemSelecionada(null);
                    setPdfCarregado(false);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                    router.refresh();
                  } else {
                    alert(`Erro ao fazer upload: ${resultado.message}`);
                  }
                } catch (error: any) {
                  console.error('Erro ao fazer upload:', error);
                  alert(`Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`);
                } finally {
                  setUploading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Nome da Planta <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Implantação Geral, Térreo, 1º Andar..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={uploading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Tipo de Planta <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'IMPLANTACAO' | 'PAVIMENTO' })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={uploading}
                  required
                >
                  <option value="IMPLANTACAO">Implantação (Planta Geral)</option>
                  <option value="PAVIMENTO">Pavimento (Planta Interna)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Arquivo PDF da Planta <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.type === 'application/pdf') {
                      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                      const url = URL.createObjectURL(file);
                      setPdfUrl(url);
                      setFormData({ ...formData, arquivo: file });
                      setImagemSelecionada(null);
                      setPdfCarregado(false);
                    } else if (file) {
                      alert('Por favor, selecione um arquivo PDF.');
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  disabled={uploading}
                  required
                />
                {formData.arquivo && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-slate-500">
                      PDF selecionado: {formData.arquivo.name}
                    </p>
                    {!pdfCarregado && !imagemSelecionada && (
                      <button
                        type="button"
                        onClick={() => setPdfCarregado(true)}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Carregar PDF
                      </button>
                    )}
                    {pdfCarregado && !imagemSelecionada && pdfUrl && (
                      <button
                        type="button"
                        onClick={() => setMostrarSeletorArea(true)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Crop className="w-4 h-4" />
                        Selecionar Área da Planta
                      </button>
                    )}
                    {imagemSelecionada && (
                      <div className="mt-2 p-2 bg-slate-800 rounded border border-green-600">
                        <p className="text-xs text-green-400 mb-2">✓ Área selecionada com sucesso</p>
                        <img
                          src={imagemSelecionada}
                          alt="Preview da área selecionada"
                          className="max-w-full h-32 object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagemSelecionada(null);
                            setMostrarSeletorArea(true);
                          }}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                        >
                          Selecionar outra área
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setFormData({ nome: '', tipo: 'IMPLANTACAO', arquivo: null });
                    setImagemSelecionada(null);
                    setPdfCarregado(false);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl(null);
                    }
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.arquivo || !formData.nome.trim() || !imagemSelecionada}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Fazer Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seletor de Área do PDF — usa File (ArrayBuffer) quando possível */}
      {mostrarSeletorArea && (pdfUrl || formData.arquivo) && (
        <PDFAreaSelector
          pdfUrl={pdfUrl}
          pdfFile={formData.arquivo}
          onSelect={(imageDataUrl) => {
            setImagemSelecionada(imageDataUrl);
            setMostrarSeletorArea(false);
          }}
          onCancel={() => setMostrarSeletorArea(false)}
        />
      )}

      {/* Modal de Editar Planta */}
      {modalEditarAberto && plantaSelecionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Editar Planta</h2>
              <button
                onClick={() => {
                  setModalEditarAberto(false);
                  setPlantaSelecionada(null);
                }}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
                disabled={editando}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!plantaSelecionada || !formDataEditar.nome.trim()) {
                  alert('Por favor, preencha todos os campos.');
                  return;
                }

                setEditando(true);
                try {
                  const resultado = await atualizarPlantaBaixa({
                    plantaId: plantaSelecionada.id,
                    nome: formDataEditar.nome,
                    tipo: formDataEditar.tipo,
                  });

                  if (resultado.success) {
                    setModalEditarAberto(false);
                    setPlantaSelecionada(null);
                    router.refresh();
                  } else {
                    alert(`Erro ao editar: ${resultado.message}`);
                  }
                } catch (error: any) {
                  console.error('Erro ao editar:', error);
                  alert(`Erro ao editar: ${error.message || 'Erro desconhecido'}`);
                } finally {
                  setEditando(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Nome da Planta <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formDataEditar.nome}
                  onChange={(e) => setFormDataEditar({ ...formDataEditar, nome: e.target.value })}
                  placeholder="Ex: Implantação Geral, Térreo, 1º Andar..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  disabled={editando}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Tipo de Planta <span className="text-red-400">*</span>
                </label>
                <select
                  value={formDataEditar.tipo}
                  onChange={(e) => setFormDataEditar({ ...formDataEditar, tipo: e.target.value as 'IMPLANTACAO' | 'PAVIMENTO' })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={editando}
                  required
                >
                  <option value="IMPLANTACAO">Implantação (Planta Geral)</option>
                  <option value="PAVIMENTO">Pavimento (Planta Interna)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalEditarAberto(false);
                    setPlantaSelecionada(null);
                  }}
                  disabled={editando}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editando || !formDataEditar.nome.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Exclusão */}
      {modalExcluirAberto && plantaSelecionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
              <button
                onClick={() => {
                  setModalExcluirAberto(false);
                  setPlantaSelecionada(null);
                }}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
                disabled={excluindo}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Tem certeza que deseja excluir a planta <strong className="text-white">{plantaSelecionada.titulo}</strong>?
              </p>
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">
                  ⚠️ Esta ação não pode ser desfeita. Todos os pontos, setores e fotos 360 associados a esta planta serão excluídos permanentemente.
                </p>
              </div>
              {plantaSelecionada.totalPontos > 0 && (
                <div className="mt-3 text-sm text-slate-400">
                  <p>• {plantaSelecionada.totalPontos} ponto(s) de monitoramento</p>
                  <p>• {plantaSelecionada.totalFotos} foto(s) 360º</p>
                  {plantaSelecionada.totalSetores && plantaSelecionada.totalSetores > 0 && (
                    <p>• {plantaSelecionada.totalSetores} setor(es)</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalExcluirAberto(false);
                  setPlantaSelecionada(null);
                }}
                disabled={excluindo}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!plantaSelecionada) return;

                  setExcluindo(true);
                  try {
                    const resultado = await excluirPlantaBaixa(plantaSelecionada.id);

                    if (resultado.success) {
                      setModalExcluirAberto(false);
                      setPlantaSelecionada(null);
                      router.refresh();
                    } else {
                      alert(`Erro ao excluir: ${resultado.message}`);
                    }
                  } catch (error: any) {
                    console.error('Erro ao excluir:', error);
                    alert(`Erro ao excluir: ${error.message || 'Erro desconhecido'}`);
                  } finally {
                    setExcluindo(false);
                  }
                }}
                disabled={excluindo}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {excluindo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar Exclusão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
