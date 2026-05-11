import Link from 'next/link';
import { Building2, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { listarObras } from '@/app/actions/obras';
import { db } from '@/lib/db';
import ContratosObrasContent from './ContratosObrasContent';

export default async function ContratosObrasPage() {
  // Buscar todas as construtoras e suas obras do banco
  const construtoras = await db.construtora.findMany({
    select: {
      id: true,
      codigo: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
    },
    orderBy: { razaoSocial: 'asc' },
  });

  const obras = await listarObras();

  // Criar mapa de obras por construtora para acesso rápido
  const obrasPorConstrutora: Record<string, typeof obras> = {};
  obras.forEach(obra => {
    if (!obrasPorConstrutora[obra.construtoraId]) {
      obrasPorConstrutora[obra.construtoraId] = [];
    }
    obrasPorConstrutora[obra.construtoraId].push(obra);
  });

  // Mapear TODAS as construtoras, incluindo as sem obras
  const construtorasFormatadas = construtoras.map(construtora => {
    const obrasConstrutora = obrasPorConstrutora[construtora.id] || [];
    
    return {
      construtoraId: construtora.id,
      construtoraNome: construtora.razaoSocial,
      construtoraCnpj: construtora.cnpj,
      totalObras: obrasConstrutora.length,
      obrasAtivas: obrasConstrutora.filter(o => o.status === 'EM_ANDAMENTO').length,
      obrasParalisadas: obrasConstrutora.filter(o => o.status === 'PARALISADA').length,
      valorTotal: obrasConstrutora.reduce((sum, o) => sum + Number(o.valorContrato), 0),
    };
  });

  // Totais gerais
  const totalConstrutoras = construtoras.length;
  const totalObras = obras.length;
  const totalValor = obras.reduce((sum, obra) => sum + Number(obra.valorContrato), 0);

  return (
    <ContratosObrasContent 
      construtorasFormatadas={construtorasFormatadas}
      totalConstrutoras={totalConstrutoras}
      totalObras={totalObras}
      totalValor={totalValor}
    />
  );
}
