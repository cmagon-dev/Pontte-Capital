import { db } from '@/lib/db';
import { listarObras } from '@/app/actions/obras';
import PlanMedicoesPorConstrutoraContent from './PlanMedicoesPorConstrutoraContent';

export default async function PlanMedicoesPorConstrutoraPage({ 
  params 
}: { 
  params: { construtoraId: string } 
}) {
  // Buscar construtora do banco
  const construtora = await db.construtora.findUnique({
    where: { id: params.construtoraId },
    select: {
      id: true,
      codigo: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
    },
  });

  if (!construtora) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">Construtora não encontrada</p>
        </div>
      </div>
    );
  }

  // Buscar obras desta construtora
  const todasObras = await listarObras();
  const obrasConstrutora = todasObras.filter(obra => obra.construtoraId === params.construtoraId);

  // Helper para calcular valor atualizado do contrato (com aditivos e reajustes)
  const calcularValorAtualizado = (obra: any): number => {
    const valorBase = Number(obra.valorContrato) || 0;
    
    // Somar aditivos aprovados (valor - glosa)
    const valorAditivos = obra.aditivos?.reduce((acc: number, aditivo: any) => {
      const valor = Number(aditivo.valorAditivo) || 0;
      const glosa = Number(aditivo.valorGlosa) || 0;
      return acc + (valor - glosa);
    }, 0) || 0;
    
    // Somar reajustes aplicados
    const valorReajustes = obra.reajustes?.reduce((acc: number, reajuste: any) => {
      return acc + (Number(reajuste.valorReajuste) || 0);
    }, 0) || 0;
    
    return valorBase + valorAditivos + valorReajustes;
  };

  // Mapear status do banco para exibição
  const mapearStatus = (status: string): string => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'Ativa';
      case 'PARALISADA':
        return 'Atrasada';
      case 'NAO_INICIADA':
        return 'Em Planejamento';
      case 'CONCLUIDA':
        return 'Finalizada';
      case 'CANCELADA':
        return 'Parada';
      default:
        return status;
    }
  };

  // Formatar obras com dados do banco
  const obrasFormatadas = obrasConstrutora.map(obra => {
    const valorAtualizado = calcularValorAtualizado(obra);
    
    return {
      id: obra.id,
      codigo: obra.codigo,
      nome: obra.nome,
      contratante: obra.contratante?.razaoSocial || obra.contratante?.nomeFantasia || 'N/A',
      valorContrato: valorAtualizado, // Valor atualizado com aditivos e reajustes
      endereco: obra.endereco || '',
      cidade: obra.cidade || '',
      estado: obra.estado || '',
      dataInicio: obra.dataInicioExecucao || obra.dataInicio,
      dataFim: obra.dataFimExecucao || obra.dataFim,
      status: obra.status,
      statusExibicao: mapearStatus(obra.status),
    };
  });

  const resumoConstrutora = {
    totalObras: obrasConstrutora.length,
    valorTotal: obrasFormatadas.reduce((sum, o) => sum + o.valorContrato, 0),
  };

  return (
    <PlanMedicoesPorConstrutoraContent
      construtora={construtora}
      obras={obrasFormatadas}
      construtoraId={params.construtoraId}
      resumo={resumoConstrutora}
    />
  );
}
