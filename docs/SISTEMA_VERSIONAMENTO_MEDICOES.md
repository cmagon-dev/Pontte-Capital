# Sistema de Versionamento de Medições - Documentação Completa

## 📋 Visão Geral

Sistema completo de versionamento de orçamentos e medições, permitindo gerenciar aditivos contratuais, revisões, glosas e migração automática de medições entre versões.

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Implementado e Funcional

---

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1: Schema e Estrutura de Dados
- Novos modelos Prisma: `HistoricoVersaoMedicao`, `MapeamentoItemVersao`
- Enums: `TipoAlteracaoItem`, `TipoAditivo`
- Relações bidirecionais entre versões e medições
- Campo `versaoReferenciaId` para rastreamento de origem

### ✅ Fase 2: Detecção e Mapeamento
- Detecção automática de novas versões
- Mapeamento de alterações item por item
- Identificação de: adições, remoções, alterações de quantidade/preço
- Server actions: `criarMapeamentoVersoes`, `analisarImpactoVersao`

### ✅ Fase 3: Interface - Banner e Seletor
- Banner de notificação de nova versão
- Seletor dropdown para navegar entre versões
- Indicador visual de versão histórica
- Botões de ação: "Recalcular", "Ver Detalhes", "Comparar"

### ✅ Fase 4: Badges Visuais
- Componente `BadgeAlteracao` com 5 tipos:
  - 🟢 Ajustado - Aditivo
  - 🟠 Ajustado - Glosa
  - 🔵 Adicionado - Aditivo
  - 🔴 Retirado - Glosa
  - 🔴 Concluído + Retirado
- Tooltips informativos com detalhes de alteração

### ✅ Fase 5: Lógica de Recálculo
- Recálculo automático de percentuais
- Mantém quantidades absolutas
- Preserva medições concluídas (status REALIZADA)
- Função: `recalcularPercentuaisMedicoes`

### ✅ Fase 6: Modal de Migração
- `ModalAnaliseVersao`: Preview completo antes da migração
- Estatísticas detalhadas (adicionados, removidos, alterados)
- Impacto financeiro calculado
- Tabela filtável de alterações
- Confirmação com migração automática

### ✅ Fase 7: Itens Removidos
- Campos desabilitados para itens removidos
- Visual diferenciado: strikethrough, opacidade, cor vermelha
- Label "(ITEM REMOVIDO)" na descrição
- Não contam no saldo contratual

### ✅ Fase 8: Comparação de Versões
- `ModalComparacaoVersoes`: Análise lado a lado
- Busca em tempo real
- Filtros: TODOS, ADICIONADO, REMOVIDO, ALTERADO, MANTIDO
- Ordenação: por código ou por impacto financeiro
- Estatísticas resumidas no header

### ✅ Fase 9: Medições Negativas
- Suporte a valores negativos (desmedições)
- Validação: acumulado total >= 0
- Indicadores visuais: ⚠️ cor vermelha, negrito
- Funções: `validarMedicaoNegativa`, `formatarParaDigitacao` com sinal

### ✅ Fase 10: Histórico de Aditivos
- `ModalHistoricoAditivos`: Timeline cronológica
- Cards expansíveis com detalhes
- Filtros por tipo: ADITIVO, REVISAO, GLOSA
- Estatísticas gerais: impacto total acumulado
- Linha visual conectando eventos

### ✅ Fase 11: Relatórios com Versionamento
- `gerarRelatorioMedicaoComVersao`: Relatório individual
- `gerarRelatorioConsolidadoVersoes`: Relatório global
- `buscarInfoVersaoMedicao`: Info de versão para UI
- Identificação de medições migradas

### ✅ Fase 12: Permissões e Controle
- Sistema de permissões por nível:
  - Visualizador
  - Editor
  - Gestor
  - Administrador
- 9 tipos de permissões diferentes
- Validação de regras de negócio
- Log de auditoria (preparado para expansão)

---

## 📁 Estrutura de Arquivos

```
prisma/
└── schema.prisma                    # Schema com novos modelos

app/
├── actions/
│   ├── versoes-medicao.ts          # CRUD de versões e mapeamento
│   ├── relatorios-versao.ts        # Geração de relatórios
│   └── permissoes-versao.ts        # Sistema de permissões
│
└── eng/plan-medicoes/[construtoraId]/[obraId]/previsoes-medicoes/
    ├── PrevisoesMedicoesContent.tsx         # Componente principal
    └── components/
        ├── BadgeAlteracao.tsx               # Badge de alteração
        ├── ModalAnaliseVersao.tsx           # Modal de preview/migração
        ├── ModalComparacaoVersoes.tsx       # Modal de comparação
        ├── ModalHistoricoAditivos.tsx       # Modal de histórico
        └── InfoVersaoMedicao.tsx            # Info de versão inline

docs/
└── SISTEMA_VERSIONAMENTO_MEDICOES.md       # Este documento
```

---

## 🔧 Modelos de Dados

### HistoricoVersaoMedicao
Registra cada alteração de versão (aditivo, revisão, glosa).

```prisma
model HistoricoVersaoMedicao {
  id                String      @id @default(uuid())
  obraId            String
  versaoAnteriorId  String
  versaoNovaId      String
  dataAtualizacao   DateTime    @default(now())
  tipoAlteracao     TipoAditivo
  numeroAditivo     Int?
  descricao         String?
  usuarioId         String?
  
  itensAdicionados  Int         @default(0)
  itensRemovidos    Int         @default(0)
  itensAlterados    Int         @default(0)
  itensMantidos     Int         @default(0)
  
  obra              Obra        @relation(...)
  versaoAnterior    VersaoOrcamento @relation("VersaoAnterior", ...)
  versaoNova        VersaoOrcamento @relation("VersaoNova", ...)
}
```

### MapeamentoItemVersao
Mapeia alterações item por item entre versões.

```prisma
model MapeamentoItemVersao {
  id                  String              @id @default(uuid())
  obraId              String
  versaoAnteriorId    String
  versaoNovaId        String
  itemAnteriorId      String?
  itemNovoId          String?
  codigo              String
  tipoAlteracao       TipoAlteracaoItem
  
  quantidadeAnterior  Decimal?            @db.Decimal(12, 4)
  quantidadeNova      Decimal?            @db.Decimal(12, 4)
  precoAnterior       Decimal?            @db.Decimal(18, 2)
  precoNovo           Decimal?            @db.Decimal(18, 2)
  
  createdAt           DateTime            @default(now())
  
  @@unique([versaoAnteriorId, versaoNovaId, codigo])
}
```

### Enums

```prisma
enum TipoAlteracaoItem {
  MANTIDO
  ADICIONADO
  REMOVIDO
  QUANTIDADE_ALTERADA
  PRECO_ALTERADO
  QUANTIDADE_E_PRECO_ALTERADOS
}

enum TipoAditivo {
  ADITIVO    // Acréscimo
  REVISAO    // Revisão geral
  GLOSA      // Supressão
}
```

---

## 🔄 Fluxos Principais

### 1. Detecção de Nova Versão

```
1. useEffect detecta mudança em versaoOrcamentoId
2. Compara com versão das medições no banco
3. Se diferente:
   - Define novaVersaoDetectada = true
   - Carrega mapeamentoAlteracoes
   - Exibe banner de notificação
```

### 2. Migração de Medições

```
1. Usuário clica "Ver Detalhes"
2. abrirModalAnalise():
   - Busca análise de impacto
   - Calcula estatísticas e impacto financeiro
   - Exibe modal com preview
3. Usuário clica "Confirmar Migração"
4. confirmarMigracao():
   - Atualiza versaoOrcamentoId de todas medições
   - Define versaoReferenciaId = versão anterior
   - Recalcula percentuais automaticamente
   - Recarrega dados
```

### 3. Recálculo de Percentuais

```
1. Busca mapeamento de itens com quantidade alterada
2. Para cada item:
   - Busca medições do item
   - Calcula novo percentual = (qtdMedida / qtdNovaContratual) * 100
   - Atualiza apenas medições NÃO concluídas
3. Retorna estatísticas de itens/medições recalculados
```

### 4. Validação de Medição Negativa

```
1. Usuário digita valor negativo
2. atualizarValorMedicao() chama validarMedicaoNegativa()
3. Calcula acumulado sem a medição atual
4. Soma com novo valor negativo
5. Se acumulado < 0:
   - Rejeita com alerta explicativo
6. Senão:
   - Aceita valor negativo
   - Aplica visual de alerta (⚠️ vermelho)
```

---

## 🎨 Componentes de UI

### BadgeAlteracao
**Props:**
- `tipo`: 'ajustado-glosa' | 'ajustado-aditivo' | 'adicionado' | 'retirado' | 'concluido-retirado'
- `quantidadeAnterior`, `quantidadeNova`
- `precoAnterior`, `precoNovo`
- `numeroAditivo`

**Visual:**
- Badge colorido com emoji
- Tooltip no hover com detalhes completos
- Formatação de valores em BRL e decimais

### ModalAnaliseVersao
**Props:**
- `versaoAnterior`, `versaoNova`
- `estatisticas`, `impactoFinanceiro`
- `mapeamento[]`
- `onConfirmarMigracao`

**Funcionalidades:**
- Cards de estatísticas (4)
- Impacto financeiro com variação
- Filtros por tipo de alteração
- Tabela completa de itens
- Botão "Confirmar Migração"

### ModalComparacaoVersoes
**Props:**
- `versaoAnterior`, `versaoNova`
- `mapeamento[]`

**Funcionalidades:**
- Busca em tempo real
- Filtros: TODOS, ADICIONADO, REMOVIDO, ALTERADO, MANTIDO
- Ordenação: código ou impacto
- Tabela lado a lado com cores diferenciadas
- Coluna de variação (delta)

### ModalHistoricoAditivos
**Props:**
- `historico[]`
- `nomeObra`

**Funcionalidades:**
- Timeline visual com linha conectora
- Cards expansíveis
- Filtros por tipo de alteração
- Estatísticas gerais no header
- Impacto total acumulado

### InfoVersaoMedicao
**Props:**
- `versaoAtual`, `versaoOriginal`
- `foiMigrada`

**Visual:**
- Badge inline azul ou amarelo
- Tooltip com informações detalhadas
- Indicação de migração (v1 → v2)

---

## 🔐 Sistema de Permissões

### Níveis de Acesso

| Nível | Permissões |
|-------|------------|
| **Visualizador** | • visualizar_historico<br>• comparar_versoes |
| **Editor** | • Todas do Visualizador<br>• recalcular_percentuais |
| **Gestor** | • Todas do Editor<br>• criar_aditivo<br>• criar_revisao<br>• criar_glosa<br>• migrar_medicoes |
| **Administrador** | • Todas do Gestor<br>• aprovar_aditivo<br>• excluir_versao |

### Uso

```typescript
// Verificar permissão
const { temPermissao, mensagem } = await verificarPermissao(
  usuarioId,
  obraId,
  'migrar_medicoes'
);

// Autorizar ação completa (permissão + validação)
const { autorizado, mensagem } = await autorizarAcaoVersao(
  usuarioId,
  obraId,
  'criar_aditivo',
  { /* dados */ }
);
```

---

## 📊 Relatórios

### Relatório Individual de Medição
```typescript
const relatorio = await gerarRelatorioMedicaoComVersao(obraId, medicaoId);

// Retorna:
{
  medicao: { ... },
  versao: {
    atual: { numero, nome, dataVersao },
    original: { ... },
    foiMigrada: boolean
  },
  itens: [...]itens,
  totais: { quantidadeTotal, valorTotal, percentualMedio }
}
```

### Relatório Consolidado de Versões
```typescript
const relatorio = await gerarRelatorioConsolidadoVersoes(obraId);

// Retorna:
{
  obra: { id, totalVersoes, versaoAtiva },
  versoes: [
    {
      versaoNumero, versaoNome,
      totalItens, valorTotal,
      delta, percentualVariacao, percentualDoInicial
    }
  ],
  historico: [...],
  resumo: {
    valorInicial, valorFinal, variacaoTotal,
    percentualVariacaoTotal,
    totalAditivos, totalRevisoes, totalGlosas
  }
}
```

---

## 🧪 Casos de Teste

### Teste 1: Migração Simples
```
1. Criar Versão 2 (aditivo com 5 itens novos)
2. Abrir tela de medições
3. Banner deve aparecer ✅
4. Clicar "Ver Detalhes"
5. Verificar estatísticas:
   - 5 itens adicionados ✅
   - Impacto positivo ✅
6. Confirmar migração
7. Verificar versão atualizada ✅
```

### Teste 2: Medição Negativa
```
1. Medição 01: 100 m²
2. Medição 02: Digitar -50 m²
3. Deve aceitar ✅ (acumulado = 50)
4. Visual vermelho com ⚠️ ✅
5. Tentar -60 m²
6. Deve rejeitar ❌ (acumulado = -10)
7. Alerta explicativo ✅
```

### Teste 3: Item Removido
```
1. Versão 2 remove item 1.1.1
2. Abrir planilha
3. Item 1.1.1 deve aparecer:
   - Com strikethrough ✅
   - Badge "Retirado" ✅
   - Label "(ITEM REMOVIDO)" ✅
   - Campos desabilitados ✅
   - Opacidade 50% ✅
```

### Teste 4: Comparação de Versões
```
1. Clicar "Comparar Versões"
2. Buscar por "escavação"
3. Filtrar por "ALTERADO"
4. Ordenar por "Impacto Financeiro"
5. Verificar item com maior variação aparece primeiro ✅
6. Verificar cores lado a lado (azul/verde) ✅
```

### Teste 5: Histórico Completo
```
1. Criar 3 aditivos sequenciais
2. Clicar "Histórico de Alterações"
3. Verificar timeline com 3 cards ✅
4. Expandir Aditivo 02
5. Verificar detalhes completos ✅
6. Filtrar por "ADITIVO" → mostra apenas 3 ✅
7. Verificar impacto total acumulado ✅
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Workflow de Aprovação**
   - Sistema de aprovação de aditivos
   - Múltiplos aprovadores
   - Histórico de aprovações

2. **Notificações**
   - Email quando nova versão disponível
   - Notificações in-app
   - Alertas de prazos

3. **Exportação Avançada**
   - PDF dos relatórios
   - Excel com múltiplas abas
   - Gráficos de evolução

4. **Dashboard de Versões**
   - Gráfico de evolução do valor
   - Timeline visual
   - Métricas de impacto

5. **Integração com Documentos**
   - Upload de termos aditivos
   - Vincular arquivos a versões
   - Assinatura digital

---

## 📝 Notas de Implementação

### Performance
- Mapeamentos são calculados sob demanda
- Cache de mapeamentos no estado React
- Queries otimizadas com índices no Prisma
- Carregamento progressivo de histórico

### Segurança
- Validações server-side em todas as ações
- Verificação de permissões antes de operações
- Log de auditoria para ações críticas
- Proteção contra acumulados negativos

### UX
- Loading states em todas as operações async
- Feedback visual claro (cores, ícones, emojis)
- Tooltips informativos
- Mensagens de erro específicas
- Confirmações para ações destrutivas

---

## 🎉 Conclusão

Sistema completo de versionamento implementado com sucesso!

**Estatísticas:**
- ✅ 12 Fases implementadas
- ✅ 5 Novos componentes React
- ✅ 3 Server action files
- ✅ 2 Novos modelos Prisma
- ✅ 2 Novos enums
- ✅ 9 Tipos de permissões
- ✅ 100% Funcional

**Impacto:**
- Gerenciamento completo de aditivos contratuais
- Rastreabilidade total de alterações
- Migração automática de medições
- Controle de acesso robusto
- Relatórios detalhados
- Interface intuitiva e responsiva

---

**Documentação gerada em:** Janeiro 2026  
**Versão do Sistema:** 1.0.0  
**Status:** ✅ Produção
