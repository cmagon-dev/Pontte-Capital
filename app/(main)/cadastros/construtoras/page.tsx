import Link from 'next/link';
import { Plus, Search, Building2 } from 'lucide-react';
import { db } from '@/lib/db';
import ConstrutorasTable from './ConstrutorasTable';

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

// Função auxiliar para formatar código (formato CD-001)
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado do banco (CD-001, CD-002, etc)
}

export default async function ConstrutorasPage() {
  // Buscar dados reais do banco
  const construtoras = await db.construtora.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Preparar dados para exibição
  const construtorasFormatadas = construtoras.map((c) => ({
    id: c.id,
    codigo: c.codigo || '-',
    codigoFormatado: formatCodigo(c.codigo),
    razaoSocial: c.razaoSocial,
    nomeFantasia: c.nomeFantasia || '-',
    cnpj: c.cnpj,
    cnpjFormatado: formatCNPJ(c.cnpj),
    cidade: c.cidade || '-',
    estado: c.estado || '-',
    createdAt: c.createdAt,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Construtoras</h1>
          <p className="text-slate-400">Gestão da carteira de clientes (Construtoras)</p>
        </div>
        <Link
          href="/cadastros/construtoras/nova"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Cadastro
        </Link>
      </div>

      {/* Tabela com busca client-side */}
      <ConstrutorasTable construtoras={construtorasFormatadas} />
    </div>
  );
}
