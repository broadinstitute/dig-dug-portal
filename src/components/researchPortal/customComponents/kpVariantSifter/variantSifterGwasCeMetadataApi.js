import {
    normalizeAncestryCode,
    VARIANT_SIFTER_ANCESTRY_OPTIONS,
} from "./variantSifterSearchUtils.js";

/** GWAS-CE / LD-server metadata host for token phenotype + ancestry. */
export const VKS_GWAS_CE_METADATA_HOST =
    "https://api.ldserver.kpndataregistry.org";

/**
 * Common 1000G / LD-server ancestry codes → KP Variant Sifter options.
 * Used when metadata returns EUR rather than EU, etc.
 */
export const GWAS_CE_METADATA_ANCESTRY_ALIASES = {
    ALL: "Mixed",
    MIXED: "Mixed",
    EUR: "EU",
    EAS: "EA",
    SAS: "SA",
    AFR: "AA",
    AMR: "HS",
};

/**
 * @typedef {object} GwasCeTokenMetadata
 * @property {string|null} phenotype
 * @property {string|null} ancestry
 * @property {string|null} genomeBuild
 */

/**
 * @param {string} token
 * @returns {string}
 */
export function gwasCeMetadataUrl(token) {
    const id = String(token || "").trim();
    return `${VKS_GWAS_CE_METADATA_HOST}/api/metadata/${encodeURIComponent(id)}`;
}

/**
 * Fetch phenotype / ancestry / genome_build for a GWAS-CE access token.
 * @param {string} token
 * @returns {Promise<GwasCeTokenMetadata>}
 */
export async function fetchGwasCeTokenMetadata(token) {
    const id = String(token || "").trim();
    if (!id) {
        throw new Error("Enter an access token before fetching metadata.");
    }

    const response = await fetch(gwasCeMetadataUrl(id));
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("No metadata found for that token.");
        }
        throw new Error(
            `Could not fetch token metadata (HTTP ${response.status}).`
        );
    }

    const json = await response.json();
    return {
        phenotype:
            json?.phenotype != null && String(json.phenotype).trim()
                ? String(json.phenotype).trim()
                : null,
        ancestry:
            json?.ancestry != null && String(json.ancestry).trim()
                ? String(json.ancestry).trim()
                : null,
        genomeBuild:
            json?.genome_build != null && String(json.genome_build).trim()
                ? String(json.genome_build).trim()
                : null,
    };
}

/**
 * Resolve a metadata ancestry string to a project ancestry option.
 * @param {string|null|undefined} code
 * @param {string[]} [ancestryOptions]
 * @returns {string|null}
 */
export function resolveGwasCeMetadataAncestry(
    code,
    ancestryOptions = VARIANT_SIFTER_ANCESTRY_OPTIONS
) {
    if (code == null || String(code).trim() === "") {
        return null;
    }
    const trimmed = String(code).trim();
    const direct = normalizeAncestryCode(trimmed);
    if (direct && ancestryOptions.includes(direct)) {
        return direct;
    }

    const alias =
        GWAS_CE_METADATA_ANCESTRY_ALIASES[trimmed.toUpperCase()] || null;
    if (alias && ancestryOptions.includes(alias)) {
        return alias;
    }

    const optionMatch = (ancestryOptions || []).find(
        (option) => String(option).toLowerCase() === trimmed.toLowerCase()
    );
    return optionMatch || null;
}

/**
 * Find a phenotype catalog entry matching the metadata phenotype key.
 * @param {string|null|undefined} phenotypeName
 * @param {object[]} phenotypes
 * @returns {object|null}
 */
export function resolveGwasCeMetadataPhenotype(phenotypeName, phenotypes = []) {
    if (phenotypeName == null || String(phenotypeName).trim() === "") {
        return null;
    }
    const key = String(phenotypeName).trim().toLowerCase();
    const list = Array.isArray(phenotypes) ? phenotypes : [];
    return (
        list.find((entry) => String(entry?.name || "").toLowerCase() === key) ||
        list.find(
            (entry) => String(entry?.description || "").toLowerCase() === key
        ) ||
        null
    );
}

/**
 * Apply token metadata to phenotype/ancestry UI state.
 * @returns {{
 *   phenotypeMatched: boolean,
 *   ancestryMatched: boolean,
 *   phenotype: object|null,
 *   ancestry: string|null,
 *   metadata: GwasCeTokenMetadata,
 *   mismatchMessage: string|null
 * }}
 */
export function applyGwasCeMetadataToSearchFields(
    metadata,
    { phenotypes = [], ancestryOptions = VARIANT_SIFTER_ANCESTRY_OPTIONS } = {}
) {
    const phenotype = resolveGwasCeMetadataPhenotype(
        metadata?.phenotype,
        phenotypes
    );
    const ancestry = resolveGwasCeMetadataAncestry(
        metadata?.ancestry,
        ancestryOptions
    );

    const phenotypeMatched = Boolean(phenotype);
    const ancestryMatched = Boolean(ancestry);
    const missing = [];
    if (!phenotypeMatched) {
        missing.push("phenotype");
    }
    if (!ancestryMatched) {
        missing.push("ancestry");
    }

    let mismatchMessage = null;
    if (missing.length) {
        const returned = [
            metadata?.phenotype
                ? `phenotype "${metadata.phenotype}"`
                : "phenotype (empty)",
            metadata?.ancestry
                ? `ancestry "${metadata.ancestry}"`
                : "ancestry (empty)",
        ].join(" and ");
        mismatchMessage =
            `Token metadata ${returned} ` +
            `${missing.length === 2 ? "do" : "does"} not match available ` +
            `options. Set ${missing.join(" and ")} manually to start a search.`;
    }

    return {
        phenotypeMatched,
        ancestryMatched,
        phenotype,
        ancestry,
        metadata,
        mismatchMessage,
    };
}
