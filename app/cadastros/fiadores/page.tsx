import Link from 'next/link';
import { Plus, Search, Users } from 'lucide-react';
import { db } from '@/lib/db';
import FiadoresTable from './FiadoresTable';

// Função auxiliar para formatar CPF
function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2');
  }
  return cpf;
}

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

// Função auxiliar para formatar código (formato AV-001)
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado do banco (AV-001, AV-002, etc)
}

export default async function FiadoresPage() {
  // Buscar dados reais do banco
  const fiadores = await db.fiador.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Preparar dados para exibição
  const fiadoresFormatados = fiadores.map((f) => ({
    id: f.id,
    codigo: f.codigo,
    codigoFormatado: formatCodigo(f.codigo),
    tipo: f.tipo,
    nome: f.nome,
    cpfCnpj: f.cpfCnpj,
    cpfCnpjFormatado: f.tipo === 'PF' ? formatCPF(f.cpfCnpj) : formatCNPJ(f.cpfCnpj),
    email: f.email || '-',
    telefone: f.telefone || '-',
    cidade: f.cidade || '-',
    estado: f.estado || '-',
    aprovadorFinanceiro: f.aprovadorFinanceiro,
    createdAt: f.createdAt,
  }));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Cadastro de Fiadores</h1>
          <p className="text-slate-400">Gestão dos Garantidores (Pessoas Físicas ou Jurídicas)</p>
        </div>
        <Link
          href="/cadastros/fiadores/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Fiador
        </Link>
      </div>

      {/* Tabela com busca client-side */}
      <FiadoresTable fiadores={fiadoresFormatados} />
    </div>
  );
}
