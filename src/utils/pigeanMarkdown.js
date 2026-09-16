import { Marked } from "marked";
import katex from "katex";
import { sanitizeHtml } from "./sanitizeUtils";

// An isolated Marked instance leaves CMS Markdown behavior on other pages intact.
export function renderMethodMarkdown(source, prefix) {
    const headings = [];
    const used = new Map();
    const math = (text, displayMode) =>
        katex.renderToString(text.trim(), {
            displayMode,
            throwOnError: false,
            trust: false,
            strict: "ignore",
            output: "htmlAndMathml",
        });
    const parser = new Marked({ gfm: true });
    parser.use({
        extensions: [
            {
                name: "blockMath",
                level: "block",
                start: (src) => src.indexOf("$$"),
                tokenizer(src) {
                    const m = /^\$\$\s*\n?([\s\S]+?)\$\$(?:\n|$)/.exec(src);
                    if (m) return { type: "blockMath", raw: m[0], text: m[1] };
                },
                renderer: (token) =>
                    `<div class="pigean-equation">${math(
                        token.text,
                        true
                    )}</div>`,
            },
            {
                name: "inlineMath",
                level: "inline",
                start: (src) => src.indexOf("$"),
                tokenizer(src) {
                    const m = /^\$([^$\n]+?)\$/.exec(src);
                    if (m) return { type: "inlineMath", raw: m[0], text: m[1] };
                },
                renderer: (token) => math(token.text, false),
            },
        ],
        renderer: {
            heading(token) {
                const plain = token.text.replace(/<[^>]*>|[*`$]/g, "");
                const base = `${prefix}-${plain
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}`;
                const count = used.get(base) || 0;
                used.set(base, count + 1);
                const id = count ? `${base}-${count}` : base;
                if (token.depth === 2) headings.push({ id, text: plain });
                return `<h${token.depth} id="${id}">${this.parser.parseInline(
                    token.tokens
                )}</h${token.depth}>`;
            },
            code(token) {
                if (token.lang === "math")
                    return `<div class="pigean-equation">${math(
                        token.text,
                        true
                    )}</div>`;
                return false;
            },
        },
    });
    // Resolve author-relative media URLs against the content directory, not the page URL.
    const html = sanitizeHtml(parser.parse(source));
    const document = new DOMParser().parseFromString(html, "text/html");
    document.querySelectorAll("[src], a[href]").forEach((element) => {
        const attr = element.hasAttribute("src") ? "src" : "href";
        const value = element.getAttribute(attr);
        if (value && value.startsWith("./"))
            element.setAttribute(attr, `/pigean/content/${value.slice(2)}`);
    });
    return { html: document.body.innerHTML, headings };
}
