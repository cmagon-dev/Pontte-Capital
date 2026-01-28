# 🏗️ Acesso aos Cadastros Financeiros

## 📍 Informações da Construtora no Banco de Dados

**Construtora Principal:**
- **Nome:** C S MAGON CONSTRUTORA LTDA
- **Código:** CD-001
- **CNPJ:** 27.097.119/0001-80
- **ID:** `96455aab-c326-4f38-b620-ad4bad378e98`

## 🔗 URLs de Acesso (Páginas Funcionais)

### 1️⃣ Página Principal - Seleção de Construtora
```
http://localhost:3000/fin/cadastros
```
**Nova Interface Estilo Módulos de Engenharia:**
- ✅ Lista todas as construtoras cadastradas
- ✅ Busca/filtro por nome, CNPJ ou nome fantasia
- ✅ KPIs gerais (total de construtoras, credores, contas)
- ✅ Cards expansíveis com informações de cada construtora
- ✅ Métricas individuais (obras, credores, contas, planos, centros de custo)
- ✅ Botão "Ver Cadastros Financeiros desta Construtora"

**Padrão seguido:** Mesma interface dos módulos `/eng/orcamento`, `/eng/plan-medicoes` e `/eng/acompanhamento`

### 2️⃣ Módulo de Credores (Fornecedores, Empreiteiros e Funcionários)
```
http://localhost:3000/fin/cadastros/96455aab-c326-4f38-b620-ad4bad378e98/credores
```
- Listagem de todos os credores
- Filtros por tipo (Fornecedor, Empreiteiro, Funcionário)
- Criação de novos credores
- Edição e exclusão
- **Dados no banco:** 3 credores de exemplo

### 3️⃣ Módulo de Contas Bancárias
```
http://localhost:3000/fin/cadastros/96455aab-c326-4f38-b620-ad4bad378e98/bancos
```
- Listagem de contas bancárias
- Suporte a PIX (CNPJ, CPF, Email, Telefone, Aleatória)
- Controle de saldo
- **Dados no banco:** 2 contas bancárias (Banco do Brasil e Itaú)

### 4️⃣ Módulo de Plano de Contas (DRE)
```
http://localhost:3000/fin/cadastros/96455aab-c326-4f38-b620-ad4bad378e98/plano-contas
```
- Listagem de planos de contas
- Visualização hierárquica (árvore)
- Estrutura DRE completa com linhas de resultado
- **Dados no banco:** 1 plano DRE com ~20 contas

**Visualizar estrutura DRE de um plano específico:**
```
http://localhost:3000/fin/cadastros/96455aab-c326-4f38-b620-ad4bad378e98/plano-contas/[PLANO_ID]
```
(Obtenha o PLANO_ID no Prisma Studio na tabela `PlanoContas`)

### 5️⃣ Módulo de Centro de Custo
```
http://localhost:3000/fin/cadastros/96455aab-c326-4f38-b620-ad4bad378e98/centro-custo
```
- Listagem de centros de custo
- Filtros por tipo (Obra, Administrativo, Departamento)
- **Dados no banco:** 3 centros de custo

## 🔧 Ferramentas de Administração

### Prisma Studio (Visualizar/Editar Banco de Dados)
```bash
npx prisma studio
```
Acesso em: `http://localhost:5555`

### Executar Seed (Popular Banco com Dados de Exemplo)
```bash
npx tsx prisma/seed.ts
```

### Sincronizar Schema com Banco
```bash
npx prisma db push
```

## 📊 Dados de Exemplo Disponíveis

### Credores (3 registros)
1. **CRED-001** - Materiais de Construção Silva Ltda (Fornecedor - PJ)
2. **CRED-002** - Empreiteira Santos & Filhos Ltda (Empreiteiro - PJ)
3. **CRED-003** - João da Silva (Funcionário - PF)

### Contas Bancárias (2 registros)
1. **BANCO-001** - Banco do Brasil (Saldo: R$ 150.000,00) - PIX CNPJ
2. **BANCO-002** - Itaú Unibanco (Saldo: R$ 50.000,00)

### Centros de Custo (3 registros)
1. **CC-001** - Administrativo
2. **CC-002** - Obras
3. **CC-003** - Comercial

### Plano de Contas DRE (1 plano completo)
**PLANO-001** - DRE Padrão - Construção Civil
- Estrutura completa com contas analíticas, sintéticas e linhas de resultado
- Inclui: Receita Bruta, Deduções, CSP, Lucro Bruto, EBITDA, EBIT, Resultado Financeiro, LAIR, Lucro Líquido
- Total de ~20 contas hierárquicas

## 🎯 Próximos Passos

1. **Acessar a página principal:** `/fin/cadastros`
2. **Clicar na construtora desejada** para ver os módulos financeiros
3. **Navegar pelos módulos:** Credores, Bancos, Plano de Contas, Centro de Custo
4. **Criar novos registros** usando os botões "Novo" em cada módulo
5. **Visualizar a estrutura DRE** navegando para um plano de contas específico

## ⚠️ Importante

- Todas as páginas agora utilizam **dados reais do banco de dados**
- Não há mais dados mockados (simulados)
- As operações CRUD (Create, Read, Update, Delete) estão todas funcionais
- A estrutura DRE está completa com suporte a cálculos e fórmulas

## 🔍 Verificar Dados no Banco

Para verificar se os dados foram criados corretamente, abra o Prisma Studio:

```bash
npx prisma studio
```

E navegue pelas tabelas:
- `Construtora`
- `Credor`
- `ContaBancaria`
- `PlanoContas`
- `ContaContabil`
- `CentroCusto`
- `Obra`
