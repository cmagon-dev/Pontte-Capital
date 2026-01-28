import { db } from "@/lib/db";
import { buscarVersaoAtivaOrcamento } from "@/app/actions/orcamento";
import PrevisoesMedicoesContent from "./PrevisoesMedicoesContent";

interface PageProps {
  params: {
    construtoraId: string;
    obraId: string;
  };
}

export default async function PrevisoesMedicoesPage({ params }: PageProps) {
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

  // 2. Buscar Versão Ativa do Orçamento
  const versaoAtiva = await buscarVersaoAtivaOrcamento(params.obraId);

  if (!versaoAtiva) {
    return (
      <div className="p-8">
        <div className="bg-amber-900 border border-amber-800 rounded-lg p-4">
          <p className="text-amber-300">
            Nenhuma versão de orçamento ativa encontrada para esta obra.
            Por favor, importe uma planilha contratual primeiro.
          </p>
        </div>
      </div>
    );
  }

  // 3. Buscar Versão Ativa de Categorização
  const versaoCategorizacao = await db.versaoCategorizacao.findFirst({
    where: { 
      obraId: params.obraId, 
      status: 'ATIVA' 
    },
    include: { 
      itens: {
        select: {
          id: true,
          codigo: true,
          etapa: true,
          subEtapa: true,
          servicoSimplificado: true,
        }
      }
    }
  });

  // 4. Buscar Versão Ativa de Visão Gerencial
  const versaoVisaoGerencial = await db.versaoVisaoGerencial.findFirst({
    where: { 
      obraId: params.obraId, 
      status: 'ATIVA' 
    },
    include: {
      itens: {
        include: {
          vinculosItens: {
            include: { 
              itemCustoOrcado: {
                select: {
                  id: true,
                  codigo: true,
                  discriminacao: true,
                }
              }
            }
          }
        },
        orderBy: [
          { nivel: 'asc' }, 
          { ordem: 'asc' }
        ]
      }
    }
  });

  return (
    <PrevisoesMedicoesContent
      params={params}
      obra={{
        id: obra.id,
        codigo: obra.codigo || 'S/C',
        nome: obra.nome,
        construtora: {
          razaoSocial: obra.construtora?.razaoSocial || 'Construtora',
        },
      }}
      versaoAtiva={versaoAtiva as any}
      versaoCategorizacao={versaoCategorizacao as any}
      versaoVisaoGerencial={versaoVisaoGerencial as any}
    />
  );
}
