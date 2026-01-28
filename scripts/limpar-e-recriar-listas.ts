/**
 * Script para limpar e recriar as listas de SubEtapa e ServicoSimplificado
 * 
 * Este script:
 * 1. Apaga TODAS as SubEtapas e ServiçosSimplificados do banco
 * 2. Recria as listas usando os dados de mock de forma otimizada (createMany)
 * 
 * Uso: npx tsx scripts/limpar-e-recriar-listas.ts
 */

import { db } from '../lib/db';

async function limparERecriarListas() {
  try {
    console.log('🗑️  Limpando SubEtapas e ServiçosSimplificados...');
    
    // 1. Deletar TODOS os registros
    const deletedSubEtapas = await db.subEtapa.deleteMany({});
    const deletedServicos = await db.servicoSimplificado.deleteMany({});
    
    console.log(`✅ ${deletedSubEtapas.count} SubEtapas deletadas`);
    console.log(`✅ ${deletedServicos.count} ServiçosSimplificados deletados`);
    
    console.log('\n📦 Importando dados de mock...');
    
    // 2. Importar dados de mock
    const { MOCK_CATEGORIZACAO_ITENS } = await import('../lib/mock-data');
    
    // Extrair valores únicos
    const subEtapasUnicas = new Set<string>();
    const servicosUnicos = new Set<string>();

    MOCK_CATEGORIZACAO_ITENS.forEach((item) => {
      if (item.subetapa) subEtapasUnicas.add(item.subetapa);
      if (item.servicoSimplificado) servicosUnicos.add(item.servicoSimplificado);
    });

    console.log(`📊 Encontrados ${subEtapasUnicas.size} SubEtapas únicas`);
    console.log(`📊 Encontrados ${servicosUnicos.size} Serviços Simplificados únicos`);

    // 3. Criar SubEtapas em LOTE (createMany - muito mais rápido!)
    console.log('\n⚡ Criando SubEtapas em lote...');
    const subEtapasParaCriar = Array.from(subEtapasUnicas)
      .sort()
      .map((nome, index) => ({
        nome,
        ordem: index + 1,
        ativo: true,
      }));

    const resultSubEtapas = await db.subEtapa.createMany({
      data: subEtapasParaCriar,
      skipDuplicates: true,
    });
    
    console.log(`✅ ${resultSubEtapas.count} SubEtapas criadas`);

    // 4. Criar Serviços Simplificados em LOTE (createMany - muito mais rápido!)
    console.log('\n⚡ Criando Serviços Simplificados em lote...');
    const servicosParaCriar = Array.from(servicosUnicos)
      .sort()
      .map((nome, index) => ({
        nome,
        ordem: index + 1,
        ativo: true,
      }));

    const resultServicos = await db.servicoSimplificado.createMany({
      data: servicosParaCriar,
      skipDuplicates: true,
    });
    
    console.log(`✅ ${resultServicos.count} Serviços Simplificados criados`);

    console.log('\n✨ Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar e recriar listas:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Executar
limparERecriarListas()
  .then(() => {
    console.log('\n🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script falhou:', error);
    process.exit(1);
  });
