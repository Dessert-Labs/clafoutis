import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncCommand } from '../../src/commands/sync.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('syncCommand', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-sync-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true });
    vi.unstubAllGlobals();
  });

  it('downloads and writes output files', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));

    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$primary: #3b82f6;'),
      } as Response);

    await syncCommand({});

    const output = await fs.readFile('src/tokens/_colors.scss', 'utf-8');
    expect(output).toContain('$primary: #3b82f6;');
  });

  it('skips sync when version matches cache', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.mkdir('src/tokens', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));
    await fs.writeFile('.clafoutis/cache', 'v1.0.0');
    await fs.writeFile('src/tokens/_colors.scss', 'existing content');

    await syncCommand({});

    expect(fetch).not.toHaveBeenCalled();
  });

  it('syncs when forced even if version matches', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.mkdir('src/tokens', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));
    await fs.writeFile('.clafoutis/cache', 'v1.0.0');
    await fs.writeFile('src/tokens/_colors.scss', 'existing content');

    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$new: #fff;'),
      } as Response);

    await syncCommand({ force: true });

    const output = await fs.readFile('src/tokens/_colors.scss', 'utf-8');
    expect(output).toContain('$new: #fff;');
  });

  it('respects dry-run option', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));

    await syncCommand({ dryRun: true });

    expect(fetch).not.toHaveBeenCalled();
    const outputExists = await fs
      .access('src/tokens/_colors.scss')
      .then(() => true)
      .catch(() => false);
    expect(outputExists).toBe(false);
  });

  it('creates nested output directories', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/styles/tokens/_colors.scss',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));

    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$color: #000;'),
      } as Response);

    await syncCommand({});

    const output = await fs.readFile('src/styles/tokens/_colors.scss', 'utf-8');
    expect(output).toContain('$color: #000;');
  });

  it('writes files to different locations', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
        'tailwind.config.js': './tailwind.config.js',
      },
    };
    await fs.mkdir('.clafoutis', { recursive: true });
    await fs.writeFile('.clafoutis/consumer.json', JSON.stringify(config));

    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
        {
          name: 'tailwind.config.js',
          browser_download_url: 'https://example.com/tailwind.js',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$color: #000;'),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('module.exports = {}'),
      } as Response);

    await syncCommand({});

    const scssOutput = await fs.readFile('src/tokens/_colors.scss', 'utf-8');
    expect(scssOutput).toContain('$color: #000;');

    const tailwindOutput = await fs.readFile('./tailwind.config.js', 'utf-8');
    expect(tailwindOutput).toContain('module.exports');
  });
});
