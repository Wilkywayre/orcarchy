# 06 — Synchronize backgrounds

**What to build:** Follow the active Omarchy wallpaper inside Orca through supported background interfaces, including wallpaper-only changes, with an independent default-on Backgrounds toggle and without changing opacity or layout.

**Blocked by:** 03 — Follow Omarchy theme changes through owned hooks.

**Status:** ready-for-agent

- [ ] A default-on Backgrounds toggle is honored on first activation, live events, closed-app processing, and startup reconciliation.
- [ ] Theme-driven and independent wallpaper changes both update the background. Prefer documented events; justify any supported read-only watcher required to fill an event gap.
- [ ] Images are validated against Orca's supported dimensions, format, size, and asset restrictions before application; any conversion or copying is deterministic and restricted to owned assets.
- [ ] Do not mutate source wallpapers, expose arbitrary local files, or modify integrity-checked installed plugin contents.
- [ ] Opacity, transparency, density, and layout remain unchanged; if existing preferences hide the background, explain that condition without overriding them.
- [ ] Invalid, missing, or oversized images preserve the last working background and produce a non-disruptive diagnostic.
- [ ] Disconnect leaves the current appearance usable; cleanup retains referenced assets and removes only safely unreferenced owned resources.
- [ ] Tests cover theme and wallpaper-only events, closed-app startup, disabled Backgrounds, invalid images, preserved opacity, and safe asset lifecycle.
