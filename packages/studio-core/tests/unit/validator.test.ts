import { describe, expect, it } from 'vitest';

import { validateTokens } from '../../src/tokens/validator';
import type { DTCGTokenFile } from '../../src/types/tokens';

function makeFiles(files: Record<string, DTCGTokenFile>): Map<string, DTCGTokenFile> {
  return new Map(Object.entries(files));
}

describe('validateTokens', () => {
  it('detects broken references', () => {
    const files = makeFiles({
      'tokens.json': { a: { $type: 'color', $value: '{colors.doesNotExist}' } },
    });
    const results = validateTokens(files);
    expect(results.some((r) => r.code === 'BROKEN_REF')).toBe(true);
  });

  it('detects circular references', () => {
    const files = makeFiles({
      'tokens.json': {
        a: { $type: 'color', $value: '{b}' },
        b: { $type: 'color', $value: '{c}' },
        c: { $type: 'color', $value: '{a}' },
      },
    });
    const results = validateTokens(files);
    expect(results.some((r) => r.code === 'CIRCULAR_REF')).toBe(true);
  });

  it('detects invalid color values', () => {
    const files = makeFiles({
      'tokens.json': { a: { $type: 'color', $value: '#GGGGGG' } },
    });
    const results = validateTokens(files);
    expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
  });

  it('detects invalid dimension strings', () => {
    const files = makeFiles({
      'tokens.json': { a: { $type: 'dimension', $value: 'abc' } },
    });
    const results = validateTokens(files);
    expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
  });

  it('returns empty array for valid token sets', () => {
    const files = makeFiles({
      'tokens.json': {
        a: { $type: 'color', $value: '#FF0000' },
        b: { $type: 'dimension', $value: '16px' },
      },
    });
    const results = validateTokens(files);
    expect(results).toHaveLength(0);
  });

  it('returns correct severity', () => {
    const files = makeFiles({
      'tokens.json': { a: { $type: 'color', $value: '{nonexistent}' } },
    });
    const results = validateTokens(files);
    expect(results[0].severity).toBe('error');
  });
});
