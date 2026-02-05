import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initCommand } from '../../src/commands/init.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('initCommand', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clafoutis-init-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true });
  });

  describe('producer mode', () => {
    it('creates .clafoutis/producer.json with default values', async () => {
      await initCommand({ producer: true, nonInteractive: true });

      const configPath = path.join(tempDir, '.clafoutis/producer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.tokens).toBe('./tokens');
      expect(config.output).toBe('./build');
      expect(config.generators.tailwind).toBe(true);
    });

    it('creates starter token files', async () => {
      await initCommand({ producer: true, nonInteractive: true });

      // Check primitives (raw color values)
      const colorPrimitivesPath = path.join(
        tempDir,
        'tokens/colors/primitives.json'
      );
      const colorPrimitives = JSON.parse(
        await fs.readFile(colorPrimitivesPath, 'utf-8')
      );
      expect(colorPrimitives.color.gray).toBeDefined();
      expect(colorPrimitives.color.blue).toBeDefined();

      // Check semantics (named colors with meaning)
      const colorSemanticsPath = path.join(
        tempDir,
        'tokens/colors/semantic.json'
      );
      const colorSemantics = JSON.parse(
        await fs.readFile(colorSemanticsPath, 'utf-8')
      );
      expect(colorSemantics.color.primary).toBeDefined();
      expect(colorSemantics.color.neutral).toBeDefined();

      const spacingTokensPath = path.join(
        tempDir,
        'tokens/spacing/primitives.json'
      );
      const spacingTokens = JSON.parse(
        await fs.readFile(spacingTokensPath, 'utf-8')
      );
      expect(spacingTokens.spacing).toBeDefined();
    });

    it('creates GitHub workflow by default', async () => {
      await initCommand({ producer: true, nonInteractive: true });

      const workflowPath = path.join(
        tempDir,
        '.github/workflows/clafoutis-release.yml'
      );
      const workflow = await fs.readFile(workflowPath, 'utf-8');

      expect(workflow).toContain('clafoutis generate');
      expect(workflow).toContain('softprops/action-gh-release');
    });

    it('skips workflow with --no-workflow', async () => {
      await initCommand({
        producer: true,
        workflow: false,
        nonInteractive: true,
      });

      const workflowExists = await fs
        .access('.github/workflows/clafoutis-release.yml')
        .then(() => true)
        .catch(() => false);

      expect(workflowExists).toBe(false);
    });

    it('uses custom paths from flags', async () => {
      await initCommand({
        producer: true,
        tokens: './design-tokens',
        output: './dist',
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/producer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.tokens).toBe('./design-tokens');
      expect(config.output).toBe('./dist');
    });

    it('uses custom generators from flags', async () => {
      await initCommand({
        producer: true,
        generators: 'tailwind,figma',
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/producer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.generators.tailwind).toBe(true);
      expect(config.generators.figma).toBe(true);
    });

    it('throws if config already exists', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/producer.json', '{}');

      await expect(
        initCommand({ producer: true, nonInteractive: true })
      ).rejects.toThrow('already exists');
    });

    it('overwrites with --force flag', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/producer.json', '{"old": "config"}');

      await initCommand({ producer: true, force: true, nonInteractive: true });

      const configPath = path.join(tempDir, '.clafoutis/producer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.old).toBeUndefined();
      expect(config.tokens).toBe('./tokens');
    });
  });

  describe('consumer mode', () => {
    it('creates .clafoutis/consumer.json with provided repo', async () => {
      await initCommand({
        consumer: true,
        repo: 'Acme/design-system',
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.repo).toBe('Acme/design-system');
      expect(config.version).toBe('latest');
      expect(config.files).toBeDefined();
    });

    it('uses default file mappings', async () => {
      await initCommand({
        consumer: true,
        repo: 'Acme/design-system',
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.files['tailwind.base.css']).toBe('./src/styles/base.css');
      expect(config.files['tailwind.config.js']).toBe('./tailwind.config.js');
    });

    it('uses custom file mappings from flags', async () => {
      await initCommand({
        consumer: true,
        repo: 'Acme/design-system',
        files: 'tokens.css:./src/tokens.css,vars.scss:./src/vars.scss',
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.files['tokens.css']).toBe('./src/tokens.css');
      expect(config.files['vars.scss']).toBe('./src/vars.scss');
    });

    it('throws if repo not provided in non-interactive mode', async () => {
      await expect(
        initCommand({ consumer: true, nonInteractive: true })
      ).rejects.toThrow('--repo is required');
    });

    it('throws if config already exists', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/consumer.json', '{}');

      await expect(
        initCommand({ consumer: true, repo: 'Acme/ds', nonInteractive: true })
      ).rejects.toThrow('already exists');
    });

    it('overwrites with --force flag', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/consumer.json', '{"repo": "Old/repo"}');

      await initCommand({
        consumer: true,
        repo: 'New/repo',
        force: true,
        nonInteractive: true,
      });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.repo).toBe('New/repo');
    });
  });

  describe('dry-run mode', () => {
    it('does not write files in dry-run mode', async () => {
      await initCommand({ producer: true, dryRun: true, nonInteractive: true });

      const configExists = await fs
        .access('.clafoutis/producer.json')
        .then(() => true)
        .catch(() => false);

      expect(configExists).toBe(false);
    });

    it('does not create tokens in dry-run mode', async () => {
      await initCommand({ producer: true, dryRun: true, nonInteractive: true });

      const tokensExist = await fs
        .access('tokens')
        .then(() => true)
        .catch(() => false);

      expect(tokensExist).toBe(false);
    });
  });

  describe('non-interactive mode', () => {
    it('requires --producer or --consumer', async () => {
      await expect(initCommand({ nonInteractive: true })).rejects.toThrow(
        'you must specify --producer or --consumer'
      );
    });
  });
});
