/**
 * EXEMPLO DE USO - Previsões de Medição
 * 
 * Este arquivo contém exemplos práticos de como usar as APIs de previsões de medição
 * no frontend da aplicação.
 */

"use client";

import { useState, useEffect } from "react";
import {
  buscarPrevisoesPorObra,
  criarPrevisaoMedicao,
  atualizarItemPrevisao,
  deletarPrevisaoMedicao,
  buscarMedicoesAgrupadasPorVisaoGerencial,
  formatarMoeda,
  formatarQuantidade,
  formatarPercentual,
  formatarData,
  getCorStatus,
  type PrevisaoMedicao,
  type MedicaoAgrupada,
} from "@/lib/api/previsoes-medicao-client";

// --------------------------------------------------------
// EXEMPLO 1: Listar Previsões de Medição
// --------------------------------------------------------

export function ListaPrevisoesMedicao({ obraId }: { obraId: string }) {
  const [previsoes, setPrevisoes] = useState<PrevisaoMedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarPrevisoes() {
      try {
        setLoading(true);
        const data = await buscarPrevisoesPorObra(obraId);
        setPrevisoes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    carregarPrevisoes();
  }, [obraId]);

  if (loading) return <div>Carregando previsões...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Previsões de Medição</h2>
      
      {previsoes.length === 0 ? (
        <p className="text-gray-500">Nenhuma previsão cadastrada</p>
      ) : (
        <div className="grid gap-4">
          {previsoes.map((previsao) => (
            <div
              key={previsao.id}
              className="border rounded-lg p-4 bg-white shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{previsao.nome}</h3>
                  <p className="text-sm text-gray-500">
                    Medição nº {previsao.numero} • {formatarData(previsao.dataPrevisao)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getCorStatus(
                    previsao.status
                  )}`}
                >
                  {previsao.status}
                </span>
              </div>

              {previsao.itens && previsao.itens.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {previsao.itens.length} {previsao.itens.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------
// EXEMPLO 2: Criar Nova Previsão de Medição
// --------------------------------------------------------

export function FormularioCriarPrevisao({ obraId }: { obraId: string }) {
  const [nome, setNome] = useState("");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [tipo, setTipo] = useState<"QUANTIDADE" | "PERCENTUAL">("QUANTIDADE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Exemplo: criar uma previsão com itens
      await criarPrevisaoMedicao({
        obraId,
        nome,
        dataPrevisao,
        ordem: 1,
        tipo,
        versaoOrcamentoId: "versao-uuid", // Substituir pelo ID real
        itens: [
          {
            itemOrcamentoId: "item-uuid", // Substituir pelo ID real
            itemCustoOrcadoId: "item-custo-uuid", // Substituir pelo ID real
            etapa: "INFRAESTRUTURA E CONTENÇÕES",
            subEtapa: "MOVIMENTAÇÃO DE SOLO",
            servicoSimplificado: "Escavação e Reaterro Mecanizado",
            quantidadePrevista: 100,
            percentualPrevisto: 25,
            valorPrevisto: 50000,
          },
        ],
      });

      setSuccess(true);
      setNome("");
      setDataPrevisao("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Nova Previsão de Medição</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Previsão criada com sucesso!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome da Medição
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Medição 01 - Janeiro/2024"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Prevista
        </label>
        <input
          type="date"
          value={dataPrevisao}
          onChange={(e) => setDataPrevisao(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Medição
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as any)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="QUANTIDADE">Por Quantidade</option>
          <option value="PERCENTUAL">Por Percentual</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Criando..." : "Criar Previsão"}
      </button>
    </form>
  );
}

// --------------------------------------------------------
// EXEMPLO 3: Editar Item de Medição
// --------------------------------------------------------

export function EditarItemMedicao({
  itemId,
  quantidadeAtual,
  valorAtual,
  onUpdate,
}: {
  itemId: string;
  quantidadeAtual: number;
  valorAtual: number;
  onUpdate: () => void;
}) {
  const [quantidade, setQuantidade] = useState(quantidadeAtual.toString());
  const [valor, setValor] = useState(valorAtual.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setLoading(true);
      setError(null);

      await atualizarItemPrevisao(itemId, {
        quantidadePrevista: parseFloat(quantidade),
        valorPrevisto: parseFloat(valor),
      });

      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Editar Item</h3>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm text-gray-700 mb-1">Quantidade</label>
        <input
          type="number"
          step="0.01"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar Alterações"}
      </button>
    </div>
  );
}

// --------------------------------------------------------
// EXEMPLO 4: Visualização Agrupada por Visão Gerencial
// --------------------------------------------------------

export function VisaoGerencialMedicoes({ obraId }: { obraId: string }) {
  const [medicoes, setMedicoes] = useState<MedicaoAgrupada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarMedicoes() {
      try {
        setLoading(true);
        const data = await buscarMedicoesAgrupadasPorVisaoGerencial(obraId);
        setMedicoes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    carregarMedicoes();
  }, [obraId]);

  if (loading) return <div>Carregando visão gerencial...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;
  if (!medicoes) return <div>Nenhuma medição encontrada</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visão Gerencial - Medições</h2>

      {Object.entries(medicoes).map(([etapaKey, etapaData]) => (
        <div key={etapaKey} className="border rounded-lg p-4 bg-white shadow">
          <h3 className="text-xl font-semibold text-blue-800 mb-4">
            {etapaData.etapa}
          </h3>

          {Object.entries(etapaData.subEtapas).map(([subEtapaKey, subEtapaData]) => (
            <div key={subEtapaKey} className="ml-4 mb-4">
              <h4 className="text-lg font-medium text-blue-600 mb-2">
                {subEtapaData.subEtapa}
              </h4>

              {Object.entries(subEtapaData.servicos).map(
                ([servicoKey, servicoData]) => (
                  <div
                    key={servicoKey}
                    className="ml-4 mb-3 p-3 bg-gray-50 rounded"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-800">
                        {servicoData.servicoSimplificado}
                      </h5>
                      <span className="text-sm font-semibold text-green-600">
                        {formatarPercentual(servicoData.percentualMedido)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Quantidade Total:</span>
                        <span className="ml-2 font-medium">
                          {formatarQuantidade(servicoData.quantidadeTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Total:</span>
                        <span className="ml-2 font-medium">
                          {formatarMoeda(servicoData.valorTotal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantidade Medida:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatarQuantidade(servicoData.quantidadeMedida)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Medido:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatarMoeda(servicoData.valorMedido)}
                        </span>
                      </div>
                    </div>

                    {servicoData.medicoes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Histórico de Medições:
                        </p>
                        <div className="space-y-1">
                          {servicoData.medicoes.map((medicao, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-gray-600 flex justify-between"
                            >
                              <span>
                                {medicao.nome} ({formatarData(medicao.dataPrevisao)})
                              </span>
                              <span>
                                {formatarQuantidade(medicao.quantidade)} •{" "}
                                {formatarMoeda(medicao.valor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------
// EXEMPLO 5: Deletar Previsão com Confirmação
// --------------------------------------------------------

export function BotaoDeletarPrevisao({
  previsaoId,
  nome,
  onDelete,
}: {
  previsaoId: string;
  nome: string;
  onDelete: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    try {
      setLoading(true);
      setError(null);

      await deletarPrevisaoMedicao(previsaoId);
      
      onDelete();
      setConfirmando(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (confirmando) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-700">
          Tem certeza que deseja deletar a previsão "{nome}"?
        </p>
        
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deletando..." : "Sim, deletar"}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            disabled={loading}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Deletar
    </button>
  );
}

// --------------------------------------------------------
// EXEMPLO 6: Hook Customizado para Previsões
// --------------------------------------------------------

export function usePrevisoesMedicao(obraId: string) {
  const [previsoes, setPrevisoes] = useState<PrevisaoMedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function recarregar() {
    try {
      setLoading(true);
      setError(null);
      const data = await buscarPrevisoesPorObra(obraId);
      setPrevisoes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    recarregar();
  }, [obraId]);

  return {
    previsoes,
    loading,
    error,
    recarregar,
  };
}

// USO DO HOOK:
// const { previsoes, loading, error, recarregar } = usePrevisoesMedicao(obraId);
