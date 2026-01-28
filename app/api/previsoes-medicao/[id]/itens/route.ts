import { NextRequest, NextResponse } from "next/server";
import { substituirItensMedicao } from "@/app/actions/previsoes-medicao";

// PUT - Substituir todos os itens de uma medição
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itens, numeroMedicao } = body;

    if (!itens || !Array.isArray(itens)) {
      return NextResponse.json(
        { error: "itens é obrigatório e deve ser um array" },
        { status: 400 }
      );
    }

    if (numeroMedicao === undefined || numeroMedicao === null) {
      return NextResponse.json(
        { error: "numeroMedicao é obrigatório" },
        { status: 400 }
      );
    }

    const result = await substituirItensMedicao(params.id, itens, numeroMedicao);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao substituir itens:", error);
    return NextResponse.json(
      { error: "Erro ao substituir itens da medição" },
      { status: 500 }
    );
  }
}
