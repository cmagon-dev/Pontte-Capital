# PR2 — Aba "Operações" na fila técnica

> **Fase:** 2 (Roadmap)
> **Branch:** `feature/operacoes-pr2-fila-tecnica`
> **Depende de:** PR1
> **Status:** 🚧 Em andamento

---

## Objetivo

Dar uma UI para o aprovador técnico (Pontte) ver e atuar nas operações em `EM_APROVACAO_TECNICA`, reusando a página `/aprovacoes/engenharia/` que hoje só lista medições. Vai virar uma página de 2 abas:

- **Medições** (existente) — pendentes de aprovação técnica de medição.
- **Operações** (nova) — pendentes de aprovação técnica de operação.

A mesma permissão (`aprovacoes:engenharia:aprovar`) controla ambas. Decisão registrada em ADR-001.

---

## Tarefas

### 1. Server action ✅

- [x] Criada `listarOperacoesParaAprovacaoTecnica()` em `app/actions/aprovacoes-eng.ts` (cohabita com `listarMedicoesParaAprovacao`, evita poluir mais o `operacoes.ts`).
  - Filtra `statusWorkflow = 'EM_APROVACAO_TECNICA'` + `scopeFilter`.
  - Include construtora, obra, ordens (com credor).
  - Ordena por `dataSolicitacao DESC`.

### 2. Server page ✅

- [x] `page.tsx` reescrita usando `Promise.all` para buscar medições e operações em paralelo.
- [x] Serializa ambos os payloads e passa como duas props para o client.

### 3. Client ✅

- [x] Tabs renderizadas no topo da página, com contador em badge.
- [x] Aba inicial: "Medições" (a menos que esteja vazia e haja operações — aí já abre em "Operações").
- [x] KPIs (qtd, valor total) ajustam conforme aba ativa.
- [x] Modal de rejeição **unificado** via union type `RejeicaoTarget = { tipo: 'medicao' | 'operacao'; id: string }`.
- [x] Sub-componentes extraídos por clareza: `MedicaoCard`, `OperacaoCard`, `EmptyState`.

### 4. UI da aba "Operações" ✅

Card com:
- [x] Badge amber "Aguardando Aprovação Técnica" + tag azul do tipo (`À Performar` / `Performada` / `Saldo Performado`).
- [x] Título: `Operação {codigo}` em mono.
- [x] Linha 1 info: construtora • obra.
- [x] Linha 2 info: data solicitação • qtd ordens • credores (com truncagem se > 3).
- [x] Lado direito: valor das ordens (grande, verde) + valor bruto (pequeno, slate).
- [x] Footer: link **Ver detalhes** (esquerda) + botões **Rejeitar** / **Aprovar** (direita).

### 5. Ações inline ✅

- [x] `handleAprovarOperacao` chama `aprovarTecnica` (já existe do PR1) com `confirm()` prévio.
- [x] `handleRejeitar` unificado chama `rejeitarMedicao` ou `rejeitarTecnica` conforme `rejeitarTarget.tipo`.
- [x] Estado `loading` por id evita double-click.
- [x] `router.refresh()` após cada mutation para sincronizar.

### 6. Smoke test ✅

- [x] Script renomeado de `smoke-test-pr1.ts` → `smoke-test-operacoes.ts` (vai crescer com cada PR).
- [x] Adicionada **Parte D** com 4 checks novos:
  - Operação em `EM_APROVACAO_TECNICA` aparece na fila.
  - Operação em `EM_EDICAO` **não** aparece.
  - Operação em `EM_APROVACAO_FINANCEIRA` **não** aparece.
  - Cleanup OK.
- [x] **32/32 checks passam** (PR1 + PR2).

### 7. Docs 🚧

- [x] Plano deste PR ✅.
- [ ] `docs/operacoes-roadmap.md` — marcar PR1 como Merged e PR2 como Em andamento.

### 8. Commit & push 🚧

- [ ] Commit + push.

---

## Como testar manualmente (após PR2 entrar)

1. Login como construtora (admin de uma construtora).
2. Criar operação À Performar com ordens, **Enviar para Aprovação**.
3. Logout, login como `apr-tec@pontte.com` / `apr123`.
4. Acessar `/aprovacoes/engenharia/`.
5. Esperado: aba "Operações" com contador 1, operação visível com botões.
6. Aprovar → operação some da fila.
7. Logout, login como `apr-fin@pontte.com` / `apr123`.
8. Acessar `/fin/operacoes/aprovacoes`.
9. Esperado: operação agora aparece nesta fila (já está em `EM_APROVACAO_FINANCEIRA`).

Rejeição: mesma sequência, mas em vez de aprovar, rejeita técnica → operação volta para a construtora ver o motivo (este fluxo de "ver motivo na construtora" já existe via `motivoRejeicao` no detalhe da operação).

---

## Riscos

| Risco | Mitigação |
|---|---|
| Refactor da página existente pode quebrar fluxo de medições | Manter mínimo de mudanças, testar aba "Medições" antes de subir |
| Duas listas grandes podem ficar lentas (sem paginação) | Sem paginação neste PR; banco vazio agora; se acumular volume, virar paginado em PR futuro |
| Decisão UX: aprovador clica "Aprovar" sem ver detalhes? | Aceitar; PR3 (Análise Técnica) é onde a análise rica vai morar. Aqui é a "fila" minimalista. |

---

## Decisões registradas durante a execução

> _(preencher conforme executar)_

- ...
