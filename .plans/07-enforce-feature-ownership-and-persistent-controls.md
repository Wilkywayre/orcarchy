# 07 — Enforce feature ownership and persistent controls

**What to build:** Make Orcarchy's complete ownership model visible and consistent: enabled features follow Omarchy even after manual Orca changes, disabled features remain untouched, and startup restores the user's saved connected, paused, or disconnected state.

**Blocked by:**
- 04 — Synchronize editor and existing terminal colors.
- 05 — Synchronize font families.
- 06 — Synchronize backgrounds.

**Status:** ready-for-agent

- [ ] Master, Colors, Fonts, and Backgrounds controls accurately reflect saved settings, default on for verified supported features, and show unavailable capabilities with reasons.
- [ ] Manual changes within an enabled feature group are reconciled back to Omarchy using supported observation/application mechanisms, without feedback loops or excessive repeated writes.
- [ ] Disabling a feature leaves its current appearance intact and preserves subsequent manual changes across events, recovery, and restarts.
- [ ] Startup distinguishes first activation from an explicit pause or disconnect; it never silently reconnects after an opt-out.
- [ ] Sync now respects enabled features and the connection state. Re-enable/reconnect is explicit and idempotent.
- [ ] Status reports the active theme and meaningful per-feature results; it never reports complete synchronization when a feature failed or is unsupported.
- [ ] Disconnect does not restore a pre-integration theme, font, or background and does not break currently referenced assets.
- [ ] End-to-end tests exercise manual overrides, every toggle, pause/resume, disconnect/reconnect, startup state restoration, and unsupported capability presentation.
