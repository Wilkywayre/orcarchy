# Draft: public live appearance providers for Orca plugins

**Unpublished discussion draft.** The API names below are proposals, not supported
methods. Intended to coordinate with existing issue #26266 and PR #26268 rather
than duplicate the built-in Omarchy feature request.

## Use case

An installable Linux integration plugin should follow an external desktop theme
automatically: app, editor, and existing terminal colors first; font families and
compatible backgrounds subsequently. It should start with Orca, expose individual
feature controls, preserve readability settings, and stop cleanly when disabled.

We are implementing Orcarchy for Omarchy and want to stay inside the supported
plugin facade. No private settings writes, patched app bundles, or renderer injection.

## Current gap

The installed Orca 1.4.247 API 1.3 and the inspected v1.4.248 public contract expose
plugin-private settings but no global appearance application method. Terminal theme
selection persists a copy, so merely regenerating a contributed file is insufficient.

The v1.4.248 resident status-bar worker mechanism covers startup/residency. The
existing live Omarchy PR demonstrates an author-tested built-in color path but
does not expose it to approved third-party plugins.

## Proposed first vertical slice

Expose a narrowly permissioned worker-only `appearance.apply` facade accepting the
existing app/terminal artifact formats together. Derive ownership from the host
call context. Validate both before publication; preserve static plugin integrity
and publish generated resources through a host-owned mutable registry layer.

Use existing app/editor theme slots, selected terminal palette storage, and normal
settings/content notifications to apply the update live. Require a dedicated
appearance-write capability, additive version gates, audit attribution, bounded
payloads, revocation checks, and generation-based stale-write rejection.

Do not accept an arbitrary global-settings dictionary or arbitrary CSS. Protect
security UI, font sizes, density, and opacity. Confirm existing terminals and
Monaco actually repaint, not just that new registry entries were stored.

An offline reference preparation model already produces entries accepted by the
installed strict artifact parsers, registration validators, and settings normalizer
for dark and light inputs. This is data-path evidence only, not a completed host
extension or live-render test.

## Follow-up contracts

- Family-only font updates and validated imported background handles.
- Scoped appearance-change observations for manual-override reconciliation.
- A durable external-hook ownership/revocation contract so a plugin can keep a
  snapshot current while the desktop is closed without leaving an active writer
  after disable/uninstall. Optional worker deactivation alone cannot guarantee it.
- A freeze/detach operation for keeping the current appearance on disconnect,
  without retaining references to plugin files that may later be deleted.

## Acceptance evidence requested before claiming support

- A registered installed plugin initializes and resumes automatically.
- Theme changes update the running UI, editor, and existing terminals without
  restart or manual re-selection, including dark/light transitions.
- Invalid input and revoked/stale calls preserve the last working appearance.
- Installed plugin integrity and approval rules remain intact.
- Feature opt-outs and unrelated preferences survive startup and recovery.
- Disconnect/disable/uninstall stop application safely; closed-desktop operation
  is distinguished from disabled integration.

## Related upstream work

- https://github.com/stablyai/orca/issues/26266
- https://github.com/stablyai/orca/pull/26268
- https://github.com/stablyai/orca/issues/23305
- https://github.com/stablyai/orca/releases/tag/v1.4.248

Inspection baseline: main `129999a4a71a90d3a979dcc3dad60592ec3ea89d` and
Omarchy PR head `87ad0a6cf8cc6489ac3ba6f08d95b1237bbf8e8f`, on 2026-11-04.
PR #26268 was open/unmerged and reported conflicts at inspection time. Its stated
manual/automated results have not been independently reproduced here.
