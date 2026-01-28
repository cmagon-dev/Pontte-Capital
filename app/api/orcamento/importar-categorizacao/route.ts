import { NextRequest, NextResponse } from 'next/server';
import { importarCategorizacao } from '@/app/actions/orcamento';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const arquivo = formData.get('arquivo') as File;
    const obraId = formData.get('obraId') as string;

    if (!arquivo || !obraId) {
      return NextResponse.json(
        { error: 'Arquivo e obraId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(extensao || '')) {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Use .xlsx ou .xls' },
        { status: 400 }
      );
    }

    // Converter arquivo para buffer
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Importar categorização
    const resultado = await importarCategorizacao(obraId, buffer);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error },
        { status: 400 }
      );
    }

    const mensagem = resultado.novaVersaoCriada
      ? `Nova versão criada! Categorização importada com sucesso! ${resultado.itensAtualizados || 0} itens atualizados.`
      : `Categorização importada com sucesso! ${resultado.itensAtualizados || 0} itens atualizados.`;

    return NextResponse.json({
      success: true,
      message: mensagem,
      itensAtualizados: resultado.itensAtualizados,
      novaVersaoCriada: resultado.novaVersaoCriada,
      versaoId: resultado.versaoId,
    });
  } catch (error: any) {
    console.error('Erro ao importar categorização:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao importar categorização' },
      { status: 500 }
    );
  }
}
