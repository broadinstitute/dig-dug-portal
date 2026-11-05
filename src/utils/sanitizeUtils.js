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

function sanitizeHtml(html) {
    return typeof html === "string" ? DOMPurify.sanitize(html, HTML_CONFIG) : html;
}

function sanitizeToText(value) {
    const stripped = DOMPurify.sanitize(String(value), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
    const decoder = document.createElement("textarea");
    decoder.innerHTML = stripped;
    return decoder.value;
}

export { sanitizeHtml, sanitizeToText };

export default {
    sanitizeHtml,
    sanitizeToText,
};
