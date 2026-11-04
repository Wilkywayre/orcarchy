# 05 — Synchronize font families

**What to build:** Follow applicable Omarchy font-family changes automatically in Orca, with a default-on Fonts toggle, live event handling, closed-app reconciliation, and no changes to font sizes or layout preferences.

**Blocked by:** 03 — Follow Omarchy theme changes through owned hooks.

**Status:** ready-for-agent

- [ ] Inspect Omarchy's actual font roles and map terminal, editor, UI, and chat families only where a meaningful source and a supported destination exist; do not blindly assign a terminal font to every UI role.
- [ ] A default-on Fonts toggle controls this feature independently and is honored by plugin and bridge processing.
- [ ] Documented font-change hooks trigger live updates; first activation and each startup reconcile current font families, including changes made while Orca was closed.
- [ ] Font sizes, line-height, spacing, density, zoom, opacity, and unrelated preferences remain unchanged.
- [ ] Missing fonts, unsupported roles, and unavailable APIs preserve current values and produce a clear feature-specific diagnostic rather than silently claiming success.
- [ ] Font hooks follow the existing ownership, bounded execution, pause, disconnect, disable, and uninstall contracts.
- [ ] Tests cover source-to-role mapping, font-change events, closed-app startup, independent toggle behavior, missing fonts, and preservation of readability settings.
