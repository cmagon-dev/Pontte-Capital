import { NextRequest, NextResponse } from "next/server";
import { buscarMedicoesAgrupadasPorVisaoGerencial } from "@/app/actions/previsoes-medicao";

// GET - Buscar medições agrupadas por EAP gerencial
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const obraId = searchParams.get("obraId");
    const versaoVisaoGerencialId = searchParams.get("versaoVisaoGerencialId") || undefined;

    if (!obraId) {
      return NextResponse.json(
        { error: "obraId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await buscarMedicoesAgrupadasPorVisaoGerencial(
      obraId,
      versaoVisaoGerencialId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao buscar medições agrupadas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar medições agrupadas" },
      { status: 500 }
    );
  }
}
