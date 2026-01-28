'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, Receipt, Calendar, Download, Building2, FileText, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

export default function DetalhesEmpenhoPage({ params }: { params: { id: string; empenhoId: string } }) {
  const contratoId = params.id;
  const empenhoId = params.empenhoId;

  // Em produção, buscar dados do empenho pelo ID
  const empenho = {
    id: empenhoId,
    numeroNE: 'NE-2024-001',
    dataEmissao: '2024-01-10',
    valor: 5000000,
    tipo: 'Original',
    saldoDisponivel: 4500000,
    status: 'Ativo',
    alertaMinimo: 50000,
    arquivo: 'nota_empenho_NE_2024_001.pdf',
    contratoRelacionado: {
      id: contratoId,
      numero: '001/2024',
      objeto: 'Reforma e Ampliação da Escola Municipal Santa Rita',
    },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-900 text-green-400';
      case 'Expirado':
        return 'bg-red-900 text-red-400';
      case 'Cancelado':
        return 'bg-slate-700 text-slate-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const percentualUtilizado = ((empenho.valor - empenho.saldoDisponivel) / empenho.valor) * 100;
  const alertaMinimo = empenho.alertaMinimo || 50000;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${contratoId}?tab=empenhos`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{empenho.numeroNE}</h1>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(empenho.status)}`}>
                {empenho.status}
              </span>
            </div>
            <p className="text-slate-400">Detalhes da Nota de Empenho</p>
          </div>
        </div>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${contratoId}/empenhos/${empenhoId}/editar`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          Editar Empenho
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saldo e Utilização */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Saldo e Utilização</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Valor Total</label>
                  <p className="text-white font-bold font-mono text-2xl">{formatCurrency(empenho.valor)}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Saldo Disponível</label>
                  <p
                    className={`font-bold font-mono text-2xl ${
                      empenho.saldoDisponivel < alertaMinimo ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {formatCurrency(empenho.saldoDisponivel)}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Utilização</span>
                  <span className="text-sm text-white font-medium">{formatPercent(percentualUtilizado)}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      percentualUtilizado >= 90
                        ? 'bg-red-500'
                        : percentualUtilizado >= 70
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${percentualUtilizado}%` }}
                  />
                </div>
              </div>
              {empenho.saldoDisponivel < alertaMinimo && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-950 border border-red-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-red-400 font-semibold">Alerta Crítico</p>
                    <p className="text-xs text-slate-300">
                      Saldo abaixo do mínimo configurado. Solicitar Reforço de Empenho.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Empenho */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Informações da Nota de Empenho
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Número NE</label>
                <p className="text-white font-mono text-lg">{empenho.numeroNE}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data de Emissão</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-white">{formatDate(empenho.dataEmissao)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <span className="px-3 py-1 bg-blue-900 text-blue-400 rounded text-sm font-medium">
                  {empenho.tipo}
                </span>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(empenho.status)}`}>
                  {empenho.status}
                </span>
              </div>
            </div>
          </div>

          {/* Documento */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Documento</h2>
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-white font-medium">{empenho.arquivo}</p>
                  <p className="text-sm text-slate-400">Nota de Empenho</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contrato Relacionado */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Contrato Relacionado</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Contrato
                </label>
                <Link
                  href={`/eng/contratos/contratos-obras/obra/${contratoId}`}
                  className="text-blue-400 hover:text-blue-300 font-medium block"
                >
                  {empenho.contratoRelacionado.numero}
                </Link>
                <p className="text-sm text-slate-400 mt-1">{empenho.contratoRelacionado.objeto}</p>
              </div>
            </div>
          </div>

          {/* Informações Importantes */}
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-400 mb-2">Importante</h3>
            <p className="text-sm text-blue-300">
              O saldo de empenho é calculado automaticamente: Valor Total - Medições Aprovadas. O sistema
              alerta quando o saldo estiver abaixo do mínimo configurado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
