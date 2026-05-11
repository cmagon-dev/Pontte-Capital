/**
 * Transforma os dados da Categorização em estrutura hierárquica de 3 níveis para a EAP:
 * - Nível 1: Etapa (agrupador)
 * - Nível 2: Subetapa (agrupador)
 * - Nível 3: Serviço (item com servicoSimplificado)
 *
 * Aceita tanto o formato legado (id/item/subetapa/descricaoOriginal)
 * quanto o formato do banco (itemId/codigo/subEtapa/discriminacao).
 */

interface CategorizacaoItem {
  // Formato do banco (buscarCategorizacao)
  itemId?: string;
  codigo?: string;
  discriminacao?: string;
  subEtapa?: string | null;
  // Formato legado (mock)
  id?: string;
  item?: string;
  descricaoOriginal?: string;
  subetapa?: string;
  // Campos comuns
  referencia?: string;
  etapa?: string | null;
  servicoSimplificado?: string | null;
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

  // Normalizar campos: aceitar tanto formato do banco quanto legado
  type NormalizedItem = {
    id: string;
    codigo: string;
    etapa: string;
    subetapa: string;
    servicoSimplificado: string;
  };

  const normalized: NormalizedItem[] = items
    .map((item) => ({
      id: (item.itemId ?? item.id ?? ''),
      codigo: (item.codigo ?? item.item ?? ''),
      etapa: (item.etapa ?? '') as string,
      subetapa: (item.subEtapa ?? item.subetapa ?? '') as string,
      servicoSimplificado: (item.servicoSimplificado ?? item.descricaoOriginal ?? item.discriminacao ?? '') as string,
    }))
    .filter((item) => item.etapa && item.subetapa && item.servicoSimplificado);

  // Agrupar itens por Etapa
  const etapasMap = new Map<string, {
    subetapas: Map<string, NormalizedItem[]>
  }>();

  normalized.forEach((item) => {
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

    // Coletar todos os IDs de Subetapas
    let subetapaIndex = 1;
    etapaData.subetapas.forEach(() => {
      subetapaIds.push(`${etapaId}-SUB-${subetapaIndex}`);
      subetapaIndex++;
    });

    // Criar Etapa (nível 1 - agrupador)
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

    // Criar Subetapas e Serviços
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

      // Criar Serviços (nível 3 - items) - usar ID real do banco como identificador
      servicos.forEach((servico) => {
        transformed.push({
          id: servico.id,
          numeroHierarquico: servico.codigo,
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
