import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/db';
import DocumentosList from './DocumentosList';

export default async function DocumentosFundoPage({ params }: { params: { id: string } }) {
  // Verificar se o fundo existe
  const fundo = await db.fundo.findUnique({
    where: { id: params.id },
  });

  if (!fundo) {
    notFound();
  }

  // Buscar documentos do fundo
  const documentos = await db.documento.findMany({
    where: { fundoId: params.id },
    orderBy: { dataUpload: 'desc' },
  });

  // Calcular documentos vencidos
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const documentosVencidos = documentos.filter((doc) => {
    if (!doc.dataValidade) return false;
    const validade = new Date(doc.dataValidade);
    validade.setHours(0, 0, 0, 0);
    return validade < hoje;
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/cadastros/fundos/${params.id}/cadastro`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Documentos e Compliance</h1>
            <p className="text-slate-400">Cofre Digital do Fundo - Validação de Documentos</p>
          </div>
        </div>
      </div>

      {/* Alertas de Documentos Vencidos */}
      {documentosVencidos.length > 0 && (
        <div className="mb-6 bg-red-950 border border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Documentos Vencidos</h3>
          </div>
          <p className="text-sm text-slate-300">
            {documentosVencidos.length} documento(s) vencido(s) bloqueiam novas operações. Atualize imediatamente.
          </p>
        </div>
      )}

      {/* Lista de Documentos */}
      <DocumentosList documentos={documentos} fundoId={params.id} />

      {/* Regra de Negócio */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-sm text-slate-400">
          <strong className="text-white">Regra de Negócio:</strong> O sistema verifica automaticamente diariamente se a
          data de validade foi ultrapassada. Documentos vencidos disparam alertas críticos no Dashboard e bloqueiam
          novas operações.
        </p>
      </div>
    </div>
  );
}
