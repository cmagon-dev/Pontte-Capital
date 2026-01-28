import Link from 'next/link';
import { ArrowLeft, Building2, Users, Banknote, FolderTree, BarChart3, Building } from 'lucide-react';
import { db } from '@/lib/db';
import { formatarCPFouCNPJ } from '@/lib/utils/validations';

export default async function ConstrutoraPage({ params }: { params: { id: string } }) {
  const construtora = await db.construtora.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          obras: true,
          credores: true,
          contasBancarias: true,
          planosContas: true,
          centrosCusto: true,
        }
      },
      obras: {
        take: 5,
        select: {
          id: true,
          codigo: true,
          nome: true,
          cidade: true,
          estado: true,
          status: true,
          dataInicio: true,
        },
        orderBy: {
          dataInicio: 'desc'
        }
      }
    }
  });

  if (!construtora) {
    return (
      <div className="p-8">
        <div className="bg-red-900 border border-red-800 rounded-lg p-4">
          <p className="text-white">Construtora não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/fin/cadastros"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <Building2 className="w-10 h-10 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{construtora.razaoSocial}</h1>
              {construtora.nomeFantasia && (
                <p className="text-slate-400 mb-2">{construtora.nomeFantasia}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>CNPJ: {formatarCPFouCNPJ(construtora.cnpj)}</span>
                <span>•</span>
                <span>{construtora.codigo}</span>
                {construtora.cidade && construtora.estado && (
                  <>
                    <span>•</span>
                    <span>{construtora.cidade}/{construtora.estado}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Building className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">Obras</span>
          </div>
          <p className="text-3xl font-bold text-white">{construtora._count.obras}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Credores</span>
          </div>
          <p className="text-3xl font-bold text-white">{construtora._count.credores}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Banknote className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Contas</span>
          </div>
          <p className="text-3xl font-bold text-white">{construtora._count.contasBancarias}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FolderTree className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-400">Planos</span>
          </div>
          <p className="text-3xl font-bold text-white">{construtora._count.planosContas}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Centros Custo</span>
          </div>
          <p className="text-3xl font-bold text-white">{construtora._count.centrosCusto}</p>
        </div>
      </div>

      {/* Módulos Financeiros */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Cadastros Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={`/fin/cadastros/${params.id}/credores`}
            className="bg-slate-900 border border-slate-800 hover:border-blue-600 rounded-lg p-6 transition-colors group"
          >
            <Users className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-2">Credores</h3>
            <p className="text-sm text-slate-400 mb-3">
              Fornecedores, Empreiteiros e Funcionários
            </p>
            <p className="text-2xl font-bold text-blue-400">{construtora._count.credores}</p>
          </Link>

          <Link
            href={`/fin/cadastros/${params.id}/bancos`}
            className="bg-slate-900 border border-slate-800 hover:border-green-600 rounded-lg p-6 transition-colors group"
          >
            <Banknote className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-2">Contas Bancárias</h3>
            <p className="text-sm text-slate-400 mb-3">
              Carteiras de onde o dinheiro sai
            </p>
            <p className="text-2xl font-bold text-green-400">{construtora._count.contasBancarias}</p>
          </Link>

          <Link
            href={`/fin/cadastros/${params.id}/plano-contas`}
            className="bg-slate-900 border border-slate-800 hover:border-purple-600 rounded-lg p-6 transition-colors group"
          >
            <FolderTree className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-2">Plano de Contas</h3>
            <p className="text-sm text-slate-400 mb-3">
              Estrutura DRE para construção civil
            </p>
            <p className="text-2xl font-bold text-purple-400">{construtora._count.planosContas}</p>
          </Link>

          <Link
            href={`/fin/cadastros/${params.id}/centro-custo`}
            className="bg-slate-900 border border-slate-800 hover:border-amber-600 rounded-lg p-6 transition-colors group"
          >
            <BarChart3 className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold text-white mb-2">Centro de Custo</h3>
            <p className="text-sm text-slate-400 mb-3">
              Obras, Departamentos e Projetos
            </p>
            <p className="text-2xl font-bold text-amber-400">{construtora._count.centrosCusto}</p>
          </Link>
        </div>
      </div>

      {/* Obras Recentes */}
      {construtora.obras.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Obras Recentes</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Código</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Nome</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Localização</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-400 px-4 py-3">Data Início</th>
                </tr>
              </thead>
              <tbody>
                {construtora.obras.map((obra) => (
                  <tr key={obra.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm text-slate-300">{obra.codigo}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{obra.nome}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {obra.cidade}/{obra.estado}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        obra.status === 'EM_ANDAMENTO' ? 'bg-blue-900/50 text-blue-300' :
                        obra.status === 'CONCLUIDA' ? 'bg-green-900/50 text-green-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {obra.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(obra.dataInicio).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
