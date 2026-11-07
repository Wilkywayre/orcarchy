import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSyncController } from '../plugin/sync-controller.mjs';
import { readPalette } from '../plugin/read-palette.mjs';
import { fileURLToPath } from 'node:url';

function harness(options = {}) {
  const calls = [];
  const statuses = [];
  let preferences = { enabled: true, colors: true };
  const controller = createSyncController({
    settings: { get: async () => preferences },
    host: {
      has: () => options.supported !== false,
      call: async (method, params) => {
        calls.push({ method, params });
        return method === 'appearance.read' ? { revision: 'host-revision' } : { delivery: 'published' };
      },
    },
    readPalette: options.readPalette || (async () => ({ app: 'app-json', terminal: 'terminal-json' })),
    status: async (text, tooltip) => statuses.push({ text, tooltip }),
    log: () => {},
  });
  return { controller, calls, statuses, setPreferences: (next) => { preferences = next; controller.invalidate(); } };
}

test('startup sync reads a revision and publishes colors through the public facade', async () => {
  const h = harness();
  await h.controller.sync();
  assert.deepEqual(h.calls, [
    { method: 'appearance.read', params: {} },
    { method: 'appearance.apply', params: { expectedRevision: 'host-revision', app: 'app-json', terminal: 'terminal-json' } },
  ]);
  assert.equal(h.statuses.at(-1).text, 'Colors published');
  await h.controller.stop();
});

test('unsupported hosts are reported without attempting a private fallback', async () => {
  const h = harness({ supported: false });
  await h.controller.sync();
  assert.deepEqual(h.calls, []);
  assert.equal(h.statuses.at(-1).text, 'Unavailable');
});

test('master and Colors opt-outs leave appearance untouched', async () => {
  const h = harness();
  h.setPreferences({ enabled: false, colors: true });
  await h.controller.sync();
  h.setPreferences({ enabled: true, colors: false });
  await h.controller.sync();
  assert.deepEqual(h.calls, []);
  assert.equal(h.statuses.at(-1).text, 'Paused');
});

test('a conversion completing after pause or disconnect cannot publish stale colors', async () => {
  let release;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  const waiting = new Promise((resolve) => { release = resolve; });
  const h = harness({ readPalette: async () => { entered(); await waiting; return { app: 'old', terminal: 'old' }; } });
  const first = h.controller.sync();
  await started;
  h.setPreferences({ enabled: false, colors: true });
  const paused = h.controller.sync();
  release();
  await Promise.all([first, paused]);
  assert.deepEqual(h.calls, []);
  assert.equal(h.statuses.at(-1).text, 'Paused');
});

test('conversion failure retains host colors and exposes an error', async () => {
  const h = harness({ readPalette: async () => { throw new Error('Invalid palette'); } });
  await h.controller.sync();
  assert.deepEqual(h.calls, []);
  assert.equal(h.statuses.at(-1).text, 'Error');
  assert.equal(h.statuses.at(-1).tooltip, 'Invalid palette');
});

test('the worker bridge converts a real light palette without installation or generated files', async () => {
  const palette = fileURLToPath(new URL('./fixtures/light.toml', import.meta.url));
  const result = await readPalette(palette);
  assert.equal(JSON.parse(result.app).base, 'light');
  assert.equal(JSON.parse(result.terminal).terminal.background, '#fafafa');
});

test('the packaged bridge writes no bytecode next to the shipped sources', async (t) => {
  const { mkdtemp, rm, readdir, cp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const root = await mkdtemp(join(tmpdir(), 'orcarchy-bytecode-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const here = fileURLToPath(new URL('..', import.meta.url));
  const noBytecode = (src, dest) => !dest.includes('__pycache__');
  await cp(join(here, 'plugin'), join(root, 'plugin'), { recursive: true, filter: noBytecode });
  await cp(join(here, 'src'), join(root, 'src'), { recursive: true, filter: noBytecode });
  const { readPalette: packaged } = await import(pathToFileURL(join(root, 'plugin/read-palette.mjs')).href);
  const palette = fileURLToPath(new URL('./fixtures/light.toml', import.meta.url));
  const result = await packaged(palette);
  assert.equal(JSON.parse(result.app).base, 'light');
  const entries = await readdir(join(root, 'src'), { recursive: true });
  assert.deepEqual(entries.filter((entry) => entry.includes('__pycache__')), []);
});
