import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarConstrutoraForm from './EditarConstrutoraForm';

interface Socio {
  nome?: string;
  cpf?: string;
  participacao?: string;
  cargo?: string;
}

interface ContaBancaria {
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo?: string;
}

export default async function EditarConstrutoraPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const construtora = await db.construtora.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!construtora) {
    notFound();
  }

  // Parsear campos JSON
  const socios: Socio[] = 
    construtora.socios && typeof construtora.socios === 'object' && Array.isArray(construtora.socios)
      ? (construtora.socios as Socio[])
      : [];

  const contaBancaria: ContaBancaria =
    construtora.contaBancaria && typeof construtora.contaBancaria === 'object'
      ? (construtora.contaBancaria as ContaBancaria)
      : { banco: '', agencia: '', conta: '', tipo: 'Corrente' };

  // Preparar dados para o formulário
  const initialData = {
    id: construtora.id,
    codigo: construtora.codigo,
    razaoSocial: construtora.razaoSocial,
    nomeFantasia: construtora.nomeFantasia || '',
    cnpj: construtora.cnpj,
    inscricaoEstadual: construtora.inscricaoEstadual || '',
    endereco: construtora.endereco || '',
    cidade: construtora.cidade || '',
    estado: construtora.estado || '',
    cep: construtora.cep || '',
    telefone: construtora.telefone || '',
    email: construtora.email || '',
    socios: socios.length > 0 
      ? socios.map(s => ({
          nome: s.nome || '',
          cpf: s.cpf || '',
          participacao: s.participacao || '',
          cargo: s.cargo || '',
        }))
      : [{ nome: '', cpf: '', participacao: '', cargo: '' }],
    contaBancaria: {
      banco: contaBancaria.banco || '',
      agencia: contaBancaria.agencia || '',
      conta: contaBancaria.conta || '',
      tipo: contaBancaria.tipo || 'Corrente',
    },
  };

  return <EditarConstrutoraForm initialData={initialData} />;
}
