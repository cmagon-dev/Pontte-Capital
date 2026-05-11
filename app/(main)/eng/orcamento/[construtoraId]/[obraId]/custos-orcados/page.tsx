import { db } from "@/lib/db";
import { buscarVersaoAtivaOrcamento, listarVersoesCustoOrcado, buscarCustosOrcados } from "@/app/actions/orcamento";
import CustosOrcadosContent from "./CustosOrcadosContent";

interface PageProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
}

export default async function CustosOrcadosPage({ params }: PageProps) {
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

  // 2. Buscar Versão Ativa da Planilha Contratual e Lista de Versões de Custos Orçados
  const versaoContratualAtiva = await db.versaoOrcamento.findFirst({
    where: {
      obraId: params.obraId,
      status: 'ATIVA',
      fase: 'PLANILHA_CONTRATUAL',
    },
  });

  // Buscar versões de custos orçados usando o novo modelo
  const versoesCustos = await listarVersoesCustoOrcado(params.obraId);
  
  // Buscar versão ativa de custos orçados
  const versaoAtivaCustos = versoesCustos.find((v: typeof versoesCustos[0]) => v.status === 'ATIVA') || null;

  // 3. Buscar custos orçados da versão ativa
  // Se houver versão ativa, buscar por ela. Caso contrário, buscar pela obra (pode retornar null se não houver versão vinculada à versão contratual atual)
  const custosOrcados = versaoAtivaCustos 
    ? await buscarCustosOrcados(params.obraId, versaoAtivaCustos.id)
    : await buscarCustosOrcados(params.obraId);

  // 4. Transformar dados do Banco (createdAt) para o formato do Componente (dataCriacao)
  // Formatar nome da versão com número de revisão se for revisão
  const versoesFormatadas = versoesCustos.map((versao: typeof versoesCustos[0]) => {
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

  // 5. Preparar dados de custos orçados
  const custosOrcadosData = custosOrcados.success && custosOrcados.versaoId ? {
    versaoId: custosOrcados.versaoId,
    versaoNumero: custosOrcados.versaoNumero,
    versaoNome: custosOrcados.versaoNumeroRevisao && custosOrcados.versaoNumeroRevisao > 0
      ? `${custosOrcados.versaoNome} - Revisão ${custosOrcados.versaoNumeroRevisao.toString().padStart(2, '0')}`
      : custosOrcados.versaoNome,
    versaoUpdatedAt: custosOrcados.versaoUpdatedAt,
    custos: custosOrcados.custos as any, // Cast necessário pois o tipo inferido não inclui 'ordem' explicitamente
  } : null;

  return (
    <CustosOrcadosContent
      params={params}
      obra={{
        id: obra.id,
        codigo: obra.codigo || 'S/C',
        nome: obra.nome,
        construtora: {
          razaoSocial: obra.construtora?.razaoSocial || 'Construtora',
        },
      }}
      versaoAtiva={versaoAtivaCustos as any}
      versaoContratualAtiva={versaoContratualAtiva}
      versoes={versoesFormatadas}
      custosOrcados={custosOrcadosData}
    />
  );
}
