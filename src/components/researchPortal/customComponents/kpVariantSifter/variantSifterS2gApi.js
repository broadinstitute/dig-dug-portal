import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { normalizeVariantLinkRows } from "./variantSifterS2gData.js";

/**
 * Fetch SNP-to-gene links for a locus (`variant-links?q=chr:start-end`).
 */
export async function fetchVariantLinks(region, host) {
    const regionQuery = formatRegion(region);
    if (!regionQuery) {
        return [];
    }

    const data = await query("variant-links", regionQuery, { host });
    return normalizeVariantLinkRows(Array.isArray(data) ? data : []);
}
