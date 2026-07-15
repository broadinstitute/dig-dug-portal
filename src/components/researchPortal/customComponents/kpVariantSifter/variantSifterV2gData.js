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
        viewMode: VKS_V2G_DEFAULT_VIEW_MODE,
    };
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
 * Genes/methods listed in deselected* are omitted (Research checkbox semantics).
 */
export function buildV2gRenderData(
    tissueData = {},
    deselectedMethods = [],
    deselectedGenes = []
) {
    const removedGenes = new Set(deselectedGenes || []);
    const removedMethods = new Set(deselectedMethods || []);
    const renderObj = {};

    Object.entries(tissueData || {}).forEach(([tissue, rows]) => {
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const targetGene = row?.targetGene || row?.gene;
            const method = row?.method;
            if (!targetGene || !method) {
                return;
            }
            if (removedGenes.has(targetGene) || removedMethods.has(method)) {
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
    deselectedGenes = []
) {
    const renderData = buildV2gRenderData(
        tissueData,
        deselectedMethods,
        deselectedGenes
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

/** Flat table rows for the V2G data table (respects method/gene filters). */
export function buildV2gTableRows(
    tissueData = {},
    deselectedMethods = [],
    deselectedGenes = []
) {
    const removedGenes = new Set(deselectedGenes || []);
    const removedMethods = new Set(deselectedMethods || []);
    const rows = [];

    Object.entries(tissueData || {}).forEach(([tissue, linkRows]) => {
        (Array.isArray(linkRows) ? linkRows : []).forEach((row, index) => {
            const targetGene = row?.targetGene || row?.gene;
            const method = row?.method;
            if (!targetGene || !method) {
                return;
            }
            if (removedGenes.has(targetGene) || removedMethods.has(method)) {
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
