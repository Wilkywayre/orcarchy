# 01 — Verify supported live integration

**What to build:** A verifiable compatibility proof that an installed Orcarchy plugin can automatically activate, apply live Omarchy appearance updates, and stop safely through supported Orca interfaces. Identify exact upstream blockers before committing to an architecture that cannot deliver the product.

**Blocked by:** None — can start immediately.

**Status:** in-progress — the custom host color extension is implemented and tested; stock Orca compatibility, isolated live rendering, and external-bridge lifecycle remain unresolved.

**Evidence:** See the compatibility report in the project documentation and the read-only installed-contract probe. Static artifact validation succeeded; live integration feasibility did not. Investigation has started, but the gate is not resolved.

**Method forward:** A source-grounded public appearance-provider extension is documented, with an unpublished upstream discussion draft. Released Orca 1.4.248 covers resident-worker startup; existing unmerged PR #26268 demonstrates a built-in Omarchy approach but does not satisfy the plugin contract. The proposed color-preparation experiment passes installed artifact/registration/settings-normalization checks for dark and light palettes. Next work is an isolated upstream source extension and runtime proof, not a private-settings plugin workaround. This gate remains blocked until that proof exists.

**Implementation evidence:** The isolated source branch now implements permissioned live-color publication, mutable owned resources, conditional revisions, cancellation/revocation, and startup snapshot restoration. 61 targeted source tests, full typechecking, scoped lint, custom CLI validation, and the Electron/Vite asset build pass. A reproducible 27-file patch and source metadata are retained. The actual worker is packaged, but no user profile has been changed and no live-rendering or OS-hook cleanup claim is made. The remaining gate is not marked complete.

- [x] Locate the installed Orca application and bundled CLI; record actual Orca and Omarchy versions and the public contracts tested.
- [ ] Demonstrate supported plugin startup activation and document enable, disable, uninstall, crash, and approval behavior. A worker entry point alone is not proof of startup activation.
- [ ] Demonstrate live app/editor theme application, light/dark slot selection, and updates to existing terminal palettes without restarts or manual re-selection.
- [ ] Verify supported font-family and background application interfaces, including independent wallpaper changes and applicable source mappings.
- [ ] Verify how generated mutable themes/assets can be registered without modifying integrity-checked installed plugin contents or depending on private Orca storage paths.
- [ ] Verify safe hook installation and cleanup, including how an external bridge distinguishes Orca being closed from the plugin being disabled or uninstalled.
- [x] Capture reproducible evidence and a supported architecture decision. Development-folder reload alone does not demonstrate production installation support.
- [x] For every missing required API, record the exact upstream change needed and mark the affected implementation blocked. Do not mark a missing capability as working or bypass it through internal settings, injected CSS, or private IPC.
- [x] Separate a completed investigation from resolved feasibility: dependent implementation cannot start until its required capabilities are demonstrated or the upstream blocker is resolved.
