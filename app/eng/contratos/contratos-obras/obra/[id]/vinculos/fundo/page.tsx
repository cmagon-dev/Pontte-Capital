import { notFound } from 'next/navigation';
import { buscarObraPorId } from '@/app/actions/obras';
import { listarFundosDisponiveis, listarVinculosObra } from '@/app/actions/vinculos';
import VincularFundoForm from './VincularFundoForm';

export default async function VincularFundoPage({ params }: { params: { id: string } }) {
  const [obra, fundos, vinculos] = await Promise.all([
    buscarObraPorId(params.id),
    listarFundosDisponiveis(),
    listarVinculosObra(params.id),
  ]);

  if (!obra) {
    notFound();
  }

  // Se já existe um fundo vinculado, redirecionar
  if (vinculos.vinculoFundo) {
    return (
      <div className="p-8">
        <div className="bg-amber-950 border border-amber-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-amber-300 mb-2">Fundo já vinculado</h2>
          <p className="text-amber-400 mb-4">
            Esta obra já possui um fundo vinculado. Cada obra pode ter apenas um fundo investidor.
          </p>
          <a
            href={`/eng/contratos/contratos-obras/obra/${params.id}`}
            className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Voltar para a Obra
          </a>
        </div>
      </div>
    );
  }

  return (
    <VincularFundoForm 
      obra={{
        id: obra.id,
        codigo: obra.codigo,
        nome: obra.nome,
        valorContrato: Number(obra.valorContrato),
      }}
      fundos={fundos}
    />
  );
}
