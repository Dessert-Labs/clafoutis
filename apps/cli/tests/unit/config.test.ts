import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  readConfig,
  readProducerConfig,
  fileExists,
} from '../../src/utils/config.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('readConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('returns null when config file does not exist', async () => {
    const result = await readConfig(path.join(tempDir, '.clafoutis.json'));
    expect(result).toBeNull();
  });

  it('parses valid consumer config', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      output: { scss: 'out.scss' },
      files: ['_primitives.scss'],
    };
    await fs.writeFile(
      path.join(tempDir, '.clafoutis.json'),
      JSON.stringify(config)
    );

    const result = await readConfig(path.join(tempDir, '.clafoutis.json'));
    expect(result).toEqual(config);
  });

  it('returns null for invalid JSON', async () => {
    await fs.writeFile(path.join(tempDir, '.clafoutis.json'), 'not valid json');

    const result = await readConfig(path.join(tempDir, '.clafoutis.json'));
    expect(result).toBeNull();
  });
});

describe('readProducerConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('returns null when config file does not exist', async () => {
    const result = await readProducerConfig(
      path.join(tempDir, 'clafoutis.config.json')
    );
    expect(result).toBeNull();
  });

  it('parses valid producer config', async () => {
    const config = {
      tokens: './tokens',
      output: './build',
      generators: {
        tailwind: true,
        figma: false,
      },
    };
    await fs.writeFile(
      path.join(tempDir, 'clafoutis.config.json'),
      JSON.stringify(config)
    );

    const result = await readProducerConfig(
      path.join(tempDir, 'clafoutis.config.json')
    );
    expect(result).toEqual(config);
  });
});

describe('fileExists', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
  });

  it('returns true for existing file', async () => {
    const filePath = path.join(tempDir, 'test.txt');
    await fs.writeFile(filePath, 'content');

    expect(await fileExists(filePath)).toBe(true);
  });

  it('returns false for non-existing file', async () => {
    expect(await fileExists(path.join(tempDir, 'nonexistent.txt'))).toBe(false);
  });
});
