import { db } from "@/lib/db";
import { buscarVisaoGerencialSalva, calcularPorcentagemCategorizado, calcularPorcentagemOrcado } from "@/app/actions/orcamento";
import VisaoGerencialContent from "./VisaoGerencialContent";

interface PageProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
}

export default async function VisaoGerencialPage({ params }: PageProps) {
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

  // 2. Buscar Versão Ativa da Planilha Contratual
  const versaoContratualAtiva = await db.versaoOrcamento.findFirst({
    where: {
      obraId: params.obraId,
      status: 'ATIVA',
      fase: 'PLANILHA_CONTRATUAL',
    },
  });

  // 3. Buscar Versão Ativa de Custos Orçados
  const versaoAtivaCustos = await db.versaoCustoOrcado.findFirst({
    where: {
      obraId: params.obraId,
      status: 'ATIVA',
    },
  });

  // 4. Buscar Versão Ativa de Categorização
  const versaoAtivaCategorizacao = await db.versaoCategorizacao.findFirst({
    where: {
      obraId: params.obraId,
      status: 'ATIVA',
    },
  });

  // 5. Buscar Visão Gerencial Salva (se existir)
  const resultadoVisaoGerencial = await buscarVisaoGerencialSalva(params.obraId);

  // 6. Buscar porcentagens de validação
  const porcentagemCategorizado = await calcularPorcentagemCategorizado(params.obraId);
  const porcentagemOrcado = await calcularPorcentagemOrcado(params.obraId);

  return (
    <VisaoGerencialContent
      params={params}
      obra={{
        id: obra.id,
        codigo: obra.codigo || 'S/C',
        nome: obra.nome,
        construtora: {
          razaoSocial: obra.construtora?.razaoSocial || 'Construtora',
        },
      }}
      versaoContratualAtiva={versaoContratualAtiva}
      versaoAtivaCustos={versaoAtivaCustos}
      versaoAtivaCategorizacao={versaoAtivaCategorizacao}
      visaoGerencialSalva={resultadoVisaoGerencial.success ? (resultadoVisaoGerencial.visaoGerencial ?? null) : null}
      erroVisaoGerencialSalva={!resultadoVisaoGerencial.success ? resultadoVisaoGerencial.error : null}
      porcentagemCategorizado={porcentagemCategorizado.porcentagem || 0}
      porcentagemOrcado={porcentagemOrcado.porcentagem || 0}
    />
  );
}
