/**
 * E2E tests against real GitHub repos (mock-design-system → mock-frontend)
 *
 * These tests run against the public test repos:
 * - Producer: https://github.com/Dessert-Labs/mock-design-system
 * - Consumer: https://github.com/Dessert-Labs/mock-frontend
 *
 * They verify the full sync workflow works against real GitHub releases.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const MOCK_DESIGN_SYSTEM_REPO = 'Dessert-Labs/mock-design-system';
// Use a known stable release version for pinned version tests
const PINNED_VERSION = 'v1.0.3';
const cliBin = path.resolve(__dirname, '../../dist/index.js');

describe('E2E: mock-design-system → mock-frontend', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'clafoutis-e2e-mock-repos-')
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('syncs latest release from mock-design-system', async () => {
    // Create consumer config
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: 'latest',
      files: {
        'tailwind.base.css': 'src/styles/base.css',
        'tailwind.tailwind.base.js': 'tailwind.tokens.js',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    // Run sync
    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Verify files were downloaded
    const baseCss = await fs.readFile(
      path.join(tempDir, 'src/styles/base.css'),
      'utf-8'
    );
    const tailwindTokens = await fs.readFile(
      path.join(tempDir, 'tailwind.tokens.js'),
      'utf-8'
    );

    expect(baseCss).toContain('--color-primary-500');
    expect(tailwindTokens).toContain('darkMode');
    expect(tailwindTokens).toContain('colors');
  });

  it(`respects version pinning (${PINNED_VERSION})`, async () => {
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'tailwind.base.css': 'src/styles/base.css',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    const baseCss = await fs.readFile(
      path.join(tempDir, 'src/styles/base.css'),
      'utf-8'
    );

    // Should contain primary-500 color
    expect(baseCss).toContain('#3b82f6');
  });

  it('runs postSync hook', async () => {
    const hookOutputFile = path.join(tempDir, 'hook-ran.txt');
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'tailwind.base.css': 'src/styles/base.css',
      },
      postSync: `echo "hook executed" > "${hookOutputFile}"`,
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    const hookOutput = await fs.readFile(hookOutputFile, 'utf-8');
    expect(hookOutput.trim()).toBe('hook executed');
  });

  it('handles missing assets gracefully', async () => {
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'nonexistent-file.css': 'src/styles/missing.css',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    let errorOutput = '';
    try {
      execSync(`node ${cliBin} sync`, {
        cwd: tempDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e: any) {
      errorOutput = e.stderr || e.stdout || e.message;
    }

    // Should fail with helpful error message
    expect(errorOutput).toContain('Assets not found');
  });

  it('syncs Figma variables JSON', async () => {
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'figma.variables.json': 'figma-variables.json',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    const figmaJson = await fs.readFile(
      path.join(tempDir, 'figma-variables.json'),
      'utf-8'
    );
    const figmaData = JSON.parse(figmaJson);

    // Verify Figma JSON structure
    expect(Array.isArray(figmaData)).toBe(true);
    expect(figmaData.length).toBeGreaterThan(0);
    expect(figmaData[0]).toHaveProperty('name');
    expect(figmaData[0]).toHaveProperty('modes');
  });

  it('syncs custom SCSS from custom generator', async () => {
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'brand-scss.custom._brand.scss': 'src/styles/_brand.scss',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    const scssContent = await fs.readFile(
      path.join(tempDir, 'src/styles/_brand.scss'),
      'utf-8'
    );

    // Verify SCSS variables exist
    expect(scssContent).toContain('$color-primary-500');
  });

  it('cache prevents re-download when version unchanged', async () => {
    const config = {
      repo: MOCK_DESIGN_SYSTEM_REPO,
      version: PINNED_VERSION,
      files: {
        'tailwind.base.css': 'src/styles/base.css',
      },
    };

    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config, null, 2)
    );

    // First sync
    execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    // Second sync should skip
    const output = execSync(`node ${cliBin} sync`, {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    expect(output).toContain('no sync needed');
  });
});
