'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { MAX_THEME_BYTES, prepareColors } = require('../experiments/appearance-provider/prepare-colors.cjs');

// These tests exercise the proposed preparation contract, not the Orca renderer.
// The separate offline verifier runs Orca's actual installed strict validators.
function input(mode = 'dark', current = {}) {
  return {
    pluginKey: 'local.orcarchy',
    app: { base: mode, tokens: { '--background': '#101218', '--foreground': '#eeeeee' } },
    terminal: { mode, terminal: { background: '#101218', foreground: '#eeeeee', red: '#ff7777' } },
    current,
    parsers: { app: JSON.parse, terminal: JSON.parse },
  };
}

test('prepares active color slots and a saved terminal palette together', () => {
  const result = prepareColors(input());
  assert.equal(result.settingsUpdate.theme, 'dark');
  const id = result.appRegistration.id;
  assert.equal(id, 'plugin:local.orcarchy/omarchy-sync-dark');
  assert.equal(result.settingsUpdate.pluginAppThemeDark, id);
  assert.equal(result.settingsUpdate.editorThemeDark, id);
  assert.equal(result.settingsUpdate.terminalThemeDark, id);
  assert.equal(result.settingsUpdate.terminalPluginPalettes[0].id, id);
  assert.deepEqual(result.settingsUpdate.terminalPluginPalettes[0].colors, input().terminal.terminal);
});

test('handles light mode without overwriting the inactive dark selection', () => {
  const id = 'plugin:someone.theme/dark';
  const palette = { id, colors: { background: '#000000', foreground: '#ffffff', red: '#ff0000' } };
  const result = prepareColors(input('light', { terminalThemeDark: id, terminalPluginPalettes: [palette] }));
  assert.equal(result.settingsUpdate.theme, 'light');
  assert.equal(Object.hasOwn(result.settingsUpdate, 'pluginAppThemeDark'), false);
  assert.equal(Object.hasOwn(result.settingsUpdate, 'editorThemeDark'), false);
  assert.equal(Object.hasOwn(result.settingsUpdate, 'terminalThemeDark'), false);
  assert.deepEqual(result.settingsUpdate.terminalPluginPalettes[0], palette);
  assert.equal(result.settingsUpdate.terminalPluginPalettes.length, 2);
});

test('repeated preparation keeps stable identities and content revisions', () => {
  const one = prepareColors(input());
  const two = prepareColors(input('dark', one.settingsUpdate));
  assert.deepEqual(two, one);
  const changed = input();
  changed.app.tokens['--background'] = '#111111';
  const three = prepareColors(changed);
  assert.equal(three.appRegistration.id, one.appRegistration.id);
  assert.notEqual(three.appRegistration.revision, one.appRegistration.revision);
});

test('drops stale saved palettes and deduplicates the inactive slot', () => {
  const kept = { id: 'plugin:other.palette/light', colors: { background: '#ffffff' } };
  const value = input('dark', {
    terminalThemeLight: kept.id,
    terminalPluginPalettes: [kept, kept, { id: 'plugin:stale.palette/unused', colors: {} }],
  });
  assert.equal(prepareColors(value).settingsUpdate.terminalPluginPalettes.length, 2);
});

test('does not mutate source artifacts or current settings', () => {
  const source = input('dark', {
    terminalThemeLight: 'plugin:other.palette/light',
    terminalPluginPalettes: [{ id: 'plugin:other.palette/light', colors: { foreground: '#000000' } }],
  });
  const before = structuredClone({ app: source.app, terminal: source.terminal, current: source.current });
  const result = prepareColors(source);
  result.settingsUpdate.terminalPluginPalettes[0].colors.foreground = '#111111';
  assert.deepEqual({ app: source.app, terminal: source.terminal, current: source.current }, before);
});

test('never prepares font sizes, opacity, agent settings, or arbitrary global writes', () => {
  const result = prepareColors(input('dark', {
    terminalFontSize: 22, terminalBackgroundOpacity: 0.7, appFontFamily: 'Custom', arbitrary: true,
  }));
  assert.deepEqual(Object.keys(result.settingsUpdate).sort(), [
    'editorThemeDark', 'pluginAppThemeDark', 'terminalPluginPalettes',
    'terminalThemeDark', 'terminalUseSeparateLightTheme', 'theme',
  ]);
});

test('refuses mismatched modes and unowned background assets', () => {
  const mismatch = input();
  mismatch.terminal.mode = 'light';
  assert.throws(() => prepareColors(mismatch), /modes must/);
  const image = input();
  image.app.background = { path: '/unowned/image.png' };
  assert.throws(() => prepareColors(image), /separately validated owned asset/);
});

test('bounds artifact sizes and validates the host-provided plugin identity', () => {
  const large = input();
  large.app.extra = 'x'.repeat(MAX_THEME_BYTES);
  assert.throws(() => prepareColors(large), /size limit/);
  for (const key of ['../escape', 'plugin:local.orcarchy', '', null]) {
    const source = input();
    source.pluginKey = key;
    assert.throws(() => prepareColors(source), /host-authenticated/);
  }
});

test('asks injected artifact validators for strict validation before preparing writes', () => {
  const source = input();
  const calls = [];
  source.parsers = {
    app: (raw, strictness) => { calls.push(['app', strictness]); return JSON.parse(raw); },
    terminal: () => { throw new Error('invalid terminal artifact'); },
  };
  assert.throws(() => prepareColors(source), /invalid terminal/);
  assert.deepEqual(calls, [['app', 'strict']]);
  assert.deepEqual(source.current, {});
});
