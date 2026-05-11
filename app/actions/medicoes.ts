'use server';

import { db as prisma } from '@/lib/db';

export async function listarMedicoesPorObra(obraId: string) {
  const medicoes = await prisma.previsaoMedicao.findMany({
    where: {
      obraId,
      status: 'REALIZADA',
    },
    orderBy: { numero: 'desc' },
    select: {
      id: true,
      nome: true,
      numero: true,
      dataPrevisao: true,
      dataRealMedicao: true,
      status: true,
      tipo: true,
      observacoes: true,
      itens: {
        select: {
          valorPrevisto: true,
        },
      },
    },
  });

  return medicoes.map((m) => ({
    id: m.id,
    nome: m.nome,
    numero: m.numero,
    dataPrevisao: m.dataPrevisao,
    dataRealMedicao: m.dataRealMedicao,
    status: m.status,
    tipo: m.tipo,
    observacoes: m.observacoes,
    valorTotal: m.itens.reduce((sum, item) => sum + Number(item.valorPrevisto), 0),
  }));
}
