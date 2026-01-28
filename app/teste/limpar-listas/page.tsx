'use client';

import { useState } from 'react';

export default function LimparListasPage() {
  const [resultado, setResultado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executarLimpeza = async () => {
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const response = await fetch('/api/categorizacao-listas/limpar-recriar', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResultado(data);
      } else {
        setErro(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao executar limpeza');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        🗑️ Limpar Listas de Categorização
      </h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>ATENÇÃO:</strong> Esta ação irá apagar TODAS as SubEtapas e
              ServiçosSimplificados do banco de dados. NÃO irá recriar automaticamente.
              Você precisará importar via Excel depois.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">O que esta ação faz?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Apaga TODAS as SubEtapas do banco de dados</li>
            <li>Apaga TODOS os ServiçosSimplificados do banco de dados</li>
            <li><strong>NÃO recria automaticamente</strong> (diferente de antes)</li>
            <li>Você deve importar os dados via Excel na página de categorização</li>
          </ul>
        </div>

        <button
          onClick={executarLimpeza}
          disabled={carregando}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {carregando ? '⏳ Executando...' : '🗑️ Executar Limpeza'}
        </button>

        {erro && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <pre className="whitespace-pre-wrap">{erro}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {resultado && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  ✅ {resultado.message}
                </h3>
                <div className="mt-4 text-sm text-green-700">
                  <h4 className="font-semibold mb-2">Registros Deletados:</h4>
                  <ul className="space-y-1">
                    <li>SubEtapas: {resultado.deletados?.subEtapas || 0}</li>
                    <li>Serviços Simplificados: {resultado.deletados?.servicos || 0}</li>
                  </ul>
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="font-semibold text-blue-800">📝 Próximo Passo:</p>
                    <p className="text-blue-700 mt-1">
                      Vá para a página de categorização e use os botões de engrenagem (⚙️) 
                      ao lado de "SubEtapas" e "Serviços" para importar os dados via Excel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Próximos Passos:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Execute a limpeza usando o botão vermelho acima</li>
          <li>Vá para a página de categorização de uma obra</li>
          <li>
            Clique no botão de engrenagem (⚙️) ao lado de "SubEtapas" 
            para abrir o modal de gerenciamento
          </li>
          <li>
            No modal, clique em "Importar do Excel" e depois em "Baixar Modelo"
          </li>
          <li>
            Preencha o modelo Excel com suas SubEtapas (colunas: Nome, Ordem)
          </li>
          <li>
            Importe o arquivo preenchido usando o botão "Importar"
          </li>
          <li>
            Repita o processo para "Serviços Simplificados"
          </li>
        </ol>
      </div>
    </div>
  );
}
