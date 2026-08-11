/**
 * Variant Sifter "Project" — selects BioIndex host + phenotype/ancestry catalogs.
 *
 * Default (no project): portal BioIndex host (`biDomain()`), full phenotype prop list,
 * KP ancestry options. Giant: dedicated BioIndex host + curated phenotype/ancestry lists.
 * GWAS-CE: token-gated associations BioIndex (`associations-{token}`) plus portal
 * phenotype/ancestry for GE and other companion layers.
 *
 * Indexes present on the project BioIndex use that host; everything else (including
 * gene match / varIdLookup / genes / regions / tissue-regions / variant-links on Giant)
 * falls back to the default portal BioIndex. Non-BioIndex services (recomb, LD,
 * portaldev gene annotations) are unchanged.
 */

import { VARIANT_SIFTER_ANCESTRY_OPTIONS } from "./variantSifterSearchUtils.js";

/** Empty string = default / no project. */
export const VKS_PROJECT_DEFAULT_ID = "";

/** GWAS Catalog CE — associations via access token; phenotype/ancestry for other layers. */
export const VKS_GWAS_CE_PROJECT_ID = "gwas-ce";

export const VKS_GWAS_CE_BIOINDEX_HOST =
    "https://gwas-ce.kpndataregistry.org/bioidx";

/** Placeholder written into exported session JSON instead of the real token. */
export const VKS_GWAS_CE_TOKEN_REDACTION = "$token";

/** Only associations are served from the GWAS-CE BioIndex host. */
export const VKS_GWAS_CE_BIOINDEX_INDEXES = new Set(["associations"]);

/**
 * Curated GIANT phenotype ids with display labels for search UI / header.
 * `name` is the BioIndex phenotype key; `description` is the friendly label.
 */
export const VKS_GIANT_PHENOTYPE_INFO = {
    BMI_GIANT: {
        description: "Body Mass Index (GIANT)",
    },
    HEIGHT_GIANT: {
        description: "Height (GIANT)",
    },
    WHRadjBMI_GIANT: {
        description: "Waist Hip Ratio adjusted BMI (GIANT)",
    },
    WHRadjBMI_female_GIANT: {
        description: "Waist Hip Ratio adjusted BMI, Female (GIANT)",
    },
    WHRadjBMI_male_GIANT: {
        description: "Waist Hip Ratio adjusted BMI, Male (GIANT)",
    },
    WHRU_GIANT: {
        description: "Waist Hip Ratio Unadjusted (GIANT)",
    },
    WHRU_female_GIANT: {
        description: "Waist Hip Ratio Unadjusted, Female (GIANT)",
    },
    WHRU_male_GIANT: {
        description: "Waist Hip Ratio Unadjusted, Male (GIANT)",
    },
};

export const VKS_GIANT_PHENOTYPE_NAMES = Object.keys(VKS_GIANT_PHENOTYPE_INFO);

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
    "c2ct-credible-set",
]);

/**
 * @typedef {object} VksProjectConfig
 * @property {string} id
 * @property {string} label
 * @property {string|null} bioIndexHost  null → use portal default host
 * @property {string[]|null} phenotypeNames  null → use portal phenotypesInUse
 * @property {Record<string, {description?: string, group?: string}>|null} phenotypeInfo
 * @property {string[]|null} ancestries  null → KP ancestry options; empty → hide ancestry UI
 * @property {Set<string>|null} bioIndexIndexes  null → all indexes on project host
 * @property {string} ancestryAssociationsIndex  index name for non-Mixed association queries
 * @property {boolean} [associationsOnly]  load associations (+ optional LD/recomb) only
 * @property {boolean} [tokenSearch]  welcome also requires a Token field (in addition to phenotype)
 * @property {boolean} [preferPostQuery]  BioIndex query via HTTP POST when supported
 */

/** @type {VksProjectConfig[]} */
export const VKS_PROJECTS = [
    {
        id: VKS_PROJECT_DEFAULT_ID,
        label: "Default (KP)",
        bioIndexHost: null,
        phenotypeNames: null,
        phenotypeInfo: null,
        ancestries: null,
        bioIndexIndexes: null,
        ancestryAssociationsIndex: "ancestry-associations",
        associationsOnly: false,
        tokenSearch: false,
        preferPostQuery: false,
    },
    {
        id: "giant",
        label: "GIANT",
        bioIndexHost: VKS_GIANT_BIOINDEX_HOST,
        phenotypeNames: VKS_GIANT_PHENOTYPE_NAMES,
        phenotypeInfo: VKS_GIANT_PHENOTYPE_INFO,
        ancestries: VKS_GIANT_ANCESTRIES,
        bioIndexIndexes: VKS_GIANT_BIOINDEX_INDEXES,
        ancestryAssociationsIndex: "associations",
        associationsOnly: false,
        tokenSearch: false,
        preferPostQuery: false,
    },
    {
        id: VKS_GWAS_CE_PROJECT_ID,
        label: "GWAS-CE",
        bioIndexHost: VKS_GWAS_CE_BIOINDEX_HOST,
        // Portal phenotype catalog + KP ancestries for GE / CS / companion layers.
        phenotypeNames: null,
        phenotypeInfo: null,
        ancestries: null,
        bioIndexIndexes: VKS_GWAS_CE_BIOINDEX_INDEXES,
        ancestryAssociationsIndex: "associations",
        associationsOnly: false,
        tokenSearch: true,
        // GWAS-CE BioIndex only supports GET/HEAD on /api/bio/query/{index}.
        preferPostQuery: false,
    },
];

export function isGwasCeProject(projectId = VKS_PROJECT_DEFAULT_ID) {
    return normalizeProjectId(projectId) === VKS_GWAS_CE_PROJECT_ID;
}

export function projectUsesTokenSearch(projectId = VKS_PROJECT_DEFAULT_ID) {
    return Boolean(getProjectConfig(projectId).tokenSearch);
}

export function projectAssociationsOnly(projectId = VKS_PROJECT_DEFAULT_ID) {
    return Boolean(getProjectConfig(projectId).associationsOnly);
}

export function projectHidesAncestry(projectId = VKS_PROJECT_DEFAULT_ID) {
    const ancestries = getProjectConfig(projectId).ancestries;
    return Array.isArray(ancestries) && ancestries.length === 0;
}

export function projectPrefersPostQuery(projectId = VKS_PROJECT_DEFAULT_ID) {
    return Boolean(getProjectConfig(projectId).preferPostQuery);
}

/** Normalize a GWAS-CE access token from session / welcome form. */
export function normalizeGwasCeToken(token) {
    return String(token || "").trim();
}

/** Index name for GWAS-CE associations: associations-{token}. */
export function gwasCeAssociationsIndex(token) {
    const id = normalizeGwasCeToken(token);
    return id ? `associations-${id}` : "associations";
}

/** Resolve the GWAS-CE token stored on a search session. */
export function resolveGwasCeToken(session) {
    return normalizeGwasCeToken(session?.gwasCeToken);
}
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
    // Explicit empty array = hide ancestry (e.g. GWAS-CE); null = portal defaults.
    if (Array.isArray(ancestries)) {
        return [...ancestries];
    }
    return [...VARIANT_SIFTER_ANCESTRY_OPTIONS];
}

/**
 * Merge portal phenotype row with optional project-curated display metadata.
 */
function resolveProjectPhenotypeEntry(name, portalEntry, phenotypeInfo) {
    const key = String(name);
    const info = phenotypeInfo?.[key] || null;
    const curatedDescription = String(info?.description || "").trim();
    const curatedGroup = String(info?.group || info?.category || "").trim();
    const base = portalEntry
        ? { ...portalEntry, name: portalEntry.name || key }
        : { name: key, description: "" };

    const portalDescription = String(base.description || "").trim();
    const description =
        curatedDescription ||
        (portalDescription && portalDescription !== key ? portalDescription : "");

    const next = {
        ...base,
        name: key,
        description,
    };
    if (curatedGroup) {
        next.group = curatedGroup;
    }
    return next;
}

/**
 * Phenotypes shown in search for the active project.
 * Curated name lists synthesize entries when portal phenotypes omit them,
 * and can supply friendly descriptions / groups for display.
 */
export function projectPhenotypes(projectId, portalPhenotypes = []) {
    const config = getProjectConfig(projectId);
    const names = config.phenotypeNames;
    const portal = Array.isArray(portalPhenotypes) ? portalPhenotypes : [];
    if (!Array.isArray(names)) {
        return portal;
    }
    if (!names.length) {
        return [];
    }
    const byName = new Map(
        portal
            .filter((entry) => entry?.name)
            .map((entry) => [String(entry.name), entry])
    );
    return names.map((name) =>
        resolveProjectPhenotypeEntry(name, byName.get(String(name)), config.phenotypeInfo)
    );
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
