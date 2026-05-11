import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Users, MapPin, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
import { db } from '@/lib/db';
import ButtonActions from './ButtonActions';

// Funções auxiliares para formatação
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

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR');
}

export default async function CadastroFiadorPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const fiador = await db.fiador.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!fiador) {
    notFound();
  }

  // Formatar dados para exibição
  const cpfCnpjFormatado = fiador.tipo === 'PF' 
    ? formatCPF(fiador.cpfCnpj) 
    : formatCNPJ(fiador.cpfCnpj);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/cadastros/fiadores"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dados Cadastrais do Fiador</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Código:</span>
              <span className="font-mono text-white font-bold text-lg">{fiador.codigo}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                fiador.tipo === 'PF' 
                  ? 'bg-blue-900 text-blue-400' 
                  : 'bg-purple-900 text-purple-400'
              }`}>
                {fiador.tipo}
              </span>
            </div>
            <p className="text-slate-400 mt-1">Dados Pessoais/Empresariais e Configuração de Acesso</p>
            {fiador.nomeFantasia && (
              <p className="text-slate-500 text-sm mt-1">Nome Fantasia: {fiador.nomeFantasia}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/cadastros/fiadores/${params.id}/documentos`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Documentos
          </Link>
          <ButtonActions fiadorId={params.id} nome={fiador.nome} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Dados Básicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {fiador.tipo === 'PF' ? 'Nome Completo' : 'Razão Social'}
              </label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                {fiador.nome}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">{fiador.tipo === 'PF' ? 'CPF' : 'CNPJ'}</label>
              <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono">
                {cpfCnpjFormatado}
              </div>
            </div>
            
            {/* Campos específicos de Pessoa Física */}
            {fiador.tipo === 'PF' && (
              <>
                {fiador.rg && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">RG</label>
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                      {fiador.rg}
                    </div>
                  </div>
                )}
                {fiador.estadoCivil && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Estado Civil</label>
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                      {fiador.estadoCivil}
                    </div>
                  </div>
                )}
                {fiador.dataNascimento && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Data de Nascimento</label>
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(fiador.dataNascimento)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Campos específicos de Pessoa Jurídica */}
            {fiador.tipo === 'PJ' && (
              <>
                {fiador.nomeFantasia && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                      {fiador.nomeFantasia}
                    </div>
                  </div>
                )}
                {fiador.inscricaoEstadual && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Inscrição Estadual</label>
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                      {fiador.inscricaoEstadual}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Campos comuns */}
            {fiador.email && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">E-mail</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {fiador.email}
                </div>
              </div>
            )}
            {fiador.telefone && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {formatTelefone(fiador.telefone)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Endereço */}
        {(fiador.endereco || fiador.cidade || fiador.estado || fiador.cep) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fiador.endereco && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">Endereço</label>
                  <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                    {fiador.endereco}
                  </div>
                </div>
              )}
              {fiador.cidade && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                  <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                    {fiador.cidade}
                  </div>
                </div>
              )}
              {fiador.estado && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Estado</label>
                  <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
                    {fiador.estado}
                  </div>
                </div>
              )}
              {fiador.cep && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">CEP</label>
                  <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono">
                    {formatCEP(fiador.cep)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuração de Acesso */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Configuração de Acesso
          </h2>
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={fiador.aprovadorFinanceiro}
                disabled
                readOnly
                className="w-5 h-5 text-blue-600"
              />
              <div>
                <span className="text-white font-medium block">Aprovador Financeiro?</span>
                <span className="text-sm text-slate-400">
                  {fiador.aprovadorFinanceiro 
                    ? 'Este fiador recebe notificações semanais para dar o "De Acordo" nos pagamentos'
                    : 'Este fiador não é aprovador financeiro'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
