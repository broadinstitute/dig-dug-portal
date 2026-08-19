/**
 * Association ↔ workspace mapping for Variant Sifter.
 *
 * Three layers — mapping / workspace filter must never mutate layers 1 or 2:
 *
 * 1. Raw workspace data
 *    Loaded association rows, credible-set variants, GE `annoData`, V2G/S2G
 *    `tissueData`, biosample region caches, etc.
 *
 * 2. Mappable option state
 *    Which features are available as mapping chips (from track selections such as
 *    GE tissues / biosamples / V2G·S2G links / credible sets) and which chips are
 *    checked (`mappingState.selectedCategoryIds` + And/Or mode).
 *
 * 3. Derived workspace mapping view
 *    Optional `workspaceMappingFilter` snapshot applied only when
 *    "Filter workspace to mapped data" is on. Visualizers read filtered views
 *    built from (1)+(2); turning the filter off restores full rendering from (1)
 *    with selections from (2) unchanged.
 */

import { ASSOCIATIONS_TABLE_FORMAT } from "./variantSifterAssociationsTableFormat.js";
import { resolveSelectedTissuesByAnnotation } from "./variantSifterGlobalEnrichmentData.js";
import {
    normalizeV2gSelectedLinks,
    v2gLinkSelectionKey,
} from "./variantSifterV2gData.js";

const CS_KEY_FIELD = ASSOCIATIONS_TABLE_FORMAT["custom table"]["Credible Set"]["key field"];
const CS_PPA_FIELD = ASSOCIATIONS_TABLE_FORMAT["custom table"]["Credible Set"]["PPA"];

/** Single table column for max PPA across matched credible sets (replaces per-set columns). */
export const VKS_CRED_SETS_COLUMN = "Cred. sets";
export const VKS_ANNOTATION_OVERLAP_COLUMN = "Annotation Overlap";
export const VKS_BIOSAMPLE_OVERLAP_COLUMN = "Biosample Overlap";
export const VKS_V2G_COLUMN = "V2G";
export const VKS_S2G_COLUMN = "S2G";

export const VKS_MAPPING_GROUP_COLORS = {
    "credible-sets": "#32AFD5",
    "global-enrichment": "#2c5c97",
    biosamples: "#048845",
    "variant-to-gene-links": "#7b4ea3",
    "snp2gene-links": "#e07b39",
};

export const VKS_MAPPING_GROUP_LABELS = {
    "credible-sets": "CS",
    "global-enrichment": "GE",
    biosamples: "GE",
    "variant-to-gene-links": "V2G",
    "snp2gene-links": "S2G",
};

export const VKS_MAPPING_DETAIL_COLUMNS = {
    "credible-sets": [
        { key: "label", label: "Cred. set" },
        { key: "ppa", label: "PPA", format: "scientific" },
        { key: "pValue", label: "P-value", format: "scientific" },
    ],
    "global-enrichment": [
        { key: "tissue", label: "Tissue" },
        { key: "biosample", label: "Biosample" },
        { key: "annotation", label: "Annotation" },
        { key: "region", label: "Region" },
        { key: "method", label: "Method" },
        { key: "source", label: "Source" },
        { key: "dataset", label: "Dataset" },
    ],
    biosamples: [
        { key: "tissue", label: "Tissue" },
        { key: "biosample", label: "Biosample" },
        { key: "annotation", label: "Annotation" },
        { key: "region", label: "Region" },
        { key: "method", label: "Method" },
        { key: "source", label: "Source" },
        { key: "dataset", label: "Dataset" },
    ],
    "variant-to-gene-links": [
        { key: "tissue", label: "Tissue" },
        { key: "biosample", label: "Biosample" },
        { key: "gene", label: "Gene" },
        { key: "method", label: "Method" },
        { key: "region", label: "Regulatory element" },
        { key: "promoter", label: "Promoter" },
    ],
    "snp2gene-links": [
        { key: "gene", label: "Gene" },
        { key: "method", label: "Method" },
        { key: "region", label: "Regulatory element" },
    ],
};

export function mappingGroupColor(groupId) {
    return VKS_MAPPING_GROUP_COLORS[groupId] || "#6b6b6b";
}

export function mappingGroupLabel(groupId) {
    return VKS_MAPPING_GROUP_LABELS[groupId] || "Map";
}

export function mappingDetailColumnsForGroup(groupId) {
    return (
        VKS_MAPPING_DETAIL_COLUMNS[groupId] ||
        VKS_MAPPING_DETAIL_COLUMNS["credible-sets"]
    );
}

export function getMappingDetailsForGroup(row, groupId) {
    const details = Array.isArray(row?.mappingDetails) ? row.mappingDetails : [];
    if (!groupId) {
        return details;
    }
    const groupIds = Array.isArray(groupId) ? groupId : [groupId];
    if (!groupIds.length) {
        return details;
    }
    const allowed = new Set(groupIds.filter(Boolean));
    return details.filter((entry) => allowed.has(entry?.groupId));
}

export function mappingDetailGroupIdsForColumn(column, tableFormat = null) {
    const formatting = tableFormat?.["column formatting"]?.[column];
    if (Array.isArray(formatting?.mappingDetailGroupIds)) {
        return formatting.mappingDetailGroupIds.filter(Boolean);
    }
    const groupId = mappingGroupIdForColumn(column, tableFormat);
    return groupId ? [groupId] : [];
}

export function mappingGroupIdForColumn(column, tableFormat = null) {
    const fromFormat =
        tableFormat?.["column formatting"]?.[column]?.mappingGroupId || null;
    if (fromFormat) {
        return fromFormat;
    }
    if (column === VKS_CRED_SETS_COLUMN) {
        return "credible-sets";
    }
    if (column === VKS_ANNOTATION_OVERLAP_COLUMN) {
        return "global-enrichment";
    }
    if (column === VKS_BIOSAMPLE_OVERLAP_COLUMN) {
        return "biosamples";
    }
    if (column === VKS_V2G_COLUMN) {
        return "variant-to-gene-links";
    }
    if (column === VKS_S2G_COLUMN) {
        return "snp2gene-links";
    }
    return null;
}

/**
 * Parse a mapping chip id back to its workspace selection source.
 * Ids: cs:… | ge:anno:::tissue | ge-bs:anno:::tissue:::biosample | v2g:… | s2g:…
 */
export function parseMappingCategoryId(categoryId) {
    const id = String(categoryId || "");
    if (!id) {
        return null;
    }
    if (id.startsWith("cs:")) {
        return {
            source: "credible-sets",
            selectionKey: id.slice("cs:".length),
        };
    }
    if (id.startsWith("ge-bs:")) {
        const [annotation, tissue, biosample] = id
            .slice("ge-bs:".length)
            .split(":::");
        if (!annotation || !tissue || biosample == null || biosample === "") {
            return null;
        }
        return {
            source: "biosamples",
            annotation,
            tissue,
            biosample,
            selectionKey: `${tissue}:::${biosample}`,
        };
    }
    if (id.startsWith("ge:")) {
        const [annotation, tissue] = id.slice("ge:".length).split(":::");
        if (!annotation || !tissue) {
            return null;
        }
        return {
            source: "global-enrichment",
            annotation,
            tissue,
        };
    }
    if (id.startsWith("v2g:")) {
        const [tissue, gene, method] = id.slice("v2g:".length).split(":::");
        if (!tissue || !gene || !method) {
            return null;
        }
        return {
            source: "variant-to-gene-links",
            tissue,
            gene,
            method,
            selectionKey: v2gLinkSelectionKey(tissue, gene, method),
        };
    }
    if (id.startsWith("s2g:")) {
        const [tissue, gene, method] = id.slice("s2g:".length).split(":::");
        if (!tissue || !gene || !method) {
            return null;
        }
        return {
            source: "snp2gene-links",
            tissue,
            gene,
            method,
            selectionKey: v2gLinkSelectionKey(tissue, gene, method),
        };
    }
    return null;
}

export const VKS_MAPPING_MODES = [
    { id: "or", label: "Or" },
    { id: "and", label: "And" },
];

export function normalizeMappingMode(value) {
    return value === "and" ? "and" : "or";
}

export function emptyMappingState() {
    return {
        selectedCategoryIds: [],
        mappingMode: "or",
    };
}

export function normalizeMappingState(value) {
    if (!value || typeof value !== "object") {
        return emptyMappingState();
    }
    return {
        selectedCategoryIds: Array.isArray(value.selectedCategoryIds)
            ? [...new Set(value.selectedCategoryIds.filter(Boolean).map(String))]
            : [],
        mappingMode: normalizeMappingMode(value.mappingMode),
    };
}

export function emptyWorkspaceMappingFilter() {
    return null;
}

export function normalizeWorkspaceMappingFilter(value) {
    if (!value || typeof value !== "object" || !value.active) {
        return null;
    }
    const variantIds = [
        ...new Set(
            (Array.isArray(value.variantIds) ? value.variantIds : [])
                .map((id) => String(id ?? ""))
                .filter(Boolean)
        ),
    ];
    const positions = [
        ...new Set(
            (Array.isArray(value.positions) ? value.positions : [])
                .map((pos) => Number(pos))
                .filter((pos) => Number.isFinite(pos))
        ),
    ].sort((left, right) => left - right);
    if (!variantIds.length && !positions.length) {
        return null;
    }
    return {
        active: true,
        variantIds,
        positions,
        selectedCategoryIds: Array.isArray(value.selectedCategoryIds)
            ? [...value.selectedCategoryIds]
            : [],
        mappingMode: normalizeMappingMode(value.mappingMode),
        rowCount: Number(value.rowCount) || variantIds.length,
    };
}

/**
 * Snapshot mapped association rows for filtering workspace visualizers.
 * Pure: does not mutate association rows or mapping selections.
 */
export function buildWorkspaceMappingFilter(
    associationRows,
    {
        mappingCategories = [],
        selectedCategoryIds = [],
        mappingMode = "or",
    } = {}
) {
    if (!Array.isArray(selectedCategoryIds) || !selectedCategoryIds.length) {
        return null;
    }
    const view = buildMappedVariantDataTableView(associationRows, {
        mappingCategories,
        selectedCategoryIds,
        mappingMode,
    });
    const variantIds = new Set();
    const positions = new Set();
    (view.rows || []).forEach((row) => {
        if (row?.[CS_KEY_FIELD]) {
            variantIds.add(String(row[CS_KEY_FIELD]));
        }
        if (row?.varId) {
            variantIds.add(String(row.varId));
        }
        const position = Number(row?.Position ?? row?.position);
        if (Number.isFinite(position)) {
            positions.add(position);
        }
    });
    return normalizeWorkspaceMappingFilter({
        active: true,
        variantIds: [...variantIds],
        positions: [...positions],
        selectedCategoryIds,
        mappingMode,
        rowCount: view.rows?.length || 0,
    });
}

export function applyWorkspaceMappingToAssociationRows(rows, filter) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    if (!normalized) {
        return Array.isArray(rows) ? rows : [];
    }
    const idSet = new Set(normalized.variantIds);
    return (Array.isArray(rows) ? rows : []).filter((row) => {
        if (row?.[CS_KEY_FIELD] && idSet.has(String(row[CS_KEY_FIELD]))) {
            return true;
        }
        if (row?.varId && idSet.has(String(row.varId))) {
            return true;
        }
        return false;
    });
}

export function regionOverlapsMappedPositions(region, positions = []) {
    const start = Number(region?.start);
    const end = Number(region?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !positions.length) {
        return false;
    }
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    return positions.some((position) => position >= lo && position <= hi);
}

export function filterRegionsByMappedPositions(regions = [], filter = null) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    if (!normalized) {
        return Array.isArray(regions) ? regions : [];
    }
    return (Array.isArray(regions) ? regions : []).filter((region) =>
        regionOverlapsMappedPositions(region, normalized.positions)
    );
}

/**
 * Keep credible-set / association-like variants that remain after workspace mapping.
 */
export function variantMatchesWorkspaceMapping(variant, filter = null) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    if (!normalized) {
        return true;
    }
    const idSet = new Set(normalized.variantIds);
    const candidates = [
        variant?.varId,
        variant?.[CS_KEY_FIELD],
        variant?.variantId,
        variant?.id,
    ];
    if (candidates.some((id) => id != null && idSet.has(String(id)))) {
        return true;
    }
    const position = Number(variant?.position ?? variant?.Position);
    if (!Number.isFinite(position) || !normalized.positions.length) {
        return false;
    }
    return normalized.positions.includes(position);
}

export function filterVariantsByWorkspaceMapping(variants = [], filter = null) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    if (!normalized) {
        return Array.isArray(variants) ? variants : [];
    }
    return (Array.isArray(variants) ? variants : []).filter((variant) =>
        variantMatchesWorkspaceMapping(variant, normalized)
    );
}

/**
 * GE tissue keys referenced by selected mapping categories, keyed by annotation.
 * Empty map → no GE tissue categories were selected (do not restrict by tissue id).
 */
export function mappedGeTissuesByAnnotationFromFilter(filter = null) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    const byAnnotation = new Map();
    if (!normalized) {
        return byAnnotation;
    }
    (normalized.selectedCategoryIds || []).forEach((categoryId) => {
        const id = String(categoryId || "");
        let annotation = "";
        let tissue = "";
        if (id.startsWith("ge-bs:")) {
            const rest = id.slice("ge-bs:".length);
            const parts = rest.split(":::");
            annotation = parts[0] || "";
            tissue = parts[1] || "";
        } else if (id.startsWith("ge:")) {
            const rest = id.slice("ge:".length);
            const parts = rest.split(":::");
            annotation = parts[0] || "";
            tissue = parts[1] || "";
        }
        if (!annotation || !tissue) {
            return;
        }
        if (!byAnnotation.has(annotation)) {
            byAnnotation.set(annotation, new Set());
        }
        byAnnotation.get(annotation).add(tissue);
    });
    return byAnnotation;
}

/**
 * Biosample selection keys (`tissue:::biosample`) referenced by mapping categories
 * for one annotation. Empty set → no biosample categories selected.
 */
export function mappedGeBiosampleKeysFromFilter(filter = null, annotation = "") {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    const keys = new Set();
    if (!normalized || !annotation) {
        return keys;
    }
    const prefix = `ge-bs:${annotation}:::`;
    (normalized.selectedCategoryIds || []).forEach((categoryId) => {
        const id = String(categoryId || "");
        if (!id.startsWith(prefix)) {
            return;
        }
        const rest = id.slice(prefix.length);
        const parts = rest.split(":::");
        const tissue = parts[0] || "";
        const biosample = parts.slice(1).join(":::");
        if (tissue && biosample) {
            keys.add(`${tissue}:::${biosample}`);
        }
    });
    return keys;
}

/**
 * Pure GE annotation view for workspace filter (layer 3).
 * Does not mutate `annoData`. When filter is inactive, returns the same reference.
 */
export function buildMappedAnnoDataView(annoData = {}, filter = null) {
    const normalized = normalizeWorkspaceMappingFilter(filter);
    if (!normalized) {
        return annoData || {};
    }
    const mappedTissuesByAnnotation =
        mappedGeTissuesByAnnotationFromFilter(normalized);
    const next = {};
    Object.entries(annoData || {}).forEach(([annotation, byTissue]) => {
        const mappedTissues = mappedTissuesByAnnotation.get(annotation);
        const tissues = {};
        Object.entries(byTissue || {}).forEach(([tissue, entry]) => {
            if (mappedTissues?.size && !mappedTissues.has(tissue)) {
                return;
            }
            const regions = filterRegionsByMappedPositions(
                entry?.region || [],
                normalized
            );
            if (!regions.length) {
                return;
            }
            tissues[tissue] = {
                ...entry,
                region: regions,
            };
        });
        if (Object.keys(tissues).length) {
            next[annotation] = tissues;
        }
    });
    return next;
}

/**
 * Pure biosample-region view for workspace filter (layer 3).
 * Does not mutate the source region list or biosample selections.
 */
export function buildMappedBiosampleRegionsView(
    regions = [],
    {
        filter = null,
        annotation = "",
        tissue = "",
    } = {}
) {
    let next = filterRegionsByMappedPositions(regions, filter);
    const mappedBiosamples = mappedGeBiosampleKeysFromFilter(filter, annotation);
    if (!mappedBiosamples.size || !tissue) {
        return next;
    }
    return next.filter((region) => {
        const biosample =
            region?.biosample == null || region.biosample === ""
                ? "—"
                : String(region.biosample);
        return mappedBiosamples.has(`${tissue}:::${biosample}`);
    });
}

export { v2gLinkSelectionKey, normalizeV2gSelectedLinks };

function formatV2gLinkLabel(tissue, gene, method) {
    return `V2G : ${tissue} : ${gene} : ${method}`;
}

function formatS2gLinkLabel(tissue, gene, method) {
    return `S2G : ${tissue} : ${gene} : ${method}`;
}

function rowVariantKeys(row) {
    const keys = new Set();
    if (row?.[CS_KEY_FIELD]) {
        keys.add(String(row[CS_KEY_FIELD]));
    }
    if (row?.varId) {
        keys.add(String(row.varId));
    }
    return keys;
}

function resolveCsPpa(csRow) {
    const value = csRow?.[CS_PPA_FIELD] ?? csRow?.PPA ?? csRow?.posteriorProbability;
    if (value == null || value === "") {
        return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
}

function resolveCsPValue(csRow) {
    const value = csRow?.["P-Value"] ?? csRow?.pValue ?? csRow?.pvalue;
    if (value == null || value === "") {
        return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
}

function appendMappingDetail(row, detail) {
    const next = { ...row };
    const details = Array.isArray(next.mappingDetails) ? [...next.mappingDetails] : [];
    const duplicate = details.some(
        (entry) =>
            entry?.groupId === detail.groupId &&
            entry?.label === detail.label &&
            entry?.region === detail.region &&
            entry?.tissue === detail.tissue &&
            entry?.biosample === detail.biosample &&
            entry?.method === detail.method &&
            entry?.source === detail.source &&
            entry?.dataset === detail.dataset &&
            entry?.ppa === detail.ppa
    );
    if (!duplicate) {
        details.push(detail);
    }
    next.mappingDetails = details;
    return next;
}

function positionOverlapsRegions(position, regions = []) {
    return findAllOverlappingRegions(position, regions).length > 0;
}

function findAllOverlappingRegions(position, regions = []) {
    const pos = Number(position);
    if (!Number.isFinite(pos) || !regions.length) {
        return [];
    }
    return (regions || [])
        .map((region) => {
            const start = Number(region?.start);
            const end = Number(region?.end);
            if (!Number.isFinite(start) || !Number.isFinite(end)) {
                return null;
            }
            const lo = Math.min(start, end);
            const hi = Math.max(start, end);
            if (pos < lo || pos > hi) {
                return null;
            }
            return {
                ...region,
                start: lo,
                end: hi,
                overlapLength: hi - lo + 1,
            };
        })
        .filter(Boolean);
}

function formatOverlapDisplay(details = []) {
    const withRegions = (details || []).filter(
        (entry) =>
            entry?.regionStart != null &&
            entry?.regionEnd != null &&
            Number.isFinite(Number(entry.regionStart)) &&
            Number.isFinite(Number(entry.regionEnd))
    );
    if (!withRegions.length) {
        return "";
    }
    const sorted = [...withRegions].sort((left, right) => {
        const leftLen =
            Number(left.regionEnd) - Number(left.regionStart);
        const rightLen =
            Number(right.regionEnd) - Number(right.regionStart);
        return rightLen - leftLen;
    });
    const best = sorted[0];
    const label = `${best.regionStart}-${best.regionEnd}`;
    return sorted.length > 1 ? `${label}+` : label;
}

const LINK_GENE_DISPLAY_LIMIT = 3;

function formatLinkGeneDisplay(details = []) {
    const genes = [];
    const seen = new Set();
    (details || []).forEach((entry) => {
        const gene = String(entry?.gene || "").trim();
        if (!gene || seen.has(gene)) {
            return;
        }
        seen.add(gene);
        genes.push(gene);
    });
    if (!genes.length) {
        return "";
    }
    genes.sort((left, right) => left.localeCompare(right));
    if (genes.length <= LINK_GENE_DISPLAY_LIMIT) {
        return genes.join(", ");
    }
    return `${genes.slice(0, LINK_GENE_DISPLAY_LIMIT).join(", ")}+`;
}

function formatPromoterRange(start, end) {
    const lo = Number(start);
    const hi = Number(end);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        return "";
    }
    return `${Math.min(lo, hi)}-${Math.max(lo, hi)}`;
}

function finalizeRegionOverlapColumns(row) {
    const next = { ...row };
    const details = Array.isArray(next.mappingDetails) ? next.mappingDetails : [];
    const annotationDetails = details.filter(
        (entry) => entry?.groupId === "global-enrichment"
    );
    const biosampleDetails = details.filter(
        (entry) => entry?.groupId === "biosamples"
    );
    const v2gDetails = details.filter(
        (entry) => entry?.groupId === "variant-to-gene-links"
    );
    const s2gDetails = details.filter(
        (entry) => entry?.groupId === "snp2gene-links"
    );
    const annotationDisplay = formatOverlapDisplay(annotationDetails);
    const biosampleDisplay = formatOverlapDisplay(biosampleDetails);
    const v2gDisplay = formatLinkGeneDisplay(v2gDetails);
    const s2gDisplay = formatLinkGeneDisplay(s2gDetails);
    if (annotationDisplay) {
        next[VKS_ANNOTATION_OVERLAP_COLUMN] = annotationDisplay;
    }
    if (biosampleDisplay) {
        next[VKS_BIOSAMPLE_OVERLAP_COLUMN] = biosampleDisplay;
    }
    if (v2gDisplay) {
        next[VKS_V2G_COLUMN] = v2gDisplay;
    }
    if (s2gDisplay) {
        next[VKS_S2G_COLUMN] = s2gDisplay;
    }
    return next;
}

export function hasMultipleCredSets(row) {
    return (
        (row?.mappingDetails || []).filter(
            (detail) => detail?.groupId === "credible-sets"
        ).length > 1
    );
}

function normalizeRegionMeta(region, defaults = {}) {
    const start = Number(region?.start);
    const end = Number(region?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    const biosampleDefault =
        defaults.biosample == null || defaults.biosample === ""
            ? ""
            : String(defaults.biosample);
    const biosample =
        region?.biosample == null || region.biosample === ""
            ? biosampleDefault
            : String(region.biosample);
    return {
        start: lo,
        end: hi,
        annotation: region?.annotation || defaults.annotation || "",
        tissue: region?.tissue || defaults.tissue || "",
        biosample,
        method:
            region?.method == null || region.method === ""
                ? ""
                : String(region.method),
        source:
            region?.source == null || region.source === ""
                ? ""
                : String(region.source),
        dataset:
            region?.dataset == null || region.dataset === ""
                ? ""
                : String(region.dataset),
    };
}

function collectRegionsFromAnnoAnnotationTissue(annoData, annotation, tissue) {
    const entry = annoData?.[annotation]?.[tissue];
    if (!entry?.region?.length) {
        return [];
    }
    return entry.region
        .map((region) =>
            normalizeRegionMeta(region, { annotation, tissue })
        )
        .filter(Boolean);
}

function collectRegionsForBiosample(
    annoData,
    annotation,
    tissue,
    biosample,
    { selectedMethods = null, selectedSources = null } = {}
) {
    const entry = annoData?.[annotation]?.[tissue];
    if (!entry?.region?.length) {
        return [];
    }
    const target =
        biosample == null || biosample === "" ? "—" : String(biosample);
    return entry.region
        .filter((region) => {
            const label =
                region?.biosample == null || region.biosample === ""
                    ? "—"
                    : String(region.biosample);
            if (label !== target) {
                return false;
            }
            if (Array.isArray(selectedMethods)) {
                const method =
                    region?.method == null || region.method === ""
                        ? ""
                        : String(region.method);
                if (!method || !selectedMethods.includes(method)) {
                    return false;
                }
            }
            if (Array.isArray(selectedSources)) {
                const source =
                    region?.source == null || region.source === ""
                        ? ""
                        : String(region.source);
                if (!source || !selectedSources.includes(source)) {
                    return false;
                }
            }
            return true;
        })
        .map((region) =>
            normalizeRegionMeta(region, { annotation, tissue, biosample: target })
        )
        .filter(Boolean);
}

function formatGeTissueLabel(annotation, tissue) {
    return `${annotation} : ${tissue}`;
}

function formatGeBiosampleLabel(annotation, tissue, biosample) {
    return `${annotation} : ${tissue} : ${biosample}`;
}

function collectRegionsFromLinkRows(rows = [], defaults = {}) {
    return (Array.isArray(rows) ? rows : [])
        .map((row) => normalizeRegionMeta(row, defaults))
        .filter(Boolean);
}

function filterLinkRows(rows = [], deselectedMethods = [], deselectedGenes = []) {
    const removedMethods = new Set(deselectedMethods || []);
    const removedGenes = new Set(deselectedGenes || []);
    return (Array.isArray(rows) ? rows : []).filter((row) => {
        if (!row || typeof row !== "object") {
            return false;
        }
        const targetGene = row.targetGene || row.gene;
        const method = row.method;
        if (targetGene && removedGenes.has(targetGene)) {
            return false;
        }
        if (method && removedMethods.has(method)) {
            return false;
        }
        return Number.isFinite(Number(row.start)) && Number.isFinite(Number(row.end));
    });
}

function appendLinkTrackCategories(
    categories,
    {
        tissueData = {},
        deselectedMethods = [],
        deselectedGenes = [],
        selectedLinks = null,
        idPrefix,
        group,
        groupId,
        formatLabel = formatV2gLinkLabel,
    }
) {
    const selectedSet =
        selectedLinks == null
            ? null
            : new Set(normalizeV2gSelectedLinks(selectedLinks));
    // Positive selection: only selected gene/method tracks become mapping chips.
    if (selectedSet && !selectedSet.size) {
        return;
    }

    Object.keys(tissueData || {})
        .sort()
        .forEach((tissue) => {
            const rows = filterLinkRows(
                tissueData[tissue],
                deselectedMethods,
                deselectedGenes
            );
            const byKey = new Map();
            rows.forEach((row) => {
                const gene = row.targetGene || row.gene;
                const method = row.method;
                if (!gene || !method) {
                    return;
                }
                const key = v2gLinkSelectionKey(tissue, gene, method);
                if (selectedSet && !selectedSet.has(key)) {
                    return;
                }
                if (!byKey.has(key)) {
                    byKey.set(key, {
                        tissue,
                        gene,
                        method,
                        regions: [],
                    });
                }
                const start = Number(row.start);
                const end = Number(row.end);
                if (
                    Number.isFinite(start) &&
                    Number.isFinite(end) &&
                    end >= start
                ) {
                    byKey.get(key).regions.push({
                        start,
                        end,
                        tissue,
                        gene,
                        method,
                        biosample:
                            row.biosample == null || row.biosample === ""
                                ? ""
                                : String(row.biosample),
                        targetGeneStart: row.targetGeneStart,
                        targetGeneEnd: row.targetGeneEnd,
                        source:
                            row.source == null || row.source === ""
                                ? ""
                                : String(row.source),
                        dataset:
                            row.dataset == null || row.dataset === ""
                                ? ""
                                : String(row.dataset),
                    });
                }
            });
            [...byKey.values()]
                .sort((left, right) => {
                    if (left.gene !== right.gene) {
                        return left.gene.localeCompare(right.gene);
                    }
                    return left.method.localeCompare(right.method);
                })
                .forEach((entry) => {
                    if (!entry.regions.length) {
                        return;
                    }
                    categories.push({
                        id: `${idPrefix}:${entry.tissue}:::${entry.gene}:::${entry.method}`,
                        group,
                        groupId,
                        label: formatLabel(entry.tissue, entry.gene, entry.method),
                        kind: "region",
                        regions: entry.regions,
                    });
                });
        });
}

/**
 * Build available mapping categories from layers 1 + 2 only
 * (loaded workspace data + current track/feature selections).
 * Never reads the workspace mapping filter view (layer 3).
 */
export function collectMappingCategories({
    credibleSetsState = null,
    globalEnrichmentState = null,
    v2gState = null,
    s2gState = null,
} = {}) {
    const categories = [];

    (credibleSetsState?.selectedIds || []).forEach((selectionKey) => {
        const setState = credibleSetsState.variantsBySet?.[selectionKey];
        const meta = setState?.meta || {};
        const formatted = setState?.formattedVariants || [];
        if (!formatted.length) {
            return;
        }
        const variantIds = new Set();
        const ppaByVariant = {};
        const pValueByVariant = {};
        formatted.forEach((csRow) => {
            const keys = [];
            if (csRow?.[CS_KEY_FIELD]) {
                keys.push(String(csRow[CS_KEY_FIELD]));
            }
            if (csRow?.varId) {
                keys.push(String(csRow.varId));
            }
            const ppa = resolveCsPpa(csRow);
            const pValue = resolveCsPValue(csRow);
            keys.forEach((key) => {
                variantIds.add(key);
                if (ppa != null) {
                    ppaByVariant[key] = ppa;
                }
                if (pValue != null) {
                    pValueByVariant[key] = pValue;
                }
            });
        });
        if (!variantIds.size) {
            return;
        }
        categories.push({
            id: `cs:${selectionKey}`,
            group: "Credible sets",
            groupId: "credible-sets",
            label: meta.label || meta.credibleSetId || selectionKey,
            kind: "membership",
            variantIds,
            ppaByVariant,
            pValueByVariant,
        });
    });

    const annoData = globalEnrichmentState?.annoData;
    const selectedTissuesByAnnotation = resolveSelectedTissuesByAnnotation({
        selectedTissuesByAnnotation:
            globalEnrichmentState?.selectedTissuesByAnnotation,
        selectedTissues: globalEnrichmentState?.selectedTissues,
        activeAnnotation: globalEnrichmentState?.activeAnnotation,
    });
    Object.keys(selectedTissuesByAnnotation).forEach((annotation) => {
        const tissues = selectedTissuesByAnnotation[annotation] || [];
        tissues.forEach((tissue) => {
            const regions = collectRegionsFromAnnoAnnotationTissue(
                annoData,
                annotation,
                tissue
            );
            if (!regions.length) {
                return;
            }
            categories.push({
                id: `ge:${annotation}:::${tissue}`,
                group: "Global enrichment",
                groupId: "global-enrichment",
                label: formatGeTissueLabel(annotation, tissue),
                kind: "region",
                regions,
            });
        });
    });

    const selectedBiosamples = Array.isArray(globalEnrichmentState?.selectedBiosamples)
        ? globalEnrichmentState.selectedBiosamples.filter(Boolean)
        : [];
    const activeAnnotation = globalEnrichmentState?.activeAnnotation || null;
    if (annoData && activeAnnotation && selectedBiosamples.length) {
        selectedBiosamples.forEach((selectionKey) => {
            const separator = selectionKey.indexOf(":::");
            if (separator < 0) {
                return;
            }
            const tissue = selectionKey.slice(0, separator);
            const biosample = selectionKey.slice(separator + 3);
            if (!tissue || !biosample) {
                return;
            }
            const storedRows =
                globalEnrichmentState?.biosampleRegionsByAnnotation?.[
                    activeAnnotation
                ]?.[tissue]?.rows;
            let regions = [];
            if (Array.isArray(storedRows) && storedRows.length) {
                const target =
                    biosample == null || biosample === "" ? "—" : String(biosample);
                regions = collectRegionsFromLinkRows(
                    storedRows.filter((row) => {
                        const label =
                            row?.biosample == null || row.biosample === ""
                                ? "—"
                                : String(row.biosample);
                        if (label !== target) {
                            return false;
                        }
                        if (Array.isArray(globalEnrichmentState?.selectedMethods)) {
                            const method =
                                row?.method == null || row.method === ""
                                    ? ""
                                    : String(row.method);
                            if (
                                !method ||
                                !globalEnrichmentState.selectedMethods.includes(method)
                            ) {
                                return false;
                            }
                        }
                        if (Array.isArray(globalEnrichmentState?.selectedSources)) {
                            const source =
                                row?.source == null || row.source === ""
                                    ? ""
                                    : String(row.source);
                            if (
                                !source ||
                                !globalEnrichmentState.selectedSources.includes(source)
                            ) {
                                return false;
                            }
                        }
                        return true;
                    }),
                    {
                        annotation: activeAnnotation,
                        tissue,
                        biosample: target,
                    }
                );
            }
            if (!regions.length) {
                regions = collectRegionsForBiosample(
                    annoData,
                    activeAnnotation,
                    tissue,
                    biosample,
                    {
                        selectedMethods: globalEnrichmentState?.selectedMethods,
                        selectedSources: globalEnrichmentState?.selectedSources,
                    }
                );
            }
            if (!regions.length) {
                return;
            }
            categories.push({
                id: `ge-bs:${activeAnnotation}:::${tissue}:::${biosample}`,
                group: "Biosamples",
                groupId: "biosamples",
                label: formatGeBiosampleLabel(activeAnnotation, tissue, biosample),
                kind: "region",
                regions,
            });
        });
    }

    appendLinkTrackCategories(categories, {
        tissueData: v2gState?.tissueData,
        deselectedMethods: v2gState?.deselectedMethods,
        deselectedGenes: v2gState?.deselectedGenes,
        selectedLinks: v2gState?.selectedLinks,
        idPrefix: "v2g",
        group: "Variant-to-gene",
        groupId: "variant-to-gene-links",
        formatLabel: formatV2gLinkLabel,
    });

    appendLinkTrackCategories(categories, {
        tissueData: s2gState?.tissueData,
        deselectedMethods: s2gState?.deselectedMethods,
        deselectedGenes: s2gState?.deselectedGenes,
        selectedLinks: s2gState?.selectedLinks,
        idPrefix: "s2g",
        group: "SNP 2 gene",
        groupId: "snp2gene-links",
        formatLabel: formatS2gLinkLabel,
    });

    return categories;
}

export function groupMappingCategories(categories = []) {
    const groups = [];
    const byGroup = new Map();
    categories.forEach((category) => {
        const key = category.groupId || category.group || "other";
        if (!byGroup.has(key)) {
            const group = {
                id: key,
                label: category.group || key,
                categories: [],
            };
            byGroup.set(key, group);
            groups.push(group);
        }
        byGroup.get(key).categories.push(category);
    });
    return groups;
}

function rowMatchesCategory(row, category) {
    if (!row || !category) {
        return false;
    }
    if (category.kind === "membership") {
        const keys = rowVariantKeys(row);
        for (const key of keys) {
            if (category.variantIds?.has(key)) {
                return true;
            }
        }
        return false;
    }
    if (category.kind === "region") {
        return positionOverlapsRegions(row.Position ?? row.position, category.regions);
    }
    return false;
}

function enrichRowForCategory(row, category) {
    let next = { ...row };
    if (category.kind === "membership") {
        const keys = [...rowVariantKeys(row)];
        let ppa = null;
        let pValue = null;
        for (const key of keys) {
            if (ppa == null && category.ppaByVariant?.[key] != null) {
                ppa = category.ppaByVariant[key];
            }
            if (pValue == null && category.pValueByVariant?.[key] != null) {
                pValue = category.pValueByVariant[key];
            }
        }
        if (ppa == null && pValue == null) {
            return next;
        }
        next = appendMappingDetail(next, {
            groupId: category.groupId || "credible-sets",
            groupLabel: mappingGroupLabel(category.groupId || "credible-sets"),
            label: category.label,
            ppa,
            pValue,
        });
        if (ppa != null) {
            const previous = next[VKS_CRED_SETS_COLUMN];
            if (
                previous == null ||
                (typeof ppa === "number" &&
                    (typeof previous !== "number" || ppa > previous))
            ) {
                next[VKS_CRED_SETS_COLUMN] = ppa;
            }
        }
        return next;
    }

    const overlaps = findAllOverlappingRegions(
        row.Position ?? row.position,
        category.regions
    );
    if (!overlaps.length) {
        return next;
    }

    const groupId = category.groupId || "global-enrichment";
    const isGeOverlap =
        groupId === "global-enrichment" || groupId === "biosamples";
    const isLinkOverlap =
        groupId === "variant-to-gene-links" || groupId === "snp2gene-links";

    if (isLinkOverlap) {
        overlaps.forEach((overlap) => {
            const region = `${overlap.start}-${overlap.end}`;
            const detail = {
                groupId,
                groupLabel: mappingGroupLabel(groupId),
                label: category.label,
                tissue: overlap.tissue || "",
                biosample: overlap.biosample || "",
                gene: overlap.gene || "",
                method: overlap.method || "",
                region,
                regionStart: overlap.start,
                regionEnd: overlap.end,
                ppa: null,
                pValue: null,
            };
            if (groupId === "variant-to-gene-links") {
                detail.promoter = formatPromoterRange(
                    overlap.targetGeneStart,
                    overlap.targetGeneEnd
                );
            }
            next = appendMappingDetail(next, detail);
        });
        return next;
    }

    if (!isGeOverlap) {
        const existing = next["Mapped features"]
            ? String(next["Mapped features"]).split(", ")
            : [];
        if (!existing.includes(category.label)) {
            existing.push(category.label);
        }
        next["Mapped features"] = existing.join(", ");
        const first = overlaps[0];
        next.overStart = first.start;
        next.overEnd = first.end;
        next = appendMappingDetail(next, {
            groupId,
            groupLabel: mappingGroupLabel(groupId),
            label: category.label,
            overlap: `${first.start}-${first.end}`,
            ppa: null,
            pValue: null,
        });
        return next;
    }

    overlaps.forEach((overlap) => {
        const region = `${overlap.start}-${overlap.end}`;
        next = appendMappingDetail(next, {
            groupId,
            groupLabel: mappingGroupLabel(groupId),
            label: category.label,
            tissue: overlap.tissue || "",
            biosample: overlap.biosample || "",
            annotation: overlap.annotation || "",
            region,
            regionStart: overlap.start,
            regionEnd: overlap.end,
            method: overlap.method || "",
            source: overlap.source || "",
            dataset: overlap.dataset || "",
            ppa: null,
            pValue: null,
        });
    });
    return next;
}

/**
 * Filter association rows by selected mapping categories with And/Or logic.
 * Or: keep if the variant matches any selected category.
 * And: keep if the variant matches every selected category.
 */
export function applyMappingFilter(associationRows, categories = [], mode = "or") {
    const selected = (categories || []).filter(Boolean);
    const rows = Array.isArray(associationRows) ? associationRows : [];
    if (!selected.length) {
        return {
            rows: [...rows],
            topRows: [...ASSOCIATIONS_TABLE_FORMAT["top rows"]],
            tableFormat: ASSOCIATIONS_TABLE_FORMAT,
            filtered: false,
        };
    }

    const combineMode = normalizeMappingMode(mode);
    const hasMembershipCategories = selected.some(
        (category) => category.kind === "membership"
    );
    const hasAnnotationOverlap = selected.some(
        (category) => category.groupId === "global-enrichment"
    );
    const hasBiosampleOverlap = selected.some(
        (category) => category.groupId === "biosamples"
    );
    const hasV2gOverlap = selected.some(
        (category) => category.groupId === "variant-to-gene-links"
    );
    const hasS2gOverlap = selected.some(
        (category) => category.groupId === "snp2gene-links"
    );
    const hasLinkRegionCategories = selected.some(
        (category) =>
            category.kind === "region" &&
            category.groupId !== "global-enrichment" &&
            category.groupId !== "biosamples" &&
            category.groupId !== "variant-to-gene-links" &&
            category.groupId !== "snp2gene-links"
    );

    const filtered = [];
    rows.forEach((row) => {
        const matches = selected.map((category) => rowMatchesCategory(row, category));
        const keep =
            combineMode === "and"
                ? matches.every(Boolean)
                : matches.some(Boolean);
        if (!keep) {
            return;
        }

        let next = { ...row };
        selected.forEach((category, index) => {
            if (matches[index]) {
                next = enrichRowForCategory(next, category);
            }
        });
        next = finalizeRegionOverlapColumns(next);
        filtered.push(next);
    });

    const topRows = [...ASSOCIATIONS_TABLE_FORMAT["top rows"]];
    if (hasMembershipCategories && !topRows.includes(VKS_CRED_SETS_COLUMN)) {
        topRows.push(VKS_CRED_SETS_COLUMN);
    }
    if (
        hasAnnotationOverlap &&
        !topRows.includes(VKS_ANNOTATION_OVERLAP_COLUMN)
    ) {
        topRows.push(VKS_ANNOTATION_OVERLAP_COLUMN);
    }
    if (
        hasBiosampleOverlap &&
        !topRows.includes(VKS_BIOSAMPLE_OVERLAP_COLUMN)
    ) {
        topRows.push(VKS_BIOSAMPLE_OVERLAP_COLUMN);
    }
    if (hasV2gOverlap && !topRows.includes(VKS_V2G_COLUMN)) {
        topRows.push(VKS_V2G_COLUMN);
    }
    if (hasS2gOverlap && !topRows.includes(VKS_S2G_COLUMN)) {
        topRows.push(VKS_S2G_COLUMN);
    }
    if (hasLinkRegionCategories && !topRows.includes("Mapped features")) {
        topRows.push("Mapped features");
    }

    const tableFormat = {
        ...ASSOCIATIONS_TABLE_FORMAT,
        "top rows": topRows,
        "tool tips": {
            ...ASSOCIATIONS_TABLE_FORMAT["tool tips"],
            [VKS_CRED_SETS_COLUMN]:
                "Highest Posterior Probability of Association among mapped credible sets. Click to expand matched sets.",
            [VKS_ANNOTATION_OVERLAP_COLUMN]:
                "Largest overlapping annotation region among mapped global enrichment tissues. \"+\" means additional overlaps. Click to expand mapped tissue overlaps.",
            [VKS_BIOSAMPLE_OVERLAP_COLUMN]:
                "Largest overlapping biosample region among mapped biosamples. \"+\" means additional overlaps. Click to expand mapped biosample overlaps.",
            [VKS_V2G_COLUMN]:
                "Mapped variant-to-gene target genes (up to 3 shown). \"+\" means additional genes. Click to expand mapped links.",
            [VKS_S2G_COLUMN]:
                "Mapped SNP-to-gene target genes (up to 3 shown). \"+\" means additional genes. Click to expand mapped links.",
        },
        "column formatting": {
            ...ASSOCIATIONS_TABLE_FORMAT["column formatting"],
        },
    };
    if (hasMembershipCategories) {
        tableFormat["column formatting"][VKS_CRED_SETS_COLUMN] = {
            type: ["scientific notation", "expandable mapping"],
            mappingGroupId: "credible-sets",
        };
    }
    if (hasAnnotationOverlap) {
        tableFormat["column formatting"][VKS_ANNOTATION_OVERLAP_COLUMN] = {
            type: ["expandable mapping"],
            mappingGroupId: "global-enrichment",
        };
    }
    if (hasBiosampleOverlap) {
        tableFormat["column formatting"][VKS_BIOSAMPLE_OVERLAP_COLUMN] = {
            type: ["expandable mapping"],
            mappingGroupId: "biosamples",
        };
    }
    if (hasV2gOverlap) {
        tableFormat["column formatting"][VKS_V2G_COLUMN] = {
            type: ["expandable mapping"],
            mappingGroupId: "variant-to-gene-links",
        };
    }
    if (hasS2gOverlap) {
        tableFormat["column formatting"][VKS_S2G_COLUMN] = {
            type: ["expandable mapping"],
            mappingGroupId: "snp2gene-links",
        };
    }

    return {
        rows: filtered,
        topRows,
        tableFormat,
        filtered: true,
    };
}

/**
 * Build the variant data table view with optional generic mapping categories.
 * When no mapping categories are selected, returns all association rows.
 */
export function buildMappedVariantDataTableView(
    associationRows,
    {
        mappingCategories = [],
        selectedCategoryIds = [],
        mappingMode = "or",
    } = {}
) {
    const selectedSet = new Set(selectedCategoryIds || []);
    const selectedCategories = (mappingCategories || []).filter((category) =>
        selectedSet.has(category.id)
    );
    return applyMappingFilter(associationRows, selectedCategories, mappingMode);
}
