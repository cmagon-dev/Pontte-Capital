import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { construtoraId: string } }
) {
  try {
    const construtora = await db.construtora.findUnique({
      where: { id: params.construtoraId },
      select: {
        id: true,
        razaoSocial: true,
        cnpj: true,
        obras: {
          select: { id: true, nome: true, codigo: true },
          orderBy: { codigo: 'asc' },
        },
      },
    });

    if (!construtora) {
      return NextResponse.json({ error: 'Construtora não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      id: construtora.id,
      razaoSocial: construtora.razaoSocial,
      cnpj: construtora.cnpj,
      obras: construtora.obras,
    });
  } catch (error) {
    console.error('Erro ao buscar construtora/obras:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
