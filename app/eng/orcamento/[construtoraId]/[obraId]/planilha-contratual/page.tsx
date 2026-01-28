import { db } from "@/lib/db";
import { buscarVersaoAtivaOrcamento, listarVersoesOrcamento } from "@/app/actions/orcamento";
import PlanilhaContratualContent from "./PlanilhaContratualContent";

interface PageProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
}

export default async function PlanilhaContratualPage({ params }: PageProps) {
  // 1. Buscar dados da Obra
  const obra = await db.obra.findUnique({
    where: { id: params.obraId },
    select: {
      id: true,
      codigo: true,
      nome: true,
      construtora: {
        select: {
          razaoSocial: true,
        },
      },
    },
  });

  if (!obra) {
    return (
      <div className="p-8 text-center text-slate-400">
        Obra não encontrada. Verifique o ID e tente novamente.
      </div>
    );
  }

  // 2. Buscar Versão Ativa e Lista de Versões do Banco
  const versaoAtiva = await buscarVersaoAtivaOrcamento(params.obraId);
  const versoesDoBanco = await listarVersoesOrcamento(params.obraId);

  // 3. Transformar dados do Banco (createdAt) para o formato do Componente (dataCriacao)
  // Isso resolve o erro de tipagem "missing properties"
  const versoesFormatadas = versoesDoBanco.map((versao: typeof versoesDoBanco[0]) => ({
    id: versao.id,
    nome: versao.nome,
    tipo: versao.tipo as "BASELINE" | "REVISAO", // Garante o tipo exato
    status: versao.status as "ATIVA" | "OBSOLETA", // Garante o tipo exato
    numero: versao.numero,
    // Converte Date para String ISO e renomeia os campos
    dataCriacao: versao.createdAt.toISOString(),
    dataAtualizacao: versao.updatedAt.toISOString(),
  }));

  return (
    <PlanilhaContratualContent
      params={params}
      obra={{
        id: obra.id,
        codigo: obra.codigo || 'S/C',
        nome: obra.nome,
        construtora: {
          razaoSocial: obra.construtora?.razaoSocial || 'Construtora',
        },
      }}
      // Usamos 'as any' aqui apenas para o versaoAtiva, pois o componente espera
      // tipos estritos de 'ordem' que o Prisma pode não inferir automaticamente na query simples
      versaoAtiva={versaoAtiva as any} 
      
      // Passamos a lista formatada que agora tem 'dataCriacao' e 'dataAtualizacao'
      versoes={versoesFormatadas}
    />
  );
}