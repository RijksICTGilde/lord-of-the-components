import { test, expect } from '@playwright/test';

/**
 * Behaviour gate for the overlays, measured in a browser.
 *
 * NLDD 0.8.93 gave `sheet`, `modal-dialog`, `window` and `popover` an `open`
 * attribute. Up to 0.8.92 these could only be opened from JavaScript, and
 * AUTHORING.md said so — so the claim in the docs is only as good as a
 * measurement. Three things are pinned here, and none of them can be read off
 * the manifest:
 *
 *  1. `open` in server-rendered markup really opens sheet/dialog/window;
 *  2. the SAME markup without `open` stays closed (without this the test would
 *     only prove the element exists);
 *  3. a popover needs an ANCHOR. With `anchor="…"` it opens; without one, `open`
 *     does nothing at all — no error, and the element drops the attribute again.
 *     That is the trap, because it fails silently.
 *
 * Measured on the CONTENT box and not on the host: every one of these elements
 * puts its content in the top layer, so the host itself is 0x0 whether it is
 * open or shut. Measuring the host would have passed in all states.
 */

const DECLARATIEF = ['sheet', 'dialog', 'window'] as const;

test.describe('overlays openen', () => {
  test.beforeEach(async ({ page }) => {
    // ?ds=nldd selects the design system for this request — the server defaults
    // to RVO, which has none of these components at all.
    await page.goto('/overlay-open.html?ds=nldd');
    await page.waitForLoadState('networkidle');
    // The elements are light-DOM Lit components: wait until they are defined,
    // otherwise an un-upgraded <nldd-sheet> measures as its own plain content.
    await page.waitForFunction(() =>
      ['nldd-sheet', 'nldd-modal-dialog', 'nldd-window', 'nldd-popover'].every((t) =>
        customElements.get(t),
      ),
    );
  });

  for (const naam of DECLARATIEF) {
    test(`${naam}: open-attribuut opent, zonder blijft dicht`, async ({ page }) => {
      const open = page.locator(`#${naam}-open-inhoud`);
      const dicht = page.locator(`#${naam}-dicht-inhoud`);

      await expect(open).toBeVisible();
      const box = await open.boundingBox();
      expect(box, `${naam} met open= moet een inhoudsvak hebben`).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
      expect(box!.height).toBeGreaterThan(0);

      // Negative control: same markup, no `open`.
      await expect(dicht).toBeHidden();
    });
  }

  test('popover: opent MET anker, doet zonder anker stil niets', async ({ page }) => {
    // Own page: a popover does not survive another open overlay. With the sheet,
    // dialog and window of overlay-open.html open beside it, this very popover
    // measured as hidden — they share the top layer and the last opener wins.
    await page.goto('/overlay-popover.html?ds=nldd');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!customElements.get('nldd-popover'));

    await expect(page.locator('#popover-anker-inhoud')).toBeVisible();
    await expect(page.locator('#popover-zonder-inhoud')).toBeHidden();

    // And the silent part: the anchorless element throws the attribute away
    // again, so the DOM does not even show that someone asked for it.
    const attrs = await page.evaluate(() => ({
      met: document.getElementById('popover-anker')!.hasAttribute('open'),
      zonder: document.getElementById('popover-zonder')!.hasAttribute('open'),
    }));
    expect(attrs.met).toBe(true);
    expect(attrs.zonder).toBe(false);
  });

  test('de methode werkt nog en weerspiegelt in het attribuut', async ({ page }) => {
    const dicht = page.locator('#sheet-dicht-inhoud');
    await expect(dicht).toBeHidden();

    await page.evaluate(() => (document.getElementById('sheet-dicht') as any).show());
    await expect(dicht).toBeVisible();
    await expect(page.locator('#sheet-dicht')).toHaveAttribute('open', '');
  });
});
