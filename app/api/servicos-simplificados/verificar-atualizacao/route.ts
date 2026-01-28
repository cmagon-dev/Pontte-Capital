import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');
    const versaoCategorizacaoId = searchParams.get('versaoCategorizacaoId');

    if (!obraId || !versaoCategorizacaoId) {
      return NextResponse.json({ temNovaVersao: false });
    }

    // Buscar a versão atual
    const versaoAtual = await prisma.versaoCategorizacao.findUnique({
      where: { id: versaoCategorizacaoId },
      select: { updatedAt: true },
    });

    if (!versaoAtual) {
      return NextResponse.json({ temNovaVersao: false });
    }

    // Buscar a versão ativa da obra
    const versaoAtiva = await prisma.versaoCategorizacao.findFirst({
      where: {
        obraId: obraId,
        status: 'ATIVA',
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // Se a versão ativa for diferente da atual, há atualização
    const temNovaVersao = versaoAtiva && versaoAtiva.id !== versaoCategorizacaoId;

    return NextResponse.json({ temNovaVersao });
  } catch (error) {
    console.error('Erro ao verificar atualização:', error);
    return NextResponse.json({ temNovaVersao: false });
  }
}
