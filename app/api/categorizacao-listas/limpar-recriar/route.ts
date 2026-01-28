import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * API Route para limpar APENAS as listas de SubEtapa e ServicoSimplificado
 * 
 * ATENÇÃO: Esta rota apenas APAGA os dados. Não recria nada.
 * Depois de usar esta rota, você deve importar os dados via Excel na página de categorização.
 * 
 * Acesse: http://localhost:3000/api/categorizacao-listas/limpar-recriar
 */
export async function POST() {
  try {
    console.log('🗑️  Limpando SubEtapas e ServiçosSimplificados...');
    
    // Deletar TODOS os registros de SubEtapa e ServicoSimplificado
    const deletedSubEtapas = await db.subEtapa.deleteMany({});
    const deletedServicos = await db.servicoSimplificado.deleteMany({});
    
    console.log(`✅ ${deletedSubEtapas.count} SubEtapas deletadas`);
    console.log(`✅ ${deletedServicos.count} ServiçosSimplificados deletados`);
    console.log('\n✨ Limpeza concluída com sucesso!');
    console.log('📝 Próximo passo: Importe os dados via Excel na página de categorização');

    return NextResponse.json({
      success: true,
      message: 'Listas limpas com sucesso. Importe os dados via Excel na página de categorização.',
      deletados: {
        subEtapas: deletedSubEtapas.count,
        servicos: deletedServicos.count,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao limpar listas:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao limpar listas',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

// Também permitir GET para facilitar teste no navegador
export async function GET() {
  return NextResponse.json({
    message: 'Use POST para executar a limpeza das listas',
    endpoint: 'POST /api/categorizacao-listas/limpar-recriar',
    descricao: 'Apaga TODAS as SubEtapas e ServiçosSimplificados (SEM recriar). Depois importe via Excel.',
  });
}
