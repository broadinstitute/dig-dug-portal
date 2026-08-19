/**
 * Variant-to-gene (gene-links) state and helpers for Variant Sifter.
 * Method colors match Research portal `colors.bold` (ResearchGeneLinks).
 */

/** Research `colors.bold` — bars and method legend underlines. */
export const VKS_V2G_METHOD_COLORS = [
    "#007bff75",
    "#04884575",
    "#8490C875",
    "#BF61A575",
    "#EE312475",
    "#FCD70075",
    "#5555FF75",
    "#7aaa1c75",
    "#9F78AC75",
    "#F8808475",
    "#F5A4C775",
    "#CEE6C175",
    "#cccc0075",
    "#6FC7B675",
    "#D5A76875",
    "#d4d4d475",
];

export const VKS_V2G_VIEW_MODES = [
    { id: "tracks", label: "Tracks view" },
    { id: "ribbons", label: "Ribbons view" },
    { id: "arcs", label: "Arcs view" },
];

export const VKS_V2G_DEFAULT_VIEW_MODE = "tracks";

export function normalizeV2gViewMode(value) {
    if (value === "ribbons" || value === "arcs") {
        return value;
    }
    return "tracks";
}

export function emptyV2gState() {
    return {
        tissueData: {},
        selectedTissues: [],
        loadingTissue: null,
        error: null,
        tissueErrors: {},
        deselectedMethods: [],
        deselectedGenes: [],
        deselectedTissues: [],
        deselectedBiosamples: [],
        selectedLinks: [],
        viewMode: VKS_V2G_DEFAULT_VIEW_MODE,
    };
}

export function v2gLinkSelectionKey(tissue, gene, method) {
    return `${tissue || ""}:::${gene || ""}:::${method || ""}`;
}

export function normalizeV2gSelectedLinks(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return [
        ...new Set(
            value
                .map((item) => {
                    if (typeof item === "string" && item.includes(":::")) {
                        return item;
                    }
                    if (item && typeof item === "object") {
                        return v2gLinkSelectionKey(
                            item.tissue,
                            item.targetGene || item.gene,
                            item.method
                        );
                    }
                    return "";
                })
                .filter((key) => {
                    const parts = key.split(":::");
                    return (
                        parts.length === 3 &&
                        parts[0] &&
                        parts[1] &&
                        parts[2]
                    );
                })
        ),
    ].sort();
}

function normalizeStringList(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return [
        ...new Set(
            value
                .map((entry) => (entry == null ? "" : String(entry).trim()))
                .filter(Boolean)
        ),
    ].sort();
}

function normalizeTissueData(value) {
    if (!value || typeof value !== "object") {
        return {};
    }
    const tissueData = {};
    Object.entries(value).forEach(([tissue, rows]) => {
        if (!tissue || !Array.isArray(rows)) {
            return;
        }
        tissueData[tissue] = rows;
    });
    return tissueData;
}

/** Portable V2G snapshot for session export (loaded tissue links + filters). */
export function snapshotV2gForExport(state) {
    if (!state) {
        return null;
    }
    const tissueData = normalizeTissueData(state.tissueData);
    const selectedTissues = Array.isArray(state.selectedTissues)
        ? state.selectedTissues.filter((tissue) => Array.isArray(tissueData[tissue]))
        : Object.keys(tissueData);
    return {
        tissueData,
        selectedTissues,
        error: state.error || null,
        tissueErrors:
            state.tissueErrors && typeof state.tissueErrors === "object"
                ? { ...state.tissueErrors }
                : {},
        deselectedMethods: normalizeStringList(state.deselectedMethods),
        deselectedGenes: normalizeStringList(state.deselectedGenes),
        deselectedTissues: normalizeStringList(state.deselectedTissues),
        deselectedBiosamples: normalizeStringList(state.deselectedBiosamples),
        selectedLinks: normalizeV2gSelectedLinks(state.selectedLinks),
        viewMode: normalizeV2gViewMode(state.viewMode),
    };
}

export function normalizeV2gFromSession(exported) {
    if (!exported || typeof exported !== "object") {
        return emptyV2gState();
    }
    const tissueData = normalizeTissueData(exported.tissueData);
    const selectedFromExport = Array.isArray(exported.selectedTissues)
        ? exported.selectedTissues.filter(Boolean)
        : [];
    const selectedTissues = selectedFromExport.length
        ? selectedFromExport.filter((tissue) => Array.isArray(tissueData[tissue]))
        : Object.keys(tissueData).sort();

    return {
        ...emptyV2gState(),
        tissueData,
        selectedTissues,
        error: exported.error || null,
        tissueErrors:
            exported.tissueErrors && typeof exported.tissueErrors === "object"
                ? { ...exported.tissueErrors }
                : {},
        deselectedMethods: normalizeStringList(exported.deselectedMethods),
        deselectedGenes: normalizeStringList(exported.deselectedGenes),
        deselectedTissues: normalizeStringList(exported.deselectedTissues),
        deselectedBiosamples: normalizeStringList(exported.deselectedBiosamples),
        selectedLinks: normalizeV2gSelectedLinks(exported.selectedLinks),
        viewMode: normalizeV2gViewMode(exported.viewMode),
    };
}

/** BioIndex gene-links tissue key (spaces → underscores). */
export function normalizeV2gTissueKey(tissue) {
    return String(tissue || "")
        .trim()
        .replace(/\s+/g, "_");
}

export function displayV2gTissueLabel(tissue) {
    return String(tissue || "").replace(/_/g, " ");
}

/** Unique sorted tissues from global-enrichment rows (Research GL tissue source). */
export function collectTissueOptionsFromGeRows(geRows = []) {
    const seen = new Set();
    const tissues = [];
    (Array.isArray(geRows) ? geRows : []).forEach((row) => {
        const tissue = row?.tissue;
        if (!tissue || seen.has(tissue)) {
            return;
        }
        seen.add(tissue);
        tissues.push(tissue);
    });
    tissues.sort((a, b) => (a > b ? 1 : -1));
    return tissues;
}

export function collectMethodsFromTissueData(tissueData = {}) {
    const methods = [];
    Object.values(tissueData || {}).forEach((rows) => {
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            if (row?.method) {
                methods.push(row.method);
            }
        });
    });
    return [...new Set(methods)].sort();
}

export function collectGenesFromTissueData(tissueData = {}) {
    const genes = [];
    Object.values(tissueData || {}).forEach((rows) => {
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const gene = row?.targetGene || row?.gene;
            if (gene) {
                genes.push(gene);
            }
        });
    });
    return [...new Set(genes)].sort();
}

export function collectLoadedTissuesFromTissueData(tissueData = {}) {
    return Object.keys(tissueData || {})
        .filter((tissue) => Array.isArray(tissueData[tissue]) && tissueData[tissue].length)
        .sort((a, b) => (a > b ? 1 : -1));
}

export function collectBiosamplesFromTissueData(tissueData = {}) {
    const biosamples = [];
    Object.values(tissueData || {}).forEach((rows) => {
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const biosample = row?.biosample;
            if (biosample != null && String(biosample).trim() !== "") {
                biosamples.push(String(biosample));
            }
        });
    });
    return [...new Set(biosamples)].sort((a, b) => (a > b ? 1 : -1));
}

/** Stable key for tissue-scoped biosample filter checkboxes. */
export function v2gBiosampleFilterKey(tissue, biosample) {
    return `${tissue || ""}:::${biosample || ""}`;
}

/**
 * Biosamples grouped by tissue for filter UI.
 * @returns {{ tissue: string, biosamples: string[] }[]}
 */
export function collectBiosampleGroupsFromTissueData(tissueData = {}) {
    const groups = [];
    Object.keys(tissueData || {})
        .sort((a, b) => (a > b ? 1 : -1))
        .forEach((tissue) => {
            const rows = tissueData[tissue];
            if (!Array.isArray(rows) || !rows.length) {
                return;
            }
            const seen = new Set();
            const biosamples = [];
            rows.forEach((row) => {
                const biosample = row?.biosample;
                if (biosample == null || String(biosample).trim() === "") {
                    return;
                }
                const label = String(biosample);
                if (seen.has(label)) {
                    return;
                }
                seen.add(label);
                biosamples.push(label);
            });
            biosamples.sort((a, b) => (a > b ? 1 : -1));
            if (biosamples.length) {
                groups.push({ tissue, biosamples });
            }
        });
    return groups;
}

export function v2gMethodColor(method, methods = [], colors = VKS_V2G_METHOD_COLORS) {
    const index = methods.indexOf(method);
    if (index < 0 || !colors.length) {
        return colors[0] || "#007bff75";
    }
    return colors[index % colors.length];
}

export function solidV2gMethodColor(colorWithAlpha) {
    if (!colorWithAlpha || typeof colorWithAlpha !== "string") {
        return "#007bff";
    }
    if (colorWithAlpha.length === 9 && colorWithAlpha.startsWith("#")) {
        return colorWithAlpha.slice(0, 7);
    }
    return colorWithAlpha;
}

/**
 * Nested render model: tissue → gene → method → link records[].
 * Genes/methods/tissues/biosamples listed in deselected* are omitted.
 */
export function buildV2gRenderData(
    tissueData = {},
    deselectedMethods = [],
    deselectedGenes = [],
    deselectedTissues = [],
    deselectedBiosamples = []
) {
    const removedGenes = new Set(deselectedGenes || []);
    const removedMethods = new Set(deselectedMethods || []);
    const removedTissues = new Set(deselectedTissues || []);
    const removedBiosamples = new Set(deselectedBiosamples || []);
    const renderObj = {};

    Object.entries(tissueData || {}).forEach(([tissue, rows]) => {
        if (removedTissues.has(tissue)) {
            return;
        }
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const targetGene = row?.targetGene || row?.gene;
            const method = row?.method;
            const biosample =
                row?.biosample == null || String(row.biosample).trim() === ""
                    ? null
                    : String(row.biosample);
            if (!targetGene || !method) {
                return;
            }
            if (removedGenes.has(targetGene) || removedMethods.has(method)) {
                return;
            }
            if (biosample && removedBiosamples.has(v2gBiosampleFilterKey(tissue, biosample))) {
                return;
            }
            if (!renderObj[tissue]) {
                renderObj[tissue] = {};
            }
            if (!renderObj[tissue][targetGene]) {
                renderObj[tissue][targetGene] = {};
            }
            if (!renderObj[tissue][targetGene][method]) {
                renderObj[tissue][targetGene][method] = [];
            }
            renderObj[tissue][targetGene][method].push({
                start: row.start,
                end: row.end,
                method,
                biosample: row.biosample,
                targetGene,
                targetGeneStart: row.targetGeneStart,
                targetGeneEnd: row.targetGeneEnd,
                tissue,
                source: row.source,
                dataset: row.dataset,
                assay: row.assay,
            });
        });
    });

    return renderObj;
}

/**
 * Merge gene rows into tissue → method → link[] for ribbons / compact tracks.
 */
export function buildV2gMethodMergedData(
    tissueData = {},
    deselectedMethods = [],
    deselectedGenes = [],
    deselectedTissues = [],
    deselectedBiosamples = []
) {
    const renderData = buildV2gRenderData(
        tissueData,
        deselectedMethods,
        deselectedGenes,
        deselectedTissues,
        deselectedBiosamples
    );
    const merged = {};
    Object.entries(renderData).forEach(([tissue, genes]) => {
        merged[tissue] = {};
        Object.entries(genes || {}).forEach(([, methods]) => {
            Object.entries(methods || {}).forEach(([method, links]) => {
                if (!merged[tissue][method]) {
                    merged[tissue][method] = [];
                }
                merged[tissue][method].push(...links);
            });
        });
    });
    return merged;
}

/** Flat table rows for the V2G data table (respects method/gene/tissue/biosample filters). */
export function buildV2gTableRows(
    tissueData = {},
    deselectedMethods = [],
    deselectedGenes = [],
    deselectedTissues = [],
    deselectedBiosamples = []
) {
    const removedGenes = new Set(deselectedGenes || []);
    const removedMethods = new Set(deselectedMethods || []);
    const removedTissues = new Set(deselectedTissues || []);
    const removedBiosamples = new Set(deselectedBiosamples || []);
    const rows = [];

    Object.entries(tissueData || {}).forEach(([tissue, linkRows]) => {
        if (removedTissues.has(tissue)) {
            return;
        }
        (Array.isArray(linkRows) ? linkRows : []).forEach((row, index) => {
            const targetGene = row?.targetGene || row?.gene;
            const method = row?.method;
            const biosample =
                row?.biosample == null || String(row.biosample).trim() === ""
                    ? null
                    : String(row.biosample);
            if (!targetGene || !method) {
                return;
            }
            if (removedGenes.has(targetGene) || removedMethods.has(method)) {
                return;
            }
            if (biosample && removedBiosamples.has(v2gBiosampleFilterKey(tissue, biosample))) {
                return;
            }
            rows.push({
                id: `${tissue}:${targetGene}:${method}:${row.start}-${row.end}:${index}`,
                tissue,
                targetGene,
                method,
                biosample: row.biosample || "—",
                start: row.start,
                end: row.end,
                targetGeneStart: row.targetGeneStart,
                targetGeneEnd: row.targetGeneEnd,
                source: row.source || "—",
                dataset: row.dataset || "—",
            });
        });
    });

    rows.sort((a, b) => {
        if (a.tissue !== b.tissue) {
            return a.tissue > b.tissue ? 1 : -1;
        }
        if (a.targetGene !== b.targetGene) {
            return a.targetGene > b.targetGene ? 1 : -1;
        }
        if (a.method !== b.method) {
            return a.method > b.method ? 1 : -1;
        }
        return Number(a.start) - Number(b.start);
    });

    return rows;
}

export function hasV2gTrackData(state) {
    const tissueData = state?.tissueData || {};
    return Object.keys(tissueData).some(
        (tissue) => Array.isArray(tissueData[tissue]) && tissueData[tissue].length > 0
    );
}
