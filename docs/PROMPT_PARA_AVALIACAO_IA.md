# Prompt para Avaliação do Sistema por IA

## Instruções para a IA Avaliadora

Você será o revisor técnico de um sistema SaaS de gestão financeira e engenharia para construção civil. Seu objetivo é avaliar o código, arquitetura, padrões e identificar oportunidades de melhoria.

## Contexto do Sistema

**Nome**: Pontte Capital
**Tipo**: Sistema SaaS de gestão financeira e engenharia para construção civil
**Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS

### Arquitetura Geral

O sistema é dividido em 5 módulos principais:

1. **Dashboard**: KPIs personalizáveis com drag & drop
2. **Cadastros**: Gestão de Fundos, Construtoras, Fiadores, Contratantes
3. **Engenharia**: Contratos, Orçamento, Planejamento, Medições, Acompanhamento
4. **Financeiro**: Cadastros financeiros, Operações, Solicitações, Relatórios
5. **Aprovações**: Workflows de aprovação para Contratos, Engenharia e Financeiro

### Estrutura de Rotas (Next.js App Router)

```
/ → Redireciona para /dashboard
/dashboard → Dashboard principal
/cadastros/[tipo] → Cadastros (fundos, construtoras, fiadores, contratantes)
/eng/contratos/contratos-obras → Lista de construtoras
/eng/contratos/contratos-obras/[construtoraId] → Contratos da construtora
/eng/contratos/contratos-obras/obra/[id] → Detalhes do contrato
/fin/cadastros → Cadastros financeiros por construtora
/fin/operacoes/solicitacoes/[construtoraId] → Solicitações
/aprovacoes/[modulo] → Aprovações por módulo
```

## Objetivos da Avaliação

Avalie os seguintes aspectos do sistema:

### 1. Arquitetura e Estrutura
- Organização de pastas e arquivos
- Separação de responsabilidades
- Padrões de nomenclatura
- Reutilização de componentes

### 2. Código e Padrões
- Qualidade do código TypeScript
- Uso adequado de React Hooks
- Gerenciamento de estado
- Tratamento de erros

### 3. Performance
- Otimizações do Next.js (Server/Client Components)
- Uso de memoization quando apropriado
- Lazy loading
- Code splitting

### 4. UX/UI
- Consistência visual
- Responsividade
- Acessibilidade
- Feedback ao usuário

### 5. Manutenibilidade
- Legibilidade do código
- Documentação
- Testabilidade
- Escalabilidade

### 6. Segurança (se aplicável)
- Validação de inputs
- Sanitização de dados
- Autenticação (se implementada)

### 7. Boas Práticas Next.js
- Uso correto do App Router
- Server Components vs Client Components
- Data fetching
- Metadata e SEO

## Perguntas Específicas para Avaliar

1. **Rotas Dinâmicas**: Existem conflitos ou ambiguidades nas rotas? Como as rotas `[id]` e `[construtoraId]` foram resolvidas?

2. **Componentes Reutilizáveis**: Quais componentes poderiam ser melhorados ou extraídos? Há duplicação de código?

3. **Estado Global**: O sistema precisa de um gerenciador de estado global (Redux, Zustand, Context API)? Ou o estado local é suficiente?

4. **Formulários**: Como os formulários estão sendo gerenciados? Há oportunidade de usar bibliotecas como React Hook Form?

5. **Validação**: Existe validação adequada de formulários e inputs?

6. **Loading States**: Como os estados de carregamento estão sendo tratados? Há uso adequado de Suspense?

7. **Error Handling**: Como os erros estão sendo tratados? Há boundaries de erro?

8. **Type Safety**: O TypeScript está sendo usado efetivamente? Há `any` desnecessário?

9. **Dados Mock**: A estrutura de dados mock (`lib/mock-data.ts`) está bem organizada? Facilita migração para API real?

10. **CSS e Estilização**: O uso do Tailwind está consistente? Há classes duplicadas que poderiam ser componentes?

## Critérios de Avaliação

Para cada aspecto, forneça:

1. **Pontos Fortes**: O que está bem implementado
2. **Pontos de Melhoria**: O que pode ser aprimorado
3. **Sugestões Concretas**: Código ou padrões específicos recomendados
4. **Prioridade**: Alta/Média/Baixa para cada melhoria sugerida
5. **Impacto Estimado**: Quanto cada melhoria impactaria (performance, manutenibilidade, UX)

## Formato de Resposta Esperado

Organize sua avaliação em seções:

### Resumo Executivo
- Visão geral da qualidade do código
- Principais pontos de atenção
- Recomendações prioritárias

### Análise Detalhada por Módulo
- Dashboard
- Cadastros
- Engenharia
- Financeiro
- Aprovações

### Análise Técnica
- Arquitetura
- Performance
- Segurança
- Escalabilidade

### Plano de Ação Recomendado
- Quick wins (fácil implementação, alto impacto)
- Melhorias de médio prazo
- Refatorações maiores (se necessário)

### Exemplos de Código
- Trechos problemáticos (se houver) com sugestões de correção
- Padrões recomendados com exemplos

## Informações Adicionais

- **Versão do Node**: Verificar `package.json` ou `.nvmrc`
- **Dependências**: Todas listadas em `package.json`
- **Configurações**: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`

## Notas Importantes

1. O sistema está em desenvolvimento ativo
2. Usa dados mock (`lib/mock-data.ts`) - não há backend ainda
3. Foco em funcionalidade e UX primeiro
4. Alguns problemas conhecidos já foram resolvidos (ex: conflito de rotas)
5. O sistema usa dark mode por padrão

## Como Usar Este Prompt

1. Leia o arquivo `CONTEXTO_SISTEMA_PARA_IA.md` para entender o sistema completo
2. Analise os arquivos de código fornecidos
3. Execute este prompt em uma IA (Claude, GPT-4, etc.)
4. Revise as recomendações e priorize as ações

---

**Dica**: Se a IA não tiver acesso direto ao código, forneça os arquivos principais ou use um sistema que permita upload de código (como Cursor, GitHub Copilot Chat, ou upload de arquivos em algumas IAs).
