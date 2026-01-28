'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, Eye, Trash2, Plus, Loader2 } from 'lucide-react';
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

interface DocumentosListProps {
  documentos: Documento[];
  construtoraId: string;
}

export default function DocumentosList({ documentos, construtoraId }: DocumentosListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Jurídico':
        return 'text-blue-400';
      case 'Fiscal':
        return 'text-purple-400';
      case 'Financeiro':
        return 'text-green-400';
      default:
        return 'text-slate-400';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await excluirDocumento(id, construtoraId);
      
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

  const categorias = ['Jurídico', 'Fiscal', 'Financeiro'];

  return (
    <div className="space-y-6">
      {categorias.map((categoria) => {
        const docsCategoria = documentos.filter((d) => d.categoria === categoria);
        return (
          <div key={categoria} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${getCategoriaColor(categoria)}`}>{categoria}</h2>
              <Link
                href={`/cadastros/construtoras/${construtoraId}/documentos/upload?categoria=${categoria}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Link>
            </div>
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
                  {docsCategoria.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Nenhum documento cadastrado nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    docsCategoria.map((doc) => {
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
                              <Calendar className="w-4 h-4 text-slate-500" />
                              {formatDate(doc.dataUpload)}
                            </div>
                          </td>
                          <td className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              {formatDate(doc.dataValidade)}
                            </div>
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
                                onClick={() => handleDelete(doc.id)}
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
        );
      })}
    </div>
  );
}
