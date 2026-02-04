import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseWorkspaceYaml,
  needsSanitize,
  deriveWorkspaceRange,
  sanitizeManifest,
  writeManifestWithBackup,
  restoreBackups,
  type Manifest,
  type PackageInfo,
  type Backup,
} from './index.js';

describe('parseWorkspaceYaml', () => {
  it('parses single-quoted patterns', () => {
    const yaml = `packages:
  - 'apps/*'
  - 'packages/*'
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*', 'packages/*']);
  });

  it('parses double-quoted patterns', () => {
    const yaml = `packages:
  - "apps/*"
  - "packages/*"
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*', 'packages/*']);
  });

  it('parses unquoted patterns', () => {
    const yaml = `packages:
  - apps/*
  - packages/*
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*', 'packages/*']);
  });

  it('parses mixed quote styles', () => {
    const yaml = `packages:
  - 'apps/*'
  - "libs/*"
  - tools/*
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*', 'libs/*', 'tools/*']);
  });

  it('stops at next top-level key', () => {
    const yaml = `packages:
  - 'apps/*'
catalog:
  react: ^18.0.0
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*']);
  });

  it('handles empty packages section', () => {
    const yaml = `packages:
other:
  - something
`;
    expect(parseWorkspaceYaml(yaml)).toEqual([]);
  });

  it('returns empty array when no packages key', () => {
    const yaml = `other:
  - something
`;
    expect(parseWorkspaceYaml(yaml)).toEqual([]);
  });

  it('handles tab indentation', () => {
    const yaml = `packages:
\t- 'apps/*'
\t- 'packages/*'
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['apps/*', 'packages/*']);
  });

  it('parses negated patterns', () => {
    const yaml = `packages:
  - 'packages/*'
  - '!packages/internal'
`;
    expect(parseWorkspaceYaml(yaml)).toEqual(['packages/*', '!packages/internal']);
  });
});

describe('needsSanitize', () => {
  it('returns true when dependencies contain workspace: protocol', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
      dependencies: {
        foo: 'workspace:*',
      },
    };
    expect(needsSanitize(manifest)).toBe(true);
  });

  it('returns true when devDependencies contain workspace: protocol', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
      devDependencies: {
        foo: 'workspace:^',
      },
    };
    expect(needsSanitize(manifest)).toBe(true);
  });

  it('returns true when peerDependencies contain workspace: protocol', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
      peerDependencies: {
        foo: 'workspace:~',
      },
    };
    expect(needsSanitize(manifest)).toBe(true);
  });

  it('returns true when optionalDependencies contain workspace: protocol', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
      optionalDependencies: {
        foo: 'workspace:*',
      },
    };
    expect(needsSanitize(manifest)).toBe(true);
  });

  it('returns false when no workspace: dependencies', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
      dependencies: {
        foo: '^1.0.0',
        bar: '~2.0.0',
      },
    };
    expect(needsSanitize(manifest)).toBe(false);
  });

  it('returns false when no dependencies', () => {
    const manifest: Manifest = {
      name: 'test-pkg',
    };
    expect(needsSanitize(manifest)).toBe(false);
  });
});

describe('deriveWorkspaceRange', () => {
  const version = '1.2.3';

  describe('shorthand protocols', () => {
    it('converts workspace:* to ^version', () => {
      expect(deriveWorkspaceRange('workspace:*', version)).toBe('^1.2.3');
    });

    it('converts workspace: (empty) to ^version', () => {
      expect(deriveWorkspaceRange('workspace:', version)).toBe('^1.2.3');
    });

    it('converts workspace:^ to ^version', () => {
      expect(deriveWorkspaceRange('workspace:^', version)).toBe('^1.2.3');
    });

    it('converts workspace:~ to ~version', () => {
      expect(deriveWorkspaceRange('workspace:~', version)).toBe('~1.2.3');
    });
  });

  describe('explicit version ranges with ^ or ~', () => {
    it('preserves workspace:^1.2.3 as ^1.2.3', () => {
      expect(deriveWorkspaceRange('workspace:^1.2.3', version)).toBe('^1.2.3');
    });

    it('preserves workspace:~1.2.3 as ~1.2.3', () => {
      expect(deriveWorkspaceRange('workspace:~1.2.3', version)).toBe('~1.2.3');
    });

    it('preserves workspace:^0.0.1 as ^0.0.1', () => {
      expect(deriveWorkspaceRange('workspace:^0.0.1', version)).toBe('^0.0.1');
    });

    it('preserves workspace:~2.0.0 as ~2.0.0', () => {
      expect(deriveWorkspaceRange('workspace:~2.0.0', version)).toBe('~2.0.0');
    });
  });

  describe('comparison operators', () => {
    it('converts workspace:>= to >=version', () => {
      expect(deriveWorkspaceRange('workspace:>=', version)).toBe('>=1.2.3');
    });

    it('converts workspace:<= to <=version', () => {
      expect(deriveWorkspaceRange('workspace:<=', version)).toBe('<=1.2.3');
    });

    it('converts workspace:> to >version', () => {
      expect(deriveWorkspaceRange('workspace:>', version)).toBe('>1.2.3');
    });

    it('converts workspace:< to <version', () => {
      expect(deriveWorkspaceRange('workspace:<', version)).toBe('<1.2.3');
    });

    it('converts workspace:= to =version', () => {
      expect(deriveWorkspaceRange('workspace:=', version)).toBe('=1.2.3');
    });
  });

  describe('explicit comparison operator ranges', () => {
    it('preserves workspace:>=1.0.0 as >=1.0.0', () => {
      expect(deriveWorkspaceRange('workspace:>=1.0.0', version)).toBe('>=1.0.0');
    });

    it('preserves workspace:<=2.0.0 as <=2.0.0', () => {
      expect(deriveWorkspaceRange('workspace:<=2.0.0', version)).toBe('<=2.0.0');
    });

    it('preserves workspace:>0.5.0 as >0.5.0', () => {
      expect(deriveWorkspaceRange('workspace:>0.5.0', version)).toBe('>0.5.0');
    });

    it('preserves workspace:<3.0.0 as <3.0.0', () => {
      expect(deriveWorkspaceRange('workspace:<3.0.0', version)).toBe('<3.0.0');
    });

    it('preserves workspace:=1.0.0 as =1.0.0', () => {
      expect(deriveWorkspaceRange('workspace:=1.0.0', version)).toBe('=1.0.0');
    });
  });

  describe('exact versions', () => {
    it('preserves workspace:1.2.3 as 1.2.3', () => {
      expect(deriveWorkspaceRange('workspace:1.2.3', version)).toBe('1.2.3');
    });

    it('preserves workspace:0.0.1 as 0.0.1', () => {
      expect(deriveWorkspaceRange('workspace:0.0.1', version)).toBe('0.0.1');
    });
  });

  describe('edge cases', () => {
    it('handles whitespace after workspace:', () => {
      expect(deriveWorkspaceRange('workspace: *', version)).toBe('^1.2.3');
      expect(deriveWorkspaceRange('workspace:  ^', version)).toBe('^1.2.3');
    });

    it('falls back to ^version for unknown patterns', () => {
      expect(deriveWorkspaceRange('workspace:unknown', version)).toBe('^1.2.3');
    });
  });
});

describe('sanitizeManifest', () => {
  function createPackageInfo(
    name: string,
    version: string,
    deps?: Record<string, string>,
    options?: { private?: boolean }
  ): PackageInfo {
    return {
      dir: `/fake/${name}`,
      manifestPath: `/fake/${name}/package.json`,
      manifest: {
        name,
        version,
        private: options?.private,
        dependencies: deps,
      },
    };
  }

  function createPackagesByName(packages: PackageInfo[]): Map<string, PackageInfo> {
    const map = new Map<string, PackageInfo>();
    for (const pkg of packages) {
      if (pkg.manifest.name) {
        map.set(pkg.manifest.name, pkg);
      }
    }
    return map;
  }

  it('sanitizes workspace:* to ^version', () => {
    const foo = createPackageInfo('foo', '1.0.0');
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:*' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(true);
    expect(next.dependencies?.foo).toBe('^1.0.0');
  });

  it('sanitizes workspace:^ to ^version', () => {
    const foo = createPackageInfo('foo', '1.0.0');
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:^' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(true);
    expect(next.dependencies?.foo).toBe('^1.0.0');
  });

  it('sanitizes workspace:~ to ~version', () => {
    const foo = createPackageInfo('foo', '1.0.0');
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:~' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(true);
    expect(next.dependencies?.foo).toBe('~1.0.0');
  });

  it('preserves explicit workspace:^x.y.z ranges', () => {
    const foo = createPackageInfo('foo', '2.0.0');
    const bar = createPackageInfo('bar', '1.0.0', { foo: 'workspace:^1.5.0' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(true);
    expect(next.dependencies?.foo).toBe('^1.5.0');
  });

  it('preserves explicit workspace:~x.y.z ranges', () => {
    const foo = createPackageInfo('foo', '2.0.0');
    const bar = createPackageInfo('bar', '1.0.0', { foo: 'workspace:~1.5.0' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(true);
    expect(next.dependencies?.foo).toBe('~1.5.0');
  });

  it('returns changed=false when no workspace dependencies', () => {
    const foo = createPackageInfo('foo', '1.0.0');
    const bar = createPackageInfo('bar', '2.0.0', { foo: '^1.0.0' });
    const pkgsByName = createPackagesByName([foo, bar]);

    const { changed, next } = sanitizeManifest(bar, pkgsByName);

    expect(changed).toBe(false);
    expect(next.dependencies?.foo).toBe('^1.0.0');
  });

  it('throws when workspace dependency not found', () => {
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:*' });
    const pkgsByName = createPackagesByName([bar]);

    expect(() => sanitizeManifest(bar, pkgsByName)).toThrow(
      'Unable to resolve workspace dependency "foo" for package "bar"'
    );
  });

  it('throws when workspace dependency has no version', () => {
    const foo: PackageInfo = {
      dir: '/fake/foo',
      manifestPath: '/fake/foo/package.json',
      manifest: { name: 'foo' }, // no version
    };
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:*' });
    const pkgsByName = createPackagesByName([foo, bar]);

    expect(() => sanitizeManifest(bar, pkgsByName)).toThrow(
      'Unable to resolve workspace dependency "foo" for package "bar"'
    );
  });

  it('throws when workspace dependency is private', () => {
    const foo = createPackageInfo('foo', '1.0.0', undefined, { private: true });
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:*' });
    const pkgsByName = createPackagesByName([foo, bar]);

    expect(() => sanitizeManifest(bar, pkgsByName)).toThrow(
      'Package "bar" depends on private workspace package "foo"; cannot publish'
    );
  });

  it('does not mutate original manifest', () => {
    const foo = createPackageInfo('foo', '1.0.0');
    const bar = createPackageInfo('bar', '2.0.0', { foo: 'workspace:*' });
    const pkgsByName = createPackagesByName([foo, bar]);
    const originalDep = bar.manifest.dependencies?.foo;

    sanitizeManifest(bar, pkgsByName);

    expect(bar.manifest.dependencies?.foo).toBe(originalDep);
  });
});

describe('writeManifestWithBackup and restoreBackups', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `changeset-publish-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes manifest and stores backup', () => {
    const filePath = join(tempDir, 'package.json');
    const originalContent = JSON.stringify({ name: 'original', version: '1.0.0' }, null, 2) + '\n';
    writeFileSync(filePath, originalContent);

    const backups: Backup[] = [];
    const newManifest: Manifest = { name: 'updated', version: '2.0.0' };

    writeManifestWithBackup(filePath, newManifest, backups);

    // Check file was updated
    const written = readFileSync(filePath, 'utf8');
    expect(JSON.parse(written)).toEqual(newManifest);

    // Check backup was stored
    expect(backups).toHaveLength(1);
    expect(backups[0].path).toBe(filePath);
    expect(backups[0].contents).toBe(originalContent);
  });

  it('restoreBackups restores original content', () => {
    const filePath = join(tempDir, 'package.json');
    const originalContent = JSON.stringify({ name: 'original', version: '1.0.0' }, null, 2) + '\n';
    writeFileSync(filePath, originalContent);

    const backups: Backup[] = [];
    const newManifest: Manifest = { name: 'updated', version: '2.0.0' };

    writeManifestWithBackup(filePath, newManifest, backups);

    // Verify file changed
    expect(readFileSync(filePath, 'utf8')).not.toBe(originalContent);

    // Restore
    restoreBackups(backups);

    // Verify restored
    expect(readFileSync(filePath, 'utf8')).toBe(originalContent);
  });

  it('restores multiple backups', () => {
    const file1 = join(tempDir, 'pkg1.json');
    const file2 = join(tempDir, 'pkg2.json');
    const content1 = JSON.stringify({ name: 'pkg1' }, null, 2) + '\n';
    const content2 = JSON.stringify({ name: 'pkg2' }, null, 2) + '\n';
    writeFileSync(file1, content1);
    writeFileSync(file2, content2);

    const backups: Backup[] = [];
    writeManifestWithBackup(file1, { name: 'new1' }, backups);
    writeManifestWithBackup(file2, { name: 'new2' }, backups);

    expect(backups).toHaveLength(2);

    restoreBackups(backups);

    expect(readFileSync(file1, 'utf8')).toBe(content1);
    expect(readFileSync(file2, 'utf8')).toBe(content2);
  });
});
