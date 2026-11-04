'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { CONTRACT_FILES, readContracts, summarizeContracts } = require('../tools/probe-orca.cjs');

function contracts() {
  return {
    api: {
      PLUGIN_HOST_API_MINOR: 3,
      PLUGIN_HOST_METHOD_NAMES: ['settings.get', 'settings.set'],
      PLUGIN_HOST_API: {
        'settings.get': { summary: 'Reads plugin settings.', scope: 'plugin-private', capability: 'settings:own', surfaces: ['worker'], since: 0 },
        'settings.set': { summary: 'Writes plugin settings.', scope: 'plugin-private', capability: 'settings:own', surfaces: ['worker'], since: 0 },
      },
    },
    major: { PLUGIN_HOST_API_MAJOR: 1 },
    events: { PLUGIN_EVENT_NAMES: ['workspace.changed'] },
    hooks: { PLUGIN_HOOK_NAMES: ['terminal.send'], PLUGIN_HOOK_SINCE: { 'terminal.send': '1.4.248' } },
    actions: { PLUGIN_COMMAND_ALIAS_ACTION_IDS: ['sidebar.left.toggle'] },
    statusBar: { PLUGIN_STATUS_BAR_SINCE: '1.4.248' },
  };
}

test('reports plugin-private settings without presenting them as appearance support', () => {
  const inventory = summarizeContracts(contracts());
  assert.deepEqual(inventory.api, { major: 1, minor: 3 });
  assert.equal(inventory.methods[1].scope, 'plugin-private');
  assert.deepEqual(inventory.appearanceMethodCandidates, []);
  assert.equal(inventory.statusBarMinimumVersion, '1.4.248');
  assert.equal(Object.hasOwn(inventory, 'liveSyncSupported'), false);
});

test('lists new appearance methods only as candidates, not a support verdict', () => {
  const source = contracts();
  source.api.PLUGIN_HOST_METHOD_NAMES.push('appearance.example');
  source.api.PLUGIN_HOST_API['appearance.example'] = {
    summary: 'Synthetic test-only candidate.', scope: 'test-only', surfaces: ['worker'], since: 4,
  };
  const inventory = summarizeContracts(source);
  assert.deepEqual(inventory.appearanceMethodCandidates, ['appearance.example']);
  assert.equal(Object.hasOwn(inventory, 'liveSyncSupported'), false);
});

test('unrecognized declarations fail rather than silently reporting no support', () => {
  const source = contracts();
  source.api.PLUGIN_HOST_METHOD_NAMES = null;
  assert.throws(() => summarizeContracts(source), /must be a string array/);
  const missing = contracts();
  delete missing.api.PLUGIN_HOST_API['settings.get'];
  assert.throws(() => summarizeContracts(missing), /Unrecognized installed method/);
});

test('reads and fingerprints a synthetic installation without writing to it', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orcarchy-probe-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = contracts();
  const before = {};
  for (const [key, relative] of Object.entries(CONTRACT_FILES)) {
    const file = path.join(root, 'app.asar.unpacked/out/shared/plugins', relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const text = `module.exports = ${JSON.stringify(source[key])};\n`;
    fs.writeFileSync(file, text);
    before[file] = text;
  }
  const inventory = readContracts(root);
  assert.equal(inventory.sources.length, Object.keys(CONTRACT_FILES).length);
  assert.ok(inventory.sources.every((entry) => /^[0-9a-f]{64}$/.test(entry.sha256)));
  for (const [file, text] of Object.entries(before)) {
    assert.equal(fs.readFileSync(file, 'utf8'), text);
  }
});

test('missing installation fails with an actionable diagnostic and no output report', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orcarchy-missing-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ['tools/probe-orca.cjs', '--resources', root], {
    cwd: path.join(__dirname, '..'), encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /cannot inventory this installation/);
  assert.deepEqual(fs.readdirSync(root), []);
});

test('CLI help and argument errors do not require an installed Orca', () => {
  const run = (...args) => spawnSync(process.execPath, ['tools/probe-orca.cjs', ...args], {
    cwd: path.join(__dirname, '..'), encoding: 'utf8',
  });
  const help = run('--help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Read-only/);
  const invalid = run('--resources');
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /expected --resources/);
});
