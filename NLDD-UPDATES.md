# Keeping up with NLDD

NLDD (`@nldd/design-system`) ships almost daily. Our `lotc-nldd` binding is
**generated** from its Custom Elements Manifest, and adopting a new release is a
**deliberate, reviewable act** — never an automatic drift. Four things make that
safe:

| Layer | What | Where |
| --- | --- | --- |
| 1. Pin | `@nldd/design-system` is pinned to an **exact** version — a bump only happens when someone installs one. | `package.json` |
| 2. Provenance | The generated fragment records the exact NLDD version it came from (`meta.nldd_version`). | `packages/lotc-nldd/src/lotc_nldd/registry.json` |
| 3. Preview + apply | See what a bump *would* change, then regenerate everything. | `npm run nldd:diff` / `npm run nldd:update` |
| 4. Guardrail | CI-checkable: fail if the committed binding is stale vs the installed NLDD. | `npm run nldd:check` |

## Adopting a new NLDD release

```bash
# 1. Bump the pin (deliberate). Pick the version you want.
npm install --save-exact @nldd/design-system@<version>

# 2. Preview what it changes in OUR mapped surface (added/removed/changed
#    components + per-attribute deltas). Nothing is written yet.
npm run nldd:diff

# 3. Apply: regenerate the fragment + templates, icon vocabulary, and docs.
npm run nldd:update      # = gen:nldd && gen:icons && gen:docs

# 4. Review the diff, run the suite, commit.
git diff
(cd python && uv run pytest -q -o addopts="")
```

The commit that bumps the pin, the regenerated fragment (with its new
`meta.nldd_version`), and any template/doc changes travel **together** — so the
history shows exactly which NLDD version each state of the binding targets.

## Guardrail (CI)

```bash
npm run nldd:check   # exits 1 if lotc-nldd is stale vs the installed NLDD
```

Run it in CI to prove the committed binding matches the pinned NLDD: if someone
bumps the pin without regenerating (or edits a generated file by hand), it fails
and names the stale files.

## What is generated vs hand-authored

`gen:nldd` only emits bindings for NLDD elements we don't already cover. It
**skips**: components core already defines, components we cover under a different
semantic name (`SEMANTIC_DUPES` in `generate-nldd.mjs`), and any `lotc-nldd`
template that lacks the `Auto-generated…` marker (hand-authored — never
overwritten). So hand-tuned bindings survive a regenerate untouched.
