# Diagnóstico: Planilha Contratual - Bugs de Interatividade e Cálculos

## 📋 Resumo dos Problemas

1. **Interatividade**: Funções de Expandir/Recolher não funcionam
2. **Cálculos**: Agrupadores com valor zero ou não somando filhos

---

## 🔍 1. FRONTEND - PlanilhaContratualContent.tsx

### 1.1 Função `converterItensParaPlanilha`

**Localização**: Linhas 72-154

```typescript
const converterItensParaPlanilha = (itens: typeof versaoAtiva.itens | null | undefined): PlanilhaItem[] => {
  if (!itens || itens.length === 0) {
    return [];
  }
  
  // Criar mapa de itens por ID
  const itensMap = new Map<string, PlanilhaItem>();
  const filhosMap = new Map<string, Array<{ id: string; ordem: number }>>();

  // Primeiro, criar todos os itens
  itens.forEach((item, index) => {
    const planilhaItem: PlanilhaItem = {
      id: item.id,
      item: item.codigo,
      referencia: item.referencia || '',
      descricao: item.discriminacao,
      unidade: item.unidade || '',
      quantidade: item.quantidade !== null && item.quantidade !== undefined ? Number(item.quantidade) : 0,
      precoUnitario: item.precoUnitarioVenda !== null && item.precoUnitarioVenda !== undefined ? Number(item.precoUnitarioVenda) : 0,
      precoTotal: Number(item.precoTotalVenda),
      nivel: item.nivel,
      tipo: item.tipo === 'AGRUPADOR' ? 'agrupador' : 'item',
      filhos: [],
      parentId: item.parentId || undefined,  // ⚠️ USA UUID DO BANCO
    };
    itensMap.set(item.id, planilhaItem);

    // Mapear filhos
    if (item.parentId) {
      if (!filhosMap.has(item.parentId)) {
        filhosMap.set(item.parentId, []);
      }
      filhosMap.get(item.parentId)!.push({
        id: item.id,
        ordem: item.ordem !== null && item.ordem !== undefined ? item.ordem : index,
      });
    }
  });

  // Atualizar filhos ordenados por ordem
  filhosMap.forEach((filhos, parentId) => {
    const parent = itensMap.get(parentId);
    if (parent) {
      // Ordenar filhos pela ordem
      filhos.sort((a, b) => a.ordem - b.ordem);
      parent.filhos = filhos.map(f => f.id);
    }
  });

  // Verificação adicional: se um item é agrupador mas não tem filhos mapeados,
  // procurar filhos baseados no parentId dos outros itens
  itensMap.forEach((item) => {
    if (item.tipo === 'agrupador' && item.filhos.length === 0) {
      // Procurar itens que têm este item como parent
      const filhosEncontrados: string[] = [];
      itensMap.forEach((outroItem) => {
        if (outroItem.parentId === item.id) {
          filhosEncontrados.push(outroItem.id);
        }
      });
      if (filhosEncontrados.length > 0) {
        // Ordenar pelos códigos para manter ordem
        filhosEncontrados.sort((a, b) => {
          const itemA = itensMap.get(a);
          const itemB = itensMap.get(b);
          if (!itemA || !itemB) return 0;
          const partesA = itemA.item.split('.').map(Number);
          const partesB = itemB.item.split('.').map(Number);
          const maxLen = Math.max(partesA.length, partesB.length);
          for (let i = 0; i < maxLen; i++) {
            const valA = partesA[i] || 0;
            const valB = partesB[i] || 0;
            if (valA !== valB) return valA - valB;
          }
          return 0;
        });
        item.filhos = filhosEncontrados;
      }
    }
  });

  return Array.from(itensMap.values());
};
```

**Análise**:
- ✅ `parentId` usa **UUID do banco** (linha 95: `parentId: item.parentId || undefined`)
- ✅ `filhos` é populado corretamente usando UUIDs (linha 117: `parent.filhos = filhos.map(f => f.id)`)
- ⚠️ Há uma verificação adicional que tenta encontrar filhos não mapeados (linhas 123-151)

---

### 1.2 Função `recalcularTotaisAgrupadores` (Frontend)

**Localização**: Linhas 172-201

```typescript
const recalcularTotaisAgrupadores = (itens: PlanilhaItem[]): PlanilhaItem[] => {
  // Ordenar por nível (do mais profundo para o mais raso)
  const itensOrdenados = [...itens].sort((a, b) => b.nivel - a.nivel);
  
  // Criar mapa para acesso rápido
  const itensMap = new Map(itens.map(item => [item.id, { ...item }]));

  // Recalcular totais bottom-up (do mais profundo para o mais raso)
  for (const item of itensOrdenados) {
    if (item.tipo === 'agrupador') {
      let total = 0;
      // Soma apenas os filhos diretos
      item.filhos.forEach((filhoId) => {
        const filho = itensMap.get(filhoId);
        if (filho) {
          total += filho.precoTotal;
        }
      });
      
      // Atualizar o total do agrupador
      const itemAtualizado = itensMap.get(item.id);
      if (itemAtualizado) {
        itemAtualizado.precoTotal = total;
        itensMap.set(item.id, itemAtualizado);
      }
    }
  }
  
  return Array.from(itensMap.values());
};
```

**Análise**:
- ✅ Usa `item.filhos` (array de UUIDs) para somar
- ✅ Processa bottom-up (do mais profundo para o mais raso)
- ⚠️ **PROBLEMA POTENCIAL**: Se `item.filhos` estiver vazio ou incorreto, o total será zero

---

### 1.3 Funções `toggleRow` e `toggleNivel`

**Localização**: Linhas 255-283

```typescript
const toggleRow = (itemId: string) => {
  const newExpanded = new Set(expandedRows);
  if (newExpanded.has(itemId)) {
    newExpanded.delete(itemId);
  } else {
    newExpanded.add(itemId);
  }
  setExpandedRows(newExpanded);
  setExpandedRowsKey(Array.from(newExpanded).sort().join(','));
};

const toggleNivel = (nivel: number) => {
  const itensDoNivel = planilhaItensComTotais.filter((i) => i.nivel === nivel && i.tipo === 'agrupador');
  const newExpanded = new Set(expandedRows);
  const todosExpandidos = itensDoNivel.every((item) => newExpanded.has(item.id));

  if (todosExpandidos) {
    itensDoNivel.forEach((item) => {
      newExpanded.delete(item.id);
    });
  } else {
    itensDoNivel.forEach((item) => {
      newExpanded.add(item.id);
    });
  }

  setExpandedRows(newExpanded);
  setExpandedRowsKey(Array.from(newExpanded).sort().join(','));
};
```

**Análise**:
- ✅ Atualiza `expandedRows` e `expandedRowsKey` corretamente
- ⚠️ **PROBLEMA POTENCIAL**: O `useMemo` do `visibleItems` pode não estar detectando mudanças

---

### 1.4 Hook `useEffect` que carrega dados iniciais

**Localização**: Linhas 217-234

```typescript
// Atualizar quando versão ativa mudar
useEffect(() => {
  if (versaoAtiva && versaoAtiva.itens && versaoAtiva.itens.length > 0) {
    const itensConvertidos = converterItensParaPlanilha(versaoAtiva.itens);
    setPlanilhaItens(itensConvertidos);
    setVersaoAtivaId(versaoAtiva.id);
    // NÃO expandir automaticamente - deixar o usuário controlar
    const newSet = new Set();
    setExpandedRows(newSet);
    setExpandedRowsKey('');
  } else {
    // Se não há versão ativa, limpar os itens
    setPlanilhaItens([]);
    setVersaoAtivaId('');
    const newSet = new Set();
    setExpandedRows(newSet);
    setExpandedRowsKey('');
  }
}, [versaoAtiva?.id]);
```

**Análise**:
- ✅ Converte itens corretamente
- ✅ Inicializa `expandedRows` como Set vazio (tudo recolhido)

---

### 1.5 Renderização da Tabela (Botão Toggle)

**Localização**: Linhas 862-876

```typescript
<td>
  {item.tipo === 'agrupador' ? (
    <button
      onClick={() => toggleRow(item.id)}
      className="p-1 hover:bg-slate-700 rounded"
    >
      {expandedRows.has(item.id) ? (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-400" />
      )}
    </button>
  ) : (
    <div className="w-6"></div>
  )}
</td>
```

**Análise**:
- ✅ Botão só aparece para agrupadores
- ✅ Usa `item.id` (UUID) corretamente
- ⚠️ **PROBLEMA POTENCIAL**: Se `item.filhos.length === 0`, o botão aparece mas não faz nada

---

### 1.6 Função `visibleItems` (useMemo)

**Localização**: Linhas 295-355

```typescript
const visibleItems = useMemo(() => {
  if (!planilhaItensComTotais || planilhaItensComTotais.length === 0) {
    return [];
  }
  
  // Criar mapa de itens por ID para acesso rápido
  const itensMap = new Map<string, PlanilhaItem>();
  planilhaItensComTotais.forEach(item => {
    itensMap.set(item.id, item);
  });
  
  const visible: PlanilhaItem[] = [];
  const processItem = (item: PlanilhaItem) => {
    visible.push(item);
    // Se é agrupador e está expandido, processar filhos na ordem correta
    if (item.tipo === 'agrupador' && expandedRows.has(item.id) && item.filhos.length > 0) {
      // Filhos já estão ordenados na propriedade filhos
      item.filhos.forEach((filhoId) => {
        const filho = itensMap.get(filhoId);
        if (filho) processItem(filho);
      });
    }
  };
  
  // Primeiro, tentar encontrar itens de nível 0
  let itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === 0);
  
  // Se não há itens de nível 0, usar itens sem parentId como raiz
  if (itensRaiz.length === 0) {
    itensRaiz = planilhaItensComTotais.filter((i) => !i.parentId);
  }
  
  // Se ainda não há itens raiz, usar o menor nível encontrado
  if (itensRaiz.length === 0 && planilhaItensComTotais.length > 0) {
    const menorNivel = Math.min(...planilhaItensComTotais.map(i => i.nivel));
    itensRaiz = planilhaItensComTotais.filter((i) => i.nivel === menorNivel);
  }
  
  if (itensRaiz.length === 0) {
    return [];
  }
  
  // Ordenar itens raiz pela ordem (usando código como fallback)
  itensRaiz.sort((a, b) => {
    // Comparar códigos hierárquicos para ordenação
    const partesA = a.item.split('.').map(Number);
    const partesB = b.item.split('.').map(Number);
    const maxLen = Math.max(partesA.length, partesB.length);
    
    for (let i = 0; i < maxLen; i++) {
      const valA = partesA[i] || 0;
      const valB = partesB[i] || 0;
      if (valA !== valB) return valA - valB;
    }
    return 0;
  });
  
  // NÃO expandir automaticamente - deixar o usuário controlar
  itensRaiz.forEach(processItem);
  return visible;
}, [planilhaItensComTotais, expandedRowsKey]);
```

**Análise**:
- ✅ Dependências corretas: `planilhaItensComTotais` e `expandedRowsKey`
- ✅ Verifica `expandedRows.has(item.id)` antes de processar filhos
- ⚠️ **PROBLEMA POTENCIAL**: Se `expandedRowsKey` não estiver sendo atualizado corretamente, o `useMemo` não recalcula

---

### 1.7 Função `obterTotalItem` (Exibição)

**Localização**: Linhas 237-253

```typescript
const obterTotalItem = (item: PlanilhaItem): number => {
  // Para itens, retorna o precoTotal diretamente
  if (item.tipo === 'item') {
    return item.precoTotal;
  }
  
  // Para agrupadores, soma os filhos diretos
  let total = 0;
  item.filhos.forEach((filhoId) => {
    const filho = planilhaItensComTotais.find((i) => i.id === filhoId);
    if (filho) {
      total += filho.precoTotal;
    }
  });
  
  return total;
};
```

**Análise**:
- ⚠️ **PROBLEMA CRÍTICO**: Esta função recalcula o total na renderização, mas usa `planilhaItensComTotais.find()` que pode ser lento
- ⚠️ **INCONSISTÊNCIA**: O total já foi calculado em `recalcularTotaisAgrupadores`, mas esta função recalcula novamente
- ⚠️ Se `item.filhos` estiver vazio, retorna 0

---

## 🔍 2. BACKEND - app/actions/orcamento.ts

### 2.1 Função `recalcularTotaisAgrupadores` (Backend)

**Localização**: Linhas 483-515

```typescript
async function recalcularTotaisAgrupadores(versaoId: string) {
  // Buscar todos os itens da versão
  const itens = await db.itemOrcamento.findMany({
    where: { versaoId },
    orderBy: [{ nivel: 'desc' }, { ordem: 'asc' }], // Do mais profundo para o mais raso
  });

  // Mapear itens por ID
  const itensPorId = new Map(itens.map(item => [item.id, item]));

  // Calcular totais bottom-up (do mais profundo para o mais raso)
  for (const item of itens) {
    if (item.tipo === 'AGRUPADOR') {
      // Buscar todos os filhos diretos
      const filhos = itens.filter(i => i.parentId === item.id);
      
      // Soma dos preços totais dos filhos
      const totalFilhos = filhos.reduce((sum, filho) => {
        return sum + Number(filho.precoTotalVenda);
      }, 0);

      // Atualizar preço total do agrupador
      if (Number(item.precoTotalVenda) !== totalFilhos) {
        await db.itemOrcamento.update({
          where: { id: item.id },
          data: {
            precoTotalVenda: totalFilhos,
          },
        });
      }
    }
  }
}
```

**Análise**:
- ✅ Usa `i.parentId === item.id` (UUID do banco) corretamente
- ✅ Processa bottom-up (do mais profundo para o mais raso)
- ⚠️ **PROBLEMA POTENCIAL**: Se `filhos` estiver vazio, `totalFilhos` será 0 e o agrupador ficará com valor zero

---

### 2.2 Função `construirHierarquia` (Importação)

**Localização**: Linhas 44-68

```typescript
function construirHierarquia(linhas: LinhaPlanilha[]): Map<string, { linha: LinhaPlanilha; parentId: string | null }> {
  const hierarquia = new Map<string, { linha: LinhaPlanilha; parentId: string | null }>();
  const codigoParaLinha = new Map<string, LinhaPlanilha>();
  linhas.forEach((linha) => {
    const codigo = linha.item.trim();
    linha.item = codigo;
    codigoParaLinha.set(codigo, linha);
  });

  linhas.forEach((linha) => {
    const codigo = linha.item;
    const partes = codigo.split('.').map((parte) => parte.trim()).filter(Boolean);
    let parentId: string | null = null;

    for (let nivel = partes.length - 1; nivel > 0; nivel--) {
      const candidato = partes.slice(0, nivel).join('.');
      if (codigoParaLinha.has(candidato)) {
        parentId = candidato;  // ⚠️ USA CÓDIGO HIERÁRQUICO (ex: '1.1')
        break;
      }
    }

    hierarquia.set(codigo, { linha, parentId });
  });

  return hierarquia;
}
```

**Análise**:
- ⚠️ **IMPORTANTE**: Esta função retorna `parentId` como **código hierárquico** (ex: '1.1'), não UUID
- ⚠️ Isso é usado apenas na importação, depois é convertido para UUID

---

### 2.3 Processo de Importação (Conversão de parentCode para parentId)

**Localização**: Linhas 413-450

```typescript
// Passada 1: criar registros com parentId null
for (const itemData of itensParaCriar) {
  const itemCriado = await db.itemOrcamento.create({
    data: {
      versaoId: itemData.versaoId,
      codigo: itemData.codigo,
      nivel: itemData.nivel,
      ordem: itemData.ordem,
      discriminacao: itemData.discriminacao,
      unidade: itemData.unidade,
      quantidade: itemData.quantidade,
      precoUnitarioVenda: itemData.precoUnitarioVenda,
      precoTotalVenda: itemData.precoTotalVenda,
      tipo: itemData.tipo,
      referencia: itemData.referencia,
      parentId: null,  // ⚠️ Inicialmente null
    },
  });

  itemData.id = itemCriado.id;
  codigoParaId.set(itemData.codigo, itemCriado.id);
}

// Passada 2: atualizar parentId com IDs já criados
const updates = itensParaCriar
  .filter((item) => item.parentCode)
  .map((item) => {
    const parentId = codigoParaId.get(item.parentCode!);  // ⚠️ Converte código para UUID
    if (!parentId || !item.id) return null;

    return db.itemOrcamento.update({
      where: { id: item.id },
      data: { parentId },  // ✅ Agora usa UUID
    });
  })
  .filter(Boolean) as Promise<unknown>[];

await Promise.all(updates);
```

**Análise**:
- ✅ Converte `parentCode` (código hierárquico) para `parentId` (UUID) corretamente
- ✅ Usa `codigoParaId` para mapear código → UUID

---

## 🎯 3. ANÁLISE: O sistema espera UUID ou Código Hierárquico?

### Resposta: **UUID DO BANCO**

**Evidências**:

1. **Backend** (`recalcularTotaisAgrupadores`):
   ```typescript
   const filhos = itens.filter(i => i.parentId === item.id);
   ```
   - Usa `item.id` (UUID) para comparar com `i.parentId`

2. **Frontend** (`converterItensParaPlanilha`):
   ```typescript
   parentId: item.parentId || undefined,  // item.parentId é UUID do banco
   ```

3. **Frontend** (`recalcularTotaisAgrupadores`):
   ```typescript
   item.filhos.forEach((filhoId) => {  // filhoId é UUID
     const filho = itensMap.get(filhoId);
   ```

4. **Frontend** (`toggleRow`):
   ```typescript
   onClick={() => toggleRow(item.id)}  // item.id é UUID
   ```

**Conclusão**: O sistema usa **UUID do banco** em toda a aplicação, exceto durante a importação inicial onde `construirHierarquia` usa códigos hierárquicos temporariamente.

---

## 🐛 4. POSSÍVEIS CAUSAS DOS BUGS

### Bug 1: Expandir/Recolher não funciona

**Possíveis causas**:

1. **`expandedRowsKey` não está sendo atualizado corretamente**
   - Verificar se `useEffect` (linha 212-214) está sendo executado
   - Verificar se `toggleRow` e `toggleNivel` estão atualizando `expandedRowsKey`

2. **`visibleItems` não está sendo recalculado**
   - Verificar se `expandedRowsKey` está mudando (adicionar `console.log`)
   - Verificar se `useMemo` está detectando a mudança

3. **`item.filhos` está vazio**
   - Se `filhos.length === 0`, o botão aparece mas não há filhos para mostrar/ocultar

### Bug 2: Agrupadores com valor zero

**Possíveis causas**:

1. **`item.filhos` está vazio no frontend**
   - Se `converterItensParaPlanilha` não populou `filhos` corretamente
   - Verificar se `parentId` está correto no banco

2. **Backend não calculou corretamente**
   - Se `recalcularTotaisAgrupadores` não encontrou filhos (parentId incorreto)
   - Verificar se `precoTotalVenda` dos filhos está correto

3. **Inconsistência entre `recalcularTotaisAgrupadores` e `obterTotalItem`**
   - `recalcularTotaisAgrupadores` calcula e armazena em `item.precoTotal`
   - `obterTotalItem` recalcula na renderização usando `item.filhos`
   - Se `item.filhos` estiver vazio, `obterTotalItem` retorna 0

---

## 🔧 5. CHECKLIST DE DIAGNÓSTICO

Para identificar onde a corrente está quebrando, verifique:

- [ ] No banco: `parentId` está preenchido corretamente (UUID, não código)?
- [ ] No banco: `precoTotalVenda` dos filhos está correto?
- [ ] No frontend: `item.filhos` está populado após `converterItensParaPlanilha`?
- [ ] No frontend: `expandedRowsKey` está mudando quando clica no botão?
- [ ] No frontend: `visibleItems` está sendo recalculado quando `expandedRowsKey` muda?
- [ ] No frontend: `item.precoTotal` está correto após `recalcularTotaisAgrupadores`?

---

## 📝 6. PRÓXIMOS PASSOS

1. Adicionar `console.log` em pontos críticos:
   - `toggleRow`: logar `itemId`, `expandedRows` antes/depois
   - `visibleItems`: logar quando recalcula
   - `converterItensParaPlanilha`: logar `item.filhos` para cada agrupador
   - `recalcularTotaisAgrupadores`: logar total calculado vs total atual

2. Verificar dados no banco:
   ```sql
   SELECT id, codigo, parentId, tipo, precoTotalVenda 
   FROM ItemOrcamento 
   WHERE versaoId = '...' 
   ORDER BY nivel, ordem;
   ```

3. Verificar se `item.filhos` está vazio no frontend:
   - Adicionar debug na renderização: `{item.tipo === 'agrupador' && item.filhos.length}`
