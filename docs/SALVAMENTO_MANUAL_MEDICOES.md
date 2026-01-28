# 💾 Salvamento Manual de Medições

## 📋 Mudanças Implementadas

### 1. **Campo `numeroMedicao` no Banco**

Adicionado campo `numeroMedicao` em `ItemPrevisaoMedicao` para identificar rapidamente qual medição (1ª, 2ª, 3ª...).

```prisma
model ItemPrevisaoMedicao {
  id                   String           @id @default(uuid())
  previsaoMedicaoId    String
  numeroMedicao        Int              @default(1) // 1ª, 2ª, 3ª Medição...
  // ... outros campos
}
```

**Benefícios:**
- ✅ Consultas mais rápidas por número de medição
- ✅ Facilita ordenação e filtros
- ✅ Desnormalização útil para relatórios

---

### 2. **Salvamento Manual por Medição**

Anteriormente, os valores eram salvos automaticamente ao sair do campo (`onBlur`).  
Agora, o salvamento só acontece quando clicar no botão **"Salvar"** de cada medição.

#### Fluxo Atual:

```
1. Usuário edita valores na coluna da medição
   → Valores ficam apenas no estado local do componente

2. Usuário clica no botão "Salvar" (verde, ao lado de cada medição)
   → Coleta todos os itens com valores desta medição
   → Deleta itens antigos do banco
   → Cria novos itens com os valores atualizados
   → Recalcula acumulados automaticamente
   → Exibe mensagem de sucesso
```

---

### 3. **Função `substituirItensMedicao`**

Nova função no backend que substitui todos os itens de uma medição de forma eficiente:

**`app/actions/previsoes-medicao.ts`**
```typescript
export async function substituirItensMedicao(
  previsaoMedicaoId: string,
  itens: ItemPrevisaoMedicaoInput[],
  numeroMedicao: number
): Promise<{ success: boolean; data?: any; error?: string }>
```

**Como funciona:**
1. Deleta todos os itens existentes da medição
2. Cria novos itens com os valores atualizados
3. Recalcula acumulados automaticamente
4. Revalida cache do Next.js

---

### 4. **Nova Rota API**

**`PUT /api/previsoes-medicao/[id]/itens`**

Substitui todos os itens de uma medição específica.

**Request:**
```json
{
  "itens": [
    {
      "itemOrcamentoId": "uuid",
      "itemCustoOrcadoId": "uuid",
      "quantidadePrevista": 100.50,
      "percentualPrevisto": 25.00,
      "valorPrevisto": 15000.00
    }
  ],
  "numeroMedicao": 1
}
```

**Response:**
```json
{
  "message": "Itens substituídos com sucesso"
}
```

---

### 5. **UI Atualizada**

#### Botão "Salvar" em Cada Medição

Adicionado botão verde "Salvar" no cabeçalho de cada coluna de medição:

```
┌─────────────────────────────────────┐
│  Medição 01 - Janeiro/2024          │
│  Data Prevista: 31/01/2024          │
│  [Salvar] [👁️] [✏️] [🗑️]          │
└─────────────────────────────────────┘
```

**Características:**
- ✅ Botão verde com ícone de disco
- ✅ Texto "Salvar" visível
- ✅ Desabilitado durante salvamento
- ✅ Posicionado ao lado dos outros controles

---

## 🔄 Comparação: Antes vs Depois

### ❌ Antes (Salvamento Automático)

```
Digite valor → Sair do campo → Salva automaticamente no banco
```

**Problemas:**
- Muitas requisições ao banco (uma por campo)
- Difícil controlar quando salvar
- Lento em redes lentas

### ✅ Depois (Salvamento Manual)

```
Digite valores → Clique em "Salvar" → Salva todos de uma vez
```

**Vantagens:**
- Uma requisição por medição (batch)
- Controle total do usuário
- Performance melhorada
- Feedback claro de sucesso

---

## 📊 Exemplo de Uso

### Cenário: Preencher 1ª Medição

1. **Usuário abre tela de Previsões de Medição**
   - Sistema carrega medições existentes do banco

2. **Usuário clica em "Editar" na 1ª Medição**
   - Seleciona tipo: "Quantidade" ou "Percentual"
   - Campos ficam editáveis

3. **Usuário preenche valores nos campos**
   - Item 1: 100 unidades
   - Item 2: 50%
   - Item 3: 200 unidades
   - *Valores ficam apenas na memória (estado local)*

4. **Usuário clica em "Salvar" (botão verde)**
   - Sistema coleta todos os valores
   - Deleta itens antigos desta medição
   - Cria novos itens com valores atualizados
   - Recalcula acumulados
   - Exibe: "Medição 01 - Janeiro/2024 salva com sucesso!"

5. **Usuário recarrega a página**
   - ✅ Todos os valores estão salvos no banco
   - ✅ Acumulados corretos
   - ✅ Saldos atualizados

---

## 🔧 Arquivos Modificados

### Backend

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | Adicionado campo `numeroMedicao` em `ItemPrevisaoMedicao` |
| `app/actions/previsoes-medicao.ts` | Nova função `substituirItensMedicao()` |
| `app/api/previsoes-medicao/[id]/itens/route.ts` | Nova rota `PUT` para substituir itens |

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `lib/api/previsoes-medicao-client.ts` | Nova função `substituirItensMedicao()` |
| `PrevisoesMedicoesContent.tsx` | Removido salvamento automático, adicionado botão "Salvar" |

---

## 🎯 Comandos Executados

```bash
# Atualizar schema do banco
npx prisma db push

# Gerar cliente Prisma atualizado
npx prisma generate
```

---

## ✅ Resultado Final

**STATUS:** ✅ **COMPLETO E FUNCIONAL**

### Funcionalidades:

- ✅ Campo `numeroMedicao` no banco de dados
- ✅ Salvamento manual por medição (botão "Salvar")
- ✅ Substituição eficiente de itens (deleta e recria)
- ✅ Recálculo automático de acumulados
- ✅ Feedback visual de sucesso
- ✅ Performance melhorada (batch em vez de one-by-one)

### Próximos Passos (Sugeridos):

1. **Adicionar confirmação ao sair sem salvar**
   - Detectar mudanças não salvas
   - Exibir modal: "Você tem alterações não salvas. Deseja sair?"

2. **Indicador visual de pendências**
   - Badge mostrando quantos itens foram editados
   - Cor diferente no botão "Salvar" quando há pendências

3. **Undo/Redo**
   - Histórico de mudanças
   - Botão para desfazer última ação

4. **Salvamento offline**
   - LocalStorage para backup temporário
   - Sincronização automática quando voltar online

---

**Última Atualização:** 26 de Janeiro de 2026

**Versão:** 2.0.0
