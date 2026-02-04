import * as p from '@clack/prompts';
import { Ajv, type ErrorObject } from 'ajv';

import { ClafoutisError } from '../utils/errors.js';

/**
 * Validates a GitHub repository format (org/repo-name).
 * @returns Error message if invalid, undefined if valid.
 */
export function validateRepo(value: string | undefined): string | undefined {
  if (!value) {
    return 'Repository is required';
  }
  if (!/^[\w-]+\/[\w.-]+$/.test(value)) {
    return 'Repository must be in format: org/repo-name';
  }
  return undefined;
}

/**
 * Validates a file system path.
 * Paths must start with ./ or / or be exactly "."
 * @returns Error message if invalid, undefined if valid.
 */
export function validatePath(value: string | undefined): string | undefined {
  if (!value) {
    return 'Path is required';
  }
  if (!value.startsWith('./') && !value.startsWith('/') && value !== '.') {
    return 'Path must start with ./ or /, or be "."';
  }
  return undefined;
}

/**
 * Validates that a string value is not empty or whitespace-only.
 * @returns Error message if empty, undefined if valid.
 */
export function required(value: string | undefined): string | undefined {
  if (!value || !value.trim()) {
    return 'This field is required';
  }
  return undefined;
}

const DEPRECATED_FIELDS: Record<string, string> = {
  'generators.css': 'Use "generators.tailwind" instead',
  buildDir: 'Renamed to "output"',
};

/**
 * Validates a config object against its JSON schema and checks for issues.
 * - Throws ClafoutisError if schema validation fails
 * - Logs warnings for unknown fields not defined in the schema
 * - Logs warnings for deprecated fields with migration guidance
 */
export function validateConfig(
  config: Record<string, unknown>,
  schema: object,
  configPath: string
): void {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  if (!validate(config)) {
    const errors = validate.errors
      ?.map((e: ErrorObject) => `  - ${e.instancePath || 'root'}: ${e.message}`)
      .join('\n');
    throw new ClafoutisError(
      'Invalid configuration',
      `${configPath}:\n${errors}`,
      'Check the config against the schema or run "clafoutis init --force" to regenerate'
    );
  }

  const schemaObj = schema as { properties?: Record<string, unknown> };
  if (schemaObj.properties) {
    const unknownFields = findUnknownFields(config, schemaObj.properties);
    if (unknownFields.length > 0) {
      p.log.warn(
        `Unknown fields in ${configPath}: ${unknownFields.join(', ')}`
      );
      p.log.info(
        'These fields will be ignored. Check for typos or outdated config.'
      );
    }
  }

  for (const [field, message] of Object.entries(DEPRECATED_FIELDS)) {
    if (hasField(config, field)) {
      p.log.warn(`Deprecated field "${field}": ${message}`);
    }
  }
}

/**
 * Recursively finds fields in config that are not defined in the schema.
 * Returns an array of dot-notation paths to unknown fields.
 */
function findUnknownFields(
  config: Record<string, unknown>,
  schemaProperties: Record<string, unknown>,
  prefix = ''
): string[] {
  const unknown: string[] = [];

  for (const key of Object.keys(config)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (!(key in schemaProperties)) {
      unknown.push(fullPath);
    } else {
      const value = config[key];
      const schemaProp = schemaProperties[key] as {
        properties?: Record<string, unknown>;
      };

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        schemaProp?.properties
      ) {
        unknown.push(
          ...findUnknownFields(
            value as Record<string, unknown>,
            schemaProp.properties,
            fullPath
          )
        );
      }
    }
  }

  return unknown;
}

/**
 * Checks if a config object has a field at the given dot-notation path.
 * Example: hasField(config, 'generators.css') checks config.generators.css
 */
function hasField(config: Record<string, unknown>, path: string): boolean {
  const parts = path.split('.');
  let current: unknown = config;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return false;
    }
  }

  return true;
}

/**
 * Validates CLI flags for producer init command.
 * @returns Array of error messages for invalid flags, empty if all valid.
 */
export function validateProducerFlags(options: {
  tokens?: string;
  output?: string;
  generators?: string;
}): string[] {
  const errors: string[] = [];

  if (options.tokens) {
    const tokenError = validatePath(options.tokens);
    if (tokenError) {
      errors.push(`--tokens: ${tokenError}`);
    }
  }

  if (options.output) {
    const outputError = validatePath(options.output);
    if (outputError) {
      errors.push(`--output: ${outputError}`);
    }
  }

  if (options.generators) {
    const builtInGenerators = ['tailwind', 'figma'];
    const generators = options.generators.split(',').map(g => g.trim());
    for (const gen of generators) {
      // Check if it's a custom generator with path (name:path format)
      const colonIdx = gen.indexOf(':');
      if (colonIdx > 0) {
        // Custom generator: validate name and path are non-empty
        const name = gen.slice(0, colonIdx).trim();
        const pluginPath = gen.slice(colonIdx + 1).trim();
        if (!name) {
          errors.push(
            `--generators: Custom generator "${gen}" has an empty name`
          );
        }
        if (!pluginPath) {
          errors.push(
            `--generators: Custom generator "${name}" is missing a path`
          );
        }
      } else if (!builtInGenerators.includes(gen)) {
        // Not a built-in generator and not in name:path format
        errors.push(
          `--generators: Invalid generator "${gen}". Built-in options: ${builtInGenerators.join(', ')}. For custom generators use "name:./path/to/plugin.js"`
        );
      }
    }
  }

  return errors;
}

/**
 * Validates CLI flags for consumer init command.
 * @returns Array of error messages for invalid flags, empty if all valid.
 */
export function validateConsumerFlags(options: {
  repo?: string;
  files?: string;
}): string[] {
  const errors: string[] = [];

  if (options.repo) {
    const repoError = validateRepo(options.repo);
    if (repoError) {
      errors.push(`--repo: ${repoError}`);
    }
  }

  if (options.files) {
    const mappings = options.files.split(',');
    for (const mapping of mappings) {
      if (!mapping.includes(':')) {
        errors.push(
          `--files: Invalid format "${mapping}". Use format: asset:destination`
        );
      }
    }
  }

  return errors;
}
