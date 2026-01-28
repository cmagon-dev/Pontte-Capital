# 🔧 Solução para Problemas de Visualização Após Alterações

## 🎯 Problema Identificado

Sempre que você faz alterações no código, o sistema para de visualizar corretamente. Isso geralmente resulta em erros como:
- `Cannot find module './1682.js'`
- Página em branco
- Erro 500 no servidor
- Hot-reload não funciona

## 🔍 Causa Raiz

O problema ocorre porque:
1. **Cache corrompido**: O cache do Next.js/Webpack fica inconsistente após alterações
2. **Hot-reload falha**: O sistema não detecta mudanças corretamente
3. **Chunks webpack**: Arquivos gerados (`1682.js`, etc.) ficam desatualizados ou corrompidos

## ✅ Soluções Implementadas

### 1. Melhorias no `next.config.js`

Foi adicionado:
- **Watch Options**: Polling a cada 1 segundo para detectar mudanças
- **Aggregate Timeout**: Aguarda 300ms antes de recompilar (evita recompilações excessivas)
- **On-Demand Entries**: Mantém páginas em memória por mais tempo

### 2. Scripts NPM Adicionados

#### `npm run clean`
Limpa todo o cache automaticamente:
- Para processos Node.js
- Remove pasta `.next`
- Remove `node_modules/.cache`

#### `npm run dev:clean`
Limpa o cache E inicia o servidor em um comando só.

#### `npm run dev:fresh`
Limpa, faz build completo e inicia o servidor (para casos mais extremos).

### 3. Script PowerShell

Foi criado `limpar-cache.ps1` que você pode executar diretamente:
```powershell
.\limpar-cache.ps1
```

## 🚀 Como Usar

### Quando o problema acontecer:

**Opção 1 (Rápida):**
```bash
npm run dev:clean
```

**Opção 2 (Manual):**
```bash
# 1. Pare o servidor (Ctrl+C)
# 2. Limpe o cache
npm run clean
# 3. Inicie novamente
npm run dev
```

**Opção 3 (Script PowerShell):**
```powershell
.\limpar-cache.ps1
npm run dev
```

**Opção 4 (Para casos extremos):**
```bash
npm run dev:fresh
```

## 📋 Checklist de Verificação

Quando tiver problemas, verifique:

- [ ] Servidor foi reiniciado após alterações?
- [ ] Cache foi limpo (`npm run clean`)?
- [ ] Não há erros no terminal onde o servidor está rodando?
- [ ] Console do navegador (F12) não mostra erros?
- [ ] A URL está correta (`http://localhost:3000`)?

## 🔄 Fluxo de Trabalho Recomendado

### Desenvolvimento Normal:
```bash
npm run dev
# Faça suas alterações normalmente
# O hot-reload deve funcionar automaticamente
```

### Após Alterações que Quebram:
```bash
# Opção 1: Limpeza rápida
npm run dev:clean

# Opção 2: Limpeza completa
npm run dev:fresh
```

## 🛠️ Configurações Aplicadas

### next.config.js
- ✅ `webpack.watchOptions.poll: 1000` - Detecta mudanças a cada 1 segundo
- ✅ `webpack.watchOptions.aggregateTimeout: 300` - Evita recompilações excessivas
- ✅ `onDemandEntries.maxInactiveAge: 60000` - Mantém páginas em memória por 60s
- ✅ `onDemandEntries.pagesBufferLength: 5` - Buffer de 5 páginas

## 💡 Dicas Importantes

1. **Sempre pare o servidor antes de fazer limpeza** (ou use `npm run clean` que faz isso automaticamente)

2. **Se o problema persistir**, execute:
   ```bash
   npm run dev:fresh
   ```

3. **Verifique o terminal** onde o servidor está rodando - erros aparecem lá primeiro

4. **Limpe o cache do navegador** também se necessário (Ctrl+Shift+Delete ou F12 > Network > Disable cache)

5. **Em caso de dúvida**, sempre execute `npm run clean` antes de reportar problemas

## 🚨 Problemas Conhecidos

### Hot-reload não funciona em alguns arquivos?
- Execute `npm run clean` e reinicie
- Alguns arquivos podem precisar de refresh manual (F5)

### Erro "Module not found" após alterações?
- Sempre execute `npm run clean` primeiro
- Verifique se não há erros de sintaxe no arquivo alterado

### Servidor não inicia?
- Verifique se a porta 3000 está livre: `netstat -ano | findstr :3000`
- Mate processos Node.js: `Get-Process | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force`

## 📞 Suporte

Se o problema persistir mesmo após seguir este guia:
1. Execute `npm run dev:fresh`
2. Verifique erros no terminal
3. Verifique erros no console do navegador (F12)
4. Informe qual erro específico está aparecendo

---

**Última atualização**: 2026-01-09
**Versão do Next.js**: 14.2.0
