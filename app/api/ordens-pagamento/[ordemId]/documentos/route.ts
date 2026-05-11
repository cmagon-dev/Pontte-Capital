import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';

// POST /api/ordens-pagamento/[ordemId]/documentos
// Faz upload de arquivos e cria registros DocumentoOrdem
export async function POST(
  request: NextRequest,
  { params }: { params: { ordemId: string } }
) {
  try {
    const { ordemId } = params;

    const ordem = await db.ordemPagamento.findUnique({
      where: { id: ordemId },
      select: { id: true },
    });
    if (!ordem) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });
    }

    const formData = await request.formData();
    const arquivos = formData.getAll('arquivos') as File[];

    if (!arquivos.length) {
      return NextResponse.json({ error: 'Nenhum arquivo recebido' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'ordens-pagamento', ordemId);
    await mkdir(uploadDir, { recursive: true });

    const criados = [];

    for (const arquivo of arquivos) {
      if (!arquivo || typeof arquivo === 'string') continue;

      const timestamp = Date.now();
      const nomeSeguro = arquivo.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const nomeArquivo = `${timestamp}-${nomeSeguro}`;
      const caminhoCompleto = join(uploadDir, nomeArquivo);
      const caminhoRelativo = `/uploads/ordens-pagamento/${ordemId}/${nomeArquivo}`;

      const bytes = await arquivo.arrayBuffer();
      await writeFile(caminhoCompleto, Buffer.from(bytes));

      const doc = await db.documentoOrdem.create({
        data: {
          ordemPagamentoId: ordemId,
          nomeArquivo: arquivo.name,
          caminhoArquivo: caminhoRelativo,
          tipoArquivo: arquivo.type || 'application/octet-stream',
          tamanhoBytes: arquivo.size,
        },
      });
      criados.push(doc);
    }

    return NextResponse.json({ success: true, documentos: criados });
  } catch (error: any) {
    console.error('Erro ao fazer upload de documentos de ordem:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
