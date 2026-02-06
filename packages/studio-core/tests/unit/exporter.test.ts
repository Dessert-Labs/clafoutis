import { describe, expect, it } from 'vitest';

import { exportTokens, serializeTokenFile } from '../../src/tokens/exporter';
import type { DTCGTokenFile } from '../../src/types/tokens';

describe('exportTokens', () => {
  it('round-trips: load -> export -> values match', () => {
    const original: DTCGTokenFile = {
      colors: {
        blue: { 100: { $type: 'color', $value: '#FBFDFF' } },
        red: { 100: { $type: 'color', $value: '#FFF5F5' } },
      },
    };
    const files = new Map([['colors.json', original]]);
    const exported = exportTokens(files);
    expect(exported['colors.json']).toEqual(original);
  });

  it('preserves DTCG format fields', () => {
    const file: DTCGTokenFile = {
      token: { $type: 'color', $value: '#000', $description: 'Black' },
    };
    const exported = exportTokens(new Map([['test.json', file]]));
    const token = exported['test.json'].token as { $type: string; $value: string; $description: string };
    expect(token.$type).toBe('color');
    expect(token.$value).toBe('#000');
    expect(token.$description).toBe('Black');
  });
});

describe('serializeTokenFile', () => {
  it('produces formatted JSON with trailing newline', () => {
    const file: DTCGTokenFile = { a: { $type: 'color', $value: '#000' } };
    const result = serializeTokenFile(file);
    expect(result).toContain('"$type": "color"');
    expect(result.endsWith('\n')).toBe(true);
  });
});
