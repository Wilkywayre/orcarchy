# Orca appearance-provider extension (merged upstream)

This was a **local source extension**, now merged upstream as
[stablyai/orca#38524](https://github.com/stablyai/orca/pull/38524) and shipped
in stock Orca 1.4.251. This directory retains the original patch and build notes
for the record.

- Base: `edf53846689b6ee9fd356f58f4f432491b456eaa` from `stablyai/orca`.
- Local checkout: `build/orca-source`, branch `orcarchy/appearance-provider`.
- Patch: `orca-appearance-provider.patch`.
- Reproduction metadata, changed files, and SHA-256: `orca-source.json`.
- Upstream source license: `ORCA-LICENSE` (MIT, Lovecast Inc.).

## Implemented source slice

- Worker-only, permissioned `appearance.read` and `appearance.apply` methods.
- Dedicated `appearance:write` consent and host API minor 1.4.
- Strict app/terminal artifact validation and host-bound plugin identities.
- Separate generated appearance snapshots outside installed plugin code.
- Dynamic app/terminal registry overlays and normal settings/content notifications.
- App/editor/terminal slot selection, saved terminal palette refresh, and clearing
  the active slot's manual terminal color overrides while retaining the other slot.
- Conditional revision tokens, including change-away-and-back rejection, call
  cancellation, and revocation while admission waits for mutation auditing.
- Prior snapshot restoration on settings-commit failure; source startup cache reload.
- Native dark/light theme application without changing font size or opacity.
- Regenerated public schemas, references, typings, and authoring skill references.

The result says **published**, not “every renderer has painted.” Isolated live
Electron verification on Linux has now been captured for three themes (see
Validation completed). Fonts, backgrounds, external-hook lifecycle,
and appearance-change subscriptions for manual override ownership are not added
by this initial patch.

## Version boundary

The extension was developed against a provisional **1.4.249** schema floor.
It merged upstream as [#38524](https://github.com/stablyai/orca/pull/38524) and
first shipped in **stock Orca 1.4.251**, which is now the plugin's engine floor.

## Reproduce in a separate source checkout

Use Node 24 and the package manager pinned by Orca. Review the patch first:

```bash
git clone https://github.com/stablyai/orca.git /path/to/separate-orca-source
git -C /path/to/separate-orca-source switch --detach edf53846689b6ee9fd356f58f4f432491b456eaa
git -C /path/to/separate-orca-source switch -c orcarchy/appearance-provider
git -C /path/to/separate-orca-source apply --check /path/to/orcarchy/upstream/orca-appearance-provider.patch
git -C /path/to/separate-orca-source apply /path/to/orcarchy/upstream/orca-appearance-provider.patch
```

From that source checkout:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build:packages
pnpm run tc
ORCA_BACKGROUND_LAUNCH=1 pnpm exec vitest run --config config/vitest.config.ts src/main/plugins/appearance/plugin-appearance.test.ts --maxWorkers=2
ORCA_CLI_BUILD_COMPILER=tsrs node config/scripts/build-cli.mjs
pnpm run build:electron-vite
```

These are developer install/build commands, not instructions to replace an
installed Orca. Native runtime prerequisites for a real Electron launch are
separate from successfully compiling JavaScript assets.

The direct CLI build avoids the unrelated `prepare:cli-output` development alias
installer. The package's full CLI build helper attempted a `/usr/local/bin/orca-dev`
symlink during initial testing, which was denied; no privilege escalation was used.

Package the plugin from the Orcarchy project root:

```bash
python tools/package-plugin.py --output dist/orcarchy
```

The output directory must be new. Validate the bundle using the custom CLI without
loading or approving it:

```bash
node /path/to/separate-orca-source/out/cli/index.js plugin validate /path/to/orcarchy/dist/orcarchy --json
```

Do not register the repository root while the nested source checkout is present:
it includes development files far beyond a plugin's size/file budget. The package
tool copies only runtime files. An eventual Git release also excludes development
checkout/build outputs.

## Validation completed

- 88 targeted source tests across appearance, admission/revocation, registry,
  reconciliation, manifest, generated author typings, command replacements,
  and custom editor contributions.
- Full `pnpm run tc` (all configured typecheck projects).
- Scoped Oxlint and Oxfmt checks for changed source modules.
- Custom CLI build and plugin artifact validation; approval is correctly required.
- Electron/Vite main, preload, and renderer asset build; preload/boot graph checks.
- Patch applies cleanly to reconstructed base files and reproduces all 29 changed
  files byte-for-byte.
- 32 project tests: 21 Node tests and 11 Python tests.
- Isolated live Electron verification on Linux: approved worker applied Tokyo
  Night, Gruvbox, and Catppuccin Latte with app/editor and existing-terminal
  repaint and no restart. See the evidence branch linked from
  [Orca PR #38282](https://github.com/stablyai/orca/pull/38282).
- Upstream discussion: [Orca issue #38277](https://github.com/stablyai/orca/issues/38277),
  proposal [PR #38282](https://github.com/stablyai/orca/pull/38282), merged via
  [#38524](https://github.com/stablyai/orca/pull/38524) and shipped in stock
  Orca 1.4.251.

## Refreshing the exported patch

After modifying the isolated checkout, run from the Orcarchy project root:

```bash
python tools/export-orca-extension.py
```

The exporter includes tracked modifications and newly added extension files,
checks its related-file allowlist, and writes the patch plus pinned source metadata.
It does not stage, commit, push, or apply changes to any other repository.
