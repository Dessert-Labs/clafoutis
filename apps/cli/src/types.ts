import type StyleDictionary from 'style-dictionary';

/**
 * Context object passed to generator plugins containing all necessary
 * dependencies and configuration for token transformation.
 */
export interface GeneratorContext {
  /** Absolute path to the directory containing token JSON files */
  tokensDir: string;
  /** Absolute path to the output directory for this generator */
  outputDir: string;
  /** The full producer configuration */
  config: ProducerConfig;
  /** Style Dictionary instance for registering custom transforms and formats */
  StyleDictionary: typeof StyleDictionary;
}

/**
 * Function signature for custom generator plugins.
 * Plugins receive a context object and should write generated files to outputDir.
 */
export type GeneratorPlugin = (context: GeneratorContext) => Promise<void>;

/**
 * Configuration for design token producers (design system maintainers).
 * Stored in clafoutis.config.json at the repository root.
 */
export interface ProducerConfig {
  /** Path to the directory containing token JSON files */
  tokens: string;
  /** Output directory for generated files */
  output: string;
  /**
   * Generators to run.
   * - true: run built-in generator
   * - false: skip generator
   * - string: path to custom generator plugin
   */
  generators: Record<string, boolean | string>;
}

/**
 * Configuration for design token consumers (application developers).
 * Stored in .clafoutis/consumer.json at the repository root.
 */
export interface ClafoutisConfig {
  /** GitHub repository in org/name format */
  repo: string;
  /** Release tag to sync (e.g., "v1.0.0") */
  version: string;
  /** Mapping of release asset names to local file paths */
  files: Record<string, string>;
  /** Optional command to run after sync completes */
  postSync?: string;
}
