import { describe, it, expect } from 'vitest';
import {
  colorPrimitives,
  spacingPrimitives,
  typographyPrimitives,
  starterTokens,
  getStarterTokenContent,
  getAllStarterTokens,
} from '../../src/templates/tokens.js';

describe('colorPrimitives', () => {
  it('has primary colors with full scale', () => {
    expect(colorPrimitives.color.primary).toBeDefined();
    expect(colorPrimitives.color.primary['500'].$value).toBe('#3b82f6');
  });

  it('has neutral colors', () => {
    expect(colorPrimitives.color.neutral).toBeDefined();
  });

  it('has semantic colors', () => {
    expect(colorPrimitives.color.success).toBeDefined();
    expect(colorPrimitives.color.warning).toBeDefined();
    expect(colorPrimitives.color.error).toBeDefined();
  });
});

describe('spacingPrimitives', () => {
  it('has spacing scale from 0 to 24', () => {
    expect(spacingPrimitives.spacing['0'].$value).toBe('0');
    expect(spacingPrimitives.spacing['4'].$value).toBe('1rem');
    expect(spacingPrimitives.spacing['24'].$value).toBe('6rem');
  });
});

describe('typographyPrimitives', () => {
  it('has font families', () => {
    expect(typographyPrimitives.fontFamily.sans).toBeDefined();
    expect(typographyPrimitives.fontFamily.serif).toBeDefined();
    expect(typographyPrimitives.fontFamily.mono).toBeDefined();
  });

  it('has font sizes', () => {
    expect(typographyPrimitives.fontSize.base.$value).toBe('1rem');
  });

  it('has font weights', () => {
    expect(typographyPrimitives.fontWeight.bold.$value).toBe('700');
  });

  it('has line heights', () => {
    expect(typographyPrimitives.lineHeight.normal.$value).toBe('1.5');
  });
});

describe('starterTokens', () => {
  it('contains all token file paths', () => {
    expect(starterTokens['colors/primitives.json']).toBeDefined();
    expect(starterTokens['colors/primitives.dark.json']).toBeDefined();
    expect(starterTokens['spacing/primitives.json']).toBeDefined();
    expect(starterTokens['typography/primitives.json']).toBeDefined();
  });
});

describe('getStarterTokenContent', () => {
  it('returns valid JSON for known files', () => {
    const content = getStarterTokenContent('colors/primitives.json');
    expect(() => JSON.parse(content)).not.toThrow();
    const parsed = JSON.parse(content);
    expect(parsed.color).toBeDefined();
  });

  it('throws for unknown files', () => {
    expect(() => getStarterTokenContent('unknown/file.json')).toThrow(
      'Unknown starter token file'
    );
  });
});

describe('getAllStarterTokens', () => {
  it('returns all token files with paths and content', () => {
    const tokens = getAllStarterTokens();
    expect(tokens).toHaveLength(4);

    for (const token of tokens) {
      expect(token.path).toBeDefined();
      expect(token.content).toBeDefined();
      expect(() => JSON.parse(token.content)).not.toThrow();
    }
  });

  it('returns files with correct paths', () => {
    const tokens = getAllStarterTokens();
    const paths = tokens.map(t => t.path);
    expect(paths).toContain('colors/primitives.json');
    expect(paths).toContain('colors/primitives.dark.json');
    expect(paths).toContain('spacing/primitives.json');
    expect(paths).toContain('typography/primitives.json');
  });
});
