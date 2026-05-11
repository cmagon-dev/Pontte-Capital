# PR1 — Schema + Workflow Técnico (Aprovação Pontte)

> **Fase:** 1 (Roadmap)
> **Branch:** `feature/operacoes-pr1-workflow-tecnico`
> **Depende de:** PR-zero (docs)
> **Status:** 🚧 Em andamento

---

## Objetivo

Introduzir a **aprovação técnica da Pontte como etapa formal do workflow de operação**, antes da aprovação financeira (Fundo/Fiador). Backend-only neste PR — UI fica para PR2.

Após este PR:
- Construtora envia → operação vai para `EM_APROVACAO_TECNICA`.
- Pontte aprova → operação vai para `EM_APROVACAO_FINANCEIRA` (estado renomeado, sucessor do antigo `EM_APROVACAO`).
- Pontte rejeita → `REJEITADA`.
- Fundo/Fiador aprovam → `APROVADA` (igual ao atual, só validando o estado novo).

---

## Tarefas

### 1. Schema Prisma (`prisma/schema.prisma`) ✅

- [x] Renomear no enum `StatusWorkflowOperacao`:
  - `EM_APROVACAO` → `EM_APROVACAO_FINANCEIRA`
  - Adicionar `EM_APROVACAO_TECNICA` ANTES de `EM_APROVACAO_FINANCEIRA`
- [x] Adicionar `TECNICA` no enum `PapelAprovacaoOperacao`
- [x] Em `Operacao`, adicionar:
  - `aprovacaoTecnicaStatus StatusAprovacaoPapel @default(PENDENTE)`
  - `aprovacaoTecnicaData DateTime?`
  - `aprovacaoTecnicaMotivo String? @db.Text`
  - `aprovacaoTecnicaPorId String?`
  - relação: `aprovadorTecnico Usuario? @relation("OperacoesAprovadasTecnico", fields: [aprovacaoTecnicaPorId], references: [id])`
- [x] Em `Usuario`, adicionar relação inversa:
  - `operacoesAprovadasTecnico Operacao[] @relation("OperacoesAprovadasTecnico")`
- [x] Índice em `Operacao`: `@@index([aprovacaoTecnicaStatus])`
- [x] `npx prisma validate` → schema válido ✓

### 2. Migration Prisma ✅

> **Nota:** Antes desta migration, foi necessário fazer um **baseline** das migrations antigas (eram 3 arquivos com buraco no meio: faltava uma migration intermediária entre `init` e `saldo_performado_ledger`). Ver decisão ADR-007 em `docs/operacoes-decisoes.md`.

- [x] Reset do banco Neon (autorizado pelo usuário, banco era de dev)
- [x] Apagadas as 3 migrations antigas
- [x] Criada migration baseline `20260511173938_baseline` refletindo o schema pré-PR1
- [x] Seed aplicado (perfis, usuários teste, 1 construtora, credores, contas)
- [x] Criada migration manual `20260511180000_adiciona_aprovacao_tecnica` (criada manualmente porque `prisma migrate dev` exige confirmação interativa para `DROP VALUE` em enum, e o Cursor é não-interativo)
- [x] Migration aplicada via `npx prisma migrate deploy`
- [x] Prisma Client regenerado

### 3. Server actions (`app/actions/operacoes.ts`) ✅

#### Refatorado
- [x] `enviarParaAprovacao`: agora envia para `EM_APROVACAO_TECNICA`, zerando todos os campos de aprovação (técnica, fundo, fiador).
- [x] `aprovarOperacao`: validação atualizada para exigir `EM_APROVACAO_FINANCEIRA` (mensagem de erro também atualizada).
- [x] `rejeitarOperacao`: validação atualizada para exigir `EM_APROVACAO_FINANCEIRA`.
- [x] `submeterParaAprovacao`: removida (era redundante, sem usos no código).
- [x] `finalizarOperacao`: removida (sem usos no código).

#### Criado
- [x] `aprovarTecnica(id)`:
  - Permissão: `aprovacoes:engenharia:aprovar` ✓
  - Transita `EM_APROVACAO_TECNICA` → `EM_APROVACAO_FINANCEIRA` ✓
  - Resolve `exigeAprovacaoFiador` aqui (no momento do "release" para a próxima etapa).
  - Cria entrada `OperacaoAprovacaoHistorico` com `papel = TECNICA`.
- [x] `rejeitarTecnica(id, motivo)`:
  - Permissão: `aprovacoes:engenharia:aprovar` ✓
  - Valida que motivo é obrigatório ✓
  - Transita `EM_APROVACAO_TECNICA` → `REJEITADA` ✓
  - Preenche `motivoRejeicao` (campo principal) + `aprovacaoTecnicaMotivo` (auditoria) ✓
  - Cria entrada `OperacaoAprovacaoHistorico` com `papel = TECNICA`, `decisao = REJEITADA`.

### 4. Limpeza de usos antigos do estado `EM_APROVACAO` ✅

Arquivos atualizados:
- [x] `lib/types/operations.ts` — `WorkflowStatus` agora inclui `EM_APROVACAO_TECNICA` e `EM_APROVACAO_FINANCEIRA`.
- [x] `app/(main)/fin/operacoes/aprovacoes/page.tsx` — fila Fundo/Fiador filtra por `EM_APROVACAO_FINANCEIRA`.
- [x] `app/(main)/aprovacoes/financeiro/page.tsx` — idem.
- [x] `app/(main)/fin/operacoes/solicitacoes/[construtoraId]/page.tsx` — `getStatusWorkflowColor`, `getLabelWorkflow`, `getStatusWorkflowIcon` e o `<select>` de filtro agora têm os 2 novos estados (label "Em Aprovação Técnica" / "Em Aprovação Financeira").
- [x] `app/(main)/fin/operacoes/solicitacoes/[construtoraId]/[operacaoId]/OperacaoDetalhesClient.tsx` — `getLabelWorkflow`, `getWorkflowBadgeClass` e renderização do ícone Clock atualizados.
- [x] `app/(main)/fin/operacoes/solicitacoes/[construtoraId]/nova-performada/page.tsx` — `getWorkflowBadge` atualizado.
- [x] `app/actions/operacoes.ts` — KPI `emAprovacao` agora soma os 2 estados.
- [x] Verificação final: `grep -i 'EM_APROVACAO\b'` em `.ts`/`.tsx` retorna **zero ocorrências** (fora de docs).

#### Não atualizado neste PR (será no PR2 — UI da fila técnica)
- Página `/aprovacoes/engenharia/` está hoje só para medições; vai ganhar uma aba "Operações" no PR2.
- Fila de aprovação técnica ainda não tem UI dedicada. Para testar manualmente, usar via console ou criar página `/dev/test-aprovacao-tecnica/[id]` temporária.

### 5. Plano de teste manual ⏸ pendente

> Teste fica **pendente** até o PR2 que entrega a UI da fila técnica. Hoje, para testar manualmente, daria pra:
> - Criar página `/dev/test-aprovacao-tecnica/[id]` temporária, OU
> - Chamar `aprovarTecnica` via uma server action acionada por um botão temporário no detalhe da operação.

Plano de teste para quando a UI existir:
- [ ] Logar como construtora
- [ ] Criar operação À Performar em `EM_EDICAO`
- [ ] Adicionar pelo menos 1 ordem de pagamento
- [ ] Clicar **Enviar para Aprovação**
- [ ] Verificar via Prisma Studio que ficou `EM_APROVACAO_TECNICA`, `aprovacaoTecnicaStatus = PENDENTE`
- [ ] Logar como Fundo → operação **não deve** aparecer na fila `/fin/operacoes/aprovacoes`
- [ ] Logar como Pontte (`apr-tec@pontte.com`) → operação aparece na fila técnica
- [ ] Aprovar → transita para `EM_APROVACAO_FINANCEIRA`
- [ ] Logar como Fundo → operação aparece na fila financeira
- [ ] Aprovar Fundo (e Fiador se exigido) → `APROVADA`
- [ ] Refazer fluxo testando rejeição técnica → `REJEITADA`
- [ ] Refazer fluxo testando rejeição financeira → `REJEITADA`

### 6. Atualizar docs ✅

- [x] `docs/operacoes-roadmap.md` — PR-zero marcado como Merged, PR1 como Em andamento, link para este arquivo.
- [x] `docs/operacoes-decisoes.md` — ADR-007 adicionado explicando o baseline das migrations.

### 7. Commit & push 🚧

- [ ] `git add -A` (incluindo migrations novas, schema, actions, telas, docs)
- [ ] Commit único no padrão: `feat(operacoes): adiciona aprovacao tecnica como etapa do workflow`
- [ ] `git push -u origin feature/operacoes-pr1-workflow-tecnico`
- [ ] (Opcional) Abrir PR no GitHub se quiser revisar visualmente antes do merge

---

## Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Migration de enum no Postgres pode quebrar se houver registros em `EM_APROVACAO` | UPDATE manual no SQL antes de remover o valor do enum |
| Server action `aprovarOperacao` quebrar telas que ainda esperam estado antigo | Buscar todos os usos antes da migration e ajustar no mesmo commit |
| Histórico de aprovações já existente com `papel = FUNDO/FIADOR` continua funcionando? | Sim — adicionar `TECNICA` é aditivo no enum, não remove os existentes |
| Operações já em `EM_APROVACAO` no banco perderem o estado | UPDATE explícito no SQL para `EM_APROVACAO_FINANCEIRA` |

---

## Decisões registradas durante a execução

> _(preencher conforme executar)_

- ...
