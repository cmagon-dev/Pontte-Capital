import Link from 'next/link';
import { Plus, Landmark } from 'lucide-react';
import { db } from '@/lib/db';
import ContratantesContent from './ContratantesContent';

// Função auxiliar para formatar CNPJ
function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-';
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length === 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return cnpj;
}

// Função auxiliar para formatar código (formato SC-001)
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado do banco (SC-001, SC-002, etc)
}

export default async function ContratantesPage() {
  // Buscar dados reais do banco
  const contratantes = await db.contratante.findMany({
    orderBy: { codigo: 'desc' },
  });

  // Preparar dados para exibição (incluindo indicadores de risco)
  const contratantesFormatados = contratantes.map((c) => ({
    id: c.id,
    codigo: c.codigo || '-',
    codigoFormatado: formatCodigo(c.codigo),
    razaoSocial: c.razaoSocial,
    cnpj: c.cnpj,
    cnpjFormatado: formatCNPJ(c.cnpj),
    cidade: c.cidade || '-',
    estado: c.estado || '-',
    createdAt: c.createdAt,
    // Indicadores de Risco (placeholder - serão preenchidos futuramente)
    score: null as number | null,
    classificacaoRisco: null as 'Baixo' | 'Médio' | 'Alto' | null,
    taxaAtraso: null as number | null,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Contratantes (Sacado)</h1>
          <p className="text-slate-400">Gestão de órgãos públicos, instituições privadas e empresas contratantes</p>
        </div>
        <Link
          href="/cadastros/contratantes/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Contratante
        </Link>
      </div>

      <ContratantesContent contratantes={contratantesFormatados} />
    </div>
  );
}
