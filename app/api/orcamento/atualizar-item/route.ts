import { NextRequest, NextResponse } from 'next/server';
import { atualizarItemOrcamento } from '@/app/actions/orcamento';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, dados } = body;

    if (!itemId || !dados) {
      return NextResponse.json(
        { error: 'itemId e dados são obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await atualizarItemOrcamento(itemId, dados);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar item' },
      { status: 500 }
    );
  }
}
