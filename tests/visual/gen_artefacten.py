"""Generate the bg.rijks.app/artefacten recreation ("Artefactregister") in LOTC.

The whole page is `<c-*>` components: the same app-shell + sidenav + header as the
Overzicht recreation, a metric row (c-metric), a filter bar, and a grid of artifact
cards. Each artifact card is composed from LOTC primitives (c-card, c-heading,
c-tag, c-icon) plus a thin app-CSS layer for the card-specific layout (art-*) —
exactly how bg.rijks.app itself works (NLDD web components + rp-* app CSS).

Data (metrics, artifact rows) is extracted verbatim from the live site DOM.
Run:  python tests/visual/gen_artefacten.py  ->  fixtures/artefacten.html
"""

from __future__ import annotations

from pathlib import Path

from bg_shell import artifact_card, shell  # shared shell + card helper

OUT = Path(__file__).resolve().parent / "fixtures" / "artefacten.html"

# ── extracted from https://bg.rijks.app/artefacten ──────────────────────────
METRICS = [
    ("folder-stack", "20", "Artefacten", "images en packages"),
    ("certificate", "80%", "Ondertekend", "met provenance"),
    ("lock-closed", "2.3", "Gem. SLSA-niveau", "supply-chain-borging"),
    ("exclamation-triangle", "3", "Met open CVE", "in de SBOM"),
]

# name, version, digest, status, kind, slsa, components, repo
ARTIFACTS = [
    ("toeslagenmotor", "3.4.1", "sha256:9f2c4e…a1b7", "ondertekend", "container-image", "3", "412", "minbzk/toeslagenmotor"),
    ("datadeling", "2.1.0", "sha256:3a91bd…77c2", "ondertekend", "container-image", "3", "308", "logius/datadeling-api"),
    ("kentekencheck", "1.9.2", "sha256:cc01fe…2d40", "ondertekend", "container-image", "2", "256", "nldd/kentekencheck"),
    ("nldd-ui", "0.9.0", "sha256:71aa90…ee15", "ondertekend", "package", "3", "184", "logius/datadeling-api"),
    ("toeslagenmotor", "3.3.0", "sha256:5e8c12…b9a0", "ongetekend", "container-image", "1", "401", "minbzk/toeslagenmotor"),
    ("vergunningchecker", "0.6.1", "sha256:b204aa…1f33", "ongetekend", "container-image", "1", "222", "logius/datadeling-api"),
    ("paspoort", "4.6.5", "sha256:a0d912…f65b", "ondertekend", "container-image", "3", "331", "minbzk/paspoort"),
    ("bijstandsuitkering", "2.8.4", "sha256:44d96d…0a12", "ondertekend", "container-image", "3", "469", "nldd/bijstandsuitkering"),
    ("inkomenstoets", "4.2.6", "sha256:854b38…bd4b", "ondertekend", "container-image", "2", "468", "nldd/inkomenstoets"),
    ("brp-bevraging", "3.0.5", "sha256:82a820…327f", "ondertekend", "package", "3", "463", "nldd/brp-bevraging"),
    ("bsn-validatie", "4.3.0", "sha256:ed770e…b076", "ondertekend", "package", "3", "147", "nldd/bsn-validatie"),
    ("iban-validatie", "3.2.1", "sha256:9d7db4…7e21", "ondertekend", "package", "2", "357", "nldd/iban-validatie"),
]

INTRO = (
    "Elke build die het gebaande pad oplevert: container-images en packages, met "
    "hun digest, SBOM en handtekening. Ondertekend en herleidbaar tot de repository "
    "en de pijplijn die ze maakte."
)


def metrics() -> str:
    return "\n".join(
        f'      <c-metric icon="{i}" value="{v}" label="{lbl}" sub="{s}"/>'
        for i, v, lbl, s in METRICS
    )


def artifacts() -> str:
    return "\n".join(artifact_card(*row) for row in ARTIFACTS)


STYLE = """
  .art-head{display:flex;align-items:flex-start;gap:.6rem}
  .art-titles{flex:1 1 auto;min-width:0}
  .art-ver{font-weight:400;color:#5a5a5a;font-size:.82em}
  .art-digest{font-family:ui-monospace,'Courier New',monospace;font-size:.8rem;color:#5a5a5a;margin:.2rem 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .art-tags{display:flex;flex-wrap:wrap;gap:.35rem;margin:.7rem 0 0}
  .art-repo{font-family:ui-monospace,'Courier New',monospace;font-size:.8rem;color:#5a5a5a;display:flex;align-items:center;gap:.35rem;margin:.7rem 0 0}
  .art-icon{color:#154273;flex:0 0 auto}
  .page-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1.5rem}
  .page-head .intro{max-width:52rem}
"""


def build() -> str:
    main = f"""  <c-stack gap="1.25rem">
    <c-breadcrumbs>
      <c-breadcrumbs-item href="/environments" label="Omgevingen"/>
      <c-breadcrumbs-item label="Artefacten"/>
    </c-breadcrumbs>

    <div class="page-head">
      <div class="intro">
        <c-heading type="h1" size="2">Artefactregister</c-heading>
        <c-p>{INTRO}</c-p>
      </div>
      <c-button type="secondary" label="De pijplijn" icon="gear" show-icon="before"/>
    </div>

    <c-auto-grid min="220px" gap="1rem">
{metrics()}
    </c-auto-grid>

    <c-stack direction="horizontal" gap="0.5rem">
      <c-button type="primary" label="Alle"/>
      <c-button type="secondary" label="Container-images"/>
      <c-button type="secondary" label="Packages"/>
    </c-stack>

    <c-columns columns="1" lg="2" gap="1rem">
{artifacts()}
    </c-columns>
  </c-stack>"""
    return shell(
        main,
        title="Artefactregister · Begane Grond",
        active_href="/artefacten",
        head=f"<style>{STYLE}</style>",
    )


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT} ({len(OUT.read_text())} bytes)")
