import * as p from "@clack/prompts";

import { validatePath, validateRepo } from "./validation";

export interface ProducerWizardAnswers {
  generators: string[];
  tokens: string;
  output: string;
  workflow: boolean;
}

export interface ConsumerWizardAnswers {
  repo: string;
  files: Record<string, string>;
}

export type WizardMode = "producer" | "consumer";

/**
 * Displays the intro banner for the wizard session.
 * Shows "(DRY RUN)" suffix when in dry-run mode.
 */
export function showIntro(dryRun = false): void {
  const suffix = dryRun ? " (DRY RUN)" : "";
  p.intro(`Clafoutis - GitOps Design Token Generator${suffix}`);
}

/**
 * Displays the outro message after wizard completion.
 */
export function showOutro(message: string): void {
  p.outro(message);
}

/**
 * Prompts user to select between producer and consumer mode.
 * @returns Selected mode, or null if user cancels with Ctrl+C.
 */
export async function selectMode(): Promise<WizardMode | null> {
  const mode = await p.select({
    message: "What would you like to set up?",
    options: [
      {
        value: "producer",
        label: "Producer",
        hint: "I maintain a design system",
      },
      {
        value: "consumer",
        label: "Consumer",
        hint: "I consume tokens from a design system",
      },
    ],
  });

  if (p.isCancel(mode)) {
    return null;
  }

  return mode as WizardMode;
}

/**
 * Runs the interactive wizard for producer setup.
 * Collects: generators to enable, token/output paths, and workflow preference.
 * Exits gracefully if user cancels at any point.
 */
export async function runProducerWizard(): Promise<ProducerWizardAnswers | null> {
  const answers = await p.group(
    {
      generators: () =>
        p.multiselect({
          message: "Which generators would you like to enable?",
          options: [
            { value: "tailwind", label: "Tailwind CSS", hint: "recommended" },
            { value: "figma", label: "Figma Variables" },
          ],
          required: true,
          initialValues: ["tailwind"],
        }),

      tokens: () =>
        p.text({
          message: "Where are your design tokens located?",
          placeholder: "./tokens",
          initialValue: "./tokens",
          validate: validatePath,
        }),

      output: () =>
        p.text({
          message: "Where should generated files be output?",
          placeholder: "./build",
          initialValue: "./build",
          validate: validatePath,
        }),

      workflow: () =>
        p.confirm({
          message: "Create GitHub Actions workflow for auto-releases?",
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    },
  );

  return answers as ProducerWizardAnswers;
}

/**
 * Runs the interactive wizard for consumer setup.
 * Collects: source repository and file mappings (source -> destination).
 * Exits gracefully if user cancels at any point.
 */
export async function runConsumerWizard(): Promise<ConsumerWizardAnswers | null> {
  const repo = await p.text({
    message: "GitHub repository (org/repo):",
    placeholder: "Acme/design-system",
    validate: validateRepo,
  });

  if (p.isCancel(repo)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const filesInput = await p.text({
    message: "Which files do you want to sync? (comma-separated)",
    placeholder: "tailwind.base.css, tailwind.config.js",
    initialValue: "tailwind.base.css, tailwind.config.js",
  });

  if (p.isCancel(filesInput)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  const fileNames = (filesInput as string)
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const files: Record<string, string> = {};

  for (const fileName of fileNames) {
    const defaultDest = suggestDestination(fileName);
    const dest = await p.text({
      message: `Where should ${fileName} be saved?`,
      placeholder: defaultDest,
      initialValue: defaultDest,
      validate: validatePath,
    });

    if (p.isCancel(dest)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }

    files[fileName] = dest as string;
  }

  return {
    repo: repo as string,
    files,
  };
}

/**
 * Suggests a reasonable destination path based on file extension and name.
 * - tailwind.config files go to project root
 * - CSS/SCSS files go to src/styles/
 * - Other files go to project root
 */
function suggestDestination(fileName: string): string {
  if (fileName.includes("tailwind.config")) {
    return "./tailwind.config.js";
  }
  if (fileName.includes(".css")) {
    return `./src/styles/${fileName}`;
  }
  if (fileName.includes(".scss")) {
    return `./src/styles/${fileName}`;
  }
  return `./${fileName}`;
}

/**
 * Asks user if they want to run the init wizard when config is missing.
 * Used by generate/sync commands to offer guided setup.
 * @returns true if user wants to run the wizard, false otherwise.
 */
export async function offerWizard(
  configType: "producer" | "consumer",
): Promise<boolean> {
  p.log.error(`Configuration not found: .clafoutis/${configType}.json`);

  const runWizard = await p.confirm({
    message: "Would you like to create one now?",
    initialValue: true,
  });

  if (p.isCancel(runWizard)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return runWizard as boolean;
}

/**
 * Creates a spinner for showing progress during async operations.
 */
export function createSpinner(): ReturnType<typeof p.spinner> {
  return p.spinner();
}

/**
 * Log helpers that use @clack/prompts styling for consistent output.
 */
export const log = {
  info: (message: string) => p.log.info(message),
  success: (message: string) => p.log.success(message),
  warn: (message: string) => p.log.warn(message),
  error: (message: string) => p.log.error(message),
  step: (message: string) => p.log.step(message),
  message: (message: string) => p.log.message(message),
};
