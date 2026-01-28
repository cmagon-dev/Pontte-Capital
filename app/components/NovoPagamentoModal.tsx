'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Upload, FileText, Users, Plus as PlusIcon, ExternalLink, BarChart3, FileSpreadsheet, DollarSign, Trash2, CreditCard, Banknote, QrCode, Barcode } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { getCategorizacaoByObraId, getObraById } from '@/lib/mock-data';
import { isSubEtapa } from '@/lib/types/operations';
import SubEtapaTreeSelect from '@/app/components/SubEtapaTreeSelect';
import { transformarCategorizacaoParaEAP } from '@/lib/utils/categorizacao-para-eap';

interface ApropriacaoOrcamentaria {
  subEtapaId: string;
  subEtapaCode: string;
  subEtapaDescription: string;
  etapa: string;
  tipoValor: 'percentual' | 'valor';
  percentual: string;
  valor: string;
  percentualComprado?: string;
}

interface ApropriacaoFinanceira {
  contaId: string;
  contaNome: string;
  tipoValor: 'percentual' | 'valor';
  percentual: string;
  valor: string;
}

interface NovoPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: string;
  construtoraId: string;
  onConfirm: (pagamento: {
    credorId: string;
    documentos: File[];
    tipoDocumento: string;
    numeroDocumento: string;
    valorTotal: number;
    tipoPagamento: string;
    codigoBarras?: string;
    apropriacoesOrcamentarias: ApropriacaoOrcamentaria[];
    apropriacoesFinanceiras: ApropriacaoFinanceira[];
  }) => void;
}

export default function NovoPagamentoModal({
  isOpen,
  onClose,
  obraId,
  construtoraId,
  onConfirm,
}: NovoPagamentoModalProps) {
  const obra = getObraById(obraId);
  
  // Credores mockados
  const credores = [
    {
      id: 'CRED-001',
      nome: 'Fornecedor ABC Ltda',
      cnpj: '12.345.678/0001-90',
      chavePix: '12.345.678/0001-90',
      tipoChavePix: 'CPF/CNPJ',
      contaBancaria: {
        banco: '001',
        bancoNome: 'Banco do Brasil',
        agencia: '1234-5',
        conta: '12345-6',
        tipo: 'Corrente',
        titular: 'Fornecedor ABC Ltda',
        cpfCnpjTitular: '12.345.678/0001-90',
      },
    },
    {
      id: 'CRED-002',
      nome: 'Empreiteiro XYZ',
      cnpj: '98.765.432/0001-10',
      chavePix: 'empreiteiro@xyz.com',
      tipoChavePix: 'Email',
      contaBancaria: {
        banco: '341',
        bancoNome: 'Itaú Unibanco',
        agencia: '5678',
        conta: '98765-4',
        tipo: 'Corrente',
        titular: 'Empreiteiro XYZ',
        cpfCnpjTitular: '98.765.432/0001-10',
      },
    },
  ];

  // Plano de contas mockado
  const planoContas = [
    { id: 'PC-001', codigo: '1.1.01', nome: 'Despesas Operacionais - Materiais' },
    { id: 'PC-002', codigo: '1.1.02', nome: 'Despesas Operacionais - Mão de Obra' },
    { id: 'PC-003', codigo: '1.1.03', nome: 'Despesas Operacionais - Equipamentos' },
    { id: 'PC-004', codigo: '1.1.04', nome: 'Despesas Operacionais - Terceirizados' },
    { id: 'PC-005', codigo: '1.2.01', nome: 'Despesas Administrativas' },
  ];

  const [credorId, setCredorId] = useState<string>('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('Nota Fiscal');
  const [numeroDocumento, setNumeroDocumento] = useState<string>('');
  const [valorTotal, setValorTotal] = useState<string>('');
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [tipoPagamento, setTipoPagamento] = useState<string>('Transferência');
  const [codigoBarras, setCodigoBarras] = useState<string>('');

  const [apropriacoesOrcamentarias, setApropriacoesOrcamentarias] = useState<ApropriacaoOrcamentaria[]>([
    { subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '', tipoValor: 'percentual', percentual: '', valor: '', percentualComprado: '' },
  ]);

  const [apropriacoesFinanceiras, setApropriacoesFinanceiras] = useState<ApropriacaoFinanceira[]>([
    { contaId: '', contaNome: '', tipoValor: 'percentual', percentual: '', valor: '' },
  ]);

  // Obter credor selecionado
  const credorSelecionado = useMemo(() => {
    return credores.find((c) => c.id === credorId);
  }, [credorId]);

  // Resetar estado quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setCredorId('');
      setTipoDocumento('Nota Fiscal');
      setNumeroDocumento('');
      setValorTotal('');
      setDocumentos([]);
      setTipoPagamento('Transferência');
      setCodigoBarras('');
      setApropriacoesOrcamentarias([
        { subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '', tipoValor: 'percentual', percentual: '', valor: '', percentualComprado: '' },
      ]);
      setApropriacoesFinanceiras([
        { contaId: '', contaNome: '', tipoValor: 'percentual', percentual: '', valor: '' },
      ]);
    }
  }, [isOpen]);

  // Usar a mesma base de dados da Categorização (que alimenta a EAP Gerencial)
  // Transformada para estrutura de 3 níveis (Etapa → Subetapa → Serviço)
  const categorizacaoItens = getCategorizacaoByObraId(obraId);
  const visaoGerencialCompleta = transformarCategorizacaoParaEAP(categorizacaoItens);

  // Calcular valor total numérico
  const valorTotalNumerico = useMemo(() => {
    return parseFloat(valorTotal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }, [valorTotal]);

  // Calcular saldo disponível para apropriações orçamentárias
  const saldoOrcamentario = useMemo(() => {
    const totalApropriado = apropriacoesOrcamentarias.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') {
        return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      } else {
        return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
      }
    }, 0);
    return valorTotalNumerico - totalApropriado;
  }, [apropriacoesOrcamentarias, valorTotalNumerico]);

  // Calcular saldo disponível para apropriações financeiras
  const saldoFinanceiro = useMemo(() => {
    const totalApropriado = apropriacoesFinanceiras.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') {
        return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      } else {
        return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
      }
    }, 0);
    return valorTotalNumerico - totalApropriado;
  }, [apropriacoesFinanceiras, valorTotalNumerico]);

  // Função mock para obter %Comprado acumulado por serviço (em produção viria do banco de dados)
  const getPercentualCompradoAcumulado = useMemo(() => {
    // Em produção, isso viria de uma consulta ao banco de dados
    // Por enquanto, retornamos um mapa mock com alguns valores de exemplo
    const mockAcumulados = new Map<string, number>();
    // Exemplo: alguns serviços já têm %Comprado acumulado
    // mockAcumulados.set('1.1.1', 45.5); // 45.5% comprado
    // mockAcumulados.set('1.2.1', 100); // 100% comprado (bloqueado)
    return (servicoId: string): number => {
      return mockAcumulados.get(servicoId) || 0;
    };
  }, []);

  // Função para verificar se um serviço está desabilitado (100% comprado)
  const isServicoComprado = useMemo(() => {
    return (servicoId: string): boolean => {
      const acumulado = getPercentualCompradoAcumulado(servicoId);
      return acumulado >= 100;
    };
  }, [getPercentualCompradoAcumulado]);

  const addApropriacaoOrcamentaria = () => {
    setApropriacoesOrcamentarias([
      ...apropriacoesOrcamentarias,
      { subEtapaId: '', subEtapaCode: '', subEtapaDescription: '', etapa: '', tipoValor: 'percentual', percentual: '', valor: '', percentualComprado: '' },
    ]);
  };

  const removeApropriacaoOrcamentaria = (index: number) => {
    setApropriacoesOrcamentarias(apropriacoesOrcamentarias.filter((_, i) => i !== index));
  };

  const updateApropriacaoOrcamentaria = (index: number, field: keyof ApropriacaoOrcamentaria, value: string | 'percentual' | 'valor') => {
    const newApropriacoes = [...apropriacoesOrcamentarias];
    if (field === 'subEtapaId') {
      const item = visaoGerencialCompleta.find((i) => i.id === value);
      if (item && isSubEtapa(item)) {
        const percentualCompradoAcumulado = getPercentualCompradoAcumulado(value as string);
        newApropriacoes[index] = {
          ...newApropriacoes[index],
          subEtapaId: value as string,
          subEtapaCode: item.numeroHierarquico,
          subEtapaDescription: item.descricao,
          etapa: item.etapa || '',
          percentualComprado: percentualCompradoAcumulado > 0 ? percentualCompradoAcumulado.toFixed(2).replace('.', ',') : '',
        };
      }
    } else if (field === 'tipoValor') {
      newApropriacoes[index] = { ...newApropriacoes[index], tipoValor: value as 'percentual' | 'valor' };
    } else {
      newApropriacoes[index] = { ...newApropriacoes[index], [field]: value as string };
    }
    setApropriacoesOrcamentarias(newApropriacoes);
  };

  const addApropriacaoFinanceira = () => {
    setApropriacoesFinanceiras([
      ...apropriacoesFinanceiras,
      { contaId: '', contaNome: '', tipoValor: 'percentual', percentual: '', valor: '' },
    ]);
  };

  const removeApropriacaoFinanceira = (index: number) => {
    setApropriacoesFinanceiras(apropriacoesFinanceiras.filter((_, i) => i !== index));
  };

  const updateApropriacaoFinanceira = (index: number, field: keyof ApropriacaoFinanceira, value: string | 'percentual' | 'valor') => {
    const newApropriacoes = [...apropriacoesFinanceiras];
    if (field === 'contaId') {
      const conta = planoContas.find((c) => c.id === value);
      newApropriacoes[index] = {
        ...newApropriacoes[index],
        contaId: value as string,
        contaNome: conta?.nome || '',
      };
    } else if (field === 'tipoValor') {
      newApropriacoes[index] = { ...newApropriacoes[index], tipoValor: value as 'percentual' | 'valor' };
    } else {
      newApropriacoes[index] = { ...newApropriacoes[index], [field]: value as string };
    }
    setApropriacoesFinanceiras(newApropriacoes);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novosArquivos = Array.from(e.target.files);
      setDocumentos((prev) => [...prev, ...novosArquivos]);
      // Resetar o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  const removerDocumento = (index: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!credorId) {
      alert('Selecione um credor');
      return;
    }
    if (documentos.length === 0) {
      alert('Anexe pelo menos um documento');
      return;
    }
    if (!numeroDocumento) {
      alert('Informe o número do documento');
      return;
    }
    if (valorTotalNumerico <= 0) {
      alert('Informe um valor total válido');
      return;
    }

    // Validar apropriações
    const totalOrcamentario = apropriacoesOrcamentarias.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') {
        return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      } else {
        return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
      }
    }, 0);

    const totalFinanceiro = apropriacoesFinanceiras.reduce((sum, ap) => {
      if (ap.tipoValor === 'valor') {
        return sum + (parseFloat(ap.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0);
      } else {
        return sum + (valorTotalNumerico * (parseFloat(ap.percentual.replace(',', '.')) || 0) / 100);
      }
    }, 0);

    if (Math.abs(totalOrcamentario - valorTotalNumerico) > 0.01) {
      alert(`A soma das apropriações orçamentárias (${formatCurrency(totalOrcamentario)}) deve ser igual ao valor total (${formatCurrency(valorTotalNumerico)})`);
      return;
    }

    if (Math.abs(totalFinanceiro - valorTotalNumerico) > 0.01) {
      alert(`A soma das apropriações financeiras (${formatCurrency(totalFinanceiro)}) deve ser igual ao valor total (${formatCurrency(valorTotalNumerico)})`);
      return;
    }

    onConfirm({
      credorId,
      documentos,
      tipoDocumento,
      numeroDocumento,
      valorTotal: valorTotalNumerico,
      tipoPagamento,
      codigoBarras: tipoPagamento === 'Boleto' || tipoPagamento === 'Outros' ? codigoBarras : undefined,
      apropriacoesOrcamentarias,
      apropriacoesFinanceiras,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Novo Pagamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Obra Info */}
          <div className="bg-blue-950/20 border border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-400">
              <strong>Obra:</strong> {obra.numeroContrato} - {obra.objeto.substring(0, 80)}...
            </p>
          </div>

          {/* Credor */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Credor *
              </h3>
              <Link
                href={`/fin/cadastros/${construtoraId}/credores/novo`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Novo Credor
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <select
              value={credorId}
              onChange={(e) => setCredorId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Selecione o credor...</option>
              {credores.map((credor) => (
                <option key={credor.id} value={credor.id}>
                  {credor.nome} - {credor.cnpj}
                </option>
              ))}
            </select>
          </div>

          {/* Documento e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tipo de Documento *</label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Nota Fiscal">Nota Fiscal</option>
                <option value="Pedido de Compra">Pedido de Compra</option>
                <option value="Contrato">Contrato</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Número do Documento *</label>
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="Ex: NF-12345"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor Total *
              </label>
              <input
                type="text"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Tipo de Pagamento */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tipo de Pagamento *
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {(['Transferência', 'PIX', 'Boleto', 'Outros'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoPagamento(tipo)}
                  className={`p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                    tipoPagamento === tipo
                      ? 'border-blue-500 bg-blue-950/50 text-blue-400'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  {tipo === 'Transferência' && <Banknote className="w-5 h-5" />}
                  {tipo === 'PIX' && <QrCode className="w-5 h-5" />}
                  {tipo === 'Boleto' && <Barcode className="w-5 h-5" />}
                  {tipo === 'Outros' && <FileText className="w-5 h-5" />}
                  <span className="font-semibold">{tipo}</span>
                </button>
              ))}
            </div>

            {/* Dados do Credor (PIX/Transferência) */}
            {(tipoPagamento === 'PIX' || tipoPagamento === 'Transferência') && credorSelecionado && (
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-3">
                {tipoPagamento === 'PIX' && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Chave PIX *</label>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{credorSelecionado.chavePix}</p>
                        <p className="text-xs text-slate-400">Tipo: {credorSelecionado.tipoChavePix}</p>
                      </div>
                    </div>
                  </div>
                )}
                {tipoPagamento === 'Transferência' && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Dados Bancários *</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{credorSelecionado.contaBancaria.bancoNome} - {credorSelecionado.contaBancaria.banco}</p>
                          <p className="text-xs text-slate-400">Ag: {credorSelecionado.contaBancaria.agencia} | Conta: {credorSelecionado.contaBancaria.conta} ({credorSelecionado.contaBancaria.tipo})</p>
                          <p className="text-xs text-slate-400">Titular: {credorSelecionado.contaBancaria.titular}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Código de Barras (Boleto/Outros) */}
            {(tipoPagamento === 'Boleto' || tipoPagamento === 'Outros') && (
              <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Código de Barras *</label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    placeholder={tipoPagamento === 'Boleto' ? 'Digite o código de barras do boleto' : 'Digite o código de barras ou referência'}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {tipoPagamento === 'Boleto' 
                    ? 'Anexe o boleto na seção de documentos abaixo'
                    : 'Anexe o documento relacionado na seção de documentos abaixo'}
                </p>
              </div>
            )}
          </div>

          {/* Upload Documentos */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Anexar Documentos *
            </h3>
            
            {/* Lista de arquivos anexados */}
            {documentos.length > 0 && (
              <div className="mb-4 space-y-2">
                {documentos.map((arquivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-700 border border-slate-600 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{arquivo.name}</p>
                        <p className="text-sm text-slate-400">{(arquivo.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerDocumento(index)}
                      className="p-1.5 hover:bg-slate-600 rounded text-red-400 transition-colors flex-shrink-0 ml-2"
                      title="Remover arquivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Área de upload */}
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-modal"
                multiple
                required={documentos.length === 0}
              />
              <label
                htmlFor="file-upload-modal"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                {documentos.length === 0 ? 'Selecionar Arquivo(s)' : 'Adicionar Mais Arquivos'}
              </label>
              <p className="text-xs text-slate-500 mt-2">Você pode selecionar múltiplos arquivos</p>
            </div>
          </div>

          {/* Apropriação Orçamentária */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Apropriação Orçamentária (EAP Gerencial - Serviço) *
              </h3>
              <button
                type="button"
                onClick={addApropriacaoOrcamentaria}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {apropriacoesOrcamentarias.map((apropriacao, index) => (
                <div key={index} className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Serviço *</label>
                      <SubEtapaTreeSelect
                        items={visaoGerencialCompleta}
                        selectedSubEtapaId={apropriacao.subEtapaId}
                        onSelect={(itemId) => updateApropriacaoOrcamentaria(index, 'subEtapaId', itemId)}
                        placeholder="Selecione um SERVIÇO..."
                        isItemDisabled={isServicoComprado}
                        getPercentualCompradoAcumulado={getPercentualCompradoAcumulado}
                      />
                      {apropriacao.subEtapaDescription && (
                        <p className="text-xs text-slate-500 mt-1">{apropriacao.subEtapaDescription}</p>
                      )}
                      {apropriacao.subEtapaId && (() => {
                        const acumulado = getPercentualCompradoAcumulado(apropriacao.subEtapaId);
                        return acumulado > 0 ? (
                          <p className="text-xs text-cyan-400 mt-1">
                            %Comprado Acumulado: {acumulado.toFixed(2).replace('.', ',')}%
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Tipo de Valor</label>
                        <select
                          value={apropriacao.tipoValor}
                          onChange={(e) => updateApropriacaoOrcamentaria(index, 'tipoValor', e.target.value)}
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="percentual">Percentual (%)</option>
                          <option value="valor">Valor (R$)</option>
                        </select>
                      </div>
                      {apropriacao.tipoValor === 'percentual' ? (
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Percentual (%)</label>
                          <input
                            type="text"
                            value={apropriacao.percentual}
                            onChange={(e) => updateApropriacaoOrcamentaria(index, 'percentual', e.target.value)}
                            placeholder="0,00"
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Valor: {formatCurrency(valorTotalNumerico * (parseFloat(apropriacao.percentual.replace(',', '.')) || 0) / 100)}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Valor (R$)</label>
                          <input
                            type="text"
                            value={apropriacao.valor}
                            onChange={(e) => updateApropriacaoOrcamentaria(index, 'valor', e.target.value)}
                            placeholder="0,00"
                            className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                          {valorTotalNumerico > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              Percentual: {((parseFloat(apropriacao.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0) / valorTotalNumerico * 100).toFixed(2)}%
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">%Comprado *</label>
                        <input
                          type="text"
                          value={apropriacao.percentualComprado}
                          onChange={(e) => updateApropriacaoOrcamentaria(index, 'percentualComprado', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Informe o %Comprado desta apropriação</p>
                      </div>
                      <div className="flex items-end">
                        {apropriacoesOrcamentarias.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeApropriacaoOrcamentaria(index)}
                            className="w-full p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Apropriado:</span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${Math.abs(saldoOrcamentario) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(valorTotalNumerico - saldoOrcamentario)}
                  </span>
                  <span className="text-sm text-slate-400">
                    Saldo: <span className={saldoOrcamentario >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(saldoOrcamentario)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Apropriação Financeira */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Apropriação Financeira (Plano de Contas) *
              </h3>
              <button
                type="button"
                onClick={addApropriacaoFinanceira}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {apropriacoesFinanceiras.map((apropriacao, index) => (
                <div key={index} className="bg-slate-700 border border-slate-600 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Conta do Plano de Contas *</label>
                      <select
                        value={apropriacao.contaId}
                        onChange={(e) => updateApropriacaoFinanceira(index, 'contaId', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">Selecione a conta...</option>
                        {planoContas.map((conta) => (
                          <option key={conta.id} value={conta.id}>
                            {conta.codigo} - {conta.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tipo de Valor</label>
                      <select
                        value={apropriacao.tipoValor}
                        onChange={(e) => updateApropriacaoFinanceira(index, 'tipoValor', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="percentual">Percentual (%)</option>
                        <option value="valor">Valor (R$)</option>
                      </select>
                    </div>
                    {apropriacao.tipoValor === 'percentual' ? (
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Percentual (%)</label>
                        <input
                          type="text"
                          value={apropriacao.percentual}
                          onChange={(e) => updateApropriacaoFinanceira(index, 'percentual', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Valor: {formatCurrency(valorTotalNumerico * (parseFloat(apropriacao.percentual.replace(',', '.')) || 0) / 100)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">Valor (R$)</label>
                        <input
                          type="text"
                          value={apropriacao.valor}
                          onChange={(e) => updateApropriacaoFinanceira(index, 'valor', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                        {valorTotalNumerico > 0 && (
                          <p className="text-xs text-slate-500 mt-1">
                            Percentual: {((parseFloat(apropriacao.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0) / valorTotalNumerico * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-end">
                      {apropriacoesFinanceiras.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApropriacaoFinanceira(index)}
                          className="w-full p-2 bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900 transition-colors"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Apropriado:</span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${Math.abs(saldoFinanceiro) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(valorTotalNumerico - saldoFinanceiro)}
                  </span>
                  <span className="text-sm text-slate-400">
                    Saldo: <span className={saldoFinanceiro >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(saldoFinanceiro)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Adicionar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}