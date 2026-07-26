"""Smoke tests for the benchmark harness (benchmarks/bench.py).

Guards the harness from bit-rot: it must import, build its scenarios, and run a
scenario end-to-end producing the expected metric keys. Timing values themselves
are not asserted (they are machine dependent).
"""

import importlib.util
from pathlib import Path

import pytest

BENCH_PATH = Path(__file__).resolve().parent.parent / "benchmarks" / "bench.py"


@pytest.fixture(scope="module")
def bench():
    spec = importlib.util.spec_from_file_location("lotc_bench", BENCH_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_bench_module_exists():
    assert BENCH_PATH.exists()


def test_build_scenarios_includes_core(bench):
    names = {s.name for s in bench.build_scenarios()}
    assert {"single_button", "buttons_500", "nesting_depth_16"} <= names


def test_component_count(bench):
    scenario = next(s for s in bench.build_scenarios() if s.name == "buttons_500")
    assert scenario.component_count == 500


def test_run_scenario_produces_metrics(bench):
    scenario = next(s for s in bench.build_scenarios() if s.name == "single_button")
    result = bench.run_scenario(scenario)
    for key in ("preprocess_ms", "first_render_ms", "warm_render_ms", "output_bytes"):
        assert key in result
    assert result["output_bytes"] > 0


def test_run_cold_start(bench):
    result = bench.run_cold_start()
    assert result["first_render_ms"] > 0


def test_deferred_scenarios_documented(bench):
    assert "form_page_30_fields" in bench.DEFERRED_SCENARIOS
    assert "table_50x8" in bench.DEFERRED_SCENARIOS
