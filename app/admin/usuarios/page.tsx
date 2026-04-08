import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { db } from '@/lib/db';
import UsuariosTable from './UsuariosTable';

export default async function UsuariosPage() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/528692c8-84b6-486c-8d5f-6c2368d3fdf3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f36d35'},body:JSON.stringify({sessionId:'f36d35',location:'admin/usuarios/page.tsx:7',message:'db keys check',data:{dbKeys:Object.keys(db as object),hasUsuario:'usuario' in (db as object),dbConstructorName:(db as object).constructor?.name},runId:'run1',hypothesisId:'A-B-D',timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  const usuarios = await db.usuario.findMany({
    orderBy: { nome: 'asc' },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-7 h-7 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Usuários do Sistema</h1>
          </div>
          <p className="text-slate-400">Gerencie os usuários e suas permissões de acesso</p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </Link>
      </div>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
