import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ API /api/documentos/[id] - Excluindo documento:', params.id);

    // Buscar documento no banco
    const documento = await db.documento.findUnique({
      where: { id: params.id },
    });

    if (!documento) {
      console.error('❌ Documento não encontrado');
      return NextResponse.json(
        { success: false, message: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    console.log('📋 Documento encontrado:', {
      nome: documento.nomeArquivo,
      caminho: documento.caminhoArquivo,
    });

    // Excluir arquivo físico
    const filePath = join(process.cwd(), 'public', documento.caminhoArquivo);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
      console.log('✅ Arquivo físico excluído');
    } else {
      console.log('⚠️ Arquivo físico não encontrado, apenas removendo do banco');
    }

    // Excluir registro do banco
    await db.documento.delete({
      where: { id: params.id },
    });
    console.log('✅ Registro excluído do banco de dados');

    return NextResponse.json({
      success: true,
      message: 'Documento excluído com sucesso',
    });
  } catch (error: any) {
    console.error('❌ ERRO AO EXCLUIR DOCUMENTO:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro ao excluir documento' },
      { status: 500 }
    );
  }
}
