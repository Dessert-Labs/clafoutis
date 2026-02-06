import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { createTokenStore } from '../../src/store/tokenStore';
import { bridgeColorToPaint } from '../../src/tokens/bridge';
import { exportTokens } from '../../src/tokens/exporter';
import type { DTCGTokenFile } from '../../src/types/tokens';

function loadTokenDir(dir: string): Record<string, DTCGTokenFile> {
  const files: Record<string, DTCGTokenFile> = {};
  function walk(currentDir: string, prefix: string) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.name.endsWith('.json')) {
        files[relativePath] = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      }
    }
  }
  walk(dir, '');
  return files;
}

const tokensDir = path.resolve(__dirname, '../../../../tokens');

describe('Token pipeline integration', () => {
  it('loads and resolves all tokens from the repo', () => {
    if (!fs.existsSync(tokensDir)) return;
    const files = loadTokenDir(tokensDir);
    const store = createTokenStore();
    store.getState().loadTokens(files);
    expect(store.getState().resolvedTokens.length).toBeGreaterThan(0);
  });

  it('bridges all color tokens to RGBA', () => {
    if (!fs.existsSync(tokensDir)) return;
    const files = loadTokenDir(tokensDir);
    const store = createTokenStore();
    store.getState().loadTokens(files);
    const colors = store.getState().getTokensByCategory('colors');
    for (const token of colors) {
      if (typeof token.resolvedValue === 'string' && token.resolvedValue.startsWith('#')) {
        const paint = bridgeColorToPaint(token);
        if (paint) {
          expect(paint.color.r).toBeGreaterThanOrEqual(0);
          expect(paint.color.r).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('round-trips: modify, export, reload', () => {
    if (!fs.existsSync(tokensDir)) return;
    const files = loadTokenDir(tokensDir);
    const store = createTokenStore();
    store.getState().loadTokens(files);
    store.getState().addToken('test.roundtrip', 'color', '#FF0000', Object.keys(files)[0]);
    const exported = exportTokens(store.getState().tokenFiles);
    const store2 = createTokenStore();
    store2.getState().loadTokens(exported);
    const found = store2.getState().resolvedTokens.find((t) => t.path === 'test.roundtrip');
    expect(found?.resolvedValue).toBe('#FF0000');
  });
});
