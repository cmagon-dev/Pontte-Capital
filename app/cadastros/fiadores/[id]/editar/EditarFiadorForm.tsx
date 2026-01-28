'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Users, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { atualizarFiador } from '@/app/actions/fiadores';

interface InitialData {
  id: string;
  codigo: string;
  tipo: 'PF' | 'PJ';
  nome: string;
  cpfCnpj: string;
  rg: string;
  estadoCivil: string;
  dataNascimento: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  aprovadorFinanceiro: boolean;
}

interface EditarFiadorFormProps {
  initialData: InitialData;
}

export default function EditarFiadorForm({ initialData }: EditarFiadorFormProps) {
  const router = useRouter();
  const [tipo, setTipo] = useState<'PF' | 'PJ'>(initialData.tipo);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: initialData.nome,
    cpfCnpj: initialData.cpfCnpj,
    rg: initialData.rg,
    estadoCivil: initialData.estadoCivil,
    dataNascimento: initialData.dataNascimento,
    email: initialData.email,
    telefone: initialData.telefone,
    endereco: initialData.endereco,
    cidade: initialData.cidade,
    estado: initialData.estado,
    cep: initialData.cep,
    nomeFantasia: initialData.nomeFantasia,
    inscricaoEstadual: initialData.inscricaoEstadual,
    aprovadorFinanceiro: initialData.aprovadorFinanceiro,
  });

  // Funções de formatação (mesmas do formulário de criação)
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparação dos Dados (Sanitização)
      const payload = {
        tipo: tipo,
        nome: formData.nome,
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''), // Remove formatação
        rg: tipo === 'PF' ? formData.rg : '',
        estadoCivil: tipo === 'PF' ? formData.estadoCivil : '',
        dataNascimento: tipo === 'PF' ? formData.dataNascimento : '',
        nomeFantasia: tipo === 'PJ' ? formData.nomeFantasia : '',
        inscricaoEstadual: tipo === 'PJ' ? formData.inscricaoEstadual : '',
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email,
        aprovadorFinanceiro: formData.aprovadorFinanceiro,
      };

      // Chamada ao Server Action (Backend)
      const result = await atualizarFiador(initialData.id, payload);

      if (!result.success) {
        setServerError(result.message || "Erro desconhecido ao atualizar.");
        setIsSubmitting(false);
        return;
      }

      // Sucesso
      router.push(`/cadastros/fiadores/${initialData.id}/cadastro`);
      router.refresh();
      
    } catch (error) {
      console.error('Erro ao atualizar fiador:', error);
      setServerError('Erro inesperado ao atualizar. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fiadores/${initialData.id}/cadastro`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Editar Fiador</h1>
            <p className="text-slate-400">Código: <span className="font-mono">{initialData.codigo}</span></p>
            <p className="text-slate-400">Editar dados do garantidor - Pessoa Física ou Jurídica</p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro do Servidor */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Tipo de Fiador */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tipo de Fiador</h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setTipo('PF');
                  setFormData(prev => ({ ...prev, nomeFantasia: '', inscricaoEstadual: '' }));
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  tipo === 'PF'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('PJ');
                  setFormData(prev => ({ ...prev, rg: '', estadoCivil: '', dataNascimento: '' }));
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  tipo === 'PJ'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Pessoa Jurídica
              </button>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Dados Básicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {tipo === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">{tipo === 'PF' ? 'CPF *' : 'CNPJ *'}</label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    cpfCnpj: tipo === 'PF' ? formatCPF(e.target.value) : formatCNPJ(e.target.value)
                  })}
                  placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                  required
                  maxLength={tipo === 'PF' ? 14 : 18}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              {tipo === 'PF' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">RG</label>
                    <input
                      type="text"
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Estado Civil *</label>
                    <select
                      value={formData.estadoCivil}
                      onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="Solteiro">Solteiro</option>
                      <option value="Casado">Casado</option>
                      <option value="Divorciado">Divorciado</option>
                      <option value="Viúvo">Viúvo</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Necessário anuência do cônjuge para garantias reais
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              {tipo === 'PJ' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={formData.inscricaoEstadual}
                      onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm text-slate-400 mb-2">E-mail *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Telefone</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Endereço *</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cidade *</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Estado *</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">CEP *</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  required
                  maxLength={9}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Configuração de Acesso */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Configuração de Acesso</h2>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aprovadorFinanceiro}
                  onChange={(e) => setFormData({ ...formData, aprovadorFinanceiro: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <span className="text-white font-medium block">Aprovador Financeiro?</span>
                  <span className="text-sm text-slate-400">
                    Se marcado, este fiador receberá notificações semanais para dar o "De Acordo" nos pagamentos
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/fiadores/${initialData.id}/cadastro`}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
