import { describe, expect, it } from 'vitest';

import { computeDiff } from '../../src/tokens/differ';
import type { DTCGTokenFile } from '../../src/types/tokens';

function makeFiles(files: Record<string, DTCGTokenFile>): Map<string, DTCGTokenFile> {
  return new Map(Object.entries(files));
}

describe('computeDiff', () => {
  it('detects added tokens', () => {
    const baseline = makeFiles({ 'tokens.json': {} });
    const current = makeFiles({ 'tokens.json': { a: { $type: 'color', $value: '#000' } } });
    const diffs = computeDiff(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('added');
    expect(diffs[0].path).toBe('a');
  });

  it('detects removed tokens', () => {
    const baseline = makeFiles({ 'tokens.json': { a: { $type: 'color', $value: '#000' } } });
    const current = makeFiles({ 'tokens.json': {} });
    const diffs = computeDiff(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('removed');
  });

  it('detects modified tokens', () => {
    const baseline = makeFiles({ 'tokens.json': { a: { $type: 'color', $value: '#000' } } });
    const current = makeFiles({ 'tokens.json': { a: { $type: 'color', $value: '#FFF' } } });
    const diffs = computeDiff(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe('modified');
    expect(diffs[0].before).toBe('#000');
    expect(diffs[0].after).toBe('#FFF');
  });

  it('returns empty diff when files are identical', () => {
    const files = makeFiles({ 'tokens.json': { a: { $type: 'color', $value: '#000' } } });
    const diffs = computeDiff(files, files);
    expect(diffs).toHaveLength(0);
  });

  it('handles multi-file diffs', () => {
    const baseline = makeFiles({
      'a.json': { x: { $type: 'color', $value: '#000' } },
      'b.json': { y: { $type: 'color', $value: '#FFF' } },
    });
    const current = makeFiles({
      'a.json': { x: { $type: 'color', $value: '#111' } },
      'b.json': { y: { $type: 'color', $value: '#FFF' } },
    });
    const diffs = computeDiff(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('x');
  });
});
