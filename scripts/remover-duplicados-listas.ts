import { db } from '../lib/db';

async function removerDuplicados() {
  try {
    console.log('Removendo duplicados das listas de categorização...');
    
    // Remover duplicados de ServicoSimplificado, mantendo apenas o primeiro de cada nome
    await db.$executeRaw`
      DELETE FROM "ServicoSimplificado" a
      USING "ServicoSimplificado" b
      WHERE a.id > b.id AND a.nome = b.nome;
    `;
    
    // Remover duplicados de SubEtapa, mantendo apenas o primeiro de cada nome
    await db.$executeRaw`
      DELETE FROM "SubEtapa" a
      USING "SubEtapa" b
      WHERE a.id > b.id AND a.nome = b.nome;
    `;
    
    // Etapas já devem ser únicas, mas vamos garantir
    await db.$executeRaw`
      DELETE FROM "Etapa" a
      USING "Etapa" b
      WHERE a.id > b.id AND a.nome = b.nome;
    `;
    
    console.log('Duplicados removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao remover duplicados:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

removerDuplicados();
