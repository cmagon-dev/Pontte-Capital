# 📊 Estrutura do Banco de Dados - Pontte Capital

## Diagrama de Relacionamentos

```
┌──────────────┐
│   USUARIOS   │ (1)
└──────────────┘
     │ (criou/gerencia)

┌──────────────┐
│    FUNDOS    │ (N) ─────┐
└──────────────┘          │
                          │ (financia)
┌──────────────┐          │
│ CONSTRUTORAS │ (1) ─────┼─────┐
└──────────────┘          │     │
     │                    │     │
     │ (1:N)              │     │ (possui)
     ├── SOCIOS           │     │
     ├── CONTAS_BANCARIAS │     │
     └── DOCUMENTOS       │     │
                          │     │
┌──────────────┐          │     │
│  CONTRATANTES│ (1) ─────┼─────┼──────┐
└──────────────┘          │     │      │
     │                    │     │      │ (contrata)
     └── FONTES_RECURSO   │     │      │
                          │     │      │
                    ┌─────▼─────▼──────▼──────┐
                    │        OBRAS             │ (CENTRAL)
                    └──────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
    ┌───────────▼───┐  ┌──────▼────┐  ┌────▼─────────┐
    │ PLANILHA      │  │  CUSTOS   │  │ CRONOGRAMA   │
    │ CONTRATUAL    │  │ ORÇADOS   │  │ VERSOES      │
    └───────┬───────┘  └──────┬────┘  └────┬─────────┘
            │                 │             │
            └── ITENS         └── ITENS     └── TAREFAS

┌──────────────┐
│   FIADORES   │ (1)
└──────────────┘
     │
     └── BENS

┌─────────────────────────┐
│ OPERACOES_FINANCEIRAS   │ (vinculada a CONSTRUTORAS e OBRAS)
└─────────────────────────┘
```

## 📋 Tabelas Principais

### 1. **USUARIOS** (Autenticação e Perfis)
- Gerenciamento de usuários do sistema
- Roles: admin, engenheiro, financeiro, etc.

### 2. **FUNDOS** (FIDC - Cessionários)
- Fundos de investimento que financiam as obras
- Relação: 1 Fundo → N Obras

### 3. **CONSTRUTORAS** (Cedentes)
- Empresas construtoras que executam as obras
- Relações:
  - 1 Construtora → N Sócios
  - 1 Construtora → 1 Conta Bancária
  - 1 Construtora → N Documentos
  - 1 Construtora → N Obras

### 4. **FIADORES** (Avalistas)
- Garantidores das operações
- Relação: 1 Fiador → N Bens

### 5. **CONTRATANTES** (Sacados)
- Órgãos públicos ou empresas que contratam
- Relação: 1 Contratante → N Fontes de Recurso
- Relação: 1 Contratante → N Obras

### 6. **OBRAS** (CENTRO - Entidade Central)
- Contratos de obra (centro de todas as relações)
- Relações:
  - N:1 com Construtora
  - N:1 com Contratante
  - N:1 com Fundo (opcional)
  - 1:N com Planilha Contratual
  - 1:N com Custos Orçados
  - 1:N com Cronograma Versões

### 7. **PLANILHA_CONTRATUAL** (Orçamento)
- Versões da planilha orçamentária
- Relação: 1 Planilha → N Itens (hierárquica)

### 8. **PLANILHA_ITENS**
- Itens da planilha (EAP hierárquica)
- Suporta níveis (agrupadores e itens)

### 9. **CUSTOS_ORCADOS**
- Versões de custos projetados
- Relação: 1 Custos → N Itens de Custo

### 10. **CRONOGRAMA_VERSOES**
- Versões do cronograma executivo
- Relação: 1 Versão → N Tarefas

### 11. **OPERACOES_FINANCEIRAS**
- Operações financeiras (à performar, performadas, etc.)
- Vinculadas a Construtora e Obra (opcional)

## 🔗 Vinculações Principais

### Hierarquia Obra → Módulos
```
OBRA (centro)
├── Planilha Contratual (versões)
│   └── Itens (hierárquico)
├── Custos Orçados (versões)
│   └── Itens de Custo
└── Cronograma (versões)
    └── Tarefas (com predecessoras)
```

### Vinculações Financeiras
- Fundos → Obras (financiamento)
- Construtoras → Obras (execução)
- Obras → Operações Financeiras (fluxo de caixa)

## 📊 Índices Recomendados

1. **Obras**: `construtoraId`, `fundoId`, `contratanteId`
2. **Planilha Itens**: `planilhaContratualId`, `nivel`
3. **Custos Itens**: `custosOrcadosId`
4. **Operações**: `construtoraId`, `obraId`, `statusFinanceiro`

## 🎯 Campos Importantes

### Versionamento
- `versaoId`, `nomeVersao`, `tipoVersao`, `ativa` (em Planilha, Custos, Cronograma)

### Controle Temporal
- `createdAt`, `updatedAt` (em todas as tabelas)

### Status
- `status` (Ativo/Inativo) em entidades principais
- `statusFinanceiro` (Aberto/Liquidado) em operações
