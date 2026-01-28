import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Building2, MapPin, Users, CreditCard } from 'lucide-react';
import { db } from '@/lib/db';
import ButtonActions from './ButtonActions';

// Funções auxiliares para formatação
function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
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

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length === 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2');
  }
  return cpf;
}

function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';
  const numbers = cep.replace(/\D/g, '');
  if (numbers.length === 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return cep;
}

function formatTelefone(telefone: string | null | undefined): string {
  if (!telefone) return '';
  const numbers = telefone.replace(/\D/g, '');
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  } else if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
  }
  return telefone;
}

interface Socio {
  nome?: string;
  cpf?: string;
  participacao?: string;
  cargo?: string;
}

interface ContaBancaria {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: string;
}

export default async function CadastroConstrutoraPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const construtora = await db.construtora.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!construtora) {
    notFound();
  }

  // Parsear campos JSON
  const socios: Socio[] = 
    construtora.socios && typeof construtora.socios === 'object' && Array.isArray(construtora.socios)
      ? (construtora.socios as Socio[])
      : [];

  const contaBancaria: ContaBancaria =
    construtora.contaBancaria && typeof construtora.contaBancaria === 'object'
      ? (construtora.contaBancaria as ContaBancaria)
      : { banco: '', agencia: '', conta: '', tipo: 'Corrente' };

  // Formatar dados para exibição
  const formData = {
    razaoSocial: construtora.razaoSocial,
    nomeFantasia: construtora.nomeFantasia || '',
    cnpj: formatCNPJ(construtora.cnpj),
    inscricaoEstadual: construtora.inscricaoEstadual || '',
    endereco: construtora.endereco || '',
    cidade: construtora.cidade || '',
    estado: construtora.estado || '',
    cep: formatCEP(construtora.cep),
    telefone: formatTelefone(construtora.telefone),
    email: construtora.email || '',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/cadastros/construtoras"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dados Cadastrais</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Código:</span>
              <span className="font-mono text-blue-400 font-bold text-lg">{construtora.codigo}</span>
            </div>
            <p className="text-slate-400 mt-1">Know Your Customer (KYC) - Dados Fiscais Completos</p>
            {formData.nomeFantasia && (
              <p className="text-slate-500 text-sm mt-1">Nome Fantasia: {formData.nomeFantasia}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cadastros/construtoras/${params.id}/documentos`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Documentos
          </Link>
          <ButtonActions construtoraId={params.id} razaoSocial={formData.razaoSocial} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Dados Fiscais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados Fiscais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Razão Social</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.razaoSocial}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.nomeFantasia || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">CNPJ</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono">
                {formData.cnpj}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Inscrição Estadual</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.inscricaoEstadual || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Endereço e Contato */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço & Contato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Endereço</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.endereco || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Cidade</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.cidade || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Estado</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.estado || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">CEP</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono">
                {formData.cep || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Telefone</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono">
                {formData.telefone || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">E-mail</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {formData.email || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Quadro de Sócios (QSA) */}
        {socios.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Quadro de Sócios e Administradores (QSA)
            </h2>
            <div className="space-y-4">
              {socios.map((socio, index) => (
                <div key={index} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Nome Completo</label>
                      <div className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                        {socio.nome || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">CPF</label>
                      <div className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono">
                        {socio.cpf ? formatCPF(socio.cpf) : '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Participação</label>
                      <div className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                        {socio.participacao || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Cargo</label>
                      <div className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                        {socio.cargo || '-'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dados Bancários */}
        {(contaBancaria.banco || contaBancaria.agencia || contaBancaria.conta) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dados Bancários (Conta Principal)
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Conta para onde iria um eventual excedente (operação principal é via Escrow)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Banco</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                  {contaBancaria.banco || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Agência</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                  {contaBancaria.agencia || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Conta</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                  {contaBancaria.conta || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                  {contaBancaria.tipo || '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
