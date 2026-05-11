'use client';

import Link from 'next/link';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { getObraById } from '@/lib/mock-data';

export default function ConfigurarCategorizacaoPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  // Dados da obra (em produção viria de API/banco)
  const obraData = getObraById(params.obraId);
  const obra = {
    id: params.obraId,
    numeroContrato: obraData?.numeroContrato || '001/2024',
    objeto: obraData?.objeto || 'Obra não encontrada',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}/categorizacao`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Configurar Categorização</h1>
            <p className="text-slate-400">Importação e Configuração da Classificação Gerencial</p>
            <p className="text-slate-500 text-sm mt-1">Obra: {obra.numeroContrato} - {obra.objeto}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-950 border border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Configuração de Categorização</h3>
            <p className="text-sm text-blue-300 mb-2">
              Importe uma planilha com a classificação FASE, ETAPA, SUBETAPA e SERVIÇO SIMPLIFICADO para cada item da
              EAP. Ou configure manualmente na tela principal.
            </p>
            <p className="text-sm text-blue-300">
              <strong>Colunas necessárias:</strong> Item, FASE, ETAPA, SUBETAPA, SERVIÇO SIMPLIFICADO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
