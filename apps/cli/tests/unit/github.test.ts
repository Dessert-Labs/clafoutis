import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadRelease } from '../../src/utils/github.js';

describe('downloadRelease', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches release and downloads assets', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$color: #fff;'),
      } as Response);

    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
      },
    };

    const result = await downloadRelease(config);
    expect(result.files.get('_colors.scss')).toBe('$color: #fff;');
    expect(result.resolvedTag).toBe('v1.0.0');
  });

  it('throws error for missing assets', async () => {
    const mockRelease = { tag_name: 'v1.0.0', assets: [] };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRelease),
    } as Response);

    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_missing.scss': 'src/tokens/_missing.scss',
      },
    };

    await expect(downloadRelease(config)).rejects.toThrow('Download failed');
  });

  it('downloads multiple assets', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      assets: [
        {
          name: '_colors.scss',
          browser_download_url: 'https://example.com/colors.scss',
        },
        {
          name: '_typography.scss',
          browser_download_url: 'https://example.com/typography.scss',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$primary: #3b82f6;'),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('$text: #1f2937;'),
      } as Response);

    const config = {
      repo: 'test/repo',
      version: 'v1.0.0',
      files: {
        '_colors.scss': 'src/tokens/_colors.scss',
        '_typography.scss': 'src/tokens/_typography.scss',
      },
    };

    const result = await downloadRelease(config);
    expect(result.files.size).toBe(2);
    expect(result.files.get('_colors.scss')).toBe('$primary: #3b82f6;');
    expect(result.files.get('_typography.scss')).toBe('$text: #1f2937;');
    expect(result.resolvedTag).toBe('v1.0.0');
  });

  it('includes authorization header when CLAFOUTIS_REPO_TOKEN is set', async () => {
    const prevToken = process.env.CLAFOUTIS_REPO_TOKEN;
    process.env.CLAFOUTIS_REPO_TOKEN = 'test-token';

    try {
      const mockRelease = { tag_name: 'v1.0.0', assets: [] };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response);

      const config = {
        repo: 'test/repo',
        version: 'v1.0.0',
        files: {},
      };

      await downloadRelease(config);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'token test-token',
          }),
        })
      );
    } finally {
      if (prevToken === undefined) {
        delete process.env.CLAFOUTIS_REPO_TOKEN;
      } else {
        process.env.CLAFOUTIS_REPO_TOKEN = prevToken;
      }
    }
  });

  it('resolves "latest" to actual tag name using /releases/latest endpoint', async () => {
    const mockRelease = {
      tag_name: 'v2.3.4',
      assets: [
        {
          name: 'tokens.css',
          browser_download_url: 'https://example.com/tokens.css',
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRelease),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(':root { --color: red; }'),
      } as Response);

    const config = {
      repo: 'test/repo',
      version: 'latest',
      files: {
        'tokens.css': 'src/tokens.css',
      },
    };

    const result = await downloadRelease(config);
    expect(result.resolvedTag).toBe('v2.3.4');
    expect(result.files.get('tokens.css')).toBe(':root { --color: red; }');

    // Verify it used the /releases/latest endpoint
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/test/repo/releases/latest',
      expect.any(Object)
    );
  });
});
