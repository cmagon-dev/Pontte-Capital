import { db } from '../lib/db.js';

async function testarSubEtapa() {
  try {
    console.log('Testando conexão com SubEtapa...');
    
    // Testar se o modelo existe
    console.log('db.subEtapa existe?', !!db.subEtapa);
    
    // Tentar listar todas as subetapas
    const todas = await db.subEtapa.findMany();
    console.log('Total de subetapas:', todas.length);
    
    // Tentar criar uma subetapa de teste
    const teste = await db.subEtapa.create({
      data: {
        nome: `TESTE_${Date.now()}`,
        ordem: 999,
        ativo: true,
      },
    });
    console.log('SubEtapa de teste criada:', teste.id);
    
    // Deletar a subetapa de teste
    await db.subEtapa.delete({
      where: { id: teste.id },
    });
    console.log('SubEtapa de teste deletada');
    
    console.log('✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
  } finally {
    await db.$disconnect();
  }
}

testarSubEtapa();
