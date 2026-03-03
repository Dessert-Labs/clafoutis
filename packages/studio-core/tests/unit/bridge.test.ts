import { describe, expect, it } from 'vitest';

import { bridgeColorToPaint, bridgeCubicBezier, bridgeDimensionToNumber, bridgeDuration, bridgeFontWeight, bridgeShadowToEffect, bridgeTokenToCanvas } from '../../src/tokens/bridge';
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

describe('bridgeDuration', () => {
  it('returns a valid ms duration string', () => {
    expect(bridgeDuration(makeToken('duration', '150ms'))).toBe('150ms');
  });

  it('returns a valid seconds duration string', () => {
    expect(bridgeDuration(makeToken('duration', '0.5s'))).toBe('0.5s');
  });

  it('returns "0ms" for zero duration', () => {
    expect(bridgeDuration(makeToken('duration', '0ms'))).toBe('0ms');
  });

  it('returns null for non-string values', () => {
    expect(bridgeDuration(makeToken('duration', 150))).toBeNull();
  });

  it('returns null for string without a valid unit', () => {
    expect(bridgeDuration(makeToken('duration', '150'))).toBeNull();
  });
});

describe('bridgeCubicBezier', () => {
  it('returns a 4-number array for a valid easing', () => {
    const result = bridgeCubicBezier(makeToken('cubicBezier', [0.4, 0, 0.2, 1]));
    expect(result).toEqual([0.4, 0, 0.2, 1]);
  });

  it('returns the array for spring easing with overshoot', () => {
    const result = bridgeCubicBezier(makeToken('cubicBezier', [0.175, 0.885, 0.32, 1.275]));
    expect(result).toEqual([0.175, 0.885, 0.32, 1.275]);
  });

  it('returns null for a non-array value', () => {
    expect(bridgeCubicBezier(makeToken('cubicBezier', '0.4, 0, 0.2, 1'))).toBeNull();
  });

  it('returns null for wrong-length array', () => {
    expect(bridgeCubicBezier(makeToken('cubicBezier', [0.4, 0, 0.2]))).toBeNull();
  });

  it('returns null for array with non-numeric values', () => {
    expect(bridgeCubicBezier(makeToken('cubicBezier', [0.4, 0, 'ease', 1]))).toBeNull();
  });
});

describe('bridgeTokenToCanvas', () => {
  it('dispatches duration tokens to bridgeDuration', () => {
    expect(bridgeTokenToCanvas(makeToken('duration', '250ms'))).toBe('250ms');
  });

  it('dispatches cubicBezier tokens to bridgeCubicBezier', () => {
    expect(bridgeTokenToCanvas(makeToken('cubicBezier', [0, 0, 0.2, 1]))).toEqual([0, 0, 0.2, 1]);
  });

  it('returns null for unknown types', () => {
    expect(bridgeTokenToCanvas(makeToken('gradient', {}))).toBeNull();
  });
});
