import { describe, it, expect } from 'vitest';
import {
  validateConsumerConfig,
  validateProducerConfig,
} from '../../src/utils/validate.js';
import { ClafoutisError } from '../../src/utils/errors.js';

describe('validateConsumerConfig', () => {
  it('passes for valid config', () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };

    expect(() => validateConsumerConfig(config)).not.toThrow();
  });

  it('throws for missing required fields', () => {
    const config = {
      repo: 'test/repo',
    };

    expect(() => validateConsumerConfig(config)).toThrow(ClafoutisError);
  });

  it('throws for invalid repo format', () => {
    const config = {
      repo: 'invalid',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };

    expect(() => validateConsumerConfig(config)).toThrow(ClafoutisError);
  });

  it('throws for empty files object', () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {},
    };

    expect(() => validateConsumerConfig(config)).toThrow(ClafoutisError);
  });

  it('allows optional postSync field', () => {
    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
      postSync: 'npm run build',
    };

    expect(() => validateConsumerConfig(config)).not.toThrow();
  });
});

describe('validateProducerConfig', () => {
  it('passes for valid config', () => {
    const config = {
      tokens: './tokens',
      output: './build',
      generators: {
        tailwind: true,
        figma: false,
      },
    };

    expect(() => validateProducerConfig(config)).not.toThrow();
  });

  it('throws for missing required fields', () => {
    const config = {
      tokens: './tokens',
    };

    expect(() => validateProducerConfig(config)).toThrow(ClafoutisError);
  });

  it('allows custom generator paths', () => {
    const config = {
      tokens: './tokens',
      output: './build',
      generators: {
        tailwind: true,
        'custom-gen': './generators/custom.ts',
      },
    };

    expect(() => validateProducerConfig(config)).not.toThrow();
  });
});
