import { query } from "@/utils/bioIndexUtils";
import { formatRegion } from "./variantSifterSearchUtils.js";

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
export function tagCredibleSetEntries(entries, ancestry, phenotypeName = null) {
    const code = ancestry || "Mixed";
    const phenotype = String(phenotypeName || "").trim();
    return (entries || []).map((entry) => ({
        ...entry,
        ancestry: code,
        phenotype: entry.phenotype || phenotype || "",
    }));
}

export function credibleSetAvailableKey(entry) {
    return `${entry?.credibleSetId || ""}|${entry?.phenotype || ""}|${
        entry?.ancestry || "Mixed"
    }`;
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
    ancestries = []
) {
    const phenotypeName = session?.phenotype?.name || null;
    const primary = tagCredibleSetEntries(
        await fetchCredibleSetsList(session, host),
        "Mixed",
        phenotypeName
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
                phenotypeName
            )
        )
    );
    return mergeCredibleSetAvailableLists([primary, ...extras]);
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
