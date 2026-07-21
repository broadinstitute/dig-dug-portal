/**
 * Persist the last few Variant Sifter searches in localStorage.
 */
import { formatRegion, formatSearchSessionLabel, parseSubAncestriesParam } from "./variantSifterSearchUtils.js";
import { normalizeProjectId, VKS_PROJECT_DEFAULT_ID } from "./variantSifterProjects.js";

export const VKS_RECENT_SEARCHES_KEY = "vks_recent_searches";
export const VKS_RECENT_SEARCHES_LIMIT = 5;

function canUseLocalStorage() {
    return typeof localStorage !== "undefined" && localStorage != null;
}

export function recentSearchIdentityKey(entry) {
    if (!entry) {
        return "";
    }
    return [
        normalizeProjectId(entry.projectId) || "",
        String(entry.phenotypeName || "").trim(),
        String(entry.ancestry || "").trim(),
        String(entry.regionLabel || "").trim(),
    ].join("|");
}

export function serializeRecentSearch(
    session,
    { projectId = VKS_PROJECT_DEFAULT_ID, subAncestries = [] } = {}
) {
    if (!session?.phenotype?.name || !session?.region) {
        return null;
    }
    const start = Number(session.region.start);
    const end = Number(session.region.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    const regionLabel =
        String(session.regionLabel || "").trim() || formatRegion(session.region);
    if (!regionLabel) {
        return null;
    }

    return {
        phenotypeName: String(session.phenotype.name).trim(),
        phenotypeDescription: String(session.phenotype.description || "").trim(),
        ancestry: session.ancestry || null,
        region: {
            chr: String(session.region.chr),
            start: Math.round(start),
            end: Math.round(end),
        },
        regionLabel,
        geneOrVariantQuery: String(session.geneOrVariantQuery || "").trim(),
        regionExpandBp:
            session.regionExpandBp == null || session.regionExpandBp === ""
                ? null
                : Number(session.regionExpandBp),
        projectId: normalizeProjectId(projectId),
        subAncestries: parseSubAncestriesParam(
            subAncestries,
            session.ancestry || "Mixed"
        ),
        timestamp: Date.now(),
    };
}

export function formatRecentSearchLabel(entry) {
    if (!entry) {
        return "";
    }
    return formatSearchSessionLabel({
        phenotype: {
            name: entry.phenotypeName,
            description: entry.phenotypeDescription,
        },
        ancestry: entry.ancestry,
        regionLabel: entry.regionLabel || entry.geneOrVariantQuery || "",
    });
}

function normalizeStoredEntry(raw) {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const phenotypeName = String(raw.phenotypeName || "").trim();
    const region = raw.region;
    const start = Number(region?.start);
    const end = Number(region?.end);
    const regionLabel =
        String(raw.regionLabel || "").trim() ||
        (region?.chr != null && Number.isFinite(start) && Number.isFinite(end)
            ? formatRegion({ chr: region.chr, start, end })
            : "");
    if (!phenotypeName || !regionLabel || !Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    return {
        phenotypeName,
        phenotypeDescription: String(raw.phenotypeDescription || "").trim(),
        ancestry: raw.ancestry || null,
        region: {
            chr: String(region.chr),
            start: Math.round(start),
            end: Math.round(end),
        },
        regionLabel,
        geneOrVariantQuery: String(raw.geneOrVariantQuery || "").trim(),
        regionExpandBp:
            raw.regionExpandBp == null || raw.regionExpandBp === ""
                ? null
                : Number(raw.regionExpandBp),
        projectId: normalizeProjectId(raw.projectId),
        subAncestries: parseSubAncestriesParam(
            raw.subAncestries,
            raw.ancestry || "Mixed"
        ),
        timestamp: Number(raw.timestamp) || 0,
    };
}

export function loadRecentSearches() {
    if (!canUseLocalStorage()) {
        return [];
    }
    try {
        const raw = localStorage.getItem(VKS_RECENT_SEARCHES_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed
            .map((entry) => normalizeStoredEntry(entry))
            .filter(Boolean)
            .slice(0, VKS_RECENT_SEARCHES_LIMIT);
    } catch (_error) {
        return [];
    }
}

export function saveRecentSearches(entries = []) {
    const next = (Array.isArray(entries) ? entries : [])
        .map((entry) => normalizeStoredEntry(entry))
        .filter(Boolean)
        .slice(0, VKS_RECENT_SEARCHES_LIMIT);
    if (!canUseLocalStorage()) {
        return next;
    }
    try {
        localStorage.setItem(VKS_RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch (_error) {
        // Private mode / quota — keep in-memory list only.
    }
    return next;
}

/**
 * Push a search to the front of the recent list (de-dupe by identity, keep last N).
 */
export function pushRecentSearch(session, options = {}) {
    const entry = serializeRecentSearch(session, options);
    if (!entry) {
        return loadRecentSearches();
    }
    const key = recentSearchIdentityKey(entry);
    const existing = loadRecentSearches().filter(
        (item) => recentSearchIdentityKey(item) !== key
    );
    return saveRecentSearches([entry, ...existing]);
}
