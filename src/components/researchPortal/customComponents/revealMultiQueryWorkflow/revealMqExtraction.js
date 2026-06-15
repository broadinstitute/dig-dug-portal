/**
 * LLM extraction helpers for Multi Query REVEAL (pure functions).
 */

function normalizeLlmTermList(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) {
        return raw
            .map((t) => String(t || "").trim())
            .filter((t) => t && t !== "(none extracted)");
    }
    const s = String(raw).trim();
    if (!s || s === "(none extracted)") return [];
    return s
        .split(/[,;]|\n/)
        .map((x) => x.trim())
        .filter(Boolean);
}

function parseLlmJsonResponse(rawString) {
    const cleanString = (rawString || "")
        .replace(/```json|```/g, "")
        .replace(/[\r\n]+/g, " ")
        .trim();
    try {
        return { ok: true, json: JSON.parse(cleanString) };
    } catch (e) {
        return { ok: false, json: null, parseError: e };
    }
}

function buildHybridQueryText({ phenotypeTerms = [], mechanismTerms = [], researchContext = "" } = {}) {
    const skip = (s) => !s || s === "(none extracted)";
    const parts = [...(mechanismTerms || []), ...(phenotypeTerms || []), researchContext]
        .map((v) => String(v || "").trim())
        .filter((v) => !skip(v));
    return parts.join("\n");
}

const EXPLICIT_GENE_ALIAS_MAP = {
    ACVR1C: ["ACVR1C", "ALK7"],
    INHBE: ["INHBE", "ACTIVIN E", "ACTIVIN-E"],
};

function inferExplicitUserGenes(userQuery, genesOfInterest = []) {
    const query = String(userQuery || "").toUpperCase();
    return normalizeLlmTermList(genesOfInterest).filter((gene) => {
        const sym = String(gene || "").trim().toUpperCase();
        if (!sym) return false;
        const aliases = EXPLICIT_GENE_ALIAS_MAP[sym] || [sym];
        return aliases.some((alias) => query.includes(String(alias).toUpperCase()));
    });
}

function parseCommaSeparatedTerms(raw) {
    return String(raw || "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

export {
    buildHybridQueryText,
    inferExplicitUserGenes,
    normalizeLlmTermList,
    parseCommaSeparatedTerms,
    parseLlmJsonResponse,
};
