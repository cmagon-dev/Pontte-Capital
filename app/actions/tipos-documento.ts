'use server';

import { db as prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function listarTiposDocumento(construtoraId: string) {
  return prisma.tipoDocumento.findMany({
    where: { construtoraId },
    orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listarTiposDocumentoAtivos(construtoraId: string) {
  return prisma.tipoDocumento.findMany({
    where: { construtoraId, ativo: true },
    orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function criarTipoDocumento(
  construtoraId: string,
  data: { nome: string; descricao?: string }
) {
  const count = await prisma.tipoDocumento.count({ where: { construtoraId } });
  const tipo = await prisma.tipoDocumento.create({
    data: {
      construtoraId,
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      ordem: count,
    },
  });
  revalidatePath(`/fin/cadastros/${construtoraId}/tipos-documento`);
  return tipo;
}

export async function atualizarTipoDocumento(
  id: string,
  data: { nome?: string; descricao?: string; ativo?: boolean }
) {
  const tipo = await prisma.tipoDocumento.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome.trim() }),
      ...(data.descricao !== undefined && { descricao: data.descricao?.trim() || null }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
    },
  });
  revalidatePath(`/fin/cadastros/${tipo.construtoraId}/tipos-documento`);
  return tipo;
}

export async function excluirTipoDocumento(id: string) {
  const count = await prisma.ordemPagamento.count({
    where: { tipoDocumentoNome: { not: null } },
  });
  // Verifica se há ordens usando este tipo pelo nome
  const tipo = await prisma.tipoDocumento.findUnique({ where: { id } });
  if (!tipo) throw new Error('Tipo de documento não encontrado.');

  const emUso = await prisma.ordemPagamento.count({
    where: { tipoDocumentoNome: tipo.nome },
  });
  if (emUso > 0) {
    throw new Error('Este tipo de documento está em uso em ordens de pagamento e não pode ser excluído.');
  }

  const resultado = await prisma.tipoDocumento.delete({ where: { id } });
  revalidatePath(`/fin/cadastros/${resultado.construtoraId}/tipos-documento`);
  return resultado;
}

export async function buscarTipoDocumento(id: string) {
  return prisma.tipoDocumento.findUnique({ where: { id } });
}
