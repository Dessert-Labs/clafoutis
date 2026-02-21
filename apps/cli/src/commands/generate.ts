import { generate as figmaGenerate } from "@clafoutis/generators/figma";
import { generate as tailwindGenerate } from "@clafoutis/generators/tailwind";
import { logger } from "@clafoutis/shared";
import path from "path";
import StyleDictionary from "style-dictionary";
import { register as registerTsx } from "tsx/esm/api";
import { pathToFileURL } from "url";

import { offerWizard } from "../cli/wizard";
import type { GeneratorContext, GeneratorPlugin } from "../types";
import { fileExists, readProducerConfig } from "../utils/config";
import {
  resolveCommandCwd,
  resolveInCwd,
  validateCwdOption,
} from "../utils/cwd";
import {
  ClafoutisError,
  configNotFoundError,
  generatorNotFoundError,
  pluginLoadError,
  tokensDirNotFoundError,
} from "../utils/errors";
import { validateProducerConfig } from "../utils/validate";
import { initCommand } from "./init";

interface GenerateOptions {
  config?: string;
  tailwind?: boolean;
  figma?: boolean;
  output?: string;
  dryRun?: boolean;
  cwd?: string;
}

interface GeneratorModule {
  generate: GeneratorPlugin;
}

/**
 * Loads a generator plugin from a file path.
 * Supports both JavaScript and TypeScript files.
 * Resolves relative paths against the current working directory.
 */
async function loadPlugin(
  pluginPath: string,
  commandCwd: string,
): Promise<GeneratorModule> {
  const absolutePath = resolveInCwd(commandCwd, pluginPath);

  if (pluginPath.endsWith(".ts")) {
    registerTsx();
  }

  // Dynamic import required here: loads user-provided plugin files by path at runtime
  return import(pathToFileURL(absolutePath).href);
}

/**
 * Main generate command handler.
 * Reads configuration, validates it, and runs enabled generators.
 */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  validateCwdOption(options.cwd);
  const commandCwd = resolveCommandCwd(options.cwd);
  const configPath = resolveInCwd(
    commandCwd,
    options.config || ".clafoutis/producer.json",
  );

  let config = await readProducerConfig(configPath);

  if (!config) {
    if (await fileExists(configPath)) {
      throw new ClafoutisError(
        "Invalid configuration",
        `Could not parse ${configPath}`,
        "Ensure the file contains valid JSON",
      );
    }

    if (process.stdin.isTTY) {
      const shouldRunWizard = await offerWizard("producer");
      if (shouldRunWizard) {
        await initCommand({ producer: true, cwd: commandCwd });
        config = await readProducerConfig(configPath);
        if (!config) {
          throw configNotFoundError(configPath, false);
        }
      } else {
        throw configNotFoundError(configPath, false);
      }
    } else {
      throw configNotFoundError(configPath, false);
    }
  }

  validateProducerConfig(config);

  // Merge CLI flags with existing generators, preserving custom plugins
  if (options.tailwind !== undefined || options.figma !== undefined) {
    config = {
      ...config,
      generators: {
        ...(config.generators || {}),
        ...(options.tailwind !== undefined && { tailwind: options.tailwind }),
        ...(options.figma !== undefined && { figma: options.figma }),
      },
    };
  }

  if (options.output) {
    config.output = options.output;
  }

  // Resolve paths relative to current working directory (project root)
  const tokensDir = resolveInCwd(commandCwd, config.tokens || "./tokens");
  const outputDir = resolveInCwd(commandCwd, config.output || "./build");

  if (!(await fileExists(tokensDir))) {
    throw tokensDirNotFoundError(tokensDir);
  }

  // Use the same default for both dry-run and actual execution
  const generators = config.generators || { tailwind: true, figma: true };

  if (options.dryRun) {
    logger.info("[dry-run] Would read tokens from: " + tokensDir);
    logger.info("[dry-run] Would write to: " + outputDir);
    for (const [name, value] of Object.entries(generators)) {
      if (value !== false) {
        const type = typeof value === "string" ? "custom" : "built-in";
        logger.info(`[dry-run] Would run generator: ${name} (${type})`);
      }
    }
    return;
  }

  logger.info(`Tokens: ${tokensDir}`);
  logger.info(`Output: ${outputDir}`);

  let hadFailure = false;

  for (const [name, value] of Object.entries(generators)) {
    if (value === false) continue;

    logger.info(`Running ${name} generator...`);

    try {
      let generatorModule: GeneratorModule;

      if (typeof value === "string") {
        try {
          generatorModule = await loadPlugin(value, commandCwd);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          throw pluginLoadError(value, errorMessage);
        }

        if (typeof generatorModule.generate !== "function") {
          throw pluginLoadError(
            value,
            'Module does not export a "generate" function',
          );
        }
      } else {
        // Built-in generators from @clafoutis/generators package
        const builtInGenerators: Record<string, GeneratorModule> = {
          tailwind: {
            generate: async (ctx) =>
              tailwindGenerate(commandCwd, ctx.outputDir),
          },
          figma: {
            generate: async (ctx) => figmaGenerate(commandCwd, ctx.outputDir),
          },
        };

        if (!builtInGenerators[name]) {
          throw generatorNotFoundError(name);
        }

        generatorModule = builtInGenerators[name];
      }

      const context: GeneratorContext = {
        tokensDir,
        outputDir: path.join(outputDir, name),
        config,
        StyleDictionary,
      };
      await generatorModule.generate(context);

      logger.success(`${name} complete`);
    } catch (err) {
      if (err instanceof ClafoutisError) {
        throw err;
      }
      logger.error(`${name} failed: ${err}`);
      hadFailure = true;
    }
  }

  if (hadFailure) {
    throw new ClafoutisError(
      "Generation failed",
      "One or more generators failed",
      "Check the error messages above and fix the issues",
    );
  }

  logger.success("Generation complete");
}
