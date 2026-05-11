'use server';

import { db as prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function listarItensCustoIndireto(construtoraId: string) {
  return prisma.itemCustoIndireto.findMany({
    where: { construtoraId },
    orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function listarItensCustoIndiretoAtivos(construtoraId: string) {
  return prisma.itemCustoIndireto.findMany({
    where: { construtoraId, ativo: true },
    orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function criarItemCustoIndireto(
  construtoraId: string,
  data: { nome: string; descricao?: string }
) {
  const count = await prisma.itemCustoIndireto.count({ where: { construtoraId } });
  const item = await prisma.itemCustoIndireto.create({
    data: {
      construtoraId,
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      ordem: count,
    },
  });
  revalidatePath(`/fin/cadastros/${construtoraId}/custos-indiretos`);
  return item;
}

export async function atualizarItemCustoIndireto(
  id: string,
  data: { nome?: string; descricao?: string; ativo?: boolean }
) {
  const item = await prisma.itemCustoIndireto.update({
    where: { id },
    data: {
      ...(data.nome !== undefined && { nome: data.nome.trim() }),
      ...(data.descricao !== undefined && { descricao: data.descricao?.trim() || null }),
      ...(data.ativo !== undefined && { ativo: data.ativo }),
    },
  });
  revalidatePath(`/fin/cadastros/${item.construtoraId}/custos-indiretos`);
  return item;
}

export async function excluirItemCustoIndireto(id: string) {
  const count = await prisma.apropriacaoOrcamentaria.count({
    where: { itemCustoIndiretoId: id },
  });
  if (count > 0) {
    throw new Error('Este item possui apropriações lançadas e não pode ser excluído.');
  }
  const item = await prisma.itemCustoIndireto.delete({ where: { id } });
  revalidatePath(`/fin/cadastros/${item.construtoraId}/custos-indiretos`);
  return item;
}

export async function buscarItemCustoIndireto(id: string) {
  return prisma.itemCustoIndireto.findUnique({ where: { id } });
}
