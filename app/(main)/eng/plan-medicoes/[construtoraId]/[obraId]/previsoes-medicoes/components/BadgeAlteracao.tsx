'use client';

import React, { useState } from 'react';

type TipoBadge = 
  | 'ajustado-glosa' 
  | 'ajustado-aditivo' 
  | 'adicionado' 
  | 'retirado' 
  | 'concluido-retirado';

interface BadgeAlteracaoProps {
  tipo: TipoBadge;
  quantidadeAnterior?: number | null;
  quantidadeNova?: number | null;
  precoAnterior?: number | null;
  precoNovo?: number | null;
  numeroAditivo?: number;
}

export default function BadgeAlteracao({
  tipo,
  quantidadeAnterior,
  quantidadeNova,
  precoAnterior,
  precoNovo,
  numeroAditivo,
}: BadgeAlteracaoProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const configs = {
    'ajustado-glosa': {
      icon: '🟠',
      text: 'Ajustado - Glosa',
      color: 'text-orange-400 border-orange-600 bg-orange-900/20',
      description: 'Quantidade reduzida em relação à versão anterior',
    },
    'ajustado-aditivo': {
      icon: '🟢',
      text: 'Ajustado - Aditivo',
      color: 'text-green-400 border-green-600 bg-green-900/20',
      description: 'Quantidade aumentada em relação à versão anterior',
    },
    'adicionado': {
      icon: '🔵',
      text: 'Adicionado - Aditivo',
      color: 'text-blue-400 border-blue-600 bg-blue-900/20',
      description: 'Item novo adicionado ao contrato',
    },
    'retirado': {
      icon: '🔴',
      text: 'Retirado - Glosa',
      color: 'text-red-400 border-red-600 bg-red-900/20',
      description: 'Item removido do contrato',
    },
    'concluido-retirado': {
      icon: '🔴',
      text: 'Concluído + Retirado',
      color: 'text-red-400 border-red-600 bg-red-900/20',
      description: 'Item 100% medido e posteriormente removido',
    },
  };
  
  const config = configs[tipo];
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const formatQuantity = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };
  
  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border rounded cursor-help ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </span>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3">
          <div className="text-xs space-y-2">
            <div>
              <div className="font-semibold text-white mb-1">{config.text}</div>
              <div className="text-slate-400">{config.description}</div>
            </div>
            
            {quantidadeAnterior !== undefined && quantidadeAnterior !== null && 
             quantidadeNova !== undefined && quantidadeNova !== null && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-slate-400">
                  <span className="font-medium">Quantidade:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-400">{formatQuantity(quantidadeAnterior)}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-green-400">{formatQuantity(quantidadeNova)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {precoAnterior !== undefined && precoAnterior !== null && 
             precoNovo !== undefined && precoNovo !== null && (
              <div className={quantidadeAnterior !== undefined ? '' : 'pt-2 border-t border-slate-700'}>
                <div className="text-slate-400">
                  <span className="font-medium">Preço Unit.:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-400">{formatCurrency(precoAnterior)}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-green-400">{formatCurrency(precoNovo)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {numeroAditivo && (
              <div className="pt-2 border-t border-slate-700">
                <div className="text-slate-400">
                  <span className="font-medium">Origem:</span> Aditivo {String(numeroAditivo).padStart(2, '0')}
                </div>
              </div>
            )}
          </div>
          
          {/* Seta do tooltip */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
