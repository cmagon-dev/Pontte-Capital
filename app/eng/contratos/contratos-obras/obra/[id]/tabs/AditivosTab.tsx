'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, Plus, Calendar, DollarSign, Clock, FileText, Trash2, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { excluirAditivo } from '@/app/actions/aditivos';

interface Documento {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataUpload: Date | string;
}

interface Aditivo {
  id: string;
  numero: number;
  tipo: string;
  dataAssinatura: Date | string | null;
  justificativa: string | null;
  valorAditivo: number | null;
  valorGlosa: number | null;
  tipoUnidadePrazo: string | null;
  prazoVigencia: number | null;
  prazoExecucao: number | null;
  nomeArquivo: string | null;
  caminhoArquivo: string | null;
  status: string;
  createdAt: Date | string;
  documentos?: Documento[];
}

interface AditivosTabProps {
  obraId: string;
  aditivos: Aditivo[];
}

export default function AditivosTab({ obraId, aditivos: initialAditivos }: AditivosTabProps) {
  const router = useRouter();
  const [aditivos, setAditivos] = useState(initialAditivos);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleExcluir = async (id: string, numero: number) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o Aditivo nº ${numero}? Esta ação não pode ser desfeita.`
    );

    if (!confirmacao) return;

    setIsDeleting(id);
    const result = await excluirAditivo(id, obraId);

    if (result.success) {
      setAditivos(aditivos.filter(a => a.id !== id));
      alert(result.message);
    } else {
      alert(result.message);
    }
    setIsDeleting(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return 'bg-green-900 text-green-400';
      case 'EM_ELABORACAO':
        return 'bg-amber-900 text-amber-400';
      case 'REJEITADO':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return 'Aprovado';
      case 'EM_ELABORACAO':
        return 'Em Elaboração';
      case 'REJEITADO':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  // Calcular totais
  const totaisValor = aditivos
    .filter(a => a.tipo === 'VALOR')
    .reduce((acc, a) => {
      const valor = Number(a.valorAditivo || 0);
      const glosa = Number(a.valorGlosa || 0);
      return {
        aditivos: acc.aditivos + valor,
        glosas: acc.glosas + glosa,
      };
    }, { aditivos: 0, glosas: 0 });

  const valorLiquido = totaisValor.aditivos - totaisValor.glosas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Aditivos e Supressões</h3>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${obraId}/aditivos/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Aditivo
        </Link>
      </div>

      {/* Resumo dos Aditivos de Valor */}
      {aditivos.some(a => a.tipo === 'VALOR') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-950 border border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-400 mb-1">Total Aditivos</p>
            <p className="text-2xl font-bold text-green-400 font-mono">
              {formatCurrency(totaisValor.aditivos)}
            </p>
          </div>
          <div className="bg-red-950 border border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-400 mb-1">Total Glosas</p>
            <p className="text-2xl font-bold text-red-400 font-mono">
              {formatCurrency(totaisValor.glosas)}
            </p>
          </div>
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-400 mb-1">Valor Líquido</p>
            <p className="text-2xl font-bold text-blue-400 font-mono">
              {formatCurrency(valorLiquido)}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Aditivos */}
      {aditivos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum aditivo ou supressão registrado</p>
          <p className="text-sm text-slate-500 mt-1">
            Use o botão acima para adicionar um novo aditivo contratual
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {aditivos.map((aditivo) => (
            <div
              key={aditivo.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">
                      Aditivo nº {aditivo.numero}
                    </h4>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      aditivo.tipo === 'VALOR' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400'
                    }`}>
                      {aditivo.tipo === 'VALOR' ? 'Aditivo de Valor' : 'Aditivo de Prazo'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(aditivo.status)}`}>
                      {getStatusLabel(aditivo.status)}
                    </span>
                  </div>
                  {aditivo.dataAssinatura && (
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Assinado em: {formatDate(aditivo.dataAssinatura)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/eng/contratos/contratos-obras/obra/${obraId}/aditivos/${aditivo.id}/editar`}
                    className="p-2 text-blue-400 hover:bg-slate-800 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleExcluir(aditivo.id, aditivo.numero)}
                    disabled={isDeleting === aditivo.id}
                    className="p-2 text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detalhes do Aditivo de Valor */}
              {aditivo.tipo === 'VALOR' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor do Aditivo</p>
                    <p className="text-lg font-bold text-green-400 font-mono">
                      {aditivo.valorAditivo ? formatCurrency(Number(aditivo.valorAditivo)) : '-'}
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Valor de Glosas</p>
                    <p className="text-lg font-bold text-red-400 font-mono">
                      {aditivo.valorGlosa ? formatCurrency(Number(aditivo.valorGlosa)) : '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* Detalhes do Aditivo de Prazo */}
              {aditivo.tipo === 'PRAZO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {aditivo.prazoVigencia && (
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">Prazo de Vigência</p>
                      <p className="text-lg font-bold text-blue-400">
                        +{aditivo.prazoVigencia} {aditivo.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}
                      </p>
                    </div>
                  )}
                  {aditivo.prazoExecucao && (
                    <div className="bg-slate-800 rounded p-3">
                      <p className="text-xs text-slate-400 mb-1">Prazo de Execução</p>
                      <p className="text-lg font-bold text-amber-400">
                        +{aditivo.prazoExecucao} {aditivo.tipoUnidadePrazo === 'DIAS' ? 'dias' : 'meses'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Justificativa */}
              {aditivo.justificativa && (
                <div className="bg-slate-800 rounded p-3 mb-4">
                  <p className="text-xs text-slate-400 mb-1">Justificativa</p>
                  <p className="text-sm text-white">{aditivo.justificativa}</p>
                </div>
              )}

              {/* Documentos Anexados */}
              {aditivo.documentos && aditivo.documentos.length > 0 && (
                <div className="bg-slate-800 rounded p-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Documentos Anexados ({aditivo.documentos.length})
                  </p>
                  <div className="space-y-2">
                    {aditivo.documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <a
                          href={doc.caminhoArquivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-2 flex-1"
                        >
                          {doc.nomeArquivo}
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Arquivo Legado (compatibilidade com aditivos antigos) */}
              {!aditivo.documentos?.length && aditivo.nomeArquivo && aditivo.caminhoArquivo && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <a
                    href={aditivo.caminhoArquivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                  >
                    {aditivo.nomeArquivo}
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nota Informativa */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Sobre Aditivos:</strong> Aditivos contratuais são modificações formais no contrato original,
          podendo incluir alterações de prazo, valor, escopo ou condições. Supressões são reduções no escopo contratado.
        </p>
      </div>
    </div>
  );
}
