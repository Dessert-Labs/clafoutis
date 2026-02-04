import { logger } from '@clafoutis/shared';

import type { ClafoutisConfig } from '../types.js';
import {
  authRequiredError,
  ClafoutisError,
  releaseNotFoundError,
} from './errors.js';

interface GitHubRelease {
  tag_name: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export interface DownloadResult {
  files: Map<string, string>;
  resolvedTag: string;
}

/**
 * Downloads release assets from a GitHub repository.
 * Fetches the release metadata and then downloads each requested file.
 * Handles "latest" version by resolving to the actual tag name.
 *
 * @param config - Consumer configuration containing repo, version, and files to download
 * @returns Object containing downloaded files and the resolved tag name
 * @throws ClafoutisError if any requested assets are missing or fail to download
 */
export async function downloadRelease(
  config: ClafoutisConfig
): Promise<DownloadResult> {
  const token = process.env.CLAFOUTIS_REPO_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'clafoutis-cli',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // Use /releases/latest endpoint for "latest", otherwise use /releases/tags/{tag}
  const isLatest = config.version === 'latest';
  const releaseUrl = isLatest
    ? `https://api.github.com/repos/${config.repo}/releases/latest`
    : `https://api.github.com/repos/${config.repo}/releases/tags/${config.version}`;

  const releaseRes = await fetch(releaseUrl, { headers });

  if (!releaseRes.ok) {
    if (releaseRes.status === 404) {
      throw releaseNotFoundError(config.version, config.repo);
    } else if (releaseRes.status === 401 || releaseRes.status === 403) {
      throw authRequiredError();
    } else {
      logger.error(`GitHub API error: ${releaseRes.status}`);
      process.exit(1);
    }
  }

  const release = (await releaseRes.json()) as GitHubRelease;
  const resolvedTag = release.tag_name;

  if (isLatest) {
    logger.info(`Resolved "latest" to ${resolvedTag}`);
  }
  const files = new Map<string, string>();
  const missingAssets: string[] = [];
  const failedDownloads: string[] = [];

  for (const assetName of Object.keys(config.files)) {
    const asset = release.assets.find(a => a.name === assetName);

    if (!asset) {
      missingAssets.push(assetName);
      continue;
    }

    logger.info(`Downloading ${assetName}...`);

    const downloadHeaders = { ...headers, Accept: 'application/octet-stream' };
    const fileRes = await fetch(asset.browser_download_url, {
      headers: downloadHeaders,
    });

    if (!fileRes.ok) {
      failedDownloads.push(assetName);
      continue;
    }

    files.set(assetName, await fileRes.text());
  }

  const errors: string[] = [];
  if (missingAssets.length > 0) {
    errors.push(`Assets not found in release: ${missingAssets.join(', ')}`);
  }
  if (failedDownloads.length > 0) {
    errors.push(`Failed to download: ${failedDownloads.join(', ')}`);
  }

  if (errors.length > 0) {
    const availableAssets = release.assets.map(a => a.name).join(', ');
    throw new ClafoutisError(
      'Download failed',
      errors.join('\n'),
      `Available assets in ${resolvedTag}: ${availableAssets || 'none'}`
    );
  }

  return { files, resolvedTag };
}
