import DOMPurify from "dompurify";

// Links that keep target="_blank" must not hand the opener window to the
// destination page.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target")) {
        node.setAttribute("rel", "noopener noreferrer");
    }
});

// Formatter and CMS content intentionally uses target="_blank" links and
// youtube iframe embeds, which DOMPurify's defaults strip.
const HTML_CONFIG = {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
        "target",
        "allow",
        "allowfullscreen",
        "frameborder",
        "referrerpolicy",
    ],
};

// Shared sanitizer for HTML strings destined for v-html. Non-strings
// (numbers from numeric formatters, undefined) pass through untouched.
let sanitizeHtml = function (HTML) {
    return typeof HTML == "string" ? DOMPurify.sanitize(HTML, HTML_CONFIG) : HTML;
};

// Reduces untrusted input (e.g. URL query-param values) to plain displayable
// text: markup is stripped, and the entity encoding DOMPurify applies is
// decoded back so the result renders correctly in both v-html and {{ }} sinks.
let sanitizeToText = function (STR) {
    const stripped = DOMPurify.sanitize(String(STR), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
    const decoder = document.createElement("textarea");
    decoder.innerHTML = stripped;
    return decoder.value;
};

export { sanitizeHtml, sanitizeToText };

export default {
    sanitizeHtml,
    sanitizeToText,
};
