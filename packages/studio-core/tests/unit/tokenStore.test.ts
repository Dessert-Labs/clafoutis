import { describe, expect, it, vi } from 'vitest';

import { createTokenStore } from '../../src/store/tokenStore';

const sampleTokens = {
  'colors/primitives.json': {
    colors: {
      blue: { 500: { $type: 'color', $value: '#3B82F6' } },
      white: { 100: { $type: 'color', $value: '#FFFFFF' } },
    },
  },
  'colors/semantics.json': {
    colors: {
      background: { primary: { $type: 'color', $value: '{colors.white.100}' } },
    },
  },
};

describe('tokenStore', () => {
  it('loadTokens parses and resolves tokens', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    expect(store.getState().resolvedTokens.length).toBeGreaterThan(0);
  });

  it('updateToken modifies value and marks dirty', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    expect(store.getState().dirtyFiles.size).toBeGreaterThan(0);
  });

  it('addToken inserts a new token', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const before = store.getState().resolvedTokens.length;
    store.getState().addToken('colors.green.500', 'color', '#10B981', 'colors/primitives.json');
    expect(store.getState().resolvedTokens.length).toBe(before + 1);
  });

  it('removeToken removes a token', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const before = store.getState().resolvedTokens.length;
    store.getState().removeToken('colors.blue.500');
    expect(store.getState().resolvedTokens.length).toBe(before - 1);
  });

  it('getTokensByCategory filters correctly', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const colors = store.getState().getTokensByCategory('colors');
    expect(colors.every((t) => t.type === 'color')).toBe(true);
  });

  it('exportAsJSON produces valid output', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const exported = store.getState().exportAsJSON();
    expect(Object.keys(exported)).toContain('colors/primitives.json');
  });

  it('getDiff returns correct diff', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    const diffs = store.getState().getDiff();
    expect(diffs.some((d) => d.path === 'colors.blue.500' && d.type === 'modified')).toBe(true);
  });

  it('undoTokenChange restores previous value', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    store.getState().undoTokenChange();
    const token = store.getState().resolvedTokens.find((t) => t.path === 'colors.blue.500');
    expect(token?.value).toBe('#3B82F6');
  });

  it('redoTokenChange re-applies the change', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    store.getState().undoTokenChange();
    store.getState().redoTokenChange();
    const token = store.getState().resolvedTokens.find((t) => t.path === 'colors.blue.500');
    expect(token?.value).toBe('#EF4444');
  });

  it('canUndo returns false on fresh store', () => {
    const store = createTokenStore();
    expect(store.getState().canUndo()).toBe(false);
  });

  it('canUndo returns true after mutation', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    expect(store.getState().canUndo()).toBe(true);
  });

  it('canRedo returns false after new mutation', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');
    store.getState().undoTokenChange();
    store.getState().updateToken('colors.blue.500', '#000000');
    expect(store.getState().canRedo()).toBe(false);
  });

  it('createTokenFile adds a new file', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().createTokenFile('colors/brand.json');
    expect(store.getState().tokenFiles.has('colors/brand.json')).toBe(true);
  });

  it('deleteTokenFile removes file', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().deleteTokenFile('colors/primitives.json');
    expect(store.getState().tokenFiles.has('colors/primitives.json')).toBe(false);
  });

  it('getTokenGroups returns tree structure', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const groups = store.getState().getTokenGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].name).toBe('colors');
  });

  it('updateToken updates resolvedValue for downstream references', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);

    const refToken = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.background.primary',
    );
    expect(refToken?.reference).toBe('colors.white.100');
    expect(refToken?.resolvedValue).toBe('#FFFFFF');

    store.getState().updateToken('colors.white.100', '#AABBCC');

    const updated = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.background.primary',
    );
    expect(updated?.resolvedValue).toBe('#AABBCC');
  });

  it('store.subscribe fires on updateToken', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().updateToken('colors.blue.500', '#EF4444');
    expect(listener).toHaveBeenCalled();
  });

  it('store.subscribe fires on addToken', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().addToken('colors.green.500', 'color', '#10B981', 'colors/primitives.json');
    expect(listener).toHaveBeenCalled();
  });

  it('store.subscribe fires on undo and redo', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);
    store.getState().updateToken('colors.blue.500', '#EF4444');

    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().undoTokenChange();
    expect(listener).toHaveBeenCalledTimes(1);

    store.getState().redoTokenChange();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('store.subscribe fires on loadTokens', () => {
    const store = createTokenStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().loadTokens(sampleTokens);
    expect(listener).toHaveBeenCalled();
  });

  it('loadTokens restores draft correctly (draft restore scenario)', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);

    const originalToken = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.blue.500',
    );
    expect(originalToken?.value).toBe('#3B82F6');

    store.getState().updateToken('colors.blue.500', '#FF0000');
    const modifiedToken = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.blue.500',
    );
    expect(modifiedToken?.value).toBe('#FF0000');

    const exported = store.getState().exportAsJSON();
    expect(exported['colors/primitives.json'].colors.blue[500].$value).toBe('#FF0000');

    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().loadTokens(exported);
    expect(listener).toHaveBeenCalled();

    const restoredToken = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.blue.500',
    );
    expect(restoredToken?.value).toBe('#FF0000');
    expect(restoredToken?.resolvedValue).toBe('#FF0000');
  });

  it('loadTokens restores draft with multiple token changes', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);

    store.getState().updateToken('colors.blue.500', '#FF0000');
    store.getState().updateToken('colors.white.100', '#AABBCC');
    store.getState().addToken('colors.green.500', 'color', '#00FF00', 'colors/primitives.json');

    const exported = store.getState().exportAsJSON();
    
    const store2 = createTokenStore();
    store2.getState().loadTokens(exported);

    const blueToken = store2.getState().resolvedTokens.find(
      (t) => t.path === 'colors.blue.500',
    );
    expect(blueToken?.value).toBe('#FF0000');
    expect(blueToken?.resolvedValue).toBe('#FF0000');

    const whiteToken = store2.getState().resolvedTokens.find(
      (t) => t.path === 'colors.white.100',
    );
    expect(whiteToken?.value).toBe('#AABBCC');
    expect(whiteToken?.resolvedValue).toBe('#AABBCC');

    const greenToken = store2.getState().resolvedTokens.find(
      (t) => t.path === 'colors.green.500',
    );
    expect(greenToken?.value).toBe('#00FF00');
    expect(greenToken?.resolvedValue).toBe('#00FF00');
  });

  it('loadTokens restores draft and updates resolved values for references', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);

    const refToken = store.getState().resolvedTokens.find(
      (t) => t.path === 'colors.background.primary',
    );
    expect(refToken?.reference).toBe('colors.white.100');
    expect(refToken?.resolvedValue).toBe('#FFFFFF');

    store.getState().updateToken('colors.white.100', '#AABBCC');
    const exported = store.getState().exportAsJSON();

    const store2 = createTokenStore();
    store2.getState().loadTokens(exported);

    const restoredRefToken = store2.getState().resolvedTokens.find(
      (t) => t.path === 'colors.background.primary',
    );
    expect(restoredRefToken?.reference).toBe('colors.white.100');
    expect(restoredRefToken?.resolvedValue).toBe('#AABBCC');
  });

  it('loadTokens clears dirty files when restoring draft', () => {
    const store = createTokenStore();
    store.getState().loadTokens(sampleTokens);

    store.getState().updateToken('colors.blue.500', '#FF0000');
    expect(store.getState().dirtyFiles.size).toBeGreaterThan(0);

    const exported = store.getState().exportAsJSON();
    store.getState().loadTokens(exported);

    expect(store.getState().dirtyFiles.size).toBe(0);
  });
});
