/**
 * Transforma os itens da Visão Gerencial (EAP Gerencial) retornados por
 * `buscarVisaoGerencialSalva` em estrutura hierárquica compatível com
 * `SubEtapaTreeSelect`.
 *
 * Mapeamento de níveis:
 *   Visão Gerencial nivel 0 → tree nivel 1 (agrupador — Etapa)
 *   Visão Gerencial nivel 1 → tree nivel 2 (agrupador — Sub-Etapa)
 *   Visão Gerencial nivel 2 → tree nivel 3 (item selecionável — Serviço Simplificado)
 *
 * Os itens de nivel 3 da VG (itens originais reconstruídos dinamicamente) são
 * ignorados — a seleção ocorre no nivel 2 (Serviço Simplificado).
 */

interface VGItem {
  id: string;
  codigo: string;
  nivel: number;
  discriminacao: string;
  tipo: string;      // 'AGRUPADOR' | 'ITEM'
  parentId?: string | null;
  [key: string]: unknown;
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

export function transformarVisaoGerencialParaEAP(items: VGItem[]): HierarchicalItem[] {
  // Considera apenas níveis 0, 1 e 2 (ignora nivel 3 — itens originais reconstruídos)
  const vgItems = items.filter((item) => item.nivel <= 2);

  // Construir mapa pai → filhos a partir dos dados da VG
  const filhosPorPai = new Map<string | null, string[]>();
  for (const item of vgItems) {
    const pai = item.parentId ?? null;
    if (!filhosPorPai.has(pai)) filhosPorPai.set(pai, []);
    filhosPorPai.get(pai)!.push(item.id);
  }

  const result: HierarchicalItem[] = vgItems.map((item) => {
    const treeNivel = item.nivel + 1; // VG 0→1, VG 1→2, VG 2→3
    const isServico = item.nivel === 2; // Serviço Simplificado — selecionável

    return {
      id: item.id,
      numeroHierarquico: item.codigo,
      descricao: item.discriminacao,
      servicoSimplificado: isServico ? item.discriminacao : undefined,
      nivel: treeNivel,
      tipo: isServico ? 'item' : 'agrupador',
      filhos: filhosPorPai.get(item.id) ?? [],
      parentId: item.parentId ?? undefined,
    };
  });

  return result;
}
