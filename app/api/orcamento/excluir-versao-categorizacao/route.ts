import { NextRequest, NextResponse } from 'next/server';
import { excluirVersaoCategorizacao } from '@/app/actions/orcamento';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { obraId, versaoId, permitirQualquerVersao } = body;

    if (!obraId || !versaoId) {
      return NextResponse.json(
        { error: 'obraId e versaoId são obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await excluirVersaoCategorizacao(obraId, versaoId, permitirQualquerVersao || false);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao excluir versão de categorização:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir versão de categorização' },
      { status: 500 }
    );
  }
}
