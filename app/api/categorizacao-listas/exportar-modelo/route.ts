import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo'); // 'etapa', 'subEtapa', ou 'servico'

    if (!tipo || !['etapa', 'subEtapa', 'servico'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }

    // Criar dados de exemplo
    const dadosExemplo = [
      { Nome: 'Exemplo 1', Ordem: 1 },
      { Nome: 'Exemplo 2', Ordem: 2 },
      { Nome: 'Exemplo 3', Ordem: 3 },
    ];

    // Criar workbook
    const worksheet = XLSX.utils.json_to_sheet(dadosExemplo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista');

    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 30 }, // Nome
      { wch: 10 }, // Ordem
    ];

    // Gerar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Nome do arquivo baseado no tipo
    const nomeArquivo = `modelo-${tipo === 'etapa' ? 'etapas' : tipo === 'subEtapa' ? 'subetapas' : 'servicos'}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar modelo:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar modelo' },
      { status: 500 }
    );
  }
}
