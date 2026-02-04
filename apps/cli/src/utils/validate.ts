import type { ErrorObject } from 'ajv';
import Ajv from 'ajv';
import { createRequire } from 'module';

import { ClafoutisError } from './errors.js';

const require = createRequire(import.meta.url);
const consumerSchema = require('../../schemas/consumer-config.json');
const producerSchema = require('../../schemas/producer-config.json');

const ajv = new Ajv.default({ allErrors: true });

/**
 * Validates a consumer configuration object against the JSON schema.
 * Throws a ClafoutisError if validation fails.
 */
export function validateConsumerConfig(config: unknown): void {
  const validate = ajv.compile(consumerSchema);
  if (!validate(config)) {
    const errors = validate.errors!.map(
      (e: ErrorObject) => `  - ${e.instancePath || 'root'}: ${e.message}`
    );
    throw new ClafoutisError(
      'Invalid .clafoutis.json',
      `Configuration validation failed:\n${errors.join('\n')}`,
      'Check the schema at https://github.com/Dessert-Labs/clafoutis/blob/main/schemas/consumer-config.json'
    );
  }
}

/**
 * Validates a producer configuration object against the JSON schema.
 * Throws a ClafoutisError if validation fails.
 */
export function validateProducerConfig(config: unknown): void {
  const validate = ajv.compile(producerSchema);
  if (!validate(config)) {
    const errors = validate.errors!.map(
      (e: ErrorObject) => `  - ${e.instancePath || 'root'}: ${e.message}`
    );
    throw new ClafoutisError(
      'Invalid clafoutis.config.json',
      `Configuration validation failed:\n${errors.join('\n')}`,
      'Check the schema at https://github.com/Dessert-Labs/clafoutis/blob/main/schemas/producer-config.json'
    );
  }
}
