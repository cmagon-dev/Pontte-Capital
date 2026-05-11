import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, UserCog } from 'lucide-react';
import { db } from '@/lib/db';
import EditarUsuarioForm from './EditarUsuarioForm';
import { listarPerfis, listarFundosParaVinculo, listarConstrutoresParaVinculo, listarObrasParaVinculo } from '@/app/actions/perfis';

interface EditarUsuarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarUsuarioPage({ params }: EditarUsuarioPageProps) {
  const { id } = await params;

  const [usuario, resultadoPerfis, resultadoFundos, resultadoConstrutoras, resultadoObras] = await Promise.all([
    db.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfilId: true,
        status: true,
        perfil: { select: { tipoEscopo: true } },
        fundosVinculados: { select: { fundoId: true } },
        construtorasVinculadas: { select: { construtoraId: true } },
        fiadorConstrutorasVinculadas: { select: { construtoraId: true } },
        fiadorObrasVinculadas: { select: { obraId: true } },
      },
    }),
    listarPerfis(),
    listarFundosParaVinculo(),
    listarConstrutoresParaVinculo(),
    listarObrasParaVinculo(),
  ]);

  if (!usuario) notFound();

  const perfis = resultadoPerfis.sucesso
    ? resultadoPerfis.dados!.map((p) => ({ id: p.id, nome: p.nome, tipoEscopo: (p as { tipoEscopo?: string }).tipoEscopo ?? 'GLOBAL' }))
    : [];

  const fundos = resultadoFundos.dados ?? [];
  const construtoras = resultadoConstrutoras.dados ?? [];
  const obras = resultadoObras.dados ?? [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Usuários
        </Link>
        <div className="flex items-center gap-3">
          <UserCog className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Editar Usuário</h1>
            <p className="text-slate-400 mt-1">{usuario.nome}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <EditarUsuarioForm
          usuario={{
            ...usuario,
            tipoEscopoPerfil: usuario.perfil.tipoEscopo,
            fundoIds: usuario.fundosVinculados.map((f) => f.fundoId),
            construtoraIds: usuario.construtorasVinculadas.map((c) => c.construtoraId),
            fiadorConstrutoraIds: usuario.fiadorConstrutorasVinculadas.map((c) => c.construtoraId),
            fiadorObraIds: usuario.fiadorObrasVinculadas.map((o) => o.obraId),
          }}
          perfis={perfis}
          fundos={fundos}
          construtoras={construtoras}
          obras={obras}
        />
      </div>
    </div>
  );
}
