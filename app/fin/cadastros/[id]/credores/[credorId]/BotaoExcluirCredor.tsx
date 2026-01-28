'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { excluirCredor } from '@/app/actions/credores';

export function BotaoExcluirCredor({ credorId, construtoraId }: { credorId: string; construtoraId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExcluir = async () => {
    setLoading(true);
    
    try {
      const result = await excluirCredor(credorId);
      
      if (result.success) {
        router.push(`/fin/cadastros/${construtoraId}/credores`);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir credor');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleExcluir}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Excluindo...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      <Trash2 className="w-5 h-5" />
      Excluir
    </button>
  );
}
