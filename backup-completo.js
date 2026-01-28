const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const OUTPUT_DIR = process.cwd();

// Gerar nome do arquivo com data e hora
const now = new Date();
const dateStr = now.toISOString().split('T')[0].replace(/-/g, '') + '_' + 
                now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 6);
const zipFileName = `backup_completo_${dateStr}.zip`;

console.log('📦 Iniciando backup completo do sistema...\n');
console.log(`📁 Diretório: ${OUTPUT_DIR}\n`);

// Criar script PowerShell temporário (baseado no script original que funciona)
const psScriptContent = `
$date = Get-Date -Format 'yyyyMMdd_HHmmss'
$zipName = "backup_completo_$date.zip"
$excludeDirs = @('node_modules', '.next', '.git', '.cursor', 'dist', 'build', '__pycache__', '.vscode')

$filesToZip = @()
$totalSize = 0

Write-Host "🔍 Analisando arquivos do projeto..." -ForegroundColor Cyan

Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    $item = $_
    $shouldExclude = $false
    
    foreach ($dir in $excludeDirs) {
        if ($item.FullName -like "*\\$dir\\*" -or $item.FullName -like "*\\$dir" -or $item.FullName -like "*\\$dir*") {
            $shouldExclude = $true
            break
        }
    }
    
    if ($item.Name -like "*.zip") {
        $shouldExclude = $true
    }
    
    if (-not $shouldExclude) {
        $filesToZip += $item
        $totalSize += $item.Length
    }
}

$fileCount = $filesToZip.Count
$sizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host ""
Write-Host "📊 Estatisticas:" -ForegroundColor Yellow
Write-Host "   Arquivos: $fileCount" -ForegroundColor White
Write-Host "   Tamanho total: $sizeMB MB" -ForegroundColor White
Write-Host ""

if ($filesToZip.Count -gt 0) {
    Write-Host "📦 Compressando $fileCount arquivos..." -ForegroundColor Cyan
    $filesToZip | Compress-Archive -DestinationPath $zipName -Force
    
    $zipInfo = Get-Item $zipName
    $zipSizeMB = [math]::Round($zipInfo.Length / 1MB, 2)
    $compressionRatio = [math]::Round((1 - ($zipInfo.Length / $totalSize)) * 100, 1)
    
    Write-Host ""
    Write-Host "✅ Backup criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Detalhes:" -ForegroundColor Yellow
    Write-Host "   Arquivo: $zipName" -ForegroundColor White
    Write-Host "   Tamanho original: $sizeMB MB" -ForegroundColor White
    Write-Host "   Tamanho comprimido: $zipSizeMB MB" -ForegroundColor White
    Write-Host "   Taxa de compressao: $compressionRatio por cento" -ForegroundColor White
    Write-Host "   Arquivos incluidos: $fileCount" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Nenhum arquivo encontrado para backup" -ForegroundColor Yellow
}
`;

// Criar arquivo PowerShell temporário
const tempPsFile = path.join(OUTPUT_DIR, 'temp_backup_completo.ps1');
fs.writeFileSync(tempPsFile, psScriptContent, 'utf8');

try {
  console.log('📋 Executando backup completo...\n');
  
  // Executar script PowerShell
  execSync(`powershell -ExecutionPolicy Bypass -File "${tempPsFile}"`, {
    cwd: OUTPUT_DIR,
    stdio: 'inherit',
    encoding: 'utf8',
  });

  // Verificar se arquivo foi criado
  const zipFiles = fs.readdirSync(OUTPUT_DIR).filter(f => 
    f.startsWith('backup_completo_') && f.endsWith('.zip')
  );
  
  if (zipFiles.length > 0) {
    const latestZip = zipFiles.sort().reverse()[0];
    const zipPath = path.join(OUTPUT_DIR, latestZip);
    const stats = fs.statSync(zipPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`\n✨ Backup completo finalizado!`);
    console.log(`📦 Arquivo: ${latestZip}`);
    console.log(`📊 Tamanho: ${sizeMB} MB`);
    console.log(`📁 Localização: ${zipPath}\n`);
  } else {
    console.log('\n⚠️  Nenhum arquivo ZIP foi criado.\n');
  }

} catch (error) {
  console.error('❌ Erro ao criar backup:', error.message);
  process.exit(1);
} finally {
  // Remover arquivo temporário
  if (fs.existsSync(tempPsFile)) {
    try {
      fs.unlinkSync(tempPsFile);
    } catch (e) {
      // Ignorar erros ao deletar arquivo temporário
    }
  }
}
