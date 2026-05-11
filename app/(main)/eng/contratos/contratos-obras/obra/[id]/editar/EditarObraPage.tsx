import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarObraForm from './EditarObraForm';

export default async function EditarObraPage({ params }: { params: { id: string } }) {
  // Buscar obra, construtoras, contratantes e fontes de recurso
  const [obra, construtoras, contratantes, fontesRecurso] = await Promise.all([
    db.obra.findUnique({
      where: { id: params.id },
      include: {
        construtora: true,
        contratante: true,
      },
    }),
    db.construtora.findMany({
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
        nomeFantasia: true,
      },
      orderBy: { razaoSocial: 'asc' },
    }),
    db.contratante.findMany({
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
      },
      orderBy: { razaoSocial: 'asc' },
    }),
    db.fonteRecurso.findMany({
      select: {
        id: true,
        codigo: true,
        nome: true,
        tipo: true,
        status: true,
      },
      where: {
        status: 'ATIVO',
      },
      orderBy: { nome: 'asc' },
    }),
  ]);

  if (!obra) {
    notFound();
  }

  // Preparar dados iniciais para o formulário
  const initialData = {
    id: obra.id,
    nome: obra.nome,
    construtoraId: obra.construtoraId,
    contratanteId: obra.contratanteId || '',
    endereco: obra.endereco || '',
    cidade: obra.cidade || '',
    estado: obra.estado || '',
    latitude: obra.latitude || '',
    longitude: obra.longitude || '',
    prazoMeses: obra.prazoMeses?.toString() || '',
    dataInicio: obra.dataInicio ? obra.dataInicio.toISOString().split('T')[0] : '',
    dataFim: obra.dataFim ? obra.dataFim.toISOString().split('T')[0] : '',
    prazoExecucaoMeses: obra.prazoExecucaoMeses?.toString() || '',
    dataInicioExecucao: obra.dataInicioExecucao ? obra.dataInicioExecucao.toISOString().split('T')[0] : '',
    dataFimExecucao: obra.dataFimExecucao ? obra.dataFimExecucao.toISOString().split('T')[0] : '',
    valorContrato: Number(obra.valorContrato).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    status: obra.status,
    cno: obra.cno || '',
    art: obra.art || '',
    alvara: obra.alvara || '',
    recursoFinanceiro: obra.recursoFinanceiro || '',
  };

  return (
    <EditarObraForm
      initialData={initialData}
      construtoras={construtoras}
      contratantes={contratantes}
      fontesRecurso={fontesRecurso}
    />
  );
}
