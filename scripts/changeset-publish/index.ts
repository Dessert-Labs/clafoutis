/**
 * Custom publish script for changesets that handles workspace:* protocol.
 *
 * Sanitizes workspace:* dependencies to proper semver ranges before publishing,
 * then restores the original package.json files after publish completes.
 */

import { globSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

export type DependencyBlock =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';

export interface Manifest {
  name?: string;
  version?: string;
  private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface PackageInfo {
  dir: string;
  manifestPath: string;
  manifest: Manifest;
}

export interface Backup {
  path: string;
  contents: string;
}

/**
 * Parse workspace patterns from pnpm-workspace.yaml content.
 * Expected format:
 *   packages:
 *     - 'apps/*'
 *     - 'packages/*'
 */
export function parseWorkspaceYaml(content: string): string[] {
  const patterns: string[] = [];

  // Simple line-by-line parsing for the packages array
  let inPackages = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'packages:') {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      // Stop if we hit another top-level key (no leading whitespace and ends with ':')
      if (trimmed && !line.startsWith(' ') && !line.startsWith('\t') && trimmed.endsWith(':')) {
        break;
      }
      // Match array items like "- 'apps/*'" or '- "packages/*"' or "- apps/*"
      const match = trimmed.match(/^-\s*['"]?([^'"]+)['"]?$/);
      if (match) {
        patterns.push(match[1]);
      }
    }
  }

  return patterns;
}

function getWorkspacePatterns(): string[] {
  const workspaceYamlPath = path.join(repoRoot, 'pnpm-workspace.yaml');
  if (!existsSync(workspaceYamlPath)) {
    throw new Error('pnpm-workspace.yaml not found at repo root');
  }

  const content = readFileSync(workspaceYamlPath, 'utf8');
  const patterns = parseWorkspaceYaml(content);

  if (patterns.length === 0) {
    throw new Error('No workspace patterns found in pnpm-workspace.yaml');
  }

  return patterns;
}

function listPackages(): PackageInfo[] {
  const results: PackageInfo[] = [];
  const patterns = getWorkspacePatterns();
  const seen = new Set<string>();

  for (const pattern of patterns) {
    // Skip negated patterns (exclusions)
    if (pattern.startsWith('!')) continue;

    // Glob for package.json files matching the pattern
    const globPattern = path.join(repoRoot, pattern, 'package.json');
    const matches = globSync(globPattern);

    for (const manifestPath of matches) {
      // Avoid duplicates
      if (seen.has(manifestPath)) continue;
      seen.add(manifestPath);

      const dir = path.dirname(manifestPath);
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
        if (manifest.name) {
          results.push({ dir, manifestPath, manifest });
        }
      } catch {
        console.warn(`Skipping ${manifestPath}: failed to parse package.json`);
      }
    }
  }

  return results;
}

function buildPackagesByName(): Map<string, PackageInfo> {
  const packages = listPackages();
  const map = new Map<string, PackageInfo>();
  for (const pkg of packages) {
    if (pkg.manifest.name) {
      map.set(pkg.manifest.name, pkg);
    }
  }
  return map;
}

export function needsSanitize(manifest: Manifest): boolean {
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

export function deriveWorkspaceRange(raw: string, version: string): string {
  const remainder = raw.slice('workspace:'.length).trim();
  if (!remainder || remainder === '*') return `^${version}`;
  // Explicit ^/~ with a version number (e.g., "^1.2.3" or "~1.2.3") – return unchanged
  if (/^[\^~][0-9]/.test(remainder)) {
    return remainder;
  }
  // Shorthand ^/~ alone – expand to ^${version} or ~${version}
  if (remainder === '^') return `^${version}`;
  if (remainder === '~') return `~${version}`;
  if (/^(>=|<=|>|<|=)$/.test(remainder)) {
    return `${remainder}${version}`;
  }
  if (/^(>=|<=|>|<|=)[0-9]/.test(remainder)) {
    return remainder;
  }
  if (/^[0-9]/.test(remainder)) {
    return remainder;
  }
  return `^${version}`;
}

export function sanitizeManifest(
  info: PackageInfo,
  pkgsByName: Map<string, PackageInfo>
): { changed: boolean; next: Manifest } {
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
        const target = pkgsByName.get(dep);
        if (!target || !target.manifest.version) {
          throw new Error(
            `Unable to resolve workspace dependency "${dep}" for package "${info.manifest.name}"`
          );
        }
        if (target.manifest.private) {
          throw new Error(
            `Package "${info.manifest.name}" depends on private workspace package "${dep}"; cannot publish`
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

export function writeManifestWithBackup(filePath: string, manifest: Manifest, backups: Backup[]): void {
  const original = readFileSync(filePath, 'utf8');
  backups.push({ path: filePath, contents: original });
  writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

export function restoreBackups(backups: Backup[]): void {
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
  const packages = listPackages();
  const packagesByName = buildPackagesByName();
  const backups: Backup[] = [];
  const sanitizedPackages: string[] = [];

  try {
    for (const pkg of packages) {
      if (pkg.manifest.private) continue;
      if (!needsSanitize(pkg.manifest)) continue;

      const { changed, next } = sanitizeManifest(pkg, packagesByName);
      if (!changed) continue;

      writeManifestWithBackup(pkg.manifestPath, next, backups);
      sanitizedPackages.push(pkg.manifest.name ?? pkg.manifestPath);
    }

    if (sanitizedPackages.length) {
      console.log('Sanitized workspace dependencies for:', sanitizedPackages.join(', '));
    } else {
      console.log('No workspace dependencies required sanitization.');
    }

    await exec(['pnpm', 'changeset', 'publish']);
  } finally {
    if (backups.length) {
      restoreBackups(backups);
      console.log('Restored original package.json files after publish.');
    }
  }
}

// Only run when executed directly, not when imported for testing
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runPublish().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
