import { describe, expect, it, vi } from 'vitest';

let appPath = '';
vi.mock('@nativescript/core', async (original) => ({
  ...(await original<object>()),
  knownFolders: { currentApp: () => ({ path: appPath }) },
}));

const { windowsAppFile } = await import('./style');

describe('windowsAppFile', () => {
  it('resolves ~/ in the app folder core reports', () => {
    appPath = 'C:\\pkg\\bin\\app';
    expect(windowsAppFile('~/assets/logo.webp')).toBe('C:\\pkg\\bin\\app\\assets\\logo.webp');
  });

  it('adds the app folder when core reports the package root', () => {
    appPath = 'C:\\pkg\\bin';
    expect(windowsAppFile('~/assets/logo.webp')).toBe('C:\\pkg\\bin\\app\\assets\\logo.webp');
  });

  it('leaves other sources alone', () => {
    appPath = 'C:\\pkg\\bin\\app';
    expect(windowsAppFile('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(windowsAppFile('C:\\images\\a.png')).toBe('C:\\images\\a.png');
  });
});
