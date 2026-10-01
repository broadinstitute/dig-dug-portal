/**
 * Same-origin client for REVEAL knowledge-gap search.
 * Browser → /api/reveal/... → dig-dug-server (or webpack) → QA.
 */

const SEARCH_PATH = "/api/reveal/v1/knowledge-gaps/search";

const DEFAULT_MODE = "fuzzy";
const DEFAULT_LIMIT = 8;

/**
 * @param {object} options
 * @param {string} options.q
 * @param {"fuzzy"|"lexical"|"semantic"|"hybrid"} [options.mode]
 * @param {number} [options.limit]
 * @returns {Promise<{ items: object[], page: object|null, search: object|null, raw: object }>}
 */
export async function searchKnowledgeGaps({ q, mode = DEFAULT_MODE, limit = DEFAULT_LIMIT } = {}) {
    const query = typeof q === "string" ? q.trim() : "";
    if (!query) {
        return { items: [], page: null, search: null, raw: { items: [] } };
    }

    const params = new URLSearchParams({
        q: query,
        mode: mode || DEFAULT_MODE,
        limit: String(Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, 50))),
    });
    const url = `${SEARCH_PATH}?${params.toString()}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
    });

    let body = null;
    try {
        body = await response.json();
    } catch (_err) {
        body = null;
    }

    if (!response.ok) {
        const detail =
            (body && (body.detail || body.error || body.message)) ||
            `Knowledge-gap search failed (${response.status})`;
        const error = new Error(String(detail));
        error.status = response.status;
        error.body = body;
        throw error;
    }

    const items = Array.isArray(body && body.items) ? body.items : [];
    return {
        items,
        page: (body && body.page) || null,
        search: (body && body.search) || null,
        raw: body || { items: [] },
    };
}

/** Normalize a GapHit for display cards. */
export function summarizeGapHit(hit) {
    const gap = (hit && hit.gap) || {};
    const obj = gap.object || {};
    const source = gap.source || {};
    const ranking = (hit && hit.ranking) || {};
    const attachments = Array.isArray(gap.attachments) ? gap.attachments : [];
    const detailRaw = (gap.source_detail && gap.source_detail.raw) || {};

    const description =
        typeof obj.gap_description === "string" ? obj.gap_description.trim() : "";
    const rationaleRaw =
        typeof detailRaw.rationale === "string" ? detailRaw.rationale.trim() : "";
    // Avoid duplicating identical description/rationale in the UI.
    const rationale =
        rationaleRaw && rationaleRaw !== description ? rationaleRaw : "";

    const evidence = Array.isArray(detailRaw.evidence)
        ? detailRaw.evidence
              .map((item) => {
                  if (!item || typeof item !== "object") {
                      return null;
                  }
                  return {
                      snippet: typeof item.snippet === "string" ? item.snippet.trim() : "",
                      supports: typeof item.supports === "string" ? item.supports : null,
                      reference: typeof item.reference === "string" ? item.reference.trim() : "",
                      referenceTitle:
                          typeof item.reference_title === "string"
                              ? item.reference_title.trim()
                              : "",
                      explanation:
                          typeof item.explanation === "string" ? item.explanation.trim() : "",
                      evidenceSource:
                          typeof item.evidence_source === "string" ? item.evidence_source : null,
                  };
              })
              .filter((item) => item && (item.snippet || item.reference || item.explanation))
        : [];

    return {
        id: typeof obj.id === "string" ? obj.id : null,
        text: typeof obj.text === "string" ? obj.text.trim() : "",
        description,
        rationale,
        evidence,
        scope: typeof obj.scope === "string" ? obj.scope.trim() : "",
        gapKind: typeof obj.gap_kind === "string" ? obj.gap_kind : null,
        diseaseLabel:
            typeof source.disease_label === "string" ? source.disease_label.trim() : "",
        sourceStatus: typeof source.status === "string" ? source.status : null,
        sourceId: typeof source.source_id === "string" ? source.source_id : null,
        sourceRevision:
            typeof source.source_revision === "string" ? source.source_revision : null,
        rankingMetric: typeof ranking.metric === "string" ? ranking.metric : null,
        rankingValue: typeof ranking.value === "number" ? ranking.value : null,
        rankingRank: typeof ranking.rank === "number" ? ranking.rank : null,
        attachmentLabels: attachments
            .map((a) => (a && typeof a.label === "string" ? a.label.trim() : ""))
            .filter(Boolean),
        raw: hit,
    };
}
