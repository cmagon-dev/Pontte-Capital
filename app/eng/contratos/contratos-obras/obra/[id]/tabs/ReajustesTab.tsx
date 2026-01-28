'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Plus, Calendar, Percent, DollarSign, FileText, Trash2, Edit, Download } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { excluirReajuste } from '@/app/actions/reajustes';

interface Documento {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  dataUpload: Date | string;
}

interface Reajuste {
  id: string;
  numero: number;
  dataBase: string;
  indice: string;
  percentual: number;
  valorReajuste: number;
  dataAplicacao: Date | string;
  observacoes: string | null;
  status: string;
  createdAt: Date | string;
  documentos?: Documento[];
}

interface ReajustesTabProps {
  obraId: string;
  reajustes: Reajuste[];
}

export default function ReajustesTab({ obraId, reajustes: initialReajustes }: ReajustesTabProps) {
  const router = useRouter();
  const [reajustes, setReajustes] = useState(initialReajustes);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleExcluir = async (id: string, numero: number) => {
    if (!confirm(`Tem certeza que deseja excluir o Reajuste nº ${numero}?`)) {
      return;
    }

    setIsDeleting(id);
    const result = await excluirReajuste(id, obraId);

    if (result.success) {
      setReajustes(reajustes.filter(r => r.id !== id));
      alert(result.message);
    } else {
      alert(result.message);
    }
    
    setIsDeleting(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APLICADO':
        return 'text-green-400 bg-green-950 border-green-800';
      case 'PENDENTE':
        return 'text-yellow-400 bg-yellow-950 border-yellow-800';
      case 'CANCELADO':
        return 'text-red-400 bg-red-950 border-red-800';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APLICADO':
        return 'Aplicado';
      case 'PENDENTE':
        return 'Pendente';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Calcular totais
  const totais = reajustes
    .filter(r => r.status === 'APLICADO')
    .reduce((acc, reajuste) => {
      return acc + Number(reajuste.valorReajuste);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Reajustes de Preço</h3>
          {reajustes.length > 0 && (
            <p className="text-sm text-slate-400 mt-1">
              Total de {reajustes.length} reajuste(s) registrado(s)
            </p>
          )}
        </div>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${obraId}/reajustes/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Reajuste
        </Link>
      </div>

      {/* Resumo dos Reajustes Aplicados */}
      {reajustes.filter(r => r.status === 'APLICADO').length > 0 && (
        <div className="bg-green-950 border border-green-800 rounded-lg p-6">
          <h4 className="text-lg font-bold text-green-300 mb-4">Resumo dos Reajustes Aplicados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900 bg-opacity-30 rounded p-4">
              <p className="text-sm text-green-400 mb-1">Quantidade de Reajustes</p>
              <p className="text-2xl font-bold text-white">
                {reajustes.filter(r => r.status === 'APLICADO').length}
              </p>
            </div>
            <div className="bg-green-900 bg-opacity-30 rounded p-4">
              <p className="text-sm text-green-400 mb-1">Valor Total Aplicado</p>
              <p className="text-2xl font-bold text-green-300">
                {formatCurrency(totais)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Reajustes */}
      {reajustes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum reajuste registrado</p>
          <p className="text-sm text-slate-500 mt-1">
            Reajustes são aplicados conforme índices econômicos (INCC, IPCA, etc.)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reajustes.map((reajuste) => (
            <div
              key={reajuste.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-6"
            >
              {/* Header do Reajuste */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-950 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      Reajuste nº {reajuste.numero}
                    </h4>
                    <p className="text-sm text-slate-400">
                      Índice: {reajuste.indice} | Base: {reajuste.dataBase}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(reajuste.status)}`}>
                    {getStatusLabel(reajuste.status)}
                  </span>
                  <Link
                    href={`/eng/contratos/contratos-obras/obra/${obraId}/reajustes/${reajuste.id}/editar`}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Editar reajuste"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </Link>
                  <button
                    onClick={() => handleExcluir(reajuste.id, reajuste.numero)}
                    disabled={isDeleting === reajuste.id}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir reajuste"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Detalhes do Reajuste */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-400">Percentual</p>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {Number(reajuste.percentual).toFixed(2)}%
                  </p>
                </div>

                <div className="bg-slate-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-400">Valor do Reajuste</p>
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(Number(reajuste.valorReajuste))}
                  </p>
                </div>

                <div className="bg-slate-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-400">Data de Aplicação</p>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {formatDate(reajuste.dataAplicacao)}
                  </p>
                </div>

                <div className="bg-slate-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-xs text-slate-400">Registrado em</p>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {formatDate(reajuste.createdAt)}
                  </p>
                </div>
              </div>

              {/* Observações */}
              {reajuste.observacoes && (
                <div className="bg-slate-800 rounded p-3 mb-4">
                  <p className="text-xs text-slate-400 mb-1">Observações</p>
                  <p className="text-sm text-white">{reajuste.observacoes}</p>
                </div>
              )}

              {/* Documentos Anexados */}
              {reajuste.documentos && reajuste.documentos.length > 0 && (
                <div className="bg-slate-800 rounded p-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Documentos Anexados ({reajuste.documentos.length})
                  </p>
                  <div className="space-y-2">
                    {reajuste.documentos.map((doc) => (
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
            </div>
          ))}
        </div>
      )}

      {/* Nota Informativa */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Sobre Reajustes:</strong> Reajustes de preço são ajustes automáticos ou contratuais no valor
          do contrato baseados em índices econômicos oficiais (INCC, IPCA, IGPM, INPC), visando manter o 
          equilíbrio econômico-financeiro da obra.
        </p>
      </div>
    </div>
  );
}
