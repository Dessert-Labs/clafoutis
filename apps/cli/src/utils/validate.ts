import consumerSchema from "../../schemas/consumer-config.json";
import producerSchema from "../../schemas/producer-config.json";
import { validateConfig } from "../cli/validation";

/**
 * Validates a consumer configuration object against the JSON schema.
 * Also warns about unknown or deprecated fields.
 * Throws a ClafoutisError if validation fails.
 */
export function validateConsumerConfig(config: unknown): void {
  validateConfig(
    config as Record<string, unknown>,
    consumerSchema,
    ".clafoutis/consumer.json",
  );
}

/**
 * Validates a producer configuration object against the JSON schema.
 * Also warns about unknown or deprecated fields.
 * Throws a ClafoutisError if validation fails.
 */
export function validateProducerConfig(config: unknown): void {
  validateConfig(
    config as Record<string, unknown>,
    producerSchema,
    ".clafoutis/producer.json",
  );
}
