"""Golden contract for the whole rewrite (plan v7 T1.1).

Re-renders every variant-matrix case through the LOTC pipeline and compares the
result (normalized) against the committed golden. This is the contract that
proves later phases (rename, parser rewrite, Python renderer, folding) change
nothing about the output.

Inputs come from python/tests/golden/matrix.json (committed), so this test needs
no TypeScript codegen at test time. Regenerate with:

    npx tsx core/src/matrix/generate-matrix.ts
    python tools/gen_goldens.py
"""

import json
import sys
from pathlib import Path

import pytest
from jinja2 import Environment, FileSystemLoader

from lord_of_the_components import setup_components

TESTS_DIR = Path(__file__).resolve().parent
TOOLS_DIR = TESTS_DIR.parent / "tools"
PACKAGE_DIR = TESTS_DIR.parent / "src" / "lord_of_the_components"
TEMPLATES_DIR = PACKAGE_DIR / "templates"
REGISTRY_JSON = PACKAGE_DIR / "registry.json"
GOLDEN_DIR = TESTS_DIR / "golden"
GOLDEN_MATRIX = GOLDEN_DIR / "matrix.json"

sys.path.insert(0, str(TOOLS_DIR))
from htmlnorm import normalize  # noqa: E402


def _load_cases() -> list[dict]:
    if not GOLDEN_MATRIX.exists():
        return []
    return json.loads(GOLDEN_MATRIX.read_text(encoding="utf-8")).get("cases", [])


CASES = _load_cases()


@pytest.fixture(scope="module")
def golden_env() -> Environment:
    # Must match tools/gen_goldens.py (autoescape=False = current behavior).
    env = Environment(loader=FileSystemLoader([str(TEMPLATES_DIR)]), autoescape=False)
    setup_components(env, registry_path=str(REGISTRY_JSON))
    return env


def test_matrix_present():
    assert CASES, "golden/matrix.json missing or empty — run tools/gen_goldens.py"


@pytest.mark.parametrize(
    "case",
    CASES,
    ids=[f"{c['theme']}-{c['component']}-{c['case_id']}" for c in CASES],
)
def test_golden(case: dict, golden_env: Environment):
    path = GOLDEN_DIR / case["theme"] / case["component"] / f"{case['case_id']}.html"
    assert path.exists(), f"missing golden {path} — run tools/gen_goldens.py"

    expected = path.read_text(encoding="utf-8")
    actual = golden_env.from_string(case["markup"]).render()

    assert normalize(actual) == normalize(expected), (
        f"golden mismatch for {case['component']}/{case['case_id']}"
    )
