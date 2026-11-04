# 09 — Validate and prepare public distribution

**What to build:** A release-ready Orcarchy plugin that a new user can install and operate entirely through Orca, with verified compatibility, safe lifecycle behavior, accurate documentation, and public-distribution metadata prepared without publishing automatically.

**Blocked by:** 08 — Recover safely from failures and rapid changes.

**Status:** ready-for-agent

- [ ] Validate release artifacts with Orca's own plugin validator and record tested Orca/Omarchy versions and minimum supported requirements.
- [ ] Demonstrate clean installation, first approval, automatic setup, startup reconciliation, and live changes without a development checkout, manual converter, or generated-folder registration.
- [ ] Verify real rendering with the user's Starship palette, another dark theme, and a light theme, covering UI, editor/diffs, existing terminals, fonts, and backgrounds where supported.
- [ ] Exercise upgrade, disable, re-enable, disconnect, reconnect, and uninstall without duplicated hooks, active leftover writers, broken retained appearance assets, or changed unrelated settings.
- [ ] Verify runtime dependencies and packaging on a clean supported environment; disclose requirements without installing software silently.
- [ ] Documentation explains automatic ownership, default-on feature controls, preserved readability preferences, permissions, supported APIs, limitations, troubleshooting, and leave-as-is disconnect behavior.
- [ ] Prepare consistent version/license/repository metadata and the release/catalog or marketplace artifacts required for the intended public repository.
- [ ] Confirm no credentials, personal configuration, logs, or machine-specific generated assets are included in distribution.
- [ ] Record reproducible validation evidence and any release-blocking upstream gaps; do not advertise unverified capabilities.
- [ ] Leave publication, tags, pushes, marketplace submission, and changes to the user's installed integration for a separately authorized execution step.
