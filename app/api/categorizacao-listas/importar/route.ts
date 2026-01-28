import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const arquivo = formData.get('arquivo') as File;
    const tipo = formData.get('tipo') as string; // 'etapa', 'subEtapa', ou 'servico'

    if (!arquivo) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Normalizar o tipo (remover espaços)
    const tipoNormalizado = tipo?.trim();
    
    console.log('Tipo original:', tipo);
    console.log('Tipo normalizado:', tipoNormalizado);
    
    // Aceitar variações do tipo
    let tipoProcessamento: 'etapa' | 'subEtapa' | 'servico';
    if (tipoNormalizado === 'etapa' || tipoNormalizado?.toLowerCase() === 'etapa') {
      tipoProcessamento = 'etapa';
    } else if (tipoNormalizado === 'subEtapa' || tipoNormalizado?.toLowerCase() === 'subetapa' || tipoNormalizado === 'sub-etapa') {
      tipoProcessamento = 'subEtapa';
    } else if (tipoNormalizado === 'servico' || tipoNormalizado?.toLowerCase() === 'servico' || tipoNormalizado === 'serviço') {
      tipoProcessamento = 'servico';
    } else {
      console.error('Tipo inválido recebido:', tipo);
      return NextResponse.json(
        { error: `Tipo inválido: ${tipo}. Tipos aceitos: etapa, subEtapa, servico` },
        { status: 400 }
      );
    }
    
    console.log('Tipo de processamento:', tipoProcessamento);

    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(extensao || '')) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Use .xlsx ou .xls' },
        { status: 400 }
      );
    }

    // Ler arquivo Excel
    const bytes = await arquivo.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'buffer' });

    // Ler primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Ler dados do Excel (primeira linha como header)
    const dados = XLSX.utils.sheet_to_json(worksheet, {
      defval: '', // Valor padrão para células vazias
      raw: false, // Converter valores para string
    }) as any[];

    const resultados = {
      criados: 0,
      atualizados: 0,
      erros: [] as string[],
    };

    console.log('=== INÍCIO DA IMPORTAÇÃO ===');
    console.log('Tipo recebido:', tipo);
    console.log('Tipo de processamento:', tipoProcessamento);
    console.log('Número de linhas no Excel:', dados.length);
    console.log('Primeiras linhas:', dados.slice(0, 3));
    console.log('Chaves das primeiras linhas:', dados.length > 0 ? Object.keys(dados[0]) : 'Nenhuma linha');
    
    // Verificar se os modelos existem no Prisma Client
    console.log('Verificando modelos Prisma:');
    console.log('- db.etapa existe:', !!db.etapa);
    console.log('- db.subEtapa existe:', !!db.subEtapa);
    console.log('- db.servicoSimplificado existe:', !!db.servicoSimplificado);
    
    // Testar conexão com o banco
    try {
      await db.$connect();
      console.log('✅ Conexão com banco estabelecida');
    } catch (connError: any) {
      console.error('❌ Erro ao conectar com banco:', connError);
      return NextResponse.json(
        { error: `Erro de conexão com banco: ${connError.message}` },
        { status: 500 }
      );
    }

    // ========================================
    // OTIMIZAÇÃO: Processar dados em lote
    // ========================================
    
    // Primeiro, extrair e validar todos os dados
    const dadosValidados: Array<{ nome: string; ordem: number | null }> = [];
    
    for (let index = 0; index < dados.length; index++) {
      const linha = dados[index];
      
      // Log da linha para debug
      if (index < 3) {
        console.log(`Linha ${index + 1}:`, linha);
        console.log(`Chaves da linha ${index + 1}:`, Object.keys(linha));
      }
      
      // Tentar diferentes variações de nomes de colunas
      const nome = String(
        linha['Nome'] || 
        linha['nome'] || 
        linha['NOME'] ||
        linha['Nome da Etapa'] ||
        linha['Nome da SubEtapa'] ||
        linha['Nome do Serviço'] ||
        linha['Etapa'] ||
        linha['SubEtapa'] ||
        linha['Serviço'] ||
        linha['Servico'] ||
        linha[Object.keys(linha)[0]] || // Primeira coluna se não encontrar
        ''
      ).trim();
      
      const ordemStr = 
        linha['Ordem'] || 
        linha['ordem'] || 
        linha['ORDEM'] ||
        linha['Ordem da Etapa'] ||
        linha['Ordem da SubEtapa'] ||
        linha['Ordem do Serviço'];
      
      const ordem = ordemStr !== undefined && ordemStr !== null && ordemStr !== '' && !isNaN(Number(ordemStr)) 
        ? Number(ordemStr) 
        : null;

      if (!nome || nome === 'undefined' || nome === 'null' || nome === '') {
        const linhaNum = index + 1;
        const chavesDisponiveis = Object.keys(linha).join(', ');
        const valoresDisponiveis = Object.values(linha).slice(0, 3).join(', ');
        resultados.erros.push(`Linha ${linhaNum}: sem nome válido. Chaves disponíveis: [${chavesDisponiveis}]. Valores: [${valoresDisponiveis}]`);
        continue;
      }

      dadosValidados.push({ nome, ordem });
    }

    console.log(`✅ ${dadosValidados.length} registros validados para importação`);

    // Agora processar em lote (MUITO mais rápido!)
    try {
      if (tipoProcessamento === 'etapa') {
        // Buscar todos os existentes de uma vez
        const existentes = await db.etapa.findMany({
          where: {
            nome: { in: dadosValidados.map((d) => d.nome) },
          },
        });
        const nomesExistentes = new Set(existentes.map((e: any) => e.nome));

        // Separar novos e atualizações
        const novos = dadosValidados.filter(d => !nomesExistentes.has(d.nome));
        const paraAtualizar = dadosValidados.filter(d => nomesExistentes.has(d.nome));

        // Criar novos em lote (createMany)
        if (novos.length > 0) {
          const result = await db.etapa.createMany({
            data: novos.map(d => ({ nome: d.nome, ordem: d.ordem, ativo: true })),
            skipDuplicates: true,
          });
          resultados.criados = result.count;
          console.log(`✅ ${result.count} etapas criadas em lote`);
        }

        // Atualizar existentes (infelizmente precisa ser um por um)
        for (const item of paraAtualizar) {
          const existente = existentes.find((e: any) => e.nome === item.nome);
          if (existente) {
            await db.etapa.update({
              where: { id: existente.id },
              data: { ordem: item.ordem, ativo: true },
            });
            resultados.atualizados++;
          }
        }

      } else if (tipoProcessamento === 'subEtapa') {
        // Buscar todos os existentes de uma vez
        const existentes = await db.subEtapa.findMany({
          where: {
            nome: { in: dadosValidados.map((d) => d.nome) },
          },
        });
        const nomesExistentes = new Set(existentes.map((e: any) => e.nome));

        // Separar novos e atualizações
        const novos = dadosValidados.filter(d => !nomesExistentes.has(d.nome));
        const paraAtualizar = dadosValidados.filter(d => nomesExistentes.has(d.nome));

        // Criar novos em lote (createMany)
        if (novos.length > 0) {
          const result = await db.subEtapa.createMany({
            data: novos.map(d => ({ nome: d.nome, ordem: d.ordem, ativo: true })),
            skipDuplicates: true,
          });
          resultados.criados = result.count;
          console.log(`✅ ${result.count} subetapas criadas em lote`);
        }

        // Atualizar existentes (infelizmente precisa ser um por um)
        for (const item of paraAtualizar) {
          const existente = existentes.find((e: any) => e.nome === item.nome);
          if (existente) {
            await db.subEtapa.update({
              where: { id: existente.id },
              data: { ordem: item.ordem, ativo: true },
            });
            resultados.atualizados++;
          }
        }

      } else if (tipoProcessamento === 'servico') {
        // Buscar todos os existentes de uma vez
        const existentes = await db.servicoSimplificado.findMany({
          where: {
            nome: { in: dadosValidados.map((d) => d.nome) },
          },
        });
        const nomesExistentes = new Set(existentes.map((e: any) => e.nome));

        // Separar novos e atualizações
        const novos = dadosValidados.filter(d => !nomesExistentes.has(d.nome));
        const paraAtualizar = dadosValidados.filter(d => nomesExistentes.has(d.nome));

        // Criar novos em lote (createMany)
        if (novos.length > 0) {
          const result = await db.servicoSimplificado.createMany({
            data: novos.map(d => ({ nome: d.nome, ordem: d.ordem, ativo: true })),
            skipDuplicates: true,
          });
          resultados.criados = result.count;
          console.log(`✅ ${result.count} serviços criados em lote`);
        }

        // Atualizar existentes (infelizmente precisa ser um por um)
        for (const item of paraAtualizar) {
          const existente = existentes.find((e: any) => e.nome === item.nome);
          if (existente) {
            await db.servicoSimplificado.update({
              where: { id: existente.id },
              data: { ordem: item.ordem, ativo: true },
            });
            resultados.atualizados++;
          }
        }

      } else {
        resultados.erros.push(`Tipo desconhecido: ${tipo} (normalizado: ${tipoProcessamento})`);
      }
    } catch (error: any) {
      console.error(`Erro ao processar em lote:`, error);
      resultados.erros.push(`Erro ao processar em lote: ${error.message || error.toString()}`);
    }

    console.log('Resultados da importação:', resultados);

    revalidatePath('/eng/orcamento');

    // Limitar número de erros retornados para não sobrecarregar
    const errosLimitados = resultados.erros.slice(0, 10); // Mostrar apenas os primeiros 10 erros
    
    let mensagem = `Importação concluída: ${resultados.criados} criados, ${resultados.atualizados} atualizados`;
    if (resultados.erros.length > 0) {
      mensagem += `. ${resultados.erros.length} erro(s) encontrado(s)`;
      if (resultados.erros.length > 10) {
        mensagem += ` (mostrando apenas os primeiros 10 no console)`;
      }
    }

    return NextResponse.json({
      success: resultados.erros.length === 0 || resultados.criados > 0 || resultados.atualizados > 0,
      message: mensagem,
      criados: resultados.criados,
      atualizados: resultados.atualizados,
      erros: errosLimitados,
      totalErros: resultados.erros.length,
    });
  } catch (error: any) {
    console.error('Erro ao importar lista:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao importar lista' },
      { status: 500 }
    );
  }
}
