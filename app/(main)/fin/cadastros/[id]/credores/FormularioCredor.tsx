'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarCredor, atualizarCredor } from '@/app/actions/credores';
import { Save, X } from 'lucide-react';

type FormularioCredorProps = {
  construtoraId: string;
  credorInicial?: any;
  modo?: 'criar' | 'editar';
};

export function FormularioCredor({ construtoraId, credorInicial, modo = 'criar' }: FormularioCredorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    tipo: credorInicial?.tipo || 'FORNECEDOR',
    tipoPessoa: credorInicial?.tipoPessoa || 'PJ',
    cpfCnpj: credorInicial?.cpfCnpj || '',
    nome: credorInicial?.nome || '',
    nomeFantasia: credorInicial?.nomeFantasia || '',
    email: credorInicial?.email || '',
    telefone: credorInicial?.telefone || '',
    celular: credorInicial?.celular || '',
    cep: credorInicial?.cep || '',
    endereco: credorInicial?.endereco || '',
    numero: credorInicial?.numero || '',
    complemento: credorInicial?.complemento || '',
    bairro: credorInicial?.bairro || '',
    cidade: credorInicial?.cidade || '',
    estado: credorInicial?.estado || '',
    banco: credorInicial?.banco || '',
    agencia: credorInicial?.agencia || '',
    agenciaDigito: credorInicial?.agenciaDigito || '',
    conta: credorInicial?.conta || '',
    contaDigito: credorInicial?.contaDigito || '',
    tipoConta: credorInicial?.tipoConta || 'CORRENTE',
    chavePix: credorInicial?.chavePix || '',
    tipoChavePix: credorInicial?.tipoChavePix || 'CPF',
    inscricaoEstadual: credorInicial?.inscricaoEstadual || '',
    inscricaoMunicipal: credorInicial?.inscricaoMunicipal || '',
    rg: credorInicial?.rg || '',
    status: credorInicial?.status || 'ATIVO',
    valorPendente: credorInicial?.valorPendente || 0,
    observacoes: credorInicial?.observacoes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const result = modo === 'criar' 
        ? await criarCredor(construtoraId, formData)
        : await atualizarCredor(credorInicial.id, formData);

      if (result.success) {
        router.push(`/fin/cadastros/${construtoraId}/credores`);
      } else {
        setErro(result.message || 'Erro ao salvar credor');
      }
    } catch (error: any) {
      setErro(error.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {erro && (
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">{erro}</p>
        </div>
      )}

      {/* Identificação */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Identificação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo *</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="FORNECEDOR">Fornecedor</option>
              <option value="EMPREITEIRO">Empreiteiro</option>
              <option value="FUNCIONARIO">Funcionário</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo de Pessoa *</label>
            <select
              value={formData.tipoPessoa}
              onChange={(e) => setFormData({ ...formData, tipoPessoa: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              {formData.tipoPessoa === 'PJ' ? 'CNPJ *' : 'CPF *'}
            </label>
            <input
              type="text"
              value={formData.cpfCnpj}
              onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value.replace(/\D/g, '') })}
              placeholder={formData.tipoPessoa === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              maxLength={formData.tipoPessoa === 'PJ' ? 14 : 11}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              {formData.tipoPessoa === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          {formData.tipoPessoa === 'PJ' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome Fantasia</label>
              <input
                type="text"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          {formData.tipoPessoa === 'PF' && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">RG</label>
              <input
                type="text"
                value={formData.rg}
                onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Telefone</label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 0000-0000"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Celular</label>
            <input
              type="text"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">CEP</label>
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '') })}
              placeholder="00000-000"
              maxLength={8}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-2">Endereço</label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-2">Complemento</label>
            <input
              type="text"
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Bairro</label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Cidade</label>
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Estado</label>
            <input
              type="text"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
              placeholder="PR"
              maxLength={2}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Dados Bancários</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Banco (Código)</label>
            <input
              type="text"
              value={formData.banco}
              onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
              placeholder="001, 341, etc"
              maxLength={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Agência</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="1234"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={formData.agenciaDigito}
                onChange={(e) => setFormData({ ...formData, agenciaDigito: e.target.value })}
                placeholder="DV"
                maxLength={1}
                className="w-16 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Conta</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="12345"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={formData.contaDigito}
                onChange={(e) => setFormData({ ...formData, contaDigito: e.target.value })}
                placeholder="DV"
                maxLength={1}
                className="w-16 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo de Conta</label>
            <select
              value={formData.tipoConta}
              onChange={(e) => setFormData({ ...formData, tipoConta: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="CORRENTE">Corrente</option>
              <option value="POUPANCA">Poupança</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo Chave PIX</label>
            <select
              value={formData.tipoChavePix}
              onChange={(e) => setFormData({ ...formData, tipoChavePix: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">Email</option>
              <option value="TELEFONE">Telefone</option>
              <option value="ALEATORIA">Aleatória</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-2">Chave PIX</label>
            <input
              type="text"
              value={formData.chavePix}
              onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Observações</h2>
        <textarea
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          placeholder="Observações adicionais..."
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : modo === 'criar' ? 'Cadastrar Credor' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
}
