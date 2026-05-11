'use client';

import { useState } from 'react';
import { Plus, Building2, Shield, Trash2, Eye, AlertCircle, FileText } from 'lucide-react';
import { desvincularFundo, desvincularFiador, desvincularBem } from '@/app/actions/vinculos';
import Link from 'next/link';

interface VinculosTabProps {
  obra: any;
  vinculoFundo: any;
  vinculosFiadores: any[];
}

export default function VinculosTab({ obra, vinculoFundo, vinculosFiadores }: VinculosTabProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveFundo = async () => {
    if (!confirm('Deseja realmente desvincular este fundo da obra?')) return;

    setIsRemoving(true);
    const result = await desvincularFundo(vinculoFundo.id, obra.id);
    
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message);
    }
    setIsRemoving(false);
  };

  const handleRemoveFiador = async (vinculoId: string) => {
    if (!confirm('Deseja realmente desvincular este fiador da obra?')) return;

    setIsRemoving(true);
    const result = await desvincularFiador(vinculoId, obra.id);
    
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message);
    }
    setIsRemoving(false);
  };

  const handleRemoveBem = async (vinculoBemId: string) => {
    if (!confirm('Deseja realmente desvincular este bem?')) return;

    setIsRemoving(true);
    const result = await desvincularBem(vinculoBemId, obra.id);
    
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message);
    }
    setIsRemoving(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header com Informações da Obra */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Vínculos Contratuais</h2>
            <p className="text-slate-400 text-sm">
              Gerenciamento de Fundos Investidores e Fiadores vinculados ao contrato
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Valor do Contrato</p>
            <p className="text-2xl font-bold text-green-400 font-mono">
              {formatCurrency(Number(obra.valorContrato))}
            </p>
          </div>
        </div>
      </div>

      {/* Alert Informativo */}
      <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300 mb-1">
              Estrutura de Vínculos
            </h3>
            <p className="text-sm text-blue-400">
              Esta seção permite vincular os Fundos investidores (credores) e Fiadores (avalistas) 
              ao contrato de obra. Os percentuais e valores alocados devem refletir a participação 
              de cada parte no financiamento e nas garantias do projeto.
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Fundos */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Fundos Investidores (Credores)</h3>
                <p className="text-sm text-slate-400">
                  Fundos que financiam ou investem na obra
                </p>
              </div>
            </div>
            <Link
              href={`/eng/contratos/contratos-obras/obra/${obra.id}/vinculos/fundo`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Vincular Fundo
            </Link>
          </div>
        </div>

        <div className="p-6">
          {!vinculoFundo ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">Nenhum fundo vinculado</p>
              <p className="text-sm text-slate-500">
                Clique em "Vincular Fundo" para adicionar um fundo investidor a este contrato
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-green-400 font-semibold">
                        {vinculoFundo.fundo.codigo}
                      </span>
                      <span className="text-slate-600">•</span>
                      <h4 className="text-white font-medium">
                        {vinculoFundo.fundo.nomeFantasia || vinculoFundo.fundo.razaoSocial}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">CNPJ: </span>
                        <span className="text-slate-300 font-mono">{vinculoFundo.fundo.cnpj}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Participação: </span>
                        <span className="text-green-400 font-semibold">
                          {vinculoFundo.percentual}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Valor Alocado: </span>
                        <span className="text-white font-mono font-semibold">
                          {formatCurrency(vinculoFundo.valorAlocado)}
                        </span>
                      </div>
                    </div>
                    {vinculoFundo.observacoes && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">Obs: </span>
                        <span className="text-slate-300">{vinculoFundo.observacoes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/cadastros/fundos/${vinculoFundo.fundo.id}/cadastro`}
                      className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-colors"
                      title="Ver Detalhes do Fundo"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handleRemoveFundo}
                      disabled={isRemoving}
                      className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition-colors disabled:opacity-50"
                      title="Desvincular Fundo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Resumo do Fundo */}
              <div className="bg-green-950 border border-green-800 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-green-300 font-medium">Valor Alocado</span>
                  <span className="text-green-400 font-bold font-mono text-lg">
                    {formatCurrency(vinculoFundo.valorAlocado)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-green-300 text-sm">Participação</span>
                  <span className="text-green-400 font-semibold">
                    {vinculoFundo.percentual}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Fiadores */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Fiadores / Avalistas</h3>
                <p className="text-sm text-slate-400">
                  Pessoas ou empresas que garantem o contrato
                </p>
              </div>
            </div>
            <Link
              href={`/eng/contratos/contratos-obras/obra/${obra.id}/vinculos/fiador`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Vincular Fiador
            </Link>
          </div>
        </div>

        <div className="p-6">
          {vinculosFiadores.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">Nenhum fiador vinculado</p>
              <p className="text-sm text-slate-500">
                Clique em "Vincular Fiador" para adicionar fiadores/avalistas a este contrato
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vinculosFiadores.map((vinculo) => (
                <div
                  key={vinculo.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-blue-400 font-semibold">
                          {vinculo.fiador.codigo}
                        </span>
                        <span className="text-slate-600">•</span>
                        <h4 className="text-white font-medium">{vinculo.fiador.nome}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          vinculo.fiador.tipo === 'PF' 
                            ? 'bg-purple-900 text-purple-300' 
                            : 'bg-orange-900 text-orange-300'
                        }`}>
                          {vinculo.fiador.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <div>
                          <span className="text-slate-400">
                            {vinculo.fiador.tipo === 'PF' ? 'CPF: ' : 'CNPJ: '}
                          </span>
                          <span className="text-slate-300 font-mono">{vinculo.fiador.cpfCnpj}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Garantia: </span>
                          <span className="text-blue-400 font-semibold">
                            {vinculo.percentualGarantia}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Valor: </span>
                          <span className="text-white font-mono font-semibold">
                            {formatCurrency(vinculo.valorGarantia)}
                          </span>
                        </div>
                      </div>

                      {/* Bens Vinculados */}
                      {vinculo.bensVinculados.length > 0 && (
                        <div className="border-t border-slate-700 pt-3 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-300">
                              Bens em Garantia ({vinculo.bensVinculados.length})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {vinculo.bensVinculados.map((bemVinculo: any) => (
                              <div key={bemVinculo.id} className="bg-slate-900 rounded p-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <span className="text-slate-400">{bemVinculo.bem.tipo}: </span>
                                    <span className="text-white">{bemVinculo.bem.descricao}</span>
                                    {bemVinculo.bem.endereco && (
                                      <span className="text-slate-500 ml-2">
                                        • {bemVinculo.bem.cidade}/{bemVinculo.bem.estado}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-green-400 font-mono font-semibold">
                                      {formatCurrency(bemVinculo.bem.valor)}
                                    </span>
                                    <button
                                      onClick={() => handleRemoveBem(bemVinculo.id)}
                                      disabled={isRemoving}
                                      className="p-1 hover:bg-slate-800 rounded text-red-400 transition-colors disabled:opacity-50"
                                      title="Desvincular Bem"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {vinculo.observacoes && (
                        <div className="mt-2 text-sm">
                          <span className="text-slate-400">Obs: </span>
                          <span className="text-slate-300">{vinculo.observacoes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/cadastros/fiadores/${vinculo.fiador.id}/cadastro`}
                        className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-colors"
                        title="Ver Detalhes do Fiador"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleRemoveFiador(vinculo.id)}
                        disabled={isRemoving}
                        className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition-colors disabled:opacity-50"
                        title="Desvincular Fiador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Resumo dos Fiadores */}
              <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 font-medium">Total em Garantias</span>
                  <span className="text-blue-400 font-bold font-mono text-lg">
                    {formatCurrency(vinculosFiadores.reduce((sum, f) => sum + f.valorGarantia, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-300 text-sm">Cobertura Total</span>
                  <span className="text-blue-400 font-semibold">
                    {vinculosFiadores.reduce((sum, f) => sum + f.percentualGarantia, 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-300 text-sm">Total de Fiadores</span>
                  <span className="text-blue-400 font-semibold">
                    {vinculosFiadores.length}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-blue-300 text-sm">Total de Bens Vinculados</span>
                  <span className="text-blue-400 font-semibold">
                    {vinculosFiadores.reduce((sum, f) => sum + f.bensVinculados.length, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
