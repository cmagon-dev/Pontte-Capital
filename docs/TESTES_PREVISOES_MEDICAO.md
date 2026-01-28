# 🧪 Guia de Testes - Sistema de Previsões de Medição

## 📋 Checklist de Testes

Use este guia para testar todas as funcionalidades do sistema de previsões de medição.

---

## 1. Testes de Banco de Dados ✅

### 1.1. Verificar Modelos Criados

```bash
# Verificar se os modelos foram criados
npx prisma studio
```

**Verificar:**
- [ ] Tabela `PrevisaoMedicao` existe
- [ ] Tabela `ItemPrevisaoMedicao` existe
- [ ] Campos e relacionamentos corretos

### 1.2. Testar Inserção Manual

```typescript
// No Prisma Studio ou em um script de teste
// Criar uma previsão manualmente para verificar estrutura

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

await prisma.previsaoMedicao.create({
  data: {
    obraId: "uuid-da-obra",
    nome: "Teste Manual",
    numero: 1,
    dataPrevisao: new Date(),
    ordem: 1,
    tipo: "QUANTIDADE",
    status: "PREVISTA",
  },
});
```

**Resultado esperado:**
- [ ] Registro criado com sucesso
- [ ] `id` gerado automaticamente
- [ ] Timestamps `createdAt` e `updatedAt` preenchidos

---

## 2. Testes de Actions

### 2.1. Teste: Criar Previsão de Medição

```typescript
import {
  criarPrevisaoMedicao,
} from "@/app/actions/previsoes-medicao";

// Dados de teste
const dadosTeste = {
  obraId: "sua-obra-id", // Substituir por ID real
  nome: "Medição Teste 01",
  dataPrevisao: new Date("2024-01-31"),
  ordem: 1,
  tipo: "QUANTIDADE" as const,
  versaoOrcamentoId: "versao-id", // Substituir por ID real
  itens: [
    {
      itemOrcamentoId: "item-id", // Substituir por ID real
      itemCustoOrcadoId: "custo-id", // Substituir por ID real
      etapa: "INFRAESTRUTURA E CONTENÇÕES",
      subEtapa: "MOVIMENTAÇÃO DE SOLO",
      servicoSimplificado: "Escavação",
      quantidadePrevista: 100,
      percentualPrevisto: 25,
      valorPrevisto: 50000,
    },
  ],
};

const resultado = await criarPrevisaoMedicao(dadosTeste);

console.log("Resultado:", resultado);
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] `resultado.data` contém a previsão criada
- [ ] `resultado.data.numero === 1` (primeira previsão)
- [ ] `resultado.data.itens.length === 1`
- [ ] Acumulados calculados automaticamente

### 2.2. Teste: Buscar Previsões por Obra

```typescript
import {
  buscarPrevisoesPorObra,
} from "@/app/actions/previsoes-medicao";

const resultado = await buscarPrevisoesPorObra("sua-obra-id");

console.log("Previsões encontradas:", resultado.data?.length);
console.log("Primeira previsão:", resultado.data?.[0]);
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] `resultado.data` é um array
- [ ] Previsões ordenadas por número

### 2.3. Teste: Atualizar Item de Previsão

```typescript
import {
  atualizarItemPrevisao,
} from "@/app/actions/previsoes-medicao";

const resultado = await atualizarItemPrevisao("item-id", {
  quantidadePrevista: 150,
  valorPrevisto: 75000,
});

console.log("Item atualizado:", resultado);
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] Valores atualizados
- [ ] Acumulados recalculados automaticamente

### 2.4. Teste: Deletar Previsão

```typescript
import {
  deletarPrevisaoMedicao,
} from "@/app/actions/previsoes-medicao";

const resultado = await deletarPrevisaoMedicao("previsao-id");

console.log("Previsão deletada:", resultado);
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] Previsão removida do banco
- [ ] Acumulados das outras previsões recalculados

### 2.5. Teste: Visão Gerencial

```typescript
import {
  buscarMedicoesAgrupadasPorVisaoGerencial,
} from "@/app/actions/previsoes-medicao";

const resultado = await buscarMedicoesAgrupadasPorVisaoGerencial("obra-id");

console.log("Medições agrupadas:", JSON.stringify(resultado.data, null, 2));
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] Estrutura hierárquica: Etapa → SubEtapa → Serviço
- [ ] Totais e percentuais calculados
- [ ] Histórico de medições por serviço

---

## 3. Testes de APIs

### 3.1. Teste: Listar Previsões (GET)

```bash
# Usando curl
curl http://localhost:3000/api/previsoes-medicao?obraId=sua-obra-id

# Ou usando fetch no console do navegador
fetch('/api/previsoes-medicao?obraId=sua-obra-id')
  .then(r => r.json())
  .then(console.log);
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Array de previsões
- [ ] Cada previsão com seus itens

### 3.2. Teste: Criar Previsão (POST)

```bash
# Usando curl
curl -X POST http://localhost:3000/api/previsoes-medicao \
  -H "Content-Type: application/json" \
  -d '{
    "obraId": "obra-id",
    "nome": "Medição API Teste",
    "dataPrevisao": "2024-01-31",
    "ordem": 1,
    "tipo": "QUANTIDADE",
    "itens": [
      {
        "itemOrcamentoId": "item-id",
        "quantidadePrevista": 100,
        "percentualPrevisto": 25,
        "valorPrevisto": 50000,
        "etapa": "INFRAESTRUTURA",
        "subEtapa": "FUNDAÇÃO",
        "servicoSimplificado": "Concretagem"
      }
    ]
  }'

# Ou usando fetch
fetch('/api/previsoes-medicao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    obraId: 'obra-id',
    nome: 'Medição API Teste',
    dataPrevisao: '2024-01-31',
    ordem: 1,
    tipo: 'QUANTIDADE',
    itens: [...]
  })
}).then(r => r.json()).then(console.log);
```

**Resultado esperado:**
- [ ] Status 201 (Created)
- [ ] Previsão criada com ID
- [ ] Número sequencial atribuído

### 3.3. Teste: Buscar Previsão por ID (GET)

```bash
curl http://localhost:3000/api/previsoes-medicao/sua-previsao-id
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Dados completos da previsão
- [ ] Itens incluídos
- [ ] Dados da obra incluídos

### 3.4. Teste: Atualizar Previsão (PUT)

```bash
curl -X PUT http://localhost:3000/api/previsoes-medicao/previsao-id \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Medição Atualizada",
    "observacoes": "Teste de atualização"
  }'
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Previsão atualizada
- [ ] Campos modificados

### 3.5. Teste: Deletar Previsão (DELETE)

```bash
curl -X DELETE http://localhost:3000/api/previsoes-medicao/previsao-id
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Mensagem de sucesso
- [ ] Previsão removida do banco

### 3.6. Teste: Visão Gerencial (GET)

```bash
curl "http://localhost:3000/api/previsoes-medicao/visao-gerencial?obraId=obra-id"
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Estrutura hierárquica
- [ ] Totais por categoria
- [ ] Histórico de medições

### 3.7. Teste: Resumo por Item (GET)

```bash
curl "http://localhost:3000/api/previsoes-medicao/resumo-item?obraId=obra-id&itemOrcamentoId=item-id"
```

**Resultado esperado:**
- [ ] Status 200
- [ ] Lista de medições do item
- [ ] Acumulados e saldos

---

## 4. Testes de Cálculo de Acumulados

### 4.1. Teste: Criar Múltiplas Previsões

```typescript
// Criar 3 previsões seguidas para o mesmo item

// Previsão 1: 100 unidades
await criarPrevisaoMedicao({
  obraId: "obra-id",
  nome: "Medição 01",
  dataPrevisao: "2024-01-31",
  ordem: 1,
  itens: [{
    itemOrcamentoId: "item-id",
    quantidadePrevista: 100,
    valorPrevisto: 10000,
  }]
});

// Previsão 2: 50 unidades
await criarPrevisaoMedicao({
  obraId: "obra-id",
  nome: "Medição 02",
  dataPrevisao: "2024-02-28",
  ordem: 2,
  itens: [{
    itemOrcamentoId: "item-id", // MESMO ITEM
    quantidadePrevista: 50,
    valorPrevisto: 5000,
  }]
});

// Previsão 3: 30 unidades
await criarPrevisaoMedicao({
  obraId: "obra-id",
  nome: "Medição 03",
  dataPrevisao: "2024-03-31",
  ordem: 3,
  itens: [{
    itemOrcamentoId: "item-id", // MESMO ITEM
    quantidadePrevista: 30,
    valorPrevisto: 3000,
  }]
});

// Verificar acumulados
const resumo = await buscarResumoMedicoesPorItem("obra-id", "item-id");
console.log(resumo);
```

**Resultado esperado:**

Medição 01:
- [ ] quantidadePrevista = 100
- [ ] quantidadeAcumulada = 100
- [ ] valorAcumulado = 10000

Medição 02:
- [ ] quantidadePrevista = 50
- [ ] quantidadeAcumulada = 150 (100 + 50)
- [ ] valorAcumulado = 15000 (10000 + 5000)

Medição 03:
- [ ] quantidadePrevista = 30
- [ ] quantidadeAcumulada = 180 (150 + 30)
- [ ] valorAcumulado = 18000 (15000 + 3000)

### 4.2. Teste: Deletar Medição Intermediária

```typescript
// Deletar a Medição 02
await deletarPrevisaoMedicao("medicao-02-id");

// Verificar se acumulados foram recalculados
const resumo = await buscarResumoMedicoesPorItem("obra-id", "item-id");
console.log(resumo);
```

**Resultado esperado:**

Medição 01:
- [ ] quantidadeAcumulada = 100 (inalterado)

Medição 03:
- [ ] quantidadeAcumulada = 130 (100 + 30)
- [ ] valorAcumulado = 13000 (recalculado sem a Medição 02)

---

## 5. Testes de Integração Frontend

### 5.1. Teste: Hook customizado

```typescript
import { usePrevisoesMedicao } from "@/docs/EXEMPLO_USO_PREVISOES_MEDICAO";

function TesteComponente() {
  const { previsoes, loading, error, recarregar } = 
    usePrevisoesMedicao("obra-id");

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Previsões: {previsoes.length}</h1>
      <button onClick={recarregar}>Recarregar</button>
      {previsoes.map(p => (
        <div key={p.id}>{p.nome}</div>
      ))}
    </div>
  );
}
```

**Resultado esperado:**
- [ ] Carrega previsões automaticamente
- [ ] Mostra loading enquanto carrega
- [ ] Mostra erro se houver
- [ ] Botão recarregar funciona

### 5.2. Teste: Formatação de Valores

```typescript
import {
  formatarMoeda,
  formatarQuantidade,
  formatarPercentual,
  formatarData,
} from "@/lib/api/previsoes-medicao-client";

console.log(formatarMoeda(50000)); // R$ 50.000,00
console.log(formatarQuantidade(100.5678, 2)); // 100.57
console.log(formatarPercentual(25.5)); // 25,50%
console.log(formatarData(new Date())); // 26/01/2026
```

**Resultado esperado:**
- [ ] Moeda formatada corretamente (R$)
- [ ] Quantidade com decimais corretos
- [ ] Percentual com símbolo %
- [ ] Data no formato pt-BR

---

## 6. Testes de Performance

### 6.1. Teste: Criar Muitas Previsões

```typescript
// Criar 50 previsões
for (let i = 1; i <= 50; i++) {
  await criarPrevisaoMedicao({
    obraId: "obra-id",
    nome: `Medição ${i}`,
    dataPrevisao: new Date(),
    ordem: i,
    itens: [...]
  });
}

// Medir tempo de busca
console.time("buscar-previsoes");
const resultado = await buscarPrevisoesPorObra("obra-id");
console.timeEnd("buscar-previsoes");
```

**Resultado esperado:**
- [ ] Todas as previsões criadas
- [ ] Busca rápida (< 500ms)
- [ ] Sem erros de memória

### 6.2. Teste: Visão Gerencial com Muitos Dados

```typescript
// Criar previsões com 100 itens cada
console.time("visao-gerencial");
const resultado = await buscarMedicoesAgrupadasPorVisaoGerencial("obra-id");
console.timeEnd("visao-gerencial");
```

**Resultado esperado:**
- [ ] Agrupamento correto
- [ ] Performance aceitável (< 2s)
- [ ] Sem timeout

---

## 7. Testes de Validação

### 7.1. Teste: Criar sem obraId

```typescript
const resultado = await criarPrevisaoMedicao({
  obraId: "", // VAZIO
  nome: "Teste",
  // ...
});
```

**Resultado esperado:**
- [ ] `resultado.success === false`
- [ ] Mensagem de erro clara

### 7.2. Teste: Criar sem itens

```typescript
const resultado = await criarPrevisaoMedicao({
  obraId: "obra-id",
  nome: "Teste",
  itens: [], // VAZIO
});
```

**Resultado esperado:**
- [ ] Previsão criada (itens opcionais)
- [ ] Ou erro se itens forem obrigatórios

### 7.3. Teste: Buscar ID inexistente

```typescript
const resultado = await buscarPrevisaoPorId("id-inexistente");
```

**Resultado esperado:**
- [ ] `resultado.success === true`
- [ ] `resultado.data === null`
- [ ] Sem erro de exceção

---

## 8. Testes de Vínculos

### 8.1. Teste: Verificar Vínculos Criados

```typescript
const previsao = await buscarPrevisaoPorId("previsao-id");
const item = previsao.data?.itens[0];

console.log("Vínculos:");
console.log("- itemOrcamentoId:", item?.itemOrcamentoId);
console.log("- itemCustoOrcadoId:", item?.itemCustoOrcadoId);
console.log("- itemCategorizacaoId:", item?.itemCategorizacaoId);
console.log("- itemVisaoGerencialId:", item?.itemVisaoGerencialId);
console.log("Categorização:");
console.log("- etapa:", item?.etapa);
console.log("- subEtapa:", item?.subEtapa);
console.log("- servicoSimplificado:", item?.servicoSimplificado);
```

**Resultado esperado:**
- [ ] Todos os vínculos preenchidos (se fornecidos)
- [ ] Categorização correta
- [ ] IDs válidos

### 8.2. Teste: Verificar Relacionamento com Versões

```typescript
const previsao = await buscarPrevisaoPorId("previsao-id");

console.log("Versões vinculadas:");
console.log("- versaoOrcamentoId:", previsao.data?.versaoOrcamentoId);
console.log("- versaoCustoOrcadoId:", previsao.data?.versaoCustoOrcadoId);
console.log("- versaoCategorizacaoId:", previsao.data?.versaoCategorizacaoId);
console.log("- versaoVisaoGerencialId:", previsao.data?.versaoVisaoGerencialId);
```

**Resultado esperado:**
- [ ] IDs das versões corretos
- [ ] Relacionamentos funcionando

---

## 9. Checklist Final de Testes

### Funcionalidades Básicas
- [ ] Criar previsão de medição
- [ ] Listar previsões de uma obra
- [ ] Buscar previsão por ID
- [ ] Atualizar previsão
- [ ] Deletar previsão
- [ ] Atualizar item de previsão

### Cálculos Automáticos
- [ ] Acumulados calculados corretamente
- [ ] Saldos calculados corretamente
- [ ] Percentuais calculados corretamente
- [ ] Recálculo após deletar previsão

### Visão Gerencial
- [ ] Agrupamento por etapa funciona
- [ ] Agrupamento por subetapa funciona
- [ ] Agrupamento por serviço funciona
- [ ] Totais corretos
- [ ] Histórico de medições correto

### APIs
- [ ] Todas as rotas respondem
- [ ] Status codes corretos
- [ ] Validações funcionando
- [ ] Erros tratados

### Frontend
- [ ] Cliente de API funciona
- [ ] Funções de formatação funcionam
- [ ] Hooks customizados funcionam
- [ ] Componentes de exemplo funcionam

### Performance
- [ ] Busca rápida (< 500ms)
- [ ] Criação rápida (< 1s)
- [ ] Visão gerencial aceitável (< 2s)
- [ ] Sem problemas de memória

### Vínculos
- [ ] Vínculo com ItemOrcamento funciona
- [ ] Vínculo com ItemCustoOrcado funciona
- [ ] Vínculo com ItemCategorizacao funciona
- [ ] Vínculo com ItemVisaoGerencial funciona
- [ ] Vínculo com versões funciona

---

## 10. Script de Teste Completo

```typescript
// arquivo: test-previsoes-medicao.ts
import {
  criarPrevisaoMedicao,
  buscarPrevisoesPorObra,
  buscarPrevisaoPorId,
  atualizarPrevisaoMedicao,
  deletarPrevisaoMedicao,
  buscarMedicoesAgrupadasPorVisaoGerencial,
} from "@/app/actions/previsoes-medicao";

async function testarSistemaCompleto() {
  console.log("🧪 Iniciando testes...\n");

  // 1. Criar previsão
  console.log("1️⃣ Testando criação de previsão...");
  const criacao = await criarPrevisaoMedicao({
    obraId: "obra-id",
    nome: "Medição Teste",
    dataPrevisao: new Date(),
    ordem: 1,
    tipo: "QUANTIDADE",
    itens: [{
      itemOrcamentoId: "item-id",
      quantidadePrevista: 100,
      percentualPrevisto: 25,
      valorPrevisto: 50000,
      etapa: "INFRAESTRUTURA",
      subEtapa: "FUNDAÇÃO",
      servicoSimplificado: "Concretagem",
    }],
  });
  console.log(criacao.success ? "✅ Sucesso" : "❌ Falha");

  // 2. Buscar previsões
  console.log("\n2️⃣ Testando busca de previsões...");
  const busca = await buscarPrevisoesPorObra("obra-id");
  console.log(busca.success ? "✅ Sucesso" : "❌ Falha");
  console.log(`   Encontradas: ${busca.data?.length || 0} previsões`);

  // 3. Buscar por ID
  if (criacao.data?.id) {
    console.log("\n3️⃣ Testando busca por ID...");
    const buscaPorId = await buscarPrevisaoPorId(criacao.data.id);
    console.log(buscaPorId.success ? "✅ Sucesso" : "❌ Falha");
  }

  // 4. Atualizar
  if (criacao.data?.id) {
    console.log("\n4️⃣ Testando atualização...");
    const atualizacao = await atualizarPrevisaoMedicao(criacao.data.id, {
      nome: "Medição Teste Atualizada",
    });
    console.log(atualizacao.success ? "✅ Sucesso" : "❌ Falha");
  }

  // 5. Visão Gerencial
  console.log("\n5️⃣ Testando visão gerencial...");
  const visao = await buscarMedicoesAgrupadasPorVisaoGerencial("obra-id");
  console.log(visao.success ? "✅ Sucesso" : "❌ Falha");

  // 6. Deletar
  if (criacao.data?.id) {
    console.log("\n6️⃣ Testando deleção...");
    const delecao = await deletarPrevisaoMedicao(criacao.data.id);
    console.log(delecao.success ? "✅ Sucesso" : "❌ Falha");
  }

  console.log("\n✅ Testes concluídos!");
}

// Executar testes
testarSistemaCompleto();
```

---

## 📝 Conclusão

Use este guia para validar todas as funcionalidades do sistema de previsões de medição. Execute os testes em ordem e marque os checkboxes à medida que cada teste passar.

**Boa sorte com os testes! 🚀**
