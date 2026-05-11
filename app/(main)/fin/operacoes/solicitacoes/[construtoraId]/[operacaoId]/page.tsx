import { notFound } from 'next/navigation';
import { buscarOperacaoPorId } from '@/app/actions/operacoes';
import OperacaoDetalhesClient from './OperacaoDetalhesClient';

export default async function VisualizarOperacaoPage({
  params,
}: {
  params: { construtoraId: string; operacaoId: string };
}) {
  const operacaoRaw = await buscarOperacaoPorId(params.operacaoId);
  if (!operacaoRaw) return notFound();

  // Serializa para remover tipos não-JSON (Decimal, Date → string/number)
  const operacao = JSON.parse(JSON.stringify(operacaoRaw));

  return <OperacaoDetalhesClient operacao={operacao} construtoraId={params.construtoraId} />;
}
