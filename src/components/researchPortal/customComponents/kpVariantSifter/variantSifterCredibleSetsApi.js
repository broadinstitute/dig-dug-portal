import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";
import { makeCredibleSetSelectionKey } from "./variantSifterCredibleSetsFormat.js";
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
 * Tag list rows with the ancestry/phenotype used for the list query.
 * Keeps the full BioIndex row and stores query* fields so credible-variants
 * can reuse the same keys that returned this option.
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
    return (entries || []).map((entry) => {
        const queryPhenotype = phenotype || String(entry?.phenotype || "").trim();
        return {
            ...entry,
            // Ancestry/phenotype that keyed the list fetch (and should key variants).
            queryAncestry: code,
            queryPhenotype,
            ancestry: code,
            phenotype: queryPhenotype,
            ...(projectLabel ? { project: projectLabel } : {}),
        };
    });
}

/** Resolve list-row ancestry for a credible-variants query. */
export function credibleSetEntryQueryAncestry(entry, fallback = "Mixed") {
    const code = String(
        entry?.queryAncestry || entry?.ancestry || fallback || "Mixed"
    ).trim();
    return code || "Mixed";
}

/** Resolve list-row phenotype for a credible-variants query. */
export function credibleSetEntryQueryPhenotype(entry, fallback = "") {
    return String(
        entry?.queryPhenotype || entry?.phenotype || fallback || ""
    ).trim();
}

/**
 * Find a stored CS list row by selection key, then by id/ancestry/phenotype/project.
 */
export function findCredibleSetAvailableEntry(
    available,
    {
        selectionKey = "",
        credibleSetId = "",
        ancestry = "",
        phenotype = "",
        project = "",
    } = {}
) {
    const list = Array.isArray(available) ? available : [];
    const key = String(selectionKey || "").trim();
    if (key) {
        const byKey = list.find(
            (entry) =>
                makeCredibleSetSelectionKey(
                    entry?.credibleSetId,
                    credibleSetEntryQueryAncestry(entry),
                    credibleSetEntryQueryPhenotype(entry),
                    entry?.project || ""
                ) === key
        );
        if (byKey) {
            return byKey;
        }
    }

    const id = String(credibleSetId || "").trim();
    if (!id) {
        return null;
    }
    const resolvedAncestry = String(ancestry || "").trim() || "Mixed";
    const resolvedPhenotype = String(phenotype || "").trim();
    const resolvedProject = String(project || "").trim();

    return (
        list.find(
            (entry) =>
                entry?.credibleSetId === id &&
                credibleSetEntryQueryAncestry(entry) === resolvedAncestry &&
                (!resolvedPhenotype ||
                    credibleSetEntryQueryPhenotype(entry) === resolvedPhenotype) &&
                (!resolvedProject ||
                    String(entry?.project || "").trim() === resolvedProject)
        ) ||
        list.find(
            (entry) =>
                entry?.credibleSetId === id &&
                (!resolvedPhenotype ||
                    credibleSetEntryQueryPhenotype(entry) === resolvedPhenotype) &&
                (!resolvedProject ||
                    String(entry?.project || "").trim() === resolvedProject)
        ) ||
        list.find(
            (entry) =>
                entry?.credibleSetId === id &&
                (!resolvedProject ||
                    String(entry?.project || "").trim() === resolvedProject)
        ) ||
        list.find((entry) => entry?.credibleSetId === id) ||
        null
    );
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
 * Primary ancestry list plus one fetch per selected sub-ancestry.
 * Primary uses session.ancestry: Mixed → `phenotype,region`; else → `phenotype,ancestry,region`.
 */
export async function fetchCredibleSetsListForAncestries(
    session,
    host,
    ancestries = [],
    { project = null } = {}
) {
    const phenotypeName = session?.phenotype?.name || null;
    const primaryAncestry =
        session?.ancestry && session.ancestry !== "Mixed"
            ? session.ancestry
            : "Mixed";
    const primary = tagCredibleSetEntries(
        await fetchCredibleSetsList(session, host, {
            ancestry: primaryAncestry,
        }),
        primaryAncestry,
        phenotypeName,
        project
    );
    const subCodes = [
        ...new Set(
            (ancestries || []).filter(
                (code) =>
                    code && code !== "Mixed" && code !== primaryAncestry
            )
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
            queryPhenotype: entry.phenotype || token,
            ancestry: entry.ancestry || "Mixed",
            queryAncestry: entry.ancestry || "Mixed",
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
 *
 * Ancestry resolution: explicit `options.ancestry` wins; otherwise session.ancestry.
 */
export async function fetchCredibleSetVariants(
    session,
    credibleSetId,
    host,
    options = {}
) {
    const phenotype = session.phenotype.name;
    const ancestry =
        options.ancestry !== undefined
            ? options.ancestry
            : session?.ancestry;
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
