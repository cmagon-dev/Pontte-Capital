import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const aditivoId = formData.get('aditivoId') as string;
    const obraId = formData.get('obraId') as string;

    if (!file || !aditivoId || !obraId) {
      return NextResponse.json(
        { success: false, message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'aditivos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Nome do arquivo
    const timestamp = Date.now();
    const fileName = `${obraId}_${aditivoId}_${timestamp}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Caminho relativo para salvar no banco
    const caminhoArquivo = `/uploads/aditivos/${fileName}`;

    // Criar registro na tabela Documento vinculado ao aditivo
    await db.documento.create({
      data: {
        aditivoId,
        categoria: 'Aditivo',
        tipo: 'Documento de Aditivo',
        nomeArquivo: file.name,
        caminhoArquivo,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      caminhoArquivo,
    });

  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
