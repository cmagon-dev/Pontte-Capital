import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Iniciando upload de documento da obra...');
    
    const formData = await request.formData();
    
    const arquivo = formData.get('arquivo') as File;
    const tipo = formData.get('tipo') as string;
    const categoria = formData.get('categoria') as string || '';
    const observacoes = formData.get('observacoes') as string || '';
    const obraId = formData.get('obraId') as string;

    console.log('📋 Dados recebidos:', {
      arquivoNome: arquivo?.name,
      arquivoTamanho: arquivo?.size,
      tipo,
      categoria,
      obraId
    });

    if (!arquivo || !tipo || !obraId) {
      console.error('❌ Dados incompletos:', { arquivo: !!arquivo, tipo, obraId });
      return NextResponse.json(
        { error: 'Arquivo, tipo e obraId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a obra existe
    console.log('🔍 Verificando se obra existe:', obraId);
    const obra = await db.obra.findUnique({
      where: { id: obraId },
    });

    if (!obra) {
      console.error('❌ Obra não encontrada:', obraId);
      return NextResponse.json(
        { error: 'Obra não encontrada' },
        { status: 404 }
      );
    }
    console.log('✅ Obra encontrada:', obra.nome);

    // Converter arquivo para buffer
    const bytes = await arquivo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'obras', obraId);
    console.log('📁 Criando diretório:', uploadDir);
    await mkdir(uploadDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const nomeOriginal = arquivo.name;
    const extensao = nomeOriginal.split('.').pop();
    const nomeArquivo = `${timestamp}-${nomeOriginal.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const caminhoCompleto = join(uploadDir, nomeArquivo);
    const caminhoRelativo = `obras/${obraId}/${nomeArquivo}`;

    console.log('💾 Salvando arquivo:', {
      nomeArquivo,
      caminhoCompleto,
      tamanho: buffer.length
    });

    // Salvar arquivo
    await writeFile(caminhoCompleto, buffer);
    console.log('✅ Arquivo salvo com sucesso');

    // Salvar no banco de dados
    console.log('💾 Salvando documento no banco de dados...');
    const documento = await db.documento.create({
      data: {
        obraId: obraId,
        tipo: tipo,
        categoria: categoria || '',
        nomeArquivo: nomeOriginal,
        caminhoArquivo: caminhoRelativo,
        observacoes: observacoes || null,
        dataUpload: new Date(),
      },
    });

    console.log('✅ Documento da obra salvo no banco:', {
      id: documento.id,
      tipo: documento.tipo,
      nomeArquivo: documento.nomeArquivo
    });

    return NextResponse.json({
      success: true,
      documento: documento,
    });

  } catch (error: any) {
    console.error('🔥 Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer upload do documento' },
      { status: 500 }
    );
  }
}
