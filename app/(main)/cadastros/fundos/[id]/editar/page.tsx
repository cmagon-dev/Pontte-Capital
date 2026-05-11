import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditarFundoForm from './EditarFundoForm';

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

export default async function EditarFundoPage({ params }: { params: { id: string } }) {
  // Buscar dados reais do banco
  const fundo = await db.fundo.findUnique({
    where: { id: params.id },
  });

  // Se não encontrar, mostrar 404
  if (!fundo) {
    notFound();
  }

  // Parsear campos JSON
  const socios: Socio[] = 
    fundo.socios && typeof fundo.socios === 'object' && Array.isArray(fundo.socios)
      ? (fundo.socios as Socio[])
      : [];

  const contaBancaria: ContaBancaria =
    fundo.contaBancaria && typeof fundo.contaBancaria === 'object'
      ? (fundo.contaBancaria as ContaBancaria)
      : { banco: '', agencia: '', conta: '', tipo: 'Corrente' };

  // Preparar dados para o formulário
  const initialData = {
    id: fundo.id,
    codigo: fundo.codigo,
    razaoSocial: fundo.razaoSocial,
    nomeFantasia: fundo.nomeFantasia || '',
    cnpj: fundo.cnpj,
    inscricaoEstadual: fundo.inscricaoEstadual || '',
    endereco: fundo.endereco || '',
    cidade: fundo.cidade || '',
    estado: fundo.estado || '',
    cep: fundo.cep || '',
    telefone: fundo.telefone || '',
    email: fundo.email || '',
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

  return <EditarFundoForm initialData={initialData} />;
}
