/**
 * ANSI color codes for terminal output formatting.
 */
const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
};

/**
 * Custom error class for Clafoutis CLI errors.
 * Provides structured error messages with actionable suggestions.
 */
export class ClafoutisError extends Error {
  constructor(
    public title: string,
    public detail: string,
    public suggestion?: string
  ) {
    super(`${title}: ${detail}`);
    this.name = 'ClafoutisError';
  }

  /**
   * Formats the error for display in the terminal with colors and structure.
   */
  format(): string {
    let output = `\n${colors.red('Error:')} ${this.title}\n`;
    output += `\n${this.detail}\n`;
    if (this.suggestion) {
      output += `\n${colors.cyan('Suggestion:')} ${this.suggestion}\n`;
    }
    return output;
  }
}

/**
 * Creates a ClafoutisError for when a configuration file is not found.
 */
export function configNotFoundError(
  configPath: string,
  isConsumer: boolean
): ClafoutisError {
  return new ClafoutisError(
    'Configuration not found',
    `Could not find ${configPath}`,
    `Run: npx clafoutis init --${isConsumer ? 'consumer' : 'producer'}`
  );
}

/**
 * Creates a ClafoutisError for invalid repository format.
 */
export function invalidRepoError(repo: string): ClafoutisError {
  return new ClafoutisError(
    'Invalid repository format',
    `"${repo}" is not a valid GitHub repository`,
    'Use format: org/repo (e.g., "YourOrg/design-system")'
  );
}

/**
 * Creates a ClafoutisError for when a GitHub release is not found.
 */
export function releaseNotFoundError(
  version: string,
  repo: string
): ClafoutisError {
  return new ClafoutisError(
    'Release not found',
    `Version ${version} does not exist in ${repo}`,
    `Check available releases: gh release list -R ${repo}`
  );
}

/**
 * Creates a ClafoutisError for when GitHub authentication is required.
 */
export function authRequiredError(): ClafoutisError {
  return new ClafoutisError(
    'Authentication required',
    'GITHUB_TOKEN is required for private repositories',
    'Set the environment variable: export GITHUB_TOKEN=ghp_xxx'
  );
}

/**
 * Creates a ClafoutisError for when a built-in generator is not found.
 */
export function generatorNotFoundError(name: string): ClafoutisError {
  return new ClafoutisError(
    'Generator not found',
    `Built-in generator "${name}" does not exist`,
    'Available generators: tailwind, figma'
  );
}

/**
 * Creates a ClafoutisError for when a plugin fails to load.
 */
export function pluginLoadError(
  pluginPath: string,
  errorMessage: string
): ClafoutisError {
  return new ClafoutisError(
    'Plugin load failed',
    `Could not load generator from ${pluginPath}: ${errorMessage}`,
    'Ensure the file exports a "generate" function'
  );
}

/**
 * Creates a ClafoutisError for when the tokens directory is missing.
 */
export function tokensDirNotFoundError(tokensDir: string): ClafoutisError {
  return new ClafoutisError(
    'Tokens directory not found',
    `Directory "${tokensDir}" does not exist`,
    'Create the directory and add token JSON files'
  );
}
