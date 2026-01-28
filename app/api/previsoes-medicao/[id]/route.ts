import { NextRequest, NextResponse } from "next/server";
import {
  buscarPrevisaoPorId,
  atualizarPrevisaoMedicao,
  deletarPrevisaoMedicao,
} from "@/app/actions/previsoes-medicao";

// GET - Buscar previsão por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await buscarPrevisaoPorId(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Previsão não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao buscar previsão:", error);
    return NextResponse.json(
      { error: "Erro ao buscar previsão" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar previsão
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = await atualizarPrevisaoMedicao(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao atualizar previsão:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar previsão" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar previsão
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deletarPrevisaoMedicao(params.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Previsão deletada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao deletar previsão:", error);
    return NextResponse.json(
      { error: "Erro ao deletar previsão" },
      { status: 500 }
    );
  }
}
