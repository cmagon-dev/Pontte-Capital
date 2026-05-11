import Link from 'next/link';
import { ArrowLeft, Building2, Edit, Trash2 } from 'lucide-react';
import { buscarCredorPorId } from '@/app/actions/credores';
import { formatarCPFouCNPJ, formatarTelefone, formatarCEP } from '@/lib/utils/validations';
import { formatCurrency } from '@/lib/utils/format';
import { BotaoExcluirCredor } from './BotaoExcluirCredor';

export default async function DetalhesCredorPage({ params }: { params: { id: string; credorId: string } }) {
  const credor = await buscarCredorPorId(params.credorId);

  if (!credor) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">Credor não encontrado</p>
        </div>
      </div>
    );
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'FORNECEDOR': 'Fornecedor',
      'EMPREITEIRO': 'Empreiteiro',
      'FUNCIONARIO': 'Funcionário',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/fin/cadastros/${params.id}/credores`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{credor.nome}</h1>
              <p className="text-slate-400">Código: {credor.codigo} • {getTipoLabel(credor.tipo)}</p>
              <p className="text-slate-500 text-sm mt-1">
                {credor.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'}: {formatarCPFouCNPJ(credor.cpfCnpj)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/fin/cadastros/${params.id}/credores/${params.credorId}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-5 h-5" />
            Editar
          </Link>
          
          <BotaoExcluirCredor credorId={params.credorId} construtoraId={params.id} />
        </div>
      </div>

      {/* Status e Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Status</p>
          <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
            credor.status === 'ATIVO' 
              ? 'bg-green-900 text-green-400' 
              : credor.status === 'BLOQUEADO'
              ? 'bg-red-900 text-red-400'
              : 'bg-slate-700 text-slate-400'
          }`}>
            {credor.status}
          </span>
        </div>
        
        <div className="bg-slate-900 border border-amber-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-1">Valor Pendente</p>
          <p className="text-2xl font-bold text-amber-400 font-mono">
            {formatCurrency(Number(credor.valorPendente || 0))}
          </p>
        </div>
      </div>

      {/* Informações Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Cadastrais */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Dados Cadastrais</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Tipo</p>
              <p className="text-white">{getTipoLabel(credor.tipo)}</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-400">Tipo de Pessoa</p>
              <p className="text-white">{credor.tipoPessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
            </div>
            
            {credor.nomeFantasia && (
              <div>
                <p className="text-sm text-slate-400">Nome Fantasia</p>
                <p className="text-white">{credor.nomeFantasia}</p>
              </div>
            )}
            
            {credor.rg && (
              <div>
                <p className="text-sm text-slate-400">RG</p>
                <p className="text-white">{credor.rg}</p>
              </div>
            )}
            
            {credor.inscricaoEstadual && (
              <div>
                <p className="text-sm text-slate-400">Inscrição Estadual</p>
                <p className="text-white">{credor.inscricaoEstadual}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contato */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Contato</h2>
          <div className="space-y-3">
            {credor.email && (
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{credor.email}</p>
              </div>
            )}
            
            {credor.telefone && (
              <div>
                <p className="text-sm text-slate-400">Telefone</p>
                <p className="text-white">{credor.telefone}</p>
              </div>
            )}
            
            {credor.celular && (
              <div>
                <p className="text-sm text-slate-400">Celular</p>
                <p className="text-white">{credor.celular}</p>
              </div>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Endereço</h2>
          <div className="space-y-3">
            {credor.endereco && (
              <div>
                <p className="text-sm text-slate-400">Logradouro</p>
                <p className="text-white">
                  {credor.endereco}{credor.numero ? `, ${credor.numero}` : ''}
                  {credor.complemento ? ` - ${credor.complemento}` : ''}
                </p>
              </div>
            )}
            
            {credor.bairro && (
              <div>
                <p className="text-sm text-slate-400">Bairro</p>
                <p className="text-white">{credor.bairro}</p>
              </div>
            )}
            
            {credor.cidade && (
              <div>
                <p className="text-sm text-slate-400">Cidade/Estado</p>
                <p className="text-white">
                  {credor.cidade}{credor.estado ? ` - ${credor.estado}` : ''}
                </p>
              </div>
            )}
            
            {credor.cep && (
              <div>
                <p className="text-sm text-slate-400">CEP</p>
                <p className="text-white">{formatarCEP(credor.cep)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Dados Bancários</h2>
          <div className="space-y-3">
            {credor.banco && (
              <>
                <div>
                  <p className="text-sm text-slate-400">Banco</p>
                  <p className="text-white font-mono">{credor.banco}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Agência</p>
                  <p className="text-white font-mono">
                    {credor.agencia}{credor.agenciaDigito ? `-${credor.agenciaDigito}` : ''}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400">Conta</p>
                  <p className="text-white font-mono">
                    {credor.conta}{credor.contaDigito ? `-${credor.contaDigito}` : ''}
                  </p>
                  {credor.tipoConta && (
                    <p className="text-xs text-slate-500 mt-1">{credor.tipoConta}</p>
                  )}
                </div>
              </>
            )}
            
            {credor.chavePix && (
              <div>
                <p className="text-sm text-slate-400">Chave PIX</p>
                <p className="text-purple-400 font-mono text-sm">{credor.chavePix}</p>
                {credor.tipoChavePix && (
                  <p className="text-xs text-slate-500 mt-1">Tipo: {credor.tipoChavePix}</p>
                )}
              </div>
            )}
            
            {!credor.banco && !credor.chavePix && (
              <p className="text-slate-500 text-sm">Dados bancários não cadastrados</p>
            )}
          </div>
        </div>
      </div>

      {/* Observações */}
      {credor.observacoes && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Observações</h2>
          <p className="text-slate-300 whitespace-pre-wrap">{credor.observacoes}</p>
        </div>
      )}

      {/* Auditoria */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Auditoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-400">Criado em</p>
            <p className="text-white">{new Date(credor.createdAt).toLocaleString('pt-BR')}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-400">Última atualização</p>
            <p className="text-white">{new Date(credor.updatedAt).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
