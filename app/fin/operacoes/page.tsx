'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperacoesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para a página de solicitações
    router.replace('/fin/operacoes/solicitacoes');
  }, [router]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Redirecionando...</p>
      </div>
    </div>
  );
}
