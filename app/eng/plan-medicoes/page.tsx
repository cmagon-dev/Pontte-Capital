import { db } from '@/lib/db';
import { listarObras } from '@/app/actions/obras';
import PlanMedicoesContent from './PlanMedicoesContent';

export default async function PlanMedicoesPage() {
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
      return {
        id: obra.id,
        codigo: obra.codigo,
        nome: obra.nome,
        status: obra.status,
        valorContrato: Number(obra.valorContrato),
      };
    });

    const obrasAtivas = obrasFormatadas.filter(o => o.status === 'EM_ANDAMENTO').length;
    const obrasAtrasadas = obrasFormatadas.filter(o => o.status === 'PARALISADA').length;
    const valorTotal = obrasFormatadas.reduce((sum, o) => sum + o.valorContrato, 0);

    return {
      construtoraId: construtora.id,
      construtoraNome: construtora.razaoSocial,
      construtoraCnpj: construtora.cnpj,
      totalObras: obrasFormatadas.length,
      obrasAtivas,
      obrasAtrasadas,
      valorTotal,
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
    <PlanMedicoesContent
      construtorasComObras={construtorasComObras}
      totalConstrutoras={totalConstrutoras}
      totalObras={totalObras}
      totalValor={totalValor}
    />
  );
}
