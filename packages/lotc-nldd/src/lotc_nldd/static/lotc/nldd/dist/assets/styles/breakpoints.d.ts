export declare const breakpoints: {
    readonly smMin: "320px";
    readonly smMax: "640px";
    readonly mdMin: "641px";
    readonly mdMax: "1007px";
    readonly lgMin: "1008px";
};
/**
 * The same breakpoints in rem, for `@container` and `@media` conditions. With
 * page zoom, Safari compares the width of a container that takes its size from
 * the layout in zoomed pixels, so a px condition sees a narrow container as
 * wide; a rem condition scales with the zoom. At the default font size of
 * 16px they equal the px values.
 */
export declare const queryBreakpoints: {
    readonly smMin: "20rem";
    readonly smMax: "40rem";
    readonly mdMin: "40.0625rem";
    readonly mdMax: "62.9375rem";
    readonly lgMin: "63rem";
};
/**
 * The root font size in CSS pixels: what 1rem is in an `@container` condition.
 * An `@media` condition and `matchMedia` take the browser's initial font size
 * instead, which differs only when a site sets `font-size` on `<html>`; pass
 * them a `queryBreakpoints` string. It reads the computed style of the page,
 * so call it in the browser (in connectedCallback, a resize observer or an
 * event handler), not during SSR.
 */
export declare function rootFontSize(): number;
/**
 * A breakpoint in CSS pixels at the root font size, for the width of a
 * container that script compares itself. It matches what an `@container`
 * condition in the styles sees, also when someone has set a larger default
 * font size. Comparing against more than
 * one breakpoint, read `rootFontSize()` once and pass it in. Browser only, like
 * `rootFontSize()`.
 */
export declare function breakpointPx(name: keyof typeof queryBreakpoints, fontSize?: number): number;
//# sourceMappingURL=breakpoints.d.ts.map