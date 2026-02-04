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

  describe('--producer', () => {
    it('creates .clafoutis/producer.json', async () => {
      await initCommand({ producer: true });

      const configPath = path.join(tempDir, '.clafoutis/producer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.tokens).toBe('./tokens');
      expect(config.output).toBe('./build');
      expect(config.generators).toHaveProperty('tailwind');
      expect(config.generators).toHaveProperty('figma');
    });

    it('creates example tokens file', async () => {
      await initCommand({ producer: true });

      const tokensPath = path.join(tempDir, 'tokens/colors/primitives.json');
      const tokens = JSON.parse(await fs.readFile(tokensPath, 'utf-8'));

      expect(tokens.color.primary.$type).toBe('color');
      expect(tokens.color.primary.$value).toBe('#3b82f6');
    });

    it('creates GitHub workflow', async () => {
      await initCommand({ producer: true });

      const workflowPath = path.join(
        tempDir,
        '.github/workflows/clafoutis-release.yml'
      );
      const workflow = await fs.readFile(workflowPath, 'utf-8');

      expect(workflow).toContain('npx clafoutis generate');
      expect(workflow).toContain('softprops/action-gh-release');
    });

    it('throws if config already exists', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/producer.json', '{}');

      await expect(initCommand({ producer: true })).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('--consumer', () => {
    it('creates .clafoutis/consumer.json', async () => {
      await initCommand({ consumer: true });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.repo).toBe('YourOrg/design-system');
      expect(config.version).toBe('v1.0.0');
      expect(config.files).toHaveProperty('scss._colors.scss');
      expect(config.files).toHaveProperty('tailwind.config.js');
    });

    it('uses provided repo', async () => {
      await initCommand({ consumer: true, repo: 'MyOrg/tokens' });

      const configPath = path.join(tempDir, '.clafoutis/consumer.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

      expect(config.repo).toBe('MyOrg/tokens');
    });

    it('throws if config already exists', async () => {
      await fs.mkdir('.clafoutis', { recursive: true });
      await fs.writeFile('.clafoutis/consumer.json', '{}');

      await expect(initCommand({ consumer: true })).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('default behavior', () => {
    it('defaults to consumer mode', async () => {
      await initCommand({});

      const consumerConfigExists = await fs
        .access('.clafoutis/consumer.json')
        .then(() => true)
        .catch(() => false);
      const producerConfigExists = await fs
        .access('.clafoutis/producer.json')
        .then(() => true)
        .catch(() => false);

      expect(consumerConfigExists).toBe(true);
      expect(producerConfigExists).toBe(false);
    });
  });
});
