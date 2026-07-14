import { query, request } from "@/utils/bioIndexUtils";
import {
    ancestryLabel,
    formatRegion,
    VARIANT_SIFTER_ANCESTRY_OPTIONS,
} from "./variantSifterSearchUtils.js";

/**
 * Ancestry codes that can be probed / loaded via ancestry-associations.
 * Mixed uses the combined `associations` index instead.
 */
export function ancestryAssociationCodes() {
    return VARIANT_SIFTER_ANCESTRY_OPTIONS.filter((code) => code && code !== "Mixed");
}

export function primaryAssociationAncestry(session) {
    return session?.ancestry || "Mixed";
}

/**
 * Mixed ancestry uses the combined associations index; specific ancestries
 * use ancestry-associations.
 */
export function resolveAssociationsRequest(session) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const ancestry = session.ancestry;

    if (ancestry && ancestry !== "Mixed") {
        return {
            index: "ancestry-associations",
            q: `${phenotype},${ancestry},${region}`,
        };
    }

    return {
        index: "associations",
        q: `${phenotype},${region}`,
    };
}

export async function fetchAssociations(session, host) {
    const { index, q } = resolveAssociationsRequest(session);
    const data = await query(index, q, { host });
    const rows = Array.isArray(data) ? data : [];

    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });

    return { index, q, rows };
}

export async function fetchAssociationsForRegion(session, region, host) {
    return fetchAssociations(
        {
            ...session,
            region,
        },
        host
    );
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
export async function probeAncestryAssociationAvailability(session, host) {
    const phenotype = session?.phenotype;
    const region = session?.region;
    if (!phenotype?.name || !region || !host) {
        return [];
    }

    const codes = ancestryAssociationCodes();
    const results = await Promise.all(
        codes.map(async (code) => {
            const q = ancestryAssociationsCountQuery(phenotype, code, region);
            try {
                const count = await countBioIndex("ancestry-associations", q, host);
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
