import { db } from '@/lib/db';
import { listarObras } from '@/app/actions/obras';
import OrcamentoContent from './OrcamentoContent';

export default async function OrcamentoPage() {
  // Buscar todas as construtoras do banco
  const construtoras = await db.construtora.findMany({
    select: {
      id: true,
      codigo: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
    },
    orderBy: { razaoSocial: 'asc' },
  });

  // Buscar todas as obras
  const obras = await listarObras();

  // Buscar versões de orçamento ativas para calcular percentual orçado
  const obrasIds = obras.map(o => o.id);
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
      },
    },
  }) : [];

  // Buscar versões de custos orçados ativas para calcular percentual orçado
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

  // Criar mapa de obras por construtora
  const obrasPorConstrutora: Record<string, typeof obras> = {};
  obras.forEach(obra => {
    if (!obrasPorConstrutora[obra.construtoraId]) {
      obrasPorConstrutora[obra.construtoraId] = [];
    }
    obrasPorConstrutora[obra.construtoraId].push(obra);
  });

  // Agrupar obras por construtora e calcular estatísticas
  const construtorasComObras = construtoras.map(construtora => {
    const obrasConstrutora = obrasPorConstrutora[construtora.id] || [];
    
    const obrasFormatadas = obrasConstrutora.map(obra => {
      const percentualOrcado = calcularPercentualOrcado(obra.id);
      
      return {
        id: obra.id,
        codigo: obra.codigo,
        nome: obra.nome,
        status: obra.status,
        valorContrato: Number(obra.valorContrato),
        percentualOrcado,
      };
    });

    const obrasAtivas = obrasFormatadas.filter(o => o.status === 'EM_ANDAMENTO').length;
    const obrasAtrasadas = obrasFormatadas.filter(o => o.status === 'PARALISADA').length;
    const valorTotal = obrasFormatadas.reduce((sum, o) => sum + o.valorContrato, 0);
    const percentualOrcadoMedio = obrasFormatadas.length > 0
      ? obrasFormatadas.reduce((sum, o) => sum + o.percentualOrcado, 0) / obrasFormatadas.length
      : 0;

    return {
      construtoraId: construtora.id,
      construtoraNome: construtora.razaoSocial,
      construtoraCnpj: construtora.cnpj,
      totalObras: obrasFormatadas.length,
      obrasAtivas,
      obrasAtrasadas,
      valorTotal,
      percentualOrcadoMedio,
      obras: obrasFormatadas,
    };
  });

  // Buscar todos os aditivos de valor e reajustes para cálculo do valor total
  const aditivos = obrasIds.length > 0 ? await db.aditivo.findMany({
    where: {
      obraId: { in: obrasIds },
      tipo: 'VALOR',
      status: 'APROVADO',
    },
    select: {
      obraId: true,
      valorAditivo: true,
    },
  }) : [];

  const reajustes = obrasIds.length > 0 ? await db.reajuste.findMany({
    where: {
      obraId: { in: obrasIds },
      status: 'APLICADO',
    },
    select: {
      obraId: true,
      valorReajuste: true,
    },
  }) : [];

  // Calcular valor total de todas as obras incluindo aditivos e reajustes
  const totalValor = obras.reduce((sum, obra) => {
    const valorContrato = Number(obra.valorContrato);
    
    // Somar aditivos da obra
    const valorAditivos = aditivos
      .filter(a => a.obraId === obra.id)
      .reduce((s, a) => s + Number(a.valorAditivo), 0);
    
    // Somar reajustes da obra
    const valorReajustes = reajustes
      .filter(r => r.obraId === obra.id)
      .reduce((s, r) => s + Number(r.valorReajuste), 0);
    
    return sum + valorContrato + valorAditivos + valorReajustes;
  }, 0);

  // Totais gerais
  const totalConstrutoras = construtoras.length;
  const totalObras = obras.length;

  return (
    <OrcamentoContent
      construtorasComObras={construtorasComObras}
      totalConstrutoras={totalConstrutoras}
      totalObras={totalObras}
      totalValor={totalValor}
    />
  );
}
