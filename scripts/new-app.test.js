#!/usr/bin/env node

import { describe, it } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('new-app CLI', () => {
  it('deve ter shebang correto', async () => {
    const cliPath = path.join(__dirname, 'new-app.js');
    const content = await fs.promises.readFile(cliPath, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env node'));
  });

  it('deve importar dependências corretamente', async () => {
    const cliPath = path.join(__dirname, 'new-app.js');
    const content = await fs.promises.readFile(cliPath, 'utf8');
    assert.ok(content.includes("from 'commander'"));
    assert.ok(content.includes("from 'chalk'"));
  });

  it('deve ter estrutura ES Modules correta', async () => {
    const cliPath = path.join(__dirname, 'new-app.js');
    const content = await fs.promises.readFile(cliPath, 'utf8');
    assert.ok(content.includes('import '));
    assert.ok(!content.includes('require('));
  });
});
