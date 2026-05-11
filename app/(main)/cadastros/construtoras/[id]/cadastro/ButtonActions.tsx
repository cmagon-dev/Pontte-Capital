'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { excluirConstrutora } from '@/app/actions/construtoras';

interface ButtonActionsProps {
  construtoraId: string;
  razaoSocial: string;
}

export default function ButtonActions({ construtoraId, razaoSocial }: ButtonActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await excluirConstrutora(construtoraId);
      
      if (result.success) {
        router.push('/cadastros/construtoras');
        router.refresh();
      } else {
        alert(result.message || 'Erro ao excluir construtora');
        setShowConfirm(false);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir construtora');
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Link
          href={`/cadastros/construtoras/${construtoraId}/editar`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          Editar
        </Link>
        
        {!showConfirm ? (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Excluir
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
      
      {showConfirm && (
        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-red-600 rounded-lg p-4 shadow-lg z-10 max-w-sm">
          <p className="text-white text-sm mb-2">
            <strong>Confirmar exclusão?</strong>
          </p>
          <p className="text-slate-400 text-xs mb-4">
            A construtora <strong className="text-white">{razaoSocial}</strong> será permanentemente excluída.
          </p>
        </div>
      )}
    </div>
  );
}
