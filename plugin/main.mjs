import { watch } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createSyncController } from './sync-controller.mjs';
import { readPalette } from './read-palette.mjs';

let shutdown = async () => {};

export default async function activate(orca) {
  if (process.platform !== 'linux') {
    orca.log('Omarchy integration is available only on Linux. No appearance settings changed.');
    await orca.host.call('statusBar.update', { id: 'sync', text: 'Orcarchy: unavailable', tone: 'warning', tooltip: 'Omarchy synchronization requires Linux.' });
    return;
  }
  const state = process.env.XDG_STATE_HOME || join(homedir(), '.local/state');
  const current = join(state, 'omarchy/current');
  let watcher = null;
  let timer = null;
  const subscriptions = [];
  const status = (text, tooltip) => orca.host.call('statusBar.update', {
    id: 'sync', text: `Orcarchy: ${text}`, tooltip: tooltip.slice(0, 256),
    tone: text === 'Error' || text === 'Unavailable' ? 'warning' : 'neutral',
  });
  const controller = createSyncController({
    host: orca.host, settings: orca.settings,
    readPalette: (signal) => readPalette(join(current, 'theme/colors.toml'), signal),
    status, log: (message) => orca.log(message),
  });
  const sync = () => controller.sync().catch((error) => orca.log(`Sync status failed: ${error.message}`));
  function watchCurrent() {
    if (watcher) return;
    try {
      watcher = watch(current, { persistent: false }, () => {
        controller.invalidate();
        clearTimeout(timer);
        timer = setTimeout(() => { timer = null; void sync(); }, 150);
      });
      watcher.on('error', (error) => {
        orca.log(`Omarchy watcher stopped: ${error.message}`);
        watcher?.close();
        watcher = null;
      });
    } catch (error) {
      orca.log(`Cannot watch Omarchy state yet: ${error.message}`);
    }
  }
  subscriptions.push(orca.commands.register('orcarchy.sync', () => { watchCurrent(); return sync(); }));
  subscriptions.push(orca.commands.register('orcarchy.disconnect', async () => {
    controller.invalidate();
    await orca.settings.set('enabled', false);
    return sync();
  }));
  subscriptions.push(orca.settings.onDidChange(() => { controller.invalidate(); void sync(); }));
  shutdown = async () => {
    clearTimeout(timer);
    watcher?.close();
    for (const subscription of subscriptions) subscription.dispose();
    await controller.stop();
  };
  orca.log('Development preview: colors only; requires the custom host API. No OS hooks are installed.');
  watchCurrent();
  await sync();
}

export async function deactivate() {
  await shutdown();
  shutdown = async () => {};
}
