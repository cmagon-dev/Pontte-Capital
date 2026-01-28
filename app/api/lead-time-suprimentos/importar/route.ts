import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const obraId = formData.get('obraId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    if (!obraId) {
      return NextResponse.json(
        { error: 'obraId é obrigatório' },
        { status: 400 }
      );
    }

    // Ler arquivo Excel
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Obter primeira aba (Lead Times)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (dados.length === 0) {
      return NextResponse.json(
        { error: 'Planilha vazia ou formato inválido' },
        { status: 400 }
      );
    }

    let atualizados = 0;
    const erros: string[] = [];

    // Processar cada linha
    for (const linha of dados) {
      try {
        const id = linha['ID'];
        
        if (!id) {
          erros.push(`Linha sem ID: ${linha['Serviço Simplificado']}`);
          continue;
        }

        // Preparar dados para atualização
        const leadTimeMaterial = linha['Lead Time Material (dias)'];
        const leadTimeMaoDeObra = linha['Lead Time Mão de Obra (dias)'];
        const leadTimeContratos = linha['Lead Time Contratos (dias)'];
        const leadTimeEquipamentos = linha['Lead Time Equipamentos e Fretes (dias)'];

        // Converter valores vazios ou não numéricos para null
        const parseValue = (value: any): number | null => {
          if (value === '' || value === null || value === undefined) return null;
          const parsed = parseInt(value, 10);
          return isNaN(parsed) ? null : parsed;
        };

        // Atualizar serviço
        await prisma.servicoSimplificado.update({
          where: { id },
          data: {
            leadTimeMaterial: parseValue(leadTimeMaterial),
            leadTimeMaoDeObra: parseValue(leadTimeMaoDeObra),
            leadTimeContratos: parseValue(leadTimeContratos),
            leadTimeEquipamentos: parseValue(leadTimeEquipamentos),
          },
        });

        atualizados++;
      } catch (error) {
        console.error('Erro ao processar linha:', error);
        erros.push(`Erro ao atualizar: ${linha['Serviço Simplificado']}`);
      }
    }

    // Retornar resultado
    return NextResponse.json({
      success: true,
      atualizados,
      total: dados.length,
      erros: erros.length > 0 ? erros : undefined,
    });
  } catch (error) {
    console.error('Erro ao importar lead times:', error);
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
