import { describe, it, expect } from 'vitest';
import {
  colorPrimitives,
  colorSemantics,
  colorSemanticsDark,
  spacingPrimitives,
  typographyPrimitives,
  starterTokens,
  getStarterTokenContent,
  getAllStarterTokens,
} from '../../src/templates/tokens.js';

describe('colorPrimitives', () => {
  it('has gray scale (raw color values)', () => {
    expect(colorPrimitives.color.gray).toBeDefined();
    expect(colorPrimitives.color.gray['50'].$value).toBe('#fafafa');
    expect(colorPrimitives.color.gray['500'].$value).toBe('#737373');
    expect(colorPrimitives.color.gray['900'].$value).toBe('#171717');
  });

  it('has blue scale (raw color values)', () => {
    expect(colorPrimitives.color.blue).toBeDefined();
    expect(colorPrimitives.color.blue['500'].$value).toBe('#3b82f6');
  });

  it('has green scale (raw color values)', () => {
    expect(colorPrimitives.color.green).toBeDefined();
    expect(colorPrimitives.color.green['500'].$value).toBe('#22c55e');
  });

  it('has red scale (raw color values)', () => {
    expect(colorPrimitives.color.red).toBeDefined();
    expect(colorPrimitives.color.red['500'].$value).toBe('#ef4444');
  });

  it('has amber scale (raw color values)', () => {
    expect(colorPrimitives.color.amber).toBeDefined();
    expect(colorPrimitives.color.amber['500'].$value).toBe('#f59e0b');
  });
});

describe('colorSemantics', () => {
  it('has primary colors referencing blue primitives', () => {
    expect(colorSemantics.color.primary).toBeDefined();
    expect(colorSemantics.color.primary['500'].$value).toBe('{color.blue.500}');
  });

  it('has neutral colors referencing gray primitives', () => {
    expect(colorSemantics.color.neutral).toBeDefined();
    expect(colorSemantics.color.neutral['500'].$value).toBe('{color.gray.500}');
  });

  it('has success colors referencing green primitives', () => {
    expect(colorSemantics.color.success).toBeDefined();
    expect(colorSemantics.color.success['500'].$value).toBe('{color.green.500}');
  });

  it('has warning colors referencing amber primitives', () => {
    expect(colorSemantics.color.warning).toBeDefined();
    expect(colorSemantics.color.warning['500'].$value).toBe('{color.amber.500}');
  });

  it('has error colors referencing red primitives', () => {
    expect(colorSemantics.color.error).toBeDefined();
    expect(colorSemantics.color.error['500'].$value).toBe('{color.red.500}');
  });

  it('has background tokens referencing gray primitives', () => {
    expect(colorSemantics.color.background.default.$value).toBe('{color.gray.50}');
    expect(colorSemantics.color.background.subtle.$value).toBe('{color.gray.100}');
    expect(colorSemantics.color.background.muted.$value).toBe('{color.gray.200}');
  });

  it('has foreground tokens referencing gray primitives', () => {
    expect(colorSemantics.color.foreground.default.$value).toBe('{color.gray.900}');
    expect(colorSemantics.color.foreground.muted.$value).toBe('{color.gray.600}');
    expect(colorSemantics.color.foreground.subtle.$value).toBe('{color.gray.500}');
  });

  it('has border tokens referencing gray primitives', () => {
    expect(colorSemantics.color.border.default.$value).toBe('{color.gray.200}');
    expect(colorSemantics.color.border.muted.$value).toBe('{color.gray.100}');
  });
});

describe('colorSemanticsDark', () => {
  it('has background tokens with inverted gray scale', () => {
    expect(colorSemanticsDark.color.background.default.$value).toBe('{color.gray.900}');
    expect(colorSemanticsDark.color.background.subtle.$value).toBe('{color.gray.800}');
    expect(colorSemanticsDark.color.background.muted.$value).toBe('{color.gray.700}');
  });

  it('has foreground tokens with inverted gray scale', () => {
    expect(colorSemanticsDark.color.foreground.default.$value).toBe('{color.gray.50}');
  });

  it('has border tokens with inverted gray scale', () => {
    expect(colorSemanticsDark.color.border.default.$value).toBe('{color.gray.700}');
    expect(colorSemanticsDark.color.border.muted.$value).toBe('{color.gray.800}');
  });

  it('does not include color scales (primary, success, etc.) - they work the same in dark mode', () => {
    expect(colorSemanticsDark.color).not.toHaveProperty('primary');
    expect(colorSemanticsDark.color).not.toHaveProperty('neutral');
    expect(colorSemanticsDark.color).not.toHaveProperty('success');
    expect(colorSemanticsDark.color).not.toHaveProperty('warning');
    expect(colorSemanticsDark.color).not.toHaveProperty('error');
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
    expect(starterTokens['colors/semantic.json']).toBeDefined();
    expect(starterTokens['colors/semantic.dark.json']).toBeDefined();
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
    expect(tokens).toHaveLength(5);

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
    expect(paths).toContain('colors/semantic.json');
    expect(paths).toContain('colors/semantic.dark.json');
    expect(paths).toContain('spacing/primitives.json');
    expect(paths).toContain('typography/primitives.json');
  });
});
