import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readCache, writeCache } from '../../src/utils/cache.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('cache', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-cache-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true });
  });

  describe('readCache', () => {
    it('returns null when cache file does not exist', async () => {
      const result = await readCache();
      expect(result).toBeNull();
    });

    it('returns cached version from file', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/cache', 'v1.0.0');

      const result = await readCache();
      expect(result).toBe('v1.0.0');
    });

    it('trims whitespace from cached version', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/cache', '  v1.0.0  \n');

      const result = await readCache();
      expect(result).toBe('v1.0.0');
    });
  });

  describe('writeCache', () => {
    it('writes version to cache file', async () => {
      await writeCache('v2.0.0');

      const content = await fs.readFile('.clafoutis/cache', 'utf-8');
      expect(content).toBe('v2.0.0');
    });

    it('overwrites existing cache', async () => {
      await writeCache('v1.0.0');
      await writeCache('v2.0.0');

      const content = await fs.readFile('.clafoutis/cache', 'utf-8');
      expect(content).toBe('v2.0.0');
    });
  });
});
