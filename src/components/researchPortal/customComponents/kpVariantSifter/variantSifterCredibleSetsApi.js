import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";

const CREDIBLE_SETS_INDEX = "credible-sets";
const CREDIBLE_VARIANTS_INDEX = "credible-variants";

/**
 * List credible sets available at the searched locus (KP BioIndex).
 */
export async function fetchCredibleSetsList(session, host) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const q = `${phenotype},${region}`;
    const data = await query(CREDIBLE_SETS_INDEX, q, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * Fetch credible variants for a single credible set id.
 */
export async function fetchCredibleSetVariants(session, credibleSetId, host) {
    const phenotype = session.phenotype.name;
    const q = `${phenotype},${credibleSetId}`;
    const data = await query(CREDIBLE_VARIANTS_INDEX, q, { host });
    return Array.isArray(data) ? data : [];
}
