/**
 * A deliberately hostile host stylesheet for shadow-resets regression coverage:
 * Tailwind Preflight's key resets plus aggressive direct and inherited overrides
 * (including an `!important`, to prove a shadow `!important` still wins). Inject it
 * at document level around slotted content; the shadow-resets must neutralise it.
 *
 * Used by the shadow-resets regression test (shadow-resets.test.ts). Lives next
 * to the stylesheet it guards rather than in test-utils.ts.
 */
export declare const hostileHostCss = "\n\t*, ::before, ::after { box-sizing: border-box; }\n\th1, h2, h3, h4, h5, h6 { font-size: 9px !important; font-weight: 100; margin: 40px; }\n\tp { margin: 40px; }\n\ta { color: rgb(255, 0, 0); text-decoration: none; }\n\timg { width: 12px; height: auto; max-width: none; }\n\tselect { opacity: 1; appearance: auto; font: inherit; }\n\t[slot=\"title\"], [slot=\"description\"] { color: rgb(255, 0, 255); margin: 30px; }\n\tbody { letter-spacing: 6px; text-transform: uppercase; }\n";
//# sourceMappingURL=shadow-resets.fixtures.d.ts.map