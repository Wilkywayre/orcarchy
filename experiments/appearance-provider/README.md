# Appearance-provider preparation experiment

This is **not a loadable plugin, public Orca API implementation, or production
adapter**. It is the bounded color-preparation core proposed for a new host-side
Orca appearance service. It never applies settings, imports renderer internals,
creates hooks, or writes installed application files.

`prepare-colors.cjs` accepts parsers injected by the host. It prepares stable,
mode-specific registry entries and an allowlisted settings update, including the
saved terminal palette copy. Identity must come from an authenticated host call
context, not plugin input. Authorization, revocation, atomic publication, durable
storage, and UI repaint are outside this experiment and required in the real host.

Run unit tests:

```bash
node --test tests/appearance-provider.test.cjs
```

Validate its output against a trusted installed Orca's actual artifact/registration
schemas and settings normalizer:

```bash
node tools/verify-appearance-proposal.cjs --bundle build/orcarchy
```

The tool loads trusted installed schema modules for **offline diagnosis only**;
the eventual plugin must use the new public facade, not these module locations.
Its output explicitly records `liveApplied: false`.

See [method forward](../../docs/method-forward.md) for source integration points,
remaining lifecycle/renderer work, and the existing unmerged Omarchy PR.
