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

  describe('duration tokens', () => {
    it('accepts valid ms duration', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '150ms' } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts valid seconds duration', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '0.5s' } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts zero duration', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '0ms' } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts decimal ms duration', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '16.67ms' } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('rejects duration without unit', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '150' } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
      expect(results[0].severity).toBe('error');
    });

    it('rejects duration with invalid unit', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: '150px' } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
    });

    it('rejects non-string duration', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'duration', $value: 150 } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
    });

    it('skips validation for duration reference tokens', () => {
      const files = makeFiles({
        'tokens.json': {
          fast: { $type: 'duration', $value: '100ms' },
          micro: { $type: 'duration', $value: '{fast}' },
        },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });
  });

  describe('cubicBezier tokens', () => {
    it('accepts valid standard ease', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0.4, 0, 0.2, 1] } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts linear [0, 0, 1, 1]', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0, 0, 1, 1] } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts spring with y-values outside 0-1 (overshoot)', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0.175, 0.885, 0.32, 1.275] } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('accepts bounce with large y-overshoot', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0.34, 1.56, 0.64, 1] } },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });

    it('rejects non-array value', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: '0.4, 0, 0.2, 1' } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
      expect(results[0].severity).toBe('error');
    });

    it('rejects array with wrong length', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0.4, 0, 0.2] } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
    });

    it('rejects array with non-numeric values', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [0.4, 0, 'ease', 1] } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
    });

    it('rejects array with NaN values', () => {
      const files = makeFiles({
        'tokens.json': { a: { $type: 'cubicBezier', $value: [NaN, 0, 0.2, 1] } },
      });
      const results = validateTokens(files);
      expect(results.some((r) => r.code === 'INVALID_VALUE')).toBe(true);
    });

    it('skips validation for cubicBezier reference tokens', () => {
      const files = makeFiles({
        'tokens.json': {
          'easing.out': { $type: 'cubicBezier', $value: [0, 0, 0.2, 1] },
          'motion.enter.easing': { $type: 'cubicBezier', $value: '{easing.out}' },
        },
      });
      expect(validateTokens(files)).toHaveLength(0);
    });
  });

  it('validates a comprehensive motion token set without errors', () => {
    const files = makeFiles({
      'motion.json': {
        duration: {
          none:       { $type: 'duration', $value: '0ms' },
          instant:    { $type: 'duration', $value: '50ms' },
          fast:       { $type: 'duration', $value: '100ms' },
          moderate:   { $type: 'duration', $value: '150ms' },
          normal:     { $type: 'duration', $value: '250ms' },
          slow:       { $type: 'duration', $value: '400ms' },
          deliberate: { $type: 'duration', $value: '700ms' },
          leisurely:  { $type: 'duration', $value: '1000ms' },
        },
        easing: {
          linear:     { $type: 'cubicBezier', $value: [0, 0, 1, 1] },
          default:    { $type: 'cubicBezier', $value: [0.4, 0, 0.2, 1] },
          in:         { $type: 'cubicBezier', $value: [0.4, 0, 1, 1] },
          out:        { $type: 'cubicBezier', $value: [0, 0, 0.2, 1] },
          spring:     { $type: 'cubicBezier', $value: [0.175, 0.885, 0.32, 1.275] },
          bounce:     { $type: 'cubicBezier', $value: [0.34, 1.56, 0.64, 1] },
        },
      },
    });
    expect(validateTokens(files)).toHaveLength(0);
  });
});
