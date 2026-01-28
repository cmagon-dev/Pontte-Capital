import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { buscarDadosObra } from '@/app/actions/canteiro-360';
import ViewerContent from './ViewerContent';

export default async function Registros360ViewerPage({ 
  params 
}: { 
  params: { construtoraId: string; obraId: string }
}) {
  // Buscar obra
  const obra = await db.obra.findUnique({
    where: { id: params.obraId },
    select: {
      id: true,
      codigo: true,
      nome: true,
      construtoraId: true,
    },
  });

  if (!obra) {
    console.error('❌ Obra não encontrada no banco:', params.obraId);
    notFound();
  }

  if (obra.construtoraId !== params.construtoraId) {
    console.error('❌ ConstrutoraId não corresponde. Obra pertence a:', obra.construtoraId, 'mas foi acessada via:', params.construtoraId);
    notFound();
  }

  try {

    // Buscar dados completos da obra
    let resultado;
    try {
      resultado = await buscarDadosObra(params.obraId);
    } catch (error) {
      console.error('Erro ao buscar dados da obra:', error);
      // Continuar mesmo com erro, apenas sem plantas
      resultado = { success: false, message: 'Erro ao buscar dados', data: null };
    }
    
    let plantaImplantacao = null;
    
    if (resultado.success && resultado.data) {
      const implantacao = resultado.data.plantas.find(p => p.tipo === 'IMPLANTACAO');
      
      if (implantacao) {
        plantaImplantacao = {
          id: implantacao.id,
          nome: implantacao.nome,
          imagemUrl: implantacao.imagemUrl,
          pontos: implantacao.pontos.map(p => ({
            id: p.id,
            nome: p.nome,
            x: p.x,
            y: p.y,
            fotos: (p.todasFotos || (p.ultimaFoto ? [p.ultimaFoto] : [])).map(f => ({
              id: f.id,
              dataCaptura: new Date(f.dataCaptura),
              urlArquivo: f.urlArquivo,
              pontoMonitoramentoId: p.id,
            })),
          })),
          setores: implantacao.setores.map(s => ({
            id: s.id,
            nome: s.nome,
            cor: s.cor,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
            plantasFilhas: s.plantasFilhas || [],
          })),
        };
      }
    }

    return (
      <ViewerContent
        params={params}
        obra={obra}
        plantaImplantacao={plantaImplantacao}
      />
    );
  } catch (error) {
    console.error('Erro ao carregar página do viewer:', error);
    notFound();
  }
}
