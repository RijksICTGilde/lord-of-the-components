"""Generate golden HTML for every variant-matrix case (plan v7 T1.1).

Reads the variant matrix (core/dist/matrix.json, produced by
`npx tsx core/src/matrix/generate-matrix.ts`), renders each case through the
real LOTC Jinja2 pipeline, and writes:

    python/tests/golden/<theme>/<component>/<case_id>.html   (rendered output)
    python/tests/golden/matrix.json                          (committed case inputs)

test_golden.py re-renders the committed markup and compares (normalized) against
the committed golden — the contract that proves the rewrite changes nothing.

Usage:
    python tools/gen_goldens.py            # regenerate all goldens
    python tools/gen_goldens.py --check    # fail if any golden would change
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

PYTHON_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = PYTHON_DIR.parent
PACKAGE_DIR = PYTHON_DIR / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"
MATRIX_JSON = REPO_ROOT / "core" / "dist" / "matrix.json"
GOLDEN_DIR = PYTHON_DIR / "tests" / "golden"
GOLDEN_MATRIX = GOLDEN_DIR / "matrix.json"

sys.path.insert(0, str(PACKAGE_DIR.parent))
from lord_of_the_components import setup_components  # noqa: E402


def make_env() -> Environment:
    # setup_components requires autoescape=True (F3): renderers escape prop values
    # and treat content as Markup. The golden env matches test_golden.py.
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=True)
    setup_components(env, registry_path=str(REGISTRY_JSON))
    return env


def render_case(env: Environment, markup: str) -> str:
    return env.from_string(markup).render()


def golden_path(theme: str, component: str, case_id: str) -> Path:
    return GOLDEN_DIR / theme / component / f"{case_id}.html"


def load_matrix() -> dict:
    if not MATRIX_JSON.exists():
        sys.exit(
            f"Matrix not found at {MATRIX_JSON}.\n"
            "Run: npx tsx core/src/matrix/generate-matrix.ts"
        )
    return json.loads(MATRIX_JSON.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate golden HTML from the variant matrix")
    parser.add_argument("--check", action="store_true", help="Fail if any golden would change")
    args = parser.parse_args()

    matrix = load_matrix()
    env = make_env()

    written = 0
    errors = 0
    changed: list[str] = []

    for case in matrix["cases"]:
        theme, component, case_id = case["theme"], case["component"], case["case_id"]
        try:
            html = render_case(env, case["markup"])
        except Exception as exc:  # noqa: BLE001 - surface any render failure
            errors += 1
            print(f"  ! render failed: {component}/{case_id}: {exc}", file=sys.stderr)
            continue

        path = golden_path(theme, component, case_id)
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != html:
                changed.append(f"{theme}/{component}/{case_id}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(html, encoding="utf-8")
            written += 1

    if args.check:
        if changed:
            print(f"{len(changed)} golden(s) would change:", file=sys.stderr)
            for name in changed[:20]:
                print(f"  {name}", file=sys.stderr)
            return 1
        print("All goldens up to date.")
        return 0

    # Commit the matrix inputs alongside the goldens so test_golden needs no tsx.
    GOLDEN_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(MATRIX_JSON, GOLDEN_MATRIX)

    print(f"Wrote {written} golden(s) to {GOLDEN_DIR}")
    if errors:
        print(f"{errors} case(s) failed to render", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
