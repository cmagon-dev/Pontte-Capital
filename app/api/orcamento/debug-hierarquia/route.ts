import { NextRequest, NextResponse } from 'next/server';
import { diagnosticarHierarquia } from '@/app/actions/orcamento-debug';

/**
 * Rota temporária para diagnosticar hierarquia
 * 
 * Uso: GET /api/orcamento/debug-hierarquia?obraId=xxx
 * 
 * Os logs aparecerão no terminal do servidor (não no navegador)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'obraId é obrigatório' },
        { status: 400 }
      );
    }

    // Executar diagnóstico (os logs aparecerão no terminal do servidor)
    const resultado = await diagnosticarHierarquia(obraId);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro na rota de diagnóstico:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
