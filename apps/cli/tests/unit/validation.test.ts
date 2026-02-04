import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateRepo,
  validatePath,
  required,
  validateProducerFlags,
  validateConsumerFlags,
  validateConfig,
} from '../../src/cli/validation.js';
import { ClafoutisError } from '../../src/utils/errors.js';

vi.mock('@clack/prompts', () => ({
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    step: vi.fn(),
    message: vi.fn(),
  },
}));

describe('validateRepo', () => {
  it('returns undefined for valid repo format', () => {
    expect(validateRepo('Acme/design-system')).toBeUndefined();
    expect(validateRepo('my-org/my-repo')).toBeUndefined();
    expect(validateRepo('org/repo.name')).toBeUndefined();
  });

  it('returns error for empty value', () => {
    expect(validateRepo('')).toBe('Repository is required');
  });

  it('returns error for invalid format', () => {
    expect(validateRepo('invalid')).toBe(
      'Repository must be in format: org/repo-name'
    );
    expect(validateRepo('no/slash/allowed')).toBe(
      'Repository must be in format: org/repo-name'
    );
    expect(validateRepo('/missing-org')).toBe(
      'Repository must be in format: org/repo-name'
    );
    expect(validateRepo('missing-repo/')).toBe(
      'Repository must be in format: org/repo-name'
    );
  });
});

describe('validatePath', () => {
  it('returns undefined for valid paths', () => {
    expect(validatePath('./tokens')).toBeUndefined();
    expect(validatePath('./src/styles/tokens')).toBeUndefined();
    expect(validatePath('/absolute/path')).toBeUndefined();
    expect(validatePath('.')).toBeUndefined();
  });

  it('returns error for empty value', () => {
    expect(validatePath('')).toBe('Path is required');
  });

  it('returns error for invalid paths', () => {
    expect(validatePath('relative/path')).toBe(
      'Path must start with ./ or /, or be "."'
    );
    expect(validatePath('tokens')).toBe(
      'Path must start with ./ or /, or be "."'
    );
  });
});

describe('required', () => {
  it('returns undefined for non-empty values', () => {
    expect(required('value')).toBeUndefined();
    expect(required('  value  ')).toBeUndefined();
  });

  it('returns error for empty or whitespace-only values', () => {
    expect(required('')).toBe('This field is required');
    expect(required('   ')).toBe('This field is required');
    expect(required('\t\n')).toBe('This field is required');
  });
});

describe('validateProducerFlags', () => {
  it('returns empty array for valid flags', () => {
    expect(
      validateProducerFlags({
        tokens: './tokens',
        output: './build',
        generators: 'tailwind,figma',
      })
    ).toEqual([]);
  });

  it('returns empty array for undefined flags', () => {
    expect(validateProducerFlags({})).toEqual([]);
  });

  it('returns errors for invalid tokens path', () => {
    const errors = validateProducerFlags({ tokens: 'invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('--tokens');
  });

  it('returns errors for invalid output path', () => {
    const errors = validateProducerFlags({ output: 'invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('--output');
  });

  it('returns errors for invalid generators', () => {
    const errors = validateProducerFlags({ generators: 'tailwind,invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('--generators');
    expect(errors[0]).toContain('invalid');
  });

  it('accumulates multiple errors', () => {
    const errors = validateProducerFlags({
      tokens: 'invalid',
      output: 'invalid',
      generators: 'unknown',
    });
    expect(errors).toHaveLength(3);
  });
});

describe('validateConsumerFlags', () => {
  it('returns empty array for valid flags', () => {
    expect(
      validateConsumerFlags({
        repo: 'Acme/design-system',
        files: 'tailwind.css:./src/styles/base.css',
      })
    ).toEqual([]);
  });

  it('returns empty array for undefined flags', () => {
    expect(validateConsumerFlags({})).toEqual([]);
  });

  it('returns errors for invalid repo format', () => {
    const errors = validateConsumerFlags({ repo: 'invalid' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('--repo');
  });

  it('returns errors for invalid files format', () => {
    const errors = validateConsumerFlags({ files: 'missing-colon' });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('--files');
    expect(errors[0]).toContain('asset:destination');
  });
});

describe('validateConfig', () => {
  const validSchema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      count: { type: 'number' },
    },
    additionalProperties: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw for valid config', () => {
    expect(() =>
      validateConfig({ name: 'test', count: 5 }, validSchema, 'test.json')
    ).not.toThrow();
  });

  it('throws ClafoutisError for schema validation failure', () => {
    expect(() =>
      validateConfig({ count: 'not a number' }, validSchema, 'test.json')
    ).toThrow(ClafoutisError);
  });

  it('includes config path in error message', () => {
    try {
      validateConfig({ invalid: true }, validSchema, 'my-config.json');
    } catch (err) {
      expect(err).toBeInstanceOf(ClafoutisError);
      expect((err as ClafoutisError).detail).toContain('my-config.json');
    }
  });
});
