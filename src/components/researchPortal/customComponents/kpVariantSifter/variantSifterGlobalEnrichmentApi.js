import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";
import {
    gwasCeGlobalEnrichmentIndex,
    resolveGwasCeToken,
    VKS_GWAS_CE_BIOINDEX_HOST,
} from "./variantSifterProjects.js";

export async function fetchGlobalEnrichment(session, host) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return [];
    }

    const data = await query("global-enrichment", phenotype, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * GWAS-CE: the dataset's own S-LDSC enrichment (`global-enrichment-{token}`,
 * `q=token`), built by the GWAS-CE sifter run. Soft-fails to [] when the index
 * does not exist (the run had no S-LDSC results) or the host is unreachable.
 */
export async function fetchGwasCeGlobalEnrichment(session) {
    const token = resolveGwasCeToken(session);
    if (!token) {
        return [];
    }

    try {
        const data = await query(gwasCeGlobalEnrichmentIndex(token), token, {
            host: VKS_GWAS_CE_BIOINDEX_HOST,
        });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn("Variant Sifter GWAS-CE global enrichment failed", error);
        return [];
    }
}

/**
 * Key GWAS-CE rows (phenotype = token, ancestry = upload metadata) to the
 * session's phenotype/ancestry, which is what every GE view filters on. The
 * original keys are kept as `sourcePhenotype` / `sourceAncestry`.
 */
export function adoptGwasCeGeRows(rows, session) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return [];
    }
    const ancestry = session?.ancestry || "Mixed";
    return (Array.isArray(rows) ? rows : []).map((row) => ({
        ...row,
        sourcePhenotype: row.phenotype,
        sourceAncestry: row.ancestry,
        phenotype,
        ancestry,
    }));
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
