'use client';

import { useState, useEffect, useRef } from 'react';
import { Edit, Save, X, RefreshCw, ArrowLeft, Loader2, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { 
  ServicoSimplificado,
  buscarServicosSimplificados,
  atualizarLeadTimes
} from '@/lib/api/servicos-simplificados-client';

interface LeadTimeSuprimentosContentProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
  obra: {
    id: string;
    nome: string;
    codigo: string;
  };
  versaoCategorizacao: {
    id: string;
    nome: string;
    numero: number;
  };
}

export default function LeadTimeSuprimentosContent({ 
  params, 
  obra, 
  versaoCategorizacao,
}: LeadTimeSuprimentosContentProps) {
  const [servicos, setServicos] = useState<ServicoSimplificado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<Map<string, Partial<ServicoSimplificado>>>(new Map());
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');
  const [atualizandoServicos, setAtualizandoServicos] = useState(false);
  const [temNovaVersao, setTemNovaVersao] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar serviços simplificados
  useEffect(() => {
    carregarServicos();
  }, [obra.id]);

  // Verificar se há nova versão da categorização
  useEffect(() => {
    const verificarNovaVersao = async () => {
      try {
        const response = await fetch(`/api/servicos-simplificados/verificar-atualizacao?obraId=${obra.id}&versaoCategorizacaoId=${versaoCategorizacao.id}`);
        if (response.ok) {
          const data = await response.json();
          setTemNovaVersao(data.temNovaVersao);
        }
      } catch (error) {
        console.error('Erro ao verificar nova versão:', error);
      }
    };

    verificarNovaVersao();
    const interval = setInterval(verificarNovaVersao, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, [obra.id, versaoCategorizacao.id]);

  const carregarServicos = async () => {
    try {
      setCarregando(true);
      const data = await buscarServicosSimplificados(obra.id);
      setServicos(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Atualizar lead time de um serviço
  const atualizarLeadTimeServico = (
    servicoId: string,
    campo: 'leadTimeMaterial' | 'leadTimeMaoDeObra' | 'leadTimeContratos' | 'leadTimeEquipamentos',
    valor: string
  ) => {
    const valorNumerico = valor === '' ? null : parseInt(valor, 10);
    
    setAlteracoesPendentes(prev => {
      const novasAlteracoes = new Map(prev);
      const alteracaoAtual = novasAlteracoes.get(servicoId) || {};
      novasAlteracoes.set(servicoId, {
        ...alteracaoAtual,
        [campo]: valorNumerico,
      });
      return novasAlteracoes;
    });
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setModoEdicao(false);
    setAlteracoesPendentes(new Map());
  };

  // Salvar alterações
  const salvarAlteracoesPendentes = async () => {
    if (alteracoesPendentes.size === 0) {
      setModoEdicao(false);
      return;
    }

    try {
      setSalvandoAlteracoes(true);

      // Salvar cada serviço modificado
      for (const [servicoId, alteracoes] of alteracoesPendentes.entries()) {
        await atualizarLeadTimes(servicoId, alteracoes);
      }

      // Recarregar dados
      await carregarServicos();
      setAlteracoesPendentes(new Map());
      setModoEdicao(false);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSalvandoAlteracoes(false);
    }
  };

  // Atualizar serviços da nova versão de categorização
  const atualizarServicos = async () => {
    if (!temNovaVersao) return;

    try {
      setAtualizandoServicos(true);
      
      // Chamar API para sincronizar serviços
      const response = await fetch('/api/servicos-simplificados/sincronizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          obraId: obra.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar serviços');
      }

      // Recarregar serviços
      await carregarServicos();
      setTemNovaVersao(false);
      alert('Serviços sincronizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar serviços:', error);
      alert('Erro ao atualizar serviços. Tente novamente.');
    } finally {
      setAtualizandoServicos(false);
    }
  };

  // Exportar lead times para Excel
  const exportarParaExcel = async () => {
    try {
      setExportando(true);
      
      const response = await fetch(`/api/lead-time-suprimentos/exportar?obraId=${obra.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar planilha');
      }

      // Baixar arquivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead-times-${obra.codigo}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar planilha. Tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  // Importar lead times do Excel
  const importarDoExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportando(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('obraId', obra.id);

      const response = await fetch('/api/lead-time-suprimentos/importar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao importar planilha');
      }

      const result = await response.json();
      alert(`Importação concluída!\n${result.atualizados} serviços atualizados com sucesso.`);
      
      // Recarregar dados
      await carregarServicos();
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert(error instanceof Error ? error.message : 'Erro ao importar planilha. Tente novamente.');
    } finally {
      setImportando(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Obter valor do campo (considerando alterações pendentes)
  const obterValorCampo = (
    servico: ServicoSimplificado,
    campo: 'leadTimeMaterial' | 'leadTimeMaoDeObra' | 'leadTimeContratos' | 'leadTimeEquipamentos'
  ): number | null => {
    const alteracoesPendentesServico = alteracoesPendentes.get(servico.id);
    if (alteracoesPendentesServico && campo in alteracoesPendentesServico) {
      return alteracoesPendentesServico[campo] ?? null;
    }
    return servico[campo];
  };

  // Verificar se campo foi alterado
  const campoFoiAlterado = (
    servico: ServicoSimplificado,
    campo: 'leadTimeMaterial' | 'leadTimeMaoDeObra' | 'leadTimeContratos' | 'leadTimeEquipamentos'
  ): boolean => {
    const alteracoesPendentesServico = alteracoesPendentes.get(servico.id);
    return !!(alteracoesPendentesServico && campo in alteracoesPendentesServico);
  };

  // Filtrar serviços
  const servicosFiltrados = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  if (carregando) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando serviços simplificados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Indicador de salvamento */}
      {salvandoAlteracoes && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/plan-medicoes/${params.construtoraId}/${params.obraId}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Lead Time de Suprimentos</h1>
            <p className="text-slate-400">{obra.codigo} - {obra.nome}</p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-slate-500">
                Categorização: <span className="text-blue-400 font-medium">{versaoCategorizacao.nome}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Atualizar Serviços - sempre visível, habilitado apenas quando há nova versão */}
          {!modoEdicao && (
            <button
              onClick={atualizarServicos}
              disabled={!temNovaVersao || atualizandoServicos}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                atualizandoServicos
                  ? 'bg-slate-600 text-white cursor-wait'
                  : temNovaVersao
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              title={
                temNovaVersao
                  ? 'Há uma nova versão da categorização. Clique para sincronizar os serviços.'
                  : 'Nenhuma atualização de categorização disponível.'
              }
            >
              {atualizandoServicos ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {atualizandoServicos ? 'Sincronizando...' : 'Atualizar Serviços'}
            </button>
          )}

          {/* Botões de Importar/Exportar Excel */}
          {!modoEdicao && (
            <>
              <button
                onClick={exportarParaExcel}
                disabled={exportando || servicos.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Exportar lead times para Excel"
              >
                {exportando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportando ? 'Exportando...' : 'Exportar Excel'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={importarDoExcel}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importando}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Importar lead times do Excel"
              >
                {importando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importando ? 'Importando...' : 'Importar Excel'}
              </button>
            </>
          )}

          {/* Botões de Edição */}
          {!modoEdicao ? (
            <button
              onClick={() => setModoEdicao(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar Lead Times
            </button>
          ) : (
            <>
              <button
                onClick={cancelarEdicao}
                disabled={salvandoAlteracoes}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={salvarAlteracoesPendentes}
                disabled={salvandoAlteracoes || alteracoesPendentes.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {salvandoAlteracoes ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Alterações
                {alteracoesPendentes.size > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-green-700 rounded-full text-xs">
                    {alteracoesPendentes.size}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar por nome do serviço..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabela de Serviços */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider w-2/5">
                  Serviço Simplificado
                </th>
                <th colSpan={4} className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider border-l border-slate-700">
                  Lead Time (dias)
                </th>
              </tr>
              <tr className="bg-slate-800">
                <th className="px-6 py-2"></th>
                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider border-l border-slate-700">
                  Material
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider border-l border-slate-700">
                  Mão de Obra
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider border-l border-slate-700">
                  Contratos
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase tracking-wider border-l border-slate-700">
                  Equip. & Fretes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {servicosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    {filtroNome 
                      ? 'Nenhum serviço encontrado com esse filtro' 
                      : servicos.length === 0
                        ? 'Nenhum serviço simplificado encontrado na categorização ativa desta obra'
                        : 'Nenhum serviço cadastrado'
                    }
                  </td>
                </tr>
              ) : (
                servicosFiltrados.map((servico) => (
                  <tr key={servico.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm text-white">
                      {servico.nome}
                    </td>
                    
                    {/* Material */}
                    <td className={`px-4 py-4 text-center border-l border-slate-800 ${campoFoiAlterado(servico, 'leadTimeMaterial') ? 'bg-yellow-900/30' : ''}`}>
                      {modoEdicao ? (
                        <input
                          type="number"
                          min="0"
                          value={obterValorCampo(servico, 'leadTimeMaterial') ?? ''}
                          onChange={(e) => atualizarLeadTimeServico(servico.id, 'leadTimeMaterial', e.target.value)}
                          className="w-20 px-2 py-1 text-sm text-center bg-slate-800 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">
                          {servico.leadTimeMaterial ?? '-'}
                        </span>
                      )}
                    </td>

                    {/* Mão de Obra */}
                    <td className={`px-4 py-4 text-center border-l border-slate-800 ${campoFoiAlterado(servico, 'leadTimeMaoDeObra') ? 'bg-yellow-900/30' : ''}`}>
                      {modoEdicao ? (
                        <input
                          type="number"
                          min="0"
                          value={obterValorCampo(servico, 'leadTimeMaoDeObra') ?? ''}
                          onChange={(e) => atualizarLeadTimeServico(servico.id, 'leadTimeMaoDeObra', e.target.value)}
                          className="w-20 px-2 py-1 text-sm text-center bg-slate-800 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">
                          {servico.leadTimeMaoDeObra ?? '-'}
                        </span>
                      )}
                    </td>

                    {/* Contratos */}
                    <td className={`px-4 py-4 text-center border-l border-slate-800 ${campoFoiAlterado(servico, 'leadTimeContratos') ? 'bg-yellow-900/30' : ''}`}>
                      {modoEdicao ? (
                        <input
                          type="number"
                          min="0"
                          value={obterValorCampo(servico, 'leadTimeContratos') ?? ''}
                          onChange={(e) => atualizarLeadTimeServico(servico.id, 'leadTimeContratos', e.target.value)}
                          className="w-20 px-2 py-1 text-sm text-center bg-slate-800 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">
                          {servico.leadTimeContratos ?? '-'}
                        </span>
                      )}
                    </td>

                    {/* Equipamentos */}
                    <td className={`px-4 py-4 text-center border-l border-slate-800 ${campoFoiAlterado(servico, 'leadTimeEquipamentos') ? 'bg-yellow-900/30' : ''}`}>
                      {modoEdicao ? (
                        <input
                          type="number"
                          min="0"
                          value={obterValorCampo(servico, 'leadTimeEquipamentos') ?? ''}
                          onChange={(e) => atualizarLeadTimeServico(servico.id, 'leadTimeEquipamentos', e.target.value)}
                          className="w-20 px-2 py-1 text-sm text-center bg-slate-800 border border-slate-600 text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-slate-300">
                          {servico.leadTimeEquipamentos ?? '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informações */}
      <div className="mt-6 bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">ℹ️ Sobre Lead Times</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Os lead times são informados em <strong>dias</strong></li>
          <li>• Exibindo apenas os <strong>serviços simplificados utilizados na categorização ativa</strong> desta obra</li>
          <li>• Cada serviço simplificado tem seus próprios lead times globais</li>
          <li>• Esses valores serão utilizados para calcular datas de compra no cronograma</li>
          <li>• Campos destacados indicam alterações pendentes de salvamento</li>
          <li>• <strong>Exportar Excel:</strong> Baixa uma planilha com todos os serviços e lead times já preenchidos</li>
          <li>• <strong>Importar Excel:</strong> Atualiza os lead times em massa a partir de uma planilha previamente exportada</li>
        </ul>
      </div>
    </div>
  );
}
