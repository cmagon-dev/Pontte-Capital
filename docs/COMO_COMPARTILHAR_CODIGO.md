# Como Compartilhar o Código para Avaliação

## Opção 1: Criar um Arquivo ZIP (Recomendado)

### Passos no Windows (PowerShell):

```powershell
# Navegar para a pasta do projeto
cd c:\Users\caio_\lastro-fintech

# Criar ZIP excluindo node_modules e .next (para reduzir tamanho)
Compress-Archive -Path "app","lib","public","*.json","*.ts","*.js","*.md" -DestinationPath "lastro-fintech-codigo.zip" -Force

# Ou incluir tudo (maior, mas mais completo)
Compress-Archive -Path * -Exclude "node_modules","_backup",".next" -DestinationPath "lastro-fintech-completo.zip" -Force
```

### O que Incluir no ZIP:

✅ **INCLUIR**:
- `/app` - Todo o código da aplicação
- `/lib` - Utilitários e mock data
- `/public` - Arquivos estáticos (se houver)
- `package.json` - Dependências
- `package-lock.json` - Lock de dependências
- `tsconfig.json` - Configuração TypeScript
- `next.config.js` - Configuração Next.js
- `tailwind.config.ts` - Configuração Tailwind
- `postcss.config.js` - Configuração PostCSS
- `.gitignore` - Arquivos ignorados
- `README.md` - Documentação
- `CONTEXTO_SISTEMA_PARA_IA.md` - Contexto do sistema
- `PROMPT_PARA_AVALIACAO_IA.md` - Prompt para a IA

❌ **EXCLUIR** (para reduzir tamanho):
- `/node_modules` - Pode ser reinstalado com `npm install`
- `/.next` - Cache do Next.js (será recriado)
- `/_backup` - Backups antigos
- `/.git` - Histórico Git (se não quiser incluir)

## Opção 2: Criar Repositório Git

### Iniciar Repositório e Enviar:

```powershell
# Se ainda não tem repositório Git
git init
git add .
git commit -m "Código completo para avaliação"

# Criar repositório no GitHub/GitLab/Bitbucket e fazer push
git remote add origin <URL_DO_REPOSITORIO>
git branch -M main
git push -u origin main
```

### Ou usar GitHub Desktop:
1. Abrir GitHub Desktop
2. Adicionar repositório local
3. Fazer commit de todos os arquivos
4. Publicar no GitHub

### Compartilhar link do repositório:
- GitHub: `https://github.com/seu-usuario/lastro-fintech`
- GitLab: `https://gitlab.com/seu-usuario/lastro-fintech`
- Bitbucket: `https://bitbucket.org/seu-usuario/lastro-fintech`

## Opção 3: Compartilhar via Serviços de Código

### Pastebin/Gist (para arquivos individuais):
```bash
# GitHub Gist
https://gist.github.com/

# Pastebin
https://pastebin.com/
```

### Cloud Storage (Google Drive, Dropbox, OneDrive):
1. Criar ZIP do código
2. Fazer upload para o serviço
3. Gerar link compartilhável
4. Compartilhar link + senha (se necessário)

## Opção 4: Upload Direto em IAs com Suporte a Arquivos

### Claude (via Anthropic Console):
- Interface permite upload de arquivos
- Suporta ZIP, arquivos de código individuais

### ChatGPT (com plugins/extensões):
- Algumas extensões permitem upload de arquivos
- Ou colar código diretamente no chat

### GitHub Copilot Chat (VS Code):
- Acessa código do repositório aberto
- Funciona diretamente no workspace

## Opção 5: Usar Ferramentas de Análise de Código

### SonarQube/SonarCloud:
```bash
# Instalar SonarScanner
# Configurar projeto
sonar-scanner
```

### CodeClimate:
1. Conectar repositório Git
2. Análise automática
3. Relatório detalhado

### LGTM (Semantic Code Analysis):
1. Conectar repositório Git
2. Análise automática de segurança e qualidade

## Script PowerShell Completo para Preparar Código

Crie um arquivo `preparar-para-compartilhar.ps1`:

```powershell
# Criar pasta temporária
$tempFolder = "lastro-fintech-avaliacao"
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

# Copiar arquivos importantes
$filesToCopy = @(
    "app",
    "lib",
    "public",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    ".gitignore",
    "README.md",
    "CONTEXTO_SISTEMA_PARA_IA.md",
    "PROMPT_PARA_AVALIACAO_IA.md",
    "COMO_COMPARTILHAR_CODIGO.md"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination $tempFolder -Recurse -Force
        Write-Host "Copiado: $file"
    }
}

# Criar ZIP
$zipFile = "lastro-fintech-avaliacao.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}
Compress-Archive -Path $tempFolder -DestinationPath $zipFile -Force

# Limpar pasta temporária
Remove-Item -Path $tempFolder -Recurse -Force

Write-Host "`nArquivo ZIP criado: $zipFile"
Write-Host "Tamanho: $((Get-Item $zipFile).Length / 1MB) MB"
Write-Host "`nPronto para compartilhar!"
```

Execute com:
```powershell
.\preparar-para-compartilhar.ps1
```

## Checklist Antes de Compartilhar

- [ ] Removidos dados sensíveis (senhas, tokens, API keys)
- [ ] Verificado que não há informações pessoais no código
- [ ] Arquivo ZIP ou repositório criado
- [ ] Documentação incluída (`CONTEXTO_SISTEMA_PARA_IA.md` e `PROMPT_PARA_AVALIACAO_IA.md`)
- [ ] `package.json` incluído para instalação de dependências
- [ ] Tamanho do arquivo verificado (ZIP não deve ser maior que alguns MB sem node_modules)

## Prompt Inicial para a IA

Após compartilhar o código, use este prompt inicial:

```
Olá! Estou compartilhando o código-fonte completo do sistema "Pontte Capital" 
para avaliação técnica. 

Por favor:
1. Leia o arquivo CONTEXTO_SISTEMA_PARA_IA.md para entender o sistema
2. Use o arquivo PROMPT_PARA_AVALIACAO_IA.md como guia de avaliação
3. Analise o código seguindo os critérios especificados
4. Forneça feedback estruturado com sugestões práticas de melhoria

O código está em [ZIP/REPOSITÓRIO/LINK].
```

## Recomendações Finais

1. **Para avaliação rápida**: Use ZIP com arquivos essenciais (sem node_modules)
2. **Para colaboração contínua**: Use repositório Git (GitHub/GitLab)
3. **Para análise automática**: Use ferramentas como SonarQube ou CodeClimate
4. **Para IAs específicas**: Verifique qual formato cada IA aceita melhor

## Privacidade e Segurança

⚠️ **IMPORTANTE**: 
- Remova qualquer informação sensível antes de compartilhar
- Não compartilhe tokens, API keys, senhas, ou dados pessoais
- Revise o `.gitignore` para garantir que arquivos sensíveis não sejam incluídos
- Se usar repositório público, considere usar variáveis de ambiente para secrets
