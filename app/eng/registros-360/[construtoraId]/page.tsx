import Link from 'next/link';
import { ArrowLeft, Plus, Search, FileText, Building2, Camera, Filter, Eye, ClipboardList } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Registros360PorConstrutoraContent from './Registros360PorConstrutoraContent';

export default async function Registros360PorConstrutoraPage({ 
  params 
}: { 
  params: { construtoraId: string } 
}) {
  // Buscar construtora
  const construtora = await db.construtora.findUnique({
    where: { id: params.construtoraId },
    select: {
      id: true,
      codigo: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
    },
  });

  if (!construtora) {
    notFound();
  }

  // Buscar obras da construtora
  const obras = await db.obra.findMany({
    where: { construtoraId: params.construtoraId },
    include: {
      contratante: {
        select: {
          razaoSocial: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Buscar plantas das obras
  const obrasIds = obras.map(o => o.id);
  const plantas = obrasIds.length > 0 ? await db.plantaBaixa.findMany({
    where: {
      obraId: {
        in: obrasIds,
      },
    },
    include: {
      pontos: {
        include: {
          _count: {
            select: {
              fotos: true,
            },
          },
        },
      },
    },
  }) : [];

  // Criar mapa de plantas por obra
  const plantasPorObra: Record<string, typeof plantas> = {};
  plantas.forEach(planta => {
    if (!plantasPorObra[planta.obraId]) {
      plantasPorObra[planta.obraId] = [];
    }
    plantasPorObra[planta.obraId].push(planta);
  });

  // Formatar obras com estatísticas
  const obrasFormatadas = obras.map((obra) => {
    const plantasObra = plantasPorObra[obra.id] || [];
    const totalPontos = plantasObra.reduce((sum, planta) => sum + planta.pontos.length, 0);
    const totalFotos = plantasObra.reduce((sum, planta) => 
      sum + planta.pontos.reduce((s, ponto) => s + ponto._count.fotos, 0), 0
    );

    // Mapear status do banco para o formato da UI
    const statusMap: Record<string, string> = {
      'NAO_INICIADA': 'Em Planejamento',
      'EM_ANDAMENTO': 'Ativa',
      'PARALISADA': 'Parada',
      'CONCLUIDA': 'Finalizada',
      'CANCELADA': 'Cancelada',
    };

    return {
      id: obra.id,
      numeroContrato: obra.codigo,
      numeroEdital: null as string | null,
      objeto: obra.nome,
      contratante: obra.contratante?.razaoSocial || 'N/A',
      construtora: {
        id: obra.construtoraId,
        nome: construtora.razaoSocial,
      },
      fundo: {
        id: null as string | null,
        nome: null as string | null,
      },
      valorGlobal: Number(obra.valorContrato),
      dataInicio: obra.dataInicio?.toISOString().split('T')[0] || null,
      dataFim: obra.dataFim?.toISOString().split('T')[0] || null,
      enderecoObra: obra.endereco || null,
      status: statusMap[obra.status] || obra.status,
      totalPlantas: plantasObra.length,
      totalPontos: totalPontos,
      totalFotos: totalFotos,
    };
  });

  return (
    <Registros360PorConstrutoraContent
      params={params}
      construtora={construtora}
      obras={obrasFormatadas}
    />
  );
}
