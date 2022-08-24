import * as showdown from "showdown";

function findTemplateTagsFromContent(content) {
    let regexp = /{{([A-Za-z]+)}}/g;

    // we use a slice here because some browsers (firefox) don't support named capture groups in regexp
    // we are able to use a slice here because the structure is always padded by both `{{` and `}}`
    return content ? [...content.matchAll(regexp)].map(m => m[0] ? m[0].slice(2, -2) : "?") : [];
}

function makeExtensions(contentFill, valid_tags) {
    let replacements = Object.entries(contentFill || {})
    if (!!valid_tags) {
        replacements = replacements.filter(fill => valid_tags.includes(fill[0]))
    }
    return replacements.map(filler => ({
        type: "lang",
        regex: `{{${filler[0]}}}`,
        replace: filler[1]
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
        a: "doc link"
    };

    const name_and_class_extensions = Object.keys(
        classMap
    ).map(key => ({
        type: "output",
        regex: new RegExp(`<${key}(.*)>`, "g"),
        replace: `<${key} id="${name}" class="${classMap[key]}" $1>`
    }));

    return name_and_class_extensions;
}

function makeConverter(content, contentFill, name) {
    const valid_tags = findTemplateTagsFromContent(
        content
    );
    const fill_extensions = makeExtensions(
        contentFill,
        valid_tags
    );

    const name_and_class_extensions = make_name_and_class_extensions(name);

    let converter = new showdown.Converter({
        extensions: [
            ...fill_extensions,
            ...name_and_class_extensions
        ]
    });

    //converter.setOption('openLinksInNewWindow', true);

    return converter
}

export default {
    makeExtensions,
    findTemplateTagsFromContent,
    makeConverter
}
