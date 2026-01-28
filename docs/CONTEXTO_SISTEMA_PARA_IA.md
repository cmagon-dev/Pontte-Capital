# Contexto do Sistema - Pontte Capital

## Visão Geral
Sistema SaaS de gestão financeira e engenharia para construção civil, desenvolvido em Next.js 14 com App Router, TypeScript e Tailwind CSS.

## Arquitetura e Stack Tecnológico

- **Framework**: Next.js 14.2.0 (App Router)
- **Linguagem**: TypeScript 5.3.3
- **Estilização**: Tailwind CSS 3.4.1
- **Ícones**: Lucide React 0.344.0
- **Drag & Drop**: @dnd-kit/core e @dnd-kit/sortable
- **Padrão**: Server Components quando possível, Client Components quando necessário

## Estrutura de Módulos

### 1. Dashboard (`/dashboard`)
- KPIs personalizáveis e reordenáveis (drag & drop)
- Seções de resumo por módulo
- Edição de layout em tempo real

### 2. Cadastros (`/cadastros`)
Módulo para cadastro de entidades do sistema:

#### Fundos (Cessionários) (`/cadastros/fundos`)
- Listagem e cadastro de fundos
- Documentos e upload
- Gestão completa de fundos

#### Construtoras (Cedentes) (`/cadastros/construtoras`)
- Listagem e cadastro de construtoras
- Análise de risco
- Gestão de documentos

#### Fiadores (Avalistas) (`/cadastros/fiadores`)
- Listagem e cadastro de fiadores
- Gestão de bens e garantias
- Upload de documentos

#### Contratantes (Sacados) (`/cadastros/contratantes`)
- Listagem e cadastro de órgãos públicos e empresas contratantes
- Indicadores de risco (prazo médio de pagamento, análise de atrasos)
- Fontes de recurso separadas (`/cadastros/contratantes/fontes-recurso`)

### 3. Engenharia (`/eng`)
Módulo completo de gestão de obras:

#### Contratos (`/eng/contratos/contratos-obras`)
- **Listagem de Construtoras**: Primeiro nível mostra construtoras
- **Contratos por Construtora**: `/eng/contratos/contratos-obras/[construtoraId]`
- **Detalhes do Contrato**: `/eng/contratos/contratos-obras/obra/[id]`
  - Abas: Detalhes, Aditivos, Reajustes, Empenhos
  - Gestão completa de aditivos (`/aditivos/[aditivoId]`)
  - Gestão de reajustes (`/reajustes/[reajusteId]`)
  - Gestão de empenhos (`/empenhos/[empenhoId]`)
  - Edição de contratos (`/editar`)

#### Orçamento (`/eng/orcamento`)
- Categorização (`/categorizacao`)
- Custos Orçados (`/custos-orcados`) com importação
- Planilha Contratual (`/planilha-contratual`) com importação
- Visão Gerencial (`/visao-gerencial`)

#### Planejamento (`/eng/planejamento`)
- Cronograma de Contratos (`/crono-contratos`)
- Cronograma Executivo (`/crono-executivo`)
- Cronograma de Materiais (`/crono-materiais`)
- Fluxo Financeiro Projetado (`/fluxo-fin-projetado`)
- Parâmetros Financeiros (`/parametros-financeiros`)

#### Medições (`/eng/medicoes`)
- Boletim de Medição (`/boletim-medicao`) com importação
- Memória de Cálculo (`/memoria-calculo`)
- Dashboard de Avanço (`/dashboard-avanco`)
- Relatório Financeiro (`/relatorio-financeiro`)

#### Acompanhamento (`/eng/acompanhamento`)
- Curvas S (`/curvas-s`)
- Orçado vs Realizado (`/orcado-vs-realizado`)
- Relatórios (`/relatorios`)

### 4. Financeiro (`/fin`)
Módulo completo de gestão financeira:

#### Cadastros (`/fin/cadastros`)
- Cadastros financeiros por construtora
- KPIs por construtora (compactos, 2-col mobile, 4-col desktop)
- Gestão de Bancos (`/bancos`)
- Gestão de Credores (`/credores`)
- Plano de Contas (`/plano-contas`)

#### Operações (`/fin/operacoes`)
- **Solicitações** (`/solicitacoes`)
  - Listagem por construtora (`/solicitacoes/[construtoraId]`)
  - Nova operação (`/nova`)
  - Nova operação performada (`/nova-performada`)
  - Nova operação com saldo performado (`/nova-saldo-performado`)
  - Detalhes de operação (`/[operacaoId]`)
- **Aprovações** (`/aprovacoes`)

#### Relatórios (`/fin/relatorios`)
- Resumo Financeiro (`/resumo-financeiro`)
- Fluxo de Caixa (`/fluxo-caixa`)

### 5. Aprovações (`/aprovacoes`)
Módulo para aprovação de processos:

- **Contratos** (`/aprovacoes/contratos`): Abas para Contratos, Aditivos/Supressões, Reajustes, Empenhos
- **Engenharia** (`/aprovacoes/engenharia`): Abas para Orçamento, Planejamento, Medições
- **Financeiro** (`/aprovacoes/financeiro`): Abas para Cadastros, Operações

## Padrões de Desenvolvimento

### Rotas Dinâmicas
- Usar `[id]` para rotas de detalhes individuais
- Usar `[construtoraId]`, `[obraId]`, etc. para rotas específicas quando necessário
- Evitar conflitos de rotas (ex: `[id]` e `[construtoraId]` no mesmo nível)

### Componentes
- **Sidebar**: Componente único reutilizável (`app/components/Sidebar.tsx`)
- **Modais**: Componentes modais reutilizáveis (`NovoPagamentoModal.tsx`, `ModalEAP.tsx`, `SweepModal.tsx`)
- **Tree Select**: Componente para seleção hierárquica (`SubEtapaTreeSelect.tsx`)

### Estilização
- **Tema**: Dark mode (slate-900, slate-800, slate-700)
- **Cores**: 
  - Azul (blue-600) para ações primárias
  - Verde (green-400) para valores positivos/sucesso
  - Amarelo (amber-400/600) para alertas/destaques
  - Vermelho (red-400) para erros/perigo
- **Tipografia**: Inter (via Next.js font optimization)
- **Layout**: Sidebar fixa à esquerda (ml-64 no conteúdo principal via `app/layout.tsx`)

### Utilitários
- **Formatação**: Funções em `lib/utils/format.ts`
  - `formatCurrency`: Formatação de moeda (BRL)
  - `formatPercent`: Formatação de percentuais
  - `formatDate`: Formatação de datas
  - `formatNumber`: Formatação de números

### Dados Mock
- Arquivo `lib/mock-data.ts` contém dados simulados:
  - `getAllConstrutoras()`, `getConstrutoraById()`
  - `getAllObras()`, `getObraById()`
  - `getAllContratantes()`, `getContratanteById()`
  - Outros getters para entidades do sistema

## Estrutura de Arquivos Importantes

```
/app
  /components          # Componentes reutilizáveis
    Sidebar.tsx       # Navegação principal
    NovoPagamentoModal.tsx
    ModalEAP.tsx
    SubEtapaTreeSelect.tsx
    SweepModal.tsx
  /dashboard          # Dashboard principal
  /cadastros          # Módulo de cadastros
  /eng                # Módulo de engenharia
  /fin                # Módulo financeiro
  /aprovacoes         # Módulo de aprovações
  layout.tsx          # Layout principal (Sidebar + conteúdo)
  page.tsx            # Página inicial (redireciona para dashboard)
  globals.css         # Estilos globais

/lib
  /utils
    format.ts         # Funções de formatação
  mock-data.ts        # Dados mock do sistema
```

## Funcionalidades Principais

1. **Gestão de Contratos de Obra**: Sistema completo com hierarquia Construtora → Contratos → Detalhes
2. **Gestão Financeira**: Operações, solicitações, aprovações, com apropriações orçamentárias e financeiras
3. **Orçamento e Planejamento**: Importação de planilhas, categorização, cronogramas
4. **Medições**: Boletins, memórias de cálculo, relatórios financeiros
5. **Cadastros Completo**: Entidades com indicadores de risco e gestão de documentos
6. **Dashboard Personalizável**: KPIs arrastáveis e reordenáveis

## Observações Importantes

- **Roteamento**: Next.js App Router com rotas dinâmicas
- **Estado**: Uso extensivo de `useState`, `useEffect`, `useParams`, `useSearchParams`
- **Navegação**: `Link` do Next.js e `router.push()` para navegação programática
- **Responsividade**: Tailwind CSS com breakpoints (mobile-first)
- **Acessibilidade**: Componentes com labels, títulos e estrutura semântica
- **Performance**: Uso de `useMemo` e `Suspense` quando apropriado

## Problemas Conhecidos e Soluções

1. **Conflito de Rotas**: Já resolvido - rota `[id]` movida para `obra/[id]` para evitar conflito com `[construtoraId]`
2. **Cache do Next.js**: Pasta `.next` deve ser removida quando houver problemas de roteamento
3. **Layout com Sidebar**: Conteúdo principal usa `ml-64` via layout principal, não em páginas individuais

## Próximos Passos de Desenvolvimento

- Integração com APIs reais
- Sistema de autenticação e autorização
- Persistência de dados (banco de dados)
- Notificações em tempo real
- Relatórios exportáveis (PDF, Excel)
- Dashboard mais avançado com gráficos
