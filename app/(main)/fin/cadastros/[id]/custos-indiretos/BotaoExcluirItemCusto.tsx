'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { excluirItemCustoIndireto } from '@/app/actions/custos-indiretos';

interface Props {
  itemId: string;
  construtoraId: string;
}

export default function BotaoExcluirItemCusto({ itemId, construtoraId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) return;
    setLoading(true);
    try {
      await excluirItemCustoIndireto(itemId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExcluir}
      disabled={loading}
      className="p-2 hover:bg-red-900/40 rounded-lg transition-colors text-slate-400 hover:text-red-400 disabled:opacity-50"
      title="Excluir"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
