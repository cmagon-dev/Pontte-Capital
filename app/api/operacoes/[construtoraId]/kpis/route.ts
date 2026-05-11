import { NextRequest, NextResponse } from 'next/server';
import { calcularResumoOperacoes } from '@/app/actions/operacoes';

export async function GET(
  _request: NextRequest,
  { params }: { params: { construtoraId: string } }
) {
  try {
    const kpis = await calcularResumoOperacoes(params.construtoraId);
    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Erro ao calcular KPIs:', error);
    return NextResponse.json({ error: 'Erro ao calcular KPIs' }, { status: 500 });
  }
}
