# 📊 Backend de Previsões de Medição

## Visão Geral

Este documento descreve a estrutura completa do backend para gerenciamento de previsões de medição, incluindo os vínculos com as planilhas contratual, de custos orçados, de categorização e de visão gerencial.

## 🏗️ Arquitetura

### Modelos de Dados

#### 1. PrevisaoMedicao (Cabeçalho)

Representa uma previsão de medição (ex: "Medição 01 - Janeiro/2024").

```prisma
model PrevisaoMedicao {
  id                      String
  obraId                  String
  nome                    String
  numero                  Int (sequencial por obra)
  dataPrevisao            DateTime
  ordem                   Int
  visivel                 Boolean
  tipo                    TipoMedicao (QUANTIDADE | PERCENTUAL)
  observacoes             String?
  status                  StatusPrevisaoMedicao
  // Vínculos com versões
  versaoOrcamentoId       String?
  versaoCustoOrcadoId     String?
  versaoCategorizacaoId   String?
  versaoVisaoGerencialId  String?
}
```

**Campos importantes:**
- `numero`: Número sequencial automático (1, 2, 3...)
- `tipo`: Define se a medição é por QUANTIDADE ou PERCENTUAL
- `status`: PREVISTA | EM_MEDICAO | REALIZADA | CANCELADA
- `versaoOrcamentoId`: Vincula com a versão da planilha contratual usada
- `versaoCustoOrcadoId`: Vincula com a versão de custos usada
- `versaoCategorizacaoId`: Vincula com a versão de categorização usada
- `versaoVisaoGerencialId`: Vincula com a versão de visão gerencial usada

#### 2. ItemPrevisaoMedicao (Detalhe)

Representa cada item medido em uma previsão de medição.

```prisma
model ItemPrevisaoMedicao {
  id                   String
  previsaoMedicaoId    String
  // Vínculos com itens das planilhas
  itemOrcamentoId      String? (ItemOrcamento)
  itemCustoOrcadoId    String? (ItemCustoOrcado)
  itemCategorizacaoId  String? (ItemCategorizacao)
  itemVisaoGerencialId String? (ItemVisaoGerencial)
  // Categorização (desnormalizado)
  etapa                String?
  subEtapa             String?
  servicoSimplificado  String?
  // Valores da medição
  quantidadePrevista   Decimal
  percentualPrevisto   Decimal
  valorPrevisto        Decimal
  // Valores acumulados
  quantidadeAcumulada  Decimal
  percentualAcumulado  Decimal
  valorAcumulado       Decimal
  // Saldos
  saldoQuantidade      Decimal
  saldoPercentual      Decimal
  saldoValor           Decimal
}
```

**Campos importantes:**
- `itemOrcamentoId`: Vincula com item da planilha contratual (VersaoOrcamento)
- `itemCustoOrcadoId`: Vincula com item de custos orçados (VersaoCustoOrcado)
- `itemCategorizacaoId`: Vincula com item de categorização (VersaoCategorizacao)
- `itemVisaoGerencialId`: Vincula com item da visão gerencial (VersaoVisaoGerencial)
- `etapa`, `subEtapa`, `servicoSimplificado`: Campos desnormalizados para consultas rápidas
- Valores acumulados e saldos são calculados automaticamente

## 🔗 Vínculos Entre Planilhas

### Fluxo de Vinculação

```
┌─────────────────────────────────────────────────────────────┐
│                    PrevisaoMedicao                          │
│  - versaoOrcamentoId                                        │
│  - versaoCustoOrcadoId                                      │
│  - versaoCategorizacaoId                                    │
│  - versaoVisaoGerencialId                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
┌───────────────▼────────┐  ┌──────────▼──────────────────┐
│  ItemPrevisaoMedicao   │  │  Medição é vinculada com:   │
│                        │  │                              │
│  Vínculos:             │  │  1. ItemOrcamento           │
│  - itemOrcamentoId     │  │     (Planilha Contratual)   │
│  - itemCustoOrcadoId   │  │                              │
│  - itemCategorizacaoId │  │  2. ItemCustoOrcado         │
│  - itemVisaoGerencialId│  │     (Custos Orçados)        │
│                        │  │                              │
│  Categorização:        │  │  3. ItemCategorizacao       │
│  - etapa               │  │     (Categorização)         │
│  - subEtapa            │  │                              │
│  - servicoSimplificado │  │  4. ItemVisaoGerencial      │
│                        │  │     (Visão Gerencial)       │
└────────────────────────┘  └─────────────────────────────┘
```

### Como Funciona o Vínculo

1. **Planilha Contratual → Medição**
   - Cada item medido referencia `itemOrcamentoId` (ou `itemCustoOrcadoId`)
   - Permite rastrear qual item da planilha contratual está sendo medido

2. **Categorização → Medição**
   - Cada item tem campos `etapa`, `subEtapa`, `servicoSimplificado`
   - Estes campos são preenchidos a partir do `ItemCategorizacao` vinculado
   - Permite agrupar medições por categorização

3. **Visão Gerencial → Medição**
   - Cada item pode referenciar `itemVisaoGerencialId`
   - Permite consolidar medições na visão gerencial agrupada

4. **Cálculo de Acumulados**
   - O sistema recalcula automaticamente os acumulados após cada operação
   - Agrupa medições por item (usando `itemOrcamentoId` ou `itemCustoOrcadoId`)
   - Calcula saldos (quantidade total - quantidade acumulada)

## 📡 APIs Disponíveis

### 1. Listar Previsões por Obra

```
GET /api/previsoes-medicao?obraId={obraId}
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "nome": "Medição 01 - Janeiro/2024",
    "numero": 1,
    "dataPrevisao": "2024-01-31T00:00:00.000Z",
    "tipo": "QUANTIDADE",
    "status": "PREVISTA",
    "itens": [...]
  }
]
```

### 2. Buscar Previsão por ID

```
GET /api/previsoes-medicao/{id}
```

**Resposta:**
```json
{
  "id": "uuid",
  "nome": "Medição 01",
  "numero": 1,
  "dataPrevisao": "2024-01-31T00:00:00.000Z",
  "itens": [...],
  "obra": {
    "id": "uuid",
    "nome": "Obra XYZ",
    "codigo": "CT-001"
  }
}
```

### 3. Criar Nova Previsão

```
POST /api/previsoes-medicao
```

**Body:**
```json
{
  "obraId": "uuid",
  "nome": "Medição 01 - Janeiro/2024",
  "dataPrevisao": "2024-01-31",
  "ordem": 1,
  "visivel": true,
  "tipo": "QUANTIDADE",
  "versaoOrcamentoId": "uuid",
  "versaoCustoOrcadoId": "uuid",
  "versaoCategorizacaoId": "uuid",
  "itens": [
    {
      "itemOrcamentoId": "uuid",
      "itemCustoOrcadoId": "uuid",
      "itemCategorizacaoId": "uuid",
      "etapa": "INFRAESTRUTURA E CONTENÇÕES",
      "subEtapa": "MOVIMENTAÇÃO DE SOLO",
      "servicoSimplificado": "Escavação e Reaterro Mecanizado",
      "quantidadePrevista": 100.50,
      "percentualPrevisto": 25.0,
      "valorPrevisto": 50000.00
    }
  ]
}
```

**Resposta:**
```json
{
  "id": "uuid",
  "nome": "Medição 01 - Janeiro/2024",
  "numero": 1,
  "itens": [...]
}
```

### 4. Atualizar Previsão

```
PUT /api/previsoes-medicao/{id}
```

**Body:**
```json
{
  "nome": "Medição 01 - Janeiro/2024 (Revisada)",
  "dataPrevisao": "2024-02-15",
  "observacoes": "Revisão após análise"
}
```

### 5. Deletar Previsão

```
DELETE /api/previsoes-medicao/{id}
```

**Resposta:**
```json
{
  "message": "Previsão deletada com sucesso"
}
```

### 6. Atualizar Item de Previsão

```
PUT /api/previsoes-medicao/itens/{itemId}
```

**Body:**
```json
{
  "quantidadePrevista": 150.75,
  "percentualPrevisto": 30.0,
  "valorPrevisto": 75000.00
}
```

### 7. Buscar Medições Agrupadas por Visão Gerencial

```
GET /api/previsoes-medicao/visao-gerencial?obraId={obraId}&versaoVisaoGerencialId={versaoId}
```

**Resposta:**
```json
{
  "INFRAESTRUTURA E CONTENÇÕES": {
    "etapa": "INFRAESTRUTURA E CONTENÇÕES",
    "subEtapas": {
      "MOVIMENTAÇÃO DE SOLO": {
        "subEtapa": "MOVIMENTAÇÃO DE SOLO",
        "servicos": {
          "Escavação e Reaterro Mecanizado": {
            "servicoSimplificado": "Escavação e Reaterro Mecanizado",
            "quantidadeTotal": 1000.00,
            "valorTotal": 500000.00,
            "quantidadeMedida": 250.00,
            "valorMedido": 125000.00,
            "percentualMedido": 25.0,
            "medicoes": [
              {
                "previsaoId": "uuid",
                "nome": "Medição 01",
                "dataPrevisao": "2024-01-31T00:00:00.000Z",
                "quantidade": 100.00,
                "valor": 50000.00
              },
              {
                "previsaoId": "uuid",
                "nome": "Medição 02",
                "dataPrevisao": "2024-02-28T00:00:00.000Z",
                "quantidade": 150.00,
                "valor": 75000.00
              }
            ]
          }
        }
      }
    }
  }
}
```

### 8. Buscar Resumo de Medições por Item

```
GET /api/previsoes-medicao/resumo-item?obraId={obraId}&itemOrcamentoId={itemId}
```

ou

```
GET /api/previsoes-medicao/resumo-item?obraId={obraId}&itemCustoOrcadoId={itemId}
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "quantidadePrevista": "100.00",
    "percentualPrevisto": "25.00",
    "valorPrevisto": "50000.00",
    "quantidadeAcumulada": "100.00",
    "valorAcumulado": "50000.00",
    "saldoQuantidade": "300.00",
    "saldoValor": "150000.00",
    "previsaoMedicao": {
      "id": "uuid",
      "nome": "Medição 01",
      "numero": 1,
      "dataPrevisao": "2024-01-31T00:00:00.000Z",
      "status": "PREVISTA"
    }
  }
]
```

## 🔄 Fluxo de Uso

### 1. Criar uma Previsão de Medição

```javascript
const response = await fetch('/api/previsoes-medicao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    obraId: 'obra-uuid',
    nome: 'Medição 01 - Janeiro/2024',
    dataPrevisao: '2024-01-31',
    ordem: 1,
    tipo: 'QUANTIDADE',
    versaoOrcamentoId: 'versao-uuid',
    itens: [
      {
        itemOrcamentoId: 'item-uuid',
        itemCustoOrcadoId: 'item-custo-uuid',
        etapa: 'INFRAESTRUTURA',
        subEtapa: 'MOVIMENTAÇÃO DE SOLO',
        servicoSimplificado: 'Escavação',
        quantidadePrevista: 100,
        percentualPrevisto: 25,
        valorPrevisto: 50000
      }
    ]
  })
});

const previsao = await response.json();
```

### 2. Visualizar Medições Agrupadas por Visão Gerencial

```javascript
const response = await fetch(
  `/api/previsoes-medicao/visao-gerencial?obraId=${obraId}`
);
const medicoes = await response.json();

// Estrutura hierárquica:
// medicoes[etapa].subEtapas[subEtapa].servicos[servicoSimplificado]
```

### 3. Acompanhar Saldo de um Item

```javascript
const response = await fetch(
  `/api/previsoes-medicao/resumo-item?obraId=${obraId}&itemOrcamentoId=${itemId}`
);
const resumo = await response.json();

// Cada item do array contém:
// - quantidadePrevista: quantidade medida nesta previsão
// - quantidadeAcumulada: total acumulado até esta previsão
// - saldoQuantidade: quantidade restante do item
```

## 📊 Funcionalidades Automáticas

### 1. Numeração Sequencial

O sistema atribui automaticamente números sequenciais às previsões:
- Previsão 01, 02, 03...
- Baseado na ordem de criação por obra

### 2. Cálculo de Acumulados

Após cada operação (criar, atualizar, deletar), o sistema:
1. Busca todas as previsões da obra ordenadas por data
2. Agrupa itens pelo mesmo `itemOrcamentoId` ou `itemCustoOrcadoId`
3. Calcula os acumulados progressivamente
4. Atualiza os saldos de cada item

### 3. Vinculação Múltipla

Cada item medido pode ter vínculos com:
- `ItemOrcamento` (planilha contratual)
- `ItemCustoOrcado` (custos orçados)
- `ItemCategorizacao` (categorização)
- `ItemVisaoGerencial` (visão gerencial)

Isso permite:
- Rastrear medições na planilha contratual
- Calcular custos medidos vs orçados
- Agrupar medições por categorização
- Consolidar na visão gerencial

## 🎯 Casos de Uso

### Caso 1: Medição por Quantidade

```json
{
  "tipo": "QUANTIDADE",
  "itens": [
    {
      "quantidadePrevista": 100.50,
      "percentualPrevisto": 25.0,
      "valorPrevisto": 50000.00
    }
  ]
}
```

### Caso 2: Medição por Percentual

```json
{
  "tipo": "PERCENTUAL",
  "itens": [
    {
      "quantidadePrevista": 0,
      "percentualPrevisto": 25.0,
      "valorPrevisto": 50000.00
    }
  ]
}
```

### Caso 3: Acompanhamento Consolidado

Use a API de visão gerencial para ver:
- Total medido por etapa
- Total medido por subetapa
- Total medido por serviço simplificado
- Histórico de medições por categoria

## 🔐 Validações

O backend valida automaticamente:
- `obraId` é obrigatório
- Cada previsão tem número único por obra
- Acumulados não podem ser negativos
- Saldos não podem ser negativos

## 📝 Observações Importantes

1. **Desnormalização**: Os campos `etapa`, `subEtapa` e `servicoSimplificado` são desnormalizados no `ItemPrevisaoMedicao` para facilitar consultas e agrupamentos.

2. **Versionamento**: Cada previsão pode referenciar versões específicas das planilhas (contratual, custos, categorização, visão gerencial), permitindo rastrear mudanças ao longo do tempo.

3. **Cálculos Automáticos**: Acumulados e saldos são calculados automaticamente, garantindo consistência.

4. **Performance**: Índices foram criados nas colunas mais consultadas (`obraId`, `itemOrcamentoId`, `etapa`, `subEtapa`, etc.).

## 🚀 Próximos Passos

1. Integrar com o frontend de previsões de medição
2. Criar relatórios de acompanhamento
3. Implementar exportação para Excel/PDF
4. Adicionar notificações de saldo baixo
5. Criar dashboard de medições realizadas vs previstas
