import { db } from '@/lib/db';
import CadastrosFinanceirosContent from './CadastrosFinanceirosContent';

export default async function CadastrosFinanceirosPage() {
  const construtoras = await db.construtora.findMany({
    select: {
      id: true,
      codigo: true,
      razaoSocial: true,
      nomeFantasia: true,
      cnpj: true,
      cidade: true,
      estado: true,
      _count: {
        select: {
          obras: true,
          credores: true,
          contasBancarias: true,
          itensCustoIndireto: true,
        }
      }
    },
    orderBy: {
      razaoSocial: 'asc'
    }
  });

  const construtorasFormatadas = construtoras.map(construtora => ({
    id: construtora.id,
    codigo: construtora.codigo,
    razaoSocial: construtora.razaoSocial,
    nomeFantasia: construtora.nomeFantasia,
    cnpj: construtora.cnpj,
    cidade: construtora.cidade,
    estado: construtora.estado,
    totalObras: construtora._count.obras,
    totalCredores: construtora._count.credores,
    totalContas: construtora._count.contasBancarias,
    totalCustosIndiretos: construtora._count.itensCustoIndireto,
  }));

  const totalConstrutoras = construtorasFormatadas.length;
  const totalCredores = construtorasFormatadas.reduce((sum, c) => sum + c.totalCredores, 0);
  const totalContas = construtorasFormatadas.reduce((sum, c) => sum + c.totalContas, 0);

  return (
    <CadastrosFinanceirosContent
      construtoras={construtorasFormatadas}
      totalConstrutoras={totalConstrutoras}
      totalCredores={totalCredores}
      totalContas={totalContas}
    />
  );
}
