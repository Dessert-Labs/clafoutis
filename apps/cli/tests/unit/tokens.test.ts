import { describe, it, expect } from 'vitest';
import {
  getStarterTokenContent,
  getAllStarterTokens,
} from '../../src/templates/tokens.js';

/**
 * Recursively finds all token leaves (objects with $value) and
 * returns them with their dotted path.
 */
function findTokenLeaves(
  obj: Record<string, unknown>,
  prefix = '',
): Array<{ path: string; token: Record<string, unknown> }> {
  const results: Array<{ path: string; token: Record<string, unknown> }> = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const cur = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && '$value' in val) {
      results.push({ path: cur, token: val as Record<string, unknown> });
    } else if (typeof val === 'object' && val !== null) {
      results.push(
        ...findTokenLeaves(val as Record<string, unknown>, cur),
      );
    }
  }
  return results;
}

describe('getAllStarterTokens', () => {
  it('returns all token files with paths and content', () => {
    const tokens = getAllStarterTokens();
    expect(tokens.length).toBeGreaterThanOrEqual(9);

    for (const token of tokens) {
      expect(token.path).toBeDefined();
      expect(token.content).toBeDefined();
      expect(() => JSON.parse(token.content)).not.toThrow();
    }
  });

  it('returns files with correct paths', () => {
    const tokens = getAllStarterTokens();
    const paths = tokens.map((t) => t.path);

    expect(paths).toContain('colors/primitives.json');
    expect(paths).toContain('colors/primitives.dark.json');
    expect(paths).toContain('colors/semantics.json');
    expect(paths).toContain('colors/semantics.dark.json');
    expect(paths).toContain('colors/components.json');
    expect(paths).toContain('colors/components.dark.json');
    expect(paths).toContain('dimensions/base.json');
    expect(paths).toContain('objectValues/base.json');
    expect(paths).toContain('typography/base.json');
  });

  it('every token leaf has both $type and $value', () => {
    const tokens = getAllStarterTokens();

    for (const file of tokens) {
      const parsed = JSON.parse(file.content) as Record<string, unknown>;
      const leaves = findTokenLeaves(parsed);
      expect(leaves.length).toBeGreaterThan(0);

      for (const { path, token } of leaves) {
        expect(token).toHaveProperty(
          '$type',
          expect.any(String),
        );
        expect(token).toHaveProperty('$value');
        if (!('$type' in token)) {
          throw new Error(
            `Token at "${path}" in ${file.path} is missing $type`,
          );
        }
      }
    }
  });
});

describe('getStarterTokenContent', () => {
  it('returns valid JSON for known files', () => {
    const content = getStarterTokenContent('colors/primitives.json');
    expect(() => JSON.parse(content)).not.toThrow();
    const parsed = JSON.parse(content);
    expect(parsed.colors).toBeDefined();
  });

  it('throws for unknown files', () => {
    expect(() => getStarterTokenContent('unknown/file.json')).toThrow(
      'Unknown starter token file',
    );
  });
});

describe('color primitives spot checks', () => {
  it('has Radix-style color scales with $type', () => {
    const content = getStarterTokenContent('colors/primitives.json');
    const parsed = JSON.parse(content);

    expect(parsed.colors.slate['100']).toEqual({
      $type: 'color',
      $value: '#fcfcfd',
    });
    expect(parsed.colors.blue['900']).toEqual({
      $type: 'color',
      $value: '#0090ff',
    });
    expect(parsed.colors.slate).toBeDefined();
    expect(parsed.colors.gray).toBeDefined();
    expect(parsed.colors.green).toBeDefined();
    expect(parsed.colors.red).toBeDefined();
  });
});

describe('semantics spot checks', () => {
  it('has semantic color tokens referencing primitives', () => {
    const content = getStarterTokenContent('colors/semantics.json');
    const parsed = JSON.parse(content);

    expect(parsed.colors.background.primary.$type).toBe('color');
    expect(parsed.colors.background.primary.$value).toBe(
      '{colors.slate.100}',
    );
    expect(parsed.colors.text.primary.$type).toBe('color');
  });

  it('has shadow tokens', () => {
    const content = getStarterTokenContent('colors/semantics.json');
    const parsed = JSON.parse(content);

    expect(parsed.shadow.default.$type).toBe('shadow');
    expect(parsed.shadow.default.$value).toBeDefined();
  });
});

describe('dimensions spot checks', () => {
  it('has spacing and borderRadius tokens', () => {
    const content = getStarterTokenContent('dimensions/base.json');
    const parsed = JSON.parse(content);

    expect(parsed.spacing['1'].$type).toBe('dimension');
    expect(parsed.spacing['1'].$value).toBe('4px');
    expect(parsed.borderRadius.sm.$type).toBe('dimension');
  });
});

describe('typography spot checks', () => {
  it('has fontFamily, fontSize, fontWeight, lineHeight', () => {
    const content = getStarterTokenContent('typography/base.json');
    const parsed = JSON.parse(content);

    expect(parsed.fontFamily.base.$type).toBe('fontFamily');
    expect(parsed.fontSize.base.$type).toBe('dimension');
    expect(parsed.fontWeight.bold.$type).toBe('fontWeight');
    expect(parsed.lineHeight.normal.$type).toBe('number');
  });
});
