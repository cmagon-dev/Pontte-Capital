'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ============================================
// ETAPAS
// ============================================

export async function listarEtapas() {
  try {
    const etapas = await db.etapa.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }, // Ordem alfabética
    });
    return { success: true, etapas };
  } catch (error: any) {
    console.error('Erro ao listar etapas:', error);
    return { success: false, error: error.message || 'Erro ao listar etapas' };
  }
}

export async function criarEtapa(nome: string, ordem?: number) {
  try {
    // Verificar se já existe
    const existente = await db.etapa.findUnique({
      where: { nome },
    });
    if (existente) {
      return { success: false, error: 'Já existe uma etapa com este nome' };
    }

    // Se não informou ordem, buscar a última
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const ultima = await db.etapa.findFirst({
        orderBy: { ordem: 'desc' },
      });
      ordemFinal = ultima ? (ultima.ordem || 0) + 1 : 1;
    }

    const etapa = await db.etapa.create({
      data: {
        nome,
        ordem: ordemFinal,
        ativo: true,
      },
    });

    revalidatePath('/eng/orcamento');
    return { success: true, etapa };
  } catch (error: any) {
    console.error('Erro ao criar etapa:', error);
    return { success: false, error: error.message || 'Erro ao criar etapa' };
  }
}

export async function atualizarEtapa(id: string, dados: { nome?: string; ordem?: number; ativo?: boolean }) {
  try {
    // Se está atualizando o nome, verificar se já existe outro com o mesmo nome
    if (dados.nome) {
      const existente = await db.etapa.findFirst({
        where: {
          nome: dados.nome,
          id: { not: id },
        },
      });
      if (existente) {
        return { success: false, error: 'Já existe outra etapa com este nome' };
      }
    }

    const etapa = await db.etapa.update({
      where: { id },
      data: dados,
    });

    revalidatePath('/eng/orcamento');
    return { success: true, etapa };
  } catch (error: any) {
    console.error('Erro ao atualizar etapa:', error);
    return { success: false, error: error.message || 'Erro ao atualizar etapa' };
  }
}

export async function excluirEtapa(id: string) {
  try {
    await db.etapa.delete({
      where: { id },
    });

    revalidatePath('/eng/orcamento');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir etapa:', error);
    return { success: false, error: error.message || 'Erro ao excluir etapa' };
  }
}

// ============================================
// SUBETAPAS
// ============================================

export async function listarSubEtapas() {
  try {
    const subEtapas = await db.subEtapa.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }, // Ordem alfabética
    });
    return { success: true, subEtapas };
  } catch (error: any) {
    console.error('Erro ao listar subetapas:', error);
    return { success: false, error: error.message || 'Erro ao listar subetapas' };
  }
}

export async function criarSubEtapa(nome: string, ordem?: number) {
  try {
    // Verificar se já existe
    const existente = await db.subEtapa.findUnique({
      where: { nome },
    });
    if (existente) {
      return { success: false, error: 'Já existe uma subetapa com este nome' };
    }

    // Se não informou ordem, buscar a última
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const ultima = await db.subEtapa.findFirst({
        orderBy: { ordem: 'desc' },
      });
      ordemFinal = ultima ? (ultima.ordem || 0) + 1 : 1;
    }

    const subEtapa = await db.subEtapa.create({
      data: {
        nome,
        ordem: ordemFinal,
        ativo: true,
      },
    });

    revalidatePath('/eng/orcamento');
    return { success: true, subEtapa };
  } catch (error: any) {
    console.error('Erro ao criar subetapa:', error);
    return { success: false, error: error.message || 'Erro ao criar subetapa' };
  }
}

export async function atualizarSubEtapa(id: string, dados: { nome?: string; ordem?: number; ativo?: boolean }) {
  try {
    // Se está atualizando o nome, verificar se já existe outro com o mesmo nome
    if (dados.nome) {
      const existente = await db.subEtapa.findFirst({
        where: {
          nome: dados.nome,
          id: { not: id },
        },
      });
      if (existente) {
        return { success: false, error: 'Já existe outra subetapa com este nome' };
      }
    }

    const subEtapa = await db.subEtapa.update({
      where: { id },
      data: dados,
    });

    revalidatePath('/eng/orcamento');
    return { success: true, subEtapa };
  } catch (error: any) {
    console.error('Erro ao atualizar subetapa:', error);
    return { success: false, error: error.message || 'Erro ao atualizar subetapa' };
  }
}

export async function excluirSubEtapa(id: string) {
  try {
    await db.subEtapa.delete({
      where: { id },
    });

    revalidatePath('/eng/orcamento');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir subetapa:', error);
    return { success: false, error: error.message || 'Erro ao excluir subetapa' };
  }
}

// ============================================
// SERVIÇOS SIMPLIFICADOS
// ============================================

export async function listarServicosSimplificados() {
  try {
    const servicos = await db.servicoSimplificado.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }, // Ordem alfabética
    });
    return { success: true, servicos };
  } catch (error: any) {
    console.error('Erro ao listar serviços simplificados:', error);
    return { success: false, error: error.message || 'Erro ao listar serviços simplificados' };
  }
}

export async function criarServicoSimplificado(nome: string, ordem?: number) {
  try {
    // Verificar se já existe
    const existente = await db.servicoSimplificado.findUnique({
      where: { nome },
    });
    if (existente) {
      return { success: false, error: 'Já existe um serviço simplificado com este nome' };
    }

    // Se não informou ordem, buscar a última
    let ordemFinal = ordem;
    if (ordemFinal === undefined) {
      const ultima = await db.servicoSimplificado.findFirst({
        orderBy: { ordem: 'desc' },
      });
      ordemFinal = ultima ? (ultima.ordem || 0) + 1 : 1;
    }

    const servico = await db.servicoSimplificado.create({
      data: {
        nome,
        ordem: ordemFinal,
        ativo: true,
      },
    });

    revalidatePath('/eng/orcamento');
    return { success: true, servico };
  } catch (error: any) {
    console.error('Erro ao criar serviço simplificado:', error);
    return { success: false, error: error.message || 'Erro ao criar serviço simplificado' };
  }
}

export async function atualizarServicoSimplificado(id: string, dados: { nome?: string; ordem?: number; ativo?: boolean }) {
  try {
    // Se está atualizando o nome, verificar se já existe outro com o mesmo nome
    if (dados.nome) {
      const existente = await db.servicoSimplificado.findFirst({
        where: {
          nome: dados.nome,
          id: { not: id },
        },
      });
      if (existente) {
        return { success: false, error: 'Já existe outro serviço simplificado com este nome' };
      }
    }

    const servico = await db.servicoSimplificado.update({
      where: { id },
      data: dados,
    });

    revalidatePath('/eng/orcamento');
    return { success: true, servico };
  } catch (error: any) {
    console.error('Erro ao atualizar serviço simplificado:', error);
    return { success: false, error: error.message || 'Erro ao atualizar serviço simplificado' };
  }
}

export async function excluirServicoSimplificado(id: string) {
  try {
    await db.servicoSimplificado.delete({
      where: { id },
    });

    revalidatePath('/eng/orcamento');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir serviço simplificado:', error);
    return { success: false, error: error.message || 'Erro ao excluir serviço simplificado' };
  }
}

// ============================================
// LISTA PADRÃO
// ============================================

export async function limparDuplicadosListas() {
  try {
    // Remover duplicados mantendo apenas o primeiro de cada nome
    // Para ServicoSimplificado
    const servicos = await db.servicoSimplificado.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const servicosUnicos = new Map<string, string>();
    const servicosParaDeletar: string[] = [];
    
    for (const servico of servicos) {
      if (servicosUnicos.has(servico.nome)) {
        servicosParaDeletar.push(servico.id);
      } else {
        servicosUnicos.set(servico.nome, servico.id);
      }
    }
    
    if (servicosParaDeletar.length > 0) {
      await db.servicoSimplificado.deleteMany({
        where: { id: { in: servicosParaDeletar } },
      });
    }

    // Para SubEtapa
    const subEtapas = await db.subEtapa.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const subEtapasUnicas = new Map<string, string>();
    const subEtapasParaDeletar: string[] = [];
    
    for (const subEtapa of subEtapas) {
      if (subEtapasUnicas.has(subEtapa.nome)) {
        subEtapasParaDeletar.push(subEtapa.id);
      } else {
        subEtapasUnicas.set(subEtapa.nome, subEtapa.id);
      }
    }
    
    if (subEtapasParaDeletar.length > 0) {
      await db.subEtapa.deleteMany({
        where: { id: { in: subEtapasParaDeletar } },
      });
    }

    // Para Etapa
    const etapas = await db.etapa.findMany({
      orderBy: { createdAt: 'asc' },
    });
    const etapasUnicas = new Map<string, string>();
    const etapasParaDeletar: string[] = [];
    
    for (const etapa of etapas) {
      if (etapasUnicas.has(etapa.nome)) {
        etapasParaDeletar.push(etapa.id);
      } else {
        etapasUnicas.set(etapa.nome, etapa.id);
      }
    }
    
    if (etapasParaDeletar.length > 0) {
      await db.etapa.deleteMany({
        where: { id: { in: etapasParaDeletar } },
      });
    }

    revalidatePath('/eng/orcamento');
    return {
      success: true,
      servicosRemovidos: servicosParaDeletar.length,
      subEtapasRemovidas: subEtapasParaDeletar.length,
      etapasRemovidas: etapasParaDeletar.length,
    };
  } catch (error: any) {
    console.error('Erro ao limpar duplicados:', error);
    return { success: false, error: error.message || 'Erro ao limpar duplicados' };
  }
}

// ============================================
// LIMPAR TUDO (RECOMEÇAR DO ZERO) - SEM RECRIAR
// ============================================

export async function limparSubEtapasEServicosCompleto() {
  try {
    // Deletar TODOS os registros de SubEtapa e ServicoSimplificado
    const deletedSubEtapas = await db.subEtapa.deleteMany({});
    const deletedServicos = await db.servicoSimplificado.deleteMany({});

    revalidatePath('/eng/orcamento');
    return { 
      success: true, 
      message: 'SubEtapas e Serviços Simplificados apagados completamente. Importe os dados via Excel.',
      deletados: {
        subEtapas: deletedSubEtapas.count,
        servicos: deletedServicos.count,
      },
    };
  } catch (error: any) {
    console.error('Erro ao limpar SubEtapas e Serviços:', error);
    return { success: false, error: error.message || 'Erro ao limpar SubEtapas e Serviços' };
  }
}

// ============================================
// POPULAR LISTAS COM MOCKS (apenas para Etapas agora)
// ============================================
export async function popularListasComMocks() {
  try {
    // Importar lista padrão (estrutura hierárquica completa)
    const { MOCK_CATEGORIZACAO_ITENS } = await import('@/lib/mock-data');
    
    // Extrair valores únicos
    const etapasUnicas = new Set<string>();
    const subEtapasUnicas = new Set<string>();
    const servicosUnicos = new Set<string>();

    MOCK_CATEGORIZACAO_ITENS.forEach((item) => {
      if (item.etapa) etapasUnicas.add(item.etapa);
      if (item.subetapa) subEtapasUnicas.add(item.subetapa);
      if (item.servicoSimplificado) servicosUnicos.add(item.servicoSimplificado);
    });

    const resultados = {
      etapasCriadas: 0,
      subEtapasCriadas: 0,
      servicosCriados: 0,
    };

    // OTIMIZAÇÃO: Buscar todos os registros existentes de uma vez
    const etapasExistentes = await db.etapa.findMany({ select: { nome: true } });
    const subEtapasExistentes = await db.subEtapa.findMany({ select: { nome: true } });
    const servicosExistentes = await db.servicoSimplificado.findMany({ select: { nome: true } });
    
    const nomesEtapasExistentes = new Set(etapasExistentes.map(e => e.nome));
    const nomesSubEtapasExistentes = new Set(subEtapasExistentes.map(s => s.nome));
    const nomesServicosExistentes = new Set(servicosExistentes.map(s => s.nome));

    // Criar etapas em LOTE (createMany)
    const etapasParaCriar = Array.from(etapasUnicas)
      .sort()
      .filter(nome => !nomesEtapasExistentes.has(nome))
      .map((nome, index) => ({
        nome,
        ordem: nomesEtapasExistentes.size + index + 1,
        ativo: true,
      }));

    if (etapasParaCriar.length > 0) {
      const result = await db.etapa.createMany({
        data: etapasParaCriar,
        skipDuplicates: true,
      });
      resultados.etapasCriadas = result.count;
    }

    // Criar subetapas em LOTE (createMany)
    const subEtapasParaCriar = Array.from(subEtapasUnicas)
      .sort()
      .filter(nome => !nomesSubEtapasExistentes.has(nome))
      .map((nome, index) => ({
        nome,
        ordem: nomesSubEtapasExistentes.size + index + 1,
        ativo: true,
      }));

    if (subEtapasParaCriar.length > 0) {
      const result = await db.subEtapa.createMany({
        data: subEtapasParaCriar,
        skipDuplicates: true,
      });
      resultados.subEtapasCriadas = result.count;
    }

    // Criar serviços simplificados em LOTE (createMany)
    const servicosParaCriar = Array.from(servicosUnicos)
      .sort()
      .filter(nome => !nomesServicosExistentes.has(nome))
      .map((nome, index) => ({
        nome,
        ordem: nomesServicosExistentes.size + index + 1,
        ativo: true,
      }));

    if (servicosParaCriar.length > 0) {
      const result = await db.servicoSimplificado.createMany({
        data: servicosParaCriar,
        skipDuplicates: true,
      });
      resultados.servicosCriados = result.count;
    }

    revalidatePath('/eng/orcamento');
    return {
      success: true,
      ...resultados,
    };
  } catch (error: any) {
    console.error('Erro ao carregar lista padrão:', error);
    return { success: false, error: error.message || 'Erro ao carregar lista padrão' };
  }
}
