"""List the places where compile-time validation stops.

An attribute value that is a LITERAL is checked against its enum (and an icon
name against the theme's icon set) — under ``debug=True``,
``on_unknown_value="error"`` or ``LOTC_STRICT=1``. A value that is computed is
not: the compiler sees an expression, not a value, so ``:size="row.size"`` and
``size="{{ row.size }}"`` pass whatever they produce straight through.

That is a deliberate boundary, not a bug — checking it would mean validating on
every render. But a boundary nobody can see is a blind spot, so this makes it a
list: every spot where a computed value lands on an attribute whose allowed
values are known. A team can then walk them by hand.

    python -m lord_of_the_components.sweep templates/
    python -m lord_of_the_components.sweep --design-systems nldd,lotc-forms app/

Reported by RIG-Cluster (RC-151), who lost half an hour to ``size="sm"`` on an
avatar: NLDD falls back to ``full`` for an unknown size, ``full`` scales to its
container, and in a cell without a height that is nothing at all. The row was
there and the avatar was invisible, with every gate green.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Sequence

from .parser import AttrKind, ComponentNode, Node, ParseError, TemplateNode, parse
from .registry import AttributeType, ComponentRegistry

#: Files worth scanning. A template is a template whatever it is called.
DEFAULT_SUFFIXES = (".j2", ".jinja", ".jinja2", ".html", ".htm")


@dataclass(frozen=True)
class Finding:
    """One place where a computed value lands on a checkable attribute."""

    path: Path
    line: int
    component: str
    attribute: str
    value: str
    allowed: Sequence[str]
    reason: str
    #: What the value is checked against when it IS a literal — an enum has a
    #: list, an icon has the theme's set, a spread has neither.
    checked_against: str = "enum"

    def format(self) -> str:
        if self.allowed:
            tail = f"; allowed: {', '.join(self.allowed)}"
        elif self.checked_against == "icon":
            tail = "; allowed: the theme's icon set"
        else:
            tail = ""
        return f'{self.path}:{self.line}: <c-{self.component} {self.attribute}="{self.value}"> — {self.reason}{tail}'


def _iter_nodes(nodes: Iterable[Node]) -> Iterable[ComponentNode]:
    for node in nodes:
        if isinstance(node, ComponentNode):
            yield node
            yield from _iter_nodes(node.children)
        elif isinstance(node, TemplateNode):
            yield from _iter_nodes(node.children)


def _line_of(source: str, offset: int) -> int:
    return source.count("\n", 0, offset) + 1


#: Attribute names whose value is checked against a set rather than an enum.
ICON_ATTRIBUTES = frozenset({"icon", "icon-before", "icon-after"})


def sweep_source(source: str, path: Path, registry: ComponentRegistry) -> List[Finding]:
    """Findings for one template's source."""
    try:
        nodes = parse(source)
    except ParseError as exc:  # a template we cannot read tells us nothing
        return [Finding(path, exc.line, "?", "?", "", (), f"could not be parsed: {exc.message}", "none")]

    findings: List[Finding] = []
    for node in _iter_nodes(nodes):
        definition = registry.get_component(node.name)
        if definition is None:
            continue
        for attr in node.attrs:
            name = attr.name.lstrip(":@")
            if attr.kind is AttrKind.LITERAL or attr.raw_value is None:
                continue  # the compiler already checks these
            if attr.kind is AttrKind.EVENT:
                continue  # a handler has no value set to check against

            if name == "attrs":
                # A spread carries names AND values, neither visible here.
                findings.append(
                    Finding(
                        path,
                        _line_of(source, attr.span.start),
                        node.name,
                        "attrs",
                        attr.raw_value.strip(),
                        (),
                        "spread: every key and value in it is unchecked",
                        checked_against="none",
                    )
                )
                continue

            definition_attr = definition.get_attribute(name)
            if definition_attr is None:
                continue
            is_enum = definition_attr.type == AttributeType.ENUM
            is_icon = name in ICON_ATTRIBUTES
            if not (is_enum or is_icon):
                continue

            reason = {
                AttrKind.EXPRESSION: "expression, evaluated at render time",
                AttrKind.INTERPOLATED: "interpolated, rendered to a string",
                AttrKind.BLOCK: "built by a Jinja block",
            }[attr.kind]
            findings.append(
                Finding(
                    path,
                    _line_of(source, attr.span.start),
                    node.name,
                    attr.name,
                    attr.raw_value.strip(),
                    tuple(definition_attr.enum_values or ()) if is_enum else (),
                    reason,
                    checked_against="enum" if is_enum else "icon",
                )
            )
    return findings


def sweep_paths(
    paths: Sequence[Path],
    registry: ComponentRegistry,
    suffixes: Sequence[str] = DEFAULT_SUFFIXES,
) -> List[Finding]:
    findings: List[Finding] = []
    for target in paths:
        files = sorted(f for f in target.rglob("*") if f.suffix in suffixes) if target.is_dir() else [target]
        for file in files:
            findings.extend(sweep_source(file.read_text(encoding="utf-8", errors="replace"), file, registry))
    return findings


def _registry_for(design_systems: Sequence[str]) -> ComponentRegistry:
    """Core plus each declared design system's fragment — the same set an app has."""
    from .design_system import discover_design_systems

    registry = ComponentRegistry()
    available = discover_design_systems()
    for name in design_systems:
        system = available.get(name)
        if system is None:
            print(f"warning: no installed design system called {name!r}", file=sys.stderr)
            continue
        if system.registry_path:
            registry.merge_fragment(Path(system.registry_path), system.name)
    return registry


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m lord_of_the_components.sweep",
        description=(
            "List attribute values that compile-time validation cannot check: "
            "computed values on enum and icon attributes."
        ),
    )
    parser.add_argument("paths", nargs="+", type=Path, help="template files or directories")
    parser.add_argument(
        "--design-systems",
        default="",
        help="comma-separated, e.g. nldd,lotc-forms — adds their components to the registry",
    )
    parser.add_argument("--quiet", action="store_true", help="print only the count, for use as a gate")
    args = parser.parse_args(argv)

    systems = [s.strip() for s in args.design_systems.split(",") if s.strip()]
    findings = sweep_paths(args.paths, _registry_for(systems))

    if not args.quiet:
        for finding in findings:
            print(finding.format())
    scanned = ", ".join(str(p) for p in args.paths)
    print(f"{len(findings)} unchecked value(s) in {scanned}", file=sys.stderr)
    # Not a failure: these are places to look at, not defects.
    return 0


if __name__ == "__main__":  # pragma: no cover - module entry point
    raise SystemExit(main())
