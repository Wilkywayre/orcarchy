# 03 — Follow Omarchy theme changes through owned hooks

**What to build:** An automatically managed Omarchy connection that updates running Orca app colors on theme changes, keeps an owned snapshot current while Orca is closed, and supports safe pause/disconnect and lifecycle cleanup without changing unrelated hooks or restoring old appearance settings.

**Blocked by:** 02 — Install Orcarchy and automatically follow app colors.

**Status:** ready-for-agent

- [ ] Approved first activation idempotently installs a uniquely owned theme-change hook through Omarchy's documented hook mechanism; additional consent is requested only when genuinely required.
- [ ] Theme changes update the running Orca application colors without restarting Orca, starting terminals, or interrupting agents.
- [ ] When Orca is closed, the hook updates only owned integration state/assets and never launches Orca; the next startup reconciles against current Omarchy state.
- [ ] Hook-side and plugin-side state have a versioned, owned contract that does not rely on internal Orca storage locations.
- [ ] Hook processing is bounded, serializes writes, and rereads active state rather than trusting delayed event arguments; errors do not break Omarchy theme switching.
- [ ] Master pause stops both live writes and closed-app processing, persists across startup, and leaves appearance unchanged.
- [ ] Disconnect removes only owned hooks/bridge resources, records a persistent opt-out, and leaves current appearance intact. Reconnecting requires an intentional user action.
- [ ] Disable/uninstall leaves no active appearance writer behind, including after missed deactivation callbacks. Preserve assets still referenced by the current appearance.
- [ ] Tests demonstrate repeated setup/disconnect, preservation of unrelated hooks, closed-app behavior, paused/disconnected startup, lifecycle cleanup, and hook failures.
