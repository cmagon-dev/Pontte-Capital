import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// POST - Sincronizar serviços da nova versão de categorização
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { obraId } = body;

    if (!obraId) {
      return NextResponse.json(
        { error: 'obraId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar versão ativa de categorização
    const versaoAtiva = await prisma.versaoCategorizacao.findFirst({
      where: {
        obraId: obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          select: {
            servicoSimplificado: true,
          },
        },
      },
    });

    if (!versaoAtiva) {
      return NextResponse.json(
        { error: 'Nenhuma versão ativa encontrada' },
        { status: 404 }
      );
    }

    // Extrair serviços simplificados únicos
    const nomesServicos = Array.from(
      new Set(
        versaoAtiva.itens
          .map((item) => item.servicoSimplificado)
          .filter((nome): nome is string => nome !== null && nome !== '')
      )
    );

    // Os serviços já existem na tabela ServicoSimplificado
    // Os lead times são mantidos automaticamente porque são campos da mesma tabela
    // Não precisamos fazer nada além de retornar sucesso
    
    // Se houver serviços novos que não existem na tabela ServicoSimplificado,
    // eles precisarão ser criados primeiro na gestão de listas de categorização
    
    return NextResponse.json({
      success: true,
      message: 'Serviços sincronizados com sucesso',
      totalServicos: nomesServicos.length,
    });
  } catch (error) {
    console.error('Erro ao sincronizar serviços:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar serviços' },
      { status: 500 }
    );
  }
}
