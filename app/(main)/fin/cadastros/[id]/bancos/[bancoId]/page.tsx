'use client';

import Link from 'next/link';
import { Banknote, ArrowLeft, Building2, CreditCard, FileText, QrCode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { getConstrutoraById } from '@/lib/mock-data';

export default function BancoDetailPage({ params }: { params: { id: string; bancoId: string } }) {
  const construtora = getConstrutoraById(params.id);

  // Dados mockados - em produção viria de API/banco
  const banco = {
    id: params.bancoId,
    nome: 'Conta Principal',
    banco: 'Banco do Brasil',
    codigoBanco: '001',
    agencia: '1234-5',
    conta: '12345-6',
    digito: '6',
    tipo: 'Corrente',
    titular: construtora.razaoSocial,
    cpfCnpjTitular: construtora.cnpj,
    saldo: 1500000.00,
    status: 'Ativo',
    observacoes: '',
    chavesPix: [
      { tipo: 'CPF/CNPJ', valor: construtora.cnpj },
      { tipo: 'Email', valor: 'conta@construtora.com.br' },
    ],
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
            <h1 className="text-3xl font-bold text-white mb-2">{banco.nome}</h1>
            <p className="text-slate-400">Detalhes da Conta Bancária - {construtora.razaoSocial}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Dados Básicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Nome/Identificação da Conta</label>
              <p className="text-white font-medium">{banco.nome}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                banco.status === 'Ativo' 
                  ? 'bg-green-900 text-green-400' 
                  : 'bg-red-900 text-red-400'
              }`}>
                {banco.status}
              </span>
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
              <label className="block text-sm text-slate-400 mb-2">Banco</label>
              <p className="text-white font-mono">{banco.codigoBanco} - {banco.banco}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Agência</label>
              <p className="text-white font-mono">{banco.agencia}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Conta</label>
              <p className="text-white font-mono">{banco.conta}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Conta</label>
              <p className="text-white">{banco.tipo}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Saldo Atual</label>
              <p className="text-green-400 font-mono text-xl font-bold">{formatCurrency(banco.saldo)}</p>
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
              <label className="block text-sm text-slate-400 mb-2">Titular da Conta</label>
              <p className="text-white">{banco.titular}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">CPF/CNPJ do Titular</label>
              <p className="text-white font-mono">{banco.cpfCnpjTitular}</p>
            </div>
          </div>
        </div>

        {/* Chaves PIX */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Chaves PIX
          </h2>
          {banco.chavesPix && banco.chavesPix.length > 0 ? (
            <div className="space-y-3">
              {banco.chavesPix.map((chave, index) => (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tipo de Chave</label>
                      <p className="text-white font-medium">{chave.tipo}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-slate-400 mb-2">Valor da Chave PIX</label>
                      <p className="text-white font-mono">{chave.valor}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhuma chave PIX cadastrada</p>
          )}
        </div>

        {/* Observações */}
        {banco.observacoes && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Observações</h2>
            <p className="text-slate-300 whitespace-pre-wrap">{banco.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}