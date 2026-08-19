import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { normalizeV2gTissueKey } from "./variantSifterV2gData.js";

/**
 * Fetch variant-to-gene links for one tissue in a locus
 * (`gene-links?q=tissue,chr:start-end`).
 */
export async function fetchGeneLinks(tissue, region, host) {
    const tissueKey = normalizeV2gTissueKey(tissue);
    const regionQuery = formatRegion(region);
    if (!tissueKey || !regionQuery) {
        return [];
    }

    const data = await query("gene-links", `${tissueKey},${regionQuery}`, { host });
    return Array.isArray(data) ? data : [];
}
