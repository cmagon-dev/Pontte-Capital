import { NextRequest, NextResponse } from "next/server";
import { atualizarItemPrevisao } from "@/app/actions/previsoes-medicao";

// PUT - Atualizar item de previsão
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const body = await request.json();

    const result = await atualizarItemPrevisao(params.itemId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item" },
      { status: 500 }
    );
  }
}
