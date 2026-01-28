import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

// GET - Buscar serviços simplificados (opcionalmente filtrados por obra)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');

    // Se obraId for fornecido, buscar apenas serviços da categorização ativa da obra
    if (obraId) {
      // Buscar versão ativa de categorização da obra
      const versaoCategorizacao = await prisma.versaoCategorizacao.findFirst({
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

      if (!versaoCategorizacao) {
        return NextResponse.json([]);
      }

      // Extrair serviços simplificados únicos da categorização
      const nomesServicos = Array.from(
        new Set(
          versaoCategorizacao.itens
            .map((item) => item.servicoSimplificado)
            .filter((nome): nome is string => nome !== null && nome !== '')
        )
      );

      // Buscar os serviços simplificados completos
      const servicosSimplificados = await prisma.servicoSimplificado.findMany({
        where: {
          nome: { in: nomesServicos },
          ativo: true,
        },
        orderBy: [
          { ordem: 'asc' },
          { nome: 'asc' },
        ],
      });

      return NextResponse.json(servicosSimplificados);
    }

    // Se não houver obraId, buscar todos os serviços ativos
    const servicosSimplificados = await prisma.servicoSimplificado.findMany({
      where: {
        ativo: true,
      },
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' },
      ],
    });

    return NextResponse.json(servicosSimplificados);
  } catch (error) {
    console.error('Erro ao buscar serviços simplificados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviços simplificados' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar lead times de um serviço simplificado
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      leadTimeMaterial, 
      leadTimeMaoDeObra, 
      leadTimeContratos, 
      leadTimeEquipamentos 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do serviço é obrigatório' },
        { status: 400 }
      );
    }

    const servicoAtualizado = await prisma.servicoSimplificado.update({
      where: { id },
      data: {
        leadTimeMaterial: leadTimeMaterial || null,
        leadTimeMaoDeObra: leadTimeMaoDeObra || null,
        leadTimeContratos: leadTimeContratos || null,
        leadTimeEquipamentos: leadTimeEquipamentos || null,
      },
    });

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar lead times:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lead times' },
      { status: 500 }
    );
  }
}
