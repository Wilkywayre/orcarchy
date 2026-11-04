#!/usr/bin/env node
'use strict';

// Local compatibility experiment. Validates a proposed host-side publication
// against installed Orca schemas; never connects to Orca or applies settings.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareColors } = require('../experiments/appearance-provider/prepare-colors.cjs');

function main(args = process.argv.slice(2)) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('Usage: node tools/verify-appearance-proposal.cjs [--resources <dir>] [--bundle <dir>]');
    console.log('Offline proposed-host contract check only. Does not load plugins or apply settings.');
    return 0;
  }
  const options = { resources: path.join(os.homedir(), '.local/share/stably-orca/resources'), bundle: 'build/orcarchy' };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (!['--resources', '--bundle'].includes(args[i]) || !args[i + 1] || seen.has(key)) {
      console.error('verify-appearance-proposal: expected unique --resources <dir> and/or --bundle <dir>');
      return 2;
    }
    seen.add(key);
    options[key] = args[i + 1];
  }
  try {
    const shared = path.join(path.resolve(options.resources), 'app.asar.unpacked/out/shared');
    const app = require(path.join(shared, 'plugins/artifacts/plugin-theme-artifact.js'));
    const terminal = require(path.join(shared, 'plugins/artifacts/plugin-terminal-theme-artifact.js'));
    const settings = require(path.join(shared, 'plugin-theme-settings.js'));
    const bundle = path.resolve(options.bundle);
    const prepared = prepareColors({
      pluginKey: 'local.orcarchy',
      app: JSON.parse(fs.readFileSync(path.join(bundle, 'themes/app.json'), 'utf8')),
      terminal: JSON.parse(fs.readFileSync(path.join(bundle, 'themes/terminal.json'), 'utf8')),
      current: {},
      parsers: { app: app.parsePluginAppThemeArtifact, terminal: terminal.parsePluginTerminalThemeArtifact },
    });
    if (!app.isPluginThemeRegistration(prepared.appRegistration)
        || !terminal.isPluginTerminalThemeRegistration(prepared.terminalRegistration)) {
      throw new Error('Prepared registry entries do not satisfy installed Orca schemas');
    }
    const normalized = settings.normalizePluginThemeSettings(prepared.settingsUpdate);
    for (const [key, value] of Object.entries(normalized)) {
      if (JSON.stringify(value) !== JSON.stringify(prepared.settingsUpdate[key])) {
        throw new Error(`Installed settings normalization changed proposed ${key}`);
      }
    }
    console.log(JSON.stringify({
      schemaVersion: 1,
      kind: 'offline-proposed-host-contract-check',
      artifactSchemasValid: true,
      registrationSchemasValid: true,
      pluginSettingsNormalizationPreserved: true,
      prepared,
      liveApplied: false,
      limitation: 'Only validates data preparation against installed schemas. A new upstream public API, registry publication, permissions, persistence, lifecycle, and renderer tests are still required.',
    }, null, 2));
    return 0;
  } catch (error) {
    console.error(`verify-appearance-proposal: ${error.message}`);
    return 1;
  }
}

if (require.main === module) process.exitCode = main();
module.exports = { main };
