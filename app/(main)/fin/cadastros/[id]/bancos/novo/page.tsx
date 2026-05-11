'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Banknote, Building2, CreditCard, FileText, QrCode, Plus as PlusIcon, X } from 'lucide-react';
import { getConstrutoraById } from '@/lib/mock-data';

export default function NovoBancoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const construtora = getConstrutoraById(params.id);
  
  const [formData, setFormData] = useState({
    nome: '',
    banco: '',
    codigoBanco: '',
    agencia: '',
    conta: '',
    digito: '',
    tipo: 'Corrente',
    titular: '',
    cpfCnpjTitular: '',
    saldoInicial: '',
    status: 'Ativo',
    observacoes: '',
  });

  const [chavesPix, setChavesPix] = useState<Array<{ tipo: string; valor: string }>>([
    { tipo: 'CPF/CNPJ', valor: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    router.push(`/fin/cadastros/${params.id}/bancos`);
  };

  const bancos = [
    { codigo: '001', nome: 'Banco do Brasil' },
    { codigo: '104', nome: 'Caixa Econômica Federal' },
    { codigo: '341', nome: 'Itaú Unibanco' },
    { codigo: '033', nome: 'Banco Santander' },
    { codigo: '237', nome: 'Banco Bradesco' },
    { codigo: '077', nome: 'Banco Inter' },
    { codigo: '260', nome: 'Nu Pagamentos (Nubank)' },
    { codigo: '422', nome: 'Banco Safra' },
    { codigo: '748', nome: 'Sicredi' },
    { codigo: '756', nome: 'Bancoob' },
  ];

  const handleBancoChange = (codigo: string) => {
    const bancoSelecionado = bancos.find((b) => b.codigo === codigo);
    setFormData({
      ...formData,
      codigoBanco: codigo,
      banco: bancoSelecionado?.nome || '',
    });
  };

  const addChavePix = () => {
    setChavesPix([...chavesPix, { tipo: 'CPF/CNPJ', valor: '' }]);
  };

  const removeChavePix = (index: number) => {
    setChavesPix(chavesPix.filter((_, i) => i !== index));
  };

  const updateChavePix = (index: number, field: 'tipo' | 'valor', value: string) => {
    const newChaves = [...chavesPix];
    newChaves[index] = { ...newChaves[index], [field]: value };
    setChavesPix(newChaves);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/cadastros/${params.id}/bancos`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Nova Conta Bancária</h1>
            <p className="text-slate-400">Cadastro de Conta Bancária - {construtora.razaoSocial}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Dados Básicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome/Identificação da Conta *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Conta Principal, Conta de Operações, etc."
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados Bancários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Banco *</label>
              <select
                value={formData.codigoBanco}
                onChange={(e) => handleBancoChange(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Selecione o banco...</option>
                {bancos.map((banco) => (
                  <option key={banco.codigo} value={banco.codigo}>
                    {banco.codigo} - {banco.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Agência *</label>
              <input
                type="text"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                placeholder="0000"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Conta *</label>
              <input
                type="text"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                placeholder="00000"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Dígito</label>
              <input
                type="text"
                value={formData.digito}
                onChange={(e) => setFormData({ ...formData, digito: e.target.value })}
                placeholder="0"
                maxLength={1}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Conta *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Corrente">Corrente</option>
                <option value="Poupança">Poupança</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Saldo Inicial</label>
              <input
                type="text"
                value={formData.saldoInicial}
                onChange={(e) => setFormData({ ...formData, saldoInicial: e.target.value })}
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Saldo inicial da conta (opcional)</p>
            </div>
          </div>
        </div>

        {/* Dados do Titular */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dados do Titular
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Titular da Conta *</label>
              <input
                type="text"
                value={formData.titular}
                onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                placeholder="Nome do titular"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">CPF/CNPJ do Titular *</label>
              <input
                type="text"
                value={formData.cpfCnpjTitular}
                onChange={(e) => setFormData({ ...formData, cpfCnpjTitular: e.target.value })}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">CPF para pessoa física ou CNPJ para pessoa jurídica</p>
            </div>
          </div>
        </div>

        {/* Chaves PIX */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Chaves PIX
            </h2>
            <button
              type="button"
              onClick={addChavePix}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Adicionar Chave
            </button>
          </div>
          <div className="space-y-3">
            {chavesPix.map((chave, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-3">
                    <label className="block text-sm text-slate-400 mb-2">Tipo de Chave</label>
                    <select
                      value={chave.tipo}
                      onChange={(e) => updateChavePix(index, 'tipo', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="CPF/CNPJ">CPF/CNPJ</option>
                      <option value="Email">E-mail</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="md:col-span-8">
                    <label className="block text-sm text-slate-400 mb-2">Valor da Chave PIX</label>
                    <input
                      type="text"
                      value={chave.valor}
                      onChange={(e) => updateChavePix(index, 'valor', e.target.value)}
                      placeholder={
                        chave.tipo === 'CPF/CNPJ'
                          ? '000.000.000-00 ou 00.000.000/0000-00'
                          : chave.tipo === 'Email'
                          ? 'exemplo@email.com'
                          : chave.tipo === 'Telefone'
                          ? '(00) 00000-0000'
                          : 'Chave aleatória'
                      }
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-1">
                    {chavesPix.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChavePix(index)}
                        className="w-full p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Observações Internas</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Informações adicionais sobre a conta bancária..."
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/fin/cadastros/${params.id}/bancos`}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Salvando...' : 'Salvar Conta Bancária'}
          </button>
        </div>
      </form>
    </div>
  );
}
