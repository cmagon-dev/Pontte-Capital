'use server'

import { z } from "zod";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

// Schema de validação
const DocumentoSchema = z.object({
  construtoraId: z.string().min(1, "ID da construtora obrigatório"),
  categoria: z.enum(['Jurídico', 'Fiscal', 'Financeiro']),
  tipo: z.string().min(1, "Tipo de documento obrigatório"),
  dataValidade: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export async function criarDocumento(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR DOCUMENTO INICIADA");

    // Extrair dados do FormData
    const construtoraId = formData.get('construtoraId') as string;
    const categoria = formData.get('categoria') as string;
    const tipo = formData.get('tipo') as string;
    const dataValidade = formData.get('dataValidade') as string | null;
    const observacoes = formData.get('observacoes') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: "Arquivo obrigatório",
      };
    }

    // Validar dados
    const validatedFields = DocumentoSchema.safeParse({
      construtoraId,
      categoria,
      tipo,
      dataValidade: dataValidade || null,
      observacoes: observacoes || null,
    });

    if (!validatedFields.success) {
      console.error("❌ ERRO DE VALIDAÇÃO:", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        message: "Erro nos dados enviados",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const payload = validatedFields.data;

    // Verificar se a construtora existe
    const construtora = await db.construtora.findUnique({
      where: { id: construtoraId },
    });

    if (!construtora) {
      return {
        success: false,
        message: "Construtora não encontrada",
      };
    }

    // Criar pasta de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documentos', construtoraId);
    await mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const nomeArquivo = `${timestamp}_${file.name}`;
    const caminhoArquivo = join(uploadsDir, nomeArquivo);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivo, buffer);

    // Caminho relativo para salvar no banco
    const caminhoRelativo = `/uploads/documentos/${construtoraId}/${nomeArquivo}`;

    // Salvar no banco
    const documento = await db.documento.create({
      data: {
        construtoraId: payload.construtoraId,
        categoria: payload.categoria,
        tipo: payload.tipo,
        nomeArquivo: file.name,
        caminhoArquivo: caminhoRelativo,
        dataValidade: payload.dataValidade ? new Date(payload.dataValidade) : null,
        observacoes: payload.observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Documento criado:", documento.id);

    revalidatePath(`/cadastros/construtoras/${construtoraId}/documentos`);
    return { success: true, message: "Documento cadastrado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const construtoraId = formData.get('construtoraId') as string;
      const file = formData.get('file') as File | null;
      if (file && construtoraId) {
        const timestamp = Date.now();
        const nomeArquivo = `${timestamp}_${file.name}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'documentos', construtoraId, nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function criarDocumentoFundo(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR DOCUMENTO FUNDO INICIADA");

    // Extrair dados do FormData
    const fundoId = formData.get('fundoId') as string;
    const categoria = formData.get('categoria') as string || 'Jurídico'; // Default para manter compatibilidade
    const tipo = formData.get('tipo') as string;
    const dataValidade = formData.get('dataValidade') as string | null;
    const observacoes = formData.get('observacoes') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: "Arquivo obrigatório",
      };
    }

    if (!fundoId || !tipo) {
      return {
        success: false,
        message: "ID do fundo e tipo de documento são obrigatórios",
      };
    }

    // Verificar se o fundo existe
    const fundo = await db.fundo.findUnique({
      where: { id: fundoId },
    });

    if (!fundo) {
      return {
        success: false,
        message: "Fundo não encontrado",
      };
    }

    // Criar pasta de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documentos', 'fundos', fundoId);
    await mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const nomeArquivo = `${timestamp}_${file.name}`;
    const caminhoArquivo = join(uploadsDir, nomeArquivo);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivo, buffer);

    // Caminho relativo para salvar no banco
    const caminhoRelativo = `/uploads/documentos/fundos/${fundoId}/${nomeArquivo}`;

    // Salvar no banco
    const documento = await db.documento.create({
      data: {
        fundoId: fundoId,
        categoria: categoria,
        tipo: tipo,
        nomeArquivo: file.name,
        caminhoArquivo: caminhoRelativo,
        dataValidade: dataValidade ? new Date(dataValidade) : null,
        observacoes: observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Documento criado:", documento.id);

    revalidatePath(`/cadastros/fundos/${fundoId}/documentos`);
    return { success: true, message: "Documento cadastrado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const fundoId = formData.get('fundoId') as string;
      const file = formData.get('file') as File | null;
      if (file && fundoId) {
        const timestamp = Date.now();
        const nomeArquivo = `${timestamp}_${file.name}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'documentos', 'fundos', fundoId, nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function criarDocumentoFiador(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR DOCUMENTO FIADOR INICIADA");

    // Extrair dados do FormData
    const fiadorId = formData.get('fiadorId') as string;
    const categoria = formData.get('categoria') as string || 'Financeiro'; // Default para fiadores
    const tipo = formData.get('tipo') as string;
    const dataValidade = formData.get('dataValidade') as string | null;
    const observacoes = formData.get('observacoes') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: "Arquivo obrigatório",
      };
    }

    if (!fiadorId || !tipo) {
      return {
        success: false,
        message: "ID do fiador e tipo de documento são obrigatórios",
      };
    }

    // Verificar se o fiador existe
    const fiador = await db.fiador.findUnique({
      where: { id: fiadorId },
    });

    if (!fiador) {
      return {
        success: false,
        message: "Fiador não encontrado",
      };
    }

    // Criar pasta de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documentos', 'fiadores', fiadorId);
    await mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const nomeArquivo = `${timestamp}_${file.name}`;
    const caminhoArquivo = join(uploadsDir, nomeArquivo);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivo, buffer);

    // Caminho relativo para salvar no banco
    const caminhoRelativo = `/uploads/documentos/fiadores/${fiadorId}/${nomeArquivo}`;

    // Salvar no banco
    const documento = await db.documento.create({
      data: {
        fiadorId: fiadorId,
        categoria: categoria,
        tipo: tipo,
        nomeArquivo: file.name,
        caminhoArquivo: caminhoRelativo,
        dataValidade: dataValidade ? new Date(dataValidade) : null,
        observacoes: observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Documento criado:", documento.id);

    revalidatePath(`/cadastros/fiadores/${fiadorId}/documentos`);
    return { success: true, message: "Documento cadastrado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const fiadorId = formData.get('fiadorId') as string;
      const file = formData.get('file') as File | null;
      if (file && fiadorId) {
        const timestamp = Date.now();
        const nomeArquivo = `${timestamp}_${file.name}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'documentos', 'fiadores', fiadorId, nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return {
      success: false,
      message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}

export async function criarDocumentoBem(formData: FormData) {
  try {
    console.log("------------------------------------------------");
    console.log("📢 SERVER ACTION CRIAR DOCUMENTO BEM INICIADA");

    const bemId = formData.get('bemId') as string;
    const fiadorId = formData.get('fiadorId') as string;
    const categoria = formData.get('categoria') as string || 'Bem em Garantia';
    const tipo = formData.get('tipo') as string;
    const dataValidade = formData.get('dataValidade') as string | null;
    const observacoes = formData.get('observacoes') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, message: "Arquivo obrigatório" };
    }
    if (!bemId || !fiadorId || !tipo) {
      return { success: false, message: "ID do bem, fiador e tipo de documento são obrigatórios" };
    }

    const bem = await db.bem.findUnique({ where: { id: bemId } });
    if (!bem) {
      return { success: false, message: "Bem não encontrado" };
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documentos', 'bens', bemId);
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const nomeArquivo = `${timestamp}_${file.name}`;
    const caminhoArquivo = join(uploadsDir, nomeArquivo);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(caminhoArquivo, buffer);

    const caminhoRelativo = `/uploads/documentos/bens/${bemId}/${nomeArquivo}`;

    const documento = await db.documento.create({
      data: {
        bemId: bemId,
        fiadorId: fiadorId,
        categoria: categoria,
        tipo: tipo,
        nomeArquivo: file.name,
        caminhoArquivo: caminhoRelativo,
        dataValidade: dataValidade ? new Date(dataValidade) : null,
        observacoes: observacoes || null,
      },
    });

    console.log("✅ SUCESSO! Documento do bem criado:", documento.id);
    revalidatePath(`/cadastros/fiadores/${fiadorId}/documentos`);
    return { success: true, message: "Documento cadastrado com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO:", error);
    
    // Tentar remover arquivo órfão se o salvamento no banco falhou
    try {
      const bemId = formData.get('bemId') as string;
      const file = formData.get('file') as File | null;
      if (file && bemId) {
        const timestamp = Date.now();
        const nomeArquivo = `${timestamp}_${file.name}`;
        const caminhoArquivo = join(process.cwd(), 'public', 'uploads', 'documentos', 'bens', bemId, nomeArquivo);
        await unlink(caminhoArquivo);
        console.log("🧹 Arquivo órfão removido:", caminhoArquivo);
      }
    } catch (cleanupError) {
      console.warn("⚠️ Não foi possível remover arquivo órfão");
    }
    
    return { success: false, message: `Erro ao salvar: ${error?.message || "Erro interno do servidor"}` };
  }
}

export async function excluirDocumento(id: string, entityId: string, entityType?: 'construtora' | 'fundo' | 'fiador' | 'contratante') {
  try {
    console.log("------------------------------------------------");
    console.log("🗑️ SERVER ACTION EXCLUIR DOCUMENTO INICIADA");
    console.log("🆔 ID:", id);

    // Verificar se o documento existe
    const documento = await db.documento.findUnique({
      where: { id },
    });

    if (!documento) {
      return {
        success: false,
        message: "Documento não encontrado",
      };
    }

    // Verificar se pertence à entidade correta
    let belongsToEntity = false;
    let revalidatePathUrl = '';
    
    if (entityType === 'fundo') {
      belongsToEntity = documento.fundoId === entityId;
      revalidatePathUrl = `/cadastros/fundos/${entityId}/documentos`;
    } else if (entityType === 'fiador') {
      belongsToEntity = documento.fiadorId === entityId;
      revalidatePathUrl = `/cadastros/fiadores/${entityId}/documentos`;
    } else if (entityType === 'contratante') {
      belongsToEntity = documento.contratanteId === entityId;
      revalidatePathUrl = `/cadastros/contratantes/${entityId}/documentos`;
    } else {
      // Default: construtora
      belongsToEntity = documento.construtoraId === entityId;
      revalidatePathUrl = `/cadastros/construtoras/${entityId}/documentos`;
    }

    if (!belongsToEntity) {
      return {
        success: false,
        message: `Documento não pertence a esta ${entityType || 'construtora'}`,
      };
    }

    // Excluir arquivo do sistema de arquivos
    const caminhoCompleto = join(process.cwd(), 'public', documento.caminhoArquivo);
    
    try {
      await unlink(caminhoCompleto);
    } catch (fileError) {
      console.warn("⚠️ Arquivo não encontrado no sistema de arquivos:", caminhoCompleto);
      // Continua mesmo se o arquivo não existir
    }

    // Excluir do banco
    await db.documento.delete({
      where: { id },
    });

    console.log("✅ SUCESSO! Documento excluído:", id);

    revalidatePath(revalidatePathUrl);
    return { success: true, message: "Documento excluído com sucesso!" };

  } catch (error: any) {
    console.error("🔥 ERRO CRÍTICO AO EXCLUIR:", error);
    return {
      success: false,
      message: `Erro ao excluir: ${error?.message || "Erro interno do servidor"}`,
    };
  }
}
