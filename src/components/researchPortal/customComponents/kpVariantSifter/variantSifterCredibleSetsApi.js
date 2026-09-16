import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";
import {
    gwasCeCredibleSetsIndex,
    gwasCeCredibleVariantsIndex,
    resolveGwasCeToken,
    VKS_ASSOCIATION_PROJECT_GWAS_CE,
    VKS_ASSOCIATION_PROJECT_KP,
    VKS_GWAS_CE_BIOINDEX_HOST,
} from "./variantSifterProjects.js";

const CREDIBLE_SETS_INDEX = "credible-sets";
const CREDIBLE_VARIANTS_INDEX = "credible-variants";

/**
 * List credible sets available at the searched locus (KP BioIndex).
 * Mixed / primary (no ancestry): `phenotype,region`
 * Sub-ancestry: `phenotype,ancestry,region`
 */
export async function fetchCredibleSetsList(session, host, options = {}) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const ancestry = options.ancestry;
    const q =
        ancestry && ancestry !== "Mixed"
            ? `${phenotype},${ancestry},${region}`
            : `${phenotype},${region}`;
    const data = await query(CREDIBLE_SETS_INDEX, q, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * Tag list rows with the ancestry (and optional phenotype) used for the query.
 */
export function tagCredibleSetEntries(
    entries,
    ancestry,
    phenotypeName = null,
    project = null
) {
    const code = ancestry || "Mixed";
    const phenotype = String(phenotypeName || "").trim();
    const projectLabel = String(project || "").trim();
    return (entries || []).map((entry) => ({
        ...entry,
        ancestry: code,
        phenotype: entry.phenotype || phenotype || "",
        ...(projectLabel ? { project: projectLabel } : {}),
    }));
}

export function tagCredibleSetEntriesWithProject(entries, project) {
    const projectLabel = String(project || "").trim();
    if (!projectLabel) {
        return entries || [];
    }
    return (entries || []).map((entry) => ({
        ...entry,
        project: entry.project || projectLabel,
    }));
}

export function credibleSetAvailableKey(entry) {
    return `${entry?.credibleSetId || ""}|${entry?.phenotype || ""}|${
        entry?.ancestry || "Mixed"
    }|${entry?.project || ""}`;
}

export function mergeCredibleSetAvailableLists(lists) {
    const seen = new Set();
    const out = [];
    (lists || []).forEach((list) => {
        (list || []).forEach((entry) => {
            const key = credibleSetAvailableKey(entry);
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            out.push(entry);
        });
    });
    return out;
}

/**
 * Mixed list plus one fetch per selected sub-ancestry.
 */
export async function fetchCredibleSetsListForAncestries(
    session,
    host,
    ancestries = [],
    { project = null } = {}
) {
    const phenotypeName = session?.phenotype?.name || null;
    const primary = tagCredibleSetEntries(
        await fetchCredibleSetsList(session, host),
        "Mixed",
        phenotypeName,
        project
    );
    const subCodes = [
        ...new Set(
            (ancestries || []).filter((code) => code && code !== "Mixed")
        ),
    ];
    const extras = await Promise.all(
        subCodes.map(async (ancestry) =>
            tagCredibleSetEntries(
                await fetchCredibleSetsList(session, host, { ancestry }),
                ancestry,
                phenotypeName,
                project
            )
        )
    );
    return mergeCredibleSetAvailableLists([primary, ...extras]);
}

/**
 * GWAS-CE overlay: credible-sets-{token} with q=token,region.
 * Soft-fails to [] when the token has no CS index uploaded.
 */
export async function fetchGwasCeCredibleSetsList(session) {
    const token = resolveGwasCeToken(session);
    const region = formatRegion(session?.region);
    if (!token || !region) {
        return [];
    }

    try {
        const data = await query(gwasCeCredibleSetsIndex(token), `${token},${region}`, {
            host: VKS_GWAS_CE_BIOINDEX_HOST,
        });
        return (Array.isArray(data) ? data : []).map((entry) => ({
            ...entry,
            phenotype: entry.phenotype || token,
            ancestry: entry.ancestry || "Mixed",
            project: VKS_ASSOCIATION_PROJECT_GWAS_CE,
        }));
    } catch (error) {
        console.warn("Variant Sifter GWAS-CE credible sets list failed", error);
        return [];
    }
}

/**
 * Fetch credible variants for a single credible set id.
 * Mixed / primary: `phenotype,credibleSetId`
 * Ancestry-specific: `phenotype,ancestry,credibleSetId`
 */
export async function fetchCredibleSetVariants(
    session,
    credibleSetId,
    host,
    options = {}
) {
    const phenotype = session.phenotype.name;
    const ancestry = options.ancestry;
    const q =
        ancestry && ancestry !== "Mixed"
            ? `${phenotype},${ancestry},${credibleSetId}`
            : `${phenotype},${credibleSetId}`;
    const data = await query(CREDIBLE_VARIANTS_INDEX, q, { host });
    return Array.isArray(data) ? data : [];
}

/**
 * GWAS-CE overlay: credible-variants-{token} with q=token,credibleSetId.
 */
export async function fetchGwasCeCredibleSetVariants(session, credibleSetId) {
    const token = resolveGwasCeToken(session);
    if (!token || !credibleSetId) {
        return [];
    }
    const data = await query(
        gwasCeCredibleVariantsIndex(token),
        `${token},${credibleSetId}`,
        { host: VKS_GWAS_CE_BIOINDEX_HOST }
    );
    return Array.isArray(data) ? data : [];
}

export function isGwasCeCredibleSetEntry(entry) {
    return (
        String(entry?.project || "").trim() === VKS_ASSOCIATION_PROJECT_GWAS_CE
    );
}

export function isKpCredibleSetEntry(entry) {
    const project = String(entry?.project || "").trim();
    return !project || project === VKS_ASSOCIATION_PROJECT_KP;
}
