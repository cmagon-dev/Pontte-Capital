# 🔢 Nomes Automáticos de Medições

## 📋 Mudanças Implementadas

### 1. **Remoção da Restrição de Mínimo 1 Medição**

Agora é possível **excluir qualquer medição**, incluindo a primeira ou a última.

**Antes:**
```typescript
if (medicoes.length === 1) {
  alert('Deve haver pelo menos uma medição');
  return;
}
```

**Depois:**
```typescript
// Sem restrição - pode excluir todas as medições
```

---

### 2. **Geração Automática de Nomes**

Os nomes das medições agora são **gerados automaticamente** baseados no número sequencial.

**Formato:** `1ª Medição`, `2ª Medição`, `3ª Medição`, etc.

**Lógica:**
```typescript
const proximoNumero = medicoes.length > 0 
  ? Math.max(...medicoes.map(m => m.numero || m.ordem)) + 1 
  : 1;

const nomeAutomatico = `${proximoNumero}ª Medição`;
```

---

### 3. **Remoção do Campo Manual de Nome**

O modal de adicionar medição **não pede mais o nome**, apenas a data prevista.

**Modal Atualizado:**
```
┌─────────────────────────────────┐
│  Nova Medição                   │
├─────────────────────────────────┤
│  ℹ️  O nome será gerado         │
│     automaticamente: 1ª Medição │
│                                 │
│  Data Prevista: [____]          │
│                                 │
│  [Cancelar] [Adicionar]         │
└─────────────────────────────────┘
```

---

### 4. **Simplificação da Edição**

Removida a funcionalidade de **editar o nome** da medição (já que é automático).

**O que permanece:**
- ✅ Editar data prevista (no modal de adicionar)
- ✅ Salvar valores da medição
- ✅ Excluir medição
- ✅ Ocultar/mostrar medição

**O que foi removido:**
- ❌ Edição inline do nome
- ❌ Botão de editar nome/data (redundante)

---

## 🔄 Fluxo Completo

### Adicionar Nova Medição

```
1. Usuário clica em "Adicionar Medição"
   ↓
2. Modal abre mostrando próximo número (ex: "3ª Medição")
   ↓
3. Usuário seleciona apenas a DATA PREVISTA
   ↓
4. Clica em "Adicionar"
   ↓
5. Sistema cria medição com:
   - Nome: "3ª Medição" (automático)
   - Número: 3 (sequencial)
   - Ordem: 3 (mesmo valor)
   - Data: selecionada pelo usuário
   ↓
6. Medição aparece na planilha
```

---

### Excluir Medição

```
1. Usuário clica em 🗑️ na medição
   ↓
2. Confirma exclusão
   ↓
3. Sistema deleta do banco
   ↓
4. Remove valores associados
   ↓
5. Recarrega lista atualizada
```

**IMPORTANTE:** Não há mais restrição de mínimo. Pode excluir TODAS as medições.

---

## 🗄️ Estrutura no Banco

### Campos Relevantes

**PrevisaoMedicao:**
- `nome`: String - Gerado automaticamente ("1ª Medição", "2ª Medição", etc.)
- `numero`: Int - Número sequencial (1, 2, 3...) - usado para identificar
- `ordem`: Int - Ordem de exibição (igual ao número)

**ItemPrevisaoMedicao:**
- `numeroMedicao`: Int - Cópia desnormalizada do número (para queries rápidas)

---

## 📊 Exemplos

### Exemplo 1: Primeira Medição

```typescript
{
  id: "uuid-123",
  nome: "1ª Medição",
  numero: 1,
  ordem: 1,
  dataPrevisao: "2026-01-31",
  tipo: "PERCENTUAL"
}
```

### Exemplo 2: Excluindo a 2ª de 3 Medições

**Antes:**
- 1ª Medição
- 2ª Medição ← excluir
- 3ª Medição

**Depois:**
- 1ª Medição
- 3ª Medição ← mantém o nome original!

**Próxima adição:**
- 4ª Medição ← sequência continua

---

## ⚠️ Comportamento Importante

### Nomes NÃO São Renumerados

Quando você exclui uma medição intermediária, as outras **mantêm seus nomes originais**:

```
Sequência inicial: 1ª, 2ª, 3ª, 4ª
Exclui a 2ª:      1ª, 3ª, 4ª
Adiciona nova:    1ª, 3ª, 4ª, 5ª
```

Isso é **intencional** para:
- ✅ Manter histórico consistente
- ✅ Evitar confusão em relatórios
- ✅ Preservar referências em documentos

---

## 🔧 Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `PrevisoesMedicoesContent.tsx` | Função `adicionarMedicao()` - gera nome automático |
| `PrevisoesMedicoesContent.tsx` | Função `removerMedicao()` - removida restrição mínimo |
| `PrevisoesMedicoesContent.tsx` | Modal - removido campo de nome |
| `PrevisoesMedicoesContent.tsx` | Simplificada edição - apenas data |

---

## 🎯 Melhorias Futuras (Sugeridas)

1. **Renumeração Opcional**
   - Botão "Reorganizar Numeração" que renumera todas sequencialmente
   - Útil após várias exclusões

2. **Prefixo Customizável**
   - Permitir configurar: "Med", "Medição", "M", etc.
   - Exemplo: "Med 01", "Med 02"...

3. **Formato de Data no Nome**
   - Opção de incluir data: "1ª Medição (Jan/26)"

4. **Duplicar Medição**
   - Copiar valores de uma medição para criar nova

---

**Última Atualização:** 26 de Janeiro de 2026

**Versão:** 2.1.0
