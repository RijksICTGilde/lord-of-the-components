"""Runs the coverage gate (tools/check_coverage.py) inside pytest.

Fails the suite if any matrixed component has an uncovered enum value / boolean,
or a matrix case is missing its golden file.
"""

import importlib.util
from pathlib import Path

CHECK_COVERAGE = Path(__file__).resolve().parent.parent / "tools" / "check_coverage.py"


def _load():
    spec = importlib.util.spec_from_file_location("lotc_check_coverage", CHECK_COVERAGE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_coverage_gate_passes():
    module = _load()
    assert module.main() == 0
