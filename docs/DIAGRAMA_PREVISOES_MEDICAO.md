# 📊 Diagramas - Sistema de Previsões de Medição

## 1. Diagrama de Entidades e Relacionamentos (ERD)

```mermaid
erDiagram
    OBRA ||--o{ PREVISAO_MEDICAO : "possui"
    PREVISAO_MEDICAO ||--o{ ITEM_PREVISAO_MEDICAO : "contém"
    
    PREVISAO_MEDICAO ||--o| VERSAO_ORCAMENTO : "referencia"
    PREVISAO_MEDICAO ||--o| VERSAO_CUSTO_ORCADO : "referencia"
    PREVISAO_MEDICAO ||--o| VERSAO_CATEGORIZACAO : "referencia"
    PREVISAO_MEDICAO ||--o| VERSAO_VISAO_GERENCIAL : "referencia"
    
    ITEM_PREVISAO_MEDICAO ||--o| ITEM_ORCAMENTO : "vincula"
    ITEM_PREVISAO_MEDICAO ||--o| ITEM_CUSTO_ORCADO : "vincula"
    ITEM_PREVISAO_MEDICAO ||--o| ITEM_CATEGORIZACAO : "vincula"
    ITEM_PREVISAO_MEDICAO ||--o| ITEM_VISAO_GERENCIAL : "vincula"
    
    OBRA {
        string id PK
        string nome
        string codigo
    }
    
    PREVISAO_MEDICAO {
        string id PK
        string obraId FK
        string nome
        int numero
        datetime dataPrevisao
        string tipo
        string status
        string versaoOrcamentoId FK
        string versaoCustoOrcadoId FK
        string versaoCategorizacaoId FK
        string versaoVisaoGerencialId FK
    }
    
    ITEM_PREVISAO_MEDICAO {
        string id PK
        string previsaoMedicaoId FK
        string itemOrcamentoId FK
        string itemCustoOrcadoId FK
        string itemCategorizacaoId FK
        string itemVisaoGerencialId FK
        string etapa
        string subEtapa
        string servicoSimplificado
        decimal quantidadePrevista
        decimal valorPrevisto
        decimal quantidadeAcumulada
        decimal valorAcumulado
        decimal saldoQuantidade
        decimal saldoValor
    }
    
    ITEM_ORCAMENTO {
        string id PK
        string codigo
        string discriminacao
        decimal quantidade
        decimal precoUnitarioVenda
    }
    
    ITEM_CUSTO_ORCADO {
        string id PK
        string codigo
        decimal valorMaterial
        decimal valorMaoDeObra
        decimal custoTotal
    }
    
    ITEM_CATEGORIZACAO {
        string id PK
        string codigo
        string etapa
        string subEtapa
        string servicoSimplificado
    }
    
    ITEM_VISAO_GERENCIAL {
        string id PK
        string codigo
        string discriminacao
        decimal custoTotal
        decimal precoTotalVenda
    }
```

## 2. Fluxo de Criação de Previsão

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as API
    participant A as Actions
    participant DB as Banco de Dados
    
    U->>F: Preenche formulário
    F->>F: Valida dados
    F->>API: POST /api/previsoes-medicao
    API->>A: criarPrevisaoMedicao(dados)
    
    A->>DB: Buscar último número
    DB-->>A: numero = N
    
    A->>DB: Criar PrevisaoMedicao
    A->>DB: Criar ItemPrevisaoMedicao (múltiplos)
    
    A->>A: recalcularAcumulados(obraId)
    
    A->>DB: Buscar previsões ordenadas
    DB-->>A: Lista de previsões
    
    loop Para cada item
        A->>DB: Buscar quantidade total
        A->>A: Calcular acumulados
        A->>A: Calcular saldos
        A->>DB: Atualizar item com valores
    end
    
    A-->>API: { success: true, data: previsao }
    API-->>F: JSON previsão criada
    F-->>U: Exibe mensagem de sucesso
```

## 3. Fluxo de Cálculo de Acumulados

```mermaid
flowchart TD
    A[Criar/Atualizar/Deletar Previsão] --> B[Recalcular Acumulados]
    B --> C[Buscar todas previsões da obra]
    C --> D[Ordenar por data + número]
    D --> E[Agrupar itens por código]
    
    E --> F[Para cada item]
    F --> G[Buscar quantidade total original]
    G --> H[Inicializar acumulados = 0]
    
    H --> I[Para cada previsão ordenada]
    I --> J[acumulado += quantidade prevista]
    J --> K[Calcular percentual acumulado]
    K --> L[Calcular saldo = total - acumulado]
    L --> M[Atualizar item no banco]
    
    M --> N{Mais previsões?}
    N -->|Sim| I
    N -->|Não| O[Fim]
```

## 4. Estrutura de Vínculos entre Planilhas

```mermaid
flowchart LR
    PM[PrevisaoMedicao]
    IPM[ItemPrevisaoMedicao]
    
    PM -->|1:N| IPM
    
    IPM -->|N:1| IO[ItemOrcamento<br/>Planilha Contratual]
    IPM -->|N:1| ICO[ItemCustoOrcado<br/>Custos Orçados]
    IPM -->|N:1| IC[ItemCategorizacao<br/>Categorização]
    IPM -->|N:1| IVG[ItemVisaoGerencial<br/>Visão Gerencial]
    
    IO -->|código| Base[Código Base]
    ICO -->|código| Base
    IC -->|código| Base
    
    IC -->|etapa<br/>subEtapa<br/>serviço| IPM
    
    style PM fill:#e1f5ff
    style IPM fill:#fff4e1
    style IO fill:#e8f5e9
    style ICO fill:#fff3e0
    style IC fill:#f3e5f5
    style IVG fill:#fce4ec
```

## 5. Fluxo de Visualização por Visão Gerencial

```mermaid
flowchart TD
    A[Frontend solicita visão gerencial] --> B[GET /api/previsoes-medicao/visao-gerencial]
    B --> C[Buscar todas previsões da obra]
    C --> D[Buscar itens de medição]
    
    D --> E[Inicializar estrutura hierárquica]
    E --> F[Para cada item]
    
    F --> G{Item tem categorização?}
    G -->|Sim| H[Agrupar por Etapa]
    H --> I[Agrupar por SubEtapa]
    I --> J[Agrupar por Serviço]
    
    J --> K[Somar quantidades]
    K --> L[Somar valores]
    L --> M[Calcular percentuais]
    M --> N[Adicionar ao histórico]
    
    G -->|Não| O[Pular item]
    
    N --> P{Mais itens?}
    P -->|Sim| F
    P -->|Não| Q[Retornar estrutura agrupada]
    
    Q --> R[Frontend renderiza hierarquia]
    
    style A fill:#e1f5ff
    style Q fill:#c8e6c9
    style R fill:#fff9c4
```

## 6. Arquitetura de Camadas

```mermaid
flowchart TB
    subgraph Frontend["🎨 Frontend Layer"]
        UI[Componentes React]
        Client[previsoes-medicao-client.ts]
        UI --> Client
    end
    
    subgraph API["🌐 API Layer"]
        Route1[GET /api/previsoes-medicao]
        Route2[POST /api/previsoes-medicao]
        Route3[PUT /api/previsoes-medicao/:id]
        Route4[GET /api/previsoes-medicao/visao-gerencial]
    end
    
    subgraph Actions["⚙️ Business Logic Layer"]
        Action1[criarPrevisaoMedicao]
        Action2[atualizarPrevisaoMedicao]
        Action3[buscarPrevisoesPorObra]
        Action4[recalcularAcumulados]
        Action5[buscarMedicoesAgrupadasPorVisaoGerencial]
    end
    
    subgraph Database["💾 Database Layer"]
        Prisma[Prisma Client]
        DB[(PostgreSQL)]
        Prisma --> DB
    end
    
    Client --> Route1
    Client --> Route2
    Client --> Route3
    Client --> Route4
    
    Route1 --> Action3
    Route2 --> Action1
    Route3 --> Action2
    Route4 --> Action5
    
    Action1 --> Prisma
    Action2 --> Prisma
    Action3 --> Prisma
    Action4 --> Prisma
    Action5 --> Prisma
    
    style Frontend fill:#e3f2fd
    style API fill:#f3e5f5
    style Actions fill:#fff3e0
    style Database fill:#e8f5e9
```

## 7. Estados de uma Previsão de Medição

```mermaid
stateDiagram-v2
    [*] --> PREVISTA: Criar previsão
    
    PREVISTA --> EM_MEDICAO: Iniciar medição
    PREVISTA --> CANCELADA: Cancelar
    
    EM_MEDICAO --> REALIZADA: Aprovar
    EM_MEDICAO --> PREVISTA: Voltar para rascunho
    EM_MEDICAO --> CANCELADA: Cancelar
    
    REALIZADA --> [*]
    CANCELADA --> [*]
    
    note right of PREVISTA
        Status inicial
        Pode ser editada
        Não impacta valores finais
    end note
    
    note right of EM_MEDICAO
        Medição em andamento
        Pode ser modificada
        Aguardando aprovação
    end note
    
    note right of REALIZADA
        Medição aprovada
        Valores consolidados
        Não pode ser editada
    end note
    
    note right of CANCELADA
        Medição cancelada
        Não conta nos acumulados
        Não pode ser reativada
    end note
```

## 8. Exemplo de Dados Agrupados

```mermaid
graph TD
    Root[Visão Gerencial]
    
    Root --> E1[INFRAESTRUTURA]
    Root --> E2[SUPRAESTRUTURA]
    
    E1 --> SE1[MOVIMENTAÇÃO DE SOLO]
    E1 --> SE2[FUNDAÇÃO]
    
    SE1 --> S1[Escavação<br/>Total: 1000m³<br/>Medido: 250m³<br/>25%]
    SE1 --> S2[Reaterro<br/>Total: 800m³<br/>Medido: 200m³<br/>25%]
    
    SE2 --> S3[Concretagem<br/>Total: 500m³<br/>Medido: 100m³<br/>20%]
    
    S1 --> M1[Medição 01<br/>100m³]
    S1 --> M2[Medição 02<br/>150m³]
    
    S2 --> M3[Medição 01<br/>80m³]
    S2 --> M4[Medição 02<br/>120m³]
    
    S3 --> M5[Medição 01<br/>100m³]
    
    style Root fill:#1976d2,color:#fff
    style E1 fill:#42a5f5
    style E2 fill:#42a5f5
    style SE1 fill:#64b5f6
    style SE2 fill:#64b5f6
    style S1 fill:#90caf9
    style S2 fill:#90caf9
    style S3 fill:#90caf9
    style M1 fill:#bbdefb
    style M2 fill:#bbdefb
    style M3 fill:#bbdefb
    style M4 fill:#bbdefb
    style M5 fill:#bbdefb
```

## 9. Fluxo Completo de Uso

```mermaid
journey
    title Jornada do Usuário - Previsões de Medição
    section Planejamento
      Acessar obra: 5: Usuário
      Criar nova previsão: 5: Usuário
      Definir nome e data: 5: Usuário
      Selecionar itens para medir: 4: Usuário
    section Medição
      Informar quantidades: 4: Usuário
      Calcular valores: 5: Sistema
      Salvar previsão: 5: Sistema
      Recalcular acumulados: 5: Sistema
    section Acompanhamento
      Visualizar previsões: 5: Usuário
      Ver visão gerencial: 5: Usuário
      Analisar saldos: 4: Usuário
      Verificar percentuais: 4: Usuário
    section Aprovação
      Revisar medição: 4: Usuário
      Aprovar medição: 5: Usuário
      Consolidar valores: 5: Sistema
```

## 10. Relacionamento de Códigos entre Planilhas

```mermaid
flowchart LR
    subgraph VersaoOrcamento["Versão Orçamento"]
        IO1[ItemOrcamento<br/>código: 1.1.1<br/>Escavação manual]
        IO2[ItemOrcamento<br/>código: 1.1.2<br/>Escavação mecânica]
    end
    
    subgraph VersaoCustoOrcado["Versão Custo Orçado"]
        ICO1[ItemCustoOrcado<br/>código: 1.1.1<br/>MAT: R$100<br/>MO: R$200]
        ICO2[ItemCustoOrcado<br/>código: 1.1.2<br/>MAT: R$50<br/>MO: R$300]
    end
    
    subgraph VersaoCategorizacao["Versão Categorização"]
        IC1[ItemCategorizacao<br/>código: 1.1.1<br/>Etapa: INFRAESTRUTURA<br/>SubEtapa: MOVIMENTAÇÃO<br/>Serviço: Escavação]
        IC2[ItemCategorizacao<br/>código: 1.1.2<br/>Etapa: INFRAESTRUTURA<br/>SubEtapa: MOVIMENTAÇÃO<br/>Serviço: Escavação]
    end
    
    subgraph PrevisaoMedicao["Previsão de Medição"]
        IPM1[ItemPrevisaoMedicao<br/>itemOrcamentoId → IO1<br/>itemCustoOrcadoId → ICO1<br/>itemCategorizacaoId → IC1<br/>Qtd: 100m³]
        IPM2[ItemPrevisaoMedicao<br/>itemOrcamentoId → IO2<br/>itemCustoOrcadoId → ICO2<br/>itemCategorizacaoId → IC2<br/>Qtd: 50m³]
    end
    
    IO1 -.código 1.1.1.-> ICO1
    IO1 -.código 1.1.1.-> IC1
    
    IO2 -.código 1.1.2.-> ICO2
    IO2 -.código 1.1.2.-> IC2
    
    IPM1 --> IO1
    IPM1 --> ICO1
    IPM1 --> IC1
    
    IPM2 --> IO2
    IPM2 --> ICO2
    IPM2 --> IC2
    
    style VersaoOrcamento fill:#e8f5e9
    style VersaoCustoOrcado fill:#fff3e0
    style VersaoCategorizacao fill:#f3e5f5
    style PrevisaoMedicao fill:#e1f5ff
```

---

## Legenda

- 🎨 **Frontend**: Interface do usuário
- 🌐 **API**: Camada de endpoints HTTP
- ⚙️ **Actions**: Lógica de negócio
- 💾 **Database**: Persistência de dados
- 📊 **Visão Gerencial**: Visualização consolidada
- 🔗 **Vínculos**: Relacionamentos entre entidades

## Como visualizar os diagramas

Os diagramas acima usam a sintaxe Mermaid. Para visualizá-los:

1. Use um visualizador online: https://mermaid.live/
2. Use uma extensão do VSCode: Mermaid Preview
3. Visualize diretamente no GitHub (suporta Mermaid nativamente)
4. Use ferramentas como Notion, Obsidian, etc.
