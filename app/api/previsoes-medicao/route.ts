import { NextRequest, NextResponse } from "next/server";
import {
  criarPrevisaoMedicao,
  buscarPrevisoesPorObra,
} from "@/app/actions/previsoes-medicao";

// GET - Buscar previsões por obra
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const obraId = searchParams.get("obraId");

    if (!obraId) {
      return NextResponse.json(
        { error: "obraId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await buscarPrevisoesPorObra(obraId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao buscar previsões:", error);
    return NextResponse.json(
      { error: "Erro ao buscar previsões" },
      { status: 500 }
    );
  }
}

// POST - Criar nova previsão de medição
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await criarPrevisaoMedicao(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar previsão:", error);
    return NextResponse.json(
      { error: "Erro ao criar previsão" },
      { status: 500 }
    );
  }
}
