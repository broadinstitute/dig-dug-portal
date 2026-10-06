import { hpoTerms } from "../KrClinicalFocus/clinicalContextReference.generated";
const { findSearchOptions, normalizeSearchValue } = require("../PbFront/searchModel");

const aliases = {
    "HP:0000750": ["speech delay", "delayed speech"],
    "HP:0001249": ["cognitive impairment"],
    "HP:0001250": ["seizures", "epilepsy", "convulsion"],
    "HP:0001252": ["low muscle tone"],
    "HP:0001263": ["developmental delay", "delayed development"],
    "HP:0001270": ["delayed motor development"],
    "HP:0001337": ["shaking"],
};
const options = hpoTerms.map(([id, label]) => {
    const normalizedLabel = normalizeSearchValue(label);
    const normalizedId = normalizeSearchValue(id);
    const normalizedAliases = (aliases[id] || []).map(normalizeSearchValue);
    return { id, label, normalizedLabel, normalizedId, aliases: normalizedAliases,
        searchKey: [normalizedLabel, normalizedId, ...normalizedAliases].join(" ") };
});
const names = new Map(options.map(option => [option.id, option.label]));

export function hpoLabel(id) { return names.get(id) || id; }
export function hpoSuggestions(value) {
    return findSearchOptions(options, String(value || "").replace(/;/g, ","));
}
export function selectHpoSuggestion(value, id) {
    const text = String(value || "");
    const separator = Math.max(text.lastIndexOf(","), text.lastIndexOf(";"));
    const prefix = separator < 0 ? "" : text.slice(0, separator + 1).trim();
    return `${prefix ? prefix + " " : ""}${id}, `;
}
export function resolveHpoTerms(value) {
    const text = String(value || "").trim();
    if (!text) throw new Error("Enter at least one HPO term.");
    const terms = [];
    for (const segment of text.split(/[,;]+/).map(part => part.trim()).filter(Boolean)) {
        if (/^(?:HP:\d{7}\s*)+$/i.test(segment)) {
            terms.push(...segment.toUpperCase().match(/HP:\d{7}/g));
            continue;
        }
        if (/^HP:/i.test(segment)) throw new Error(`${segment.toUpperCase()} is not a valid HPO ID.`);
        const normalized = normalizeSearchValue(segment);
        const exact = options.filter(option => option.normalizedLabel === normalized || option.aliases.includes(normalized));
        if (exact.length !== 1) throw new Error(`Select an HPO suggestion for "${segment}".`);
        terms.push(exact[0].id);
    }
    if (!terms.length) throw new Error("Enter at least one HPO term.");
    return [...new Set(terms)];
}
export async function contextApiFailure(response) {
    let payload = {};
    try { payload = await response.json(); } catch (_) { /* Non-JSON proxy error. */ }
    const detail = String(payload.detail || "");
    if (response.status === 400 && detail.startsWith("missing query HPO columns:")) {
        const missingTerms = [...new Set(detail.match(/HP:\d{7}/g) || [])];
        return {
            message: `These phenotypes are not in our cohort HPO list: ${missingTerms.join(", ")}.`,
            missingTerms,
        };
    }
    return { message: detail || `HPO analysis returned ${response.status}.`, missingTerms: [] };
}
export async function contextApiError(response) {
    return (await contextApiFailure(response)).message;
}
