# 08 — Recover safely from failures and rapid changes

**What to build:** Demonstrate that Orcarchy converges on the latest active Omarchy appearance under rapid events, partial failures, and restarts while preserving working settings, respecting disabled features, and keeping both applications responsive.

**Blocked by:** 07 — Enforce feature ownership and persistent controls.

**Status:** ready-for-agent

- [ ] Stage and validate updates before activation; parse, conversion, permission, and application failures preserve the last working state for affected features.
- [ ] Coalesce concurrent changes and serialize updates so current Omarchy state wins over delayed theme, font, or background events.
- [ ] Use supported transaction boundaries where available; otherwise report partial application accurately and retry only failed enabled features.
- [ ] Bounded retries recover from temporarily unavailable Orca APIs or worker/bridge interruptions without restarting Orca, blocking Omarchy hooks, or launching agent sessions.
- [ ] Disabling or disconnecting during an in-flight update prevents stale work from applying or recreating owned hooks afterward.
- [ ] Missing/partially specified/low-contrast palettes, missing fonts, invalid images, and permission failures produce useful per-feature diagnostics without notification or log floods.
- [ ] Recovery never overwrites unrelated settings, executes theme-provided scripts, edits packaged Omarchy resources, or cleans up unfamiliar files.
- [ ] Failure-injection and concurrency tests demonstrate latest-state convergence, last-working-state preservation, crash recovery, and correct pause/disconnect behavior.
