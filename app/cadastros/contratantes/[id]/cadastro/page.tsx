import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Landmark, Shield } from 'lucide-react';
import { db } from '@/lib/db';

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

// Função auxiliar para formatar CEP
function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '-';
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length === 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return cep;
}

// Função auxiliar para formatar Telefone
function formatTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '-';
  const numbers = telefone.replace(/\D/g, '');
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  }
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
  }
  return telefone;
}

// Função auxiliar para formatar código
function formatCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '-';
  return codigo; // Já vem formatado (SC-001, SC-002, etc)
}

export default async function CadastroContratantePage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const contratante = await db.contratante.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!contratante) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/cadastros/contratantes"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dados Cadastrais</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Código:</span>
              <span className="font-mono text-blue-400 font-bold text-lg">{formatCodigo(contratante.codigo)}</span>
            </div>
            <p className="text-slate-400 mt-1">Know Your Customer (KYC) - Dados Completos do Contratante</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/cadastros/contratantes/${params.id}/analise`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Análise de Risco
          </Link>
          <Link
            href={`/cadastros/contratantes/${params.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Dados Cadastrais */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          Dados Cadastrais
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Razão Social</label>
            <p className="text-white font-medium">{contratante.razaoSocial}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome Fantasia</label>
            <p className="text-white">{contratante.nomeFantasia || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CNPJ</label>
            <p className="text-white font-mono">{formatCNPJ(contratante.cnpj)}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Inscrição Estadual</label>
            <p className="text-white">{contratante.inscricaoEstadual || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Endereço</label>
            <p className="text-white">{contratante.endereco || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Cidade</label>
            <p className="text-white">{contratante.cidade || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <p className="text-white">{contratante.estado || '-'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CEP</label>
            <p className="text-white font-mono">{formatCEP(contratante.cep)}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Telefone</label>
            <p className="text-white font-mono">{formatTelefone(contratante.telefone)}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">E-mail</label>
            <p className="text-white">{contratante.email || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
