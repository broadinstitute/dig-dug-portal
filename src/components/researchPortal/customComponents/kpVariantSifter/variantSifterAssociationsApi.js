import { query, request } from "@/utils/bioIndexUtils";
import {
    ancestryLabel,
    formatRegion,
} from "./variantSifterSearchUtils.js";
import {
    getProjectConfig,
    gwasCeAssociationsIndex,
    projectAncestryOptions,
    resolveGwasCeToken,
    resolveProjectQueryIndex,
    VKS_ASSOCIATION_PROJECT_KP,
    VKS_GWAS_CE_BIOINDEX_HOST,
    VKS_PROJECT_DEFAULT_ID,
} from "./variantSifterProjects.js";

/**
 * Ancestry codes that can be probed / loaded via ancestry-specific association queries.
 * Mixed uses the combined `associations` index without an ancestry key.
 */
export function ancestryAssociationCodes(projectId = VKS_PROJECT_DEFAULT_ID) {
    return projectAncestryOptions(projectId).filter(
        (code) => code && code !== "Mixed"
    );
}

export function primaryAssociationAncestry(session) {
    return session?.ancestry || "Mixed";
}

export function associationRowProject(row, fallback = VKS_ASSOCIATION_PROJECT_KP) {
    return row?.Project || fallback;
}

export function filterAssociationRowsByProject(
    rows,
    project = VKS_ASSOCIATION_PROJECT_KP
) {
    if (!Array.isArray(rows)) {
        return [];
    }
    return rows.filter(
        (row) => associationRowProject(row) === project
    );
}

/**
 * Mixed ancestry uses associations without ancestry key.
 * Specific ancestries use ancestry-associations on KP, or associations
 * with phenotype,ancestry,region on projects like Giant.
 * GWAS-CE token overlays are fetched separately via {@link fetchGwasCeAssociations}.
 */
export function resolveAssociationsRequest(
    session,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const region = formatRegion(session.region);
    const phenotype = session.phenotype.name;
    const ancestry = session.ancestry;
    getProjectConfig(projectId);

    if (ancestry && ancestry !== "Mixed") {
        const index = resolveProjectQueryIndex(
            "ancestry-associations",
            projectId
        );
        return {
            index,
            q: `${phenotype},${ancestry},${region}`,
            logicalIndex: "ancestry-associations",
        };
    }

    return {
        index: "associations",
        q: `${phenotype},${region}`,
        logicalIndex: "associations",
    };
}

/** GWAS-CE overlay: associations-{token} with q=token,region. */
export function resolveGwasCeAssociationsRequest(session) {
    const region = formatRegion(session?.region);
    const token = resolveGwasCeToken(session);
    if (!token || !region) {
        return {
            index: gwasCeAssociationsIndex(""),
            q: "",
            logicalIndex: "gwas-ce-associations",
            fmt: "row",
            host: VKS_GWAS_CE_BIOINDEX_HOST,
        };
    }
    return {
        index: gwasCeAssociationsIndex(token),
        q: `${token},${region}`,
        logicalIndex: "gwas-ce-associations",
        fmt: "row",
        host: VKS_GWAS_CE_BIOINDEX_HOST,
    };
}

export async function fetchAssociations(
    session,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const { index, q, logicalIndex, fmt } = resolveAssociationsRequest(
        session,
        projectId
    );
    const data = await query(index, q, { host, fmt });
    const rows = Array.isArray(data) ? data : [];

    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });

    return { index: logicalIndex || index, q, rows };
}

/**
 * Fetch GWAS-CE token associations (additive overlay). Uses the CE BioIndex host.
 */
export async function fetchGwasCeAssociations(session) {
    const token = resolveGwasCeToken(session);
    if (!token) {
        throw new Error("GWAS-CE access token is required.");
    }
    const { index, q, logicalIndex, fmt, host } =
        resolveGwasCeAssociationsRequest(session);
    if (!q) {
        return { index: logicalIndex, q, rows: [] };
    }
    const data = await query(index, q, { host, fmt });
    const rows = Array.isArray(data) ? data : [];

    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });

    return { index: logicalIndex || index, q, rows };
}

export async function fetchAssociationsForRegion(
    session,
    region,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    return fetchAssociations(
        {
            ...session,
            region,
        },
        host,
        projectId
    );
}

export async function fetchGwasCeAssociationsForRegion(session, region) {
    return fetchGwasCeAssociations({
        ...session,
        region,
    });
}

/**
 * Phenotype-wide top associations (same family as phenotype-page meta graph).
 * Mixed / empty ancestry → `global-associations`; otherwise ancestry-global.
 */
export function resolveGlobalAssociationsRequest(session) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return null;
    }
    const ancestry = session?.ancestry;
    if (ancestry && ancestry !== "Mixed") {
        return {
            index: "ancestry-global-associations",
            q: `${phenotype},${ancestry}`,
            logicalIndex: "ancestry-global-associations",
        };
    }
    return {
        index: "global-associations",
        q: phenotype,
        logicalIndex: "global-associations",
    };
}

export async function fetchGlobalAssociations(session, host, { limit = 1000 } = {}) {
    const request = resolveGlobalAssociationsRequest(session);
    if (!request) {
        return { index: null, q: null, rows: [] };
    }
    const data = await query(request.index, request.q, { host, limit });
    const rows = Array.isArray(data) ? data : [];
    rows.sort((a, b) => {
        const pA = a?.pValue ?? 1;
        const pB = b?.pValue ?? 1;
        return pA - pB;
    });
    return { index: request.logicalIndex, q: request.q, rows };
}

/**
 * BioIndex `/api/bio/count/{index}` — cheap availability probe (no full download).
 */
export async function countBioIndex(index, q, host) {
    if (!index || !q || !host) {
        return 0;
    }

    const resp = await request(`/api/bio/count/${index}`, { q }, host);
    if (!resp.ok) {
        throw new Error(`BioIndex count failed (${resp.status})`);
    }
    const json = await resp.json();
    const count = Number(json?.count);
    return Number.isFinite(count) ? count : 0;
}

export function ancestryAssociationsCountQuery(phenotype, ancestry, region) {
    const phenotypeName = phenotype?.name || phenotype;
    const regionQuery = typeof region === "string" ? region : formatRegion(region);
    if (!phenotypeName || !ancestry || !regionQuery) {
        return null;
    }
    return `${phenotypeName},${ancestry},${regionQuery}`;
}

/**
 * Probe which specific ancestries have association data for this phenotype × region.
 */
export async function probeAncestryAssociationAvailability(
    session,
    host,
    projectId = VKS_PROJECT_DEFAULT_ID
) {
    const phenotype = session?.phenotype;
    const region = session?.region;
    if (!phenotype?.name || !region || !host) {
        return [];
    }

    const codes = ancestryAssociationCodes(projectId);
    const index = resolveProjectQueryIndex("ancestry-associations", projectId);
    const results = await Promise.all(
        codes.map(async (code) => {
            const q = ancestryAssociationsCountQuery(phenotype, code, region);
            try {
                const count = await countBioIndex(index, q, host);
                return {
                    code,
                    label: ancestryLabel(code),
                    count,
                    available: count > 0,
                    error: null,
                };
            } catch (error) {
                console.warn(`Variant Sifter ancestry count failed for ${code}`, error);
                return {
                    code,
                    label: ancestryLabel(code),
                    count: 0,
                    available: false,
                    error: error?.message || "Count failed",
                };
            }
        })
    );

    return results;
}

export function availableAncestryBubbles(availability = [], primaryAncestry = "Mixed") {
    const bubbles = (availability || []).filter((entry) => entry.available);
    if (primaryAncestry && primaryAncestry !== "Mixed") {
        const hasPrimary = bubbles.some((entry) => entry.code === primaryAncestry);
        if (!hasPrimary) {
            bubbles.unshift({
                code: primaryAncestry,
                label: ancestryLabel(primaryAncestry),
                count: null,
                available: true,
                error: null,
            });
        }
    }
    return bubbles;
}

/**
 * Build ancestry bubble groups for primary + additional phenotypes.
 */
export function buildAncestryBubbleGroups({
    ancestryAvailabilityByPhenotype = {},
    primaryAncestry = "Mixed",
    primaryPhenotype = null,
    selectedPhenotypes = [],
    selectedAncestries = [],
    ancestrySeriesLoading = {},
    ancestryAvailabilityLoadingByPhenotype = {},
    ancestryAvailabilityErrorByPhenotype = {},
} = {}) {
    const groups = [];
    const primaryName =
        typeof primaryPhenotype === "string"
            ? primaryPhenotype
            : primaryPhenotype?.name || null;
    if (primaryName) {
        groups.push({
            phenotype: primaryName,
            label: phenotypeSeriesLabel(primaryPhenotype) || primaryName,
            isPrimary: true,
            bubbles: availableAncestryBubbles(
                ancestryAvailabilityByPhenotype[primaryName],
                primaryAncestry
            ),
            selectedAncestries: selectedAncestries || [],
            seriesLoading: ancestrySeriesLoading,
            loading: Boolean(ancestryAvailabilityLoadingByPhenotype[primaryName]),
            error: ancestryAvailabilityErrorByPhenotype[primaryName] || null,
        });
    }

    (selectedPhenotypes || []).forEach((entry) => {
        const name = typeof entry === "string" ? entry : entry?.name;
        if (!name || name === primaryName) {
            return;
        }
        groups.push({
            phenotype: name,
            label: phenotypeSeriesLabel(entry) || name,
            isPrimary: false,
            bubbles: availableAncestryBubbles(
                ancestryAvailabilityByPhenotype[name],
                primaryAncestry
            ),
            selectedAncestries:
                typeof entry === "string" ? [] : entry?.selectedAncestries || [],
            seriesLoading: ancestrySeriesLoading,
            loading: Boolean(ancestryAvailabilityLoadingByPhenotype[name]),
            error: ancestryAvailabilityErrorByPhenotype[name] || null,
        });
    });

    return groups;
}

export function ancestrySeriesLoadingKey(phenotypeName, ancestry) {
    return `${phenotypeName || ""}@@${ancestry || ""}`;
}

export function associationRowAncestry(row, fallback = "Mixed") {
    return row?.Ancestry || fallback;
}

export function associationRowPhenotype(row, fallback = "") {
    return row?.PhenotypeKey || row?.Phenotype || fallback;
}

export function phenotypeSeriesLabel(phenotype) {
    if (!phenotype) {
        return "";
    }
    if (typeof phenotype === "string") {
        return phenotype;
    }
    return (
        String(phenotype.description || "").trim() ||
        String(phenotype.name || "").trim()
    );
}

export function filterAssociationRowsByPhenotype(
    rows,
    phenotypeName,
    { treatUntaggedAsMatch = false } = {}
) {
    if (!Array.isArray(rows)) {
        return [];
    }
    const target = String(phenotypeName || "").trim();
    if (!target) {
        return rows.filter((row) => !row?.Phenotype);
    }
    return rows.filter((row) => {
        const rowPhenotype = associationRowPhenotype(row);
        if (!rowPhenotype) {
            return treatUntaggedAsMatch;
        }
        return rowPhenotype === target;
    });
}

export function filterAssociationRowsByAncestry(
    rows,
    ancestry,
    primaryAncestry = "Mixed",
    selectedAncestries = []
) {
    if (!Array.isArray(rows)) {
        return [];
    }
    const target = ancestry || primaryAncestry;
    const secondary = new Set(
        (selectedAncestries || []).filter((code) => code && code !== primaryAncestry)
    );

    // Primary series keeps everything that is not an explicitly selected secondary.
    if (target === primaryAncestry) {
        return rows.filter((row) => {
            const rowAncestry = associationRowAncestry(row, primaryAncestry);
            return !secondary.has(rowAncestry);
        });
    }

    return rows.filter(
        (row) => associationRowAncestry(row, primaryAncestry) === target
    );
}

/**
 * Ordered KP association plot series: primary phenotype × ancestries first,
 * then each additional phenotype with its selected ancestries.
 */
export function buildAssociationPlotSeries({
    rows = [],
    primaryAncestry = "Mixed",
    selectedAncestries = [],
    primaryPhenotype = null,
    selectedPhenotypes = [],
    project = VKS_ASSOCIATION_PROJECT_KP,
} = {}) {
    const projectRows = filterAssociationRowsByProject(rows, project);
    const primaryName =
        typeof primaryPhenotype === "string"
            ? primaryPhenotype
            : primaryPhenotype?.name || null;
    const primaryLabel =
        phenotypeSeriesLabel(primaryPhenotype) || primaryName || "Phenotype";

    const phenotypeOrder = [];
    if (primaryName) {
        phenotypeOrder.push({
            name: primaryName,
            label: primaryLabel,
            isPrimary: true,
            selectedAncestries: selectedAncestries || [],
        });
    } else {
        phenotypeOrder.push({
            name: null,
            label: "Associations",
            isPrimary: true,
            selectedAncestries: selectedAncestries || [],
        });
    }
    (selectedPhenotypes || []).forEach((entry) => {
        const name = typeof entry === "string" ? entry : entry?.name;
        if (!name || name === primaryName) {
            return;
        }
        if (phenotypeOrder.some((item) => item.name === name)) {
            return;
        }
        const entryAncestries =
            typeof entry === "string" ? [] : entry?.selectedAncestries || [];
        phenotypeOrder.push({
            name,
            label: phenotypeSeriesLabel(entry) || name,
            isPrimary: false,
            selectedAncestries: entryAncestries,
        });
    });

    const series = [];
    phenotypeOrder.forEach((phenotype) => {
        const phenotypeRows = filterAssociationRowsByPhenotype(
            projectRows,
            phenotype.name,
            { treatUntaggedAsMatch: phenotype.isPrimary }
        );
        const extras = phenotype.selectedAncestries || [];
        const ancestries = [primaryAncestry];
        extras.forEach((code) => {
            if (code && code !== primaryAncestry && !ancestries.includes(code)) {
                ancestries.push(code);
            }
        });

        ancestries.forEach((ancestry, ancestryIndex) => {
            const ancestryRows = filterAssociationRowsByAncestry(
                phenotypeRows,
                ancestry,
                primaryAncestry,
                extras
            );
            const multiPhenotype = phenotypeOrder.length > 1;
            const multiAncestry = ancestries.length > 1;
            series.push({
                phenotype: phenotype.name,
                phenotypeLabel: phenotype.label,
                ancestry,
                label:
                    multiPhenotype && !multiAncestry
                        ? phenotype.label
                        : ancestryLabel(ancestry),
                isPrimary: phenotype.isPrimary && ancestry === primaryAncestry,
                isPrimaryPhenotype: phenotype.isPrimary,
                showPhenotypeHeader: multiPhenotype && ancestryIndex === 0,
                showAncestryHeader: multiAncestry,
                project,
                rows: ancestryRows,
            });
        });
    });

    return series;
}
