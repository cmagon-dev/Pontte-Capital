'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================================
// SCHEMA DE VALIDAÇÃO
// ============================================================

const FonteRecursoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  tipo: z.enum(['CONVENIO', 'FINANCIAMENTO', 'PROPRIO', 'MISTO']),
  esfera: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'PRIVADO']),
  orgao: z.string().optional(),
  instituicao: z.string().optional(),
  numeroProcesso: z.string().optional(),
  status: z.enum(['ATIVO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).default('ATIVO'),
  observacoes: z.string().optional(),
});

type FonteRecursoInput = z.infer<typeof FonteRecursoSchema>;

// ============================================================
// GERAR CÓDIGO
// ============================================================

async function gerarProximoCodigoFonteRecurso() {
  const ultimaFonte = await db.fonteRecurso.findFirst({
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  if (!ultimaFonte || !ultimaFonte.codigo) {
    return 'FR-001';
  }

  const match = ultimaFonte.codigo.match(/FR-(\d+)/);
  if (!match) {
    return 'FR-001';
  }

  const ultimoNumero = parseInt(match[1], 10);
  const proximoNumero = ultimoNumero + 1;
  return `FR-${String(proximoNumero).padStart(3, '0')}`;
}

// ============================================================
// LISTAR FONTES DE RECURSO
// ============================================================

export async function listarFontesRecurso() {
  try {
    const fontes = await db.fonteRecurso.findMany({
      orderBy: { codigo: 'desc' },
    });

    return {
      success: true,
      data: fontes,
    };
  } catch (error) {
    console.error('Erro ao listar fontes de recurso:', error);
    return {
      success: false,
      message: 'Erro ao buscar fontes de recurso',
      data: [],
    };
  }
}

// ============================================================
// BUSCAR FONTE DE RECURSO POR ID
// ============================================================

export async function buscarFonteRecursoPorId(id: string) {
  try {
    const fonte = await db.fonteRecurso.findUnique({
      where: { id },
    });

    if (!fonte) {
      return {
        success: false,
        message: 'Fonte de recurso não encontrada',
        data: null,
      };
    }

    return {
      success: true,
      data: fonte,
    };
  } catch (error) {
    console.error('Erro ao buscar fonte de recurso:', error);
    return {
      success: false,
      message: 'Erro ao buscar fonte de recurso',
      data: null,
    };
  }
}

// ============================================================
// CRIAR FONTE DE RECURSO
// ============================================================

export async function criarFonteRecurso(data: FonteRecursoInput) {
  try {
    // Validação com Zod
    const validated = FonteRecursoSchema.parse(data);

    // Gerar código
    const codigo = await gerarProximoCodigoFonteRecurso();
    console.log('✅ Código gerado:', codigo);

    // Preparar dados para salvamento
    const fonteData = {
      codigo,
      nome: validated.nome,
      tipo: validated.tipo,
      esfera: validated.esfera,
      orgao: validated.orgao || null,
      instituicao: validated.instituicao || null,
      numeroProcesso: validated.numeroProcesso || null,
      status: validated.status,
      observacoes: validated.observacoes || null,
    };

    // Criar fonte de recurso
    const fonte = await db.fonteRecurso.create({
      data: fonteData,
    });

    revalidatePath('/cadastros/fontes-recurso');

    return {
      success: true,
      message: 'Fonte de recurso cadastrada com sucesso',
      data: fonte,
    };
  } catch (error: any) {
    console.error('Erro ao criar fonte de recurso:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || 'Dados inválidos',
        data: null,
      };
    }

    return {
      success: false,
      message: 'Erro ao cadastrar fonte de recurso',
      data: null,
    };
  }
}

// ============================================================
// ATUALIZAR FONTE DE RECURSO
// ============================================================

export async function atualizarFonteRecurso(id: string, data: FonteRecursoInput) {
  try {
    // Verificar se a fonte existe
    const fonteExistente = await db.fonteRecurso.findUnique({
      where: { id },
    });

    if (!fonteExistente) {
      return {
        success: false,
        message: 'Fonte de recurso não encontrada',
      };
    }

    // Validação com Zod
    const validated = FonteRecursoSchema.parse(data);

    // Preparar dados para atualização
    const fonteData = {
      nome: validated.nome,
      tipo: validated.tipo,
      esfera: validated.esfera,
      orgao: validated.orgao || null,
      instituicao: validated.instituicao || null,
      numeroProcesso: validated.numeroProcesso || null,
      status: validated.status,
      observacoes: validated.observacoes || null,
    };

    // Atualizar fonte de recurso
    const fonte = await db.fonteRecurso.update({
      where: { id },
      data: fonteData,
    });

    revalidatePath('/cadastros/fontes-recurso');
    revalidatePath(`/cadastros/fontes-recurso/${id}/editar`);

    return {
      success: true,
      message: 'Fonte de recurso atualizada com sucesso',
      data: fonte,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar fonte de recurso:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues[0]?.message || 'Dados inválidos',
      };
    }

    return {
      success: false,
      message: 'Erro ao atualizar fonte de recurso',
    };
  }
}

// ============================================================
// EXCLUIR FONTE DE RECURSO
// ============================================================

export async function excluirFonteRecurso(id: string) {
  try {
    // Verificar se a fonte existe
    const fonteExistente = await db.fonteRecurso.findUnique({
      where: { id },
    });

    if (!fonteExistente) {
      return {
        success: false,
        message: 'Fonte de recurso não encontrada',
      };
    }

    // Excluir fonte de recurso
    await db.fonteRecurso.delete({
      where: { id },
    });

    revalidatePath('/cadastros/fontes-recurso');

    return {
      success: true,
      message: 'Fonte de recurso excluída com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao excluir fonte de recurso:', error);

    return {
      success: false,
      message: 'Erro ao excluir fonte de recurso',
    };
  }
}
