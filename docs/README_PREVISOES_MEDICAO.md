# 🎯 Sistema de Previsões de Medição - Guia Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Sistema](#estrutura-do-sistema)
3. [Arquivos Criados](#arquivos-criados)
4. [Como Usar](#como-usar)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Próximos Passos](#próximos-passos)

## 🔍 Visão Geral

O sistema de previsões de medição foi criado para gerenciar e acompanhar medições de obra, com vínculos completos entre:

- ✅ **Planilha Contratual** (ItemOrcamento)
- ✅ **Custos Orçados** (ItemCustoOrcado)
- ✅ **Categorização** (ItemCategorizacao)
- ✅ **Visão Gerencial** (ItemVisaoGerencial)

### Funcionalidades Principais

- 📊 Criar previsões de medição com múltiplos itens
- 🔗 Vincular medições com todas as planilhas
- 📈 Calcular automaticamente valores acumulados
- 💰 Calcular saldos de serviços
- 📱 Visualizar medições agrupadas por visão gerencial
- 🎯 Acompanhar medições por etapa/subetapa/serviço

## 🏗️ Estrutura do Sistema

### Modelos de Dados

```
PrevisaoMedicao (Cabeçalho)
├── id, nome, numero, dataPrevisao
├── tipo (QUANTIDADE | PERCENTUAL)
├── status (PREVISTA | EM_MEDICAO | REALIZADA | CANCELADA)
├── versaoOrcamentoId (FK)
├── versaoCustoOrcadoId (FK)
├── versaoCategorizacaoId (FK)
└── versaoVisaoGerencialId (FK)

ItemPrevisaoMedicao (Detalhe)
├── Vínculos com Planilhas:
│   ├── itemOrcamentoId (FK → ItemOrcamento)
│   ├── itemCustoOrcadoId (FK → ItemCustoOrcado)
│   ├── itemCategorizacaoId (FK → ItemCategorizacao)
│   └── itemVisaoGerencialId (FK → ItemVisaoGerencial)
├── Categorização (desnormalizado):
│   ├── etapa
│   ├── subEtapa
│   └── servicoSimplificado
├── Valores da Medição:
│   ├── quantidadePrevista
│   ├── percentualPrevisto
│   └── valorPrevisto
├── Valores Acumulados (calculados):
│   ├── quantidadeAcumulada
│   ├── percentualAcumulado
│   └── valorAcumulado
└── Saldos (calculados):
    ├── saldoQuantidade
    ├── saldoPercentual
    └── saldoValor
```

## 📁 Arquivos Criados

### 1. Schema do Banco de Dados

**Arquivo:** `prisma/schema.prisma`

Modelos adicionados:
- `PrevisaoMedicao`
- `ItemPrevisaoMedicao`
- Enums: `TipoMedicao`, `StatusPrevisaoMedicao`

### 2. Actions (Lógica de Negócio)

**Arquivo:** `app/actions/previsoes-medicao.ts`

Funções disponíveis:
- `criarPrevisaoMedicao()` - Criar nova previsão com itens
- `atualizarPrevisaoMedicao()` - Atualizar previsão existente
- `deletarPrevisaoMedicao()` - Deletar previsão
- `buscarPrevisoesPorObra()` - Listar previsões de uma obra
- `buscarPrevisaoPorId()` - Buscar previsão específica
- `atualizarItemPrevisao()` - Atualizar item de previsão
- `buscarMedicoesAgrupadasPorVisaoGerencial()` - Visão consolidada
- `buscarResumoMedicoesPorItem()` - Resumo de medições por item
- `recalcularAcumulados()` - Recalcular acumulados (automático)

### 3. Rotas de API

**Arquivos criados:**

```
app/api/previsoes-medicao/
├── route.ts                          (GET, POST)
├── [id]/route.ts                     (GET, PUT, DELETE)
├── itens/[itemId]/route.ts          (PUT)
├── visao-gerencial/route.ts         (GET)
└── resumo-item/route.ts             (GET)
```

**Endpoints:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/previsoes-medicao?obraId={id}` | Listar previsões |
| POST | `/api/previsoes-medicao` | Criar previsão |
| GET | `/api/previsoes-medicao/{id}` | Buscar previsão |
| PUT | `/api/previsoes-medicao/{id}` | Atualizar previsão |
| DELETE | `/api/previsoes-medicao/{id}` | Deletar previsão |
| PUT | `/api/previsoes-medicao/itens/{itemId}` | Atualizar item |
| GET | `/api/previsoes-medicao/visao-gerencial?obraId={id}` | Visão gerencial |
| GET | `/api/previsoes-medicao/resumo-item?obraId={id}&itemOrcamentoId={id}` | Resumo por item |

### 4. Cliente de API (Frontend)

**Arquivo:** `lib/api/previsoes-medicao-client.ts`

Funções helper para uso no frontend:
- Todas as funções de API encapsuladas
- Funções auxiliares de formatação
- Tipos TypeScript completos

### 5. Documentação

**Arquivos:**
- `docs/BACKEND_PREVISOES_MEDICAO.md` - Documentação técnica completa
- `docs/EXEMPLO_USO_PREVISOES_MEDICAO.tsx` - Exemplos de componentes React
- `docs/README_PREVISOES_MEDICAO.md` - Este arquivo (guia completo)

## 🚀 Como Usar

### 1. Preparação do Banco de Dados

O banco de dados já foi sincronizado com o comando `prisma db push`.

Para regenerar o Prisma Client (se necessário):

```bash
npx prisma generate
```

### 2. Usando as Actions no Servidor

```typescript
import {
  criarPrevisaoMedicao,
  buscarPrevisoesPorObra,
} from "@/app/actions/previsoes-medicao";

// Criar uma previsão
const resultado = await criarPrevisaoMedicao({
  obraId: "uuid-da-obra",
  nome: "Medição 01 - Janeiro/2024",
  dataPrevisao: "2024-01-31",
  ordem: 1,
  tipo: "QUANTIDADE",
  versaoOrcamentoId: "uuid-versao",
  itens: [
    {
      itemOrcamentoId: "uuid-item",
      etapa: "INFRAESTRUTURA",
      subEtapa: "MOVIMENTAÇÃO DE SOLO",
      servicoSimplificado: "Escavação",
      quantidadePrevista: 100,
      percentualPrevisto: 25,
      valorPrevisto: 50000,
    },
  ],
});

if (resultado.success) {
  console.log("Previsão criada:", resultado.data);
} else {
  console.error("Erro:", resultado.error);
}
```

### 3. Usando as APIs no Frontend

```typescript
import {
  buscarPrevisoesPorObra,
  criarPrevisaoMedicao,
} from "@/lib/api/previsoes-medicao-client";

// Listar previsões
const previsoes = await buscarPrevisoesPorObra(obraId);

// Criar previsão
const novaPrevisao = await criarPrevisaoMedicao({
  obraId,
  nome: "Medição 01",
  dataPrevisao: "2024-01-31",
  ordem: 1,
  itens: [...],
});
```

### 4. Usando em Componentes React

Veja exemplos completos em: `docs/EXEMPLO_USO_PREVISOES_MEDICAO.tsx`

```tsx
import { usePrevisoesMedicao } from "@/docs/EXEMPLO_USO_PREVISOES_MEDICAO";

function MeuComponente() {
  const { previsoes, loading, error, recarregar } = 
    usePrevisoesMedicao(obraId);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {previsoes.map(previsao => (
        <div key={previsao.id}>{previsao.nome}</div>
      ))}
    </div>
  );
}
```

## 🔄 Fluxo de Dados

### Criação de Previsão

```
1. Usuário preenche formulário
   ├── Nome da medição
   ├── Data prevista
   ├── Tipo (quantidade/percentual)
   └── Itens a medir

2. Frontend chama API
   POST /api/previsoes-medicao

3. Backend executa action
   ├── Busca próximo número sequencial
   ├── Cria PrevisaoMedicao
   ├── Cria ItemPrevisaoMedicao (múltiplos)
   └── Recalcula acumulados

4. Sistema calcula automaticamente
   ├── Valores acumulados
   ├── Percentuais acumulados
   └── Saldos restantes

5. Retorna previsão criada
```

### Cálculo de Acumulados

```
1. Após criar/atualizar/deletar previsão

2. Sistema agrupa itens
   ├── Por itemOrcamentoId ou itemCustoOrcadoId
   └── Busca quantidade total do item original

3. Ordena previsões por data

4. Calcula progressivamente
   ├── quantidade acumulada += quantidade prevista
   ├── percentual acumulado = (acumulado / total) * 100
   └── saldo = total - acumulado

5. Atualiza cada item com valores calculados
```

### Visualização Agrupada

```
1. Frontend solicita visão gerencial
   GET /api/previsoes-medicao/visao-gerencial?obraId=xxx

2. Backend agrupa medições
   Etapa
   └── SubEtapa
       └── Serviço Simplificado
           ├── Quantidade total
           ├── Quantidade medida
           ├── Percentual medido
           └── Histórico de medições

3. Retorna estrutura hierárquica
```

## 💡 Exemplos Práticos

### Exemplo 1: Criar Previsão Simples

```typescript
const previsao = await criarPrevisaoMedicao({
  obraId: "123",
  nome: "Medição 01 - Jan/2024",
  dataPrevisao: "2024-01-31",
  ordem: 1,
  tipo: "QUANTIDADE",
  versaoOrcamentoId: "v1",
  itens: [
    {
      itemOrcamentoId: "item-1",
      itemCustoOrcadoId: "custo-1",
      etapa: "INFRAESTRUTURA",
      subEtapa: "FUNDAÇÃO",
      servicoSimplificado: "Concretagem",
      quantidadePrevista: 100,
      percentualPrevisto: 25,
      valorPrevisto: 50000,
    },
  ],
});
```

### Exemplo 2: Buscar Visão Gerencial

```typescript
const medicoes = await buscarMedicoesAgrupadasPorVisaoGerencial(obraId);

// Acessar dados:
const infraestrutura = medicoes["INFRAESTRUTURA"];
const fundacao = infraestrutura.subEtapas["FUNDAÇÃO"];
const concretagem = fundacao.servicos["Concretagem"];

console.log(concretagem.percentualMedido); // Ex: 25.50
console.log(concretagem.valorMedido); // Ex: 125000.00
```

### Exemplo 3: Acompanhar Item Específico

```typescript
const resumo = await buscarResumoMedicoesPorItem(
  obraId,
  itemOrcamentoId
);

resumo.forEach(item => {
  console.log(`Medição: ${item.previsaoMedicao.nome}`);
  console.log(`Quantidade: ${item.quantidadePrevista}`);
  console.log(`Acumulado: ${item.quantidadeAcumulada}`);
  console.log(`Saldo: ${item.saldoQuantidade}`);
});
```

## 🎨 Integração com Frontend Existente

### Atualizar PrevisoesMedicoesContent.tsx

O componente existente em:
`app/eng/plan-medicoes/[construtoraId]/[obraId]/previsoes-medicoes/PrevisoesMedicoesContent.tsx`

Pode ser atualizado para usar as novas APIs:

```tsx
// Substituir useState por chamada à API
const { previsoes, loading, error, recarregar } = 
  usePrevisoesMedicao(obraId);

// Substituir função de salvar local por API
async function salvarMedicao(dados) {
  await criarPrevisaoMedicao(dados);
  await recarregar();
}
```

## 📊 Diagrama de Relacionamentos

```
┌─────────────────┐
│      Obra       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼──────────┐
│ PrevisaoMedicao   │
│ - numero          │
│ - nome            │
│ - dataPrevisao    │
│ - status          │
└────────┬──────────┘
         │
         │ 1:N
         │
┌────────▼──────────────────┐
│ ItemPrevisaoMedicao       │
├───────────────────────────┤
│ Vínculos:                 │
│ - itemOrcamentoId     ────┼──► ItemOrcamento
│ - itemCustoOrcadoId   ────┼──► ItemCustoOrcado
│ - itemCategorizacaoId ────┼──► ItemCategorizacao
│ - itemVisaoGerencialId ───┼──► ItemVisaoGerencial
├───────────────────────────┤
│ Categorização:            │
│ - etapa                   │
│ - subEtapa                │
│ - servicoSimplificado     │
├───────────────────────────┤
│ Valores:                  │
│ - quantidadePrevista      │
│ - valorPrevisto           │
│ - quantidadeAcumulada     │
│ - saldoQuantidade         │
└───────────────────────────┘
```

## 🔧 Próximos Passos

### Sugeridos para Implementação

1. **Frontend**
   - [ ] Atualizar `PrevisoesMedicoesContent.tsx` para usar as novas APIs
   - [ ] Criar componente de visualização da Visão Gerencial
   - [ ] Adicionar gráficos de acompanhamento
   - [ ] Implementar filtros e buscas

2. **Relatórios**
   - [ ] Exportar medições para Excel
   - [ ] Gerar PDF de medições aprovadas
   - [ ] Criar dashboard de indicadores

3. **Funcionalidades Avançadas**
   - [ ] Aprovar/rejeitar medições
   - [ ] Vincular medições com fotos 360°
   - [ ] Histórico de alterações
   - [ ] Comentários e observações por item
   - [ ] Notificações automáticas

4. **Integrações**
   - [ ] Integrar com modelo `Medicao` existente
   - [ ] Vincular com cronograma
   - [ ] Vincular com orçamento executado

## 📚 Referências

- **Documentação Técnica:** `docs/BACKEND_PREVISOES_MEDICAO.md`
- **Exemplos de Código:** `docs/EXEMPLO_USO_PREVISOES_MEDICAO.tsx`
- **Schema do Banco:** `prisma/schema.prisma`
- **Actions:** `app/actions/previsoes-medicao.ts`
- **APIs:** `app/api/previsoes-medicao/`
- **Cliente Frontend:** `lib/api/previsoes-medicao-client.ts`

## 🎯 Resumo

✅ **Banco de Dados:** Modelos criados e sincronizados
✅ **Backend:** Actions completas com lógica de negócio
✅ **APIs:** Endpoints RESTful funcionais
✅ **Frontend:** Cliente e exemplos de uso
✅ **Vínculos:** Todas as planilhas conectadas
✅ **Cálculos:** Acumulados e saldos automáticos
✅ **Documentação:** Completa e detalhada

O sistema está **pronto para uso** e pode ser integrado ao frontend existente!
