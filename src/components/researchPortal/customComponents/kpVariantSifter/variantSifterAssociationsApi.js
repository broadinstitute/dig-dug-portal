import { query, request } from "@/utils/bioIndexUtils";
import {
    ancestryLabel,
    formatRegion,
} from "./variantSifterSearchUtils.js";
import {
    getProjectConfig,
    projectAncestryOptions,
    resolveProjectQueryIndex,
    VKS_PROJECT_DEFAULT_ID,
} from "./variantSifterProjects.js";

/**
 * Ancestry codes that can be probed / loaded via ancestry-specific association queries.
 * Mixed uses the combined `associations` index without an ancestry key.
 */
export function ancestryAssociationCodes(projectId = VKS_PROJECT_DEFAULT_ID) {
    return projectAncestryOptions(projectId).filter(
        (code) => code && code !== "Mixed"
    );
}

export function primaryAssociationAncestry(session) {
    return session?.ancestry || "Mixed";
}

/**
 * Mixed ancestry uses associations without ancestry key.
 * Specific ancestries use ancestry-associations on KP, or associations
 * with phenotype,ancestry,region on projects like Giant.
 */
export function resolveAssociationsRequest(
    session,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const ancestry = session.ancestry;
    getProjectConfig(projectId);

    if (ancestry && ancestry !== "Mixed") {
        const index = resolveProjectQueryIndex(
            "ancestry-associations",
            projectId
        );
        return {
            index,
            q: `${phenotype},${ancestry},${region}`,
            logicalIndex: "ancestry-associations",
        };
    }

    return {
        index: "associations",
        q: `${phenotype},${region}`,
        logicalIndex: "associations",
    };
}

export async function fetchAssociations(
    session,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const { index, q, logicalIndex } = resolveAssociationsRequest(
        session,
        projectId
    );
    const data = await query(index, q, { host });
    const rows = Array.isArray(data) ? data : [];

    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });

    return { index: logicalIndex || index, q, rows };
}

export async function fetchAssociationsForRegion(
    session,
    region,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    return fetchAssociations(
        {
            ...session,
            region,
        },
        host,
        projectId
    );
}

/**
 * Phenotype-wide top associations (same family as phenotype-page meta graph).
 * Mixed / empty ancestry → `global-associations`; otherwise ancestry-global.
 */
export function resolveGlobalAssociationsRequest(session) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return null;
    }
    const ancestry = session?.ancestry;
    if (ancestry && ancestry !== "Mixed") {
        return {
            index: "ancestry-global-associations",
            q: `${phenotype},${ancestry}`,
            logicalIndex: "ancestry-global-associations",
        };
    }
    return {
        index: "global-associations",
        q: phenotype,
        logicalIndex: "global-associations",
    };
}

export async function fetchGlobalAssociations(session, host, { limit = 1000 } = {}) {
    const request = resolveGlobalAssociationsRequest(session);
    if (!request) {
        return { index: null, q: null, rows: [] };
    }
    const data = await query(request.index, request.q, { host, limit });
    const rows = Array.isArray(data) ? data : [];
    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });
    return { index: request.logicalIndex, q: request.q, rows };
}

/**
 * BioIndex `/api/bio/count/{index}` — cheap availability probe (no full download).
 */
export async function countBioIndex(index, q, host) {
    if (!index || !q || !host) {
        return 0;
    }

    const resp = await request(`/api/bio/count/${index}`, { q }, host);
    if (!resp.ok) {
        throw new Error(`BioIndex count failed (${resp.status})`);
    }
    const json = await resp.json();
    const count = Number(json?.count);
    return Number.isFinite(count) ? count : 0;
}

export function ancestryAssociationsCountQuery(phenotype, ancestry, region) {
    const phenotypeName = phenotype?.name || phenotype;
    const regionQuery = typeof region === "string" ? region : formatRegion(region);
    if (!phenotypeName || !ancestry || !regionQuery) {
        return null;
    }
    return `${phenotypeName},${ancestry},${regionQuery}`;
}

/**
 * Probe which specific ancestries have association data for this phenotype × region.
 */
export async function probeAncestryAssociationAvailability(
    session,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const phenotype = session?.phenotype;
    const region = session?.region;
    if (!phenotype?.name || !region || !host) {
        return [];
    }

    const codes = ancestryAssociationCodes(projectId);
    const index = resolveProjectQueryIndex("ancestry-associations", projectId);
    const results = await Promise.all(
        codes.map(async (code) => {
            const q = ancestryAssociationsCountQuery(phenotype, code, region);
            try {
                const count = await countBioIndex(index, q, host);
                return {
                    code,
                    label: ancestryLabel(code),
                    count,
                    available: count > 0,
                    error: null,
                };
            } catch (error) {
                console.warn(`Variant Sifter ancestry count failed for ${code}`, error);
                return {
                    code,
                    label: ancestryLabel(code),
                    count: 0,
                    available: false,
                    error: error?.message || "Count failed",
                };
            }
        })
    );

    return results;
}

export function availableAncestryBubbles(availability = [], primaryAncestry = "Mixed") {
    const bubbles = (availability || []).filter((entry) => entry.available);
    if (primaryAncestry && primaryAncestry !== "Mixed") {
        const hasPrimary = bubbles.some((entry) => entry.code === primaryAncestry);
        if (!hasPrimary) {
            bubbles.unshift({
                code: primaryAncestry,
                label: ancestryLabel(primaryAncestry),
                count: null,
                available: true,
                error: null,
            });
        }
    }
    return bubbles;
}

export function associationRowAncestry(row, fallback = "Mixed") {
    return row?.Ancestry || fallback;
}

export function filterAssociationRowsByAncestry(
    rows,
    ancestry,
    primaryAncestry = "Mixed",
    selectedAncestries = []
) {
    if (!Array.isArray(rows)) {
        return [];
    }
    const target = ancestry || primaryAncestry;
    const secondary = new Set(
        (selectedAncestries || []).filter((code) => code && code !== primaryAncestry)
    );

    // Primary series keeps everything that is not an explicitly selected secondary.
    if (target === primaryAncestry) {
        return rows.filter((row) => {
            const rowAncestry = associationRowAncestry(row, primaryAncestry);
            return !secondary.has(rowAncestry);
        });
    }

    return rows.filter(
        (row) => associationRowAncestry(row, primaryAncestry) === target
    );
}

/**
 * Ordered association plot series: primary first, then additional selected ancestries.
 */
export function buildAssociationPlotSeries({
    rows = [],
    primaryAncestry = "Mixed",
    selectedAncestries = [],
} = {}) {
    const ordered = [primaryAncestry];
    (selectedAncestries || []).forEach((code) => {
        if (code && code !== primaryAncestry && !ordered.includes(code)) {
            ordered.push(code);
        }
    });

    return ordered.map((ancestry) => ({
        ancestry,
        label: ancestryLabel(ancestry),
        isPrimary: ancestry === primaryAncestry,
        rows: filterAssociationRowsByAncestry(
            rows,
            ancestry,
            primaryAncestry,
            selectedAncestries
        ),
    }));
}
