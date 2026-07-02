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
