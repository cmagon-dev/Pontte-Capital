'use server';

import { db } from '@/lib/db';

/**
 * Server Action temporária para diagnosticar problemas de hierarquia no banco de dados
 * 
 * Esta função verifica:
 * - Total de itens
 * - Itens órfãos (nível > 0 mas parentId === null)
 * - Agrupadores vazios (tipo AGRUPADOR sem filhos)
 * - Exemplos de falhas
 */
export async function diagnosticarHierarquia(obraId: string) {
  try {
    console.log('\n========================================');
    console.log('🔍 DIAGNÓSTICO DE HIERARQUIA');
    console.log('========================================\n');

    // Buscar versão ativa
    const versaoAtiva = await db.versaoOrcamento.findFirst({
      where: {
        obraId,
        status: 'ATIVA',
      },
      select: {
        id: true,
        nome: true,
        numero: true,
      },
    });

    if (!versaoAtiva) {
      console.log('❌ Nenhuma versão ativa encontrada para esta obra.');
      return {
        success: false,
        error: 'Nenhuma versão ativa encontrada',
      };
    }

    console.log(`📋 Versão Ativa: ${versaoAtiva.nome} (Nº ${versaoAtiva.numero})`);
    console.log(`📋 Versão ID: ${versaoAtiva.id}\n`);

    // Buscar todos os itens da versão ativa
    const itens = await db.itemOrcamento.findMany({
      where: {
        versaoId: versaoAtiva.id,
      },
      orderBy: [
        { nivel: 'asc' },
        { ordem: 'asc' },
      ],
      select: {
        id: true,
        codigo: true,
        nivel: true,
        parentId: true,
        tipo: true,
        discriminacao: true,
        precoTotalVenda: true,
      },
    });

    // ========================================
    // 1. TOTAL DE ITENS
    // ========================================
    console.log('📊 ESTATÍSTICAS GERAIS');
    console.log('----------------------------------------');
    console.log(`Total de Itens: ${itens.length}`);

    const itensPorNivel = new Map<number, number>();
    const itensPorTipo = new Map<string, number>();
    
    itens.forEach(item => {
      itensPorNivel.set(item.nivel, (itensPorNivel.get(item.nivel) || 0) + 1);
      itensPorTipo.set(item.tipo, (itensPorTipo.get(item.tipo) || 0) + 1);
    });

    console.log('\nItens por Nível:');
    Array.from(itensPorNivel.entries())
      .sort(([a], [b]) => a - b)
      .forEach(([nivel, count]) => {
        console.log(`  Nível ${nivel}: ${count} itens`);
      });

    console.log('\nItens por Tipo:');
    itensPorTipo.forEach((count, tipo) => {
      console.log(`  ${tipo}: ${count} itens`);
    });

    // ========================================
    // 2. ITENS ÓRFÃOS (nível > 0 mas parentId === null)
    // ========================================
    console.log('\n\n🔴 ITENS ÓRFÃOS (ERRO CRÍTICO)');
    console.log('----------------------------------------');
    const orfaos = itens.filter(item => item.nivel > 0 && item.parentId === null);
    console.log(`Total de Órfãos: ${orfaos.length}`);

    if (orfaos.length > 0) {
      console.log('\n⚠️  PROBLEMA DETECTADO: Itens com nível > 0 mas parentId === null');
      console.log('\nPrimeiros 10 órfãos encontrados:');
      orfaos.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. Código: ${item.codigo} | Nível: ${item.nivel} | Tipo: ${item.tipo} | ParentId: ${item.parentId}`);
      });

      // Analisar padrão dos órfãos
      const orfaosPorNivel = new Map<number, number>();
      orfaos.forEach(item => {
        orfaosPorNivel.set(item.nivel, (orfaosPorNivel.get(item.nivel) || 0) + 1);
      });

      console.log('\nÓrfãos por Nível:');
      Array.from(orfaosPorNivel.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([nivel, count]) => {
          console.log(`  Nível ${nivel}: ${count} órfãos`);
        });
    } else {
      console.log('✅ Nenhum órfão encontrado - parentId está correto!');
    }

    // ========================================
    // 3. AGRUPADORES VAZIOS
    // ========================================
    console.log('\n\n🟡 AGRUPADORES VAZIOS');
    console.log('----------------------------------------');
    
    // Criar mapa de filhos por parentId
    const filhosPorParent = new Map<string, number>();
    itens.forEach(item => {
      if (item.parentId) {
        filhosPorParent.set(item.parentId, (filhosPorParent.get(item.parentId) || 0) + 1);
      }
    });

    const agrupadores = itens.filter(item => item.tipo === 'AGRUPADOR');
    const agrupadoresVazios = agrupadores.filter(item => {
      const numFilhos = filhosPorParent.get(item.id) || 0;
      return numFilhos === 0;
    });

    console.log(`Total de Agrupadores: ${agrupadores.length}`);
    console.log(`Agrupadores Vazios (sem filhos): ${agrupadoresVazios.length}`);

    if (agrupadoresVazios.length > 0) {
      console.log('\nPrimeiros 10 agrupadores vazios:');
      agrupadoresVazios.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. Código: ${item.codigo} | Nível: ${item.nivel} | ParentId: ${item.parentId || 'null'}`);
      });
    } else {
      console.log('✅ Todos os agrupadores têm filhos!');
    }

    // ========================================
    // 4. EXEMPLOS DE FALHA
    // ========================================
    console.log('\n\n🔍 ANÁLISE DETALHADA');
    console.log('----------------------------------------');

    // Itens que deveriam ter pai mas não têm
    const itensComProblema = itens.filter(item => {
      // Se tem nível > 0, deveria ter parentId
      if (item.nivel > 0 && !item.parentId) {
        return true;
      }
      return false;
    });

    if (itensComProblema.length > 0) {
      console.log(`\n⚠️  ${itensComProblema.length} itens que DEVERIAM ter pai mas estão com parentId: null`);
      console.log('\nPrimeiros 5 exemplos:');
      itensComProblema.slice(0, 5).forEach((item, index) => {
        // Tentar identificar qual deveria ser o pai baseado no código
        const partesCodigo = item.codigo.split('.');
        const codigoPaiEsperado = partesCodigo.slice(0, -1).join('.');
        
        const paiEsperado = itens.find(i => i.codigo === codigoPaiEsperado);
        
        console.log(`\n  ${index + 1}. Item com problema:`);
        console.log(`     Código: ${item.codigo}`);
        console.log(`     Nível: ${item.nivel}`);
        console.log(`     Tipo: ${item.tipo}`);
        console.log(`     ParentId atual: ${item.parentId || 'null'} ❌`);
        console.log(`     Código do pai esperado: ${codigoPaiEsperado}`);
        if (paiEsperado) {
          console.log(`     ✅ Pai esperado EXISTE no banco (ID: ${paiEsperado.id})`);
          console.log(`     ⚠️  PROBLEMA: O parentId não foi preenchido na importação!`);
        } else {
          console.log(`     ❌ Pai esperado NÃO EXISTE no banco`);
          console.log(`     ⚠️  PROBLEMA: O pai não foi importado ou código está incorreto!`);
        }
      });
    }

    // ========================================
    // 5. VERIFICAÇÃO DE INTEGRIDADE
    // ========================================
    console.log('\n\n✅ VERIFICAÇÃO DE INTEGRIDADE');
    console.log('----------------------------------------');

    // Verificar se todos os parentId apontam para itens válidos
    const parentIdsInvalidos = new Set<string>();
    itens.forEach(item => {
      if (item.parentId) {
        const paiExiste = itens.some(i => i.id === item.parentId);
        if (!paiExiste) {
          parentIdsInvalidos.add(item.parentId);
        }
      }
    });

    if (parentIdsInvalidos.size > 0) {
      console.log(`❌ ${parentIdsInvalidos.size} parentIds apontam para itens que não existem:`);
      Array.from(parentIdsInvalidos).slice(0, 5).forEach(parentId => {
        console.log(`  - ParentId: ${parentId}`);
      });
    } else {
      console.log('✅ Todos os parentIds são válidos');
    }

    // Verificar se itens de nível 0 têm parentId null
    const itensNivel0ComParent = itens.filter(item => item.nivel === 0 && item.parentId !== null);
    if (itensNivel0ComParent.length > 0) {
      console.log(`⚠️  ${itensNivel0ComParent.length} itens de nível 0 têm parentId (deveriam ser null)`);
    } else {
      console.log('✅ Todos os itens de nível 0 têm parentId null');
    }

    // ========================================
    // 6. CÓDIGOS DUPLICADOS
    // ========================================
    console.log('\n\n🔴 CÓDIGOS DUPLICADOS (ERRO CRÍTICO)');
    console.log('----------------------------------------');
    
    // Criar mapa de códigos para contar ocorrências
    const codigosMap = new Map<string, Array<{ id: string; nivel: number; tipo: string }>>();
    itens.forEach(item => {
      if (!codigosMap.has(item.codigo)) {
        codigosMap.set(item.codigo, []);
      }
      codigosMap.get(item.codigo)!.push({
        id: item.id,
        nivel: item.nivel,
        tipo: item.tipo,
      });
    });

    // Encontrar códigos duplicados (aparecem mais de 1 vez)
    const itensDuplicados: Array<{ codigo: string; quantidade: number; ids: string[] }> = [];
    codigosMap.forEach((ocorrencias, codigo) => {
      if (ocorrencias.length > 1) {
        itensDuplicados.push({
          codigo,
          quantidade: ocorrencias.length,
          ids: ocorrencias.map(o => o.id),
        });
      }
    });

    const totalDuplicados = itensDuplicados.length;
    console.log(`Total de Códigos Duplicados: ${totalDuplicados}`);

    if (totalDuplicados > 0) {
      console.log('\n⚠️  PROBLEMA DETECTADO: Códigos duplicados encontrados!');
      console.log('\nPrimeiros 10 códigos duplicados:');
      itensDuplicados.slice(0, 10).forEach((duplicado, index) => {
        console.log(`  ${index + 1}. Código "${duplicado.codigo}" aparece ${duplicado.quantidade} vezes`);
        console.log(`     IDs: ${duplicado.ids.join(', ')}`);
      });
    } else {
      console.log('✅ Nenhum código duplicado encontrado - todos os códigos são únicos!');
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n\n📋 RESUMO FINAL');
    console.log('========================================');
    console.log(`Total de Itens: ${itens.length}`);
    console.log(`Órfãos (nível > 0, parentId null): ${orfaos.length} ${orfaos.length > 0 ? '❌' : '✅'}`);
    console.log(`Agrupadores Vazios: ${agrupadoresVazios.length} ${agrupadoresVazios.length > 0 ? '⚠️' : '✅'}`);
    console.log(`ParentIds Inválidos: ${parentIdsInvalidos.size} ${parentIdsInvalidos.size > 0 ? '❌' : '✅'}`);
    console.log(`Códigos Duplicados: ${totalDuplicados} ${totalDuplicados > 0 ? '❌' : '✅'}`);
    console.log('========================================\n');

    // Preparar exemplos de órfãos para retornar
    const exemplosOrfaos = orfaos.slice(0, 5).map(item => ({
      codigo: item.codigo,
      nivel: item.nivel,
      tipo: item.tipo,
    }));

    return {
      success: true,
      totalItens: itens.length,
      orfaos: orfaos.length,
      agrupadoresVazios: agrupadoresVazios.length,
      parentIdsInvalidos: parentIdsInvalidos.size,
      totalDuplicados,
      itensDuplicados,
      exemplosOrfaos,
      versaoAtiva: {
        id: versaoAtiva.id,
        nome: versaoAtiva.nome,
        numero: versaoAtiva.numero,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro ao diagnosticar hierarquia:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}
