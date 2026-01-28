'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, Calendar, Download, Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export default function DetalhesAditivoPage({ params }: { params: { id: string; aditivoId: string } }) {
  const contratoId = params.id;
  const aditivoId = params.aditivoId;

  // Em produção, buscar dados do aditivo pelo ID
  const aditivo = {
    id: aditivoId,
    tipo: 'Valor',
    numero: '1º Termo Aditivo',
    justificativa: 'Alteração de projeto estrutural devido a solo rochoso',
    novoPrazo: '2024-12-31',
    impactoFinanceiro: 150000,
    dataPublicacao: '2024-01-15',
    status: 'Vigente',
    arquivo: 'termo_aditivo_001_2024.pdf',
    contratoRelacionado: {
      id: contratoId,
      numero: '001/2024',
      objeto: 'Reforma e Ampliação da Escola Municipal Santa Rita',
    },
  };

  // formatCurrency e formatDate já importados de @/lib/utils/format

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Vigente':
        return 'bg-green-900 text-green-400';
      case 'Pendente':
        return 'bg-amber-900 text-amber-400';
      case 'Cancelado':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/contratos/contratos-obras/obra/${contratoId}?tab=aditivos`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{aditivo.numero}</h1>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(aditivo.status)}`}>
                {aditivo.status}
              </span>
            </div>
            <p className="text-slate-400">Detalhes do Termo Aditivo Contratual</p>
          </div>
        </div>
        <Link
          href={`/eng/contratos/contratos-obras/obra/${contratoId}/aditivos/${aditivoId}/editar`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          Editar Aditivo
        </Link>
      </div>

      <div className="space-y-6">
        {/* Dados do Aditivo */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dados do Termo Aditivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Número</label>
              <p className="text-white font-mono text-blue-400">{aditivo.numero}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <span className="px-2 py-1 bg-amber-900 text-amber-400 rounded text-xs">
                {aditivo.tipo}
              </span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impacto Financeiro</label>
              <p className="text-white font-bold font-mono text-lg text-green-400">{formatCurrency(aditivo.impactoFinanceiro)}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data de Publicação</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="text-white">{formatDate(aditivo.dataPublicacao)}</p>
              </div>
            </div>
            {aditivo.novoPrazo && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Novo Prazo</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-white">{formatDate(aditivo.novoPrazo)}</p>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Justificativa</label>
              <p className="text-white">{aditivo.justificativa}</p>
            </div>
          </div>
        </div>

        {/* Contrato Relacionado */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Contrato Relacionado
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Número do Contrato</label>
              <Link
                href={`/eng/contratos/contratos-obras/obra/${contratoId}`}
                className="text-blue-400 hover:text-blue-300 font-mono"
              >
                {aditivo.contratoRelacionado.numero}
              </Link>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Objeto</label>
              <p className="text-white">{aditivo.contratoRelacionado.objeto}</p>
            </div>
          </div>
        </div>

        {/* Arquivo */}
        {aditivo.arquivo && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Documento do Termo Aditivo</h2>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Termo Aditivo Assinado</p>
                  <p className="text-sm text-slate-400">{aditivo.arquivo}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
