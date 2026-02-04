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

    const files = await downloadRelease(config);
    expect(files.get('_colors.scss')).toBe('$color: #fff;');
  });

  it('handles missing assets gracefully', async () => {
    const mockRelease = { assets: [] };

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

    const files = await downloadRelease(config);
    expect(files.size).toBe(0);
  });

  it('downloads multiple assets', async () => {
    const mockRelease = {
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

    const files = await downloadRelease(config);
    expect(files.size).toBe(2);
    expect(files.get('_colors.scss')).toBe('$primary: #3b82f6;');
    expect(files.get('_typography.scss')).toBe('$text: #1f2937;');
  });

  it('includes authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'test-token';

    const mockRelease = { assets: [] };
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

    delete process.env.GITHUB_TOKEN;
  });
});
