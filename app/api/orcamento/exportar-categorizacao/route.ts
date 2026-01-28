import { NextRequest, NextResponse } from 'next/server';
import { buscarCategorizacao } from '@/app/actions/orcamento';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');
    const versaoId = searchParams.get('versaoId'); // Versão específica (opcional)

    if (!obraId) {
      return NextResponse.json(
        { error: 'obraId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar categorização (versão específica ou versão ativa)
    const resultado = versaoId 
      ? await buscarCategorizacao(obraId, versaoId)
      : await buscarCategorizacao(obraId);

    if (!resultado.success || !resultado.itens) {
      return NextResponse.json(
        { error: resultado.error || 'Erro ao buscar categorização' },
        { status: 400 }
      );
    }

    // Construir hierarquia de itens
    const itensMap = new Map<string, typeof resultado.itens[0] & { filhos: string[] }>();
    const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

    // Criar mapa de itens
    resultado.itens.forEach((item: typeof resultado.itens[0]) => {
      itensMap.set(item.itemId, { ...item, filhos: [] });
      
      if (item.parentId) {
        if (!filhosMap.has(item.parentId)) {
          filhosMap.set(item.parentId, []);
        }
        filhosMap.get(item.parentId)!.push({
          id: item.itemId,
          ordem: item.ordem !== null && item.ordem !== undefined ? item.ordem : 0,
        });
      }
    });

    // Ordenar filhos por ordem
    filhosMap.forEach((filhos, parentId) => {
      filhos.sort((a, b) => a.ordem - b.ordem);
      const parent = itensMap.get(parentId);
      if (parent) {
        parent.filhos = filhos.map(f => f.id);
      }
    });

    // Função recursiva para processar hierarquia
    const processarHierarquia = (itemId: string, dadosOrdenados: any[]): void => {
      const item = itensMap.get(itemId);
      if (!item) return;

      // Adicionar indentação na descrição baseada no nível
      const indentacao = '  '.repeat(item.nivel);
      const descricaoComIndentacao = indentacao + item.discriminacao;

      dadosOrdenados.push({
        'Item': item.codigo,
        'Descrição': descricaoComIndentacao,
        'Unidade': item.unidade || '',
        'Quantidade': item.quantidade,
        'Etapa': item.etapa || '',
        'SubEtapa': item.subEtapa || '',
        'Serviço Simplificado': item.servicoSimplificado || '',
      });

      // Processar filhos em ordem
      item.filhos.forEach((filhoId: string) => {
        processarHierarquia(filhoId, dadosOrdenados);
      });
    };

    // Encontrar itens raiz (nível 0 ou sem parentId)
    const itensRaiz = resultado.itens
      .filter((item: any) => item.nivel === 0 || !item.parentId)
      .sort((a: any, b: any) => {
        // Ordenar por ordem se disponível, senão por código
        if (a.ordem !== null && b.ordem !== null) {
          return a.ordem - b.ordem;
        }
        const partesA = a.codigo.split('.').map(Number);
        const partesB = b.codigo.split('.').map(Number);
        const maxLen = Math.max(partesA.length, partesB.length);
        for (let i = 0; i < maxLen; i++) {
          const valA = partesA[i] || 0;
          const valB = partesB[i] || 0;
          if (valA !== valB) return valA - valB;
        }
        return 0;
      });

    // Processar hierarquia começando pelos itens raiz
    const dados: any[] = [];
    itensRaiz.forEach((itemRaiz: any) => {
      processarHierarquia(itemRaiz.itemId, dados);
    });

    // Criar workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dados);

    // Ajustar larguras das colunas
    const colWidths = [
      { wch: 12 }, // Item
      { wch: 50 }, // Descrição
      { wch: 10 }, // Unidade
      { wch: 12 }, // Quantidade
      { wch: 40 }, // Etapa
      { wch: 40 }, // SubEtapa
      { wch: 40 }, // Serviço Simplificado
    ];
    worksheet['!cols'] = colWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorização');

    // Gerar buffer do arquivo Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Retornar arquivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="categorizacao-${obraId}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar categorização:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar categorização' },
      { status: 500 }
    );
  }
}
