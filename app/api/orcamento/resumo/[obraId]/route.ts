import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

// Helper para converter Decimal para Number
function toNumber(value: Decimal | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

export async function GET(
  request: NextRequest,
  { params }: { params: { obraId: string } }
) {
  try {
    const { obraId } = params;

    // Buscar versão ativa de custos orçados (esta é a principal para os cálculos)
    const versaoCustos = await prisma.versaoCustoOrcado.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      orderBy: { numero: 'desc' },
    });

    // Se não houver versão de custos, buscar outras versões para exibir
    const [versaoContratual, versaoCategorizacao, versaoGerencial] = await Promise.all([
      prisma.versaoOrcamento.findFirst({
        where: { obraId, status: 'ATIVA' },
        orderBy: { numero: 'desc' },
      }),
      prisma.versaoCategorizacao.findFirst({
        where: { obraId, status: 'ATIVA' },
        orderBy: { numero: 'desc' },
      }),
      prisma.versaoVisaoGerencial.findFirst({
        where: { obraId, status: 'ATIVA' },
        orderBy: { numero: 'desc' },
      }),
    ]);

    // Buscar itens de custos orçados (fonte principal de dados)
    const itensCustos = await prisma.itemCustoOrcado.findMany({
      where: {
        versaoCustoOrcadoId: versaoCustos?.id || 'none',
        tipo: 'ITEM', // Apenas itens, não agrupadores
      },
      select: {
        precoTotalVenda: true,
        valorMaterial: true,
        valorMaoDeObra: true,
        valorEquipamento: true,
        valorVerba: true,
        custoTotal: true,
        lucroProjetado: true,
      },
    });

    // Calcular totais convertendo Decimal para Number
    let valorTotalPlanilhaContratual = 0;
    let custoTotalOrcado = 0;
    let lucroProjetadoTotal = 0;
    let custoMaterial = 0;
    let custoMaoDeObra = 0;
    let custoEquipamento = 0;
    let custoVerba = 0;
    let itensOrcados = 0;

    itensCustos.forEach((item) => {
      const precoVenda = toNumber(item.precoTotalVenda);
      const custo = toNumber(item.custoTotal);
      const lucro = toNumber(item.lucroProjetado);
      const mat = toNumber(item.valorMaterial);
      const mo = toNumber(item.valorMaoDeObra);
      const eq = toNumber(item.valorEquipamento);
      const verba = toNumber(item.valorVerba);

      valorTotalPlanilhaContratual += precoVenda;
      
      // Considerar item orçado se tem custo > 0
      if (custo > 0) {
        custoTotalOrcado += custo;
        lucroProjetadoTotal += lucro;
        custoMaterial += mat;
        custoMaoDeObra += mo;
        custoEquipamento += eq;
        custoVerba += verba;
        itensOrcados++;
      }
    });

    const totalItensPlanilha = itensCustos.length;

    // Calcular percentual orçado
    const percentualOrcado =
      totalItensPlanilha > 0 ? (itensOrcados / totalItensPlanilha) * 100 : 0;

    // Calcular margem de lucro projetada
    const margemLucroProjetada =
      valorTotalPlanilhaContratual > 0
        ? (lucroProjetadoTotal / valorTotalPlanilhaContratual) * 100
        : 0;

    // Determinar status do orçamento
    let statusOrcamento = 'Pendente';
    if (percentualOrcado >= 100) {
      statusOrcamento = 'Completo';
    } else if (percentualOrcado > 0) {
      statusOrcamento = 'Em Andamento';
    }

    // Buscar todas as versões de cada planilha para mostrar histórico
    const [
      todasVersoesContratual,
      todasVersoesCustos,
      todasVersoesCategorizacao,
      todasVersoesGerencial,
    ] = await Promise.all([
      prisma.versaoOrcamento.findMany({
        where: { obraId },
        orderBy: { numero: 'desc' },
        select: {
          id: true,
          numero: true,
          status: true,
          createdAt: true,
          observacoes: true,
        },
      }),
      prisma.versaoCustoOrcado.findMany({
        where: { obraId },
        orderBy: { numero: 'desc' },
        select: {
          id: true,
          numero: true,
          status: true,
          createdAt: true,
          observacoes: true,
        },
      }),
      prisma.versaoCategorizacao.findMany({
        where: { obraId },
        orderBy: { numero: 'desc' },
        select: {
          id: true,
          numero: true,
          status: true,
          createdAt: true,
          observacoes: true,
        },
      }),
      prisma.versaoVisaoGerencial.findMany({
        where: { obraId },
        orderBy: { numero: 'desc' },
        select: {
          id: true,
          numero: true,
          status: true,
          createdAt: true,
          observacoes: true,
        },
      }),
    ]);

    return NextResponse.json({
      resumo: {
        valorTotalPlanilhaContratual,
        percentualOrcado,
        custoTotalOrcado,
        lucroProjetado: lucroProjetadoTotal,
        margemLucroProjetada,
        totalItensPlanilha,
        itensOrcados,
        statusOrcamento,
      },
      custosDetalhados: {
        material: custoMaterial,
        maoDeObra: custoMaoDeObra,
        equipamento: custoEquipamento,
        verba: custoVerba,
      },
      versoes: {
        contratual: {
          ativa: versaoContratual,
          todas: todasVersoesContratual,
          totalVersoes: todasVersoesContratual.length,
        },
        custos: {
          ativa: versaoCustos,
          todas: todasVersoesCustos,
          totalVersoes: todasVersoesCustos.length,
        },
        categorizacao: {
          ativa: versaoCategorizacao,
          todas: todasVersoesCategorizacao,
          totalVersoes: todasVersoesCategorizacao.length,
        },
        gerencial: {
          ativa: versaoGerencial,
          todas: todasVersoesGerencial,
          totalVersoes: todasVersoesGerencial.length,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar resumo do orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo do orçamento' },
      { status: 500 }
    );
  }
}
