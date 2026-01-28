'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Home, TrendingUp, Plus, Edit2, MapPin, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { excluirDocumento } from '@/app/actions/documentos';
import { useRouter } from 'next/navigation';

interface Documento {
  id: string;
  categoria: string;
  tipo: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataUpload: Date;
  dataValidade: Date | null;
  observacoes: string | null;
}

interface Bem {
  id: string;
  tipo: string;
  descricao: string;
  valor: number | string;
  rendaMensal: number | string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  matricula?: string | null;
  cartorio?: string | null;
  status: string;
  observacoes?: string | null;
  documentos?: Array<{
    id: string;
    tipo: string;
    nomeArquivo: string;
    caminhoArquivo: string;
    dataUpload: Date;
  }>;
}

interface DocumentosContentProps {
  params: { id: string };
  documentos: Documento[];
  documentosVencidos: number;
  bens: Bem[];
  totalPatrimonio: number;
}

function DocumentosContentInner({ params, documentos, documentosVencidos, bens: bensFromDb, totalPatrimonio: patrimonioTotal }: DocumentosContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'documentos' | 'bens'>('documentos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'bens') {
      setActiveTab('bens');
    }
  }, [searchParams]);

  const formatDate = (date: Date | null | string) => {
    if (!date) return '-';
    if (typeof date === 'string') return date;
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (dataValidade: Date | null) => {
    if (!dataValidade) return 'bg-amber-900 text-amber-400';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    validade.setHours(0, 0, 0, 0);
    
    if (validade < hoje) return 'bg-red-900 text-red-400';
    return 'bg-green-900 text-green-400';
  };

  const getStatus = (dataValidade: Date | null) => {
    if (!dataValidade) return 'Sem validade';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    validade.setHours(0, 0, 0, 0);
    
    if (validade < hoje) return 'Vencido';
    return 'Válido';
  };

  const handleDeleteDocumento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await excluirDocumento(id, params.id, 'fiador');
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message || 'Erro ao excluir documento');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir documento');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fiadores/${params.id}/cadastro`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Comprovação de Patrimônio</h1>
            <p className="text-slate-400">Repositório de Garantias, Documentos de IR e Bens em Garantia</p>
          </div>
        </div>
      </div>

      {/* Alertas de Documentos Vencidos */}
      {documentosVencidos > 0 && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Documentos Vencidos</h3>
          </div>
          <p className="text-sm text-slate-300">
            {documentosVencidos} documento(s) vencido(s) bloqueiam novas operações. Atualize imediatamente.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('documentos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'documentos'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos Financeiros
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bens')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'bens'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Bens em Garantia
            </div>
          </button>
        </div>
      </div>

      {/* Tab: Documentos Financeiros */}
      {activeTab === 'documentos' && (
        <>
          <div className="mb-6 flex justify-end">
            <Link
              href={`/cadastros/fiadores/${params.id}/documentos/upload`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Novo Upload
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-engineering w-full">
                <thead>
                  <tr>
                    <th>Tipo de Documento</th>
                    <th>Arquivo</th>
                    <th>Data de Upload</th>
                    <th>Data de Validade</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Nenhum documento cadastrado ainda.
                      </td>
                    </tr>
                  ) : (
                    documentos.map((doc) => {
                      const status = getStatus(doc.dataValidade);
                      const isVencido = status === 'Vencido';
                      return (
                        <tr
                          key={doc.id}
                          className={`hover:bg-slate-800 ${isVencido ? 'bg-red-950/20' : ''}`}
                        >
                          <td className="font-medium text-white">{doc.tipo}</td>
                          <td className="flex items-center gap-2 text-slate-300">
                            <FileText className="w-4 h-4" />
                            {doc.nomeArquivo}
                          </td>
                          <td className="text-slate-300">
                            <div className="flex items-center gap-2">
                              {formatDate(doc.dataUpload)}
                            </div>
                          </td>
                          <td className="text-slate-300">
                            {formatDate(doc.dataValidade)}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(doc.dataValidade)}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <a
                                href={doc.caminhoArquivo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                Visualizar
                              </a>
                              <button
                                onClick={() => handleDeleteDocumento(doc.id)}
                                disabled={deletingId === doc.id}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingId === doc.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Excluindo...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4" />
                                    Excluir
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Bens em Garantia */}
      {activeTab === 'bens' && (
        <>
          {/* Resumo Patrimonial */}
          <div className="mb-6 bg-slate-900 border border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Patrimônio Total em Garantia
            </h2>
            <p className="text-3xl font-bold text-green-400 font-mono mb-2">{formatCurrency(patrimonioTotal)}</p>
            <p className="text-sm text-slate-400">
              Valor total de patrimônio que este fiador está garantindo na plataforma
            </p>
          </div>

          {/* Botão Adicionar Bem */}
          <div className="mb-6 flex justify-end">
            <Link
              href={`/cadastros/fiadores/${params.id}/documentos/bens/novo`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Bem
            </Link>
          </div>

          {/* Lista de Bens */}
          <div className="space-y-6">
            {bensFromDb.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                <Home className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum bem em garantia cadastrado ainda.</p>
              </div>
            ) : (
              bensFromDb.map((bem) => (
              <div key={bem.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Home className="w-5 h-5 text-blue-400" />
                      <h3 className="text-xl font-bold text-white">{bem.descricao}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        bem.status === 'Livre' 
                          ? 'bg-green-900 text-green-400' 
                          : 'bg-amber-900 text-amber-400'
                      }`}>
                        {bem.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Tipo</p>
                        <p className="text-white font-medium">{bem.tipo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Valor Avaliado</p>
                        <p className="text-green-400 font-bold font-mono">{formatCurrency(typeof bem.valor === 'string' ? parseFloat(bem.valor) : Number(bem.valor))}</p>
                      </div>
                      {bem.rendaMensal && (
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Renda Mensal</p>
                          <p className="text-blue-400 font-bold font-mono">{formatCurrency(Number(bem.rendaMensal))}</p>
                        </div>
                      )}
                      {bem.tipo === 'Imóvel' && bem.endereco && (
                        <div className="md:col-span-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-slate-400 mb-1">Endereço</p>
                              <p className="text-white">
                                {bem.endereco}
                                {bem.cidade && bem.estado && ` - ${bem.cidade}/${bem.estado}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {bem.tipo === 'Imóvel' && bem.matricula && (
                        <>
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Matrícula</p>
                            <p className="text-white font-mono text-sm">{bem.matricula}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Cartório</p>
                            <p className="text-white text-sm">{bem.cartorio}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/cadastros/fiadores/${params.id}/documentos/bens/${bem.id}/editar`}
                      className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
                      title="Editar Bem"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                {/* Documentos do Bem */}
                {bem.documentos && bem.documentos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-400">Documentos Comprobatórios</h4>
                      <Link
                        href={`/cadastros/fiadores/${params.id}/documentos/bens/${bem.id}/upload`}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        + Adicionar Documento
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {bem.documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-sm text-white">{doc.tipo}</p>
                              <p className="text-xs text-slate-400">{doc.nomeArquivo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">{formatDate(doc.dataUpload)}</span>
                            <a
                              href={doc.caminhoArquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              Visualizar
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DocumentosContent(props: DocumentosContentProps) {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    }>
      <DocumentosContentInner {...props} />
    </Suspense>
  );
}
