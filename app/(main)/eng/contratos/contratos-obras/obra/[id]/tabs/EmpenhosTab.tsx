'use client';

import { useState } from 'react';
import { Receipt, Plus, Edit, Trash2, FileText, Download, AlertCircle, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { excluirEmpenho, cancelarEmpenho } from '@/app/actions/empenhos';
import { useRouter } from 'next/navigation';

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
  createdAt: Date;
  documentos?: Documento[];
}

interface EmpenhosTabProps {
  obraId: string;
  initialEmpenhos: Empenho[];
}

export default function EmpenhosTab({ obraId, initialEmpenhos }: EmpenhosTabProps) {
  const router = useRouter();
  const [empenhos, setEmpenhos] = useState<Empenho[]>(initialEmpenhos);

  // Calcular resumo
  const resumo = empenhos.reduce(
    (acc, empenho) => {
      if (empenho.status === 'CANCELADO') return acc;

      const valor = Number(empenho.valor);
      const saldo = Number(empenho.saldoAtual);

      if (empenho.tipo === 'ORIGINAL') {
        acc.totalOriginal += valor;
      } else if (empenho.tipo === 'REFORCO') {
        acc.totalReforco += valor;
      } else if (empenho.tipo === 'ANULACAO') {
        acc.totalAnulacao += valor;
      }

      acc.saldoDisponivel += saldo;
      return acc;
    },
    {
      totalOriginal: 0,
      totalReforco: 0,
      totalAnulacao: 0,
      saldoDisponivel: 0,
    }
  );

  const totalEmpenhado = resumo.totalOriginal + resumo.totalReforco - resumo.totalAnulacao;

  const handleExcluir = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este empenho?')) return;

    const result = await excluirEmpenho(id);
    if (result.success) {
      setEmpenhos(empenhos.filter((e) => e.id !== id));
      alert(result.message);
      router.refresh();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };

  const handleCancelar = async (id: string) => {
    const motivo = prompt('Digite o motivo do cancelamento:');
    if (!motivo) return;

    const result = await cancelarEmpenho(id, motivo);
    if (result.success) {
      alert(result.message);
      router.refresh();
    } else {
      alert(`Erro: ${result.message}`);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('pt-BR').format(new Date(date));

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      ATIVO: { label: 'Ativo', className: 'bg-green-900 text-green-300', icon: CheckCircle2 },
      ESGOTADO: { label: 'Esgotado', className: 'bg-red-900 text-red-300', icon: AlertCircle },
      CANCELADO: { label: 'Cancelado', className: 'bg-gray-900 text-gray-400', icon: XCircle },
    };

    const badge = badges[status] || badges.ATIVO;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${badge.className}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ORIGINAL: { label: 'Original', className: 'bg-blue-900 text-blue-300' },
      REFORCO: { label: 'Reforço', className: 'bg-purple-900 text-purple-300' },
      ANULACAO: { label: 'Anulação', className: 'bg-red-900 text-red-300' },
    };

    const badge = badges[tipo] || badges.ORIGINAL;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Empenhos (Reservas Orçamentárias)</h3>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${obraId}/empenhos/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Empenho
        </Link>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-400 mb-1">Empenho Original</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(resumo.totalOriginal)}</p>
        </div>
        <div className="bg-purple-950 border border-purple-800 rounded-lg p-4">
          <p className="text-sm text-purple-400 mb-1">Reforços</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(resumo.totalReforco)}</p>
        </div>
        <div className="bg-red-950 border border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-400 mb-1">Anulações</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(resumo.totalAnulacao)}</p>
        </div>
        <div className="bg-green-950 border border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-400 mb-1">Saldo Disponível</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(resumo.saldoDisponivel)}</p>
        </div>
      </div>

      {/* Lista de Empenhos */}
      {empenhos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhum empenho registrado</p>
          <p className="text-sm text-slate-500 mt-1">
            Clique em &quot;Novo Empenho&quot; para adicionar o primeiro empenho
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {empenhos.map((empenho) => (
            <div key={empenho.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-white">
                      Empenho #{empenho.numero} - {empenho.numeroNE}
                    </h4>
                    {getTipoBadge(empenho.tipo)}
                    {getStatusBadge(empenho.status)}
                  </div>
                  <p className="text-sm text-slate-400">
                    Emitido em: {formatDate(empenho.dataEmissao)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/eng/contratos/contratos-obras/obra/${obraId}/empenhos/${empenho.id}/editar`}
                    className="p-2 bg-slate-800 text-blue-400 rounded hover:bg-slate-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  {empenho.status === 'ATIVO' && (
                    <button
                      onClick={() => handleCancelar(empenho.id)}
                      className="p-2 bg-slate-800 text-yellow-400 rounded hover:bg-slate-700 transition-colors"
                      title="Cancelar Empenho"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleExcluir(empenho.id)}
                    className="p-2 bg-slate-800 text-red-400 rounded hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-500">Valor Empenhado</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(empenho.valor)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Saldo Atual</p>
                  <p className={`text-lg font-semibold ${empenho.saldoAtual <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(empenho.saldoAtual)}
                  </p>
                </div>
                {empenho.alertaMinimo && (
                  <div>
                    <p className="text-sm text-slate-500">Alerta Mínimo</p>
                    <p className="text-lg font-semibold text-yellow-400">{formatCurrency(empenho.alertaMinimo)}</p>
                  </div>
                )}
              </div>

              {empenho.observacoes && (
                <div className="mb-4">
                  <p className="text-sm text-slate-500 mb-1">Observações:</p>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{empenho.observacoes}</p>
                </div>
              )}

              {/* Documentos Anexados */}
              {empenho.documentos && empenho.documentos.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Documentos Anexados ({empenho.documentos.length}):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {empenho.documentos.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.caminhoArquivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white truncate flex-1">{doc.nomeArquivo}</span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </a>
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
          <strong>Sobre Empenhos:</strong> Empenho é o ato pelo qual o órgão público reserva recursos orçamentários
          para o pagamento de uma despesa contratada. É representado por uma Nota de Empenho (NE). Você pode registrar
          empenhos ORIGINAIS, REFORÇOS (adicionais) e ANULAÇÕES (reduções de valores empenhados).
        </p>
      </div>
    </div>
  );
}
