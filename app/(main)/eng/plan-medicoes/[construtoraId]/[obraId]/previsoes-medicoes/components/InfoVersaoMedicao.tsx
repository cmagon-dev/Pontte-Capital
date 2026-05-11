'use client';

import React from 'react';
import { Info, GitBranch, Calendar } from 'lucide-react';

interface InfoVersaoMedicaoProps {
  versaoAtual: {
    numero: number;
    nome: string;
    dataVersao?: Date;
  };
  versaoOriginal?: {
    numero: number;
    nome: string;
    dataVersao?: Date;
  } | null;
  foiMigrada: boolean;
}

export default function InfoVersaoMedicao({
  versaoAtual,
  versaoOriginal,
  foiMigrada,
}: InfoVersaoMedicaoProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
      foiMigrada 
        ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
        : 'bg-blue-900/20 border-blue-700 text-blue-300'
    }`}>
      <GitBranch className="w-3 h-3" />
      
      <div className="flex items-center gap-1">
        {foiMigrada && versaoOriginal ? (
          <>
            <span className="font-semibold">v{versaoOriginal.numero}</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold">v{versaoAtual.numero}</span>
            <div className="relative group ml-1">
              <Info className="w-3 h-3 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50">
                <div className="text-xs space-y-2">
                  <div>
                    <div className="font-semibold text-yellow-400 mb-1">Medição Migrada</div>
                    <div className="text-slate-300">
                      Esta medição foi criada na <strong>{versaoOriginal.nome}</strong> e migrada para <strong>{versaoAtual.nome}</strong>.
                    </div>
                  </div>
                  {versaoOriginal.dataVersao && (
                    <div className="pt-2 border-t border-slate-700 text-slate-400">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Criada em: {formatDate(versaoOriginal.dataVersao)}
                    </div>
                  )}
                </div>
                <div className="absolute top-full left-4 -mt-1 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45"></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="font-semibold">{versaoAtual.nome} (v{versaoAtual.numero})</span>
            {versaoAtual.dataVersao && (
              <span className="text-slate-400 ml-1">
                • {formatDate(versaoAtual.dataVersao)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
