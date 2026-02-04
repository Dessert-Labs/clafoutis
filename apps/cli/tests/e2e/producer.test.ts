import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Producer E2E', () => {
  let tempDir: string;
  const cliBin = path.resolve(__dirname, '../../dist/index.js');

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'clafoutis-e2e-producer-')
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('init --producer creates config, tokens, and workflow', async () => {
    try {
      execSync(`node ${cliBin} init --producer`, {
        cwd: tempDir,
        stdio: 'pipe',
      });
    } catch (e) {
      console.error('Init producer failed:', e);
      throw e;
    }

    const configExists = await fileExists(
      path.join(tempDir, '.clafoutis/producer.json')
    );
    const tokensExist = await fileExists(
      path.join(tempDir, 'tokens/colors/primitives.json')
    );
    const workflowExists = await fileExists(
      path.join(tempDir, '.github/workflows/clafoutis-release.yml')
    );

    expect(configExists).toBe(true);
    expect(tokensExist).toBe(true);
    expect(workflowExists).toBe(true);
  });

  it('generate creates output files from tokens', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });

    execSync(`node ${cliBin} generate`, { cwd: tempDir, stdio: 'pipe' });

    const buildExists = await fileExists(path.join(tempDir, 'build'));
    const tailwindOutputExists = await fileExists(
      path.join(tempDir, 'build', 'tailwind')
    );

    expect(buildExists).toBe(true);
    expect(tailwindOutputExists).toBe(true);
  });

  it('generate --dry-run does not create files', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });

    await fs.rm(path.join(tempDir, 'build'), { recursive: true, force: true });

    execSync(`node ${cliBin} generate --dry-run`, {
      cwd: tempDir,
      stdio: 'pipe',
    });

    const buildExists = await fileExists(path.join(tempDir, 'build'));
    expect(buildExists).toBe(false);
  });
});

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
