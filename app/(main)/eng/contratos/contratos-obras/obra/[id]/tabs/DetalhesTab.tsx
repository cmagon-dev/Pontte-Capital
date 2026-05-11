'use client';

import { 
  Building2, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileCheck, 
  TrendingUp,
  Receipt,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Link from 'next/link';

interface FonteRecurso {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  esfera: string;
}

interface Obra {
  id: string;
  codigo: string;
  nome: string;
  valorContrato: number;
  prazoMeses?: number | null;
  dataInicio?: Date | string | null;
  dataFim?: Date | string | null;
  prazoExecucaoMeses?: number | null;
  dataInicioExecucao?: Date | string | null;
  dataFimExecucao?: Date | string | null;
  status: string;
  cno?: string | null;
  art?: string | null;
  alvara?: string | null;
  fonteRecurso?: FonteRecurso | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  construtora: any;
  contratante?: any;
}

interface Aditivo {
  id: string;
  tipo: string;
  valorAditivo: number | null;
  valorGlosa: number | null;
  status: string;
}

interface Reajuste {
  id: string;
  percentual: number;
  valorReajuste: number;
  status: string;
}

interface Empenho {
  id: string;
  tipo: string;
  valor: number;
  saldoAtual: number;
  status: string;
}

interface Documento {
  id: string;
  categoria: string;
}

interface DetalhesTabProps {
  obra: Obra;
  aditivos: Aditivo[];
  reajustes: Reajuste[];
  empenhos: Empenho[];
  documentos: Documento[];
  vinculoFundo: any;
  vinculosFiadores: any[];
}

export default function DetalhesTab({ 
  obra, 
  aditivos, 
  reajustes, 
  empenhos, 
  documentos,
  vinculoFundo,
  vinculosFiadores,
}: DetalhesTabProps) {
  
  // Calcular resumos financeiros
  const totalAditivos = aditivos
    .filter(a => a.tipo === 'VALOR' && a.status !== 'REJEITADO')
    .reduce((sum, a) => sum + (a.valorAditivo || 0) - (a.valorGlosa || 0), 0);

  const totalReajustes = reajustes
    .filter(r => r.status === 'APLICADO')
    .reduce((sum, r) => sum + r.valorReajuste, 0);

  const valorContratoAtualizado = obra.valorContrato + totalAditivos + totalReajustes;

  const totalEmpenhado = empenhos
    .filter(e => e.status !== 'CANCELADO')
    .reduce((sum, e) => {
      if (e.tipo === 'ORIGINAL' || e.tipo === 'REFORCO') return sum + e.valor;
      if (e.tipo === 'ANULACAO') return sum - e.valor;
      return sum;
    }, 0);

  const saldoEmpenhos = empenhos
    .filter(e => e.status !== 'CANCELADO')
    .reduce((sum, e) => sum + e.saldoAtual, 0);

  const totalGarantias = vinculosFiadores.reduce((sum, f) => sum + f.valorGarantia, 0);
  const totalBens = vinculosFiadores.reduce((sum, f) => sum + f.bensVinculados.length, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NAO_INICIADA': return 'bg-slate-700 text-slate-300';
      case 'EM_ANDAMENTO': return 'bg-green-900 text-green-300';
      case 'CONCLUIDA': return 'bg-blue-900 text-blue-300';
      case 'PARALISADA': return 'bg-amber-900 text-amber-300';
      case 'CANCELADA': return 'bg-red-900 text-red-300';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NAO_INICIADA': return 'Não Iniciada';
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'CONCLUIDA': return 'Concluída';
      case 'PARALISADA': return 'Paralisada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Status e Valor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-950 to-green-900 border border-green-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-300">Valor Atualizado</p>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white font-mono mb-1">
            {formatCurrency(valorContratoAtualizado)}
          </p>
          {(totalAditivos !== 0 || totalReajustes !== 0) && (
            <p className="text-xs text-green-300">
              Original: {formatCurrency(obra.valorContrato)}
            </p>
          )}
        </div>

        <div className={`border rounded-lg p-6 ${getStatusColor(obra.status)}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">Status da Obra</p>
            <FileCheck className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{getStatusLabel(obra.status)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-300">Documentos</p>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {documentos.length}
          </p>
          <p className="text-xs text-blue-300">arquivos anexados</p>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Resumo Financeiro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Valor Original</p>
            <p className="text-xl font-bold text-white font-mono">
              {formatCurrency(obra.valorContrato)}
            </p>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-slate-400">Aditivos</p>
              {totalAditivos > 0 && <ArrowUpRight className="w-4 h-4 text-green-400" />}
              {totalAditivos < 0 && <ArrowDownRight className="w-4 h-4 text-red-400" />}
            </div>
            <p className={`text-xl font-bold font-mono ${
              totalAditivos > 0 ? 'text-green-400' : totalAditivos < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {totalAditivos > 0 ? '+' : ''}{formatCurrency(totalAditivos)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{aditivos.length} registrados</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-slate-400">Reajustes</p>
              {totalReajustes > 0 && <ArrowUpRight className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xl font-bold text-purple-400 font-mono">
              +{formatCurrency(totalReajustes)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{reajustes.length} registrados</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border-2 border-green-700">
            <p className="text-sm text-green-400 mb-1 font-semibold">Valor Final</p>
            <p className="text-xl font-bold text-green-400 font-mono">
              {formatCurrency(valorContratoAtualizado)}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo de Empenhos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            Empenhos (Lastro Orçamentário)
          </h2>
          <Link
            href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=empenhos`}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver detalhes →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-1">Total Empenhado</p>
            <p className="text-2xl font-bold text-blue-400 font-mono">
              {formatCurrency(totalEmpenhado)}
            </p>
            <p className="text-xs text-blue-300 mt-1">{empenhos.length} empenhos</p>
          </div>
          
          <div className="bg-green-950 border border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-300 mb-1">Saldo Disponível</p>
            <p className="text-2xl font-bold text-green-400 font-mono">
              {formatCurrency(saldoEmpenhos)}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">% Executado</p>
            <p className="text-2xl font-bold text-white">
              {totalEmpenhado > 0 
                ? `${((1 - saldoEmpenhos / totalEmpenhado) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Resumo de Vínculos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Vínculos e Garantias
          </h2>
          <Link
            href={`/eng/contratos/contratos-obras/obra/${obra.id}?tab=vinculos`}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver detalhes →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`rounded-lg p-4 ${
            vinculoFundo 
              ? 'bg-green-950 border border-green-800' 
              : 'bg-amber-950 border border-amber-800'
          }`}>
            <p className={`text-sm mb-1 ${vinculoFundo ? 'text-green-300' : 'text-amber-300'}`}>
              Fundo Investidor
            </p>
            {vinculoFundo ? (
              <>
                <p className="text-lg font-bold text-white">
                  {vinculoFundo.fundo.codigo}
                </p>
                <p className="text-xs text-green-300 mt-1 truncate">
                  {vinculoFundo.fundo.nomeFantasia || vinculoFundo.fundo.razaoSocial}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-amber-400">Não vinculado</p>
            )}
          </div>

          <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-300 mb-1">Fiadores</p>
            <p className="text-2xl font-bold text-blue-400">
              {vinculosFiadores.length}
            </p>
            <p className="text-xs text-blue-300 mt-1">avalistas vinculados</p>
          </div>

          <div className="bg-purple-950 border border-purple-800 rounded-lg p-4">
            <p className="text-sm text-purple-300 mb-1">Garantias</p>
            <p className="text-2xl font-bold text-purple-400 font-mono">
              {formatCurrency(totalGarantias)}
            </p>
            <p className="text-xs text-purple-300 mt-1">{totalBens} bens vinculados</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-1">Cobertura</p>
            <p className="text-2xl font-bold text-white">
              {obra.valorContrato > 0 
                ? `${((totalGarantias / obra.valorContrato) * 100).toFixed(0)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Prazos e Vigências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-blue-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Vigência do Contrato
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Início</p>
              <p className="text-white font-medium">
                {obra.dataInicio ? formatDate(obra.dataInicio) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Término</p>
              <p className="text-white font-medium">
                {obra.dataFim ? formatDate(obra.dataFim) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Prazo</p>
              <p className="text-2xl font-bold text-blue-400">
                {obra.prazoMeses || 0} <span className="text-sm">meses</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Execução da Obra
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-1">Início</p>
              <p className="text-white font-medium">
                {obra.dataInicioExecucao ? formatDate(obra.dataInicioExecucao) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Conclusão Prevista</p>
              <p className="text-white font-medium">
                {obra.dataFimExecucao ? formatDate(obra.dataFimExecucao) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Prazo</p>
              <p className="text-2xl font-bold text-amber-400">
                {obra.prazoExecucaoMeses || 0} <span className="text-sm">meses</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Partes Envolvidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            Construtora
          </h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-400">Código</p>
              <p className="text-white font-mono font-semibold">{obra.construtora.codigo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Razão Social</p>
              <p className="text-white font-medium">{obra.construtora.razaoSocial}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">CNPJ</p>
              <p className="text-white font-mono">{obra.construtora.cnpj}</p>
            </div>
          </div>
        </div>

        {obra.contratante && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              Contratante (Sacado)
            </h2>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400">Código</p>
                <p className="text-white font-mono font-semibold">{obra.contratante.codigo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Razão Social</p>
                <p className="text-white font-medium">{obra.contratante.razaoSocial}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">CNPJ</p>
                <p className="text-white font-mono">{obra.contratante.cnpj}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações Técnicas e Localização */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(obra.cno || obra.art || obra.alvara || obra.fonteRecurso) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-400" />
              Documentação Técnica
            </h2>
            <div className="space-y-2">
              {obra.cno && (
                <div>
                  <p className="text-xs text-slate-400">CNO</p>
                  <p className="text-white font-mono">{obra.cno}</p>
                </div>
              )}
              {obra.art && (
                <div>
                  <p className="text-xs text-slate-400">ART</p>
                  <p className="text-white font-mono">{obra.art}</p>
                </div>
              )}
              {obra.alvara && (
                <div>
                  <p className="text-xs text-slate-400">Alvará</p>
                  <p className="text-white font-mono">{obra.alvara}</p>
                </div>
              )}
              {obra.fonteRecurso && (
                <div>
                  <p className="text-xs text-slate-400">Fonte de Recurso</p>
                  <p className="text-white font-semibold">
                    {obra.fonteRecurso.codigo} - {obra.fonteRecurso.nome}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {obra.fonteRecurso.tipo} - {obra.fonteRecurso.esfera}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(obra.endereco || obra.cidade || obra.estado) && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-400" />
              Localização da Obra
            </h2>
            <div className="space-y-2">
              {obra.endereco && (
                <div>
                  <p className="text-xs text-slate-400">Endereço</p>
                  <p className="text-white">{obra.endereco}</p>
                </div>
              )}
              {(obra.cidade || obra.estado) && (
                <div>
                  <p className="text-xs text-slate-400">Município/UF</p>
                  <p className="text-white">
                    {obra.cidade}{obra.estado && ` - ${obra.estado}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
