# Dados Mockados Centralizados

Este arquivo contém **TODOS** os dados de exemplo do sistema, facilitando alterações e manutenção.

## 📁 Localização
`lib/mock-data.ts`

## 🎯 Objetivo
Centralizar todos os dados de exemplo em um único arquivo, mantendo apenas **1 exemplo de cada entidade** para facilitar testes e alterações futuras.

**IMPORTANTE:** Todas as obras exibidas nos módulos de Engenharia (Orçamento, Planejamento, Medições, Acompanhamento) **DEVEM** ser cadastradas primeiro no módulo **Contratos de Obras**, que serve como **fonte única de verdade (Single Source of Truth)**.

## 📋 Entidades Disponíveis

### 1. Usuário
- `MOCK_USUARIO` - Eng. João Silva

### 2. Fundo
- `MOCK_FUNDO` - Fundo Alpha FIDC

### 3. Construtora
- `MOCK_CONSTRUTORA` - Construtora ABC Ltda

### 4. Fiador
- `MOCK_FIADOR` - Garantia Construções S.A.

### 5. Obra/Contrato (FONTE ÚNICA DE VERDADE)
- `MOCK_OBRA` - Reforma e Ampliação da Escola Municipal Santa Rita
- **IMPORTANTE:** Esta obra deve ser criada primeiro em Contratos de Obras
- Todos os módulos de Engenharia dependem desta obra

### 6. Planilha Contratual
- `MOCK_PLANILHA_ITENS` - EAP da obra

### 7. Custos Orçados
- `MOCK_CUSTOS_ITENS` - Custos da obra

### 8. Categorização
- `MOCK_CATEGORIZACAO_ITENS` - Categorização EAP

### 9. Visão Gerencial
- `MOCK_VISAO_GERENCIAL_ITENS` - Visão consolidada

### 10. Cronograma Executivo
- `MOCK_CRONOGRAMA_TAREFAS` - Tarefas do cronograma

### 11. Medições
- `MOCK_MEDICOES` - Boletins de medição

### 12. Aditivos/Reajustes/Empenhos
- `MOCK_ADITIVOS`
- `MOCK_REAJUSTES`
- `MOCK_EMPENHOS`

### 13. Contas a Pagar
- `MOCK_CONTAS_PAGAR`

## 🔧 Funções Helper

```typescript
getObraById(id: string)        // Retorna a obra pelo ID
getConstrutoraById(id: string) // Retorna a construtora pelo ID
getFundoById(id: string)       // Retorna o fundo pelo ID
getFiadorById(id: string)      // Retorna o fiador pelo ID
getAllConstrutoras()           // Retorna todas as construtoras (apenas 1)
getAllFundos()                 // Retorna todos os fundos (apenas 1)
getAllFiadores()               // Retorna todos os fiadores (apenas 1)
getAllObras()                  // Retorna todas as obras (apenas 1)
```

## 📝 Como Usar

### Importar dados:
```typescript
import { MOCK_OBRA, MOCK_CONSTRUTORA, getAllObras } from '@/lib/mock-data';
```

### Usar em componentes:
```typescript
// Para listagem
const obras = getAllObras();

// Para detalhes
const obra = getObraById(params.id);
const construtoras = getAllConstrutoras();
```

## ⚠️ Regras Importantes

### Vínculo com Contratos de Obras
1. **Todas as obras** exibidas nos módulos de Engenharia **DEVEM** ser cadastradas primeiro em **Contratos de Obras**
2. A obra só pode aparecer em Orçamento, Planejamento, Medições ou Acompanhamento **se ela existir** em Contratos de Obras
3. **Contratos de Obras** é a **fonte única de verdade** para obras
4. Todas as páginas de listagem de obras usam `getAllObras()` que retorna apenas a obra cadastrada

### Estrutura de Dados
- Sempre edite `lib/mock-data.ts` quando precisar alterar dados de exemplo
- Não crie novos dados mockados em outros arquivos
- Todos os componentes devem usar os dados deste arquivo centralizado
- Em produção, estes dados serão substituídos por chamadas à API

## ✅ Páginas Atualizadas

### Cadastros
- ✅ `/cadastros/construtoras` - Usa `getAllConstrutoras()`
- ✅ `/cadastros/fundos` - Usa `getAllFundos()`
- ✅ `/cadastros/fiadores` - Usa `getAllFiadores()`

### Engenharia - Listagens (todas usam `getAllObras()`)
- ✅ `/eng/contratos/contratos-obras` - Fonte única de verdade
- ✅ `/eng/orcamento` - Usa `getAllObras()`
- ✅ `/eng/planejamento` - Usa `getAllObras()`
- ✅ `/eng/medicoes` - Usa `getAllObras()`
- ✅ `/eng/acompanhamento` - Usa `getAllObras()`

### Engenharia - Detalhes Internos
- ⏳ Páginas `[id]/` de cada módulo devem usar `getObraById(id)`
- ⏳ Páginas de orçamento internas (usar `MOCK_PLANILHA_ITENS`, etc.)
- ⏳ Páginas de planejamento internas
- ⏳ Páginas de medições internas
- ⏳ Dashboard (usar dados centralizados)

## 🔄 Fluxo de Dados

```
Contratos de Obras (Fonte Única)
        ↓
    getAllObras()
        ↓
    ┌─────────────┬──────────────┬───────────────┬────────────────┐
    ↓             ↓              ↓               ↓                ↓
Orçamento   Planejamento   Medições   Acompanhamento   Financeiro
```

## 📝 Notas de Implementação

- **Um único exemplo:** Todas as listagens mostram apenas **1 obra** (MOCK_OBRA)
- **Consistência:** Todos os módulos de Engenharia mostram a mesma obra
- **Fonte única:** Alterações na obra devem ser feitas apenas em `MOCK_OBRA`
- **Preparado para API:** Funções `getXXX()` podem ser facilmente substituídas por chamadas reais
