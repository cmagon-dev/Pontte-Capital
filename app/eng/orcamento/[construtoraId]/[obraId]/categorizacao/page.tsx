import { db } from "@/lib/db";
import { listarVersoesCategorizacao, buscarCategorizacao } from "@/app/actions/orcamento";
import CategorizacaoContent from "./CategorizacaoContent";

interface PageProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
}

export default async function CategorizacaoPage({ params }: PageProps) {
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

  // 2. Buscar Versão Ativa da Planilha Contratual e Lista de Versões de Categorização
  const versaoContratualAtiva = await db.versaoOrcamento.findFirst({
    where: {
      obraId: params.obraId,
      status: 'ATIVA',
      fase: 'PLANILHA_CONTRATUAL',
    },
  });

  // Buscar versões de categorização usando o novo modelo
  const versoesCategorizacao = await listarVersoesCategorizacao(params.obraId);
  
  // Buscar versão ativa de categorização
  const versaoAtivaCategorizacao = versoesCategorizacao.find((v: typeof versoesCategorizacao[0]) => v.status === 'ATIVA') || null;

  // 3. Buscar categorização da versão ativa
  // Se houver versão ativa, buscar por ela. Caso contrário, buscar pela obra (pode retornar null se não houver versão vinculada à versão contratual atual)
  const categorizacao = versaoAtivaCategorizacao 
    ? await buscarCategorizacao(params.obraId, versaoAtivaCategorizacao.id)
    : await buscarCategorizacao(params.obraId);

  // 4. Transformar dados do Banco (createdAt) para o formato do Componente (dataCriacao)
  // Formatar nome da versão com número de revisão se for revisão
  const versoesFormatadas = versoesCategorizacao.map((versao: typeof versoesCategorizacao[0]) => {
    let nomeFormatado = versao.nome;
    if (versao.numeroRevisao > 0) {
      nomeFormatado = `${versao.nome} - Revisão ${versao.numeroRevisao.toString().padStart(2, '0')}`;
    }
    
    return {
      id: versao.id,
      nome: nomeFormatado,
      tipo: versao.tipo as "BASELINE" | "REVISAO",
      status: versao.status as "ATIVA" | "OBSOLETA",
      numero: versao.numero,
      dataCriacao: versao.createdAt.toISOString(),
      dataAtualizacao: versao.updatedAt.toISOString(),
      observacoes: versao.observacoes || null,
    };
  });

  // 5. Preparar dados de categorização
  const categorizacaoData = categorizacao.success && categorizacao.versaoId ? {
    versaoId: categorizacao.versaoId,
    versaoNumero: categorizacao.versaoNumero,
    versaoNome: categorizacao.versaoNumeroRevisao && categorizacao.versaoNumeroRevisao > 0
      ? `${categorizacao.versaoNome} - Revisão ${categorizacao.versaoNumeroRevisao.toString().padStart(2, '0')}`
      : categorizacao.versaoNome,
    versaoUpdatedAt: categorizacao.versaoUpdatedAt,
    itens: categorizacao.itens as any, // Cast necessário pois o tipo inferido não inclui 'ordem' explicitamente
  } : null;

  return (
    <CategorizacaoContent
      params={params}
      obra={{
        id: obra.id,
        codigo: obra.codigo || 'S/C',
        nome: obra.nome,
        construtora: {
          razaoSocial: obra.construtora?.razaoSocial || 'Construtora',
        },
      }}
      versaoAtiva={versaoAtivaCategorizacao as any}
      versaoContratualAtiva={versaoContratualAtiva}
      versoes={versoesFormatadas}
      categorizacao={categorizacaoData}
    />
  );
}
