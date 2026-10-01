/**
 * Same-origin client for REVEAL mechanism-anchor suggestions.
 * Browser → /api/reveal/... → dig-dug-server (or webpack) → QA.
 */

const SUGGEST_PATH = "/api/reveal/v1/mechanisms/suggest";
const DEFAULT_MODEL = "cfde-inc-v2";
const DEFAULT_MODE = "semantic";

/**
 * @param {object} options
 * @param {{ id: string, source_id: string, source_revision: string }} options.sourceGap
 * @param {string} [options.subquery]
 * @param {"semantic"|"hybrid"} [options.mode]
 * @param {string} [options.model]
 * @returns {Promise<{ suggestionId: string|null, anchors: object[], limitations: string[], raw: object }>}
 */
export async function suggestMechanismAnchors({
    sourceGap,
    subquery = "",
    mode = DEFAULT_MODE,
    model = DEFAULT_MODEL,
} = {}) {
    if (
        !sourceGap ||
        typeof sourceGap.id !== "string" ||
        typeof sourceGap.source_id !== "string" ||
        typeof sourceGap.source_revision !== "string"
    ) {
        throw new Error("A selected gap with id, source_id, and source_revision is required.");
    }

    const response = await fetch(SUGGEST_PATH, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            source_gap: {
                id: sourceGap.id,
                source_id: sourceGap.source_id,
                source_revision: sourceGap.source_revision,
            },
            manual_eaggl_anchors: [],
            dismissed_source_ids: [],
            subquery: typeof subquery === "string" ? subquery : "",
            mode: mode || DEFAULT_MODE,
            model: model || DEFAULT_MODEL,
        }),
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
            `Mechanism suggestion failed (${response.status})`;
        const error = new Error(String(detail));
        error.status = response.status;
        error.body = body;
        throw error;
    }

    const anchors = Array.isArray(body && body.automatic_anchors)
        ? body.automatic_anchors.map(summarizeSuggestedAnchor).filter(Boolean)
        : [];

    return {
        suggestionId:
            body && typeof body.suggestion_id === "string" ? body.suggestion_id : null,
        anchors,
        limitations: Array.isArray(body && body.limitations)
            ? body.limitations.filter((item) => typeof item === "string")
            : [],
        raw: body || {},
    };
}

/** Normalize one Suggestions.automatic_anchors entry for compact UI cards. */
export function summarizeSuggestedAnchor(anchor) {
    if (!anchor || typeof anchor !== "object") {
        return null;
    }
    const factor = anchor.factor || {};
    const object = factor.object || {};
    const cfde = factor.cfde_anchor || {};
    const ranking = anchor.ranking || {};

    const label =
        (typeof cfde.label === "string" && cfde.label.trim()) ||
        (typeof object.name === "string" && object.name.trim()) ||
        "";
    const subtitle = typeof cfde.subtitle === "string" ? cfde.subtitle.trim() : "";
    const sourceId = typeof factor.source_id === "string" ? factor.source_id : null;

    if (!label && !sourceId) {
        return null;
    }

    return {
        label,
        subtitle,
        sourceId,
        nodeId: typeof cfde.node_id === "string" ? cfde.node_id : null,
        dapperId: typeof object.id === "string" ? object.id : null,
        rank: typeof ranking.rank === "number" ? ranking.rank : null,
        score: typeof ranking.value === "number" ? ranking.value : null,
        raw: anchor,
    };
}
