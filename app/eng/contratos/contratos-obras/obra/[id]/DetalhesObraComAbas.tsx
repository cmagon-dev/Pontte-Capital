import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buscarObraPorId } from '@/app/actions/obras';
import { listarVinculosObra } from '@/app/actions/vinculos';
import { listarAditivosObra } from '@/app/actions/aditivos';
import { listarReajustesObra } from '@/app/actions/reajustes';
import { listarEmpenhosObra } from '@/app/actions/empenhos';
import { db } from '@/lib/db';
import ObraTabsContent from './ObraTabsContent';

export default async function DetalhesObraComAbas({ params }: { params: { id: string } }) {
  // Buscar obra com todos os dados relacionados
  const [obraRaw, documentos, vinculos, aditivosResult, reajustesResult, empenhosResult] = await Promise.all([
    buscarObraPorId(params.id),
    db.documento.findMany({
      where: { obraId: params.id },
      orderBy: { createdAt: 'desc' },
    }),
    listarVinculosObra(params.id),
    listarAditivosObra(params.id),
    listarReajustesObra(params.id),
    listarEmpenhosObra(params.id),
  ]);

  if (!obraRaw) {
    notFound();
  }

  // Converter Decimal para number para compatibilidade com Client Components
  const obra = {
    ...obraRaw,
    valorContrato: Number(obraRaw.valorContrato),
  };

  // Converter Decimal dos vínculos para number
  const vinculoFundoFormatado = vinculos.vinculoFundo ? {
    ...vinculos.vinculoFundo,
    percentual: Number(vinculos.vinculoFundo.percentual),
    valorAlocado: Number(vinculos.vinculoFundo.valorAlocado),
  } : null;

  const vinculosFiadoresFormatados = vinculos.vinculosFiadores.map(vf => ({
    ...vf,
    percentualGarantia: Number(vf.percentualGarantia),
    valorGarantia: Number(vf.valorGarantia),
    bensVinculados: vf.bensVinculados.map(bv => ({
      ...bv,
      bem: {
        ...bv.bem,
        valor: Number(bv.bem.valor),
      },
    })),
  }));

  // Converter Decimal dos aditivos para number
  const aditivos = aditivosResult.data.map(ad => ({
    ...ad,
    valorAditivo: ad.valorAditivo ? Number(ad.valorAditivo) : null,
    valorGlosa: ad.valorGlosa ? Number(ad.valorGlosa) : null,
  }));

  // Converter Decimal dos reajustes para number
  const reajustes = reajustesResult.data.map(rj => ({
    ...rj,
    percentual: Number(rj.percentual),
    valorReajuste: Number(rj.valorReajuste),
  }));

  // Converter Decimal dos empenhos para number
  const empenhos = empenhosResult.data.map(emp => ({
    ...emp,
    valor: Number(emp.valor),
    saldoAtual: Number(emp.saldoAtual),
    alertaMinimo: emp.alertaMinimo ? Number(emp.alertaMinimo) : null,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NAO_INICIADA':
        return 'bg-slate-700 text-slate-300';
      case 'EM_ANDAMENTO':
        return 'bg-green-900 text-green-400';
      case 'CONCLUIDA':
        return 'bg-blue-900 text-blue-400';
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
      case 'NAO_INICIADA':
        return 'Não Iniciada';
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
            <h1 className="text-3xl font-bold text-white mb-2">{obra.nome}</h1>
            <p className="text-lg font-mono text-blue-400 font-semibold">{obra.codigo}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(obra.status)}`}>
              {getStatusLabel(obra.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <ObraTabsContent 
        obra={obra} 
        documentos={documentos}
        vinculoFundo={vinculoFundoFormatado}
        vinculosFiadores={vinculosFiadoresFormatados}
        aditivos={aditivos}
        reajustes={reajustes}
        empenhos={empenhos}
      />
    </div>
  );
}
