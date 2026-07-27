# Fidelity comparisons

Systematic, per-component fidelity checks. For each component and theme there are
two isolated, single-component screenshots:

```
<component>-<theme>-original.png    the reference / direct rendering (how it SHOULD look)
<component>-<theme>-rendered.png    the output via Lord of the Components
```

- **original** — the direct/reference rendering. For **rvo** it is
  jinja-roos-components (the predecessor) under the RVO CSS; for **nldd** it is
  hand-written ideal `<nldd-*>` markup (the storybook's intended usage).
- **rendered** — our `<c-*>` markup through Lord of the Components under that
  theme's design system.

Put `<component>-<theme>-original.png` next to `<component>-<theme>-rendered.png`
and they should match. Where they differ, our implementation is missing a class,
wrapper, attribute or context.

## Regenerate

```bash
cd python
uv run python ../tests/visual/compare.py                      # writes fixtures + manifest
uv run python ../tests/visual/serve.py --port 5810 --theme rvo &
uv run python ../tests/visual/serve.py --port 5811 --theme nldd &
cd .. && node tests/visual/compare_shoot.mjs                   # writes screenshots/compare/*.png
```

Add a component by appending a `Case(name, lotc, rvo_ref, nldd_ref)` to
`tests/visual/compare.py` (`rvo_ref` = jinja-roos markup, `nldd_ref` = ideal
`nldd-*` markup; either may be `None`). The reference column needs
`jinja-roos-components` installed (`uv pip install -e /path/to/jinja-roos-components
--no-deps`); without it only the `rendered` images are produced.
