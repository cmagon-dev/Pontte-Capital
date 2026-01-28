# Pontte Capital

Plataforma SaaS de gestão financeira para construção civil.

## Stack Tecnológico

- **Framework**: Next.js 14.2.35 (App Router)
- **Linguagem**: TypeScript 5.3.3
- **Estilização**: Tailwind CSS 3.4.1
- **Ícones**: Lucide React 0.344.0

## Como executar

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
# Servidor inicia em: http://localhost:3000

# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

## Estrutura do Projeto

```
/app
  /components          # Componentes reutilizáveis (Sidebar)
  /dashboard          # Dashboard principal
  /cadastros          # Módulo de Cadastros
    /construtoras     # Gestão de construtoras
    /fiadores         # Gestão de fiadores e bens
    /fundos           # Gestão de fundos FIDC
  /eng                # Módulo de Engenharia
    /contratos        # Contratos de obras
    /orcamento        # Orçamento e custos
    /planejamento     # Planejamento e cronogramas
    /medicoes         # Medições e avanço físico
    /acompanhamento   # Acompanhamento e BI
  /fin                # Módulo Financeiro
    /cad              # Cadastros financeiros
    /operacoes        # Operações financeiras
    /relatorios       # Relatórios financeiros
  layout.tsx          # Layout principal
  page.tsx            # Página inicial (redireciona)
  globals.css         # Estilos globais
```

## Módulos Principais

- **Dashboard**: Visão geral da carteira, KPIs, alertas críticos
- **Cadastros**: Construtoras, Fiadores (com bens em garantia), Fundos
- **Engenharia**: Contratos, Orçamento, Planejamento, Medições, Acompanhamento
- **Financeiro**: Operações, Aprovações, Contas a Pagar/Receber, Relatórios

Para mais detalhes sobre o estado atual do sistema, consulte `BACKUP.md`.
