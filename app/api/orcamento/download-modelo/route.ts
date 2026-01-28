import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Dados do modelo - exemplo de estrutura hierárquica
    const dadosModelo = [
      // Cabeçalho
      ['Item', 'Referência', 'Serviço (Descrição)', 'Unidade', 'Quantidade', 'Preço Unitário (com BDI)', 'Preço Total (com BDI)'],
      // Exemplo de estrutura hierárquica
      ['1.0', '', 'SERVIÇOS DE INFRAESTRUTURA', '', '', '', ''],
      ['1.1', '', 'Movimentação de Terra', '', '', '', ''],
      ['1.1.1', 'SINAPI-1234', 'Escavação manual para fundações', 'm³', 250, 45.5, 11375],
      ['1.1.2', 'SINAPI-1235', 'Aterro compactado', 'm³', 500, 35.2, 17600],
      ['1.1.3', 'SINAPI-1236', 'Compactação de solo', 'm²', 1200, 8.5, 10200],
      ['1.2', '', 'Fundações', '', '', '', ''],
      ['1.2.1', 'SINAPI-2001', 'Concreto para fundações', 'm³', 150, 450, 67500],
      ['1.2.2', 'SINAPI-2002', 'Formas para fundações', 'm²', 300, 85, 25500],
      ['2.0', '', 'SERVIÇOS DE SUPERESTRUTURA', '', '', '', ''],
      ['2.1', '', 'Estrutura de Concreto', '', '', '', ''],
      ['2.1.1', 'SINAPI-3001', 'Concreto estrutural', 'm³', 500, 520, 260000],
      ['2.1.2', 'SINAPI-3002', 'Formas para lajes', 'm²', 2000, 120, 240000],
    ];

    // Criar worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(dadosModelo);

    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 12 }, // Item
      { wch: 15 }, // Referência
      { wch: 40 }, // Serviço
      { wch: 10 }, // Unidade
      { wch: 12 }, // Quantidade
      { wch: 20 }, // Preço Unitário
      { wch: 20 }, // Preço Total
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha Contratual');

    // Gerar buffer do arquivo Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
    });

    // Retornar arquivo para download
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="modelo-planilha-contratual.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar modelo:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar modelo da planilha' },
      { status: 500 }
    );
  }
}
