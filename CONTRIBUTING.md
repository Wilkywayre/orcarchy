# Contributing

Use Python 3.11+ and keep runtime dependencies at zero unless there is a clear
need. Run tests from the repository root:

```bash
PYTHONPATH=src python -m unittest discover -s tests -v
```

The read-only developer compatibility probe has a separate Node built-in test suite:

```bash
node --test tests/probe-orca.test.cjs tests/appearance-provider.test.cjs tests/plugin-sync.test.mjs
```

Read the compatibility report before implementing live synchronization. Installed
contract modules may be inspected for diagnostic evidence, but are not supported
runtime application APIs. Do not mark the feasibility gate complete or begin
dependent tickets while required upstream contracts remain unavailable.
The appearance-provider experiment is an offline preparation model. The separately
exported source extension implements the first host color facade, but neither
its passing tests nor its successful build may be presented as a live renderer
test. See the source extension build notes for reproduction and remaining gates.

- Keep palette parsing, conversion, and filesystem operations separate.
- Add regression tests for palette and CLI changes; use synthetic fixtures.
- Do not commit personal settings, credentials, generated bundles, or logs.
- Do not edit `/usr/share/omarchy/` or silently alter user configuration.
- Do not promise live reload without testing it against the installed Orca.
- Keep generated plugin manifests and themes within Orca's public contracts.

For compatibility reports, include Orca/Python versions, palette mode, expected
versus actual behavior, and a minimal sanitized palette when relevant.
