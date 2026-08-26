import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";

export async function fetchGlobalEnrichment(session, host) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return [];
    }

    const data = await query("global-enrichment", phenotype, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * Replace rows for one phenotype while keeping other phenotypes' GE rows.
 */
export function mergeGeRowsByPhenotype(existingRows, nextRows, phenotypeName) {
    const target = String(phenotypeName || "").trim();
    const kept = (existingRows || []).filter(
        (row) => String(row?.phenotype || "").trim() !== target
    );
    return [...kept, ...(Array.isArray(nextRows) ? nextRows : [])];
}

export function removeGeRowsForPhenotype(existingRows, phenotypeName) {
    const target = String(phenotypeName || "").trim();
    if (!target) {
        return Array.isArray(existingRows) ? [...existingRows] : [];
    }
    return (existingRows || []).filter(
        (row) => String(row?.phenotype || "").trim() !== target
    );
}

export async function fetchLocusAnnotations(region, host) {
    const regionQuery = formatRegion(region);
    if (!regionQuery) {
        return [];
    }

    const data = await query("regions", regionQuery, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * Biosample-level annotation intervals for one tissue within a locus
 * (`tissue-regions?q=tissue,chr:start-end`).
 */
export async function fetchTissueRegions(tissue, region, host) {
    const regionQuery = formatRegion(region);
    if (!tissue || !regionQuery) {
        return [];
    }

    const data = await query("tissue-regions", `${tissue},${regionQuery}`, { host });
    return Array.isArray(data) ? data : [];
}
