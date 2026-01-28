import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API /api/reajustes/upload - Recebendo requisição...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const reajusteId = formData.get('reajusteId') as string;
    const obraId = formData.get('obraId') as string;

    console.log('📋 Dados recebidos:', {
      fileName: file?.name,
      fileSize: file?.size,
      reajusteId,
      obraId
    });

    if (!file || !reajusteId || !obraId) {
      console.error('❌ Dados incompletos!');
      return NextResponse.json(
        { success: false, message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'reajustes');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Nome do arquivo
    const timestamp = Date.now();
    const fileName = `${obraId}_${reajusteId}_${timestamp}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Converter File para Buffer e salvar
    console.log(`💾 Salvando arquivo em: ${filePath}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    console.log('✅ Arquivo salvo no disco');

    // Caminho relativo para salvar no banco
    const caminhoArquivo = `/uploads/reajustes/${fileName}`;

    // Criar registro na tabela Documento vinculado ao reajuste
    console.log('💾 Salvando registro no banco de dados...');
    await db.documento.create({
      data: {
        reajusteId,
        categoria: 'Reajuste',
        tipo: 'Documento de Reajuste',
        nomeArquivo: file.name,
        caminhoArquivo,
      },
    });
    console.log('✅ Registro salvo no banco de dados');

    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      caminhoArquivo,
    });

  } catch (error: any) {
    console.error('❌ ERRO AO FAZER UPLOAD:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
