'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Users, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { criarFiador } from '@/app/actions/fiadores';

export default function NovoFiadorPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PF');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para busca automática de CNPJ (apenas para PJ)
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    rg: '',
    estadoCivil: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    nomeFantasia: '',
    inscricaoEstadual: '',
    aprovadorFinanceiro: false,
  });

  // Função para formatar CPF
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

  // Função para formatar CNPJ
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

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  // Função para formatar Telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
  };

  // Função para buscar dados da empresa via CNPJ na BrasilAPI (apenas para PJ)
  const buscarDadosCNPJ = async (cnpj: string) => {
    // Só buscar se for Pessoa Jurídica
    if (tipo !== 'PJ') return;
    
    // Limpar CNPJ (remover formatação)
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Validar se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      return;
    }

    setIsLoadingCNPJ(true);
    setCnpjError(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setCnpjError('CNPJ não encontrado na base da Receita Federal');
        } else {
          setCnpjError('Erro ao buscar dados do CNPJ. Tente novamente.');
        }
        setIsLoadingCNPJ(false);
        return;
      }

      const data = await response.json();

      // Mapear dados da API para o formulário de Fiador
      setFormData((prev) => ({
        ...prev,
        nome: data.razao_social || prev.nome, // Razão Social
        nomeFantasia: data.nome_fantasia || prev.nomeFantasia,
        // Endereço completo
        endereco: data.logradouro 
          ? `${data.logradouro}${data.numero ? ', ' + data.numero : ''}${data.complemento ? ' - ' + data.complemento : ''}`
          : prev.endereco,
        cidade: data.municipio || prev.cidade,
        estado: data.uf || prev.estado,
        cep: data.cep ? formatCEP(data.cep) : prev.cep,
        // Telefone (pegar o primeiro DDD + telefone se existir)
        telefone: data.ddd_telefone_1 
          ? formatTelefone(data.ddd_telefone_1.replace(/\D/g, ''))
          : prev.telefone,
        email: data.email || prev.email,
      }));

      setCnpjError(null);
      
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      setCnpjError('Erro de comunicação com a API. Verifique sua conexão.');
    } finally {
      setIsLoadingCNPJ(false);
    }
  };

  // Handler para mudança no campo CNPJ (apenas para PJ)
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData({ ...formData, cpfCnpj: formatted });
    
    // Limpar erros anteriores
    setCnpjError(null);
    
    // Buscar automaticamente quando completar 14 dígitos (apenas para PJ)
    if (tipo === 'PJ') {
      const cnpjLimpo = formatted.replace(/\D/g, '');
      if (cnpjLimpo.length === 14) {
        buscarDadosCNPJ(formatted);
      }
    }
  };

  // Handler para quando o usuário sair do campo (onBlur) - apenas para PJ
  const handleCNPJBlur = () => {
    if (tipo === 'PJ') {
      const cnpjLimpo = formData.cpfCnpj.replace(/\D/g, '');
      if (cnpjLimpo.length === 14 && !isLoadingCNPJ) {
        buscarDadosCNPJ(formData.cpfCnpj);
      }
    }
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
      const result = await criarFiador(payload);

      if (!result.success) {
        setServerError(result.message || "Erro desconhecido ao salvar.");
        setIsSubmitting(false);
        return;
      }

      // Sucesso
      router.push('/cadastros/fiadores');
      router.refresh();
      
    } catch (error) {
      console.error('Erro ao criar fiador:', error);
      setServerError('Erro inesperado ao salvar. Tente novamente.');
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-white mb-2">Novo Fiador</h1>
            <p className="text-slate-400">Cadastro de Garantidor - Pessoa Física ou Jurídica</p>
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
                  // Limpar campos específicos de PJ quando mudar para PF
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
                  // Limpar campos específicos de PF quando mudar para PJ
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
              {/* Para Pessoa Jurídica: CNPJ primeiro */}
              {tipo === 'PJ' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CNPJ *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.cpfCnpj}
                        onChange={handleCNPJChange}
                        onBlur={handleCNPJBlur}
                        placeholder="00.000.000/0000-00"
                        required
                        maxLength={18}
                        disabled={isLoadingCNPJ}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-wait"
                      />
                      {isLoadingCNPJ && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    {cnpjError && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {cnpjError}
                      </p>
                    )}
                    {isLoadingCNPJ && (
                      <p className="text-xs text-blue-400 mt-1">Buscando dados na Receita Federal...</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={formData.inscricaoEstadual}
                      onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="IE (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Razão Social *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Nome da empresa conforme registro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.nomeFantasia}
                      onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Nome comercial"
                    />
                  </div>
                </>
              )}
              
              {/* Para Pessoa Física: ordem original */}
              {tipo === 'PF' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">CPF *</label>
                    <input
                      type="text"
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        cpfCnpj: formatCPF(e.target.value)
                      })}
                      placeholder="000.000.000-00"
                      required
                      maxLength={14}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
              {/* Campos específicos de Pessoa Física */}
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
              href="/cadastros/fiadores"
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
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Fiador
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
