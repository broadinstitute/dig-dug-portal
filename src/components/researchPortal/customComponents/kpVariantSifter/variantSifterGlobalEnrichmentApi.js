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
