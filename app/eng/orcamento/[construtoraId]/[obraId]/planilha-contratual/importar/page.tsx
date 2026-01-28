'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';

export default function ImportarPlanilhaPage({ params }: { params: { construtoraId: string; obraId: string } }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [nomeVersao, setNomeVersao] = useState('');
  const [tipoVersao, setTipoVersao] = useState<'BASELINE' | 'REVISAO'>('BASELINE');
  const [observacoes, setObservacoes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}/planilha-contratual`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Importar Planilha Contratual</h1>
            <p className="text-slate-400">Upload e Configuração da Planilha Orçamentária</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Instruções */}
        <div className="bg-blue-950 border border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Formato Esperado da Planilha</h3>
                <button
                  onClick={handleDownloadModelo}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Baixar Modelo
                </button>
              </div>
              <ul className="text-sm text-blue-300 space-y-2 list-disc list-inside">
                <li>
                  <strong>Colunas Obrigatórias:</strong> Item, Referência, Serviço, Unidade, Quantidade, Preço
                  Unitário, Preço Total
                </li>
                <li>
                  <strong>Estrutura Hierárquica:</strong> O código do Item (ex: 1.0, 1.1, 1.1.1) define a hierarquia.
                  Itens com quantidade e unidade são identificados como serviços. Itens sem quantidade/unidade são agrupadores.
                </li>
                <li>
                  <strong>Validação:</strong> A soma dos itens deve bater com o Valor Global do Contrato (tolerância de
                  arredondamento de centavos).
                </li>
                <li>
                  <strong>Formato Aceito:</strong> Excel (.xlsx) ou CSV (.csv) com encoding UTF-8
                </li>
                <li>
                  <strong>Dica:</strong> Baixe o modelo acima para ver um exemplo de estrutura correta da planilha.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Upload de Arquivo
          </h2>
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-blue-600 transition-colors">
            <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">
              {file ? file.name : 'Arraste e solte o arquivo aqui ou clique para selecionar'}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              Selecionar Arquivo
            </label>
            {file && (
              <div className="mt-4">
                <p className="text-sm text-green-400">Arquivo selecionado: {file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tamanho: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Configuração da Versão */}
        {file && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Configuração da Versão</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nome da Versão <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nomeVersao}
                  onChange={(e) => setNomeVersao(e.target.value)}
                  placeholder="Ex: Versão Inicial, Revisão 01 - Aditivo"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Versão <span className="text-red-400">*</span>
                </label>
                <select
                  value={tipoVersao}
                  onChange={(e) => setTipoVersao(e.target.value as 'BASELINE' | 'REVISAO')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BASELINE">Base Line (Versão Inicial)</option>
                  <option value="REVISAO">Revisão</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {tipoVersao === 'BASELINE' 
                    ? 'Versão inicial do orçamento. Desativará outras versões ativas.'
                    : 'Nova revisão do orçamento. Mantém versões anteriores.'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Observações (Opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações sobre esta versão..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Barra de Progresso */}
        {isUploading && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{progressMessage || 'Processando...'}</span>
                <span className="text-sm font-bold text-blue-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {progress < 50 
                ? 'Enviando arquivo...' 
                : progress < 90 
                ? 'Processando dados da planilha...' 
                : 'Finalizando importação...'}
            </p>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-300 font-medium">Erro ao processar importação</p>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-4">
          <Link
            href={`/eng/orcamento/${params.construtoraId}/${params.obraId}/planilha-contratual`}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </Link>
          <button
            disabled={!file || !nomeVersao.trim() || isUploading}
            onClick={handleImportar}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Processar Importação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  async function handleDownloadModelo() {
    try {
      const response = await fetch('/api/orcamento/download-modelo');
      
      if (!response.ok) {
        throw new Error('Erro ao baixar modelo');
      }

      // Obter o blob do arquivo
      const blob = await response.blob();
      
      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelo-planilha-contratual.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao baixar modelo:', err);
      setError('Erro ao baixar modelo da planilha. Tente novamente.');
    }
  }

  async function handleImportar() {
    if (!file || !nomeVersao.trim()) {
      setError('Por favor, selecione um arquivo e informe o nome da versão');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Iniciando upload...');

    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('obraId', params.obraId);
      formData.append('nomeVersao', nomeVersao.trim());
      formData.append('tipoVersao', tipoVersao);
      if (observacoes.trim()) {
        formData.append('observacoes', observacoes.trim());
      }

      // Usar XMLHttpRequest para ter progresso real do upload
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let processInterval: NodeJS.Timeout | null = null;
        let uploadComplete = false;

        // Acompanhar progresso do upload (0-30%)
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && !uploadComplete) {
            const uploadProgress = Math.round((e.loaded / e.total) * 30);
            setProgress(uploadProgress);
            setProgressMessage(`Enviando arquivo... ${Math.round((e.loaded / e.total) * 100)}%`);
          }
        });

        // Quando o upload terminar, iniciar simulação de processamento
        xhr.upload.addEventListener('load', () => {
          uploadComplete = true;
          setProgress(30);
          setProgressMessage('Arquivo enviado. Processando dados...');
          
          // Simular progresso durante processamento (30-90%)
          let processProgress = 30;
          processInterval = setInterval(() => {
            processProgress += 2;
            if (processProgress < 90) {
              setProgress(processProgress);
              const percentProcess = Math.round(((processProgress - 30) / 60) * 100);
              setProgressMessage(`Processando dados da planilha... ${percentProcess}%`);
            } else {
              if (processInterval) {
                clearInterval(processInterval);
                processInterval = null;
              }
              setProgress(90);
              setProgressMessage('Finalizando importação...');
            }
          }, 150);
        });

        xhr.addEventListener('load', () => {
          // Limpar interval se ainda estiver rodando
          if (processInterval) {
            clearInterval(processInterval);
            processInterval = null;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (!data.success) {
                throw new Error(data.error || 'Erro ao importar planilha');
              }

              // Completar progresso
              setProgress(100);
              setProgressMessage('Importação concluída com sucesso!');

              // Aguardar um pouco para mostrar 100%
              setTimeout(() => {
                resolve();
                
                // Forçar refresh completo da página para garantir que os dados sejam atualizados
                window.location.href = `/eng/orcamento/${params.construtoraId}/${params.obraId}/planilha-contratual`;
              }, 800);
            } catch (parseError: any) {
              reject(new Error(parseError.message || 'Erro ao processar resposta do servidor'));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || 'Erro ao importar planilha'));
            } catch {
              reject(new Error(`Erro ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          if (processInterval) {
            clearInterval(processInterval);
          }
          reject(new Error('Erro de conexão. Verifique sua internet e tente novamente.'));
        });

        xhr.addEventListener('abort', () => {
          if (processInterval) {
            clearInterval(processInterval);
          }
          reject(new Error('Upload cancelado'));
        });

        // Iniciar requisição
        xhr.open('POST', '/api/orcamento/upload-planilha');
        xhr.send(formData);
      });
    } catch (err: any) {
      console.error('Erro ao importar:', err);
      setError(err.message || 'Erro ao importar planilha. Verifique o formato do arquivo e tente novamente.');
      setProgress(0);
      setProgressMessage('');
    } finally {
      setIsUploading(false);
    }
  }
}
