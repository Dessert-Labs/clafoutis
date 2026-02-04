import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import http from 'http';

describe('Consumer E2E', () => {
  let tempDir: string;
  let mockServer: http.Server;
  const cliBin = path.resolve(__dirname, '../../dist/index.js');

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'clafoutis-e2e-consumer-')
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true });
    if (mockServer) {
      await new Promise<void>(resolve => mockServer.close(() => resolve()));
    }
  });

  it('init --consumer creates .clafoutis/consumer.json', async () => {
    execSync(`node ${cliBin} init --consumer --repo test/repo`, {
      cwd: tempDir,
      stdio: 'pipe',
    });

    const configPath = path.join(tempDir, '.clafoutis/consumer.json');
    expect(await fileExists(configPath)).toBe(true);

    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    expect(config.repo).toBe('test/repo');
  });

  it('init --consumer uses default repo when not provided', async () => {
    execSync(`node ${cliBin} init --consumer`, { cwd: tempDir, stdio: 'pipe' });

    const configPath = path.join(tempDir, '.clafoutis/consumer.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    expect(config.repo).toBe('YourOrg/design-system');
  });

  it('sync --dry-run does not download or write files', async () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };
    await fs.mkdir(path.join(tempDir, '.clafoutis'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.clafoutis/consumer.json'),
      JSON.stringify(config)
    );

    execSync(`node ${cliBin} sync --dry-run`, { cwd: tempDir, stdio: 'pipe' });

    const outputExists = await fileExists(
      path.join(tempDir, 'src/tokens/_colors.scss')
    );
    const cacheExists = await fileExists(
      path.join(tempDir, '.clafoutis/cache')
    );

    expect(outputExists).toBe(false);
    expect(cacheExists).toBe(false);
  });

  it('sync exits with error when config is missing', async () => {
    expect(() => {
      execSync(`node ${cliBin} sync`, { cwd: tempDir, stdio: 'pipe' });
    }).toThrow();
  });
});

function createMockGitHubServer(): http.Server {
  return http.createServer((req, res) => {
    if (req.url?.includes('/releases/tags/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          assets: [
            {
              name: '_primitives.scss',
              browser_download_url:
                'http://localhost:9999/download/primitives.scss',
            },
          ],
        })
      );
    } else if (req.url?.includes('/download/')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('$primary: #3b82f6;\n');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
