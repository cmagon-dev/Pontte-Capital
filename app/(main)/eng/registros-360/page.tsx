import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getObraScopeFilter } from '@/lib/scope';
import Registros360Content from './Registros360Content';

export default async function Registros360Page() {
  try {
    const session = await getServerSession(authOptions);
    const obraScopeFilter = session ? getObraScopeFilter(session) : { id: '__nenhum__' };

    // Construtoras filtradas conforme escopo
    const construtoraWhereFilter = session?.user.tipoEscopo === 'CONSTRUTORA' && session.user.construtoraIds.length > 0
      ? { id: { in: session.user.construtoraIds } }
      : {};

    const construtoras = await db.construtora.findMany({
      where: construtoraWhereFilter,
      select: {
        id: true,
        codigo: true,
        razaoSocial: true,
        nomeFantasia: true,
        cnpj: true,
      },
      orderBy: { razaoSocial: 'asc' },
    });

    // Obras com filtro de escopo
    const obras = await db.obra.findMany({
      where: obraScopeFilter,
      select: {
        id: true,
        construtoraId: true,
        valorContrato: true,
        status: true,
      },
    });

    // Buscar todas as plantas com pontos e fotos
    const obrasIds = obras.length > 0 ? obras.map(o => o.id) : [];
    const plantas = obrasIds.length > 0 ? await db.plantaBaixa.findMany({
      where: {
        obraId: {
          in: obrasIds,
        },
      },
      include: {
        pontos: {
          include: {
            _count: {
              select: {
                fotos: true,
              },
            },
          },
        },
      },
    }) : [];

    // Criar mapa de plantas por obra
    const plantasPorObra: Record<string, typeof plantas> = {};
    plantas.forEach(planta => {
      if (!plantasPorObra[planta.obraId]) {
        plantasPorObra[planta.obraId] = [];
      }
      plantasPorObra[planta.obraId].push(planta);
    });

    // Agrupar obras por construtora e calcular estatísticas
    const construtorasComObras = construtoras.map((construtora) => {
      const obrasConstrutora = obras.filter((obra) => obra.construtoraId === construtora.id);
      const plantasConstrutora = obrasConstrutora.flatMap(obra => plantasPorObra[obra.id] || []);

      const totalPontos = plantasConstrutora.reduce((sum, planta) => sum + planta.pontos.length, 0);
      const totalFotos = plantasConstrutora.reduce(
        (sum, planta) => sum + planta.pontos.reduce((p, ponto) => p + ponto._count.fotos, 0),
        0
      );

      // Mapear status
      const obrasAtivas = obrasConstrutora.filter(
        (o) => o.status === 'EM_ANDAMENTO'
      ).length;
      const obrasAtrasadas = obrasConstrutora.filter((o) => o.status === 'PARALISADA').length;

      return {
        construtoraId: construtora.id,
        construtoraNome: construtora.razaoSocial,
        construtoraCnpj: construtora.cnpj,
        totalObras: obrasConstrutora.length,
        obrasAtivas,
        obrasAtrasadas,
        valorTotal: obrasConstrutora.reduce((sum, o) => sum + Number(o.valorContrato), 0),
        totalPlantas: plantasConstrutora.length,
        totalPontos,
        totalFotos,
      };
    });

    return <Registros360Content construtoras={construtorasComObras} />;
  } catch (error: any) {
    console.error('❌ Erro na página Registros360Page:', error);
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-400">
          <p className="font-bold mb-2">Erro ao carregar dados</p>
          <p className="mb-2">{error.message || 'Erro desconhecido'}</p>
          <p className="text-sm mt-2">
            Se o erro mencionar "plantaBaixa", execute:
            <br />
            <code className="bg-slate-800 px-2 py-1 rounded mt-1 inline-block">
              npx prisma generate
            </code>
            <br />
            E reinicie o servidor Next.js.
          </p>
        </div>
      </div>
    );
  }
}
