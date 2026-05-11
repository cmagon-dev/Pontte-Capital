import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db as prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ordemPagamentoId = formData.get('ordemPagamentoId') as string;

    if (!ordemPagamentoId) {
      return NextResponse.json({ error: 'ordemPagamentoId é obrigatório' }, { status: 400 });
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'operacoes', ordemPagamentoId);
    await mkdir(uploadDir, { recursive: true });

    const documentosCriados = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const nomeArquivo = `${Date.now()}-${file.name}`;
        const caminho = path.join(uploadDir, nomeArquivo);
        await writeFile(caminho, buffer);

        return prisma.documentoOrdem.create({
          data: {
            ordemPagamentoId,
            nomeArquivo: file.name,
            caminhoArquivo: `/uploads/operacoes/${ordemPagamentoId}/${nomeArquivo}`,
            tipoArquivo: file.type,
            tamanhoBytes: file.size,
          },
        });
      })
    );

    return NextResponse.json({ documentos: documentosCriados }, { status: 201 });
  } catch (error) {
    console.error('Erro ao fazer upload de documentos:', error);
    return NextResponse.json({ error: 'Erro interno ao processar upload' }, { status: 500 });
  }
}
