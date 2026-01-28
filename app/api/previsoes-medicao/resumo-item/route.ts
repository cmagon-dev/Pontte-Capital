import { NextRequest, NextResponse } from "next/server";
import { buscarResumoMedicoesPorItem } from "@/app/actions/previsoes-medicao";

// GET - Buscar resumo de medições por item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const obraId = searchParams.get("obraId");
    const itemOrcamentoId = searchParams.get("itemOrcamentoId") || undefined;
    const itemCustoOrcadoId = searchParams.get("itemCustoOrcadoId") || undefined;

    if (!obraId) {
      return NextResponse.json(
        { error: "obraId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await buscarResumoMedicoesPorItem(
      obraId,
      itemOrcamentoId,
      itemCustoOrcadoId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao buscar resumo de medições:", error);
    return NextResponse.json(
      { error: "Erro ao buscar resumo de medições" },
      { status: 500 }
    );
  }
}
