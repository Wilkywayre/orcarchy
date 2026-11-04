# 04 — Synchronize editor and existing terminal colors

**What to build:** Complete the Colors feature so one Omarchy theme change updates Orca's application, editor, and already-running terminals together, including light/dark transitions and startup reconciliation, without manual theme re-selection.

**Blocked by:** 03 — Follow Omarchy theme changes through owned hooks.

**Status:** ready-for-agent

- [ ] App, editor, and terminal colors are governed by one default-on Colors toggle that is honored by startup and hook-side processing.
- [ ] Editor surfaces, syntax, selections, and diff colors follow the active palette through public theme contracts, preserving stable theme identities.
- [ ] Existing and newly created terminals receive foreground/background, cursor, selection, and all 16 ANSI colors through a supported live update mechanism.
- [ ] Tests prove that updating theme files alone is not mistaken for updating Orca's persisted selected terminal palette.
- [ ] Dark-to-light and light-to-dark changes select the correct application and editor slots without user re-selection or restart.
- [ ] Chat colors follow supported app or terminal-match behavior where applicable; Orca's protected trust/approval surfaces remain unchanged.
- [ ] Generated app/editor text and surfaces meet documented contrast limits; source terminal ANSI values are preserved unless Orca's supported renderer applies its own correction.
- [ ] Automated mapping/application tests and an Orca rendering check cover startup, live updates, existing terminals, disabled Colors, and cross-mode transitions.
