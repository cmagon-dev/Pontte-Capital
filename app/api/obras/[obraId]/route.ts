import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { obraId: string } }
) {
  try {
    const { obraId } = params;

    const obra = await db.obra.findUnique({
      where: { id: obraId },
      include: {
        construtora: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
        contratante: {
          select: {
            id: true,
            codigo: true,
            razaoSocial: true,
            nomeFantasia: true,
          }
        },
        aditivos: {
          where: {
            status: 'APROVADO',
          },
          select: {
            valorAditivo: true,
            valorGlosa: true,
          }
        },
        reajustes: {
          where: {
            status: 'APLICADO',
          },
          select: {
            valorReajuste: true,
          }
        },
      },
    });

    if (!obra) {
      return NextResponse.json(
        { error: 'Obra não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(obra);
  } catch (error) {
    console.error('Erro ao buscar obra:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar obra' },
      { status: 500 }
    );
  }
}
