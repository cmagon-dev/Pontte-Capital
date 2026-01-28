// lib/utils/format.ts

/**
 * Formata valores monetários de forma segura para PT-BR
 * Aceita number ou string (útil para lidar com o Decimal do Prisma)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "R$ 0,00";
  
  // Se vier string (do Prisma Decimal), converte para float apenas para exibição visual
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numberValue)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
};

export const formatPercent = (value: number | string | null | undefined): string => {
  if (!value) return "0,00%";
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue / 100);
};

/**
 * Formata datas para o padrão brasileiro (dd/mm/yyyy)
 * Aceita Date, string ou null
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return '-';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    return '-';
  }
};

/**
 * Formata quantidade (números com 2 casas decimais no padrão brasileiro)
 * Usado para quantidades de itens em planilhas
 */
export const formatQuantity = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "0,00";
  
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numberValue)) return "0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

/**
 * Formata números genéricos no padrão brasileiro
 * Útil para valores que não são moeda nem quantidade específica
 */
export const formatNumber = (value: number | string | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return "0";
  
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numberValue)) return "0";
  
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numberValue);
};
