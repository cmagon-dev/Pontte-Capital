import { listarMedicoesParaAprovacao } from '@/app/actions/aprovacoes-eng';
import AprovacoesEngenhariaClient from './AprovacoesEngenhariaClient';

export default async function AprovacoesEngenhariaPage() {
  const medicoes = await listarMedicoesParaAprovacao();

  const serialized = medicoes.map((m) => ({
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

  return <AprovacoesEngenhariaClient medicoes={serialized} />;
}
