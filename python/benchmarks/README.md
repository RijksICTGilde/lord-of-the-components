# Benchmarks

`bench.py` measures the cost of preprocessing and rendering component templates so
performance work (plan v7) has a regression gate.

```bash
# Run and print a table; writes results/<git-sha>.json
python benchmarks/bench.py

# Establish the baseline on THIS machine
python benchmarks/bench.py --write-baseline

# Compare the current run against baseline.json; exit 1 on >10% warm-render regression
python benchmarks/bench.py --baseline
```

## Metrics per scenario

| Metric | Meaning |
|---|---|
| `preprocess_ms` | time to run the extension `preprocess()` over the source |
| `first_render_ms` | fresh `Environment`: compile (incl. preprocess) + first render |
| `warm_render_ms` | min over N renders of an already-compiled template |
| `output_bytes` | size of the rendered HTML |
| `us_per_component` | `warm_render_ms * 1000 / component_count` |

## Machine-specific

`baseline.json` and `results/` hold absolute timings and are therefore **machine
specific** — they are git-ignored. `--baseline` is only meaningful when the baseline
and the comparison run were produced on the same hardware. In CI, regenerate the
baseline on the runner (`--write-baseline`) before comparing, or run without the gate
and publish the JSON as an artifact.

## Deferred scenarios

`form_page_30_fields` and `table_50x8` from the plan need components that do not exist
yet (forms/table, batches B–D in F9). The harness lists them as *deferred* and adds
them once those components land.
