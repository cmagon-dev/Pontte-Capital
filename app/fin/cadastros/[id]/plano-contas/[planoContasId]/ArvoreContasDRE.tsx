'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, TrendingUp, Calculator } from 'lucide-react';

type Conta = {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
  tipo: string;
  categoriaDRE: string | null;
  aceitaLancamento: boolean;
  parentId: string | null;
};

export function ArvoreContasDRE({ 
  contas, 
  planoId, 
  construtoraId 
}: { 
  contas: Conta[], 
  planoId: string, 
  construtoraId: string 
}) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // Construir estrutura hierárquica
  const construirArvore = (parentId: string | null = null): Conta[] => {
    return contas
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
  };

  const toggleExpand = (contaId: string) => {
    const novosExpandidos = new Set(expandidos);
    if (novosExpandidos.has(contaId)) {
      novosExpandidos.delete(contaId);
    } else {
      novosExpandidos.add(contaId);
    }
    setExpandidos(novosExpandidos);
  };

  const expandirTodos = () => {
    setExpandidos(new Set(contas.map(c => c.id)));
  };

  const recolherTodos = () => {
    setExpandidos(new Set());
  };

  const temFilhos = (contaId: string) => {
    return contas.some(c => c.parentId === contaId);
  };

  const getIconeConta = (conta: Conta) => {
    if (conta.tipo === 'LINHA_RESULTADO') {
      return <Calculator className="w-4 h-4 text-blue-400" />;
    } else if (conta.tipo === 'SINTETICA') {
      return <TrendingUp className="w-4 h-4 text-slate-400" />;
    } else {
      return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCorLinha = (conta: Conta) => {
    if (conta.tipo === 'LINHA_RESULTADO') {
      return 'bg-blue-950/50 border-blue-800 font-bold';
    }
    
    if (conta.categoriaDRE) {
      if (conta.categoriaDRE.includes('RECEITA') && !conta.categoriaDRE.includes('DEDUCOES')) {
        return 'hover:bg-green-950/20';
      }
      if (conta.categoriaDRE.includes('CUSTO') || conta.categoriaDRE.includes('DESPESA') || conta.categoriaDRE.includes('DEDUCOES')) {
        return 'hover:bg-red-950/20';
      }
    }
    
    return 'hover:bg-slate-800';
  };

  const renderConta = (conta: Conta, nivel: number = 0) => {
    const filhos = construirArvore(conta.id);
    const temFilhosNesta = filhos.length > 0;
    const estaExpandido = expandidos.has(conta.id);
    const indentacao = nivel * 24; // 24px por nível

    return (
      <div key={conta.id}>
        <div 
          className={`
            flex items-center gap-2 p-3 border border-slate-800 rounded-lg mb-2
            ${getCorLinha(conta)}
            ${conta.tipo === 'LINHA_RESULTADO' ? 'border-2' : ''}
            transition-colors cursor-pointer
          `}
          onClick={() => temFilhosNesta && toggleExpand(conta.id)}
          style={{ marginLeft: `${indentacao}px` }}
        >
          {/* Botão de expandir/recolher */}
          <div className="w-5 flex-shrink-0">
            {temFilhosNesta && (
              estaExpandido 
                ? <ChevronDown className="w-5 h-5 text-slate-400" />
                : <ChevronRight className="w-5 h-5 text-slate-400" />
            )}
          </div>

          {/* Ícone da conta */}
          <div className="flex-shrink-0">
            {getIconeConta(conta)}
          </div>

          {/* Código */}
          <div className="flex-shrink-0 w-24">
            <span className={`
              font-mono text-sm
              ${conta.tipo === 'LINHA_RESULTADO' ? 'text-blue-400 font-bold' : 'text-slate-400'}
            `}>
              {conta.codigo}
            </span>
          </div>

          {/* Nome */}
          <div className="flex-1">
            <p className={`
              ${conta.tipo === 'LINHA_RESULTADO' ? 'text-white font-bold text-lg' : 'text-slate-200'}
            `}>
              {conta.nome}
            </p>
          </div>

          {/* Tipo */}
          <div className="flex-shrink-0">
            <span className={`
              px-2 py-1 rounded text-xs
              ${conta.tipo === 'ANALITICA' 
                ? 'bg-slate-700 text-slate-300' 
                : conta.tipo === 'SINTETICA'
                ? 'bg-slate-800 text-slate-400'
                : 'bg-blue-900 text-blue-400 font-semibold'
              }
            `}>
              {conta.tipo === 'ANALITICA' 
                ? 'Analítica' 
                : conta.tipo === 'SINTETICA'
                ? 'Sintética'
                : 'Resultado'
              }
            </span>
          </div>

          {/* Natureza */}
          <div className="flex-shrink-0 w-20">
            <span className={`
              text-xs
              ${conta.natureza === 'CREDORA' ? 'text-green-400' : 'text-red-400'}
            `}>
              {conta.natureza === 'CREDORA' ? 'Credora' : 'Devedora'}
            </span>
          </div>
        </div>

        {/* Renderizar filhos se expandido */}
        {temFilhosNesta && estaExpandido && (
          <div className="ml-6">
            {filhos.map(filho => renderConta(filho, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  const contasRaiz = construirArvore(null);

  return (
    <>
      {/* Botões de ação */}
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={expandirTodos}
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          Expandir Todos
        </button>
        <button
          onClick={recolherTodos}
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          Recolher Todos
        </button>
      </div>

      {/* Estrutura hierárquica da DRE */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        {contasRaiz.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Nenhuma conta cadastrada neste plano</p>
            <p className="text-slate-500 text-sm mt-2">Adicione contas para começar a estruturar sua DRE</p>
          </div>
        ) : (
          <div>
            {contasRaiz.map(conta => renderConta(conta, 0))}
          </div>
        )}
      </div>

      {/* Nota sobre Fórmulas */}
      {contas.some(c => c.tipo === 'LINHA_RESULTADO') && (
        <div className="mt-6 bg-purple-950 border border-purple-800 rounded-lg p-4">
          <p className="text-sm text-purple-300">
            <strong>Linhas de Resultado:</strong> As contas marcadas como "Resultado" (como Receita Líquida, Lucro Bruto, EBITDA, EBIT, LAIR e Lucro Líquido)
            são calculadas automaticamente com base nas suas fórmulas. Elas não aceitam lançamentos diretos.
          </p>
        </div>
      )}
    </>
  );
}
