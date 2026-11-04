# Method forward: a plugin-backed live appearance provider

Date: 2026-11-04
Decision: preserve the plugin product; implement the missing host extension in
Orca source, not by modifying installed binaries or writing private settings.

Implementation update: the first color slice is implemented and tested locally
on source base `edf53846689b6ee9fd356f58f4f432491b456eaa`. The root manifest now
declares a real worker, and `upstream/` retains the reproducible host patch. See
[build and validation evidence](../upstream/README.md). The proposals below explain
the architecture; only the initial color facade is implemented, not fonts,
background assets, external-hook lifecycle, or live renderer acknowledgement.

**This is an actionable extension design and offline data-path proof, not a claim
that today's stock Orca can already run the integration.** No desktop update,
plugin activation, hook installation, or upstream publication has been performed.

## What changed after the first compatibility investigation

1. [Orca v1.4.248](https://github.com/stablyai/orca/releases/tag/v1.4.248) is
   available. Its release notes and source confirm enabled status-bar plugins
   keep workers running. A useful Orcarchy status item gives the worker a
   documented startup/residency mechanism. We do not need to invent a new generic
   startup API for that version. This machine still runs 1.4.247.
2. The release's public host API still has no appearance application method.
   Upgrading alone therefore does not resolve live synchronization.
3. The existing [Omarchy issue #26266](https://github.com/stablyai/orca/issues/26266)
   has a corresponding [implementation PR #26268](https://github.com/stablyai/orca/pull/26268).
   Its author reports live Linux UI/editor/terminal switching with tests and visual
   evidence. Those are the author's results, not tests reproduced in this repo.
4. PR #26268 is open, unmerged, and reported non-mergeable with conflicts at the
   time of inspection. Its head is
   `87ad0a6cf8cc6489ac3ba6f08d95b1237bbf8e8f` in `sonlndv/orcachy`.
5. The PR implements a built-in option, manual template installation, and colors
   only. It explicitly excludes UI fonts. It does not supply the installable,
   automatic, individually controllable plugin requested for Orcarchy.

Recommendation: coordinate with that existing work rather than open a duplicate
Omarchy feature issue or silently replace this project's plugin architecture.

## The concrete architecture

```text
Orcarchy installed in Orca
  ├─ documented resident worker (1.4.248+), status item, feature controls
  ├─ reads effective Omarchy state and maps enabled features
  ├─ manages approved, owned theme/font hooks and wallpaper observation
  └─ calls a NEW public, permissioned appearance-provider API
              ↓
Orca host extension
  ├─ validates artifacts and resolves authenticated plugin ownership
  ├─ stores mutable generated resources outside installed plugin code
  ├─ publishes theme registries and settings through existing host services
  ├─ refreshes existing terminals and notifies rendering windows
  └─ revokes writes and manages hook lifecycle independently of worker callbacks
```

The app's normal internals are used **inside a reviewed Orca source change**.
The third-party plugin never imports these internals, injects code into a renderer,
or opens a private RPC channel. After the extension lands, the plugin consumes
only the newly documented facade and capability checks.

## First host-side vertical slice: live colors

Add a proposed public `appearance.apply` method for approved workers, guarded by
a new proposed `appearance:write` capability. These names do not exist today and
must be reviewed upstream; do not add calls to them in a shipping plugin yet.

Initial input contract:

- One app-theme document and one terminal-theme document using existing public
  artifact shapes and byte limits, both in the same explicit light/dark mode.
- A bounded revision/concurrency token issued by the host; stale or revoked calls
  cannot commit after a newer update, pause, or disable operation.
- No caller-supplied publisher identity, arbitrary global-settings dictionary,
  CSS injection, executable path, shell command, or unvalidated asset path.

Initial output contract:

- Stable host-qualified app/terminal identities and the committed content revision.
- Per-surface publication/application results. Never report live terminals updated
  merely because settings were persisted or a theme registry changed.
- An explicit unsupported/unavailable result on a host without the required
  desktop services. No fallback to private RPC or manual UI automation.

Host transaction:

1. Check approval, the new permission, call cancellation, and the current generation.
2. Parse both artifacts strictly with existing Orca parsers before any write.
3. Derive stable per-owner, per-mode identities. Stage mutable resources outside
   the integrity-checked plugin directory.
4. Publish the app and terminal registrations as an owned dynamic registry layer.
   Preserve static registry integrity checks; do not add general-purpose mutation
   methods usable to overwrite another plugin's contributions.
5. Select the active app/editor/terminal slots together and update the saved
   terminal palette copy. Retain the inactive slot and only selected palette caches.
6. Use Orca's normal settings notification path and its content-pack change event;
   both settings and registry consumers need the new revision.
7. Revalidate approval/generation after awaited work and before publication. Roll
   back a failed staged publication or return accurate partial results.
8. Prove existing terminal repaint and Monaco refresh in renderer tests and a real
   app run. If existing settings propagation is insufficient, fix that host path
   in the same source slice, not by restarting the user's application.

The new API does not relax protected trust/approval colors or contrast rules.

## Offline proof already implemented

The reference preparation function in `experiments/appearance-provider/prepare-colors.cjs`:

- Strictly validates bounded artifacts through injected host parsers.
- Produces stable app/terminal registration identities and content revisions.
- Prepares an allowlisted app/editor/terminal settings update, including the saved
  terminal colors—not merely an edited theme JSON file.
- Preserves the inactive terminal slot, discards stale palette caches, and keeps
  the selected palette cache within Orca's two-slot model.
- Does not mutate source settings, touch sizes/opacity, or accept background paths.

The offline verification tool uses the **actual installed Orca artifact parsers,
registration validators, and plugin-theme settings normalizer**. Starship and the
synthetic dark/light palettes all pass these checks.

```bash
node tools/verify-appearance-proposal.cjs --bundle build/orcarchy
node --test tests/appearance-provider.test.cjs tests/probe-orca.test.cjs
```

This verifies that the proposed color publication fits existing host data models.
It does **not** implement `appearance.apply`, dynamic registry publication,
persistence/rollback, permission checks, UI repaint, or OS-hook cleanup. The
verification tool explicitly reports `liveApplied: false`. Passing it does not
resolve ticket 01's runtime gate.

## Source integration points

Inspected Orca main commit:
`129999a4a71a90d3a979dcc3dad60592ec3ea89d`.
Use immutable source links when reviewing; rebase/revalidate before patching.

| Concern | Existing source seam | Required change |
| --- | --- | --- |
| Public method schemas | `src/shared/plugins/workers/plugin-host-api.ts` | Add strict appearance request/result specs and an additive API minor |
| Permission/consent | `src/shared/plugins/capabilities/plugin-capabilities.ts` | Add scoped appearance access and new version/approval metadata |
| Validated method binding | `src/main/plugins/workers/plugin-host-method-bindings.ts` | Bind the new method to a host-owned appearance service, with call-scope revocation |
| Desktop service plumbing | `src/main/plugins/plugin-service-options.ts`, host service bindings, and `src/main/startup/main-process-plugins.ts` | Supply the appearance service from desktop main, unavailable in unsupported headless contexts |
| Color artifact validation | `src/shared/plugins/artifacts/plugin-theme-artifact.ts` and `plugin-terminal-theme-artifact.ts` | Reuse strict parsers and registration models rather than introducing arbitrary CSS |
| Dynamic theme publication | `src/main/plugins/contributions/plugin-theme-registries.ts` and `plugin-content-pack-registry.ts` | Add a separately owned mutable overlay and revision notifications without weakening static integrity |
| Slot/palette normalization | `src/shared/plugin-theme-settings.ts` | Reuse stable slots and selected terminal palette rules |
| Settings notifications | `src/main/persistence/applying-settings/settings-update-effects.ts` | Use existing durable settings mutation/notification machinery, not direct file edits |
| Lifecycle/ownership | `src/main/plugins/plugin-enablement.ts`, `plugin-service.ts`, and installation removal flow | Revoke outstanding writes and reconcile durable external-hook ownership even when no worker callback runs |

These are patch planning references, not a promise that every seam can be wired
without additional changes. Full upstream tests/typechecking and live rendering
must verify the completed patch.

## Next source slices, after live colors

### Font-family support

Extend the reviewed appearance contract with a narrow family-only payload. Use
Omarchy's canonical monospace family for applicable terminal/editor roles. Preserve
UI/chat roles without a meaningful source mapping, sizes, line-height, density,
and opacity. Reuse normal settings notifications and verify actual font repaint.

### Owned backgrounds

Add an image import/asset contract that validates file bytes, image dimensions,
format, and size before copying into host-owned mutable storage. Return an owned
handle, not a renderer-accessible arbitrary filesystem path. Apply that handle
without changing transparency. Retain a referenced frozen image on disconnect.

### Hook lifecycle and closed-app snapshots

The outside-Orca hook should update an owned snapshot only; it must not be a
second global appearance writer. When Orca starts, its worker rereads effective
Omarchy state and submits the current enabled feature groups.

However, a worker callback cannot guarantee cleanup on disable/uninstall. Add a
host-managed external-hook registration/ownership contract, limited initially to
the reviewed integration, with durable revocation and startup repair. It must:

- Distinguish desktop shutdown from plugin disable/removal.
- Disable/remove only the registered owned hook, without running arbitrary cleanup
  shell commands or trusting a path supplied by stale plugin code.
- Refuse ownership collisions with unfamiliar pre-existing files.
- Revoke in-flight application before a late snapshot or worker can recreate work.
- Respect master/feature settings through a versioned bridge-owned configuration.
- Keep hooks runnable while Orca is closed without depending on files that an
  uninstall has already removed; removal must be retryable and fail inert.

Theme/font notifications can use existing Omarchy hooks. Independent background
set/next currently emits no hook, so cover the stable parent directory's background
link with a read-only watcher while open and reread it on startup. If the requirement
is to regenerate background assets immediately while closed, use an explicitly
owned external watcher or propose an Omarchy wallpaper hook. Do not pretend a
theme-only hook observes wallpaper-only changes.

### Ownership observation and disconnect

Expose a scoped appearance change event/revision that allows enabled features to
reconcile manual overrides without loops. Disconnect revokes writers and freezes
the current appearance rather than resetting settings. Current Orca removal logic
clears plugin theme selections, so retained/frozen resources need an explicit
host-owned lifecycle; deleting the plugin's files is not sufficient.

## Delivery and authorization boundary

1. Develop the host extension in an isolated Orca **source** checkout on a branch
   based on the pinned/current upstream version; do not patch the installed app.
2. Use the offline proof as a starting contract, then run upstream schema, consent,
   host binding, registry, settings, terminal/editor, and lifecycle tests.
3. Build a separate development Orca with isolated user data for live validation;
   running/installing that build requires an explicit user-approved test step.
4. Coordinate the public API proposal with the existing Omarchy PR. Publishing
   comments, issues, forks, commits, or pull requests remains a separate action.
5. Once the new API is available in a tested host build, resume ticket 02 and ship
   the actual plugin experience. Set a truthful minimum version/feature gate.

Two routes are possible: upstream adoption, or an explicitly labeled separate
source-built Orca carrying the extension while upstream review proceeds. The
second route is not stock Orca support. Neither requires modifying the installed
application or relaxing the supported-interface constraint.

## Alternatives rejected

- Rewriting in-memory app settings files: ignored or unsafe; violates the spec.
- Calling private runtime RPC or renderer internals from a worker: not a public
  plugin interface and explicitly excluded by Orca's facade boundary.
- Modifying signed/integrity-checked installed plugin assets: not an approved
  mutable resource mechanism.
- Automating clicks in Settings on every change: steals focus, cannot meet the
  unattended plugin contract, and is not a replacement for a public apply API.
- Shipping PR #26268's built-in option as “the Orcarchy plugin”: misrepresents the
  implementation and omits approved controls/fonts/backgrounds/lifecycle behavior.
- Upgrading to 1.4.248 and declaring the gate solved: resolves residency only.
