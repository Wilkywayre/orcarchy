# Architecture

## Product gate

The design below describes the **existing converter prototype**, not the selected
production architecture. The approved product is an installable Orca plugin with
automatic startup/live synchronization, owned Omarchy hooks, and colors/fonts/
backgrounds controls. It must not require users to register a generated folder.

The installed Orca 1.4.247 lacks required public live-appearance interfaces.
See [the compatibility report](compatibility.md) before starting dependent tickets.
Do not convert the prototype into a private-settings or file-reloading workaround.

The first custom-host color slice is now implemented: the source patch under
`upstream/` adds a permissioned facade and generated-resource registry, and the
root plugin manifest registers an actual resident worker using that facade.
The worker invokes the packaged converter privately and never changes installed
plugin files. See [source/build validation](../upstream/README.md). Hooks, font/
background application, and live renderer proof remain open.

## Boundaries

```text
Omarchy colors.toml
        ↓
palette.py — parse data, normalize colors, validate contrast and mode
        ↓
themes.py — pure application/editor/terminal conversion and manifest
        ↓
cli.py — preview JSON or write a new local plugin bundle
        ↓
Orca content-only theme plugin (installation not yet integrated)
```

Python's standard library is sufficient for TOML, JSON, paths, and tests.
No background service, Node runtime, worker plugin, or network access is needed
to generate a bundle. Only packaging an optional editable install needs build
tooling.

## Palette contract

`background` and `foreground` are required opaque six-digit RGB hex colors with
at least 4.5:1 contrast. `mode` may be `dark` or `light`; when missing, infer it
by comparing background and foreground luminance. Recognized optional colors
are validated; unrelated metadata is ignored.

The initial surface mapping uses `lighter_background` for panels and sidebars,
`selection` for selected fills, and `accent` for primary controls. Text uses
the source foreground when legible, otherwise black or white. Syntax colors
must reach 3:1 against the editor canvas. This is a baseline, not a final visual
tuning for every Omarchy palette. Diffs currently retain Orca's default colors.

Stable app and terminal contribution IDs are both `omarchy-sync`, in their
respective families. The app document uses the source mode. Dual-slot behavior
must be resolved before shipping cross-mode synchronization.

## Next integration milestone

1. Identify the installed Orca version and supported local-plugin workflow.
2. Validate generated documents with Orca's own plugin validator and inspect
   Starship, another dark palette, and a light palette visually.
3. Determine app-theme reload and terminal palette re-selection behavior.
4. Implement staged, validated updates that preserve the last working bundle.
5. Add an explicit installer/uninstaller and dedicated user `theme-set.d` hook,
   preserving existing hooks and unrelated settings. Serialize concurrent syncs
   and reread the active palette to avoid stale theme-change events.
6. Verify operation with Orca open and closed, malformed/missing inputs, and
   repeated theme changes. Never automatically restart Orca.

Fonts, wallpapers, and custom icon themes are outside the initial scope.

## Upstream contracts

References consulted on 2026-11-04 (upstream `main` can change):

- [Manifest format 2](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-manifest.md)
- [Theme files, contrast rules, terminal persistence](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-themes.md)
- [Public application tokens](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-theme-tokens.md)

The generated manifest uses `execution: data`, omits the deprecated publisher
field, and requires Orca >=1.4.246. Orca derives publisher identity from the GitHub
owner for Git installs and uses `local` for folder installs. No public registry
release or marketplace listing is configured yet.
