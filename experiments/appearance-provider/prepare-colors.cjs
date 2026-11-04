'use strict';

// Proposed host-side preparation logic, NOT an existing Orca API or plugin adapter.
// A real host would obtain pluginKey from its authenticated call context.
const { createHash } = require('node:crypto');

const KEY = /^[a-z0-9][a-z0-9-]{0,63}\.[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_THEME_BYTES = 16 * 1024;

function parseBounded(document, parse, label) {
  const text = JSON.stringify(document);
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_THEME_BYTES) {
    throw new Error(`${label} exceeds the theme artifact size limit`);
  }
  return parse(text, 'strict');
}

function prepareColors({ pluginKey, app, terminal, current, parsers }) {
  if (typeof pluginKey !== 'string' || !KEY.test(pluginKey)) {
    throw new Error('A host-authenticated qualified plugin identity is required');
  }
  const appTheme = parseBounded(app, parsers.app, 'App theme');
  const terminalTheme = parseBounded(terminal, parsers.terminal, 'Terminal theme');
  if (!['dark', 'light'].includes(appTheme.base) || terminalTheme.mode !== appTheme.base) {
    throw new Error('App and terminal modes must both be dark or both be light');
  }
  if (appTheme.background) {
    throw new Error('Backgrounds require a separately validated owned asset contract');
  }

  const mode = appTheme.base;
  const slot = mode === 'dark' ? 'Dark' : 'Light';
  const id = `plugin:${pluginKey}/omarchy-sync-${mode}`;
  const revision = createHash('sha256')
    .update(JSON.stringify({ app: appTheme, terminal: terminalTheme }))
    .digest('hex').slice(0, 32);
  const appRegistration = {
    ...appTheme, id, revision, pluginKey, pluginName: 'Orcarchy', label: `Omarchy Sync (${mode})`,
  };
  const terminalRegistration = {
    ...terminalTheme, id, pluginKey, pluginName: 'Orcarchy', label: `Omarchy Sync (${mode})`,
  };

  // Preserve the inactive slot's saved palette. Orca permits at most two selected
  // plugin palettes, so unrelated or no-longer-selected cache entries are omitted.
  const selectedIds = new Set([
    slot === 'Dark' ? id : current.terminalThemeDark,
    slot === 'Light' ? id : current.terminalThemeLight,
  ].filter((value) => typeof value === 'string'));
  const kept = [];
  const seen = new Set([id]);
  for (const entry of current.terminalPluginPalettes ?? []) {
    if (entry && selectedIds.has(entry.id) && !seen.has(entry.id)) {
      kept.push(structuredClone(entry));
      seen.add(entry.id);
    }
  }
  const settingsUpdate = {
    theme: mode,
    [`pluginAppTheme${slot}`]: id,
    [`editorTheme${slot}`]: id,
    [`terminalTheme${slot}`]: id,
    terminalUseSeparateLightTheme: true,
    terminalPluginPalettes: [
      ...kept,
      { id, colors: structuredClone(terminalTheme.terminal) },
    ],
  };

  return { appRegistration, terminalRegistration, settingsUpdate };
}

module.exports = { MAX_THEME_BYTES, prepareColors };
