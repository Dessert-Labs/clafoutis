import { describe, expect, it } from 'vitest';

import { resolveTokens, TokenResolver } from '../../src/tokens/resolver';
import type { DTCGTokenFile } from '../../src/types/tokens';

function makeFiles(files: Record<string, DTCGTokenFile>): Map<string, DTCGTokenFile> {
  return new Map(Object.entries(files));
}

describe('TokenResolver', () => {
  it('resolves simple references', () => {
    const files = makeFiles({
      'primitives.json': { colors: { blue: { 100: { $type: 'color', $value: '#FBFDFF' } } } },
      'semantics.json': { colors: { primary: { $type: 'color', $value: '{colors.blue.100}' } } },
    });
    const tokens = resolveTokens(files);
    const primary = tokens.find((t) => t.path === 'colors.primary');
    expect(primary?.resolvedValue).toBe('#FBFDFF');
  });

  it('resolves chained references', () => {
    const files = makeFiles({
      'primitives.json': { colors: { white: { 100: { $type: 'color', $value: '#FFFFFF' } } } },
      'semantics.json': { colors: { background: { primary: { $type: 'color', $value: '{colors.white.100}' } } } },
      'components.json': { card: { bg: { $type: 'color', $value: '{colors.background.primary}' } } },
    });
    const tokens = resolveTokens(files);
    const cardBg = tokens.find((t) => t.path === 'card.bg');
    expect(cardBg?.resolvedValue).toBe('#FFFFFF');
  });

  it('detects circular references', () => {
    const resolver = new TokenResolver();
    const files = makeFiles({
      'tokens.json': {
        a: { $type: 'color', $value: '{b}' },
        b: { $type: 'color', $value: '{c}' },
        c: { $type: 'color', $value: '{a}' },
      },
    });
    resolver.load(files);
    const cycles = resolver.detectCircularReferences();
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('handles missing references gracefully', () => {
    const files = makeFiles({
      'tokens.json': { colors: { primary: { $type: 'color', $value: '{colors.doesNotExist}' } } },
    });
    const tokens = resolveTokens(files);
    const primary = tokens.find((t) => t.path === 'colors.primary');
    expect(primary?.resolvedValue).toBe('{colors.doesNotExist}');
  });

  it('handles cross-file references', () => {
    const files = makeFiles({
      'colors/primitives.json': { colors: { blue: { 500: { $type: 'color', $value: '#3B82F6' } } } },
      'colors/semantics.json': { colors: { accent: { $type: 'color', $value: '{colors.blue.500}' } } },
    });
    const tokens = resolveTokens(files);
    const accent = tokens.find((t) => t.path === 'colors.accent');
    expect(accent?.resolvedValue).toBe('#3B82F6');
  });

  it('getReferencedBy returns dependent tokens', () => {
    const resolver = new TokenResolver();
    const files = makeFiles({
      'primitives.json': { colors: { white: { 100: { $type: 'color', $value: '#FFFFFF' } } } },
      'semantics.json': {
        colors: {
          bg: { primary: { $type: 'color', $value: '{colors.white.100}' } },
          surface: { $type: 'color', $value: '{colors.white.100}' },
        },
      },
    });
    resolver.load(files);
    const refs = resolver.getReferencedBy('colors.white.100');
    expect(refs).toContain('colors.bg.primary');
    expect(refs).toContain('colors.surface');
  });

  it('getReferencedBy returns empty for tokens with no dependents', () => {
    const resolver = new TokenResolver();
    const files = makeFiles({
      'tokens.json': { a: { $type: 'color', $value: '#000' } },
    });
    resolver.load(files);
    expect(resolver.getReferencedBy('a')).toEqual([]);
  });

  it('getReferences returns direct and transitive refs', () => {
    const resolver = new TokenResolver();
    const files = makeFiles({
      'tokens.json': {
        a: { $type: 'color', $value: '#000' },
        b: { $type: 'color', $value: '{a}' },
        c: { $type: 'color', $value: '{b}' },
      },
    });
    resolver.load(files);
    const refs = resolver.getReferences('c');
    expect(refs).toContain('b');
    expect(refs).toContain('a');
  });

  it('getReferences handles tokens with no references', () => {
    const resolver = new TokenResolver();
    const files = makeFiles({
      'tokens.json': { a: { $type: 'color', $value: '#000' } },
    });
    resolver.load(files);
    expect(resolver.getReferences('a')).toEqual([]);
  });
});
