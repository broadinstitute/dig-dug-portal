import { marked } from "marked";
import { sanitizeHtml } from "./sanitizeUtils";

function findTemplateTagsFromContent(content) {
    let regexp = /{{([A-Za-z]+)}}/g;

    // we use a slice here because some browsers (firefox) don't support named capture groups in regexp
    // we are able to use a slice here because the structure is always padded by both `{{` and `}}`
    return content
        ? [...content.matchAll(regexp)].map((m) =>
              m[0] ? m[0].slice(2, -2) : "?"
          )
        : [];
}

function makeExtensions(contentFill, valid_tags) {
    let replacements = Object.entries(contentFill || {});
    if (!!valid_tags) {
        replacements = replacements.filter((fill) =>
            valid_tags.includes(fill[0])
        );
    }
    return replacements.map((filler) => ({
        regex: new RegExp(`{{${filler[0]}}}`, "g"),
        replace: String(filler[1]),
    }));
}

function make_name_and_class_extensions(name) {
    const classMap = {
        h1: "doc large-header",
        h2: "doc medium-header",
        h3: "doc small-header",
        h4: "doc x-small-header",
        p: "doc content",
        ul: "doc list",
        li: "doc item",
        em: "doc italic",
        strong: "doc bold",
        a: "doc link",
    };

    const safeName = String(name || "");

    const name_and_class_extensions = Object.keys(classMap).map((key) => ({
        regex: new RegExp(`<${key}(\\s[^>]*)?>`, "g"),
        replace: (_match, attrs = "") => {
            const trimmedAttrs = attrs.trim();
            const spacer = trimmedAttrs ? ` ${trimmedAttrs}` : "";
            return `<${key} id="${safeName}" class="${classMap[key]}"${spacer}>`;
        },
    }));

    return name_and_class_extensions;
}

function applyReplacements(input, replacements) {
    return replacements.reduce(
        (result, rule) => result.replace(rule.regex, rule.replace),
        input
    );
}

function makeConverter(content, contentFill, name) {
    const valid_tags = findTemplateTagsFromContent(content);
    const fill_extensions = makeExtensions(contentFill, valid_tags);

    const name_and_class_extensions = make_name_and_class_extensions(name);

    return {
        makeHtml(markdown = "") {
            const withTemplateValues = applyReplacements(
                String(markdown),
                fill_extensions
            );
            const rendered = marked.parse(withTemplateValues, {
                gfm: true,
                breaks: false,
            });
            const withClasses = applyReplacements(
                String(rendered),
                name_and_class_extensions
            );
            return sanitizeHtml(withClasses);
        },
    };
}

export default {
    makeExtensions,
    findTemplateTagsFromContent,
    makeConverter,
};
