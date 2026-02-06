import { definePackageConfig } from '@clafoutis/tsup-config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyTemplates() {
  const srcTemplatesDir = path.join(__dirname, 'src', 'templates', 'tokens');
  const distTemplatesDir = path.join(__dirname, 'dist', 'templates', 'tokens');
  
  if (fs.existsSync(srcTemplatesDir)) {
    fs.mkdirSync(path.dirname(distTemplatesDir), { recursive: true });
    fs.cpSync(srcTemplatesDir, distTemplatesDir, { recursive: true });
  }
}

export default definePackageConfig([
  {
    entry: { index: 'src/index.ts' },
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: { types: 'src/types.ts' },
    clean: false,
    onSuccess: async () => {
      copyTemplates();
    },
  },
]);
