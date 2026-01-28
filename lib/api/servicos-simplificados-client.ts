export interface ServicoSimplificado {
  id: string;
  nome: string;
  ordem: number | null;
  ativo: boolean;
  leadTimeMaterial: number | null;
  leadTimeMaoDeObra: number | null;
  leadTimeContratos: number | null;
  leadTimeEquipamentos: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Buscar serviços simplificados ativos (opcionalmente filtrados por obra)
export async function buscarServicosSimplificados(obraId?: string): Promise<ServicoSimplificado[]> {
  const url = obraId 
    ? `/api/servicos-simplificados?obraId=${obraId}`
    : '/api/servicos-simplificados';
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Erro ao buscar serviços simplificados');
  }
  
  return response.json();
}

// Atualizar lead times de um serviço simplificado
export async function atualizarLeadTimes(
  id: string,
  leadTimes: {
    leadTimeMaterial?: number | null;
    leadTimeMaoDeObra?: number | null;
    leadTimeContratos?: number | null;
    leadTimeEquipamentos?: number | null;
  }
): Promise<ServicoSimplificado> {
  const response = await fetch('/api/servicos-simplificados', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      ...leadTimes,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Erro ao atualizar lead times');
  }
  
  return response.json();
}
