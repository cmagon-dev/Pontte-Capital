import { db } from '@/lib/db';
import { listarObras } from '@/app/actions/obras';
import OrcamentoPorConstrutoraContent from './OrcamentoPorConstrutoraContent';

export default async function OrcamentoPorConstrutoraPage({ 
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

  // Buscar versões de orçamento ativas para calcular percentual orçado
  const obrasIds = obrasConstrutora.map(o => o.id);
  const versoesOrcamento = obrasIds.length > 0 ? await db.versaoOrcamento.findMany({
    where: {
      obraId: { in: obrasIds },
      status: 'ATIVA',
    },
    include: {
      itens: {
        where: {
          tipo: 'ITEM',
        },
        select: {
          precoTotalVenda: true,
        },
      },
    },
  }) : [];

  // Buscar versões de custos orçados ativas para calcular percentual orçado e margem
  const versoesCustoOrcado = obrasIds.length > 0 ? await db.versaoCustoOrcado.findMany({
    where: {
      obraId: { in: obrasIds },
      status: 'ATIVA',
    },
    include: {
      itens: {
        where: {
          tipo: 'ITEM',
        },
        select: {
          precoTotalVenda: true,
          valorMaterial: true,
          valorMaoDeObra: true,
          valorEquipamento: true,
          valorVerba: true,
          custoTotal: true,
          lucroProjetado: true,
        },
      },
    },
  }) : [];

  // Criar mapa de versões por obra
  const versoesPorObra: Record<string, typeof versoesOrcamento[0] | undefined> = {};
  versoesOrcamento.forEach(versao => {
    versoesPorObra[versao.obraId] = versao;
  });

  // Criar mapa de versões de custos por obra
  const versoesCustoPorObra: Record<string, typeof versoesCustoOrcado[0] | undefined> = {};
  versoesCustoOrcado.forEach(versao => {
    versoesCustoPorObra[versao.obraId] = versao;
  });

  // Função para calcular percentual orçado de uma obra
  const calcularPercentualOrcado = (obraId: string): number => {
    const versao = versoesPorObra[obraId];
    const versaoCusto = versoesCustoPorObra[obraId];
    
    if (!versao || versao.itens.length === 0) return 0;
    if (!versaoCusto || versaoCusto.itens.length === 0) return 0;
    
    // Contar itens com custos não zerados
    const itensComCusto = versaoCusto.itens.filter(item => {
      const custoTotal = Number(item.valorMaterial) + 
                       Number(item.valorMaoDeObra) + 
                       Number(item.valorEquipamento) + 
                       Number(item.valorVerba);
      return custoTotal > 0.01; // Tolerância para valores muito pequenos
    });
    
    return (itensComCusto.length / versao.itens.length) * 100;
  };

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
    const percentualOrcado = calcularPercentualOrcado(obra.id);
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
      percentualOrcado,
    };
  });

  // Calcular resumo geral da construtora
  let valorTotalPlanilhas = 0;
  let custoTotalOrcado = 0;
  let lucroTotalProjetado = 0;
  let totalItens = 0;
  let itensOrcados = 0;

  versoesCustoOrcado.forEach(versao => {
    versao.itens.forEach(item => {
      const precoVenda = Number(item.precoTotalVenda) || 0;
      const custo = Number(item.custoTotal) || 0;
      const lucro = Number(item.lucroProjetado) || 0;

      valorTotalPlanilhas += precoVenda;
      totalItens++;
      
      // Considerar apenas itens orçados (com custo > 0)
      if (custo > 0.01) {
        custoTotalOrcado += custo;
        lucroTotalProjetado += lucro;
        itensOrcados++;
      }
    });
  });

  // Calcular percentual orçado geral
  const percentualOrcado = totalItens > 0
    ? (itensOrcados / totalItens) * 100
    : 0;

  // Calcular margem projetada (apenas dos itens orçados)
  const margemProjetada = valorTotalPlanilhas > 0
    ? (lucroTotalProjetado / valorTotalPlanilhas) * 100
    : 0;

  const resumoConstrutora = {
    totalObras: obrasConstrutora.length,
    valorTotalPlanilhas,
    percentualOrcado,
    margemProjetada,
  };

  return (
    <OrcamentoPorConstrutoraContent
      construtora={construtora}
      obras={obrasFormatadas}
      construtoraId={params.construtoraId}
      resumo={resumoConstrutora}
    />
  );
}
