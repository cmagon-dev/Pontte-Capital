# Módulo de Operações Financeiras — Decisões (ADR leve)

> Registro curto de decisões importantes. Cada entrada: contexto → decisão → consequências. Não apagar entradas antigas; se mudar de opinião, adicionar nova entrada referenciando a anterior.

---

## ADR-001 — Aprovação técnica unificada com a fila de medições

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
A aprovação técnica das operações (análise de apropriações, contrato, compliance pela Pontte) precisa entrar como etapa entre "construtora enviar" e "Fundo/Fiador aprovar". Havia 2 caminhos:

1. Criar permissão e fila exclusivas (`aprovacoes:tecnica:*`).
2. Unificar com a fila/permissão de aprovação de medições já existente (`aprovacoes:engenharia:*`), com layout em abas.

**Decisão:**
Unificar. A aba "Medições" e a aba "Operações" ficam dentro de `/aprovacoes/engenharia`, usando a mesma permissão `aprovacoes:engenharia:aprovar`.

**Consequências:**
- ✅ Sem permissão nova → sem mudança em `lib/permissoes.ts` nem seed.
- ✅ Usuário Pontte que já aprovava medições passa a ver operações automaticamente.
- ⚠ Se no futuro quisermos times separados (técnico de medição ≠ técnico de operação), teremos que desunificar.
- ⚠ A página vai precisar de KPIs separados por aba.

---

## ADR-002 — CND vencida é alerta, não bloqueio

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
Documentos da construtora (CND Federal, FGTS, CNDT) podem estar vencidos. A pergunta era: a aprovação técnica deve **bloquear** automaticamente?

**Decisão:**
**Não bloqueia.** Apenas mostra alerta amarelo no banner da aba "Compliance" e na visão da fila. A Pontte decide manualmente se prossegue.

**Consequências:**
- ✅ Schema simples — não precisa flag `obrigatorio` em `TipoDocumento`.
- ✅ Flexibilidade para casos onde a Pontte aceita CND vencida por algum motivo formal.
- ⚠ Auditoria depende da disciplina da Pontte em registrar nas observações o porquê de ter aprovado com pendência.
- 🔄 Pode ser revisado no futuro se houver caso de auditoria/compliance que exija bloqueio.

---

## ADR-003 — Borderô gerado sob demanda (PDF não automático)

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
Após aprovação, sistema deve produzir borderô resumindo a operação. Havia 3 caminhos:

1. PDF gerado automaticamente no momento da aprovação.
2. Apenas tela resumo, sem PDF.
3. Tela resumo sempre visível + botão "Gerar PDF" sob demanda.

**Decisão:**
**Opção 3.** Tela resumo sempre disponível para operações `APROVADA`; PDF gerado por botão.

**Consequências:**
- ✅ Não consome processamento na hora da aprovação (geração de PDF pode ser lenta).
- ✅ Permite regerar PDF se mudou algum dado periférico (ex.: conta bancária).
- ✅ Dependência `pdfmake` já está instalada no `package.json`.
- ⚠ Snapshot dos dados ainda precisa ser feito no momento da aprovação (para o PDF ser fiel ao que foi aprovado, mesmo se algo mudar depois).
- ⚠ Precisa armazenamento para PDFs gerados — definir onde (mesmo padrão dos outros docs do sistema).

---

## ADR-004 — Reabertura de operação rejeitada é botão explícito

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
Quando operação é `REJEITADA`, como a construtora corrige? 3 caminhos:

1. Volta automática para `EM_EDICAO` ao ser rejeitada.
2. Continua `REJEITADA` (final) e construtora clona para corrigir.
3. Continua `REJEITADA`, mas com botão explícito "Reabrir para Edição".

**Decisão:**
**Opção 3.** Botão explícito.

**Consequências:**
- ✅ Histórico claro: a rejeição fica registrada como estado final, e a reabertura é um evento auditável separado.
- ✅ Construtora vê o motivo antes de decidir reabrir.
- ⚠ Adiciona uma ação manual extra (não automatiza o retorno).
- ⚠ Histórico precisa registrar reabertura — possivelmente expandir `StatusAprovacaoPapel` para incluir `REABERTA`, ou criar enum dedicado.

---

## ADR-005 — Documentos vivos versionados no repo (não Notion/Confluence)

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
Onde guardar a especificação, roadmap e decisões? Ferramenta externa (Notion, Confluence) ou markdown no repo?

**Decisão:**
Markdown em `docs/` (`operacoes-fluxo.md`, `operacoes-roadmap.md`, `operacoes-decisoes.md`).

**Consequências:**
- ✅ Versionado com o código — PR pode atualizar doc + código no mesmo commit.
- ✅ Onboarding mais simples (dev novo já vê tudo no repo).
- ✅ Não depende de SaaS externo / login.
- ⚠ Diagramas complexos ficam em ASCII art ou Mermaid (limitação visual).
- ⚠ Acesso para não-devs (PO, financeiro) precisa ser pelo GitHub/Cursor.

---

## ADR-006 — Granularidade do PR3 (Análise Técnica) quebrado em 3 sub-PRs

**Data:** 2026-05-11
**Status:** Aceito

**Contexto:**
A tela de Análise Técnica tem 3 abas (EAP, Contrato & Empenho, Compliance). Em um único PR ela passa de 700 linhas, dificultando revisão.

**Decisão:**
Quebrar em PR3a, PR3b, PR3c — uma aba por PR. PR3a entrega o esqueleto da tela + footer (aprovar/rejeitar) + a primeira aba. PR3b e PR3c só adicionam abas.

**Consequências:**
- ✅ PRs revisáveis (~200–350 linhas cada).
- ✅ Aprovação técnica fica funcional já no PR3a (com apenas a aba EAP) — pode rodar em produção mesmo sem PR3b/PR3c.
- ⚠ PR3a precisa entregar o "esqueleto" da tela com tabs vazias para PR3b/PR3c só plugarem conteúdo.
