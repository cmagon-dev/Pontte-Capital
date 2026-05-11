import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { buscarPerfilPorId, listarPermissoes } from '@/app/actions/perfis';
import PerfilForm from '../PerfilForm';
import ExcluirPerfilButton from '../ExcluirPerfilButton';

interface EditarPerfilPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPerfilPage({ params }: EditarPerfilPageProps) {
  const { id } = await params;
  const [resultadoPerfil, resultadoPermissoes] = await Promise.all([
    buscarPerfilPorId(id),
    listarPermissoes(),
  ]);

  if (!resultadoPerfil.sucesso || !resultadoPerfil.dados) {
    notFound();
  }

  const perfil = resultadoPerfil.dados;
  const permissoes = resultadoPermissoes.sucesso ? resultadoPermissoes.dados! : [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/parametros/perfis"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Perfis
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Editar Perfil</h1>
              <p className="text-slate-400 mt-1">{perfil.nome}</p>
            </div>
          </div>
          <ExcluirPerfilButton
            id={perfil.id}
            nome={perfil.nome}
            totalUsuarios={perfil._count.usuarios}
            redirectOnDelete="/admin/parametros/perfis"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <PerfilForm permissoes={permissoes} perfil={perfil} />
      </div>
    </div>
  );
}
