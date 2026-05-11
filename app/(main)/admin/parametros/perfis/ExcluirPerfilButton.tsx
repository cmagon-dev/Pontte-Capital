'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { excluirPerfil } from '@/app/actions/perfis';

interface ExcluirPerfilButtonProps {
  id: string;
  nome: string;
  totalUsuarios: number;
  redirectOnDelete?: string;
}

export default function ExcluirPerfilButton({ id, nome, totalUsuarios, redirectOnDelete }: ExcluirPerfilButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const handleExcluir = () => {
    if (totalUsuarios > 0) {
      setErro(`Não é possível excluir: ${totalUsuarios} usuário(s) usam este perfil.`);
      setTimeout(() => setErro(null), 4000);
      return;
    }
    if (!confirm(`Excluir o perfil "${nome}"? Esta ação não pode ser desfeita.`)) return;

    startTransition(async () => {
      const resultado = await excluirPerfil(id);
      if (resultado.sucesso) {
        if (redirectOnDelete) {
          router.push(redirectOnDelete);
        }
        router.refresh();
      } else {
        setErro(resultado.erro || 'Erro ao excluir');
        setTimeout(() => setErro(null), 4000);
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={handleExcluir}
        disabled={isPending}
        title={totalUsuarios > 0 ? `Perfil em uso por ${totalUsuarios} usuário(s)` : 'Excluir perfil'}
        className={`flex items-center gap-1.5 p-1.5 rounded transition-colors ${
          totalUsuarios > 0
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-500 hover:text-red-400 hover:bg-slate-700'
        } disabled:opacity-50`}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
      {erro && (
        <div className="absolute bottom-full right-0 mb-1 w-60 p-2 bg-red-900 border border-red-700 rounded-lg text-red-300 text-xs z-10 shadow-lg whitespace-normal">
          {erro}
        </div>
      )}
    </div>
  );
}
