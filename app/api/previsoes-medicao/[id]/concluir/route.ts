import { NextRequest, NextResponse } from "next/server";
import { concluirPrevisaoMedicao } from "@/app/actions/previsoes-medicao";

// POST - Concluir uma previsão de medição (marca como REALIZADA)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dataRealMedicao } = body;
    
    const result = await concluirPrevisaoMedicao(params.id, dataRealMedicao);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Erro ao concluir previsão:", error);
    return NextResponse.json(
      { error: "Erro ao concluir previsão de medição" },
      { status: 500 }
    );
  }
}
