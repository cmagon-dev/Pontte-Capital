import { NextRequest, NextResponse } from 'next/server';
import { importarPlanilhaContratual } from '@/app/actions/orcamento';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const arquivo = formData.get('arquivo') as File;
    const obraId = formData.get('obraId') as string;
    const nomeVersao = formData.get('nomeVersao') as string;
    const tipoVersao = formData.get('tipoVersao') as 'BASELINE' | 'REVISAO';
    const observacoes = formData.get('observacoes') as string | null;

    if (!arquivo || !obraId || !nomeVersao || !tipoVersao) {
      return NextResponse.json(
        { error: 'Arquivo, obraId, nomeVersao e tipoVersao são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extensao || '')) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Use .xlsx, .xls ou .csv' },
        { status: 400 }
      );
    }

    // Converter arquivo para buffer
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Importar planilha
    const resultado = await importarPlanilhaContratual(
      obraId,
      nomeVersao,
      tipoVersao,
      buffer,
      observacoes || undefined
    );

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      versaoId: resultado.versaoId,
      totalItens: resultado.totalItens,
    });

  } catch (error: any) {
    console.error('Erro ao fazer upload da planilha:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload da planilha' },
      { status: 500 }
    );
  }
}
