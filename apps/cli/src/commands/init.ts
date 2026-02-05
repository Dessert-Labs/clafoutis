import * as p from "@clack/prompts";
import fs from "fs/promises";
import path from "path";

import {
  validateConsumerFlags,
  validateProducerFlags,
} from "../cli/validation";
import {
  type ConsumerWizardAnswers,
  log,
  type ProducerWizardAnswers,
  runConsumerWizard,
  runProducerWizard,
  selectMode,
  showIntro,
  showOutro,
} from "../cli/wizard";
import {
  getConsumerGitignore,
  getProducerGitignore,
} from "../templates/gitignore";
import { getAllStarterTokens } from "../templates/tokens";
import { getWorkflowPath, getWorkflowTemplate } from "../templates/workflow";
import { fileExists } from "../utils/config";
import { ClafoutisError } from "../utils/errors";

export interface InitOptions {
  producer?: boolean;
  consumer?: boolean;
  repo?: string;
  tokens?: string;
  output?: string;
  generators?: string;
  workflow?: boolean;
  files?: string;
  force?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
}

interface FileToCreate {
  path: string;
  content: string;
  description?: string;
}

/**
 * Parses and validates a comma-separated generators string.
 * Each entry can be:
 * - A built-in generator name: "tailwind", "figma"
 * - A custom generator with path: "name:./path/to/plugin.js"
 *
 * @param generatorsString - Comma-separated generators string
 * @returns Array of validated generator entries
 * @throws ClafoutisError if any entries are invalid
 */
function parseGenerators(generatorsString: string): string[] {
  const entries = generatorsString.split(",").map((g) => g.trim());
  const invalidEntries: string[] = [];

  for (const entry of entries) {
    if (!entry) {
      invalidEntries.push("(empty entry - check for extra commas)");
      continue;
    }

    const colonIdx = entry.indexOf(":");
    if (colonIdx === 0) {
      invalidEntries.push(`"${entry}" (missing generator name before ":")`);
    } else if (colonIdx > 0) {
      const name = entry.slice(0, colonIdx).trim();
      const pluginPath = entry.slice(colonIdx + 1).trim();
      if (!name) {
        invalidEntries.push(`"${entry}" (empty generator name)`);
      }
      if (!pluginPath) {
        invalidEntries.push(`"${entry}" (missing path after ":")`);
      }
    }
  }

  if (invalidEntries.length > 0) {
    throw new ClafoutisError(
      "Invalid generator entries",
      `The following entries are malformed:\n  - ${invalidEntries.join("\n  - ")}`,
      'Use format "tailwind,figma" for built-ins or "name:./path/to/plugin.js" for custom generators',
    );
  }

  return entries.filter((e) => e.length > 0);
}

/**
 * Main init command handler.
 * Supports both interactive wizard and non-interactive CLI flag modes.
 * @throws ClafoutisError if both --producer and --consumer flags are set
 */
export async function initCommand(options: InitOptions): Promise<void> {
  // Reject ambiguous flag combinations early
  if (options.producer && options.consumer) {
    throw new ClafoutisError(
      "Conflicting flags",
      "Cannot specify both --producer and --consumer",
      "Choose one: --producer for design system repos, --consumer for application repos",
    );
  }

  const isInteractive = !options.nonInteractive && process.stdin.isTTY;
  const isDryRun = options.dryRun ?? false;

  if (isInteractive) {
    await runInteractiveInit(options, isDryRun);
  } else {
    await runNonInteractiveInit(options, isDryRun);
  }
}

async function runInteractiveInit(
  options: InitOptions,
  isDryRun: boolean,
): Promise<void> {
  showIntro(isDryRun);

  let mode: "producer" | "consumer";

  if (options.producer) {
    mode = "producer";
  } else if (options.consumer) {
    mode = "consumer";
  } else {
    const selectedMode = await selectMode();
    if (!selectedMode) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    mode = selectedMode;
  }

  if (mode === "producer") {
    const answers = await runProducerWizard();
    if (!answers) {
      return;
    }
    await createProducerConfig(answers, options.force ?? false, isDryRun);
  } else {
    const answers = await runConsumerWizard();
    if (!answers) {
      return;
    }
    await createConsumerConfig(answers, options.force ?? false, isDryRun);
  }

  if (isDryRun) {
    showOutro("No files were written. Remove --dry-run to apply changes.");
  } else {
    showOutro("Setup complete!");
  }
}

async function runNonInteractiveInit(
  options: InitOptions,
  isDryRun: boolean,
): Promise<void> {
  if (!options.producer && !options.consumer) {
    throw new ClafoutisError(
      "Mode required",
      "In non-interactive mode, you must specify --producer or --consumer",
      "Add --producer or --consumer flag",
    );
  }

  if (options.producer) {
    const errors = validateProducerFlags(options);
    if (errors.length > 0) {
      throw new ClafoutisError(
        "Invalid flags",
        errors.join("\n"),
        "Fix the invalid flags and try again",
      );
    }

    const answers: ProducerWizardAnswers = {
      generators: options.generators
        ? parseGenerators(options.generators)
        : ["tailwind"],
      tokens: options.tokens ?? "./tokens",
      output: options.output ?? "./build",
      workflow: options.workflow ?? true,
    };

    await createProducerConfig(answers, options.force ?? false, isDryRun);
  } else {
    const errors = validateConsumerFlags(options);
    if (errors.length > 0) {
      throw new ClafoutisError(
        "Invalid flags",
        errors.join("\n"),
        "Fix the invalid flags and try again",
      );
    }

    if (!options.repo) {
      throw new ClafoutisError(
        "Repository required",
        "In non-interactive mode, --repo is required for consumer setup",
        "Add --repo=org/repo-name flag",
      );
    }

    const files: Record<string, string> = {};
    if (options.files) {
      for (const mapping of options.files.split(",")) {
        const colonIdx = mapping.indexOf(":");
        if (colonIdx === -1) {
          throw new ClafoutisError(
            "Invalid file mapping",
            `Mapping "${mapping.trim()}" is missing a colon separator`,
            'Use the format "source:destination" (e.g., "tokens.css:./src/styles/tokens.css")',
          );
        }

        const source = mapping.slice(0, colonIdx).trim();
        const dest = mapping.slice(colonIdx + 1).trim();

        if (!source) {
          throw new ClafoutisError(
            "Invalid file mapping",
            `Mapping "${mapping.trim()}" has an empty source`,
            'Provide a valid asset name before the colon (e.g., "tokens.css:./path")',
          );
        }

        if (!dest) {
          throw new ClafoutisError(
            "Invalid file mapping",
            `Mapping "${mapping.trim()}" has an empty destination`,
            'Provide a valid path after the colon (e.g., "tokens.css:./path")',
          );
        }

        files[source] = dest;
      }
    } else {
      files["tailwind.base.css"] = "./src/styles/base.css";
      files["tailwind.config.js"] = "./tailwind.config.js";
    }

    const answers: ConsumerWizardAnswers = {
      repo: options.repo,
      files,
    };

    await createConsumerConfig(answers, options.force ?? false, isDryRun);
  }
}

async function createProducerConfig(
  answers: ProducerWizardAnswers,
  force: boolean,
  dryRun: boolean,
): Promise<void> {
  const configPath = ".clafoutis/producer.json";

  if (!force && (await fileExists(configPath))) {
    throw new ClafoutisError(
      "Configuration already exists",
      configPath,
      "Use --force to overwrite the existing configuration",
    );
  }

  const generators: Record<string, boolean | string> = {};
  for (const entry of answers.generators) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx > 0) {
      const name = entry.slice(0, colonIdx).trim();
      const pluginPath = entry.slice(colonIdx + 1).trim();
      generators[name] = pluginPath;
    } else {
      generators[entry] = true;
    }
  }

  const config = {
    tokens: answers.tokens,
    output: answers.output,
    generators,
  };

  const filesToCreate: FileToCreate[] = [
    {
      path: configPath,
      content: JSON.stringify(config, null, 2) + "\n",
      description: `tokens: "${answers.tokens}", output: "${answers.output}"`,
    },
  ];

  const starterTokens = getAllStarterTokens();
  for (const token of starterTokens) {
    const tokenPath = path.join(answers.tokens, token.path);
    if (!force && (await fileExists(tokenPath))) {
      continue;
    }
    filesToCreate.push({
      path: tokenPath,
      content: token.content,
      description: "Starter token template",
    });
  }

  if (answers.workflow) {
    const workflowPath = getWorkflowPath();
    if (force || !(await fileExists(workflowPath))) {
      filesToCreate.push({
        path: workflowPath,
        content: getWorkflowTemplate(),
        description: "Auto-release workflow on push to main",
      });
    }
  }

  // Add .gitignore for producer repos
  if (force || !(await fileExists(".gitignore"))) {
    filesToCreate.push({
      path: ".gitignore",
      content: getProducerGitignore(),
      description: "Ignore build artifacts and release-assets",
    });
  }

  if (dryRun) {
    showDryRunOutput(filesToCreate);
  } else {
    await writeFiles(filesToCreate);
    showNextSteps("producer", answers);
  }
}

async function createConsumerConfig(
  answers: ConsumerWizardAnswers,
  force: boolean,
  dryRun: boolean,
): Promise<void> {
  const configPath = ".clafoutis/consumer.json";

  if (!force && (await fileExists(configPath))) {
    throw new ClafoutisError(
      "Configuration already exists",
      configPath,
      "Use --force to overwrite the existing configuration",
    );
  }

  const config = {
    repo: answers.repo,
    version: "latest",
    files: answers.files,
  };

  const filesToCreate: FileToCreate[] = [
    {
      path: configPath,
      content: JSON.stringify(config, null, 2) + "\n",
      description: `repo: "${answers.repo}"`,
    },
  ];

  // Add .gitignore entry for consumer repos (append if exists)
  const gitignorePath = ".gitignore";
  const consumerIgnore = getConsumerGitignore();
  if (await fileExists(gitignorePath)) {
    // Check if cache is already ignored
    const existingContent = await fs.readFile(gitignorePath, "utf-8");
    if (!existingContent.includes(".clafoutis/cache")) {
      filesToCreate.push({
        path: gitignorePath,
        content: existingContent.trimEnd() + "\n\n" + consumerIgnore,
        description: "Append .clafoutis/cache to existing .gitignore",
      });
    }
  } else {
    filesToCreate.push({
      path: gitignorePath,
      content: consumerIgnore,
      description: "Ignore .clafoutis/cache",
    });
  }

  if (dryRun) {
    showDryRunOutput(filesToCreate);
  } else {
    await writeFiles(filesToCreate);
    showNextSteps("consumer", answers);
  }
}

function showDryRunOutput(files: FileToCreate[]): void {
  log.message("");
  log.step("Would create the following files:");
  log.message("");

  for (const file of files) {
    log.message(`  ${file.path}`);
    if (file.description) {
      log.message(`  └─ ${file.description}`);
    }
  }

  log.message("");
}

async function writeFiles(files: FileToCreate[]): Promise<void> {
  for (const file of files) {
    const dir = path.dirname(file.path);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file.path, file.content);
    log.success(`Created ${file.path}`);
  }
}

function showNextSteps(
  mode: "producer" | "consumer",
  answers: ProducerWizardAnswers | ConsumerWizardAnswers,
): void {
  log.message("");
  log.step("Next steps:");

  if (mode === "producer") {
    const producerAnswers = answers as ProducerWizardAnswers;
    log.message(
      `  1. Edit ${producerAnswers.tokens}/colors/primitives.json with your design tokens`,
    );
    log.message("  2. Run: npx clafoutis generate");
    log.message("  3. Push to GitHub - releases will be created automatically");
  } else {
    log.message("  1. Run: npx clafoutis sync");
  }
}
