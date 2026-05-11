import {
  listarMedicoesParaAprovacao,
  listarOperacoesParaAprovacaoTecnica,
} from '@/app/actions/aprovacoes-eng';
import AprovacoesEngenhariaClient from './AprovacoesEngenhariaClient';

export default async function AprovacoesEngenhariaPage() {
  const [medicoes, operacoes] = await Promise.all([
    listarMedicoesParaAprovacao(),
    listarOperacoesParaAprovacaoTecnica(),
  ]);

  const medicoesSerialized = medicoes.map((m) => ({
    id: m.id,
    numero: m.numero,
    periodoInicio: m.periodoInicio.toISOString(),
    periodoFim: m.periodoFim.toISOString(),
    valorMedido: Number(m.valorMedido),
    valorAcumulado: Number(m.valorAcumulado),
    obraId: m.obra.id,
    obraCodigo: m.obra.codigo,
    obraNome: m.obra.nome,
    construtoraNome: m.obra.construtora.razaoSocial,
  }));

  const operacoesSerialized = operacoes.map((op) => ({
    id: op.id,
    codigo: op.codigo,
    tipo: op.tipo,
    construtoraId: op.construtoraId,
    construtoraNome: op.construtora.razaoSocial,
    obraId: op.obra.id,
    obraCodigo: op.obra.codigo,
    obraNome: op.obra.nome,
    dataSolicitacao: op.dataSolicitacao.toISOString(),
    valorTotalOrdens: Number(op.valorTotalOrdens),
    valorBruto: Number(op.valorBruto),
    quantidadeOrdens: op.ordens.length,
    credores: [
      ...new Set(op.ordens.map((o) => o.credor?.nome).filter((n): n is string => !!n)),
    ],
  }));

  return (
    <AprovacoesEngenhariaClient
      medicoes={medicoesSerialized}
      operacoes={operacoesSerialized}
    />
  );
}
