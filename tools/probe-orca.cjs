#!/usr/bin/env node
'use strict';

// Developer diagnostic only. Reads the installed public-contract declarations;
// none of these installed module paths are an application integration interface.
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CONTRACT_FILES = Object.freeze({
  api: 'workers/plugin-host-api.js',
  major: 'workers/plugin-host-api-major.js',
  events: 'contributions/plugin-event-contribution.js',
  hooks: 'contributions/plugin-hook-contribution.js',
  actions: 'contributions/plugin-command-actions.js',
  statusBar: 'contributions/plugin-status-bar-item-contribution.js',
});

function stringArray(value, label) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Unrecognized installed contract: ${label} must be a string array`);
  }
  return [...value];
}

function summarizeContracts(contracts) {
  const { api, major, events, hooks, actions, statusBar } = contracts;
  const names = stringArray(api.PLUGIN_HOST_METHOD_NAMES, 'host methods');
  if (!api.PLUGIN_HOST_API || !Number.isInteger(api.PLUGIN_HOST_API_MINOR)
      || !Number.isInteger(major.PLUGIN_HOST_API_MAJOR)) {
    throw new Error('Unrecognized installed host API declaration');
  }
  const methods = names.map((name) => {
    const spec = api.PLUGIN_HOST_API[name];
    if (!spec || typeof spec.summary !== 'string' || typeof spec.scope !== 'string') {
      throw new Error(`Unrecognized installed method declaration: ${name}`);
    }
    return {
      name,
      summary: spec.summary,
      scope: spec.scope,
      capability: spec.capability,
      surfaces: stringArray(spec.surfaces, `${name} surfaces`),
      sinceMinor: spec.since,
    };
  });
  return {
    api: { major: major.PLUGIN_HOST_API_MAJOR, minor: api.PLUGIN_HOST_API_MINOR },
    methods,
    events: stringArray(events.PLUGIN_EVENT_NAMES, 'events'),
    hooks: stringArray(hooks.PLUGIN_HOOK_NAMES, 'hooks'),
    hookMinimumVersions: hooks.PLUGIN_HOOK_SINCE,
    commandActions: stringArray(actions.PLUGIN_COMMAND_ALIAS_ACTION_IDS, 'command actions'),
    statusBarMinimumVersion: statusBar.PLUGIN_STATUS_BAR_SINCE,
    // Candidate names are a reading aid, never proof of support or its absence.
    appearanceMethodCandidates: names.filter((name) => /appearance|theme|font|background/i.test(name)),
  };
}

function readContracts(resources) {
  const root = path.join(resources, 'app.asar.unpacked/out/shared/plugins');
  const contracts = {};
  const sources = [];
  for (const [key, relative] of Object.entries(CONTRACT_FILES)) {
    const file = path.join(root, relative);
    const bytes = fs.readFileSync(file);
    contracts[key] = require(file);
    sources.push({
      path: path.relative(resources, file),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    });
  }
  return { ...summarizeContracts(contracts), sources };
}

function commandVersion(executable) {
  const result = spawnSync(executable, ['--version'], {
    encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    return { available: false, reason: result.error?.message || `exit ${result.status}` };
  }
  return { available: true, value: result.stdout.trim() };
}

function omarchyVersion() {
  const result = spawnSync('omarchy', ['version'], {
    encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    return { available: false, reason: result.error?.message || `exit ${result.status}` };
  }
  return { available: true, value: result.stdout.trim() };
}

function main(args = process.argv.slice(2)) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: node tools/probe-orca.cjs [--resources <installed-resources-directory>]');
    console.log('Read-only developer inventory. Loads declarations from a trusted installed Orca.');
    console.log('Does not launch the desktop, load/enable a plugin, install hooks, or apply settings.');
    return 0;
  }
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--resources')) {
    console.error('probe-orca: expected --resources <installed-resources-directory> or --help');
    return 2;
  }
  const resources = path.resolve(args[1] || path.join(os.homedir(), '.local/share/stably-orca/resources'));
  try {
    const inventory = readContracts(resources);
    console.log(JSON.stringify({
      schemaVersion: 1,
      kind: 'installed-public-contract-inventory',
      resources,
      orcaVersion: commandVersion(path.join(resources, 'bin/orca-ide')),
      omarchyVersion: omarchyVersion(),
      ...inventory,
      limitation: 'Source inventory only. API presence is not runtime proof; this command does not certify live-sync compatibility.',
    }, null, 2));
    return 0;
  } catch (error) {
    console.error(`probe-orca: cannot inventory this installation: ${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { CONTRACT_FILES, main, readContracts, summarizeContracts };
