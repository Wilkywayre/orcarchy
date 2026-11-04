export function createSyncController({ host, settings, readPalette, status, log }) {
  let generation = 0;
  let pending = Promise.resolve();
  let active = null;
  let stopped = false;

  function invalidate() {
    generation += 1;
    active?.abort();
  }

  async function run(epoch) {
    if (stopped || epoch !== generation) return;
    const controller = new AbortController();
    active = controller;
    const current = () => !stopped && epoch === generation && !controller.signal.aborted;
    try {
      const preferences = await settings.get();
      if (!current()) return;
      if (preferences.enabled === false || preferences.colors === false) {
        await status('Paused', 'Color synchronization is disabled. Current appearance is unchanged.');
        return;
      }
      if (!host.has('appearance.read') || !host.has('appearance.apply')) {
        await status('Unavailable', 'This preview requires the Orcarchy appearance-provider Orca source extension.');
        return;
      }
      const palette = await readPalette(controller.signal);
      if (!current()) return;
      const revision = await host.call('appearance.read', {}, { signal: controller.signal });
      if (!current()) return;
      await host.call('appearance.apply', { ...palette, expectedRevision: revision.revision }, { signal: controller.signal });
      if (!current()) return;
      await status('Colors published', 'App/editor/terminal update published. Fonts, backgrounds, and closed-app hooks are not implemented in this development preview.');
    } catch (error) {
      if (!current()) return;
      log(`Synchronization failed: ${error.message}`);
      await status('Error', error.code === 'ENOENT'
        ? 'Missing Omarchy palette or Python 3.11+. Current colors are retained.'
        : error.message);
    } finally {
      if (active === controller) active = null;
    }
  }

  return {
    sync() {
      if (stopped) return pending;
      invalidate();
      const epoch = generation;
      pending = pending.catch(() => {}).then(() => run(epoch));
      return pending;
    },
    invalidate,
    async stop() {
      stopped = true;
      invalidate();
      await pending.catch(() => {});
    },
  };
}
