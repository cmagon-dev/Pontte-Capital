/**
 * Transforma os dados da Categorização (MOCK_CATEGORIZACAO_ITENS) 
 * em estrutura hierárquica de 3 níveis para a EAP:
 * - Nível 1: Etapa (agrupador)
 * - Nível 2: Subetapa (agrupador)
 * - Nível 3: Serviço (item com servicoSimplificado)
 * 
 * Esta é a mesma base de dados que alimenta a Visão Gerencial.
 */

interface CategorizacaoItem {
  id: string;
  item: string;
  referencia: string;
  descricaoOriginal: string;
  etapa: string;
  subetapa: string;
  servicoSimplificado: string;
}

interface HierarchicalItem {
  id: string;
  numeroHierarquico: string;
  descricao: string;
  etapa?: string;
  subetapa?: string;
  servicoSimplificado?: string;
  nivel: number;
  tipo: 'agrupador' | 'item';
  filhos: string[];
  parentId?: string;
}

export function transformarCategorizacaoParaEAP(
  items: CategorizacaoItem[]
): HierarchicalItem[] {
  const transformed: HierarchicalItem[] = [];
  
  // Agrupar itens por Etapa
  const etapasMap = new Map<string, {
    subetapas: Map<string, CategorizacaoItem[]>
  }>();
  
  items.forEach((item) => {
    const etapaNome = item.etapa;
    const subetapaNome = item.subetapa;
    
    if (!etapasMap.has(etapaNome)) {
      etapasMap.set(etapaNome, { subetapas: new Map() });
    }
    
    const etapa = etapasMap.get(etapaNome)!;
    if (!etapa.subetapas.has(subetapaNome)) {
      etapa.subetapas.set(subetapaNome, []);
    }
    
    etapa.subetapas.get(subetapaNome)!.push(item);
  });
  
  // Criar estrutura hierárquica
  let etapaIndex = 1;
  etapasMap.forEach((etapaData, etapaNome) => {
    const etapaId = `ETAPA-${etapaIndex}`;
    const subetapaIds: string[] = [];
    
    // Primeiro, coletar todos os IDs de Subetapas
    let subetapaIndex = 1;
    etapaData.subetapas.forEach((servicos, subetapaNome) => {
      const subetapaId = `${etapaId}-SUB-${subetapaIndex}`;
      subetapaIds.push(subetapaId);
      subetapaIndex++;
    });
    
    // Criar Etapa primeiro (nível 1 - agrupador)
    transformed.push({
      id: etapaId,
      numeroHierarquico: `${etapaIndex}`,
      descricao: etapaNome,
      etapa: etapaNome,
      subetapa: undefined,
      servicoSimplificado: undefined,
      nivel: 1,
      tipo: 'agrupador',
      filhos: subetapaIds,
      parentId: undefined,
    });
    
    // Depois, criar Subetapas e Serviços
    subetapaIndex = 1;
    etapaData.subetapas.forEach((servicos, subetapaNome) => {
      const subetapaId = `${etapaId}-SUB-${subetapaIndex}`;
      
      // Criar Subetapa (nível 2 - agrupador)
      transformed.push({
        id: subetapaId,
        numeroHierarquico: `${etapaIndex}.${subetapaIndex}`,
        descricao: subetapaNome,
        etapa: etapaNome,
        subetapa: subetapaNome,
        servicoSimplificado: undefined,
        nivel: 2,
        tipo: 'agrupador',
        filhos: servicos.map((s) => s.id),
        parentId: etapaId,
      });
      
      // Criar Serviços (nível 3 - items) - manter IDs originais
      servicos.forEach((servico, servicoIndex) => {
        transformed.push({
          id: servico.id,
          numeroHierarquico: servico.item, // Usar o item original como número hierárquico
          descricao: servico.servicoSimplificado,
          etapa: etapaNome,
          subetapa: subetapaNome,
          servicoSimplificado: servico.servicoSimplificado,
          nivel: 3,
          tipo: 'item',
          filhos: [],
          parentId: subetapaId,
        });
      });
      
      subetapaIndex++;
    });
    
    etapaIndex++;
  });
  
  return transformed;
}
