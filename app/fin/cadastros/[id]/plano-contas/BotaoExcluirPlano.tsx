'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { excluirPlanoContas } from '@/app/actions/plano-contas';

export function BotaoExcluirPlano({ 
  planoId, 
  construtoraId, 
  isPadrao 
}: { 
  planoId: string; 
  construtoraId: string; 
  isPadrao: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExcluir = async () => {
    if (isPadrao) {
      alert('Não é possível excluir o plano de contas padrão.');
      return;
    }

    setLoading(true);
    
    try {
      const result = await excluirPlanoContas(planoId);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir plano de contas');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (isPadrao) {
    return null; // Não mostra botão para plano padrão
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleExcluir}
          disabled={loading}
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
      title="Excluir plano de contas"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
