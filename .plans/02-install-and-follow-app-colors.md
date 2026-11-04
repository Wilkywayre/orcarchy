# 02 — Install Orcarchy and automatically follow app colors

**What to build:** An actual installable Orca plugin that applies the current Omarchy application colors automatically when approved and enabled, resumes on startup, and exposes its state and master control inside Orca. This is the first production-shaped vertical slice, not a manually generated theme bundle.

**Blocked by:** 01 — Verify supported live integration.

**Status:** in-progress (custom-host preview) — worker/manifest/package and color API adapter are implemented; production registration and live isolated rendering still depend on ticket 01's remaining gate.

**Scope boundary:** This preview targets the locally extended host only and does not declare stock Orca support. Fonts, backgrounds, and OS hooks are explicitly unavailable. No plugin was loaded or approved in the user's running session.

- [ ] Orca can validate and register the installable plugin through its supported workflow, with an appropriate manifest, minimum version, execution profile, and minimal required access.
- [ ] First approval and activation automatically detect Omarchy and apply its current app palette without a separate converter command, manual generated-folder registration, or redundant Connect wizard.
- [ ] Normal startup automatically activates the integration, rereads current Omarchy state, and applies app colors while honoring persisted pause or opt-out state.
- [ ] A default-on master sync control and an accurate Following Omarchy, Paused, Unavailable, or Error status are available through supported plugin UI.
- [x] Basic validation rejects malformed/unreadable input before application and retains the last working appearance; missing Omarchy is reported without substituting an unrelated theme.
- [x] Palette mapping and appearance application remain separate so existing converter behavior can be reused or adapted without making a development checkout or manual Python invocation a user requirement.
- [x] Disclose and package necessary runtime requirements; do not install dependencies silently or bypass Orca's approval flow.
- [ ] Tests cover first activation, subsequent startup, pause persistence, missing Omarchy, invalid input, and failure to apply through the supported adapter.
