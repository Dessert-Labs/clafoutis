import * as p from "@clack/prompts";
import { Command } from "commander";

import { formatCommand } from "./commands/format";
import { generateCommand } from "./commands/generate";
import { initCommand } from "./commands/init";
import { syncCommand } from "./commands/sync";
import { ClafoutisError } from "./utils/errors";

const program = new Command();

/**
 * Formats and displays an error using @clack/prompts styling when in TTY,
 * otherwise falls back to plain text formatting.
 */
function displayError(err: ClafoutisError): void {
  if (process.stdin.isTTY) {
    p.log.error(`${err.title}: ${err.detail}`);
    if (err.suggestion) {
      p.log.info(`Suggestion: ${err.suggestion}`);
    }
  } else {
    console.error(err.format());
  }
}

/**
 * Wraps a command action with error handling for ClafoutisError instances.
 */
function withErrorHandling<T>(
  fn: (options: T) => void | Promise<void>,
): (options: T) => Promise<void> {
  return async (options: T): Promise<void> => {
    try {
      await fn(options);
    } catch (err) {
      if (err instanceof ClafoutisError) {
        displayError(err);
        process.exit(1);
      }
      throw err;
    }
  };
}

/**
 * Handles unexpected errors (both sync and async) with consistent formatting.
 */
function handleUnexpectedError(err: unknown): void {
  if (err instanceof ClafoutisError) {
    displayError(err);
  } else {
    const message = err instanceof Error ? err.message : String(err);
    if (process.stdin.isTTY) {
      p.log.error(`Unexpected error: ${message}`);
      p.log.info(
        "Please report this issue at: https://github.com/Dessert-Labs/clafoutis/issues",
      );
    } else {
      console.error(`\nUnexpected error: ${message}\n`);
      console.error(
        "Please report this issue at: https://github.com/Dessert-Labs/clafoutis/issues",
      );
    }
  }
  process.exit(1);
}

process.on("uncaughtException", handleUnexpectedError);

process.on("unhandledRejection", (reason: unknown) => {
  handleUnexpectedError(reason);
});

program
  .name("clafoutis")
  .description("GitOps powered design system - generate and sync design tokens")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate platform outputs from design tokens (for producers)")
  .option(
    "-c, --config <path>",
    "Path to config file",
    ".clafoutis/producer.json",
  )
  .option("--tailwind", "Generate Tailwind output")
  .option("--figma", "Generate Figma variables")
  .option("-o, --output <dir>", "Output directory", "./build")
  .option("--cwd <path>", "Run command as if from this directory")
  .option("--dry-run", "Preview changes without writing files")
  .action(withErrorHandling(generateCommand));

program
  .command("sync")
  .description("Sync design tokens from GitHub Release (for consumers)")
  .option("-f, --force", "Force sync even if versions match")
  .option(
    "-c, --config <path>",
    "Path to config file",
    ".clafoutis/consumer.json",
  )
  .option("--cwd <path>", "Run command as if from this directory")
  .option("--dry-run", "Preview changes without writing files")
  .action(withErrorHandling(syncCommand));

program
  .command("init")
  .description("Initialize Clafoutis configuration")
  .option("--producer", "Set up as a design token producer")
  .option("--consumer", "Set up as a design token consumer")
  .option("-r, --repo <repo>", "GitHub repo for consumer mode (org/name)")
  .option("-t, --tokens <path>", "Token directory path (default: ./tokens)")
  .option("-o, --output <path>", "Output directory path (default: ./build)")
  .option(
    "-g, --generators <list>",
    "Comma-separated generators: tailwind, figma",
  )
  .option("--workflow", "Create GitHub Actions workflow (default: true)")
  .option("--no-workflow", "Skip GitHub Actions workflow")
  .option(
    "--files <mapping>",
    "File mappings for consumer: asset:dest,asset:dest",
  )
  .option("--force", "Overwrite existing configuration")
  .option("--dry-run", "Preview changes without writing files")
  .option("--non-interactive", "Skip prompts, use defaults or flags")
  .option("--cwd <path>", "Run command as if from this directory")
  .action(withErrorHandling(initCommand));

program
  .command("format")
  .description("Format token JSON files for consistent formatting")
  .option("-t, --tokens <path>", "Token directory path", "./tokens")
  .option(
    "--check",
    "Check formatting without modifying files (fails if unformatted)",
  )
  .option("--cwd <path>", "Run command as if from this directory")
  .option("--dry-run", "Preview changes without writing files")
  .action(withErrorHandling(formatCommand));

program.parse();
