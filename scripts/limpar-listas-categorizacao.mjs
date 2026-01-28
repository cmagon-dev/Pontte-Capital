import { db } from '../lib/db.ts';

async function limparListas() {
  try {
    console.log('Limpando dados das listas de categorização...');
    
    // Deletar todos os registros
    await db.servicoSimplificado.deleteMany({});
    await db.subEtapa.deleteMany({});
    await db.etapa.deleteMany({});
    
    console.log('Dados limpos com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

limparListas();
