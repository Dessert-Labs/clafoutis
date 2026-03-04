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

  it('generate produces motion token CSS variables', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });
    execSync(`node ${cliBin} generate`, { cwd: tempDir, stdio: 'pipe' });

    const baseCSS = await fs.readFile(
      path.join(tempDir, 'build', 'tailwind', 'base.css'),
      'utf-8'
    );

    expect(baseCSS).toContain('--duration-fast');
    expect(baseCSS).toContain('--duration-normal');
    expect(baseCSS).toContain('--delay-short');
    expect(baseCSS).toContain('--easing-default');
    expect(baseCSS).toContain('--easing-step-coarse');
    expect(baseCSS).toContain('--easing-multi-stop-smooth');
    // cubicBezier values must be emitted as CSS functions, not raw arrays
    expect(baseCSS).toContain('cubic-bezier(');
    expect(baseCSS).toContain('steps(4, end)');
    expect(baseCSS).toContain('linear(');
    expect(baseCSS).not.toContain('--easing-bounce');
    expect(baseCSS).not.toMatch(/--easing-\w+:\s*[\d.,\s]+;/);
  });

  it('generate produces motion-reduced.css with prefers-reduced-motion block', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });
    execSync(`node ${cliBin} generate`, { cwd: tempDir, stdio: 'pipe' });

    const reducedExists = await fileExists(
      path.join(tempDir, 'build', 'tailwind', 'motion-reduced.css')
    );
    expect(reducedExists).toBe(true);

    const reducedCSS = await fs.readFile(
      path.join(tempDir, 'build', 'tailwind', 'motion-reduced.css'),
      'utf-8'
    );

    expect(reducedCSS).toContain('@media (prefers-reduced-motion: reduce)');
    expect(reducedCSS).toContain('--duration-fast: 0ms');
    expect(reducedCSS).toContain('--duration-normal: 0ms');
    expect(reducedCSS).toContain('--delay-short: 0ms');
  });

  it('generate maps duration, delay, and easing tokens to Tailwind theme keys', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });
    execSync(`node ${cliBin} generate`, { cwd: tempDir, stdio: 'pipe' });

    const tailwindBase = await fs.readFile(
      path.join(tempDir, 'build', 'tailwind', 'tailwind.base.js'),
      'utf-8'
    );

    expect(tailwindBase).toContain('transitionDuration');
    expect(tailwindBase).toContain('transitionDelay');
    expect(tailwindBase).toContain('transitionTimingFunction');
    expect(tailwindBase).toContain('var(--duration-fast)');
    expect(tailwindBase).toContain('var(--delay-short)');
    expect(tailwindBase).toContain('var(--easing-default)');
    expect(tailwindBase).toContain('var(--easing-step-coarse)');
  });

  it('init --producer scaffolds motion token template', async () => {
    execSync(`node ${cliBin} init --producer`, { cwd: tempDir, stdio: 'pipe' });

    const motionExists = await fileExists(
      path.join(tempDir, 'tokens', 'motion', 'base.json')
    );
    expect(motionExists).toBe(true);

    const motionTokens = JSON.parse(
      await fs.readFile(
        path.join(tempDir, 'tokens', 'motion', 'base.json'),
        'utf-8'
      )
    );

    expect(motionTokens).toHaveProperty('duration');
    expect(motionTokens).toHaveProperty('delay');
    expect(motionTokens).toHaveProperty('easing');
    expect(motionTokens).toHaveProperty('motion');
    expect(motionTokens.duration.fast.$type).toBe('duration');
    expect(motionTokens.delay.short.$type).toBe('duration');
    expect(motionTokens.easing.default.$type).toBe('cubicBezier');
    expect(motionTokens.easing.stepCoarse.$type).toBe('string');
    expect(motionTokens.easing.multiStopSmooth.$type).toBe('string');
    expect(motionTokens.easing).not.toHaveProperty('bounce');
    expect(Array.isArray(motionTokens.easing.default.$value)).toBe(true);
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
