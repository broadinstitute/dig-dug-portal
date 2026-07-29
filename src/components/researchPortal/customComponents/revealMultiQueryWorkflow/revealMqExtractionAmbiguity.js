/**
 * Extraction-ambiguity and anti-anchor helpers for Multi Query REVEAL. All pure -- previously
 * called from `revealMqWorkflowOrchestrator.js` as `vm.<fn>` despite having no vm dependency.
 */

import { normalizeLlmTermList } from "./revealMqExtraction.js";

function normalizeAlternativeQueries(raw) {
    if (raw == null) return [];
    if (Array.isArray(raw)) {
        return raw
            .map((q) => String(q || "").trim())
            .filter(Boolean);
    }
    const s = String(raw).trim();
    if (!s) return [];
    return s
        .split(/\n|;/)
        .map((q) => q.replace(/^\d+[\).\s-]+/, "").trim())
        .filter(Boolean);
}

function normalizeExtractionAmbiguity(raw) {
    if (!raw || typeof raw !== "object") return null;
    const warningMessage =
        raw.warning_message != null
            ? String(raw.warning_message).trim()
            : (raw.warningMessage != null ? String(raw.warningMessage).trim() : "");
    const alternativeQueries = normalizeAlternativeQueries(
        raw.alternative_queries != null
            ? raw.alternative_queries
            : raw.alternativeQueries
    );
    const antiAnchorTerms = normalizeLlmTermList(
        raw.anti_anchor_terms != null
            ? raw.anti_anchor_terms
            : raw.antiAnchorTerms
    );
    const hasAmbiguityExplicit = raw.has_ambiguity === true || raw.hasAmbiguity === true;
    const hasAmbiguity = hasAmbiguityExplicit || !!warningMessage || alternativeQueries.length > 0;
    if (!hasAmbiguity) return null;
    return {
        has_ambiguity: true,
        warning_message: warningMessage || "Some terms in your query were interpreted using a default assumption.",
        alternative_queries: alternativeQueries,
        anti_anchor_terms: antiAnchorTerms,
    };
}

function mergeAlternativeQueries(...lists) {
    const out = [];
    const seen = new Set();
    lists.forEach((list) => {
        (Array.isArray(list) ? list : []).forEach((q) => {
            const text = String(q || "").trim();
            if (!text) return;
            const key = text.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            out.push(text);
        });
    });
    return out;
}

function detectAntiAnchorTerms(queryText) {
    const text = String(queryText || "").trim();
    if (!text) return [];
    const out = [];
    const seen = new Set();
    const add = (term) => {
        const t = String(term || "")
            .replace(/^[\s"'`]+|[\s"'`.,;:!?]+$/g, "")
            .trim();
        if (!t || t.length < 2) return;
        const key = t.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(t);
    };
    const patterns = [
        /\bnon[-\s]+([A-Za-z0-9-]{2,})\b/gi,
        /\bwithout\s+([A-Za-z0-9-]{2,})\b/gi,
        /\bindependent(?:ly)?\s+of\s+([A-Za-z0-9-]{2,})\b/gi,
        /\bexcept(?:\s+for)?\s+([A-Za-z0-9-]{2,})\b/gi,
        /\ball\s+other\s+than\s+([A-Za-z0-9-]{2,})\b/gi,
    ];
    patterns.forEach((re) => {
        let m;
        while ((m = re.exec(text)) !== null) {
            add(m[1]);
        }
    });
    return out;
}

function buildAntiAnchorFallbackAlternatives({ antiAnchorTerms = [], mechanismTerms = [], researchContext = "" } = {}) {
    const excludes = (Array.isArray(antiAnchorTerms) ? antiAnchorTerms : [])
        .map((t) => String(t || "").trim())
        .filter(Boolean);
    const mechs = (Array.isArray(mechanismTerms) ? mechanismTerms : [])
        .map((t) => String(t || "").trim())
        .filter(Boolean);
    if (!excludes.length) return [];
    const excludedLabel = excludes.join(", ");
    const contextHint = String(researchContext || "").trim();
    const out = [];
    out.push(
        `Find candidate genes for non-canonical mechanisms in the same biological context, using anchors other than ${excludedLabel}.`
    );
    mechs.slice(0, 2).forEach((m) => {
        out.push(
            `Find candidate genes for ${m} in the same tissue/process context, using positive anchors instead of ${excludedLabel}.`
        );
    });
    if (contextHint && out.length < 3) {
        out.push(
            `Find candidate genes for alternative pathways consistent with this context: ${contextHint}`
        );
    }
    return out.slice(0, 3);
}

function ensureAntiAnchorWarningMessage(warningMessage, antiAnchorTerms, alternativeQueries) {
    const terms = (Array.isArray(antiAnchorTerms) ? antiAnchorTerms : [])
        .map((t) => String(t || "").trim())
        .filter(Boolean);
    const alts = (Array.isArray(alternativeQueries) ? alternativeQueries : [])
        .map((q) => String(q || "").trim())
        .filter(Boolean);
    if (!terms.length) return String(warningMessage || "").trim();
    const base = String(warningMessage || "").trim();
    const hasProAnchorLanguage = /pro-anchor|positive anchor|translated.+anti-anchor/i.test(base);
    const anchorExamples = alts
        .slice(0, 2)
        .map((q) => q.replace(/^Find\s+/i, "").trim())
        .filter(Boolean)
        .join(" | ");
    const requiredSentence = anchorExamples
        ? `We translated the anti-anchor constraint into pro-anchor alternatives: ${anchorExamples}.`
        : "We translated the anti-anchor constraint into pro-anchor alternatives to keep retrieval focused.";
    if (!base) {
        return `You asked to exclude ${terms.join(", ")}. ${requiredSentence}`;
    }
    return hasProAnchorLanguage ? base : `${base} ${requiredSentence}`.trim();
}

export {
    buildAntiAnchorFallbackAlternatives,
    detectAntiAnchorTerms,
    ensureAntiAnchorWarningMessage,
    mergeAlternativeQueries,
    normalizeAlternativeQueries,
    normalizeExtractionAmbiguity,
};
