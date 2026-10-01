/**
 * Gap → CFDE KG search handoff across a new SCOPE tab (same page URL).
 * Uses localStorage + a short query token so noopener tabs still receive the payload.
 */

export const SCOPE_GAP_KG_HANDOFF_PREFIX = "reveal-scope-gap-kg-handoff:";
export const SCOPE_GAP_KG_HANDOFF_KIND = "reveal-scope-gap-kg-handoff";
export const SCOPE_GAP_KG_HANDOFF_VERSION = 1;
export const SCOPE_GAP_KG_QUERY_PARAM = "scope_gap_kg";

/**
 * Build free-text search input from a summarized gap hit.
 * Search CFDE KG uses only the gap label (inquiry text), same as a free-text
 * welcome input — entity extraction runs on that string alone.
 * @param {{ text?: string }} gap
 * @returns {string}
 */
export function buildGapSearchText(gap) {
    if (!gap || typeof gap !== "object") {
        return "";
    }
    return typeof gap.text === "string" ? gap.text.trim() : "";
}

function storageKey(token) {
    return `${SCOPE_GAP_KG_HANDOFF_PREFIX}${token}`;
}

/**
 * @param {{ hypothesisText: string }} payload
 * @returns {string|null} handoff token
 */
export function stashGapKgHandoff({ hypothesisText } = {}) {
    const text = typeof hypothesisText === "string" ? hypothesisText.trim() : "";
    if (!text || typeof localStorage === "undefined") {
        return null;
    }
    const token = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(
        storageKey(token),
        JSON.stringify({
            kind: SCOPE_GAP_KG_HANDOFF_KIND,
            version: SCOPE_GAP_KG_HANDOFF_VERSION,
            action: "searchCfdeKg",
            hypothesisText: text,
            createdAt: new Date().toISOString(),
        })
    );
    return token;
}

/**
 * Read and clear a pending handoff by token (from URL query).
 * @param {string} token
 * @returns {{ hypothesisText: string, action: string }|null}
 */
export function consumeGapKgHandoff(token) {
    if (!token || typeof localStorage === "undefined") {
        return null;
    }
    const key = storageKey(String(token));
    const raw = localStorage.getItem(key);
    if (!raw) {
        return null;
    }
    localStorage.removeItem(key);
    try {
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            parsed.kind !== SCOPE_GAP_KG_HANDOFF_KIND ||
            Number(parsed.version) !== SCOPE_GAP_KG_HANDOFF_VERSION ||
            parsed.action !== "searchCfdeKg" ||
            typeof parsed.hypothesisText !== "string" ||
            !parsed.hypothesisText.trim()
        ) {
            return null;
        }
        return {
            action: "searchCfdeKg",
            hypothesisText: parsed.hypothesisText.trim(),
        };
    } catch (_err) {
        return null;
    }
}

/**
 * Pull handoff token from the current URL (and strip it from the address bar).
 * @returns {string|null}
 */
export function takeGapKgHandoffTokenFromUrl() {
    if (typeof window === "undefined" || !window.location) {
        return null;
    }
    try {
        const url = new URL(window.location.href);
        const token = url.searchParams.get(SCOPE_GAP_KG_QUERY_PARAM);
        if (!token) {
            return null;
        }
        url.searchParams.delete(SCOPE_GAP_KG_QUERY_PARAM);
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", next);
        return token;
    } catch (_err) {
        return null;
    }
}

/** Open the current SCOPE page in a new tab after stashing the handoff. */
export function openGapKgSearchInNewTab(hypothesisText) {
    const token = stashGapKgHandoff({ hypothesisText });
    if (!token) {
        return false;
    }
    try {
        const url = new URL(window.location.href);
        url.searchParams.set(SCOPE_GAP_KG_QUERY_PARAM, token);
        window.open(url.toString(), "_blank", "noopener");
        return true;
    } catch (_err) {
        localStorage.removeItem(storageKey(token));
        return false;
    }
}
