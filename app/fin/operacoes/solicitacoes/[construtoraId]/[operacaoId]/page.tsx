'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileText, Eye, PlayCircle, TrendingUp, QrCode, Banknote, Barcode, CreditCard, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';
import { getConstrutoraById, getObraById } from '@/lib/mock-data';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/format';

export default function VisualizarOperacaoPage({ params }: { params: { construtoraId: string; operacaoId: string } }) {
  const router = useRouter();
  const construtora = getConstrutoraById(params.construtoraId);

  // Dados mockados da operação - em produção viria de API/banco
  // Para operações "à performar" e "saldo performado", incluir ordens de pagamento
  const operacao = useMemo(() => {
    // Mock: buscar operação por ID
    const operacoesMock = [
      {
        id: 'OP-001',
        numero: '001/2024',
        dataSolicitacao: '2024-01-15',
        obraId: 'OBR-001',
        tipoOperacao: 'aPerformar' as const,
        credor: {
          id: 'CRED-001',
          nome: 'Fornecedor ABC Ltda',
          cnpj: '12.345.678/0001-90',
        },
        tipoDocumento: 'Nota Fiscal',
        numeroDocumento: 'NF-12345',
        valor: 5000.00,
        dataReferencia: '2024-02-15',
        projecaoEncargos: {
          dataReferencia: '2024-02-15',
          taxaMensal: 0.015,
          diasCorridos: 31,
          jurosProjetados: 77.50,
          taxasProjetadas: 25.00,
          totalEncargos: 102.50,
        },
        dataLiquidacaoPrevista: '2024-02-15',
        statusWorkflow: 'Em Aprovação',
        statusFinanceiro: 'Aberto',
        dataAprovacao: null,
        aprovador: null,
        dataPagamento: null,
        // Ordens de pagamento (apenas para operações "à performar" e "saldo performado")
        ordensPagamento: [
          {
            id: 'ORD-001',
            credorId: 'CRED-001',
            credorNome: 'Fornecedor ABC Ltda',
            tipoDocumento: 'Nota Fiscal',
            numeroDocumento: '1234',
            valorTotal: 5000.00,
            tipoPagamento: 'PIX',
            documentos: ['nf_1234.pdf'],
            apropriacoesOrcamentarias: [
              {
                subEtapaId: '1.1.1',
                subEtapaCode: '1.1.1',
                subEtapaDescription: 'Escavação e Reaterro Mecanizado',
                etapa: 'Movimentação de Terra',
                percentual: '100,00',
                valor: '5000,00',
              },
            ],
            apropriacoesFinanceiras: [
              {
                contaId: 'CONTA-001',
                contaNome: 'Despesas Operacionais - Materiais',
                percentual: '100,00',
                valor: '5000,00',
              },
            ],
          },
        ],
      },
      {
        id: 'OP-002',
        numero: '002/2024',
        dataSolicitacao: '2024-01-18',
        obraId: 'OBR-001',
        tipoOperacao: 'performada' as const,
        credor: {
          id: 'CRED-001',
          nome: 'Fornecedor ABC Ltda',
          cnpj: '12.345.678/0001-90',
        },
        tipoDocumento: 'Pedido de Compra',
        numeroDocumento: 'PC-67890',
        valor: 80000.00,
        projecaoEncargos: {
          dataReferencia: '2024-03-01',
          taxaMensal: 0.015,
          diasCorridos: 43,
          jurosProjetados: 1720.00,
          taxasProjetadas: 400.00,
          totalEncargos: 2120.00,
        },
        dataLiquidacaoPrevista: '2024-03-01',
        statusWorkflow: 'Aprovada',
        statusFinanceiro: 'Liquidado',
        dataAprovacao: '2024-01-20',
        aprovador: 'Eng. João Silva',
        dataPagamento: '2024-01-25',
        operacoesRecompradas: ['OP-003'],
      },
      {
        id: 'OP-003',
        numero: '003/2024',
        dataSolicitacao: '2024-01-20',
        obraId: 'OBR-001',
        tipoOperacao: 'aPerformar' as const,
        credor: {
          id: 'CRED-002',
          nome: 'Empreiteiro XYZ',
          cnpj: '98.765.432/0001-10',
        },
        tipoDocumento: 'Contrato',
        numeroDocumento: 'CT-11111',
        valor: 120000.00,
        projecaoEncargos: {
          dataReferencia: '2024-02-20',
          taxaMensal: 0.015,
          diasCorridos: 31,
          jurosProjetados: 1860.00,
          taxasProjetadas: 600.00,
          totalEncargos: 2460.00,
        },
        dataLiquidacaoPrevista: '2024-02-20',
        statusWorkflow: 'Em Edição',
        statusFinanceiro: 'Liquidado',
        dataAprovacao: null,
        aprovador: null,
        dataPagamento: null,
        recompradaPor: 'OP-002',
        ordensPagamento: [
          {
            id: 'ORD-004',
            credorId: 'CRED-002',
            credorNome: 'Empreiteiro XYZ',
            tipoDocumento: 'Contrato',
            numeroDocumento: 'CT-11111',
            valorTotal: 120000.00,
            tipoPagamento: 'Transferência',
            documentos: ['contrato_11111.pdf', 'anexos_11111.pdf'],
            apropriacoesOrcamentarias: [
              {
                subEtapaId: '1.2.1',
                subEtapaCode: '1.2.1',
                subEtapaDescription: 'Execução de Fundações',
                etapa: 'Fundações',
                percentual: '50,00',
                valor: '60000,00',
              },
              {
                subEtapaId: '2.1.1',
                subEtapaCode: '2.1.1',
                subEtapaDescription: 'Concreto estrutural Fck 30 MPa',
                etapa: 'Estrutura de Concreto Armado',
                percentual: '50,00',
                valor: '60000,00',
              },
            ],
            apropriacoesFinanceiras: [
              {
                contaId: 'CONTA-002',
                contaNome: 'Despesas Operacionais - Serviços',
                percentual: '100,00',
                valor: '120000,00',
              },
            ],
          },
        ],
      },
      {
        id: 'OP-004',
        numero: '004/2024',
        dataSolicitacao: '2024-01-22',
        obraId: 'OBR-001',
        tipoOperacao: 'aPerformar' as const,
        credor: {
          id: 'CRED-002',
          nome: 'Empreiteiro XYZ',
          cnpj: '98.765.432/0001-10',
        },
        tipoDocumento: 'Nota Fiscal',
        numeroDocumento: 'NF-22222',
        valor: 35000.00,
        projecaoEncargos: {
          dataReferencia: '2024-03-01',
          taxaMensal: 0.015,
          diasCorridos: 39,
          jurosProjetados: 682.50,
          taxasProjetadas: 175.00,
          totalEncargos: 857.50,
        },
        dataLiquidacaoPrevista: '2024-03-01',
        statusWorkflow: 'Finalizada',
        statusFinanceiro: 'Aberto',
        dataAprovacao: '2024-01-23',
        aprovador: 'Eng. Maria Santos',
        dataPagamento: null,
        ordensPagamento: [
          {
            id: 'ORD-005',
            credorId: 'CRED-002',
            credorNome: 'Empreiteiro XYZ',
            tipoDocumento: 'Nota Fiscal',
            numeroDocumento: 'NF-22222',
            valorTotal: 35000.00,
            tipoPagamento: 'PIX',
            documentos: ['nf_22222.pdf'],
            apropriacoesOrcamentarias: [
              {
                subEtapaId: '1.3.1',
                subEtapaCode: '1.3.1',
                subEtapaDescription: 'Drenos perimetrais com brita',
                etapa: 'Drenagem e Impermeabilização',
                percentual: '100,00',
                valor: '35000,00',
              },
            ],
            apropriacoesFinanceiras: [
              {
                contaId: 'CONTA-001',
                contaNome: 'Despesas Operacionais - Materiais',
                percentual: '60,00',
                valor: '21000,00',
              },
              {
                contaId: 'CONTA-002',
                contaNome: 'Despesas Operacionais - Serviços',
                percentual: '40,00',
                valor: '14000,00',
              },
            ],
          },
        ],
      },
      {
        id: 'OP-005',
        numero: '005/2024',
        dataSolicitacao: '2024-01-25',
        obraId: 'OBR-001',
        tipoOperacao: 'saldoPerformado' as const,
        credor: {
          id: 'CRED-002',
          nome: 'Empreiteiro XYZ',
          cnpj: '98.765.432/0001-10',
        },
        tipoDocumento: 'Título',
        numeroDocumento: 'TIT-33333',
        valor: 15000.00,
        statusWorkflow: 'Finalizada',
        statusFinanceiro: 'Aberto',
        dataAprovacao: '2024-01-26',
        aprovador: 'Eng. Maria Santos',
        dataPagamento: null,
        saldoDisponivel: 15000.00,
        // Ordens de pagamento (apenas para operações "à performar" e "saldo performado")
        ordensPagamento: [
          {
            id: 'ORD-002',
            credorId: 'CRED-003',
            credorNome: 'Fornecedor DEF Ltda',
            tipoDocumento: 'Ordem de Pagamento',
            numeroDocumento: 'OP-555',
            valorTotal: 8000.00,
            tipoPagamento: 'Transferência',
            documentos: ['ordem_pagamento_555.pdf'],
            apropriacoesOrcamentarias: [
              {
                subEtapaId: '1.2.1',
                subEtapaCode: '1.2.1',
                subEtapaDescription: 'Execução de Fundações',
                etapa: 'Fundações',
                percentual: '60,00',
                valor: '4800,00',
              },
              {
                subEtapaId: '1.2.2',
                subEtapaCode: '1.2.2',
                subEtapaDescription: 'Concretagem de Estrutura',
                etapa: 'Fundações',
                percentual: '40,00',
                valor: '3200,00',
              },
            ],
            apropriacoesFinanceiras: [
              {
                contaId: 'CONTA-002',
                contaNome: 'Despesas Operacionais - Serviços',
                percentual: '100,00',
                valor: '8000,00',
              },
            ],
          },
          {
            id: 'ORD-003',
            credorId: 'CRED-004',
            credorNome: 'Fornecedor GHI Ltda',
            tipoDocumento: 'Boleto',
            numeroDocumento: 'BOL-777',
            valorTotal: 7000.00,
            tipoPagamento: 'Boleto',
            documentos: ['boleto_777.pdf', 'comprovante_777.pdf'],
            apropriacoesOrcamentarias: [
              {
                subEtapaId: '1.1.2',
                subEtapaCode: '1.1.2',
                subEtapaDescription: 'Compactação de Solo',
                etapa: 'Movimentação de Terra',
                percentual: '100,00',
                valor: '7000,00',
              },
            ],
            apropriacoesFinanceiras: [
              {
                contaId: 'CONTA-001',
                contaNome: 'Despesas Operacionais - Materiais',
                percentual: '70,00',
                valor: '4900,00',
              },
              {
                contaId: 'CONTA-002',
                contaNome: 'Despesas Operacionais - Serviços',
                percentual: '30,00',
                valor: '2100,00',
              },
            ],
          },
        ],
      },
    ];
    return operacoesMock.find((op) => op.id === params.operacaoId) || null;
  }, [params.operacaoId]);

  const obra = operacao ? getObraById(operacao.obraId) : null;

  const getStatusWorkflowColor = (status: string) => {
    switch (status) {
      case 'Em Edição':
        return 'bg-blue-900 text-blue-400';
      case 'Finalizada':
        return 'bg-slate-700 text-slate-300';
      case 'Em Aprovação':
        return 'bg-amber-900 text-amber-400';
      case 'Aprovada':
        return 'bg-green-900 text-green-400';
      case 'Rejeitada':
        return 'bg-red-900 text-red-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getStatusFinanceiroColor = (status: string) => {
    switch (status) {
      case 'Aberto':
        return 'bg-orange-900 text-orange-400';
      case 'Liquidado':
        return 'bg-green-900 text-green-400';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getTipoOperacaoColor = (tipo: string) => {
    switch (tipo) {
      case 'aPerformar':
        return { bg: 'bg-blue-900', text: 'text-blue-400', border: 'border-blue-800' };
      case 'performada':
        return { bg: 'bg-purple-900', text: 'text-purple-400', border: 'border-purple-800' };
      case 'saldoPerformado':
        return { bg: 'bg-amber-900', text: 'text-amber-400', border: 'border-amber-800' };
      default:
        return { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-800' };
    }
  };

  const getTipoPagamentoIcon = (tipo: string) => {
    switch (tipo) {
      case 'PIX':
        return <QrCode className="w-4 h-4" />;
      case 'Transferência':
        return <Banknote className="w-4 h-4" />;
      case 'Boleto':
        return <Barcode className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  if (!operacao || !obra) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">Operação não encontrada</p>
          <Link
            href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const tipoOperacaoInfo = getTipoOperacaoColor(operacao.tipoOperacao);
  const totalOrdens = operacao.ordensPagamento?.reduce((sum, op) => sum + op.valorTotal, 0) || 0;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="flex items-center gap-3">
          <Building2 className={`w-8 h-8 ${tipoOperacaoInfo.text}`} />
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Operação {operacao.numero}</h1>
            <p className="text-slate-400">Obra: {obra.numeroContrato} - {obra.objeto.substring(0, 60)}...</p>
          </div>
        </div>
      </div>

      {/* Informações Gerais da Operação */}
      <div className={`bg-slate-900 border ${tipoOperacaoInfo.border} rounded-lg p-6 mb-6`}>
        <h2 className="text-xl font-bold text-white mb-4">Informações Gerais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Operação</label>
            <div className={`flex items-center gap-2 px-3 py-2 ${tipoOperacaoInfo.bg} rounded-lg`}>
              {operacao.tipoOperacao === 'aPerformar' ? (
                <PlayCircle className="w-4 h-4" />
              ) : operacao.tipoOperacao === 'saldoPerformado' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span className={`font-semibold ${tipoOperacaoInfo.text}`}>
                {operacao.tipoOperacao === 'aPerformar' ? 'À Performar' : operacao.tipoOperacao === 'saldoPerformado' ? 'Saldo Performado' : 'Performada'}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Número</label>
            <p className="text-white font-mono font-semibold">{operacao.numero}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Data de Solicitação</label>
            <p className="text-white">{formatDate(operacao.dataSolicitacao)}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Valor Total</label>
            <p className="text-green-400 font-mono font-semibold text-lg">{formatCurrency(operacao.valor)}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status Workflow</label>
            <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusWorkflowColor(operacao.statusWorkflow)}`}>
              {operacao.statusWorkflow}
            </span>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status Financeiro</label>
            <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getStatusFinanceiroColor(operacao.statusFinanceiro)}`}>
              {operacao.statusFinanceiro}
            </span>
          </div>
          {operacao.dataLiquidacaoPrevista && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data de Liquidação Prevista</label>
              <p className="text-white">{formatDate(operacao.dataLiquidacaoPrevista)}</p>
            </div>
          )}
          {operacao.projecaoEncargos && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">Total de Encargos Projetados</label>
              <p className="text-amber-400 font-mono font-semibold">{formatCurrency(operacao.projecaoEncargos.totalEncargos)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Credor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Credor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome</label>
            <p className="text-white font-medium">{operacao.credor.nome}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">CNPJ</label>
            <p className="text-slate-300 font-mono">{operacao.credor.cnpj}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Documento</label>
            <div>
              <p className="text-white">{operacao.tipoDocumento}</p>
              <p className="text-slate-300 font-mono text-sm">{operacao.numeroDocumento}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ordens de Pagamento (apenas para operações "à performar" e "saldo performado") */}
      {(operacao.tipoOperacao === 'aPerformar' || operacao.tipoOperacao === 'saldoPerformado') && operacao.ordensPagamento && operacao.ordensPagamento.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Ordens de Pagamento</h2>
          <div className="overflow-x-auto">
            <table className="table-engineering w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-900 border-b border-slate-700">Documento</th>
                  <th className="bg-slate-900 border-b border-slate-700">Credor</th>
                  <th className="bg-slate-900 border-b border-slate-700 number-cell">Valor</th>
                  <th className="bg-slate-900 border-b border-slate-700">Tipo de Pagamento</th>
                  <th className="bg-slate-900 border-b border-slate-700">Documentos Anexados</th>
                  <th className="bg-slate-900 border-b border-slate-700">Apropriação Orçamentária</th>
                  <th className="bg-slate-900 border-b border-slate-700">Apropriação Financeira</th>
                </tr>
              </thead>
              <tbody>
                {operacao.ordensPagamento.map((ordem) => {
                  // Formatar apropriações orçamentárias
                  const formatarApropriacoesOrcamentarias = () => {
                    if (!ordem.apropriacoesOrcamentarias || ordem.apropriacoesOrcamentarias.length === 0) {
                      return <span className="text-slate-400">-</span>;
                    }
                    return (
                      <div className="space-y-1">
                        {ordem.apropriacoesOrcamentarias.map((ap, index) => {
                          const percentualNum = parseFloat(ap.percentual?.replace(',', '.') || '0');
                          return (
                            <div key={index} className="text-xs">
                              <span className="text-slate-300">{ap.subEtapaDescription || ap.subEtapaCode || 'Serviço'}</span>
                              <span className="text-cyan-400 font-mono ml-1">
                                {formatPercent(percentualNum)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  // Formatar apropriações financeiras
                  const formatarApropriacoesFinanceiras = () => {
                    if (!ordem.apropriacoesFinanceiras || ordem.apropriacoesFinanceiras.length === 0) {
                      return <span className="text-slate-400">-</span>;
                    }
                    return (
                      <div className="space-y-1">
                        {ordem.apropriacoesFinanceiras.map((ap, index) => {
                          const percentualNum = parseFloat(ap.percentual?.replace(',', '.') || '0');
                          return (
                            <div key={index} className="text-xs">
                              <span className="text-slate-300">{ap.contaNome || 'Conta'}</span>
                              <span className="text-purple-400 font-mono ml-1">
                                {formatPercent(percentualNum)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  };

                  return (
                    <tr key={ordem.id} className="hover:bg-slate-800">
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${tipoOperacaoInfo.text}`} />
                          <div>
                            <p className="text-white font-medium">{ordem.tipoDocumento}</p>
                            <p className="text-xs text-slate-400 font-mono">{ordem.numeroDocumento}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-slate-300">{ordem.credorNome}</p>
                      </td>
                      <td className="number-cell">
                        <p className="text-green-400 font-mono font-semibold">{formatCurrency(ordem.valorTotal)}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getTipoPagamentoIcon(ordem.tipoPagamento)}
                          <span className="text-slate-300">{ordem.tipoPagamento}</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-slate-300">
                          {ordem.documentos.length} arquivo(s)
                        </p>
                      </td>
                      <td>
                        {formatarApropriacoesOrcamentarias()}
                      </td>
                      <td>
                        {formatarApropriacoesFinanceiras()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 border-t-2 border-slate-700">
                  <td colSpan={2} className="text-right py-3 px-4">
                    <span className="text-white font-semibold">Total das Ordens de Pagamento:</span>
                  </td>
                  <td className="number-cell py-3 px-4">
                    <span className="text-green-400 font-mono font-bold text-lg">{formatCurrency(totalOrdens)}</span>
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Informações de Aprovação */}
      {operacao.dataAprovacao && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Aprovação</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data de Aprovação</label>
              <p className="text-white">{formatDate(operacao.dataAprovacao)}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Aprovador</label>
              <p className="text-white">{operacao.aprovador}</p>
            </div>
          </div>
        </div>
      )}

      {/* Botão Voltar */}
      <div className="flex items-center justify-end">
        <Link
          href={`/fin/operacoes/solicitacoes/${params.construtoraId}`}
          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
