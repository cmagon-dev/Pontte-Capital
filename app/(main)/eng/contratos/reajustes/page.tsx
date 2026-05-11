'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReajustesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a listagem de contratos
    // O usuário pode então selecionar um contrato e acessar a aba de Reajustes
    router.replace('/eng/contratos/contratos-obras');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecionando...</p>
      </div>
    </div>
  );
}
