import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');

    if (!obraId) {
      return NextResponse.json(
        { error: 'obraId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar obra
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
      select: { codigo: true, nome: true },
    });

    if (!obra) {
      return NextResponse.json(
        { error: 'Obra não encontrada' },
        { status: 404 }
      );
    }

    // Buscar versão ativa de categorização
    const versaoCategorizacao = await prisma.versaoCategorizacao.findFirst({
      where: {
        obraId: obraId,
        status: 'ATIVA',
      },
      include: {
        itens: {
          select: {
            servicoSimplificado: true,
          },
        },
      },
    });

    if (!versaoCategorizacao) {
      return NextResponse.json(
        { error: 'Nenhuma versão ativa de categorização encontrada' },
        { status: 404 }
      );
    }

    // Extrair serviços simplificados únicos
    const nomesServicos = Array.from(
      new Set(
        versaoCategorizacao.itens
          .map((item) => item.servicoSimplificado)
          .filter((nome): nome is string => nome !== null && nome !== '')
      )
    );

    // Buscar os serviços completos com lead times
    const servicos = await prisma.servicoSimplificado.findMany({
      where: {
        nome: { in: nomesServicos },
        ativo: true,
      },
      orderBy: [
        { ordem: 'asc' },
        { nome: 'asc' },
      ],
    });

    // Criar dados para a planilha
    const dados = servicos.map((servico) => ({
      'Serviço Simplificado': servico.nome,
      'Lead Time Material (dias)': servico.leadTimeMaterial ?? '',
      'Lead Time Mão de Obra (dias)': servico.leadTimeMaoDeObra ?? '',
      'Lead Time Contratos (dias)': servico.leadTimeContratos ?? '',
      'Lead Time Equipamentos e Fretes (dias)': servico.leadTimeEquipamentos ?? '',
      'ID': servico.id, // ID oculto para referência na importação
    }));

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dados);

    // Configurar largura das colunas
    worksheet['!cols'] = [
      { wch: 50 }, // Serviço Simplificado
      { wch: 25 }, // Material
      { wch: 30 }, // Mão de Obra
      { wch: 25 }, // Contratos
      { wch: 35 }, // Equipamentos
      { wch: 40 }, // ID
    ];

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lead Times');

    // Adicionar instruções em uma segunda aba
    const instrucoes = [
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '' },
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '1. Não altere a coluna "ID" - ela é necessária para a importação' },
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '2. Não adicione ou remova linhas' },
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '3. Preencha apenas os valores numéricos de lead time em dias' },
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '4. Deixe em branco os campos que não deseja alterar' },
      { 'INSTRUÇÕES PARA PREENCHIMENTO': '5. Após preencher, salve o arquivo e importe novamente no sistema' },
    ];
    const worksheetInstrucoes = XLSX.utils.json_to_sheet(instrucoes);
    worksheetInstrucoes['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, worksheetInstrucoes, 'Instruções');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retornar arquivo
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="lead-times-${obra.codigo}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar lead times:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar planilha' },
      { status: 500 }
    );
  }
}
