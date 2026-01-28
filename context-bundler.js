const fs = require('fs');
const path = require('path');

// Configurações
const SOURCE_DIRS = ['app', 'lib', 'prisma', 'components'];
const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.prisma'];
const IGNORED_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
const IGNORED_PATHS = ['components/ui']; // Ignora componentes shadcn se houver muitos arquivos pequenos

const OUTPUT_FILE = 'projeto_full.txt';

// Verificar se um diretório deve ser ignorado
function shouldIgnoreDir(dirName) {
  return IGNORED_DIRS.includes(dirName) || dirName.startsWith('.');
}

// Verificar se um arquivo deve ser ignorado
function shouldIgnoreFile(fileName, filePath) {
  // Ignorar arquivos de lock
  if (IGNORED_FILES.includes(fileName)) {
    return true;
  }

  // Ignorar imagens e outros arquivos binários
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];
  const ext = path.extname(fileName).toLowerCase();
  if (imageExtensions.includes(ext)) {
    return true;
  }

  // Ignorar caminhos específicos (como components/ui)
  const normalizedPath = filePath.replace(/\\/g, '/');
  for (const ignoredPath of IGNORED_PATHS) {
    if (normalizedPath.includes(ignoredPath)) {
      return true;
    }
  }

  return false;
}

// Verificar se um arquivo deve ser incluído
function shouldIncludeFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  return INCLUDED_EXTENSIONS.includes(ext);
}

// Ler arquivo recursivamente
function readDirectory(dirPath, fileList = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (entry.isDirectory()) {
        if (!shouldIgnoreDir(entry.name)) {
          readDirectory(fullPath, fileList);
        }
      } else if (entry.isFile()) {
        if (!shouldIgnoreFile(entry.name, fullPath) && shouldIncludeFile(entry.name)) {
          fileList.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dirPath}:`, error.message);
  }

  return fileList;
}

// Função principal
function bundleProject() {
  console.log('📦 Iniciando bundling do projeto...\n');

  const allFiles = [];

  // Processar cada diretório fonte
  for (const dir of SOURCE_DIRS) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Diretório não encontrado: ${dir}`);
      continue;
    }

    console.log(`📁 Processando: ${dir}/`);
    const files = readDirectory(dirPath);
    allFiles.push(...files);
    console.log(`   ✅ ${files.length} arquivo(s) encontrado(s)\n`);
  }

  // Ordenar arquivos por caminho
  allFiles.sort();

  console.log(`📝 Concatenando ${allFiles.length} arquivo(s)...\n`);

  // Criar arquivo de saída
  const outputStream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });

  // Escrever cabeçalho do arquivo
  outputStream.write('='.repeat(80) + '\n');
  outputStream.write('PROJETO COMPLETO - Pontte Capital\n');
  outputStream.write(`Gerado em: ${new Date().toLocaleString('pt-BR')}\n`);
  outputStream.write(`Total de arquivos: ${allFiles.length}\n`);
  outputStream.write('='.repeat(80) + '\n\n\n');

  // Processar cada arquivo
  let processedCount = 0;
  for (const filePath of allFiles) {
    try {
      const relativePath = path.relative(process.cwd(), filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // Escrever cabeçalho do arquivo
      const header = '='.repeat(80);
      outputStream.write(`${header}\n`);
      outputStream.write(`FILE: ${relativePath}\n`);
      outputStream.write(`${header}\n\n`);
      
      // Escrever conteúdo
      outputStream.write(content);
      outputStream.write('\n\n');

      processedCount++;
      
      // Progress
      if (processedCount % 10 === 0) {
        process.stdout.write(`\r   Processando: ${processedCount}/${allFiles.length} arquivo(s)...`);
      }
    } catch (error) {
      console.error(`\n❌ Erro ao processar ${filePath}:`, error.message);
    }
  }

  // Fechar stream e verificar arquivo
  return new Promise((resolve, reject) => {
    outputStream.end(() => {
      console.log(`\r   ✅ Processados: ${processedCount}/${allFiles.length} arquivo(s)`);
      
      try {
        const stats = fs.statSync(OUTPUT_FILE);
        console.log(`\n✨ Arquivo gerado com sucesso: ${OUTPUT_FILE}`);
        console.log(`📊 Tamanho total: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
        resolve();
      } catch (error) {
        console.log(`\n✨ Arquivo gerado com sucesso: ${OUTPUT_FILE}\n`);
        resolve(); // Resolver mesmo se não conseguir ler stats
      }
    });

    outputStream.on('error', (error) => {
      console.error(`\n❌ Erro ao escrever arquivo:`, error.message);
      reject(error);
    });
  });
}

// Executar
(async () => {
  try {
    await bundleProject();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
})();
