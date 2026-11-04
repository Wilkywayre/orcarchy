# Live integration compatibility gate

Date: 2026-11-04

**Decision: blocked on upstream Orca interfaces.** The generated static theme
bundle is valid, but Orca's installed public plugin API cannot implement the
approved automatic, installable live integration. Do not start dependent product
tickets by bypassing this gate.

## Tested environment

| Component | Observed value |
| --- | --- |
| Orca desktop and bundled CLI | 1.4.247 |
| Omarchy | 4.0.6-1 |
| Installed public plugin host API | Major 1, minor 3; 26 methods |
| Desktop launcher | `stably-orca` |
| CLI | Bundled `resources/bin/orca-ide`; `orca` is not on PATH |

The desktop entry and running executable identified the installation. The CLI's
version agrees with the installed application package metadata. No application
restart, plugin activation, theme change, hook installation, or user-settings
mutation was performed during this investigation.

### Follow-up: a concrete method forward

Further inspection found released **v1.4.248** resident status-bar workers and an
existing unmerged built-in Omarchy implementation, PR #26268. Neither adds the
missing public appearance application API. An offline color-preparation experiment
now passes installed artifact, registry, and settings-normalization checks for
Starship and synthetic dark/light palettes. It does not apply appearance live.

See [method forward](method-forward.md) for the source-grounded host extension,
the existing PR's limitations, and a publication-ready upstream discussion draft.
The installed 1.4.247 gate remains blocked; the proposed source extension is the
route forward, not a workaround inside today's plugin API.

### Local implementation update

The color extension has now been implemented on an isolated source branch based
on `edf53846689b6ee9fd356f58f4f432491b456eaa`. Its custom host exposes API 1.4
with `appearance.read`/`appearance.apply` and the `appearance:write` capability.
The root Orcarchy plugin uses that facade and packages as a trusted worker.

61 targeted source tests, full source typechecking, scoped lint, the CLI validator,
and the Electron/Vite asset build pass. A reproducible source patch and validation
details are [available in the project](../upstream/README.md). These results do
not change the installed stock application's capabilities and do not prove live
renderer repaint or hook lifecycle. The full product gate remains open.

## Reproduce the inventory

From a trusted development checkout, with Node installed:

```bash
node tools/probe-orca.cjs

# Override the default Linux installation location when necessary.
node tools/probe-orca.cjs --resources /path/to/Orca/resources

node --test tests/probe-orca.test.cjs
PYTHONPATH=src python -m unittest discover -s tests -v
```

The probe reads installed public-contract declarations, loads their Electron-free
exports, and prints the complete public methods, events, hooks, command actions,
version floors, and declaration-file SHA-256 hashes. It invokes only the bundled
CLI's offline version command and Omarchy's version command. It does not connect
to the running desktop or issue appearance writes.

Only point it at a trusted Orca installation: reading the exported registry loads
that installation's JavaScript modules. These installed module locations are
**diagnostic evidence, not supported runtime integration interfaces**. The product
must never import them to gain access to private services.

The probe exits successfully when inventory collection succeeds, even when live
integration is blocked. It deliberately makes no automatic support verdict:
method names alone cannot prove semantics or actual rendering. Unexpected export
shapes fail explicitly rather than silently reporting absent capabilities.

The local generated inventory is in `build/orca-compatibility-inventory.json` and
is excluded from Git because it contains a machine-specific installation path.

## Evidence and assessment

| Requirement | Evidence | Result |
| --- | --- | --- |
| Standard app/editor and terminal theme files | The installed CLI validated the prototype bundle with `valid: true`, no errors, and `local.orcarchy` identity | Static artifact format verified; not live behavior |
| Live global appearance application | The complete installed host-method registry has no global appearance setter or dynamic theme registration method | Blocked |
| Reuse `settings.set` for global appearance | Its declared scope is `plugin-private`; its summary is “Writes one setting the plugin owns.” | Not a global settings interface |
| Apply themes through `commands.run` | Its allowed actions are workspace/tab/sidebar navigation and view controls; none select themes or fonts | Not a workaround |
| Refresh existing terminal palettes | No public palette update/reselection method is exposed; selecting a terminal theme persists a copy of its colors | Blocked; regenerating a JSON file is insufficient |
| Live fonts and backgrounds | No public font-family/background setting methods or runtime asset registration interface is exposed | Blocked |
| Observe manual appearance overrides | Worker events are only `workspace.created`, `workspace.removed`, `agent.status.changed`, and `workspace.changed` | No global appearance-change event for the ownership contract |
| Automatic startup worker | Merely declaring a worker is not an activation guarantee. Installed status-bar and hook declarations have minimum version 1.4.248 | No verified eligible startup mechanism on this 1.4.247 installation |
| Safe bridge disable/uninstall cleanup | No public worker lifecycle hook/event provides the durable external-bridge contract required by the specification | Unverified blocker; optional deactivation is insufficient |
| Theme and font change notifications | Installed Omarchy commands emit `theme-set` and `font-set`; hook installation adds a named file without replacing the whole hook directory | Source contract verified, not installed/tested |
| Independent wallpaper notification | Installed background set/next commands change the active background link but emit no corresponding Omarchy hook | A read-only watcher or upstream wallpaper hook is needed |

Static validation used the CLI's `plugin validate <generated-bundle> --json`
command. It neither loaded nor enabled the plugin. The bundle still requires
manual selection and is explicitly not the approved final product.

### Complete installed host-method set

```text
workspace.readContext    terminal.sendText    notifications.show
storage.get              storage.set          storage.delete
storage.keys             secrets.get          secrets.set
secrets.delete           secrets.protection   settings.get
settings.set             shell.openExternal   files.saveAs
plugin.request           agents.list          events.subscribe
statusBar.update         workspace.list       workspace.open
terminal.create          terminal.read        agent.launch
editor.open              commands.run
```

The installed source explicitly describes this registry as the single source of
truth for the public plugin facade and separates it from raw internal runtime
RPC. Presence in the installed code is not a substitute for version eligibility:
the bundled status-bar and hook schemas both declare a 1.4.248 floor despite the
desktop package identifying as 1.4.247. Do not lower that floor or rely on an
ungated internal implementation.

### Source fingerprints

SHA-256 hashes of the installed declarations used for this decision:

| Declaration | SHA-256 |
| --- | --- |
| Public host API | `b8c4292e233c8890f6bb649785641d5e383bb82bc66eed4b5da3ba3e0b5a5956` |
| Host API major | `413548a934519e173b262f1eb8a3c3a4d82ff0585a310be5621db4786304b071` |
| Worker events | `ae660cdd0118cd9f1f45edfd6c6fcf2c8096ea26a9d602b5beef808f9b15bb00` |
| Plugin hooks | `5359ddecf39cab4a4bce081a72b0265b69141baa2cb8fad798dd32b004457de6` |
| Command actions | `3bc5d6ee2b9a452b6aa7d48cf47b66ef68de18e117fda024be849b734d79ae72` |
| Status-bar contribution | `d13155016973557b7d5e30340915dbb534f4b1a61b5f31ce5d22d7c9ab065eeb` |

## Required upstream contracts

The following are **proposed capabilities, not existing methods or commitments
from Orca**. Exact names and schemas belong in an upstream design review.

1. **Owned runtime appearance resources:** register/update plugin-owned palettes
   and compatible background assets in mutable owned storage, without changing
   installed integrity-checked plugin files. Maintain stable identifiers and
   retain referenced resources when synchronization disconnects.
2. **Supported live read/apply:** read and apply app/editor selections, light/dark
   mode, terminal palettes including existing terminals and saved copies, font
   families, and compatible backgrounds. Scope writes to enabled feature groups;
   preserve font sizes, spacing, zoom, density, and opacity. Return per-feature
   results or provide a transaction so partial failures can be handled honestly.
3. **Appearance observation:** expose versioned change events sufficient to
   reconcile manual overrides without feedback loops. Continue protecting trust
   and approval surfaces from third-party theming.
4. **Explicit startup and external-bridge lifecycle:** provide an approved startup
   activation mechanism and a supported durable enable/disable/uninstall contract
   for owned OS hooks. It must distinguish “desktop closed, sync still enabled”
   from “plugin disabled/uninstalled” even when a worker's deactivation callback
   is missed. Any cleanup/lease design must preserve the closed-app requirement.
5. **Permission and version contract:** expose appropriate appearance access
   controls, machine-readable capability detection, and truthful minimum versions.
   Existing plugin-private settings permission does not authorize global writes.

An upgrade that only enables status-bar or generic worker hooks would not resolve
the missing appearance APIs. Re-run this gate on the target version before changing
the decision. If a required API remains missing, propose the upstream extension
before continuing product implementation. Do not publish issues or modify Orca's
installed/source files without separately authorized upstream work.

## What remains unverified

- Actual installed-plugin startup, disable/uninstall, and crash lifecycle behavior.
- Live application/editor rendering, existing-terminal updates, and light/dark
  transitions: no eligible public application API was found to test them through.
- Registration of generated mutable appearance resources under catalog integrity.
- Real hook execution and cleanup: no user hooks were installed for this gate.
- Font/background application or live UI status: registry/source evidence only.

Ticket 01 is **in progress**, not complete: the host-side color source extension
and worker preview exist, but real isolated rendering and the remaining lifecycle
contracts are unverified. Ticket 02 is an experimental implementation, not a
completed production installation workflow. Do not treat diagnostics, compilation,
or schema validation alone as completion of the full gate.
