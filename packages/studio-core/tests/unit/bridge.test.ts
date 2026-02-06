import { describe, expect, it } from 'vitest';

import { bridgeColorToPaint, bridgeDimensionToNumber, bridgeFontWeight, bridgeShadowToEffect } from '../../src/tokens/bridge';
import type { ResolvedToken } from '../../src/types/tokens';

function makeToken(type: string, resolvedValue: unknown): ResolvedToken {
  return { path: 'test', type: type as ResolvedToken['type'], value: resolvedValue, resolvedValue, filePath: 'test.json' };
}

describe('bridgeColorToPaint', () => {
  it('converts hex color to RGBA', () => {
    const paint = bridgeColorToPaint(makeToken('color', '#0090FF'));
    expect(paint).not.toBeNull();
    expect(paint!.color.r).toBeCloseTo(0, 1);
    expect(paint!.color.g).toBeCloseTo(0.565, 1);
    expect(paint!.color.b).toBeCloseTo(1, 1);
    expect(paint!.color.a).toBe(1);
  });

  it('returns null for non-string values', () => {
    expect(bridgeColorToPaint(makeToken('color', 123))).toBeNull();
  });
});

describe('bridgeShadowToEffect', () => {
  it('converts DTCG shadow to Effect', () => {
    const effect = bridgeShadowToEffect(makeToken('shadow', {
      offsetX: '4px', offsetY: '4px', blur: '8px', spread: '0px', color: '#000000',
    }));
    expect(effect).not.toBeNull();
    expect(effect!.type).toBe('DROP_SHADOW');
    expect(effect!.offset.x).toBe(4);
    expect(effect!.offset.y).toBe(4);
    expect(effect!.radius).toBe(8);
  });
});

describe('bridgeDimensionToNumber', () => {
  it('converts "8px" to 8', () => {
    expect(bridgeDimensionToNumber(makeToken('dimension', '8px'))).toBe(8);
  });

  it('converts "1.5rem" to 24', () => {
    expect(bridgeDimensionToNumber(makeToken('dimension', '1.5rem'))).toBe(24);
  });

  it('returns null for invalid strings', () => {
    expect(bridgeDimensionToNumber(makeToken('dimension', 'abc'))).toBeNull();
  });
});

describe('bridgeFontWeight', () => {
  it('converts string "700" to number 700', () => {
    expect(bridgeFontWeight(makeToken('fontWeight', '700'))).toBe(700);
  });

  it('passes through numbers', () => {
    expect(bridgeFontWeight(makeToken('fontWeight', 400))).toBe(400);
  });
});
