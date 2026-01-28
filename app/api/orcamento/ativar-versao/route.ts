import { NextRequest, NextResponse } from 'next/server';
import { ativarVersaoOrcamento } from '@/app/actions/orcamento';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { obraId, versaoId } = body;

    if (!obraId || !versaoId) {
      return NextResponse.json(
        { error: 'obraId e versaoId são obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await ativarVersaoOrcamento(obraId, versaoId);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro ao ativar versão:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao ativar versão' },
      { status: 500 }
    );
  }
}
