import fs from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd());
const OUT = path.join(ROOT, 'REGISTROS_360_AUDIT.txt');

function header(name) {
  return `\n// ==================================================\n// ARQUIVO: ${name}\n// ==================================================\n\n`;
}

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

const sections = [
  { name: 'prisma/schema.prisma (Registros 360)', file: 'prisma/schema.prisma', extract: true },
  { name: 'app/actions/canteiro-360.ts', file: 'app/actions/canteiro-360.ts' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/page.tsx (Viewer)', file: 'app/eng/registros-360/[construtoraId]/[obraId]/page.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/page.tsx', file: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/page.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/[plantaId]/page.tsx (Editor)', file: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/[plantaId]/page.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/ViewerContent.tsx', file: 'app/eng/registros-360/[construtoraId]/[obraId]/ViewerContent.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/ConfiguracoesContent.tsx', file: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/ConfiguracoesContent.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/PDFAreaSelector.tsx', file: 'app/eng/registros-360/[construtoraId]/[obraId]/configuracoes/PDFAreaSelector.tsx' },
  { name: 'app/eng/registros-360/page.tsx', file: 'app/eng/registros-360/page.tsx' },
  { name: 'app/eng/registros-360/Registros360Content.tsx', file: 'app/eng/registros-360/Registros360Content.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/page.tsx', file: 'app/eng/registros-360/[construtoraId]/page.tsx' },
  { name: 'app/eng/registros-360/[construtoraId]/Registros360PorConstrutoraContent.tsx', file: 'app/eng/registros-360/[construtoraId]/Registros360PorConstrutoraContent.tsx' },
];

let schema = read('prisma/schema.prisma');
const i = schema.indexOf('// REGISTROS 360');
const schema360 = i >= 0 ? schema.slice(i) : schema;

let out = header('prisma/schema.prisma (PlantaBaixa, Setor, PontoMonitoramento, Foto360, TipoPlanta)') + schema360;

for (const s of sections) {
  if (s.file === 'prisma/schema.prisma') continue;
  try {
    out += header(s.name) + read(s.file);
  } catch (e) {
    out += header(s.name) + `// Erro ao ler: ${e.message}\n`;
  }
}

fs.writeFileSync(OUT, out, 'utf8');
console.log('OK:', OUT);
