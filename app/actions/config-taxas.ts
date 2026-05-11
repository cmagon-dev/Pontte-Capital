'use server';

import { db as prisma } from '@/lib/db';

interface ConfigTaxasData {
  taxaJurosMensal: number;
  taxaAdministrativa: number;
  tipoTaxaAdministrativa: 'PERCENTUAL' | 'FIXA';
  limiteAPerformarMensal?: number | null;
  limitePerformadaMensal?: number | null;
}

const DEFAULT_TAXA_CONFIG: ConfigTaxasData = {
  taxaJurosMensal: 0.015,
  taxaAdministrativa: 0.005,
  tipoTaxaAdministrativa: 'PERCENTUAL',
  limiteAPerformarMensal: null,
  limitePerformadaMensal: null,
};

export async function buscarConfigTaxas(construtoraId: string): Promise<ConfigTaxasData> {
  const config = await prisma.configuracaoTaxas.findUnique({
    where: { construtoraId },
  });

  if (!config) return DEFAULT_TAXA_CONFIG;

  return {
    taxaJurosMensal: Number(config.taxaJurosMensal),
    taxaAdministrativa: Number(config.taxaAdministrativa),
    tipoTaxaAdministrativa: config.tipoTaxaAdministrativa as 'PERCENTUAL' | 'FIXA',
    limiteAPerformarMensal: config.limiteAPerformarMensal ? Number(config.limiteAPerformarMensal) : null,
    limitePerformadaMensal: config.limitePerformadaMensal ? Number(config.limitePerformadaMensal) : null,
  };
}

export async function salvarConfigTaxas(construtoraId: string, dados: ConfigTaxasData) {
  const config = await prisma.configuracaoTaxas.upsert({
    where: { construtoraId },
    update: {
      taxaJurosMensal: dados.taxaJurosMensal,
      taxaAdministrativa: dados.taxaAdministrativa,
      tipoTaxaAdministrativa: dados.tipoTaxaAdministrativa,
      limiteAPerformarMensal: dados.limiteAPerformarMensal ?? null,
      limitePerformadaMensal: dados.limitePerformadaMensal ?? null,
    },
    create: {
      construtoraId,
      taxaJurosMensal: dados.taxaJurosMensal,
      taxaAdministrativa: dados.taxaAdministrativa,
      tipoTaxaAdministrativa: dados.tipoTaxaAdministrativa,
      limiteAPerformarMensal: dados.limiteAPerformarMensal ?? null,
      limitePerformadaMensal: dados.limitePerformadaMensal ?? null,
    },
  });

  return config;
}
