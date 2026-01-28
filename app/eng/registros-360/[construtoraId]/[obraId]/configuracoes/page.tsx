import Link from 'next/link';
import { ArrowLeft, Plus, Camera, Calendar, CheckCircle2, Clock, AlertCircle, Search, Upload, Edit2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import ConfiguracoesContent from './ConfiguracoesContent';

export default async function Registros360ConfiguracoesPage({ 
  params 
}: { 
  params: { construtoraId: string; obraId: string } 
}) {
  // Buscar obra e construtora
  const obra = await db.obra.findUnique({
    where: { id: params.obraId },
    include: {
      construtora: {
        select: {
          id: true,
          razaoSocial: true,
        },
      },
    },
  });

  if (!obra || obra.construtoraId !== params.construtoraId) {
    notFound();
  }

  // Buscar todas as plantas da obra
  const plantas = await db.plantaBaixa.findMany({
    where: { obraId: params.obraId },
    include: {
      pontos: {
        include: {
          fotos: true,
        },
      },
      setores: true,
    },
    orderBy: [
      { ordem: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Formatar dados para o componente
  const plantasFormatadas = plantas.map((planta) => {
    const totalFotos = planta.pontos.reduce((sum, ponto) => sum + ponto.fotos.length, 0);
    
    return {
      id: planta.id,
      titulo: planta.nome,
      dataCriacao: planta.createdAt.toISOString().split('T')[0],
      status: planta.pontos.length > 0 || planta.setores.length > 0 ? 'Ativa' : 'Em Configuração' as 'Ativa' | 'Em Configuração',
      tipo: planta.tipo.toLowerCase() as 'implantacao' | 'pavimento',
      totalPontos: planta.pontos.length,
      totalFotos: totalFotos,
      totalSetores: planta.tipo === 'IMPLANTACAO' ? planta.setores.length : undefined,
    };
  });

  return (
    <ConfiguracoesContent 
      params={params}
      plantas={plantasFormatadas}
      obra={obra}
      construtora={obra.construtora}
    />
  );
}
