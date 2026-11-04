# Orcarchy development preview

Automatically follows Omarchy colors when approved in a compatible Orca host.

**Requires the experimental Orcarchy appearance-provider source extension. It
does not work in stock Orca.** The experimental schema uses a 1.4.249 minimum;
that number is not a claim that a stock 1.4.249 release includes this API.

## Requirements and permissions

- Linux with Omarchy and Python 3.11+ available as `python3`.
- A custom source-built Orca exposing `appearance.read` and `appearance.apply`.
- Approve the trusted worker, plugin-private settings, and appearance-write access
  through Orca's normal review flow. The worker has full machine access; review it.

The plugin starts automatically via its status-bar item. It reads the active
palette, converts it without writing generated theme files, and publishes app,
editor, and terminal colors through the new public facade. It rereads current
Omarchy state on every startup and watches the stable parent of the active theme
directory while open.

Automatic synchronization and Colors default on. Turn either off to stop color
writes. “Disconnect” persists the master opt-out and keeps the current appearance;
turn Automatic synchronization back on intentionally to resume. “Sync now” respects
the opt-out. No manual converter command is needed during normal use.

## Explicit preview limitations

- No OS hooks are installed yet. Changes while closed are picked up on startup,
  not pre-rendered into a closed-app snapshot by an Omarchy hook.
- Font/background controls record the requested defaults but are explicitly
  unavailable; no font, wallpaper, size, layout, or opacity setting is changed.
- The host reports publication, not acknowledgement from every existing terminal
  or renderer. Live rendering still needs isolated Electron validation.
- Automatic reconciliation of manual Orca overrides is not implemented yet.
- Complete durable hook ownership/cleanup and frozen resources on uninstall remain
  future host work; do not treat this preview as release-ready.
- A watcher error is logged; Sync now retries watcher registration. No hidden
  background service or automatic application restart is used.

Do not load this preview into a normal Orca profile to bypass these limitations.
Use an explicitly approved, isolated development profile once the host build has
passed the required validation.
