import { NextRequest, NextResponse } from 'next/server';
import { exportarListas } from '@/app/actions/categorizacao-listas';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const resultado = await exportarListas();

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error || 'Erro ao exportar listas' },
        { status: 400 }
      );
    }

    // Preparar dados hierárquicos para Excel
    const dados = resultado.dadosExportacao || [];

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dados);

    // Ajustar larguras das colunas
    const colWidths = [
      { wch: 50 }, // Etapa
      { wch: 50 }, // SubEtapa
      { wch: 50 }, // Serviço
      { wch: 10 }, // Ordem Etapa
      { wch: 10 }, // Ordem SubEtapa
      { wch: 10 }, // Ordem Serviço
    ];
    worksheet['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Listas de Categorização');

    // Gerar buffer do arquivo Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="listas-categorizacao-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar listas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar listas' },
      { status: 500 }
    );
  }
}
