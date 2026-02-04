/**
 * Custom publish script for changesets that handles workspace:* protocol.
 *
 * Sanitizes workspace:* dependencies to proper semver ranges before publishing,
 * then restores the original package.json files after publish completes.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

type DependencyBlock =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';

interface Manifest {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface PackageInfo {
  dir: string;
  manifestPath: string;
  manifest: Manifest;
}

interface Backup {
  path: string;
  contents: string;
}

function listPackages(): PackageInfo[] {
  const results: PackageInfo[] = [];

  const appsDir = path.join(repoRoot, 'apps');
  if (existsSync(appsDir)) {
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(appsDir, entry.name);
      const manifestPath = path.join(dir, 'package.json');
      if (!existsSync(manifestPath)) continue;
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
        if (manifest.name) results.push({ dir, manifestPath, manifest });
      } catch {
        console.warn(`Skipping ${entry.name}: failed to parse package.json`);
      }
    }
  }

  const packagesDir = path.join(repoRoot, 'packages');
  if (existsSync(packagesDir)) {
    for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(packagesDir, entry.name);
      const manifestPath = path.join(dir, 'package.json');
      if (!existsSync(manifestPath)) continue;
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
        if (manifest.name) results.push({ dir, manifestPath, manifest });
      } catch {
        console.warn(`Skipping ${entry.name}: failed to parse package.json`);
      }
    }
  }

  return results;
}

const packages = listPackages();
const packagesByName = new Map<string, PackageInfo>();
for (const pkg of packages) {
  if (pkg.manifest.name) {
    packagesByName.set(pkg.manifest.name, pkg);
  }
}

function needsSanitize(manifest: Manifest): boolean {
  const blocks: DependencyBlock[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ];

  return blocks.some((block) => {
    const record = manifest[block];
    if (!record) return false;
    return Object.values(record).some(
      (value) => typeof value === 'string' && value.startsWith('workspace:')
    );
  });
}

function deriveWorkspaceRange(raw: string, version: string): string {
  const remainder = raw.slice('workspace:'.length).trim();
  if (!remainder || remainder === '*') return `^${version}`;
  if (remainder === '^') return `^${version}`;
  if (remainder === '~') return `~${version}`;
  if (remainder.startsWith('^') || remainder.startsWith('~')) {
    return `${remainder[0]}${version}`;
  }
  if (/^(>=|<=|>|<|=)/.test(remainder)) {
    return `${remainder}${version}`;
  }
  if (/^[0-9]/.test(remainder)) {
    return remainder;
  }
  return `^${version}`;
}

function sanitizeManifest(info: PackageInfo): { changed: boolean; next: Manifest } {
  const blocks: DependencyBlock[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ];

  const next = JSON.parse(JSON.stringify(info.manifest)) as Manifest;
  let changed = false;

  for (const block of blocks) {
    const record = next[block];
    if (!record) continue;

    for (const [dep, value] of Object.entries(record)) {
      if (typeof value !== 'string') continue;

      if (value.startsWith('workspace:')) {
        const target = packagesByName.get(dep);
        if (!target || !target.manifest.version) {
          throw new Error(
            `Unable to resolve workspace dependency "${dep}" for package "${info.manifest.name}"`
          );
        }
        const normalized = deriveWorkspaceRange(value, target.manifest.version);
        if (normalized !== value) {
          record[dep] = normalized;
          changed = true;
        }
      }
    }
  }

  return { changed, next };
}

function writeManifestWithBackup(filePath: string, manifest: Manifest, backups: Backup[]): void {
  const original = readFileSync(filePath, 'utf8');
  backups.push({ path: filePath, contents: original });
  writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function restoreBackups(backups: Backup[]): void {
  for (const backup of backups) {
    writeFileSync(backup.path, backup.contents, 'utf8');
  }
}

async function exec(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(args[0], args.slice(1), {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${args.join(' ')} exited with code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', reject);
  });
}

async function runPublish(): Promise<void> {
  const backups: Backup[] = [];
  const sanitizedPackages: string[] = [];

  for (const pkg of packages) {
    if (pkg.manifest.private) continue;
    if (!needsSanitize(pkg.manifest)) continue;

    const { changed, next } = sanitizeManifest(pkg);
    if (!changed) continue;

    writeManifestWithBackup(pkg.manifestPath, next, backups);
    sanitizedPackages.push(pkg.manifest.name ?? pkg.manifestPath);
  }

  if (sanitizedPackages.length) {
    console.log('Sanitized workspace dependencies for:', sanitizedPackages.join(', '));
  } else {
    console.log('No workspace dependencies required sanitization.');
  }

  try {
    await exec(['pnpm', 'changeset', 'publish']);
  } finally {
    if (backups.length) {
      restoreBackups(backups);
      console.log('Restored original package.json files after publish.');
    }
  }
}

runPublish().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
