export function hgvsNotation(value, kind = "") {
    const text = String(value == null ? "" : value).trim();
    if (!text || /^(?:na|n\/a|unavailable|nan|—|-)$/i.test(text)) return "Unavailable";
    const separator = text.indexOf(":");
    const notation = separator < 0 ? text : text.slice(separator + 1);
    return notation && (!kind || notation.startsWith(`${kind}.`)) ? notation : "Unavailable";
}
