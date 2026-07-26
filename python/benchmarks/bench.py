"""Benchmark harness for Lord of the Components (plan v7 T0.5).

Measures the cost of preprocessing and rendering component templates so that
performance work has a regression gate. Each scenario reports:

    preprocess_ms   - time to run the extension preprocess() over the source
    first_render_ms - fresh Environment: compile (incl. preprocess) + first render
    warm_render_ms  - min over N renders of an already-compiled template
    output_bytes    - size of the rendered HTML
    us_per_component - warm_render_ms * 1000 / component_count

Usage:
    python benchmarks/bench.py                     # run, print table, write results/<sha>.json
    python benchmarks/bench.py --write-baseline     # also write baseline.json
    python benchmarks/bench.py --baseline           # compare warm_render vs baseline.json,
                                                     # exit 1 on >10% regression
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PACKAGE_DIR = REPO_ROOT / "python" / "src" / "lord_of_the_components"
COMPONENT_TEMPLATES = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"
EXAMPLE_TEMPLATES = REPO_ROOT / "examples" / "getting-started" / "templates"
RESULTS_DIR = Path(__file__).resolve().parent / "results"
BASELINE_PATH = Path(__file__).resolve().parent / "baseline.json"

# Number of warm-render samples; we report the minimum (least noise).
WARM_SAMPLES = 30
# A warm-render regression larger than this fraction fails --baseline.
REGRESSION_THRESHOLD = 0.10

sys.path.insert(0, str(PACKAGE_DIR.parent))
from lord_of_the_components import setup_components  # noqa: E402
from lord_of_the_components.extension import (  # noqa: E402
    ComponentError,
    ComponentExtension,
)


def _make_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader([str(EXAMPLE_TEMPLATES), str(COMPONENT_TEMPLATES)]),
        auto_reload=False,
    )
    setup_components(env, registry_path=str(REGISTRY_JSON))
    return env


class Scenario:
    """A named benchmark input: an inline source string or a template file."""

    def __init__(
        self,
        name: str,
        source: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.name = name
        self.source = source
        self.context = context or {}
        self.component_count = source.count("<c-")


def _buttons(n: int, content: str = "Save") -> str:
    return "".join(f'<c-button type="primary">{content}</c-button>' for _ in range(n))


def _nested_cards(depth: int) -> str:
    inner = '<c-button type="primary">Deep</c-button>'
    html = inner
    for _ in range(depth):
        html = f"<c-card>{html}</c-card>"
    return html


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def build_scenarios() -> List[Scenario]:
    scenarios = [
        Scenario("single_button", _buttons(1)),
        Scenario("buttons_500", _buttons(500)),
        # Everything literal — becomes ~free once constant folding lands (F4).
        Scenario("static_only_page", _buttons(200)),
        # Content driven by a variable, so it cannot be folded to a constant.
        Scenario("dynamic_page", _buttons(200, content="{{ label }}"), {"label": "Save"}),
        Scenario("nesting_depth_16", _nested_cards(16)),
    ]
    if (EXAMPLE_TEMPLATES / "index.html").exists():
        scenarios.append(Scenario("full_c_page", _read(EXAMPLE_TEMPLATES / "index.html")))
    if (EXAMPLE_TEMPLATES / "showcase.html").exists():
        scenarios.append(Scenario("showcase_page", _read(EXAMPLE_TEMPLATES / "showcase.html")))
    return scenarios


# Scenarios from the plan that need components not yet implemented (forms, table).
# Listed so the harness reports them as pending rather than silently omitting them.
DEFERRED_SCENARIOS = {
    "form_page_30_fields": "needs form components (batch B/C, F9)",
    "table_50x8": "needs table component (batch D, F9)",
}


def _time_min(fn: Callable[[], Any], samples: int) -> float:
    best = float("inf")
    for _ in range(samples):
        start = time.perf_counter()
        fn()
        best = min(best, time.perf_counter() - start)
    return best


def run_scenario(scenario: Scenario) -> Dict[str, Any]:
    env = _make_env()
    ext = env.extensions[ComponentExtension.identifier]

    preprocess_ms = _time_min(
        lambda: ext.preprocess(scenario.source, scenario.name), WARM_SAMPLES
    ) * 1000

    start = time.perf_counter()
    template = env.from_string(scenario.source)
    output = template.render(**scenario.context)
    first_render_ms = (time.perf_counter() - start) * 1000

    warm_render_ms = _time_min(lambda: template.render(**scenario.context), WARM_SAMPLES) * 1000

    count = scenario.component_count or 1
    return {
        "preprocess_ms": round(preprocess_ms, 4),
        "first_render_ms": round(first_render_ms, 4),
        "warm_render_ms": round(warm_render_ms, 4),
        "output_bytes": len(output),
        "component_count": scenario.component_count,
        "us_per_component": round(warm_render_ms * 1000 / count, 3),
    }


def run_cold_start() -> Dict[str, Any]:
    """Fresh Environment + first render — captures one-time setup cost."""
    source = _buttons(1)

    def once() -> None:
        env = _make_env()
        env.from_string(source).render()

    # perf_counter min over a few cold builds (each creates a new env).
    cold_ms = _time_min(once, 5) * 1000
    return {
        "preprocess_ms": None,
        "first_render_ms": round(cold_ms, 4),
        "warm_render_ms": round(cold_ms, 4),
        "output_bytes": len(_make_env().from_string(source).render()),
        "component_count": 1,
        "us_per_component": None,
    }


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=str(REPO_ROOT)
        ).decode().strip()
    except Exception:
        return "unknown"


def run_all() -> Dict[str, Any]:
    results: Dict[str, Any] = {}
    for scenario in build_scenarios():
        try:
            results[scenario.name] = run_scenario(scenario)
        except ComponentError as exc:
            results[scenario.name] = {"skipped": str(exc)}
    results["cold_start"] = run_cold_start()
    return {
        "git_sha": _git_sha(),
        "warm_samples": WARM_SAMPLES,
        "scenarios": results,
        "deferred": DEFERRED_SCENARIOS,
    }


def print_table(report: Dict[str, Any]) -> None:
    header = f"{'scenario':<22}{'preprocess':>12}{'first':>10}{'warm':>10}{'us/comp':>10}{'bytes':>10}"
    print(header)
    print("-" * len(header))
    for name, data in report["scenarios"].items():
        if "skipped" in data:
            print(f"{name:<22}  skipped: {data['skipped']}")
            continue
        pp = data["preprocess_ms"]
        pp_s = f"{pp:.3f}" if pp is not None else "-"
        us = data["us_per_component"]
        us_s = f"{us:.2f}" if us is not None else "-"
        print(
            f"{name:<22}{pp_s:>12}{data['first_render_ms']:>10.3f}"
            f"{data['warm_render_ms']:>10.3f}{us_s:>10}{data['output_bytes']:>10}"
        )
    for name, reason in report["deferred"].items():
        print(f"{name:<22}  deferred: {reason}")


def compare_baseline(report: Dict[str, Any]) -> int:
    if not BASELINE_PATH.exists():
        print(f"No baseline at {BASELINE_PATH}; run with --write-baseline first.", file=sys.stderr)
        return 1
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    base_scenarios = baseline.get("scenarios", {})
    regressed = False
    for name, data in report["scenarios"].items():
        if "skipped" in data:
            continue
        base = base_scenarios.get(name)
        if not base or "warm_render_ms" not in base:
            continue
        base_warm = base["warm_render_ms"]
        cur_warm = data["warm_render_ms"]
        if base_warm <= 0:
            continue
        delta = (cur_warm - base_warm) / base_warm
        flag = ""
        if delta > REGRESSION_THRESHOLD:
            flag = "  <-- REGRESSION"
            regressed = True
        print(f"{name:<22} warm {base_warm:.3f} -> {cur_warm:.3f} ms ({delta:+.1%}){flag}")
    return 1 if regressed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="LOTC benchmark harness")
    parser.add_argument("--baseline", action="store_true", help="Compare to baseline.json, exit 1 on regression")
    parser.add_argument("--write-baseline", action="store_true", help="Write baseline.json from this run")
    args = parser.parse_args()

    report = run_all()
    print_table(report)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    result_path = RESULTS_DIR / f"{report['git_sha']}.json"
    result_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {result_path}")

    if args.write_baseline:
        BASELINE_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote baseline {BASELINE_PATH}")

    if args.baseline:
        return compare_baseline(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
