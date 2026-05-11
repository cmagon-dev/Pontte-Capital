import Link from 'next/link';
import { Plus, Search, FolderKanban } from 'lucide-react';
import { db } from '@/lib/db';
import FundosTable from './FundosTable';

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

// Função auxiliar para formatar código (formato CS-001)
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado do banco (CS-001, CS-002, etc)
}

export default async function FundosPage() {
  // Buscar dados reais do banco
  const fundos = await db.fundo.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Preparar dados para exibição
  const fundosFormatados = fundos.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    codigoFormatado: formatCodigo(f.codigo),
    razaoSocial: f.razaoSocial,
    nomeFantasia: f.nomeFantasia || f.razaoSocial,
    cnpj: f.cnpj,
    cnpjFormatado: formatCNPJ(f.cnpj),
    cidade: f.cidade || '-',
    estado: f.estado || '-',
    createdAt: f.createdAt,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Fundos FIDC</h1>
          <p className="text-slate-400">Cadastro dos FIDCs ou Investidores que provêm o Funding</p>
        </div>
        <Link
          href="/cadastros/fundos/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Fundo
        </Link>
      </div>

      {/* Tabela com busca client-side */}
      <FundosTable fundos={fundosFormatados} />
    </div>
  );
}
