import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Configurar fontes do pdfmake
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');
    const medicoesIdsParam = searchParams.get('medicoesIds');
    const planilhasParam = searchParams.get('planilhas');
    const tipoEap = searchParams.get('tipoEap') as 'completa' | 'resumida';
    const formato = searchParams.get('formato');

    // Validações
    if (!obraId) {
      return NextResponse.json({ error: 'obraId é obrigatório' }, { status: 400 });
    }

    if (!medicoesIdsParam || !planilhasParam) {
      return NextResponse.json(
        { error: 'medicoesIds e planilhas são obrigatórios' },
        { status: 400 }
      );
    }

    const medicoesIds: string[] = JSON.parse(medicoesIdsParam);
    const planilhas: string[] = JSON.parse(planilhasParam);

    if (medicoesIds.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos uma medição' },
        { status: 400 }
      );
    }

    if (planilhas.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos uma planilha' },
        { status: 400 }
      );
    }

    // Buscar dados da obra
    const obra = await db.obra.findUnique({
      where: { id: obraId },
      select: {
        id: true,
        codigo: true,
        nome: true,
        construtora: {
          select: {
            razaoSocial: true,
          },
        },
      },
    });

    if (!obra) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 });
    }

    // Buscar medições selecionadas
    const medicoes = await db.previsaoMedicao.findMany({
      where: {
        id: { in: medicoesIds },
        obraId,
      },
      include: {
        itens: true,
      },
      orderBy: { numero: 'asc' },
    });

    if (medicoes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma medição encontrada' },
        { status: 404 }
      );
    }

    // Identificar a última medição selecionada
    const ultimaMedicaoNumero = Math.max(...medicoes.map(m => m.numero));

    // Buscar TODAS as medições até a última selecionada (para cálculo de acumulado)
    const todasMedicoes = await db.previsaoMedicao.findMany({
      where: {
        obraId,
        numero: { lte: ultimaMedicaoNumero },
      },
      include: {
        itens: true,
      },
      orderBy: { numero: 'asc' },
    });

    // Se formato é PDF, gerar PDF
    if (formato === 'pdf') {
      return await gerarExportacaoPDF(
        obra,
        medicoes,
        todasMedicoes,
        ultimaMedicaoNumero,
        tipoEap,
        planilhas
      );
    }

    // Caso contrário, gerar Excel (lógica existente)
    // Criar workbook
    const workbook = XLSX.utils.book_new();

    // Processar cada planilha selecionada
    for (const planilha of planilhas) {
      if (planilha === 'contratual') {
        await gerarPlanilhaContratual(
          workbook,
          obra,
          medicoes,
          todasMedicoes,
          ultimaMedicaoNumero,
          tipoEap
        );
      } else if (planilha === 'gerencial') {
        await gerarPlanilhaGerencial(
          workbook,
          obraId,
          medicoes,
          todasMedicoes,
          ultimaMedicaoNumero,
          tipoEap
        );
      }
    }

    // Adicionar aba de resumo
    gerarAbaResumo(workbook, obra, medicoes, todasMedicoes, ultimaMedicaoNumero, tipoEap);

    // Gerar buffer do arquivo Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellStyles: true });

    // Retornar arquivo
    const tipoTexto = tipoEap === 'completa' ? 'completa' : 'resumida';
    const fileName = `medicoes-${tipoTexto}-${obra.codigo}-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao exportar medições:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar medições' },
      { status: 500 }
    );
  }
}

// ========================================
// PLANILHA CONTRATUAL
// ========================================

async function gerarPlanilhaContratual(
  workbook: XLSX.WorkBook,
  obra: any,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida'
) {
  // Buscar versão ativa do orçamento
  const versaoAtiva = await db.versaoOrcamento.findFirst({
    where: {
      obraId: obra.id,
      status: 'ATIVA',
    },
    include: {
      itens: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!versaoAtiva || !versaoAtiva.itens || versaoAtiva.itens.length === 0) {
    return; // Não adiciona aba se não houver dados
  }

  // Calcular valores acumulados até a última medição por item
  const acumuladoPorItem = calcularAcumuladoPorItem(todasMedicoes, ultimaMedicaoNumero, versaoAtiva.itens);

  // Filtrar itens se tipo EAP for resumida
  let itensParaExportar = versaoAtiva.itens;
  if (tipoEap === 'resumida') {
    itensParaExportar = filtrarItensComMedicao(versaoAtiva.itens, acumuladoPorItem);
  }

  // Construir hierarquia
  const itensMap = new Map();
  const filhosMap = new Map();

  itensParaExportar.forEach((item: any) => {
    itensMap.set(item.id, { ...item, filhos: [] });

    if (item.parentId) {
      if (!filhosMap.has(item.parentId)) {
        filhosMap.set(item.parentId, []);
      }
      filhosMap.get(item.parentId).push({
        id: item.id,
        ordem: item.ordem || 0,
      });
    }
  });

  // Ordenar filhos
  filhosMap.forEach((filhos, parentId) => {
    filhos.sort((a: any, b: any) => a.ordem - b.ordem);
    const parent = itensMap.get(parentId);
    if (parent) {
      parent.filhos = filhos.map((f: any) => f.id);
    }
  });

  // Preparar dados para o Excel usando array of arrays
  const aoa: any[][] = [];
  
  // CABEÇALHO - Linhas 0-4
  const tipoTexto = tipoEap === 'completa' ? 'COMPLETA' : 'RESUMIDA';
  aoa.push(['PREVISÕES DE MEDIÇÕES - VISÃO EAP CONTRATUAL']);
  aoa.push([`Obra: ${obra.codigo} - ${obra.nome}`]);
  aoa.push([`Construtora: ${obra.construtora.razaoSocial}`]);
  aoa.push([`Data: ${new Date().toLocaleDateString('pt-BR')} | Tipo: EAP ${tipoTexto} | Acumulado até ${ultimaMedicaoNumero}ª Medição`]);
  aoa.push([]); // Linha vazia

  // Cabeçalhos das colunas - Linha 5 e 6 (duas linhas)
  const linha1Cabecalhos = ['Item', 'Referência', 'Descrição', 'Unidade', 'Quantidade', 'Preço Unit.', 'Preço Total'];
  
  // Adicionar medições selecionadas
  medicoesSelecionadas.forEach((medicao) => {
    linha1Cabecalhos.push(`${medicao.numero}ª Medição`, '', '', '');
  });
  
  // Adicionar acumulado
  linha1Cabecalhos.push('Acumulado', '', '', '');
  
  aoa.push(linha1Cabecalhos);

  // Linha 2 dos cabeçalhos (sub-colunas das medições)
  const linha2Cabecalhos = ['', '', '', '', '', '', ''];
  
  // Sub-colunas para cada medição
  medicoesSelecionadas.forEach(() => {
    linha2Cabecalhos.push('Quant.', 'Quant.(%)', 'Total (R$)', 'Total (%)');
  });
  
  // Sub-colunas para acumulado
  linha2Cabecalhos.push('Quant.', 'Quant.(%)', 'Total (R$)', 'Total (%)');
  
  aoa.push(linha2Cabecalhos);

  const linhaInicioDados = 7;

  // Armazenar informações de tipo para formatação
  const tiposPorLinha: ('agrupador' | 'item')[] = [];

  // Função recursiva para processar hierarquia
  const processarHierarquia = (itemId: string, nivel: number = 0): void => {
    const item = itensMap.get(itemId);
    if (!item) return;

    const indentacao = '  '.repeat(nivel);
    const acumulado = acumuladoPorItem.get(item.id) || {
      quantidade: 0,
      valor: 0,
      percentual: 0,
      percentualTotal: 0,
    };

    const quantidadeTotal = Number(item.quantidade || 0);
    const precoUnitario = Number(item.precoUnitarioVenda || 0);
    const precoTotal = Number(item.precoTotalVenda || 0);

    const linha: any[] = [
      item.codigo,
      item.referencia || '',
      indentacao + item.discriminacao,
      item.unidade || '',
      quantidadeTotal,
      precoUnitario,
      precoTotal,
    ];

    // Adicionar colunas das medições selecionadas (4 colunas por medição)
    medicoesSelecionadas.forEach((medicao) => {
      const itemMedicao = medicao.itens.find((i: any) => i.itemOrcamentoId === item.id);
      const quantidade = itemMedicao ? Number(itemMedicao.quantidadePrevista || 0) : 0;
      const percentualQuantidade = quantidadeTotal > 0 ? (quantidade / quantidadeTotal) * 100 : 0;
      const valorMedicao = quantidade * precoUnitario;
      const percentualValor = precoTotal > 0 ? (valorMedicao / precoTotal) * 100 : 0;
      
      linha.push(
        quantidade,
        percentualQuantidade / 100, // Dividir por 100 para formato percentual
        valorMedicao,
        percentualValor / 100 // Dividir por 100 para formato percentual
      );
    });

    // Colunas de acumulado (4 colunas)
    const percentualQuantidadeAcumulado = quantidadeTotal > 0 ? (acumulado.quantidade / quantidadeTotal) * 100 : 0;
    const percentualValorAcumulado = precoTotal > 0 ? (acumulado.valor / precoTotal) * 100 : 0;
    
    linha.push(
      acumulado.quantidade,
      percentualQuantidadeAcumulado / 100, // Dividir por 100 para formato percentual
      acumulado.valor,
      percentualValorAcumulado / 100 // Dividir por 100 para formato percentual
    );

    aoa.push(linha);
    tiposPorLinha.push(item.tipo === 'AGRUPADOR' ? 'agrupador' : 'item');

    // Processar filhos
    if (item.filhos && item.filhos.length > 0) {
      item.filhos.forEach((filhoId: string) => {
        processarHierarquia(filhoId, nivel + 1);
      });
    }
  };

  // Encontrar itens raiz
  const itensRaiz = itensParaExportar.filter(
    (item: any) => !item.parentId || !itensMap.has(item.parentId)
  );

  // Ordenar itens raiz
  itensRaiz.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));

  // Processar hierarquia
  itensRaiz.forEach((item: any) => {
    processarHierarquia(item.id, 0);
  });

  // Criar worksheet a partir do array
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ====== FORMATAÇÃO ======
  
  // Mesclar células do título
  if (!ws['!merges']) ws['!merges'] = [];
  const numColunasTotal = linha1Cabecalhos.length - 1;
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: numColunasTotal } }, // Título principal
    { s: { r: 1, c: 0 }, e: { r: 1, c: numColunasTotal } }, // Obra
    { s: { r: 2, c: 0 }, e: { r: 2, c: numColunasTotal } }, // Construtora
    { s: { r: 3, c: 0 }, e: { r: 3, c: numColunasTotal } }, // Data/Tipo
  );

  // Mesclar células dos cabeçalhos fixos (Item, Referência, etc.) para ocupar 2 linhas
  ws['!merges'].push(
    { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } }, // Item
    { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // Referência
    { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }, // Descrição
    { s: { r: 5, c: 3 }, e: { r: 6, c: 3 } }, // Unidade
    { s: { r: 5, c: 4 }, e: { r: 6, c: 4 } }, // Quantidade
    { s: { r: 5, c: 5 }, e: { r: 6, c: 5 } }, // Preço Unit.
    { s: { r: 5, c: 6 }, e: { r: 6, c: 6 } }, // Preço Total
  );

  // Mesclar células das medições na linha 1 do cabeçalho (colspan 4)
  let colIdx = 7;
  medicoesSelecionadas.forEach(() => {
    ws['!merges'].push({ s: { r: 5, c: colIdx }, e: { r: 5, c: colIdx + 3 } });
    colIdx += 4;
  });
  
  // Mesclar células do acumulado na linha 1 do cabeçalho (colspan 4)
  ws['!merges'].push({ s: { r: 5, c: colIdx }, e: { r: 5, c: colIdx + 3 } });

  // Aplicar estilos aos títulos
  aplicarEstilosTitulo(ws, 'A1', numColunasTotal);
  aplicarEstilosSubtitulo(ws, 'A2');
  aplicarEstilosSubtitulo(ws, 'A3');
  aplicarEstilosSubtitulo(ws, 'A4');
  
  // Aplicar estilos aos cabeçalhos (linhas 5 e 6)
  aplicarEstilosCabecalho(ws, 5, linha1Cabecalhos.length);
  aplicarEstilosCabecalho(ws, 6, linha2Cabecalhos.length);
  
  // Aplicar estilos aos dados
  const totalLinhas = aoa.length;
  for (let r = linhaInicioDados; r < totalLinhas; r++) {
    const tipoLinha = tiposPorLinha[r - linhaInicioDados];
    const ehAgrupador = tipoLinha === 'agrupador';
    
    for (let c = 0; c < linha2Cabecalhos.length; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddress];
      
      if (cell) {
        // Bordas em todas as células
        aplicarBordas(cell);
        
        // Formatação de números
        if (c === 4) {
          // Quantidade
          cell.z = '#,##0.00';
          cell.t = 'n';
        } else if (c === 5) {
          // Preço Unitário
          cell.z = 'R$ #,##0.00';
          cell.t = 'n';
        } else if (c === 6) {
          // Preço Total
          cell.z = 'R$ #,##0.00';
          cell.t = 'n';
        } else if (c >= 7) {
          // Colunas de medições e acumulado
          const colRelativa = (c - 7) % 4;
          if (colRelativa === 0) {
            // Quant.
            cell.z = '#,##0.00';
            cell.t = 'n';
          } else if (colRelativa === 1) {
            // Quant.(%)
            cell.z = '0.00%';
            cell.t = 'n';
          } else if (colRelativa === 2) {
            // Total (R$)
            cell.z = 'R$ #,##0.00';
            cell.t = 'n';
          } else if (colRelativa === 3) {
            // Total (%)
            cell.z = '0.00%';
            cell.t = 'n';
          }
        }
        
        // Formatação especial para agrupadores
        if (ehAgrupador) {
          if (!cell.s) cell.s = {};
          if (!cell.s.font) cell.s.font = {};
          cell.s.font.bold = true;
          if (!cell.s.fill) cell.s.fill = {};
          cell.s.fill.fgColor = { rgb: 'E7E6E6' };
        }
        
        // Aplicar cor baseada no percentual acumulado (coluna de Total (%) do acumulado)
        const colunaPercentualAcumulado = 7 + (medicoesSelecionadas.length * 4) + 3;
        if (c === colunaPercentualAcumulado && !ehAgrupador) {
          const percentual = typeof cell.v === 'number' ? cell.v * 100 : 0;
          aplicarCorPorPercentual(cell, percentual);
        }
      }
    }
  }

  // Ajustar larguras das colunas
  const colWidths = [
    { wch: 12 },  // Item
    { wch: 15 },  // Referência
    { wch: 50 },  // Descrição
    { wch: 10 },  // Unidade
    { wch: 12 },  // Quantidade
    { wch: 15 },  // Preço Unit.
    { wch: 15 },  // Preço Total
  ];
  
  // Larguras para cada medição (4 colunas)
  medicoesSelecionadas.forEach(() => {
    colWidths.push({ wch: 12 }); // Quant.
    colWidths.push({ wch: 12 }); // Quant.(%)
    colWidths.push({ wch: 15 }); // Total (R$)
    colWidths.push({ wch: 12 }); // Total (%)
  });
  
  // Larguras para acumulado (4 colunas)
  colWidths.push({ wch: 12 }); // Quant.
  colWidths.push({ wch: 12 }); // Quant.(%)
  colWidths.push({ wch: 15 }); // Total (R$)
  colWidths.push({ wch: 12 }); // Total (%)
  
  ws['!cols'] = colWidths;

  // Congelar painéis (fixar cabeçalho e primeiras 3 colunas)
  ws['!freeze'] = { xSplit: 3, ySplit: 7 };

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, ws, 'Visão EAP Contratual');
}

// ========================================
// PLANILHA GERENCIAL
// ========================================

async function gerarPlanilhaGerencial(
  workbook: XLSX.WorkBook,
  obraId: string,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida'
) {
  // Buscar versão gerencial
  const versaoGerencial = await db.versaoVisaoGerencial.findFirst({
    where: {
      obraId,
      status: 'ATIVA',
    },
    include: {
      itens: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!versaoGerencial || !versaoGerencial.itens || versaoGerencial.itens.length === 0) {
    return; // Não adiciona aba se não houver dados
  }

  // Buscar dados da obra para o cabeçalho
  const obra = await db.obra.findUnique({
    where: { id: obraId },
    select: {
      codigo: true,
      nome: true,
      construtora: {
        select: {
          razaoSocial: true,
        },
      },
    },
  });

  // Buscar itens de categorização para mapear etapa/subetapa/serviço
  const itensCategorizacao = await db.itemCategorizacao.findMany({
    where: {
      versaoCategorizacao: {
        obraId,
        status: 'ATIVA',
      },
    },
  });

  // Agrupar por etapa > subetapa > serviço
  const agrupamento = new Map<string, any>();

  // Processar itens das medições
  todasMedicoes.forEach((medicao) => {
    if (medicao.numero > ultimaMedicaoNumero) return;

    medicao.itens.forEach((item: any) => {
      const etapa = item.etapa || 'Sem Etapa';
      const subEtapa = item.subEtapa || 'Sem SubEtapa';
      const servico = item.servicoSimplificado || 'Sem Serviço';

      const chave = `${etapa}|||${subEtapa}|||${servico}`;

      if (!agrupamento.has(chave)) {
        agrupamento.set(chave, {
          etapa,
          subEtapa,
          servico,
          quantidadeTotal: 0,
          valorTotal: 0,
          medicoes: new Map(),
          acumulado: 0,
          valorAcumulado: 0,
        });
      }

      const grupo = agrupamento.get(chave);
      
      // Acumular valores
      if (medicao.numero <= ultimaMedicaoNumero) {
        grupo.acumulado += Number(item.quantidadePrevista || 0);
        grupo.valorAcumulado += Number(item.valorPrevisto || 0);
      }

      // Valores por medição selecionada
      if (medicoesSelecionadas.find(m => m.id === medicao.id)) {
        const medicaoData = grupo.medicoes.get(medicao.numero) || { quantidade: 0, valor: 0 };
        medicaoData.quantidade += Number(item.quantidadePrevista || 0);
        medicaoData.valor += Number(item.valorPrevisto || 0);
        grupo.medicoes.set(medicao.numero, medicaoData);
      }
    });
  });

  // Filtrar se tipo EAP for resumida (apenas grupos com medição)
  let gruposParaExportar = Array.from(agrupamento.values());
  if (tipoEap === 'resumida') {
    gruposParaExportar = gruposParaExportar.filter(g => g.acumulado > 0);
  }

  // Ordenar por etapa, subetapa, servico
  gruposParaExportar.sort((a, b) => {
    if (a.etapa !== b.etapa) return a.etapa.localeCompare(b.etapa);
    if (a.subEtapa !== b.subEtapa) return a.subEtapa.localeCompare(b.subEtapa);
    return a.servico.localeCompare(b.servico);
  });

  // Preparar dados para o Excel usando array of arrays
  const aoa: any[][] = [];
  
  // CABEÇALHO - Linhas 0-4
  const tipoTexto = tipoEap === 'completa' ? 'COMPLETA' : 'RESUMIDA';
  aoa.push(['PREVISÕES DE MEDIÇÕES - VISÃO EAP GERENCIAL']);
  aoa.push([`Obra: ${obra?.codigo} - ${obra?.nome}`]);
  aoa.push([`Construtora: ${obra?.construtora.razaoSocial}`]);
  aoa.push([`Data: ${new Date().toLocaleDateString('pt-BR')} | Tipo: EAP ${tipoTexto} | Acumulado até ${ultimaMedicaoNumero}ª Medição`]);
  aoa.push([]); // Linha vazia

  // Cabeçalhos das colunas - Linha 5 e 6 (duas linhas)
  const linha1Cabecalhos = ['Etapa', 'SubEtapa', 'Serviço Simplificado'];
  
  // Adicionar medições selecionadas
  medicoesSelecionadas.forEach((medicao) => {
    linha1Cabecalhos.push(`${medicao.numero}ª Medição`, '');
  });
  
  // Adicionar acumulado
  linha1Cabecalhos.push('Acumulado', '');
  
  aoa.push(linha1Cabecalhos);

  // Linha 2 dos cabeçalhos (sub-colunas das medições)
  const linha2Cabecalhos = ['', '', ''];
  
  // Sub-colunas para cada medição
  medicoesSelecionadas.forEach(() => {
    linha2Cabecalhos.push('Quant.', 'Total (R$)');
  });
  
  // Sub-colunas para acumulado
  linha2Cabecalhos.push('Quant.', 'Total (R$)');
  
  aoa.push(linha2Cabecalhos);

  const linhaInicioDados = 7;

  // Armazenar tipo de linha para formatação
  const tiposPorLinha: ('etapa' | 'subetapa' | 'servico')[] = [];

  // Construir dados
  let etapaAtual = '';
  let subEtapaAtual = '';

  gruposParaExportar.forEach((grupo) => {
    // Adicionar linha de etapa se mudou
    if (grupo.etapa !== etapaAtual) {
      etapaAtual = grupo.etapa;
      subEtapaAtual = '';
      
      const linhaEtapa: any[] = [grupo.etapa, '', ''];
      medicoesSelecionadas.forEach(() => {
        linhaEtapa.push('', '');
      });
      linhaEtapa.push('', '');
      aoa.push(linhaEtapa);
      tiposPorLinha.push('etapa');
    }

    // Adicionar linha de subetapa se mudou
    if (grupo.subEtapa !== subEtapaAtual) {
      subEtapaAtual = grupo.subEtapa;
      
      const linhaSubEtapa: any[] = ['', '  ' + grupo.subEtapa, ''];
      medicoesSelecionadas.forEach(() => {
        linhaSubEtapa.push('', '');
      });
      linhaSubEtapa.push('', '');
      aoa.push(linhaSubEtapa);
      tiposPorLinha.push('subetapa');
    }

    // Adicionar linha de serviço
    const linhaServico: any[] = ['', '', '    ' + grupo.servico];
    medicoesSelecionadas.forEach((medicao) => {
      const medicaoData = grupo.medicoes.get(medicao.numero) || { quantidade: 0, valor: 0 };
      linhaServico.push(medicaoData.quantidade, medicaoData.valor);
    });
    linhaServico.push(grupo.acumulado, grupo.valorAcumulado);
    aoa.push(linhaServico);
    tiposPorLinha.push('servico');
  });

  // Criar worksheet a partir do array
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ====== FORMATAÇÃO ======
  
  // Mesclar células do título
  if (!ws['!merges']) ws['!merges'] = [];
  const numColunasTotal = linha1Cabecalhos.length - 1;
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: numColunasTotal } }, // Título principal
    { s: { r: 1, c: 0 }, e: { r: 1, c: numColunasTotal } }, // Obra
    { s: { r: 2, c: 0 }, e: { r: 2, c: numColunasTotal } }, // Construtora
    { s: { r: 3, c: 0 }, e: { r: 3, c: numColunasTotal } }, // Data/Tipo
  );

  // Mesclar células dos cabeçalhos fixos (Etapa, SubEtapa, Serviço) para ocupar 2 linhas
  ws['!merges'].push(
    { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } }, // Etapa
    { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } }, // SubEtapa
    { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }, // Serviço Simplificado
  );

  // Mesclar células das medições na linha 1 do cabeçalho (colspan 2)
  let colIdx = 3;
  medicoesSelecionadas.forEach(() => {
    ws['!merges'].push({ s: { r: 5, c: colIdx }, e: { r: 5, c: colIdx + 1 } });
    colIdx += 2;
  });
  
  // Mesclar células do acumulado na linha 1 do cabeçalho (colspan 2)
  ws['!merges'].push({ s: { r: 5, c: colIdx }, e: { r: 5, c: colIdx + 1 } });

  // Aplicar estilos aos títulos
  aplicarEstilosTitulo(ws, 'A1', numColunasTotal);
  aplicarEstilosSubtitulo(ws, 'A2');
  aplicarEstilosSubtitulo(ws, 'A3');
  aplicarEstilosSubtitulo(ws, 'A4');
  
  // Aplicar estilos aos cabeçalhos (linhas 5 e 6)
  aplicarEstilosCabecalho(ws, 5, linha1Cabecalhos.length);
  aplicarEstilosCabecalho(ws, 6, linha2Cabecalhos.length);
  
  // Aplicar estilos aos dados
  const totalLinhas = aoa.length;
  for (let r = linhaInicioDados; r < totalLinhas; r++) {
    const tipoLinha = tiposPorLinha[r - linhaInicioDados];
    
    for (let c = 0; c < linha2Cabecalhos.length; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellAddress];
      
      if (cell) {
        // Bordas em todas as células
        aplicarBordas(cell);
        
        // Formatação de números nas colunas de medições e acumulado
        if (c >= 3) {
          const colRelativa = (c - 3) % 2;
          if (colRelativa === 0) {
            // Quant.
            cell.z = '#,##0.00';
            if (typeof cell.v === 'number') {
              cell.t = 'n';
            }
          } else {
            // Total (R$)
            cell.z = 'R$ #,##0.00';
            if (typeof cell.v === 'number') {
              cell.t = 'n';
            }
          }
        }
        
        // Destacar etapas
        if (tipoLinha === 'etapa') {
          if (!cell.s) cell.s = {};
          if (!cell.s.font) cell.s.font = {};
          cell.s.font.bold = true;
          cell.s.font.sz = 12;
          if (!cell.s.fill) cell.s.fill = {};
          cell.s.fill.fgColor = { rgb: 'D9E1F2' };
        } else if (tipoLinha === 'subetapa') {
          if (!cell.s) cell.s = {};
          if (!cell.s.font) cell.s.font = {};
          cell.s.font.bold = true;
          if (!cell.s.fill) cell.s.fill = {};
          cell.s.fill.fgColor = { rgb: 'E7E6E6' };
        }
      }
    }
  }

  // Ajustar larguras das colunas
  const colWidths = [
    { wch: 35 }, // Etapa
    { wch: 35 }, // SubEtapa
    { wch: 45 }, // Serviço Simplificado
  ];
  
  // Larguras para cada medição (2 colunas)
  medicoesSelecionadas.forEach(() => {
    colWidths.push({ wch: 12 }); // Quant.
    colWidths.push({ wch: 15 }); // Total (R$)
  });
  
  // Larguras para acumulado (2 colunas)
  colWidths.push({ wch: 12 }); // Quant.
  colWidths.push({ wch: 15 }); // Total (R$)
  
  ws['!cols'] = colWidths;

  // Congelar painéis
  ws['!freeze'] = { xSplit: 1, ySplit: 7 };

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, ws, 'Visão EAP Gerencial');
}

// ========================================
// ABA RESUMO
// ========================================

function gerarAbaResumo(
  workbook: XLSX.WorkBook,
  obra: any,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida'
) {
  const aoa: any[][] = [];

  // Título
  aoa.push(['RESUMO DA EXPORTAÇÃO DE MEDIÇÕES']);
  aoa.push([]);

  // Informações da obra
  aoa.push(['INFORMAÇÕES DA OBRA']);
  aoa.push(['Código da Obra:', obra.codigo]);
  aoa.push(['Nome da Obra:', obra.nome]);
  aoa.push(['Construtora:', obra.construtora.razaoSocial]);
  aoa.push(['Data de Exportação:', new Date().toLocaleDateString('pt-BR')]);
  aoa.push(['Tipo de Exportação:', tipoEap === 'completa' ? 'EAP Completa' : 'EAP Resumida (Apenas Itens Medidos)']);
  aoa.push([]);

  // Informações das medições
  aoa.push(['MEDIÇÕES EXPORTADAS']);
  aoa.push(['Medições Selecionadas:', medicoesSelecionadas.map(m => `${m.numero}ª`).join(', ')]);
  aoa.push(['Acumulado calculado até:', `${ultimaMedicaoNumero}ª Medição`]);
  aoa.push([]);

  // Totais por medição
  aoa.push(['VALORES POR MEDIÇÃO']);
  aoa.push(['Medição', 'Nome', 'Valor Total']);

  medicoesSelecionadas.forEach((medicao) => {
    const valorTotal = medicao.itens.reduce((sum: number, item: any) => {
      return sum + Number(item.valorPrevisto || 0);
    }, 0);

    aoa.push([`${medicao.numero}ª Medição`, medicao.nome, valorTotal]);
  });

  aoa.push([]);

  // Total acumulado
  const valorAcumuladoTotal = todasMedicoes
    .filter(m => m.numero <= ultimaMedicaoNumero)
    .reduce((sum, medicao) => {
      return sum + medicao.itens.reduce((itemSum: number, item: any) => {
        return itemSum + Number(item.valorPrevisto || 0);
      }, 0);
    }, 0);

  aoa.push(['TOTAL ACUMULADO', '', valorAcumuladoTotal]);

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // ====== FORMATAÇÃO ======
  
  // Mesclar células do título
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Título principal
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // Título seção obra
    { s: { r: 9, c: 0 }, e: { r: 9, c: 2 } }, // Título seção medições
    { s: { r: 13, c: 0 }, e: { r: 13, c: 2 } }, // Título valores
  );

  // Estilo do título principal
  aplicarEstilosTitulo(ws, 'A1', 2);

  // Estilos dos títulos de seção
  ['A3', 'A10', 'A14'].forEach(cellAddr => {
    const cell = ws[cellAddr];
    if (cell) {
      if (!cell.s) cell.s = {};
      if (!cell.s.font) cell.s.font = {};
      cell.s.font.bold = true;
      cell.s.font.sz = 12;
      if (!cell.s.fill) cell.s.fill = {};
      cell.s.fill.fgColor = { rgb: '4472C4' };
      if (!cell.s.font.color) cell.s.font.color = {};
      cell.s.font.color.rgb = 'FFFFFF';
      aplicarBordas(cell);
    }
  });

  // Cabeçalho da tabela de valores
  ['A15', 'B15', 'C15'].forEach(cellAddr => {
    const cell = ws[cellAddr];
    if (cell) {
      if (!cell.s) cell.s = {};
      if (!cell.s.font) cell.s.font = {};
      cell.s.font.bold = true;
      if (!cell.s.fill) cell.s.fill = {};
      cell.s.fill.fgColor = { rgb: 'D9E1F2' };
      aplicarBordas(cell);
    }
  });

  // Formatar valores monetários
  const linhaInicioValores = 15; // Começa na linha 16 (índice 15)
  const numMedicoes = medicoesSelecionadas.length;
  for (let i = 0; i <= numMedicoes; i++) {
    const cellAddr = `C${linhaInicioValores + 1 + i}`;
    const cell = ws[cellAddr];
    if (cell) {
      cell.z = 'R$ #,##0.00';
      cell.t = 'n';
      aplicarBordas(cell);
    }
    // Bordas nas outras colunas também
    ['A', 'B'].forEach(col => {
      const addr = `${col}${linhaInicioValores + 1 + i}`;
      if (ws[addr]) {
        aplicarBordas(ws[addr]);
      }
    });
  }

  // Destaque da linha de total
  const linhaTotalIdx = linhaInicioValores + numMedicoes + 2;
  ['A', 'B', 'C'].forEach(col => {
    const cellAddr = `${col}${linhaTotalIdx}`;
    const cell = ws[cellAddr];
    if (cell) {
      if (!cell.s) cell.s = {};
      if (!cell.s.font) cell.s.font = {};
      cell.s.font.bold = true;
      cell.s.font.sz = 12;
      if (!cell.s.fill) cell.s.fill = {};
      cell.s.fill.fgColor = { rgb: 'FFC000' };
      if (col === 'C') {
        cell.z = 'R$ #,##0.00';
        cell.t = 'n';
      }
      aplicarBordas(cell);
    }
  });

  // Ajustar larguras
  ws['!cols'] = [
    { wch: 30 }, // Campo
    { wch: 40 }, // Descrição/Nome
    { wch: 20 }, // Valor
  ];

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, ws, 'Resumo');
}

// ========================================
// FUNÇÕES DE ESTILO
// ========================================

function aplicarEstilosTitulo(ws: XLSX.WorkSheet, cellAddr: string, numColunas: number) {
  const cell = ws[cellAddr];
  if (!cell) return;
  
  if (!cell.s) cell.s = {};
  
  // Fonte
  cell.s.font = {
    bold: true,
    sz: 16,
    color: { rgb: 'FFFFFF' }
  };
  
  // Preenchimento
  cell.s.fill = {
    fgColor: { rgb: '1F4E78' }
  };
  
  // Alinhamento
  cell.s.alignment = {
    horizontal: 'center',
    vertical: 'center'
  };
  
  // Borda
  aplicarBordas(cell);
}

function aplicarEstilosSubtitulo(ws: XLSX.WorkSheet, cellAddr: string) {
  const cell = ws[cellAddr];
  if (!cell) return;
  
  if (!cell.s) cell.s = {};
  
  cell.s.font = {
    bold: true,
    sz: 11
  };
  
  cell.s.fill = {
    fgColor: { rgb: 'E7E6E6' }
  };
  
  aplicarBordas(cell);
}

function aplicarEstilosCabecalho(ws: XLSX.WorkSheet, linha: number, numColunas: number) {
  for (let c = 0; c < numColunas; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: linha, c });
    const cell = ws[cellAddr];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      
      cell.s.font = {
        bold: true,
        color: { rgb: 'FFFFFF' },
        sz: 11
      };
      
      cell.s.fill = {
        fgColor: { rgb: '4472C4' }
      };
      
      cell.s.alignment = {
        horizontal: 'center',
        vertical: 'center'
      };
      
      aplicarBordas(cell);
    }
  }
}

function aplicarBordas(cell: any) {
  if (!cell.s) cell.s = {};
  
  cell.s.border = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };
}

function aplicarCorPorPercentual(cell: any, percentual: number) {
  if (!cell.s) cell.s = {};
  if (!cell.s.font) cell.s.font = {};
  
  // Aplicar cores baseadas no percentual (igual à página)
  if (percentual === 0) {
    cell.s.font.color = { rgb: '94A3B8' }; // slate-400
  } else if (percentual < 25) {
    cell.s.font.color = { rgb: 'EF4444' }; // red-500
  } else if (percentual < 50) {
    cell.s.font.color = { rgb: 'F97316' }; // orange-500
  } else if (percentual < 75) {
    cell.s.font.color = { rgb: 'EAB308' }; // yellow-500
  } else if (percentual < 100) {
    cell.s.font.color = { rgb: '3B82F6' }; // blue-500
  } else {
    cell.s.font.color = { rgb: '22C55E' }; // green-500
    cell.s.font.bold = true;
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function calcularAcumuladoPorItem(
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  itensOrcamento: any[]
): Map<string, { quantidade: number; valor: number; percentual: number; percentualTotal: number }> {
  const acumuladoPorItem = new Map();

  // Inicializar mapa com todos os itens do orçamento
  itensOrcamento.forEach((item) => {
    acumuladoPorItem.set(item.id, {
      quantidade: 0,
      valor: 0,
      percentual: 0,
      percentualTotal: 0,
    });
  });

  todasMedicoes.forEach((medicao) => {
    if (medicao.numero > ultimaMedicaoNumero) return;

    medicao.itens.forEach((item: any) => {
      const itemId = item.itemOrcamentoId || item.itemCustoOrcadoId || item.id;
      
      if (!acumuladoPorItem.has(itemId)) {
        acumuladoPorItem.set(itemId, {
          quantidade: 0,
          valor: 0,
          quantidadeTotal: 0,
          percentual: 0,
          percentualTotal: 0,
        });
      }

      const acumulado = acumuladoPorItem.get(itemId);
      acumulado.quantidade += Number(item.quantidadePrevista || 0);
      acumulado.valor += Number(item.valorPrevisto || 0);
    });
  });

  // Calcular percentuais baseado nos itens do orçamento
  acumuladoPorItem.forEach((acumulado, itemId) => {
    const itemOrcamento = itensOrcamento.find(i => i.id === itemId);
    if (itemOrcamento) {
      const quantidadeTotal = Number(itemOrcamento.quantidade || 0);
      const valorTotal = Number(itemOrcamento.precoTotalVenda || 0);
      
      if (quantidadeTotal > 0) {
        acumulado.percentual = (acumulado.quantidade / quantidadeTotal) * 100;
      }
      
      if (valorTotal > 0) {
        acumulado.percentualTotal = (acumulado.valor / valorTotal) * 100;
      }
    }
  });

  return acumuladoPorItem;
}

function filtrarItensComMedicao(
  itens: any[],
  acumuladoPorItem: Map<string, any>
): any[] {
  const itensComMedicao = new Set<string>();
  const agrupadoresTotalizadores = new Set<string>();

  // 1. Identificar itens que têm medição
  itens.forEach((item) => {
    const acumulado = acumuladoPorItem.get(item.id);
    if (item.tipo === 'ITEM' && acumulado && acumulado.quantidade > 0) {
      itensComMedicao.add(item.id);
      // Adicionar todos os pais na hierarquia
      adicionarPaisRecursivamente(item.parentId, itens, agrupadoresTotalizadores);
    }
  });

  // 2. Filtrar apenas itens com medição + seus agrupadores
  return itens.filter(
    (item) => itensComMedicao.has(item.id) || agrupadoresTotalizadores.has(item.id)
  );
}

function adicionarPaisRecursivamente(
  parentId: string | null,
  itens: any[],
  agrupadoresTotalizadores: Set<string>
): void {
  if (!parentId) return;

  agrupadoresTotalizadores.add(parentId);

  const parent = itens.find((i) => i.id === parentId);
  if (parent && parent.parentId) {
    adicionarPaisRecursivamente(parent.parentId, itens, agrupadoresTotalizadores);
  }
}

// ========================================
// FUNÇÕES AUXILIARES PARA PDF
// ========================================

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getCorPorPercentual(percentual: number): string {
  if (percentual === 0) return '#94A3B8';      // slate-400
  if (percentual < 25) return '#EF4444';       // red-500
  if (percentual < 50) return '#F97316';       // orange-500
  if (percentual < 75) return '#EAB308';       // yellow-500
  if (percentual < 100) return '#3B82F6';      // blue-500
  return '#22C55E';                            // green-500
}

// Estilos globais para PDF
const pdfStyles = {
  headerTitle: {
    fontSize: 14,
    bold: true,
    color: '#1F4E78'
  },
  headerInfo: {
    fontSize: 9,
    color: '#64748b'
  },
  pageNumber: {
    fontSize: 9,
    color: '#64748b'
  },
  tableHeader: {
    fontSize: 8,
    bold: true,
    color: 'white',
    fillColor: '#4472C4',
    alignment: 'center'
  },
  tableHeaderMedicao: {
    fontSize: 8,
    bold: true,
    color: 'white',
    fillColor: '#3B82F6',
    alignment: 'center'
  },
  tableHeaderAcumulado: {
    fontSize: 8,
    bold: true,
    color: 'white',
    fillColor: '#9333EA',
    alignment: 'center'
  },
  tableSubHeader: {
    fontSize: 7,
    bold: true,
    color: 'white',
    fillColor: '#4472C4',
    alignment: 'center'
  },
  agrupador: {
    fontSize: 8,
    bold: true
  },
  normal: {
    fontSize: 8
  },
  number: {
    fontSize: 8,
    alignment: 'right'
  },
  currency: {
    fontSize: 8,
    alignment: 'right'
  },
  percent: {
    fontSize: 8,
    alignment: 'right'
  },
  totalLabel: {
    fontSize: 9,
    bold: true,
    alignment: 'center'
  },
  totalNumber: {
    fontSize: 8,
    bold: true,
    alignment: 'right'
  },
  totalCurrency: {
    fontSize: 8,
    bold: true,
    alignment: 'right'
  },
  totalPercent: {
    fontSize: 8,
    bold: true,
    alignment: 'right'
  },
  footer: {
    fontSize: 8,
    color: '#64748b',
    italics: true
  }
};

// ========================================
// GERAÇÃO DE PDF
// ========================================

async function gerarExportacaoPDF(
  obra: any,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida',
  planilhas: string[]
): Promise<NextResponse> {
  const contentArray: any[] = [];
  
  // Gerar cada planilha selecionada
  for (const planilha of planilhas) {
    if (planilha === 'contratual') {
      const contentContratual = await gerarPDFContratual(
        obra,
        medicoesSelecionadas,
        todasMedicoes,
        ultimaMedicaoNumero,
        tipoEap
      );
      contentArray.push(contentContratual);
    }
    if (planilha === 'gerencial') {
      const contentGerencial = await gerarPDFGerencial(
        obra.id,
        obra,
        medicoesSelecionadas,
        todasMedicoes,
        ultimaMedicaoNumero,
        tipoEap
      );
      contentArray.push(contentGerencial);
    }
  }
  
  // Definição do documento
  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 80, 40, 60],
    content: contentArray,
    styles: pdfStyles,
    defaultStyle: {
      fontSize: 8
    }
  };
  
  // Gerar PDF
  return new Promise<NextResponse>((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer) => {
        const tipoTexto = tipoEap === 'completa' ? 'completa' : 'resumida';
        const fileName = `medicoes-${tipoTexto}-${obra.codigo}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        resolve(new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        }));
      });
    } catch (error) {
      reject(error);
    }
  });
}

// ========================================
// PDF CONTRATUAL
// ========================================

async function gerarPDFContratual(
  obra: any,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida'
): Promise<any> {
  // Buscar versão ativa do orçamento
  const versaoAtiva = await db.versaoOrcamento.findFirst({
    where: {
      obraId: obra.id,
      status: 'ATIVA',
    },
    include: {
      itens: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!versaoAtiva || !versaoAtiva.itens || versaoAtiva.itens.length === 0) {
    return { text: 'Sem dados de orçamento', style: 'normal' };
  }

  // Calcular valores acumulados
  const acumuladoPorItem = calcularAcumuladoPorItem(todasMedicoes, ultimaMedicaoNumero, versaoAtiva.itens);

  // Filtrar itens se tipo EAP for resumida
  let itensParaExportar = versaoAtiva.itens;
  if (tipoEap === 'resumida') {
    itensParaExportar = filtrarItensComMedicao(versaoAtiva.itens, acumuladoPorItem);
  }

  // Construir hierarquia
  const itensMap = new Map();
  const filhosMap = new Map();

  itensParaExportar.forEach((item: any) => {
    itensMap.set(item.id, { ...item, filhos: [] });

    if (item.parentId) {
      if (!filhosMap.has(item.parentId)) {
        filhosMap.set(item.parentId, []);
      }
      filhosMap.get(item.parentId).push({
        id: item.id,
        ordem: item.ordem || 0,
      });
    }
  });

  // Ordenar filhos
  filhosMap.forEach((filhos, parentId) => {
    filhos.sort((a: any, b: any) => a.ordem - b.ordem);
    const parent = itensMap.get(parentId);
    if (parent) {
      parent.filhos = filhos.map((f: any) => f.id);
    }
  });

  // Montar cabeçalho da tabela
  const numMedicoes = medicoesSelecionadas.length;
  
  // Linha 1 do cabeçalho
  const headerRow1: any[] = [
    { text: 'Item', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Referência', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Descrição', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Unidade', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Quantidade', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Preço Unit.', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
    { text: 'Preço Total', rowSpan: 2, style: 'tableHeader', fillColor: '#4472C4' },
  ];
  
  // Adicionar medições
  medicoesSelecionadas.forEach((medicao) => {
    headerRow1.push({ text: `${medicao.numero}ª Medição`, colSpan: 4, style: 'tableHeaderMedicao', fillColor: '#3B82F6' });
    headerRow1.push({}, {}, {}); // spans
  });
  
  // Acumulado
  headerRow1.push({ text: 'Acumulado', colSpan: 4, style: 'tableHeaderAcumulado', fillColor: '#9333EA' });
  headerRow1.push({}, {}, {}); // spans
  
  // Linha 2 do cabeçalho
  const headerRow2: any[] = [
    {}, {}, {}, {}, {}, {}, {}, // spans da linha 1
  ];
  
  // Sub-colunas para cada medição
  medicoesSelecionadas.forEach(() => {
    headerRow2.push(
      { text: 'Quant.', style: 'tableSubHeader', fillColor: '#4472C4' },
      { text: 'Quant.(%)', style: 'tableSubHeader', fillColor: '#4472C4' },
      { text: 'Total(R$)', style: 'tableSubHeader', fillColor: '#4472C4' },
      { text: 'Total(%)', style: 'tableSubHeader', fillColor: '#4472C4' }
    );
  });
  
  // Sub-colunas para acumulado
  headerRow2.push(
    { text: 'Quant.', style: 'tableSubHeader', fillColor: '#4472C4' },
    { text: 'Quant.(%)', style: 'tableSubHeader', fillColor: '#4472C4' },
    { text: 'Total(R$)', style: 'tableSubHeader', fillColor: '#4472C4' },
    { text: 'Total(%)', style: 'tableSubHeader', fillColor: '#4472C4' }
  );

  const tableBody: any[] = [headerRow1, headerRow2];
  const tiposPorLinha: ('agrupador' | 'item')[] = [];

  // Função recursiva para processar hierarquia
  const processarHierarquia = (itemId: string, nivel: number = 0): void => {
    const item = itensMap.get(itemId);
    if (!item) return;

    const indentacao = '  '.repeat(nivel);
    const acumulado = acumuladoPorItem.get(item.id) || {
      quantidade: 0,
      valor: 0,
      percentual: 0,
      percentualTotal: 0,
    };

    const quantidadeTotal = Number(item.quantidade || 0);
    const precoUnitario = Number(item.precoUnitarioVenda || 0);
    const precoTotal = Number(item.precoTotalVenda || 0);

    const ehAgrupador = item.tipo === 'AGRUPADOR';
    const cellFillColor = ehAgrupador ? '#E7E6E6' : undefined;

    const linha: any[] = [
      { text: item.codigo, style: ehAgrupador ? 'agrupador' : 'normal', fillColor: cellFillColor },
      { text: item.referencia || '', style: ehAgrupador ? 'agrupador' : 'normal', fillColor: cellFillColor },
      { text: indentacao + item.discriminacao, style: ehAgrupador ? 'agrupador' : 'normal', fillColor: cellFillColor },
      { text: item.unidade || '', style: 'normal', fillColor: cellFillColor },
      { text: formatNumber(quantidadeTotal), style: 'number', fillColor: cellFillColor },
      { text: formatCurrency(precoUnitario), style: 'currency', fillColor: cellFillColor },
      { text: formatCurrency(precoTotal), style: 'currency', fillColor: cellFillColor },
    ];

    // Dados por medição
    medicoesSelecionadas.forEach((medicao) => {
      const itemMedicao = medicao.itens.find((i: any) => i.itemOrcamentoId === item.id);
      const quantidade = itemMedicao ? Number(itemMedicao.quantidadePrevista || 0) : 0;
      const percentualQuantidade = quantidadeTotal > 0 ? (quantidade / quantidadeTotal) * 100 : 0;
      const valorMedicao = quantidade * precoUnitario;
      const percentualValor = precoTotal > 0 ? (valorMedicao / precoTotal) * 100 : 0;
      
      linha.push(
        { text: formatNumber(quantidade), style: 'number', fillColor: cellFillColor },
        { text: formatPercent(percentualQuantidade), style: 'percent', fillColor: cellFillColor },
        { text: formatCurrency(valorMedicao), style: 'currency', fillColor: cellFillColor },
        { text: formatPercent(percentualValor), style: 'percent', fillColor: cellFillColor }
      );
    });

    // Dados acumulados
    const percentualQuantidadeAcumulado = quantidadeTotal > 0 ? (acumulado.quantidade / quantidadeTotal) * 100 : 0;
    const percentualValorAcumulado = precoTotal > 0 ? (acumulado.valor / precoTotal) * 100 : 0;
    
    linha.push(
      { text: formatNumber(acumulado.quantidade), style: 'number', fillColor: cellFillColor },
      { text: formatPercent(percentualQuantidadeAcumulado), style: 'percent', fillColor: cellFillColor },
      { text: formatCurrency(acumulado.valor), style: 'currency', fillColor: cellFillColor },
      { 
        text: formatPercent(percentualValorAcumulado), 
        style: 'percent',
        color: getCorPorPercentual(percentualValorAcumulado),
        bold: percentualValorAcumulado >= 100,
        fillColor: cellFillColor
      }
    );

    tableBody.push(linha);
    tiposPorLinha.push(ehAgrupador ? 'agrupador' : 'item');

    // Processar filhos
    if (item.filhos && item.filhos.length > 0) {
      item.filhos.forEach((filhoId: string) => {
        processarHierarquia(filhoId, nivel + 1);
      });
    }
  };

  // Encontrar e processar itens raiz
  const itensRaiz = itensParaExportar.filter(
    (item: any) => !item.parentId || !itensMap.has(item.parentId)
  );
  itensRaiz.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
  itensRaiz.forEach((item: any) => {
    processarHierarquia(item.id, 0);
  });

  // Calcular larguras das colunas
  const colWidths = [50, 60, 180, 40, 50, 60, 65];
  medicoesSelecionadas.forEach(() => {
    colWidths.push(35, 35, 35, 35);
  });
  colWidths.push(35, 35, 35, 35);

  const tipoTexto = tipoEap === 'completa' ? 'COMPLETA' : 'RESUMIDA';

  return {
    stack: [
      {
        text: 'PREVISÕES DE MEDIÇÕES - VISÃO EAP CONTRATUAL',
        style: 'headerTitle',
        margin: [0, 0, 0, 5]
      },
      {
        text: `Obra: ${obra.codigo} - ${obra.nome}`,
        style: 'headerInfo',
        margin: [0, 0, 0, 2]
      },
      {
        text: `Construtora: ${obra.construtora.razaoSocial}`,
        style: 'headerInfo',
        margin: [0, 0, 0, 2]
      },
      {
        text: `Data: ${new Date().toLocaleDateString('pt-BR')} | Tipo: EAP ${tipoTexto} | Acumulado até ${ultimaMedicaoNumero}ª Medição`,
        style: 'headerInfo',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 2,
          widths: colWidths,
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#64748b',
          vLineColor: () => '#64748b',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2
        }
      }
    ]
  };
}

// ========================================
// PDF GERENCIAL
// ========================================

async function gerarPDFGerencial(
  obraId: string,
  obra: any,
  medicoesSelecionadas: any[],
  todasMedicoes: any[],
  ultimaMedicaoNumero: number,
  tipoEap: 'completa' | 'resumida'
): Promise<any> {
  // Buscar versão gerencial
  const versaoGerencial = await db.versaoVisaoGerencial.findFirst({
    where: {
      obraId,
      status: 'ATIVA',
    },
    include: {
      itens: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (!versaoGerencial || !versaoGerencial.itens || versaoGerencial.itens.length === 0) {
    return { text: 'Sem dados de visão gerencial', style: 'normal' };
  }

  // Agrupar por etapa > subetapa > serviço
  const agrupamento = new Map<string, any>();

  todasMedicoes.forEach((medicao) => {
    if (medicao.numero > ultimaMedicaoNumero) return;

    medicao.itens.forEach((item: any) => {
      const etapa = item.etapa || 'Sem Etapa';
      const subEtapa = item.subEtapa || 'Sem SubEtapa';
      const servico = item.servicoSimplificado || 'Sem Serviço';

      const chave = `${etapa}|||${subEtapa}|||${servico}`;

      if (!agrupamento.has(chave)) {
        agrupamento.set(chave, {
          etapa,
          subEtapa,
          servico,
          medicoes: new Map(),
          acumulado: 0,
          valorAcumulado: 0,
        });
      }

      const grupo = agrupamento.get(chave);
      
      // Acumular valores
      if (medicao.numero <= ultimaMedicaoNumero) {
        grupo.acumulado += Number(item.quantidadePrevista || 0);
        grupo.valorAcumulado += Number(item.valorPrevisto || 0);
      }

      // Valores por medição selecionada
      if (medicoesSelecionadas.find(m => m.id === medicao.id)) {
        const medicaoData = grupo.medicoes.get(medicao.numero) || { quantidade: 0, valor: 0 };
        medicaoData.quantidade += Number(item.quantidadePrevista || 0);
        medicaoData.valor += Number(item.valorPrevisto || 0);
        grupo.medicoes.set(medicao.numero, medicaoData);
      }
    });
  });

  // Filtrar se tipo EAP for resumida
  let gruposParaExportar = Array.from(agrupamento.values());
  if (tipoEap === 'resumida') {
    gruposParaExportar = gruposParaExportar.filter(g => g.acumulado > 0);
  }

  // Ordenar
  gruposParaExportar.sort((a, b) => {
    if (a.etapa !== b.etapa) return a.etapa.localeCompare(b.etapa);
    if (a.subEtapa !== b.subEtapa) return a.subEtapa.localeCompare(b.subEtapa);
    return a.servico.localeCompare(b.servico);
  });

  // Montar cabeçalho da tabela
  const headerRow1: any[] = [
    { text: 'Etapa', rowSpan: 2, style: 'tableHeader' },
    { text: 'SubEtapa', rowSpan: 2, style: 'tableHeader' },
    { text: 'Serviço Simplificado', rowSpan: 2, style: 'tableHeader' },
  ];
  
  // Adicionar medições
  medicoesSelecionadas.forEach((medicao) => {
    headerRow1.push({ text: `${medicao.numero}ª Medição`, colSpan: 2, style: 'tableHeaderMedicao' });
    headerRow1.push({}); // span
  });
  
  // Acumulado
  headerRow1.push({ text: 'Acumulado', colSpan: 2, style: 'tableHeaderAcumulado' });
  headerRow1.push({}); // span
  
  // Linha 2 do cabeçalho
  const headerRow2: any[] = [
    {}, {}, {}, // spans da linha 1
  ];
  
  // Sub-colunas para cada medição
  medicoesSelecionadas.forEach(() => {
    headerRow2.push(
      { text: 'Quant.', style: 'tableSubHeader' },
      { text: 'Total(R$)', style: 'tableSubHeader' }
    );
  });
  
  // Sub-colunas para acumulado
  headerRow2.push(
    { text: 'Quant.', style: 'tableSubHeader' },
    { text: 'Total(R$)', style: 'tableSubHeader' }
  );

  const tableBody: any[] = [headerRow1, headerRow2];
  const tiposPorLinha: ('etapa' | 'subetapa' | 'servico')[] = [];

  let etapaAtual = '';
  let subEtapaAtual = '';

  gruposParaExportar.forEach((grupo) => {
    // Adicionar linha de etapa se mudou
    if (grupo.etapa !== etapaAtual) {
      etapaAtual = grupo.etapa;
      subEtapaAtual = '';
      
      const linhaEtapa: any[] = [
        { text: grupo.etapa, style: 'agrupador', fillColor: '#D9E1F2' },
        { text: '', fillColor: '#D9E1F2' },
        { text: '', fillColor: '#D9E1F2' }
      ];
      medicoesSelecionadas.forEach(() => {
        linhaEtapa.push({ text: '', fillColor: '#D9E1F2' }, { text: '', fillColor: '#D9E1F2' });
      });
      linhaEtapa.push({ text: '', fillColor: '#D9E1F2' }, { text: '', fillColor: '#D9E1F2' });
      tableBody.push(linhaEtapa);
      tiposPorLinha.push('etapa');
    }

    // Adicionar linha de subetapa se mudou
    if (grupo.subEtapa !== subEtapaAtual) {
      subEtapaAtual = grupo.subEtapa;
      
      const linhaSubEtapa: any[] = [
        { text: '', fillColor: '#E7E6E6' },
        { text: '  ' + grupo.subEtapa, style: 'agrupador', fillColor: '#E7E6E6' },
        { text: '', fillColor: '#E7E6E6' }
      ];
      medicoesSelecionadas.forEach(() => {
        linhaSubEtapa.push({ text: '', fillColor: '#E7E6E6' }, { text: '', fillColor: '#E7E6E6' });
      });
      linhaSubEtapa.push({ text: '', fillColor: '#E7E6E6' }, { text: '', fillColor: '#E7E6E6' });
      tableBody.push(linhaSubEtapa);
      tiposPorLinha.push('subetapa');
    }

    // Adicionar linha de serviço
    const linhaServico: any[] = [
      { text: '', style: 'normal' },
      { text: '', style: 'normal' },
      { text: '    ' + grupo.servico, style: 'normal' }
    ];
    
    medicoesSelecionadas.forEach((medicao) => {
      const medicaoData = grupo.medicoes.get(medicao.numero) || { quantidade: 0, valor: 0 };
      linhaServico.push(
        { text: formatNumber(medicaoData.quantidade), style: 'number' },
        { text: formatCurrency(medicaoData.valor), style: 'currency' }
      );
    });
    
    linhaServico.push(
      { text: formatNumber(grupo.acumulado), style: 'number' },
      { text: formatCurrency(grupo.valorAcumulado), style: 'currency' }
    );
    
    tableBody.push(linhaServico);
    tiposPorLinha.push('servico');
  });

  // Calcular larguras das colunas
  const colWidths = [120, 120, 150];
  medicoesSelecionadas.forEach(() => {
    colWidths.push(50, 70);
  });
  colWidths.push(50, 70);

  const tipoTexto = tipoEap === 'completa' ? 'COMPLETA' : 'RESUMIDA';

  return {
    stack: [
      {
        text: 'PREVISÕES DE MEDIÇÕES - VISÃO EAP GERENCIAL',
        style: 'headerTitle',
        margin: [0, 0, 0, 5]
      },
      {
        text: `Obra: ${obra?.codigo} - ${obra?.nome}`,
        style: 'headerInfo',
        margin: [0, 0, 0, 2]
      },
      {
        text: `Construtora: ${obra?.construtora.razaoSocial}`,
        style: 'headerInfo',
        margin: [0, 0, 0, 2]
      },
      {
        text: `Data: ${new Date().toLocaleDateString('pt-BR')} | Tipo: EAP ${tipoTexto} | Acumulado até ${ultimaMedicaoNumero}ª Medição`,
        style: 'headerInfo',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          headerRows: 2,
          widths: colWidths,
          body: tableBody
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#64748b',
          vLineColor: () => '#64748b',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2
        }
      }
    ]
  };
}
