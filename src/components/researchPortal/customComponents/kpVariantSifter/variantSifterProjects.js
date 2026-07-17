/**
 * Variant Sifter "Project" — selects BioIndex host + phenotype/ancestry catalogs.
 *
 * Default (no project): portal BioIndex host (`biDomain()`), full phenotype prop list,
 * KP ancestry options. Giant: dedicated BioIndex host + curated phenotype/ancestry lists.
 *
 * Indexes present on the project BioIndex use that host; everything else (including
 * gene match / varIdLookup / genes / regions / tissue-regions / variant-links on Giant)
 * falls back to the default portal BioIndex. Non-BioIndex services (recomb, LD,
 * portaldev gene annotations) are unchanged.
 */

import { VARIANT_SIFTER_ANCESTRY_OPTIONS } from "./variantSifterSearchUtils.js";

/** Empty string = default / no project. */
export const VKS_PROJECT_DEFAULT_ID = "";

export const VKS_GIANT_PHENOTYPE_NAMES = [
    "BMI_GIANT",
    "HEIGHT_GIANT",
    "WHRadjBMI_female_GIANT",
    "WHRadjBMI_GIANT",
    "WHRadjBMI_male_GIANT",
    "WHRU_female_GIANT",
    "WHRU_GIANT",
    "WHRU_male_GIANT",
];

export const VKS_GIANT_ANCESTRIES = ["Mixed", "AA", "EA", "HS", "SA", "EU"];

export const VKS_GIANT_BIOINDEX_HOST = "https://giant.hugeampkpnbi.org";

/**
 * Indexes served by the Giant BioIndex that VKS can use there.
 * Ancestry-specific association queries also use `associations` (not a separate index).
 */
export const VKS_GIANT_BIOINDEX_INDEXES = new Set([
    "associations",
    "credible-sets",
    "credible-variants",
    "global-enrichment",
    "gene-links",
]);

/**
 * @typedef {object} VksProjectConfig
 * @property {string} id
 * @property {string} label
 * @property {string|null} bioIndexHost  null → use portal default host
 * @property {string[]|null} phenotypeNames  null → use portal phenotypesInUse
 * @property {string[]|null} ancestries  null → KP ancestry options
 * @property {Set<string>|null} bioIndexIndexes  null → all indexes on project host
 * @property {string} ancestryAssociationsIndex  index name for non-Mixed association queries
 */

/** @type {VksProjectConfig[]} */
export const VKS_PROJECTS = [
    {
        id: VKS_PROJECT_DEFAULT_ID,
        label: "Default (KP)",
        bioIndexHost: null,
        phenotypeNames: null,
        ancestries: null,
        bioIndexIndexes: null,
        ancestryAssociationsIndex: "ancestry-associations",
    },
    {
        id: "giant",
        label: "GIANT",
        bioIndexHost: VKS_GIANT_BIOINDEX_HOST,
        phenotypeNames: VKS_GIANT_PHENOTYPE_NAMES,
        ancestries: VKS_GIANT_ANCESTRIES,
        bioIndexIndexes: VKS_GIANT_BIOINDEX_INDEXES,
        ancestryAssociationsIndex: "associations",
    },
];

export function listVksProjects() {
    return VKS_PROJECTS.map((project) => ({
        id: project.id,
        label: project.label,
    }));
}

export function normalizeProjectId(value) {
    const id = value == null ? VKS_PROJECT_DEFAULT_ID : String(value).trim();
    if (!id) {
        return VKS_PROJECT_DEFAULT_ID;
    }
    return VKS_PROJECTS.some((project) => project.id === id)
        ? id
        : VKS_PROJECT_DEFAULT_ID;
}

export function getProjectConfig(projectId = VKS_PROJECT_DEFAULT_ID) {
    const id = normalizeProjectId(projectId);
    return (
        VKS_PROJECTS.find((project) => project.id === id) || VKS_PROJECTS[0]
    );
}

export function projectAncestryOptions(projectId = VKS_PROJECT_DEFAULT_ID) {
    const ancestries = getProjectConfig(projectId).ancestries;
    return Array.isArray(ancestries) && ancestries.length
        ? [...ancestries]
        : [...VARIANT_SIFTER_ANCESTRY_OPTIONS];
}

/**
 * Phenotypes shown in search for the active project.
 * Curated name lists synthesize entries when portal phenotypes omit them.
 */
export function projectPhenotypes(projectId, portalPhenotypes = []) {
    const names = getProjectConfig(projectId).phenotypeNames;
    const portal = Array.isArray(portalPhenotypes) ? portalPhenotypes : [];
    if (!Array.isArray(names) || !names.length) {
        return portal;
    }
    const byName = new Map(
        portal
            .filter((entry) => entry?.name)
            .map((entry) => [String(entry.name), entry])
    );
    return names.map((name) => {
        const key = String(name);
        return (
            byName.get(key) || {
                name: key,
                description: key,
            }
        );
    });
}

/**
 * Resolve which BioIndex index name to query (Giant folds ancestry into associations).
 */
export function resolveProjectQueryIndex(index, projectId = VKS_PROJECT_DEFAULT_ID) {
    const name = String(index || "");
    const config = getProjectConfig(projectId);
    if (
        name === "ancestry-associations" &&
        config.ancestryAssociationsIndex === "associations"
    ) {
        return "associations";
    }
    return name;
}

/**
 * Host for a logical VKS BioIndex index under the active project.
 * Falls back to the portal default host when the project BI does not serve it.
 */
export function resolveProjectBioIndexHost(
    index,
    projectId,
    defaultHost
) {
    const fallback = String(defaultHost || "").replace(/\/+$/, "");
    const config = getProjectConfig(projectId);
    if (!config.bioIndexHost) {
        return fallback;
    }
    const projectHost = String(config.bioIndexHost).replace(/\/+$/, "");
    const resolvedIndex = resolveProjectQueryIndex(index, projectId);
    if (
        !config.bioIndexIndexes ||
        config.bioIndexIndexes.has(resolvedIndex) ||
        config.bioIndexIndexes.has(String(index || ""))
    ) {
        return projectHost;
    }
    return fallback;
}

/** Primary BioIndex host label for Settings (project host or default). */
export function resolveProjectPrimaryBioIndexHost(projectId, defaultHost) {
    const config = getProjectConfig(projectId);
    if (config.bioIndexHost) {
        return String(config.bioIndexHost).replace(/\/+$/, "");
    }
    return String(defaultHost || "").replace(/\/+$/, "");
}
