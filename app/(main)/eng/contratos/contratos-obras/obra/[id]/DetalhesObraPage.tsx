import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Building2, MapPin, Calendar, DollarSign, FileText, User } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { buscarObraPorId } from '@/app/actions/obras';

export default async function DetalhesObraPage({ params }: { params: { id: string } }) {
  const obra = await buscarObraPorId(params.id);

  if (!obra) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'bg-green-900 text-green-400';
      case 'CONCLUIDA':
        return 'bg-slate-700 text-slate-300';
      case 'PARALISADA':
        return 'bg-amber-900 text-amber-400';
      case 'CANCELADA':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      case 'CONCLUIDA':
        return 'Concluída';
      case 'PARALISADA':
        return 'Paralisada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/eng/contratos/contratos-obras/${obra.construtoraId}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Contratos
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">{obra.nome}</h1>
                <p className="text-slate-400 mt-1">UUID: {obra.id}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(obra.status)}`}>
              {getStatusLabel(obra.status)}
            </span>
            <Link
              href={`/eng/contratos/contratos-obras/obra/${obra.id}/editar`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar Obra
            </Link>
          </div>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Valor do Contrato */}
        <div className="bg-slate-900 border border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <p className="text-sm text-slate-400">Valor do Contrato</p>
          </div>
          <p className="text-2xl font-bold text-green-400 font-mono">
            {formatCurrency(Number(obra.valorContrato))}
          </p>
        </div>

        {/* Prazo */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-slate-400">Prazo</p>
          </div>
          {obra.prazoMeses ? (
            <p className="text-2xl font-bold text-white">{obra.prazoMeses} meses</p>
          ) : (
            <p className="text-xl text-slate-500">Não definido</p>
          )}
        </div>

        {/* Datas */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-slate-400">Vigência</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-300">
              Início: {obra.dataInicio ? formatDate(obra.dataInicio) : '-'}
            </p>
            <p className="text-sm text-slate-300">
              Fim: {obra.dataFim ? formatDate(obra.dataFim) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Dados da Construtora */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Construtora
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Razão Social</p>
            <p className="text-white font-medium">{obra.construtora.razaoSocial}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Código</p>
            <p className="text-white font-mono">{obra.construtora.codigo}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">CNPJ</p>
            <p className="text-white font-mono">{obra.construtora.cnpj}</p>
          </div>
          {obra.construtora.email && (
            <div>
              <p className="text-sm text-slate-400 mb-1">E-mail</p>
              <p className="text-white">{obra.construtora.email}</p>
            </div>
          )}
          {obra.construtora.telefone && (
            <div>
              <p className="text-sm text-slate-400 mb-1">Telefone</p>
              <p className="text-white">{obra.construtora.telefone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dados do Contratante */}
      {obra.contratante && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Contratante (Sacado)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Razão Social</p>
              <p className="text-white font-medium">{obra.contratante.razaoSocial}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Código</p>
              <p className="text-white font-mono">{obra.contratante.codigo}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">CNPJ</p>
              <p className="text-white font-mono">{obra.contratante.cnpj}</p>
            </div>
            {obra.contratante.email && (
              <div>
                <p className="text-sm text-slate-400 mb-1">E-mail</p>
                <p className="text-white">{obra.contratante.email}</p>
              </div>
            )}
            {obra.contratante.telefone && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Telefone</p>
                <p className="text-white">{obra.contratante.telefone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Localização */}
      {(obra.endereco || obra.cidade || obra.estado) && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Localização da Obra
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {obra.endereco && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-400 mb-1">Endereço</p>
                <p className="text-white">{obra.endereco}</p>
              </div>
            )}
            {obra.cidade && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Cidade</p>
                <p className="text-white">{obra.cidade}</p>
              </div>
            )}
            {obra.estado && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Estado</p>
                <p className="text-white">{obra.estado}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medições Recentes */}
      {obra.medicoes && obra.medicoes.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Últimas Medições</h2>
          <div className="space-y-2">
            {obra.medicoes.map((medicao) => (
              <div key={medicao.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">Medição #{medicao.numero}</p>
                  <p className="text-sm text-slate-400">
                    Status: {medicao.status}
                  </p>
                </div>
                <p className="text-green-400 font-mono font-bold">
                  {formatCurrency(Number(medicao.valorMedicao))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota Técnica */}
      <div className="mt-6 bg-blue-950 border border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Centro de Custo (CC):</strong> Esta obra possui um UUID único ({obra.id}) que serve como
          identificador para todas as operações financeiras, medições, documentos e processos relacionados.
        </p>
      </div>
    </div>
  );
}
