# `lib/mock-data.ts` — Status: DEPRECATED

> **⚠️ Não importe deste arquivo em código novo.**
> Use as server actions em `app/actions/*` que consultam o Prisma direto.

## Por que este arquivo ainda existe?

Um conjunto de telas antigas (sobretudo de Acompanhamento e Configuração de
Orçamento) ainda dependem de funções `getAllObras()`, `getObraById()` etc.
para renderizar. Quando essas telas forem migradas para dados reais do banco,
**este arquivo será apagado**.

## Telas que ainda dependem deste mock

| Tela | Funções usadas |
|---|---|
| `app/(main)/eng/acompanhamento/page.tsx` | `getAllObras`, `getAllConstrutoras` |
| `app/(main)/eng/acompanhamento/[construtoraId]/page.tsx` | `getAllObras`, `getConstrutoraById`, `getContratoInfoByObraId`, `getMedicoesInfoByObraId` |
| `app/(main)/eng/acompanhamento/[construtoraId]/[obraId]/page.tsx` | mesmo bloco acima + `getCategorizacaoByObraId`, `getVisaoGerencialByObraId` |
| `app/(main)/eng/orcamento/.../categorizacao/configurar/page.tsx` | `getObraById` |
| `app/(main)/eng/orcamento/.../custos-orcados/importar/page.tsx` | `getObraById` |
| `app/(main)/fin/acompanhamento/page.tsx` | `getAllObras`, `getAllConstrutoras`, `getAllFundos` |
| `app/(main)/fin/acompanhamento/[construtoraId]/page.tsx` | várias |
| `app/(main)/fin/cadastros/[id]/bancos/novo/page.tsx` | `getConstrutoraById` |
| `app/(main)/fin/cadastros/[id]/bancos/[bancoId]/page.tsx` | `getConstrutoraById` |
| `app/(main)/cadastros/contratantes/fontes-recurso/[id]/cadastro/page.tsx` | `getFonteRecursoById` |
| `app/components/ModalEAP.tsx` | `getCategorizacaoByObraId`, `getVisaoGerencialByObraId` |

## Histórico

- **2026-05-12** — marcado como deprecated. O seed (`prisma/seed.ts`) deixou
  de criar dados de negócio mock (Construtora ABC, credores, contas
  bancárias). Telas listadas acima continuam funcionando porque importam
  daqui, mas o banco real fica vazio até que a UI seja usada para popular.
