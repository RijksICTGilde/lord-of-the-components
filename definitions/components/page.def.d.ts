/**
 * Page Component Definition
 *
 * Full HTML document wrapper that provides the <!DOCTYPE html> structure,
 * meta tags, asset loading, and body content.
 *
 * Unlike other components that render a single HTML element, the page component
 * renders an entire HTML document including <html>, <head>, and <body> tags.
 *
 * Usage:
 *   <c-page title="My Page">
 *     <c-heading type="h1" name="Welcome"/>
 *     <c-paragraph name="Page content here."/>
 *   </c-page>
 *
 *   <c-page title="About Us" description="About our company" lang="nl">
 *     Content here
 *   </c-page>
 */
export declare const page: Readonly<{
    name: string;
    description: string;
    category: string;
    props: {
        /**
         * Page title shown in browser tab
         */
        title: {
            required: true;
            description: string;
        };
        /**
         * HTML language attribute
         * @default "en"
         */
        lang: {
            default: string;
            description: string;
        };
        /**
         * Document character encoding
         * @default "utf-8"
         */
        charset: {
            default: string;
            description: string;
        };
        /**
         * Meta description for SEO
         */
        description: {
            description: string;
        };
        /**
         * Theme name applied as body class (theme-{value})
         */
        theme: {
            description: string;
        };
        /**
         * Additional CSS classes for the body element
         */
        "body-class": {
            description: string;
        };
        /**
         * Additional content injected into <head> (raw HTML)
         */
        head: {
            description: string;
        };
        /**
         * Additional CSS classes (applied to body)
         */
        class: {
            description: string;
        };
    };
    content: {
        allowed: true;
        description: string;
    };
}>;
export type PageDefinition = typeof page;
//# sourceMappingURL=page.def.d.ts.map