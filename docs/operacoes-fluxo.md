# Módulo de Operações Financeiras — Fluxo Completo

> **Documento vivo.** Atualizar sempre que uma regra de negócio, estado, permissão ou tela mudar. Este é o "contrato" do módulo; o código deve refletir o que está aqui.

---

## 1. Tipos de operação

| Tipo (`TipoOperacao`) | Descrição | Quando usar |
|---|---|---|
| `A_PERFORMAR` | Antecipação de pagamento a fornecedores **antes** da medição. | Construtora precisa pagar materiais/serviços antes de medir/emitir NF. |
| `PERFORMADA` | Antecipação contra NF já emitida ao tomador (medição realizada). | Após emissão da NF de medição, antecipar o recebível. |
| `SALDO_PERFORMADO` | Uso de sobras (saldo residual) de operações performadas anteriores. | Recompra automática / consumo de ledger FIFO de saldo. |

---

## 2. Máquina de Estados (`statusWorkflow`)

```
                     ┌─────────────┐
                     │  EM_EDICAO  │ ◄────────┐
                     └──────┬──────┘          │
                            │ enviarParaAprovacao
                            ▼                 │
              ┌─────────────────────────┐     │
              │ EM_APROVACAO_TECNICA    │     │  reabrirOperacao
              └─────────┬───────┬───────┘     │  (botão explícito)
        aprovarTecnica  │       │ rejeitarTecnica
                        ▼       ▼
       ┌────────────────────┐  ┌────────────┐
       │ EM_APROVACAO_      │  │ REJEITADA  │─┤
       │   FINANCEIRA       │  └────────────┘
       └────────┬───────────┘
   Fundo OK +   │ rejeitarFinanceira
   Fiador OK    │       │
                ▼       ▼
         ┌──────────┐  ┌────────────┐
         │ APROVADA │  │ REJEITADA  │─┘
         └────┬─────┘  └────────────┘
              │ liquidarOperacao
              ▼
   statusFinanceiro: LIQUIDADO
```

### Estados (`StatusWorkflowOperacao`)

| Estado | Quem vê / Quem age | Descrição |
|---|---|---|
| `EM_EDICAO` | Construtora | Operação em rascunho. Pode editar, excluir, adicionar/remover ordens. |
| `EM_APROVACAO_TECNICA` | Pontte (perm. `aprovacoes:engenharia:aprovar`) | Aguarda análise técnica (apropriações, contrato, compliance). |
| `EM_APROVACAO_FINANCEIRA` | Fundo + Fiador | Após técnica aprovada. Fundo e Fiador analisam em paralelo. |
| `APROVADA` | Todos (read-only) | Operação aprovada por todos os papéis aplicáveis. Libera liquidação. |
| `REJEITADA` | Construtora (pode reabrir) | Rejeitada em qualquer etapa. Histórico preserva motivo. |

### Status Financeiro (`StatusFinanceiroOperacao`)

Só faz sentido quando `statusWorkflow = APROVADA`.

| Status | Quando |
|---|---|
| `ABERTO` | Aprovada, dentro do prazo de vencimento. |
| `VENCIDO` | Aprovada, passou da `dataReferencia` sem liquidação. |
| `LIQUIDADO` | Pagamento/recompra confirmado. |

> Atualização automática via `sincronizarStatusFinanceiroPorVencimento` (`app/actions/operacoes.ts`).

---

## 3. Matriz Ator × Ação × Permissão

| Ação | Construtora | Pontte Técnico | Fundo | Fiador | Estado-origem |
|---|---|---|---|---|---|
| Criar operação | ✅ `fin:operacoes:criar` | — | — | — | (n/a) |
| Editar operação/ordens | ✅ `fin:operacoes:editar` | — | — | — | `EM_EDICAO` |
| Excluir operação | ✅ `fin:operacoes:editar` | — | — | — | `EM_EDICAO` |
| Enviar para aprovação | ✅ `fin:operacoes:editar` | — | — | — | `EM_EDICAO` |
| Aprovar Técnica | — | ✅ `aprovacoes:engenharia:aprovar` | — | — | `EM_APROVACAO_TECNICA` |
| Rejeitar Técnica | — | ✅ `aprovacoes:engenharia:aprovar` | — | — | `EM_APROVACAO_TECNICA` |
| Aprovar Financeira (Fundo) | — | — | ✅ `aprovacoes:financeiro:aprovar` | — | `EM_APROVACAO_FINANCEIRA` |
| Aprovar Financeira (Fiador) | — | — | — | ✅ `aprovacoes:fiador:aprovar` | `EM_APROVACAO_FINANCEIRA` |
| Rejeitar Financeira | — | — | ✅ | ✅ | `EM_APROVACAO_FINANCEIRA` |
| Reabrir após rejeição | ✅ `fin:operacoes:editar` (botão explícito) | — | — | — | `REJEITADA` |
| Liquidar manualmente | ✅ `fin:operacoes:editar` | — | — | — | `APROVADA` + (`ABERTO`/`VENCIDO`) |
| Gerar borderô (PDF) | ✅ visualiza | ✅ visualiza | ✅ visualiza | ✅ visualiza | `APROVADA` |

### Permissões em uso (não há novas)

| Chave | Origem | Reutilizada para |
|---|---|---|
| `fin:operacoes:criar` / `editar` | já existente em `lib/permissoes.ts` | construtora |
| `aprovacoes:engenharia:ver` / `aprovar` | já existente, hoje usada só para medições | **passará a cobrir também a aprovação técnica das operações** |
| `aprovacoes:financeiro:ver` / `aprovar` | já existente | Fundo |
| `aprovacoes:fiador:ver` / `aprovar` | já existente | Fiador |

---

## 4. Telas

### Existentes (a refinar)

| Tela | Caminho | O que muda |
|---|---|---|
| Listagem por construtora | `/fin/operacoes/solicitacoes/[c]` | Mostrar novo estado `EM_APROVACAO_TECNICA` no filtro/badge. |
| Nova A_PERFORMAR | `/fin/operacoes/solicitacoes/[c]/nova` | Sem mudança estrutural. |
| Nova PERFORMADA | `/fin/operacoes/solicitacoes/[c]/nova-performada` | Sem mudança estrutural. |
| Detalhe da operação | `/fin/operacoes/solicitacoes/[c]/[id]` | Botão "Reabrir para Edição" quando `REJEITADA`. Bloco "Borderô" quando `APROVADA`. |
| Fila Fundo/Fiador | `/fin/operacoes/aprovacoes` | Bloco "Parecer Técnico Pontte" + checklist consolidado. |
| Fila técnica (medições) | `/aprovacoes/engenharia` | Vira **abas**: "Medições" (existente) + "Operações" (nova). |

### Novas

| Tela | Caminho | Conteúdo |
|---|---|---|
| Fila Técnica — Operações | `/aprovacoes/engenharia` (aba) | Lista operações em `EM_APROVACAO_TECNICA`. |
| Análise Técnica da Operação | `/aprovacoes/engenharia/operacao/[id]` | 3 abas (ver seção 5). |
| Borderô | `/fin/operacoes/solicitacoes/[c]/[id]/bordero` | Resumo + botão "Gerar PDF". |

---

## 5. Tela de Análise Técnica (3 abas)

Acessada a partir da fila técnica. Estado-origem: `EM_APROVACAO_TECNICA`. Footer fixo com `[Reprovar]` (modal de motivo) e `[Aprovar Tecnicamente]`.

### Aba 1 — Apropriações & EAP

- Árvore da EAP Gerencial da obra (reusa `ModalEAP` / `buscarAcumuladoCompradoPorObra` em `app/actions/operacoes.ts`).
- **4 colunas comparativas por item da EAP**:
  1. `Planilha contratual %` (% original do contrato)
  2. `Acumulado anterior %` (operações **APROVADAS** anteriores, **excluindo a atual**)
  3. `Esta operação %` (% da operação em análise)
  4. `Saldo restante %` (1 − 2 − 3)
- Cada linha expande as **ordens da operação atual** com:
  - Credor, número doc, valor, % apropriação.
  - Botão para abrir anexo da ordem (PDF/imagem) inline.
- Alerta amarelo (não bloqueante) quando `2 + 3 > 1`.

### Aba 2 — Contrato & Engenharia

- Listagem de documentos do contrato (model `Documento` filtrado por `obraId`, `aditivoId`, `reajusteId`, `empenhoId`).
- Saldo total de empenhos (`Empenho.saldoAtual` somado por obra) + lista de empenhos individuais com link para o PDF.
- **Alterações pendentes**: medições não aprovadas, aditivos em rascunho, reajustes pendentes (query consolidada).
- Alerta amarelo se houver pendências (não bloqueia).

### Aba 3 — Compliance Fiscal/Jurídico

- Lista de `Documento` da construtora com `categoria` e `dataValidade`.
- Banner amarelo no topo quando há docs vencidos (alerta, **não bloqueia** — decisão registrada em `decisoes.md`).
- Checklist manual da Pontte (UI-only, não persiste por enquanto): "CND Federal OK", "FGTS OK", "CNDT OK".

---

## 6. Borderô

### Schema

```prisma
model Bordero {
  id                String        @id @default(uuid())
  operacaoId        String        @unique
  numero            Int           // sequencial por construtora
  dataGeracao       DateTime      @default(now())
  snapshot          Json          // dump consolidado dos dados na hora da geração
  contaBancariaId   String?
  pdfCaminho        String?       // null até "Gerar PDF" ser clicado
  geradoPorId       String

  operacao          Operacao      @relation(...)
  contaBancaria     ContaBancaria? @relation(...)
  geradoPor         Usuario       @relation(...)

  @@unique([operacaoId])
  @@index([numero])
}
```

`Operacao` ganha: `contaBancariaDepositoId String?`.

### Ações

- `gerarOuObterBordero(operacaoId)` — cria registro se não existir (snapshot tirado uma vez quando a operação foi `APROVADA`), retorna existente.
- `gerarBorderoPdf(operacaoId)` — usa `pdfmake` (já instalado), salva em disk, popula `pdfCaminho`.

### Conteúdo (snapshot + PDF)

- Cabeçalho: construtora (razão social + CNPJ), nº op, data, tipo.
- Obra: código, nome, fundo, fiador(es).
- Valores: total ordens, juros, taxas, deságio, valor bruto, vencimento (`dataReferencia`).
- Conta de depósito: banco, agência, conta, chave PIX (se houver).
- Lista de ordens: credor, doc, valor, % apropriação principal.
- Aprovações: Técnica (quem/quando), Fundo, Fiador.

---

## 7. Liquidação multimodal

### Schema

```prisma
enum TipoLiquidacao {
  RECOMPRA_PERFORMADA
  RECOMPRA_SALDO_PERFORMADO
  DEPOSITO_ESCROW
  OUTRO
}
```

`Operacao` ganha:
- `tipoLiquidacao TipoLiquidacao?`
- `observacoesLiquidacao String? @db.Text`
- Anexo de comprovante: reusar `DocumentoOrdem` ou criar `DocumentoOperacao` (decidir na PR6).

### Comportamento

- Recompra (já existente em `criarOperacaoPerformada` → `RecompraOperacao`) seta `tipoLiquidacao = RECOMPRA_*` automaticamente.
- Liquidação manual: action `liquidarOperacao(id, { dataPagamento, tipo, observacoes, comprovanteFile? })`.

---

## 8. Reabertura após rejeição

- Action: `reabrirOperacao(id)`.
- Permitido quando `statusWorkflow = REJEITADA` e usuário tem `fin:operacoes:editar`.
- Comportamento:
  - `statusWorkflow → EM_EDICAO`.
  - Zera campos de aprovação técnica/Fundo/Fiador (status volta a `PENDENTE` no próximo envio).
  - Mantém **histórico completo** em `OperacaoAprovacaoHistorico` (não apaga).
  - Adiciona entrada no histórico com `decisao = REABERTA` (precisa expandir enum `StatusAprovacaoPapel` ou criar enum separado — decidir na PR7).

---

## 9. Bloqueios vs Alertas (resumo de regras)

| Situação | Aprovação Técnica | Aprovação Financeira |
|---|---|---|
| Documento construtora vencido | ⚠ Alerta amarelo, **não bloqueia** | ⚠ Alerta herdado |
| Saldo empenho insuficiente | ⚠ Alerta, não bloqueia | — |
| Acumulado anterior + atual > 100% da linha | ⚠ Alerta no item | — |
| Medição vinculada não aprovada (Performada) | ⛔ Bloqueia | ⛔ Bloqueia |
| Operação sem ordens de pagamento | ⛔ Bloqueia | ⛔ Bloqueia |
| Aprovação técnica ainda `PENDENTE` | (não se aplica) | ⛔ Bloqueia (estado anterior) |

---

## 10. Modelos Prisma — visão geral

### Existentes (sem mudança ou pequenos ajustes)

- `Operacao` — adicionar `contaBancariaDepositoId`, `tipoLiquidacao`, `observacoesLiquidacao` + campos de aprovação técnica (`aprovacaoTecnicaStatus`, `aprovacaoTecnicaData`, `aprovacaoTecnicaMotivo`, `aprovacaoTecnicaPorId`).
- `OrdemPagamento`, `ApropriacaoOrcamentaria` — sem mudança.
- `RecompraOperacao`, `SaldoPerformadoLancamento`, `SaldoPerformadoAlocacao` — sem mudança.
- `OperacaoAprovacaoHistorico` — incluir papel `TECNICA` no enum `PapelAprovacaoOperacao` e decisão `REABERTA` no enum `StatusAprovacaoPapel`.

### Novos

- `Bordero` (ver seção 6).
- Possivelmente `DocumentoOperacao` (a confirmar na PR6).

### Enums

- `StatusWorkflowOperacao` — adicionar `EM_APROVACAO_TECNICA` e `EM_APROVACAO_FINANCEIRA` (renomear ou manter `EM_APROVACAO` como alias? **decidir na PR1**).
- `PapelAprovacaoOperacao` — adicionar `TECNICA`.
- `StatusAprovacaoPapel` — adicionar `REABERTA` (ou criar enum próprio para histórico).
- `TipoLiquidacao` — novo (seção 7).

---

## 11. Server actions — visão geral

### Existentes (refatorar)

- `enviarParaAprovacao` (`app/actions/operacoes.ts:939`) — passa a setar `EM_APROVACAO_TECNICA` e `aprovacaoTecnicaStatus = PENDENTE`.
- `submeterParaAprovacao` (`:766`) — **deduplicar/remover** (hoje é redundante com `enviarParaAprovacao`).
- `aprovarOperacao` / `rejeitarOperacao` — passam a operar **apenas** na fase financeira (fundo/fiador).
- `liquidarOperacao` — receber objeto com `tipoLiquidacao`, `observacoes`, comprovante.

### Novas

- `aprovarTecnica(id)` / `rejeitarTecnica(id, motivo)` — perm. `aprovacoes:engenharia:aprovar`.
- `reabrirOperacao(id)` — perm. `fin:operacoes:editar`.
- `gerarOuObterBordero(operacaoId)` / `gerarBorderoPdf(operacaoId)`.

---

## 12. Fluxo idêntico para Performada

O fluxo das seções 2–11 vale igual para operações **PERFORMADA**, com a diferença na **aba 1 (Apropriações & EAP) da análise técnica**: em vez de listar ordens com apropriações, lista:

- NF emitida (número, data, valor bruto, retenções, líquido).
- Vínculo com `PrevisaoMedicao` ou `nfReferencia` (reajuste/complemento).
- Recompras emitidas (quais operações A_PERFORMAR estão sendo liquidadas).
- Saldo residual gerado (créditos em `SaldoPerformadoLancamento`).

As abas 2 (Contrato & Engenharia) e 3 (Compliance) são idênticas.
