'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building2, Plus, X, Loader2, AlertCircle, MapPin, Users, CreditCard } from 'lucide-react';
import { atualizarFundo } from '@/app/actions/fundos';

interface InitialData {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  socios: Array<{ nome: string; cpf: string; participacao: string; cargo: string }>;
  contaBancaria: { banco: string; agencia: string; conta: string; tipo: string };
}

interface EditarFundoFormProps {
  initialData: InitialData;
}

export default function EditarFundoForm({ initialData }: EditarFundoFormProps) {
  const router = useRouter();
  
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Função para formatar Participação (percentual com 2 casas decimais)
  const formatParticipacao = (value: string) => {
    let cleaned = value.replace(/[^\d,.]/g, '');
    cleaned = cleaned.replace(',', '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    const numValue = parseFloat(cleaned) || 0;
    if (numValue > 100) {
      cleaned = '100.00';
    }
    if (cleaned.includes('.')) {
      const [int, dec] = cleaned.split('.');
      return `${int},${dec.padEnd(2, '0')}`;
    }
    return cleaned;
  };

  // Inicializar estados com dados existentes (aplicando formatação)
  const [formData, setFormData] = useState({
    razaoSocial: initialData.razaoSocial,
    nomeFantasia: initialData.nomeFantasia,
    cnpj: formatCNPJ(initialData.cnpj),
    inscricaoEstadual: initialData.inscricaoEstadual,
    endereco: initialData.endereco,
    cidade: initialData.cidade,
    estado: initialData.estado,
    cep: formatCEP(initialData.cep),
    telefone: formatTelefone(initialData.telefone),
    email: initialData.email,
    contaBancaria: initialData.contaBancaria || { banco: '', agencia: '', conta: '', tipo: 'Corrente' },
  });

  // Função auxiliar para formatar participação ao carregar (converte ponto para vírgula)
  const formatParticipacaoForDisplay = (value: string) => {
    if (!value) return '';
    if (value.includes(',')) return value;
    if (value.includes('.')) {
      const parts = value.split('.');
      return `${parts[0]},${parts[1]?.padEnd(2, '0') || '00'}`;
    }
    return value ? `${value},00` : '';
  };

  const [socios, setSocios] = useState(
    initialData.socios && initialData.socios.length > 0
      ? initialData.socios.map(s => ({ 
          ...s, 
          cpf: formatCPF(s.cpf || ''),
          participacao: formatParticipacaoForDisplay(s.participacao || '')
        }))
      : [{ nome: '', cpf: '', participacao: '', cargo: '' }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Preparação dos Dados (Sanitização)
      const payload = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        socios: socios.map(socio => ({
          ...socio,
          cpf: socio.cpf.replace(/\D/g, ''),
        })),
        contaBancaria: formData.contaBancaria,
      };

      // Chamada ao Server Action (Backend)
      const result = await atualizarFundo(initialData.id, payload);

      if (!result.success) {
        setServerError(result.message || "Erro desconhecido ao salvar.");
        setIsSubmitting(false);
        return;
      }

      // Sucesso - redirecionar para página de detalhes
      router.push(`/cadastros/fundos/${initialData.id}/cadastro`);
      router.refresh();
      
    } catch (error) {
      console.error("Erro crítico:", error);
      setServerError("Erro de comunicação com o servidor. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  const addSocio = () => {
    setSocios([...socios, { nome: '', cpf: '', participacao: '', cargo: '' }]);
  };

  const removeSocio = (index: number) => {
    if (socios.length > 1) {
      setSocios(socios.filter((_, i) => i !== index));
    }
  };

  const updateSocio = (index: number, field: string, value: string) => {
    const newSocios = [...socios];
    let formattedValue = value;
    
    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    if (field === 'participacao') {
      formattedValue = formatParticipacao(value);
    }
    
    newSocios[index] = { ...newSocios[index], [field]: formattedValue };
    setSocios(newSocios);
  };

  const updateContaBancaria = (field: string, value: string) => {
    setFormData({
      ...formData,
      contaBancaria: {
        ...formData.contaBancaria,
        [field]: value,
      },
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fundos/${initialData.id}/cadastro`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Editar Fundo</h1>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Código:</span>
              <span className="font-mono text-white font-bold text-lg">{initialData.codigo}</span>
            </div>
            <p className="text-slate-400 mt-1">Atualização de Dados Cadastrais - Know Your Customer (KYC)</p>
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
          
          {/* 1. Dados Fiscais */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados Fiscais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Razão Social *</label>
                <input
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
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
              <div>
                <label className="block text-sm text-slate-400 mb-2">CNPJ *</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  required
                  maxLength={18}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                />
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
            </div>
          </div>

          {/* 2. Endereço e Contato */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço & Contato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Rua, Avenida, Número"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
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
                <label className="block text-sm text-slate-400 mb-2">CEP</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
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
              <div>
                <label className="block text-sm text-slate-400 mb-2">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* 3. Quadro Societário (JSON) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quadro Societário
              </h2>
              <button
                type="button"
                onClick={addSocio}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar Sócio
              </button>
            </div>
            
            <div className="space-y-4">
              {socios.map((socio, index) => (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">Sócio #{index + 1}</span>
                    {socios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocio(index)}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={socio.nome}
                        onChange={(e) => updateSocio(index, 'nome', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">CPF *</label>
                      <input
                        type="text"
                        value={socio.cpf}
                        onChange={(e) => updateSocio(index, 'cpf', e.target.value)}
                        maxLength={14}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Cargo</label>
                      <input
                        type="text"
                        value={socio.cargo}
                        onChange={(e) => updateSocio(index, 'cargo', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="Ex: Diretor, Sócio"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Participação (%)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={socio.participacao}
                          onChange={(e) => updateSocio(index, 'participacao', e.target.value)}
                          className="w-full px-3 py-2 pr-8 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Ex: 50,00"
                          maxLength={6}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Dados Bancários (JSON) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dados Bancários
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Banco</label>
                <input
                  type="text"
                  value={formData.contaBancaria.banco}
                  onChange={(e) => updateContaBancaria('banco', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Código do banco"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Agência</label>
                <input
                  type="text"
                  value={formData.contaBancaria.agencia}
                  onChange={(e) => updateContaBancaria('agencia', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Número da agência"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Conta</label>
                <input
                  type="text"
                  value={formData.contaBancaria.conta}
                  onChange={(e) => updateContaBancaria('conta', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Número da conta"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo</label>
                <select
                  value={formData.contaBancaria.tipo}
                  onChange={(e) => updateContaBancaria('tipo', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Corrente">Corrente</option>
                  <option value="Poupança">Poupança</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/cadastros/fundos/${initialData.id}/cadastro`}
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
                  Atualizar Fundo
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
