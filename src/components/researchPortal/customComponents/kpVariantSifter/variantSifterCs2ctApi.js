import { query } from "@/utils/bioIndexUtils";

export const VKS_CS2CT_CREDIBLE_SET_INDEX = "c2ct-credible-set";
export const VKS_CS2CT_MIN_OVERLAP_PPA = 0.5;

/**
 * Query key for c2ct-credible-set.
 * Mixed / missing ancestry → phenotype,credibleSetId
 * Ancestry-specific → phenotype,ancestry,credibleSetId
 */
export function buildCs2ctCredibleSetQuery(phenotypeName, credibleSetId, ancestry = null) {
    const phenotype = String(phenotypeName || "").trim();
    const csId = String(credibleSetId || "").trim();
    if (!phenotype || !csId) {
        return null;
    }
    if (ancestry && ancestry !== "Mixed") {
        return `${phenotype},${ancestry},${csId}`;
    }
    return `${phenotype},${csId}`;
}

export async function fetchCs2ctForCredibleSet(
    phenotypeName,
    credibleSetId,
    host,
    { ancestry = null } = {}
) {
    const q = buildCs2ctCredibleSetQuery(phenotypeName, credibleSetId, ancestry);
    if (!q || !host) {
        return [];
    }
    const data = await query(VKS_CS2CT_CREDIBLE_SET_INDEX, q, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * Fetch CS2CT rows for every available credible set (parallel, capped concurrency).
 */
export async function fetchCs2ctForCredibleSets(
    phenotypeName,
    credibleSets,
    host,
    { ancestry = null, concurrency = 6 } = {}
) {
    const sets = Array.isArray(credibleSets) ? credibleSets.filter((entry) => entry?.credibleSetId) : [];
    if (!sets.length || !host) {
        return [];
    }

    const rows = [];
    for (let i = 0; i < sets.length; i += concurrency) {
        const batch = sets.slice(i, i + concurrency);
        const batchRows = await Promise.all(
            batch.map(async (entry) => {
                try {
                    const csAncestry = entry.ancestry || ancestry;
                    return await fetchCs2ctForCredibleSet(
                        phenotypeName,
                        entry.credibleSetId,
                        host,
                        { ancestry: csAncestry }
                    );
                } catch (error) {
                    console.warn(
                        `Variant Sifter c2ct-credible-set fetch failed for ${entry.credibleSetId}`,
                        error
                    );
                    return [];
                }
            })
        );
        batchRows.forEach((chunk) => {
            if (chunk?.length) {
                rows.push(...chunk);
            }
        });
    }
    return rows;
}
