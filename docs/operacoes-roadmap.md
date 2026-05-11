# Módulo de Operações Financeiras — Roadmap de PRs

> Atualizar a cada PR aberto/merged. Status: 📋 Planejado · 🚧 Em andamento · ✅ Merged · ❌ Cancelado.

---

## Status geral

| Fase | PR | Título | Status | Tamanho est. | Dependência | Link |
|---|---|---|---|---|---|---|
| 0 | PR-zero | Documentos de especificação | ✅ Merged | docs only | — | commit `8610c5d` |
| 1 | PR1 | Schema + workflow técnico (aprovação Pontte) | ✅ Pronto p/ merge | ~400 LOC | PR-zero | branch `feature/operacoes-pr1-workflow-tecnico` |
| 2 | PR2 | Aba "Operações" na fila técnica | 🚧 Em andamento | ~250 LOC | PR1 | branch `feature/operacoes-pr2-fila-tecnica` |
| 3a | PR3a | Análise técnica — aba **EAP comparativo** | 📋 Planejado | ~350 LOC | PR2 | — |
| 3b | PR3b | Análise técnica — aba **Contrato & Empenho** | 📋 Planejado | ~250 LOC | PR2 | — |
| 3c | PR3c | Análise técnica — aba **Compliance Fiscal** | 📋 Planejado | ~200 LOC | PR2 | — |
| 4 | PR4 | Parecer técnico na fila Fundo/Fiador | 📋 Planejado | ~150 LOC | PR1 | — |
| 5 | PR5 | Borderô (schema + tela + PDF sob demanda) | 📋 Planejado | ~500 LOC | PR1 | — |
| 6 | PR6 | Liquidação multimodal | 📋 Planejado | ~300 LOC | — (paralelo) | — |
| 7 | PR7 | Reabrir operação rejeitada | 📋 Planejado | ~100 LOC | PR1 | — |

---

## Detalhe de cada PR

### PR-zero — Documentos de especificação

**Status:** ✅ Merged (commit `8610c5d`)

**Entrega:**
- `docs/operacoes-fluxo.md` — especificação viva.
- `docs/operacoes-roadmap.md` — este arquivo.
- `docs/operacoes-decisoes.md` — ADR leve.

**Mudanças:**
- Schema: ❌
- Server actions: ❌
- Telas: ❌
- Permissões: ❌

**Como testar:** revisar os 3 docs.

**Riscos:** nenhum (docs only).

---

### PR1 — Schema + workflow técnico (aprovação Pontte)

**Status:** ✅ Pronto para merge (branch `feature/operacoes-pr1-workflow-tecnico`)

> Detalhe da execução: `docs/prs/pr1-workflow-tecnico.md`.
> Smoke test: `scripts/smoke-test-operacoes.ts` (28 checks dedicados ao PR1, todos OK).

**Entrega:**
- Aprovação técnica passa a existir como etapa formal entre construtora e Fundo/Fiador.
- Backend já consegue receber `aprovarTecnica` / `rejeitarTecnica`.

**Mudanças:**
- Schema:
  - `StatusWorkflowOperacao`: adicionar `EM_APROVACAO_TECNICA` e renomear `EM_APROVACAO` → `EM_APROVACAO_FINANCEIRA` (com migration de dados para registros existentes).
  - `PapelAprovacaoOperacao`: adicionar `TECNICA`.
  - `Operacao`: adicionar `aprovacaoTecnicaStatus`, `aprovacaoTecnicaData`, `aprovacaoTecnicaMotivo`, `aprovacaoTecnicaPorId`.
  - 1 migration Prisma.
- Server actions:
  - Refatorar `enviarParaAprovacao` para ir a `EM_APROVACAO_TECNICA`.
  - Remover/deduplicar `submeterParaAprovacao` (redundante).
  - Criar `aprovarTecnica(id)` e `rejeitarTecnica(id, motivo)`.
  - Ajustar `aprovarOperacao` / `rejeitarOperacao` para operar só na fase financeira.
- Telas: ❌ (mudança de UI fica no PR2).
- Permissões: reaproveita `aprovacoes:engenharia:aprovar` (sem nova).

**Como testar:**
1. Criar operação À Performar, enviar para aprovação.
2. Verificar que entrou em `EM_APROVACAO_TECNICA` (via Prisma Studio ou query).
3. Como usuário com `aprovacoes:engenharia:aprovar`, chamar `aprovarTecnica` → ir para `EM_APROVACAO_FINANCEIRA`.
4. Como Fundo, aprovar → `APROVADA`.
5. Repetir com rejeição em cada etapa.

**Riscos:**
- **Médio**: mexe em workflow já em produção. Migration deve mapear `EM_APROVACAO` → `EM_APROVACAO_FINANCEIRA` para registros existentes.
- Operações antigas (sem fase técnica) já estão na fase financeira por convenção.

---

### PR2 — Aba "Operações" na fila técnica

**Status:** 📋 Planejado · Depende de PR1

**Entrega:**
- `/aprovacoes/engenharia` vira layout com abas: "Medições" (existente) + "Operações" (nova).
- A aba "Operações" lista todas operações em `EM_APROVACAO_TECNICA`.

**Mudanças:**
- Telas: refatorar `app/(main)/aprovacoes/engenharia/page.tsx` + `AprovacoesEngenhariaClient.tsx`.
- Adicionar query para operações pendentes técnicas.

**Como testar:**
1. Logar como usuário com `aprovacoes:engenharia:aprovar`.
2. Ir em `/aprovacoes/engenharia`.
3. Ver as 2 abas com contadores corretos.

**Riscos:** Baixo (UI aditiva).

---

### PR3a — Análise técnica: aba EAP comparativo

**Status:** 📋 Planejado · Depende de PR2

**Entrega:**
- Tela `/aprovacoes/engenharia/operacao/[id]` com a aba 1 da seção 5 do fluxo.
- Footer com `[Aprovar Tecnicamente]` / `[Reprovar]` funcionais.

**Mudanças:**
- Query nova: `buscarAcumuladoCompradoPorObra` com flag `excluirOperacaoId` para separar "anterior" vs "atual".
- Componente novo: árvore EAP com 4 colunas comparativas.
- Modal para abrir anexo da ordem inline.

**Como testar:**
1. A partir da fila (PR2), abrir operação.
2. Conferir colunas: contratual / acumulado anterior / atual / saldo.
3. Expandir linha, abrir anexo, aprovar/rejeitar tecnicamente.

**Riscos:** Médio (tela nova grande).

---

### PR3b — Análise técnica: aba Contrato & Empenho

**Status:** 📋 Planejado · Depende de PR3a (mesma tela, nova aba)

**Entrega:**
- Aba 2: documentos do contrato + saldo empenhos + alterações pendentes.

**Mudanças:**
- Query consolidada: medições não aprovadas, aditivos rascunho, reajustes pendentes.
- Componente listagem de documentos.

**Riscos:** Baixo.

---

### PR3c — Análise técnica: aba Compliance Fiscal

**Status:** 📋 Planejado · Depende de PR3a

**Entrega:**
- Aba 3: documentos da construtora com vencimento + banner de alerta.

**Mudanças:**
- Query: `Documento` por `construtoraId` com cálculo de vencidos.

**Riscos:** Baixo.

---

### PR4 — Parecer técnico na fila Fundo/Fiador

**Status:** 📋 Planejado · Depende de PR1

**Entrega:**
- A fila `/fin/operacoes/aprovacoes` mostra bloco "Parecer Técnico Pontte" com decisão, quem, quando, observações.

**Mudanças:**
- Refatorar `AprovacoesClient.tsx` (`app/(main)/fin/operacoes/aprovacoes/`).
- Expor `aprovacaoTecnica*` na consulta.

**Riscos:** Baixo.

---

### PR5 — Borderô

**Status:** 📋 Planejado · Depende de PR1

**Entrega:**
- Tela `/fin/operacoes/solicitacoes/[c]/[id]/bordero` sempre disponível para operações `APROVADA`.
- Botão "Gerar PDF" que cria/atualiza o arquivo via `pdfmake`.

**Mudanças:**
- Schema: novo model `Bordero`, campo `contaBancariaDepositoId` em `Operacao`.
- 1 migration.
- Actions: `gerarOuObterBordero`, `gerarBorderoPdf`.
- Rota API: `/api/operacoes/[id]/bordero.pdf` para download.
- Tela: layout fiel ao PDF (mesmos campos), botão de geração.

**Riscos:** Médio (geração de PDF — testar layout).

---

### PR6 — Liquidação multimodal

**Status:** 📋 Planejado · Independente (pode rodar em paralelo)

**Entrega:**
- Operação pode ser liquidada por: recompra (já existe), depósito escrow, outro.
- Tela para registrar liquidação manual com comprovante.

**Mudanças:**
- Schema: enum `TipoLiquidacao`, campos em `Operacao`.
- Action: `liquidarOperacao` refatorada.
- Tela: dialog dentro da `OperacaoDetalhesClient.tsx`.

**Riscos:** Baixo.

---

### PR7 — Reabrir operação rejeitada

**Status:** 📋 Planejado · Depende de PR1

**Entrega:**
- Botão "Reabrir para Edição" em operações `REJEITADA`.

**Mudanças:**
- Action: `reabrirOperacao(id)`.
- UI: botão em `OperacaoDetalhesClient.tsx`.
- Histórico: nova entrada em `OperacaoAprovacaoHistorico` (decisão `REABERTA`).

**Riscos:** Baixo.

---

## Convenções

- **Branch**: `feature/operacoes-pr-<numero>-<slug-curto>` (ex.: `feature/operacoes-pr1-workflow-tecnico`).
- **Commit**: mensagem em português, descritiva (`feat(operacoes): adiciona aprovação técnica como etapa do workflow`).
- **Merge**: squash merge para manter histórico limpo no main.
- **Migrations**: nome no padrão `YYYYMMDDHHMMSS_descricao_curta` (Prisma já faz isso).
- **Atualização deste roadmap**: marcar status no início do PR (🚧) e ao mergear (✅).
