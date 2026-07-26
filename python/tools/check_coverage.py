"""Coverage gate (plan v7 T1.0c).

Fails when an enum value or boolean prop of a matrixed component has no covering
case, or when a matrix case has no golden file on disk. This is the runtime gate
that stops the sweep (F9) from silently leaving gaps.

Reads the committed contract inputs:
  - python/tests/golden/matrix.json  (the variant-matrix cases)
  - python/src/lord_of_the_components/registry.json  (enum/boolean source of truth)

Components without matrix cases (hand-templated: page, menu-item, breadcrumbs-item)
are reported for visibility but do not fail the gate — they gain cases when they
get an implementation (F9).

Usage:
    python tools/check_coverage.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PYTHON_DIR = Path(__file__).resolve().parent.parent
PACKAGE_DIR = PYTHON_DIR / "src" / "lord_of_the_components"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"
GOLDEN_DIR = PYTHON_DIR / "tests" / "golden"
MATRIX_JSON = GOLDEN_DIR / "matrix.json"


def _required_coverage(registry: dict) -> dict[str, set[str]]:
    """Per component: the set of `prop=value` keys that must be covered."""
    required: dict[str, set[str]] = {}
    for comp in registry["components"]:
        keys: set[str] = set()
        for attr in comp.get("attributes", []):
            if attr.get("type") == "enum":
                for value in attr.get("enum_values", []):
                    keys.add(f"{attr['name']}={value}")
            elif attr.get("type") == "boolean":
                keys.add(f"{attr['name']}=true")
        required[comp["name"]] = keys
    return required


def main() -> int:
    if not MATRIX_JSON.exists():
        print(f"Missing {MATRIX_JSON} — run tools/gen_goldens.py", file=sys.stderr)
        return 1

    registry = json.loads(REGISTRY_JSON.read_text(encoding="utf-8"))
    matrix = json.loads(MATRIX_JSON.read_text(encoding="utf-8"))
    required = _required_coverage(registry)

    # covered[component] = set of prop=value keys any case exercises.
    covered: dict[str, set[str]] = {}
    missing_goldens: list[str] = []
    matrix_components: set[str] = set()

    for case in matrix["cases"]:
        comp = case["component"]
        matrix_components.add(comp)
        keys = covered.setdefault(comp, set())
        keys.update(case.get("covers", []))
        for prop, value in case.get("props", {}).items():
            keys.add(f"{prop}={'true' if value is True else value}")

        golden = GOLDEN_DIR / case["theme"] / comp / f"{case['case_id']}.html"
        if not golden.exists():
            missing_goldens.append(f"{case['theme']}/{comp}/{case['case_id']}")

    failures: list[str] = []
    for comp in sorted(matrix_components):
        uncovered = sorted(required.get(comp, set()) - covered.get(comp, set()))
        if uncovered:
            failures.append(f"{comp}: uncovered {', '.join(uncovered)}")

    for name in missing_goldens:
        failures.append(f"missing golden: {name}")

    # Informational: registry components that have no matrix cases at all.
    no_cases = sorted(set(required) - matrix_components)
    if no_cases:
        print(f"note: no matrix cases (hand-templated): {', '.join(no_cases)}")

    if failures:
        print(f"COVERAGE GATE FAILED ({len(failures)} issue(s)):", file=sys.stderr)
        for f in failures:
            print(f"  {f}", file=sys.stderr)
        return 1

    print(
        f"Coverage OK: {len(matrix_components)} components, "
        f"{len(matrix['cases'])} cases, every enum/boolean covered."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
