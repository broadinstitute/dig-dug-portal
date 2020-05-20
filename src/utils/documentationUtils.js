
function findTemplateTagsFromContent(content) {
    let regexp = /{{([A-Za-z]+)}}/g;

    // we use a slice here because some browsers (firefox) don't support named capture groups in regexp
    // we are able to use a slice here because the structure is always padded by both `{{` and `}}`
    return [...content.matchAll(regexp)].map(m => m[0].slice(2, -2));
}

function makeExtensions(contentFill, valid_tags) {
    const replacements = Object.entries(contentFill || {})
        .filter(fill => valid_tags.includes(fill[0]))
        .map(filler => ({
            type: "lang",
            regex: `{{${filler[0]}}}`,
            replace: filler[1]
        }));
    return replacements;
}

function parseDocumentation(name, group) {

}
// parse a region as either a gene name, ENS ID, or chr:start-stop



export default {
    makeExtensions,
    findTemplateTagsFromContent
}
