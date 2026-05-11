import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Pencil, AlertCircle, FileX } from 'lucide-react';
import { db } from '@/lib/db';
import { listarTiposDocumento } from '@/app/actions/tipos-documento';
import BotaoExcluirTipoDocumento from './BotaoExcluirTipoDocumento';

export default async function TiposDocumentoPage({ params }: { params: { id: string } }) {
  const construtora = await db.construtora.findUnique({ where: { id: params.id } });
  if (!construtora) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">Construtora não encontrada</p>
        </div>
      </div>
    );
  }

  const tipos = await listarTiposDocumento(params.id);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/fin/cadastros/${params.id}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Tipos de Documento</h1>
              <p className="text-slate-400">{construtora.razaoSocial}</p>
              <p className="text-slate-500 text-sm mt-1">
                Tipos de documento disponíveis para seleção no lançamento de pagamentos
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/fin/cadastros/${params.id}/tipos-documento/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Tipo
        </Link>
      </div>

      <div className="mb-6 bg-indigo-950/20 border border-indigo-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-300">
            <strong>Tipos de Documento</strong> são os tipos de comprovante que acompanham os pagamentos (ex: Nota Fiscal,
            Recibo, Contrato, Boleto). Os itens criados aqui ficam disponíveis para seleção ao lançar uma nova ordem de pagamento.
          </p>
        </div>
      </div>

      {tipos.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
          <FileX className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2 text-lg">Nenhum tipo de documento cadastrado</p>
          <p className="text-sm text-slate-500 mb-6">
            Crie os tipos de documento para usar no lançamento de ordens de pagamento.
          </p>
          <Link
            href={`/fin/cadastros/${params.id}/tipos-documento/novo`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro tipo
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Descrição</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <p className="text-white font-medium">{tipo.nome}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-400 text-sm">{tipo.descricao || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tipo.ativo
                        ? 'bg-green-900/40 text-green-400 border border-green-700'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}>
                      {tipo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/fin/cadastros/${params.id}/tipos-documento/${tipo.id}/editar`}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <BotaoExcluirTipoDocumento tipoId={tipo.id} construtoraId={params.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
