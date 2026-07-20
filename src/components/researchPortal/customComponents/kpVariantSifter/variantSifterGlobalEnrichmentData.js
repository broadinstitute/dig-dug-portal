/** Annotation colors aligned with Research portal `colors.moderate`. */
import { VARIANT_SIFTER_ANNO_TRACK_MARGIN } from "./variantSifterAssociationsPlotConfig.js";

export const VKS_ANNOTATION_COLORS = [
    "#007bff50",
    "#04884550",
    "#8490C850",
    "#BF61A550",
    "#EE312450",
    "#FCD70050",
    "#5555FF50",
    "#7aaa1c50",
    "#9F78AC50",
    "#F8808450",
    "#F5A4C750",
    "#CEE6C150",
    "#cccc0050",
    "#6FC7B650",
    "#D5A76850",
    "#d4d4d450",
];

/** Default GE / annotation region fill (first annotation blue). */
export const VKS_GE_TRACK_REGION_COLOR = VKS_ANNOTATION_COLORS[0];

export function negLog10PValue(pValue) {
    if (pValue == null || Number.isNaN(Number(pValue))) {
        return null;
    }
    const p = Number(pValue);
    if (p === 0) {
        return 324;
    }
    return -Math.log10(p);
}

export function computeEnrichmentFold(snps, expectedSnps) {
    const expected = Number(expectedSnps);
    if (!expected) {
        return null;
    }
    return Number(snps) / expected;
}

export function buildAnnoDataFromRows(rows = []) {
    const annoData = {};

    rows.forEach((row) => {
        const annotation = row?.annotation;
        const tissue = row?.tissue;
        if (!annotation || !tissue) {
            return;
        }

        if (!annoData[annotation]) {
            annoData[annotation] = {};
        }
        if (!annoData[annotation][tissue]) {
            annoData[annotation][tissue] = {
                region: [],
                ancestries: {},
            };
        }

        annoData[annotation][tissue].region.push({
            start: Number(row.start),
            end: Number(row.end),
            state: row.state,
            biosample: row.biosample ?? "",
            dataset: row.dataset ?? "",
            method: row.method ?? "",
            source: row.source ?? "",
        });
    });

    return Object.fromEntries(
        Object.entries(annoData).sort(([left], [right]) => left.localeCompare(right))
    );
}

export function annoRowKey(row) {
    if (!row) {
        return "";
    }
    return [row.annotation, row.tissue, row.start, row.end, row.state ?? ""].join("|");
}

export function filterAnnoRowsInRegion(rows, region) {
    if (!Array.isArray(rows) || !region) {
        return rows || [];
    }

    const start = Number(region.start);
    const end = Number(region.end);
    return rows.filter((row) => {
        const rowStart = Number(row.start);
        const rowEnd = Number(row.end);
        return (
            Number.isFinite(rowStart) &&
            Number.isFinite(rowEnd) &&
            rowStart <= end &&
            rowEnd >= start
        );
    });
}

export function mergeAnnoRows(existingRows, incomingRows) {
    const byKey = new Map();

    (existingRows || []).forEach((row) => {
        const key = annoRowKey(row);
        if (key) {
            byKey.set(key, row);
        }
    });

    (incomingRows || []).forEach((row) => {
        const key = annoRowKey(row);
        if (key) {
            byKey.set(key, row);
        }
    });

    return Array.from(byKey.values()).sort((left, right) => {
        const startDiff = Number(left.start) - Number(right.start);
        if (startDiff) {
            return startDiff;
        }
        return String(left.annotation).localeCompare(String(right.annotation));
    });
}

export function applyGlobalEnrichmentAnnoRows(state, annoRows) {
    const annoData = buildAnnoDataFromRows(annoRows);
    const catalog = extractGeCatalog(annoData);
    const hasData = Object.keys(annoData).length > 0;

    return {
        ...state,
        annoRows,
        annoData,
        catalog,
        selectedAnnotations: resolveSelectedGeAnnotations(
            state?.selectedAnnotations,
            catalog.annotations
        ),
        error: hasData
            ? null
            : state?.error || "No regulatory annotations were found for this locus.",
    };
}

export function sortedAnnotationKeys(annoData = {}) {
    return Object.keys(annoData).sort();
}

export function extractGeCatalog(annoData = {}) {
    const annotations = sortedAnnotationKeys(annoData);
    const tissueSet = new Set();
    let pairCount = 0;

    annotations.forEach((annotation) => {
        Object.keys(annoData[annotation] || {}).forEach((tissue) => {
            tissueSet.add(tissue);
            pairCount += 1;
        });
    });

    return {
        annotations,
        tissues: [...tissueSet].sort(),
        pairCount,
    };
}

export function emptyGeLlmRelevanceState() {
    return {
        loading: false,
        error: null,
        llmUsed: false,
        tissueOnly: true,
        filterComplete: false,
        relevantAnnotations: [],
        relevantTissues: [],
        relevantTissuesByAnnotation: {},
        rationaleById: {},
        source: null,
    };
}

export function isGeLlmFilterComplete(llmRelevance) {
    if (!llmRelevance || llmRelevance.loading) {
        return false;
    }
    return Boolean(llmRelevance.filterComplete);
}

export function buildGeLlmRelevanceShowAllState(annotationLabels = [], { error = null } = {}) {
    return {
        loading: false,
        error,
        llmUsed: false,
        tissueOnly: true,
        filterComplete: true,
        relevantAnnotations: [...annotationLabels],
        relevantTissues: [],
        rationaleById: {},
    };
}

export function buildGeLlmLoadingState(annotationLabels = []) {
    return {
        ...emptyGeLlmRelevanceState(),
        loading: true,
        relevantAnnotations: [...annotationLabels],
    };
}

export function snapshotGlobalEnrichmentForExport(state) {
    if (!state) {
        return null;
    }

    const llmRelevance = state.llmRelevance || emptyGeLlmRelevanceState();
    return {
        loading: false,
        error: state.error || null,
        geRows: Array.isArray(state.geRows) ? state.geRows : [],
        annoRows: Array.isArray(state.annoRows) ? state.annoRows : [],
        annoData: state.annoData && typeof state.annoData === "object" ? state.annoData : {},
        catalog: state.catalog || { annotations: [], tissues: [], pairCount: 0 },
        llmRelevance: {
            ...llmRelevance,
            loading: false,
        },
        enabledMutedAnnotations: [...(state.enabledMutedAnnotations || [])],
        enabledMutedAnnotationTissues: normalizeEnabledMutedAnnotationTissues(
            state.enabledMutedAnnotationTissues
        ),
        disabledAnnotationTissues: normalizeDisabledAnnotationTissues(
            state.disabledAnnotationTissues
        ),
        selectedAnnotations: [...(state.selectedAnnotations || [])],
        tissueTrackSort: normalizeGeTissueTrackSort(state.tissueTrackSort),
        geTrackPValueMax: normalizeGeTrackPValueMax(state.geTrackPValueMax),
        selectedMethods: normalizeGeFilterStringList(state.selectedMethods),
        selectedSources: normalizeGeFilterStringList(state.selectedSources),
        activeAnnotation: state.activeAnnotation || null,
        selectedTissuesByAnnotation: resolveSelectedTissuesByAnnotation({
            selectedTissuesByAnnotation: state.selectedTissuesByAnnotation,
            selectedTissues: state.selectedTissues,
            activeAnnotation: state.activeAnnotation,
        }),
        selectedTissues: selectedTissuesForAnnotation(
            resolveSelectedTissuesByAnnotation({
                selectedTissuesByAnnotation: state.selectedTissuesByAnnotation,
                selectedTissues: state.selectedTissues,
                activeAnnotation: state.activeAnnotation,
            }),
            state.activeAnnotation
        ),
        selectedBiosamples: normalizeGeSelectedBiosamples(state.selectedBiosamples),
        biosampleMethodOptions: normalizeGeOptionList(state.biosampleMethodOptions),
        biosampleSourceOptions: normalizeGeOptionList(state.biosampleSourceOptions),
        biosampleRegionsByAnnotation: normalizeGeBiosampleRegionsByAnnotation(
            state.biosampleRegionsByAnnotation
        ),
    };
}

export function normalizeGlobalEnrichmentFromSession(exported) {
    if (!exported || typeof exported !== "object") {
        return null;
    }

    const annoData =
        exported.annoData && typeof exported.annoData === "object" ? exported.annoData : {};
    const catalog =
        exported.catalog && typeof exported.catalog === "object"
            ? exported.catalog
            : extractGeCatalog(annoData);
    const llmRelevance = {
        ...emptyGeLlmRelevanceState(),
        ...(exported.llmRelevance || {}),
        loading: false,
    };

    if (llmRelevance.llmUsed) {
        llmRelevance.filterComplete = true;
    } else if (llmRelevance.filterComplete == null) {
        llmRelevance.filterComplete = Boolean(llmRelevance.error);
    }

    return {
        loading: false,
        error: exported.error || null,
        geRows: Array.isArray(exported.geRows) ? exported.geRows : [],
        annoRows: Array.isArray(exported.annoRows) ? exported.annoRows : [],
        annoData,
        catalog,
        llmRelevance,
        enabledMutedAnnotations: Array.isArray(exported.enabledMutedAnnotations)
            ? exported.enabledMutedAnnotations
            : [],
        enabledMutedAnnotationTissues: normalizeEnabledMutedAnnotationTissues(
            exported.enabledMutedAnnotationTissues
        ),
        disabledAnnotationTissues: normalizeDisabledAnnotationTissues(
            exported.disabledAnnotationTissues
        ),
        selectedAnnotations: resolveSelectedGeAnnotations(
            exported.selectedAnnotations?.length
                ? exported.selectedAnnotations
                : exported.annotationOnFocus
                  ? [exported.annotationOnFocus]
                  : [],
            catalog.annotations
        ),
        tissueTrackSort: normalizeGeTissueTrackSort(exported.tissueTrackSort),
        geTrackPValueMax: normalizeGeTrackPValueMax(exported.geTrackPValueMax),
        selectedMethods: normalizeGeFilterStringList(exported.selectedMethods),
        selectedSources: normalizeGeFilterStringList(exported.selectedSources),
        activeAnnotation: exported.activeAnnotation || null,
        selectedTissuesByAnnotation: resolveSelectedTissuesByAnnotation({
            selectedTissuesByAnnotation: exported.selectedTissuesByAnnotation,
            selectedTissues: exported.selectedTissues,
            activeAnnotation: exported.activeAnnotation,
        }),
        selectedTissues: selectedTissuesForAnnotation(
            resolveSelectedTissuesByAnnotation({
                selectedTissuesByAnnotation: exported.selectedTissuesByAnnotation,
                selectedTissues: exported.selectedTissues,
                activeAnnotation: exported.activeAnnotation,
            }),
            exported.activeAnnotation
        ),
        selectedBiosamples: normalizeGeSelectedBiosamples(exported.selectedBiosamples),
        biosampleMethodOptions: normalizeGeOptionList(exported.biosampleMethodOptions),
        biosampleSourceOptions: normalizeGeOptionList(exported.biosampleSourceOptions),
        biosampleRegionsByAnnotation: normalizeGeBiosampleRegionsByAnnotation(
            exported.biosampleRegionsByAnnotation
        ),
    };
}

/** { [annotation]: string[] } of force-shown track tissues. */
export function normalizeEnabledMutedAnnotationTissues(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    const next = {};
    Object.keys(value)
        .sort()
        .forEach((annotation) => {
            const tissues = value[annotation];
            if (!Array.isArray(tissues) || !tissues.length) {
                return;
            }
            next[annotation] = [...new Set(tissues.filter(Boolean))].sort();
        });
    return next;
}

/** { [annotation]: string[] } of user-selected tissues for GE tracks / plot. */
export function normalizeSelectedTissuesByAnnotation(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    const next = {};
    Object.keys(value)
        .sort()
        .forEach((annotation) => {
            if (!annotation) {
                return;
            }
            const tissues = value[annotation];
            if (!Array.isArray(tissues) || !tissues.length) {
                return;
            }
            next[annotation] = [...new Set(tissues.filter(Boolean))];
        });
    return next;
}

export function selectedTissuesForAnnotation(map, annotation) {
    if (!annotation) {
        return [];
    }
    const tissues = normalizeSelectedTissuesByAnnotation(map)[annotation];
    return Array.isArray(tissues) ? [...tissues] : [];
}

export function setSelectedTissuesForAnnotation(map, annotation, tissues) {
    const next = normalizeSelectedTissuesByAnnotation(map);
    if (!annotation) {
        return next;
    }
    const list = [
        ...new Set((Array.isArray(tissues) ? tissues : []).filter(Boolean)),
    ];
    if (!list.length) {
        delete next[annotation];
    } else {
        next[annotation] = list;
    }
    return next;
}

export function listSelectedTissueKeysByAnnotation(map) {
    const normalized = normalizeSelectedTissuesByAnnotation(map);
    const keys = [];
    Object.keys(normalized).forEach((annotation) => {
        normalized[annotation].forEach((tissue) => {
            keys.push(`${annotation}:::${tissue}`);
        });
    });
    return keys;
}

/**
 * Prefer the per-annotation map. Fall back to legacy flat selectedTissues +
 * activeAnnotation so older sessions keep working.
 */
export function resolveSelectedTissuesByAnnotation({
    selectedTissuesByAnnotation = null,
    selectedTissues = null,
    activeAnnotation = null,
} = {}) {
    const normalized = normalizeSelectedTissuesByAnnotation(
        selectedTissuesByAnnotation
    );
    if (Object.keys(normalized).length) {
        return normalized;
    }
    if (
        activeAnnotation &&
        Array.isArray(selectedTissues) &&
        selectedTissues.length
    ) {
        return {
            [activeAnnotation]: [...new Set(selectedTissues.filter(Boolean))],
        };
    }
    return {};
}

/** { [annotation]: string[] } of force-hidden track tissues. */
export function normalizeDisabledAnnotationTissues(value) {
    return normalizeEnabledMutedAnnotationTissues(value);
}

export function isGeAnnotationTissueForceEnabled(
    annotation,
    tissue,
    enabledMutedAnnotationTissues = {}
) {
    if (!annotation || !tissue) {
        return false;
    }
    const tissues = enabledMutedAnnotationTissues?.[annotation];
    return Array.isArray(tissues) && tissues.includes(tissue);
}

export function isGeAnnotationTissueForceDisabled(
    annotation,
    tissue,
    disabledAnnotationTissues = {}
) {
    return isGeAnnotationTissueForceEnabled(
        annotation,
        tissue,
        disabledAnnotationTissues
    );
}

export function listForceEnabledTissues(enabledMutedAnnotationTissues = {}) {
    const tissues = new Set();
    Object.values(enabledMutedAnnotationTissues || {}).forEach((list) => {
        if (!Array.isArray(list)) {
            return;
        }
        list.forEach((tissue) => {
            if (tissue) {
                tissues.add(tissue);
            }
        });
    });
    return [...tissues].sort();
}

export function hasGlobalEnrichmentSnapshotData(state) {
    return Boolean(
        state &&
            (Object.keys(state.annoData || {}).length > 0 ||
                state.geRows?.length ||
                state.annoRows?.length)
    );
}

export function isGeAnnotationEmphasized(
    annotation,
    { llmRelevance, enabledMutedAnnotations = [] } = {}
) {
    if (!llmRelevance?.llmUsed) {
        return true;
    }
    if (llmRelevance.tissueOnly) {
        return true;
    }
    if (llmRelevance.relevantAnnotations.includes(annotation)) {
        return true;
    }
    return enabledMutedAnnotations.includes(annotation);
}

export function isGeTissueEmphasized(
    tissue,
    {
        llmRelevance,
        enabledMutedAnnotationTissues = {},
        // Legacy flat list still accepted for older sessions / table props.
        enabledMutedTissues = [],
    } = {}
) {
    if (!llmRelevance?.llmUsed) {
        return true;
    }
    if (llmRelevance.relevantTissues.includes(tissue)) {
        return true;
    }
    if (enabledMutedTissues.includes(tissue)) {
        return true;
    }
    return listForceEnabledTissues(enabledMutedAnnotationTissues).includes(tissue);
}

export function isGePointEmphasized(
    point,
    {
        llmRelevance,
        enabledMutedAnnotations = [],
        enabledMutedAnnotationTissues = {},
        disabledAnnotationTissues = {},
        enabledMutedTissues = [],
    } = {}
) {
    if (!point) {
        return true;
    }
    if (
        isGeAnnotationTissueForceDisabled(
            point.annotation,
            point.tissue,
            disabledAnnotationTissues
        )
    ) {
        return false;
    }
    if (
        isGeAnnotationTissueForceEnabled(
            point.annotation,
            point.tissue,
            enabledMutedAnnotationTissues
        )
    ) {
        return isGeAnnotationEmphasized(point.annotation, {
            llmRelevance,
            enabledMutedAnnotations,
        });
    }
    return (
        isGeAnnotationEmphasized(point.annotation, {
            llmRelevance,
            enabledMutedAnnotations,
        }) &&
        isGeTissueEmphasized(point.tissue, {
            llmRelevance,
            enabledMutedAnnotationTissues,
            enabledMutedTissues,
        })
    );
}

export function listMutedGeAnnotations(
    annotations = [],
    { llmRelevance, enabledMutedAnnotations = [] } = {}
) {
    if (!llmRelevance?.llmUsed || llmRelevance.tissueOnly) {
        return [];
    }
    return annotations.filter(
        (annotation) =>
            !llmRelevance.relevantAnnotations.includes(annotation) &&
            !enabledMutedAnnotations.includes(annotation)
    );
}

export function listMutedGeTissues(
    tissues = [],
    { llmRelevance, enabledMutedAnnotationTissues = {}, enabledMutedTissues = [] } = {}
) {
    if (!llmRelevance?.llmUsed) {
        return [];
    }
    const forceEnabled = new Set([
        ...enabledMutedTissues,
        ...listForceEnabledTissues(enabledMutedAnnotationTissues),
    ]);
    return tissues.filter(
        (tissue) =>
            !llmRelevance.relevantTissues.includes(tissue) && !forceEnabled.has(tissue)
    );
}

/** Default max raw enrichment p-value for tissues shown on workspace annotation tracks. */
export const GE_TRACK_P_VALUE_MAX = 0.5;

export function normalizeGeTrackPValueMax(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return GE_TRACK_P_VALUE_MAX;
    }
    return parsed;
}

export function normalizeGeFilterStringList(value) {
    if (value == null) {
        return null;
    }
    if (!Array.isArray(value)) {
        return null;
    }
    return [...new Set(value.map((item) => String(item ?? "")).filter(Boolean))].sort();
}

export function biosampleSelectionKey(tissue, biosample) {
    return `${tissue || ""}:::${biosample || ""}`;
}

export function normalizeGeSelectedBiosamples(value) {
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
                        return biosampleSelectionKey(item.tissue, item.biosample);
                    }
                    return "";
                })
                .filter(Boolean)
        ),
    ].sort();
}

export function normalizeGeOptionList(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return [...new Set(value.map((item) => String(item ?? "")).filter(Boolean))].sort();
}

function normalizeGeBiosampleRegionRow(row) {
    if (!row || typeof row !== "object") {
        return null;
    }
    const start = Number(row.start);
    const end = Number(row.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    return {
        start,
        end,
        state: row.state ?? "",
        biosample: row.biosample ?? "",
        dataset: row.dataset ?? "",
        method: row.method ?? "",
        source: row.source ?? "",
        annotation: row.annotation ?? "",
    };
}

/**
 * { [annotation]: { [tissue]: { regionKey, rows[] } } } of fetched tissue-regions.
 */
export function normalizeGeBiosampleRegionsByAnnotation(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    const next = {};
    Object.keys(value).forEach((annotation) => {
        if (!annotation) {
            return;
        }
        const byTissue = value[annotation];
        if (!byTissue || typeof byTissue !== "object" || Array.isArray(byTissue)) {
            return;
        }
        const tissues = {};
        Object.keys(byTissue).forEach((tissue) => {
            if (!tissue) {
                return;
            }
            const entry = byTissue[tissue];
            const rows = Array.isArray(entry?.rows)
                ? entry.rows
                : Array.isArray(entry)
                  ? entry
                  : [];
            const normalizedRows = rows
                .map((row) => normalizeGeBiosampleRegionRow(row))
                .filter(Boolean);
            if (!normalizedRows.length && !entry?.regionKey) {
                return;
            }
            tissues[tissue] = {
                regionKey: entry?.regionKey ? String(entry.regionKey) : "",
                rows: normalizedRows,
            };
        });
        if (Object.keys(tissues).length) {
            next[annotation] = tissues;
        }
    });
    return next;
}

export function upsertGeBiosampleTissueRegions(
    current,
    { annotation, tissue, regionKey, rows } = {}
) {
    if (!annotation || !tissue) {
        return normalizeGeBiosampleRegionsByAnnotation(current);
    }
    const base = normalizeGeBiosampleRegionsByAnnotation(current);
    const normalizedRows = (Array.isArray(rows) ? rows : [])
        .map((row) => normalizeGeBiosampleRegionRow(row))
        .filter(Boolean);
    return {
        ...base,
        [annotation]: {
            ...(base[annotation] || {}),
            [tissue]: {
                regionKey: regionKey ? String(regionKey) : "",
                rows: normalizedRows,
            },
        },
    };
}

export function listUniqueRegionPropValues(regions = [], prop) {
    const values = new Set();
    (regions || []).forEach((region) => {
        const value = region?.[prop];
        if (value == null || value === "") {
            return;
        }
        values.add(String(value));
    });
    return [...values].sort();
}

export function regionPassesGeMethodSourceFilter(
    region,
    { selectedMethods = null, selectedSources = null } = {}
) {
    if (Array.isArray(selectedMethods)) {
        const method = region?.method == null || region.method === "" ? "" : String(region.method);
        if (!method || !selectedMethods.includes(method)) {
            return false;
        }
    }
    if (Array.isArray(selectedSources)) {
        const source = region?.source == null || region.source === "" ? "" : String(region.source);
        if (!source || !selectedSources.includes(source)) {
            return false;
        }
    }
    return true;
}

export function tissueMeetsGeTrackPValue(
    tissue,
    geTissueStats = {},
    pValueMax = GE_TRACK_P_VALUE_MAX
) {
    const rawPValue = geTissueStats?.[tissue]?.rawPValue;
    if (rawPValue == null || Number.isNaN(Number(rawPValue))) {
        return false;
    }
    return Number(rawPValue) < normalizeGeTrackPValueMax(pValueMax);
}

/**
 * Default track visibility for one tissue under one annotation:
 * relevant (when LLM succeeded) AND enrichment p < threshold for that annotation.
 * If AI classification failed / was not applied: enrichment p < threshold only.
 */
export function tissuePassesDefaultGeTrackFilter(
    tissue,
    {
        annotation = null,
        geTissueStats = {},
        llmRelevance = null,
        pValueMax = GE_TRACK_P_VALUE_MAX,
    } = {}
) {
    if (!tissueMeetsGeTrackPValue(tissue, geTissueStats, pValueMax)) {
        return false;
    }
    if (!llmRelevance?.llmUsed) {
        return true;
    }
    const byAnnotation = llmRelevance.relevantTissuesByAnnotation;
    if (
        byAnnotation &&
        annotation != null &&
        Object.prototype.hasOwnProperty.call(byAnnotation, annotation)
    ) {
        return (byAnnotation[annotation] || []).includes(tissue);
    }
    return (llmRelevance.relevantTissues || []).includes(tissue);
}

export function isGeTissueShownOnTrack(
    tissue,
    {
        annotation,
        geTissueStats = {},
        llmRelevance = null,
        enabledMutedAnnotationTissues = {},
        disabledAnnotationTissues = {},
        pValueMax = GE_TRACK_P_VALUE_MAX,
    } = {}
) {
    if (
        isGeAnnotationTissueForceEnabled(
            annotation,
            tissue,
            enabledMutedAnnotationTissues
        )
    ) {
        return true;
    }
    if (
        isGeAnnotationTissueForceDisabled(
            annotation,
            tissue,
            disabledAnnotationTissues
        )
    ) {
        return false;
    }
    return tissuePassesDefaultGeTrackFilter(tissue, {
        annotation,
        geTissueStats,
        llmRelevance,
        pValueMax,
    });
}

/**
 * Tissues to show on workspace annotation tracks for a single annotation.
 * Uses that annotation's enrichment p-values only.
 */
export function filterGeTissuesForDisplay(
    tissues = [],
    {
        annotation,
        llmRelevance,
        enabledMutedAnnotationTissues = {},
        disabledAnnotationTissues = {},
        geTissueStats = {},
        pValueMax = GE_TRACK_P_VALUE_MAX,
    } = {}
) {
    return tissues.filter((tissue) =>
        isGeTissueShownOnTrack(tissue, {
            annotation,
            geTissueStats,
            llmRelevance,
            enabledMutedAnnotationTissues,
            disabledAnnotationTissues,
            pValueMax,
        })
    );
}

export const GE_TISSUE_TRACK_SORT = {
    ALPHABETICAL: "alphabetical",
    P_VALUE: "pValue",
    FOLD: "fold",
};

export const GE_TISSUE_TRACK_SORT_OPTIONS = [
    { id: GE_TISSUE_TRACK_SORT.ALPHABETICAL, label: "Alphabetical" },
    { id: GE_TISSUE_TRACK_SORT.P_VALUE, label: "P-value (low first)" },
    { id: GE_TISSUE_TRACK_SORT.FOLD, label: "Fold (high first)" },
];

export function normalizeGeTissueTrackSort(value) {
    const allowed = new Set(Object.values(GE_TISSUE_TRACK_SORT));
    return allowed.has(value) ? value : GE_TISSUE_TRACK_SORT.ALPHABETICAL;
}

export function sortGeTissuesForDisplay(
    tissues = [],
    { sort = GE_TISSUE_TRACK_SORT.ALPHABETICAL, geTissueStats = {} } = {}
) {
    const list = [...tissues];
    const mode = normalizeGeTissueTrackSort(sort);

    if (mode === GE_TISSUE_TRACK_SORT.P_VALUE) {
        return list.sort((left, right) => {
            const leftP = geTissueStats[left]?.rawPValue;
            const rightP = geTissueStats[right]?.rawPValue;
            const leftMissing = leftP == null || Number.isNaN(Number(leftP));
            const rightMissing = rightP == null || Number.isNaN(Number(rightP));
            if (leftMissing && rightMissing) {
                return left.localeCompare(right);
            }
            if (leftMissing) {
                return 1;
            }
            if (rightMissing) {
                return -1;
            }
            if (Number(leftP) !== Number(rightP)) {
                return Number(leftP) - Number(rightP);
            }
            return left.localeCompare(right);
        });
    }

    if (mode === GE_TISSUE_TRACK_SORT.FOLD) {
        return list.sort((left, right) => {
            const leftFold = geTissueStats[left]?.fold;
            const rightFold = geTissueStats[right]?.fold;
            const leftMissing = leftFold == null || Number.isNaN(Number(leftFold));
            const rightMissing = rightFold == null || Number.isNaN(Number(rightFold));
            if (leftMissing && rightMissing) {
                return left.localeCompare(right);
            }
            if (leftMissing) {
                return 1;
            }
            if (rightMissing) {
                return -1;
            }
            if (Number(leftFold) !== Number(rightFold)) {
                return Number(rightFold) - Number(leftFold);
            }
            return left.localeCompare(right);
        });
    }

    return list.sort((left, right) => left.localeCompare(right));
}

/** Filter then sort tissues for annotation track display. */
export function resolveGeTissuesForDisplay(tissues = [], options = {}) {
    return sortGeTissuesForDisplay(filterGeTissuesForDisplay(tissues, options), options);
}

/**
 * Tissues hidden from each annotation track by default (not relevant and/or
 * p ≥ threshold for that annotation). Force-enabled tissues stay listed so
 * the muted panel checkbox can remain checked.
 */
export function listTrackFilteredGeTissuesByAnnotation({
    annoData = {},
    geRows = [],
    phenotype,
    ancestry,
    annotations = null,
    llmRelevance = null,
    pValueMax = GE_TRACK_P_VALUE_MAX,
} = {}) {
    const annotationKeys = Array.isArray(annotations)
        ? annotations
        : sortedAnnotationKeys(annoData);

    return annotationKeys
        .map((annotation) => {
            const tissues = Object.keys(annoData[annotation] || {}).sort();
            if (!tissues.length) {
                return null;
            }
            const geTissueStats = buildGeTissueStatsForAnnotation({
                geRows,
                annotation,
                phenotype,
                ancestry,
            });
            const filteredTissues = tissues.filter(
                (tissue) =>
                    !tissuePassesDefaultGeTrackFilter(tissue, {
                        annotation,
                        geTissueStats,
                        llmRelevance,
                        pValueMax,
                    })
            );
            if (!filteredTissues.length) {
                return null;
            }
            return { annotation, tissues: filteredTissues };
        })
        .filter(Boolean);
}

export function countTrackFilteredGeTissues(groups = []) {
    return groups.reduce((total, group) => total + (group?.tissues?.length || 0), 0);
}

export function setEnabledMutedAnnotationTissue(
    enabledMutedAnnotationTissues = {},
    annotation,
    tissue,
    enabled
) {
    const next = normalizeEnabledMutedAnnotationTissues(enabledMutedAnnotationTissues);
    if (!annotation || !tissue) {
        return next;
    }
    const current = new Set(next[annotation] || []);
    if (enabled) {
        current.add(tissue);
    } else {
        current.delete(tissue);
    }
    if (current.size) {
        next[annotation] = [...current].sort();
    } else {
        delete next[annotation];
    }
    return next;
}

export function setDisabledAnnotationTissue(
    disabledAnnotationTissues = {},
    annotation,
    tissue,
    disabled
) {
    return setEnabledMutedAnnotationTissue(
        disabledAnnotationTissues,
        annotation,
        tissue,
        disabled
    );
}

/**
 * Update force-show / force-hide maps so `shown` matches the checkbox for one tissue.
 */
export function setAnnotationTissueShown({
    enabledMutedAnnotationTissues = {},
    disabledAnnotationTissues = {},
    annotation,
    tissue,
    shown,
    defaultShown,
}) {
    let enabled = setEnabledMutedAnnotationTissue(
        enabledMutedAnnotationTissues,
        annotation,
        tissue,
        false
    );
    let disabled = setDisabledAnnotationTissue(
        disabledAnnotationTissues,
        annotation,
        tissue,
        false
    );

    if (shown && !defaultShown) {
        enabled = setEnabledMutedAnnotationTissue(enabled, annotation, tissue, true);
    } else if (!shown && defaultShown) {
        disabled = setDisabledAnnotationTissue(disabled, annotation, tissue, true);
    }

    return {
        enabledMutedAnnotationTissues: enabled,
        disabledAnnotationTissues: disabled,
    };
}

/** All tissues present in annoData for each annotation (sorted). */
export function listAllGeTissuesByAnnotation(annoData = {}, annotations = null) {
    const annotationKeys = Array.isArray(annotations)
        ? annotations
        : sortedAnnotationKeys(annoData);

    return annotationKeys
        .map((annotation) => {
            const tissues = Object.keys(annoData[annotation] || {}).sort();
            if (!tissues.length) {
                return null;
            }
            return { annotation, tissues };
        })
        .filter(Boolean);
}

/**
 * Force-enable every tissue that is not in the default initial selection.
 * Clears all force-hidden overrides.
 */
export function buildSelectAllAnnotationTissueOverrides({
    annoData = {},
    geRows = [],
    phenotype,
    ancestry,
    annotations = null,
    llmRelevance = null,
    pValueMax = GE_TRACK_P_VALUE_MAX,
} = {}) {
    const annotationKeys = Array.isArray(annotations)
        ? annotations
        : sortedAnnotationKeys(annoData);
    const enabledMutedAnnotationTissues = {};

    annotationKeys.forEach((annotation) => {
        const tissues = Object.keys(annoData[annotation] || {});
        if (!tissues.length) {
            return;
        }
        const geTissueStats = buildGeTissueStatsForAnnotation({
            geRows,
            annotation,
            phenotype,
            ancestry,
        });
        const forceEnabled = tissues
            .filter(
                (tissue) =>
                    !tissuePassesDefaultGeTrackFilter(tissue, {
                        annotation,
                        geTissueStats,
                        llmRelevance,
                        pValueMax,
                    })
            )
            .sort();
        if (forceEnabled.length) {
            enabledMutedAnnotationTissues[annotation] = forceEnabled;
        }
    });

    return {
        enabledMutedAnnotationTissues,
        disabledAnnotationTissues: {},
    };
}

/**
 * Force-hide every tissue that is in the default initial selection.
 * Clears all force-shown overrides.
 */
export function buildDeselectAllAnnotationTissueOverrides({
    annoData = {},
    geRows = [],
    phenotype,
    ancestry,
    annotations = null,
    llmRelevance = null,
    pValueMax = GE_TRACK_P_VALUE_MAX,
} = {}) {
    const annotationKeys = Array.isArray(annotations)
        ? annotations
        : sortedAnnotationKeys(annoData);
    const disabledAnnotationTissues = {};

    annotationKeys.forEach((annotation) => {
        const tissues = Object.keys(annoData[annotation] || {});
        if (!tissues.length) {
            return;
        }
        const geTissueStats = buildGeTissueStatsForAnnotation({
            geRows,
            annotation,
            phenotype,
            ancestry,
        });
        const forceDisabled = tissues
            .filter((tissue) =>
                tissuePassesDefaultGeTrackFilter(tissue, {
                    annotation,
                    geTissueStats,
                    llmRelevance,
                    pValueMax,
                })
            )
            .sort();
        if (forceDisabled.length) {
            disabledAnnotationTissues[annotation] = forceDisabled;
        }
    });

    return {
        enabledMutedAnnotationTissues: {},
        disabledAnnotationTissues,
    };
}

export function mutedAnnotationColor(color) {
    if (!color || color.length < 7) {
        return "#00000018";
    }
    return `${color.slice(0, 7)}18`;
}

export function annotationColorForKey(annotation, annotations = [], colors = VKS_ANNOTATION_COLORS) {
    const index = annotations.indexOf(annotation);
    if (index < 0) {
        return "#00000050";
    }
    return colors[index % colors.length];
}

function upsertGePoint(pointMap, point) {
    const key = `${point.annotation}___${point.tissue}`;
    const existing = pointMap.get(key);
    if (!existing) {
        pointMap.set(key, point);
        return;
    }

    if (point.pValue > existing.pValue) {
        existing.pValue = point.pValue;
        if (point.rawPValue != null) {
            existing.rawPValue = point.rawPValue;
        }
    }
    if (point.fold > existing.fold) {
        existing.fold = point.fold;
    }
}

export function buildGePlotModel({ geRows = [], annoData = {}, phenotype, ancestry }) {
    const annotations = sortedAnnotationKeys(annoData);
    const ancestryFilter = ancestry || "Mixed";
    const pointMap = new Map();

    geRows.forEach((row) => {
        if (row?.phenotype !== phenotype) {
            return;
        }
        if (row?.ancestry !== ancestryFilter) {
            return;
        }
        if (!annoData?.[row.annotation]?.[row.tissue]) {
            return;
        }

        const pValue = negLog10PValue(row.pValue);
        const fold = computeEnrichmentFold(row.SNPs, row.expectedSNPs);
        if (pValue == null || fold == null) {
            return;
        }

        upsertGePoint(pointMap, {
            annotation: row.annotation,
            tissue: row.tissue,
            pValue,
            rawPValue: row.pValue,
            fold,
            annotationIndex: annotations.indexOf(row.annotation),
        });
    });

    const points = Array.from(pointMap.values());
    let xMin = null;
    let xMax = null;
    let yMin = null;
    let yMax = null;

    points.forEach((point) => {
        xMin = xMin == null ? point.pValue : Math.min(xMin, point.pValue);
        xMax = xMax == null ? point.pValue : Math.max(xMax, point.pValue);
        yMin = yMin == null ? point.fold : Math.min(yMin, point.fold);
        yMax = yMax == null ? point.fold : Math.max(yMax, point.fold);
    });

    if (!points.length) {
        return {
            points: [],
            annotations,
            xMin: 0,
            xMax: 1,
            yMin: 0,
            yMax: 1,
        };
    }

    return {
        points,
        annotations,
        xMin,
        xMax,
        yMin,
        yMax,
    };
}

export function topGeLabelThresholds(points = []) {
    const foldValues = points.map((point) => point.fold).sort((a, b) => b - a);
    const pValueValues = points.map((point) => point.pValue).sort((a, b) => b - a);
    return {
        foldThreshold: foldValues[2] ?? foldValues[0] ?? null,
        pValueThreshold: pValueValues[2] ?? pValueValues[0] ?? null,
    };
}

export function solidAnnotationColor(color) {
    if (!color || color.length < 7) {
        return "#666666";
    }
    return color.slice(0, 7);
}

export function annotationsForPlot(annoData = {}, selectedAnnotations = null) {
    const annotations = sortedAnnotationKeys(annoData);
    if (!Array.isArray(selectedAnnotations) || !selectedAnnotations.length) {
        return annotations;
    }
    const selected = new Set(selectedAnnotations);
    return annotations.filter((annotation) => selected.has(annotation));
}

export function resolveSelectedGeAnnotations(selectedAnnotations, allAnnotations = []) {
    if (!Array.isArray(allAnnotations) || !allAnnotations.length) {
        return [];
    }
    if (!Array.isArray(selectedAnnotations) || !selectedAnnotations.length) {
        return [...allAnnotations];
    }
    const allowed = new Set(allAnnotations);
    return selectedAnnotations.filter((annotation) => allowed.has(annotation));
}

export function computeAnnotationsPlotHeight(annotationCount, tissueCount) {
    const spaceBy = 24;
    const annotationTitleH = spaceBy * 2;
    const betweenAnnotations = spaceBy * 7;
    const perTissue = spaceBy;
    const topMargin = spaceBy * 2;
    const bottomMargin = spaceBy * 2;

    if (!annotationCount) {
        return topMargin + bottomMargin;
    }

    return (
        topMargin +
        bottomMargin +
        annotationCount * annotationTitleH +
        tissueCount * perTissue +
        Math.max(0, annotationCount - 1) * betweenAnnotations
    );
}

export function countAnnotationTissues(annoData = {}, annotations = []) {
    return annotations.reduce((total, annotation) => {
        return total + Object.keys(annoData[annotation] || {}).length;
    }, 0);
}

/**
 * Per-tissue global-enrichment stats for one annotation, phenotype, and ancestry.
 * Fold is SNPs / expectedSNPs; p-value uses the row with the lowest raw p-value
 * when multiple rows exist for the same tissue (Research portal behavior).
 */
export function buildGeTissueStatsForAnnotation({
    geRows = [],
    annotation,
    phenotype,
    ancestry,
}) {
    if (!annotation || !phenotype) {
        return {};
    }

    const ancestryFilter = ancestry || "Mixed";
    const statsByTissue = {};

    geRows.forEach((row) => {
        if (row?.annotation !== annotation) {
            return;
        }
        if (row?.phenotype !== phenotype) {
            return;
        }
        if (row?.ancestry !== ancestryFilter) {
            return;
        }

        const tissue = row?.tissue;
        const rawPValue = Number(row?.pValue);
        const fold = computeEnrichmentFold(row?.SNPs, row?.expectedSNPs);
        if (!tissue || fold == null || Number.isNaN(rawPValue)) {
            return;
        }

        const existing = statsByTissue[tissue];
        if (!existing || rawPValue < existing.rawPValue) {
            statsByTissue[tissue] = {
                rawPValue,
                fold,
                rank: null,
            };
        }
    });

    const rankedTissues = Object.entries(statsByTissue).sort(
        (left, right) => right[1].fold - left[1].fold
    );
    rankedTissues.forEach(([tissue], index) => {
        statsByTissue[tissue].rank = index;
    });

    return statsByTissue;
}

export function formatGeTissueStatLabel(stats, utils) {
    if (!stats) {
        return null;
    }
    return `${formatGePValueLabel(stats.rawPValue, utils)} / ${formatGeFoldLabel(stats.fold)}`;
}

export function formatGePValueLabel(rawPValue, utils) {
    if (rawPValue == null || Number.isNaN(Number(rawPValue))) {
        return "—";
    }
    const pValueFormatter = utils?.Formatters?.pValueFormatter;
    if (pValueFormatter) {
        return pValueFormatter(rawPValue);
    }
    return String(rawPValue);
}

export function formatGeFoldLabel(fold) {
    if (fold == null || Number.isNaN(Number(fold))) {
        return "—";
    }
    return Number(fold).toFixed(3);
}

/**
 * Tissue rows × annotation columns for the GE drawer table.
 * Rows are sorted by the lowest p-value across annotations for each tissue.
 * When `filterByTissueVisibility` is true, only tissues currently shown on at
 * least one selected annotation track are included (and cells respect visibility).
 */
export function buildGeTissueTableModel({
    geRows = [],
    annoData = {},
    phenotype,
    ancestry,
    annotations = [],
    utils = null,
    llmRelevance = null,
    enabledMutedAnnotationTissues = {},
    disabledAnnotationTissues = {},
    filterByTissueVisibility = false,
    pValueMax = GE_TRACK_P_VALUE_MAX,
}) {
    if (!phenotype || !annotations.length) {
        return { annotations: [], rows: [] };
    }

    const statsByAnnotation = {};
    annotations.forEach((annotation) => {
        statsByAnnotation[annotation] = buildGeTissueStatsForAnnotation({
            geRows,
            annotation,
            phenotype,
            ancestry,
        });
    });

    const tissueSet = new Set();
    annotations.forEach((annotation) => {
        Object.keys(annoData[annotation] || {}).forEach((tissue) => {
            if (!filterByTissueVisibility) {
                tissueSet.add(tissue);
                return;
            }
            if (
                isGeTissueShownOnTrack(tissue, {
                    annotation,
                    geTissueStats: statsByAnnotation[annotation] || {},
                    llmRelevance,
                    enabledMutedAnnotationTissues,
                    disabledAnnotationTissues,
                    pValueMax,
                })
            ) {
                tissueSet.add(tissue);
            }
        });
    });

    const rows = [...tissueSet].map((tissue) => {
        const cells = {};
        let minPValue = null;

        annotations.forEach((annotation) => {
            const stats = statsByAnnotation[annotation]?.[tissue] || null;
            if (!stats) {
                cells[annotation] = null;
                return;
            }

            if (
                filterByTissueVisibility &&
                !isGeTissueShownOnTrack(tissue, {
                    annotation,
                    geTissueStats: statsByAnnotation[annotation] || {},
                    llmRelevance,
                    enabledMutedAnnotationTissues,
                    disabledAnnotationTissues,
                    pValueMax,
                })
            ) {
                cells[annotation] = null;
                return;
            }

            cells[annotation] = {
                rawPValue: stats.rawPValue,
                fold: stats.fold,
                pValueLabel: formatGePValueLabel(stats.rawPValue, utils),
                foldLabel: formatGeFoldLabel(stats.fold),
            };

            if (minPValue == null || stats.rawPValue < minPValue) {
                minPValue = stats.rawPValue;
            }
        });

        return {
            tissue,
            cells,
            minPValue,
        };
    });

    rows.sort((left, right) => {
        if (left.minPValue == null && right.minPValue == null) {
            return left.tissue.localeCompare(right.tissue);
        }
        if (left.minPValue == null) {
            return 1;
        }
        if (right.minPValue == null) {
            return -1;
        }
        if (left.minPValue !== right.minPValue) {
            return left.minPValue - right.minPValue;
        }
        return left.tissue.localeCompare(right.tissue);
    });

    return {
        annotations: [...annotations],
        rows,
    };
}

/**
 * Format locus annotation rows for the Enriched Regions table (sorted by start).
 */
export function buildEnrichedRegionsTableRows(annoRows = [], options = {}) {
    const annotations =
        options.annotations && options.annotations.length
            ? options.annotations
            : sortedAnnotationKeys(
                  Object.fromEntries(
                      (annoRows || [])
                          .filter((row) => row?.annotation)
                          .map((row) => [row.annotation, true])
                  )
              );
    const annotationSet = new Set(annotations);
    const isTissueVisible =
        typeof options.isTissueVisible === "function"
            ? options.isTissueVisible
            : null;

    const rows = (annoRows || [])
        .filter((row) => {
            const annotation = row?.annotation || "";
            if (!annotationSet.has(annotation)) {
                return false;
            }
            if (!isTissueVisible) {
                return true;
            }
            return isTissueVisible(annotation, row?.tissue || "");
        })
        .map((row, index) => {
            const chromosome = row?.chromosome ?? row?.chr ?? "";
            const start = Number(row?.start);
            const end = Number(row?.end);
            const annotation = row?.annotation || "";
            const regionLabel =
                chromosome && Number.isFinite(start) && Number.isFinite(end)
                    ? `${chromosome}:${Math.round(start)}-${Math.round(end)}`
                    : "—";

            return {
                key: `${annoRowKey(row)}|${index}`,
                start: Number.isFinite(start) ? start : Number.POSITIVE_INFINITY,
                region: regionLabel,
                annotation,
                annotationColor: solidAnnotationColor(
                    annotationColorForKey(annotation, annotations, VKS_ANNOTATION_COLORS)
                ),
                tissue: row?.tissue || "—",
                biosample: row?.biosample || "—",
                state: row?.state || "—",
                dataset: row?.dataset || "—",
                method: row?.method || "—",
                source: row?.source || "—",
            };
        })
        .sort((left, right) => {
            if (left.start !== right.start) {
                return left.start - right.start;
            }
            return String(left.region).localeCompare(String(right.region));
        });

    return rows;
}

export const VKS_ANNO_TRACK_PER_TISSUE = 24;
export const VKS_ANNO_TRACK_STATS_HEADER = 24;
/** Canvas-space gap (~5 CSS px at 2x) between last tissue row and x-axis line. */
export const VKS_ANNO_TRACK_X_AXIS_GAP = 10;
/** Canvas-space gap (~15 CSS px at 2x) between track plot and Fold column. */
export const VKS_ANNO_TRACK_FOLD_GAP = 30;
/** Title band for the selected-tissue biosample tracks panel. */
export const VKS_ANNO_BIOSAMPLE_TITLE_H = 36;
/** Canvas-space gap (15 CSS px at 2x) between biosample title and first track. */
export const VKS_ANNO_BIOSAMPLE_TITLE_GAP = 30;

/**
 * Group locus annotation regions by biosample (sorted alphabetically).
 * Empty / missing biosample labels use "—".
 */
export function groupAnnoRegionsByBiosample(regions = []) {
    const byBiosample = new Map();

    (regions || []).forEach((region) => {
        if (!region) {
            return;
        }
        const biosample =
            region.biosample == null || region.biosample === ""
                ? "—"
                : String(region.biosample);
        if (!byBiosample.has(biosample)) {
            byBiosample.set(biosample, []);
        }
        byBiosample.get(biosample).push(region);
    });

    return [...byBiosample.keys()]
        .sort((left, right) => left.localeCompare(right))
        .map((biosample) => ({
            biosample,
            regions: byBiosample.get(biosample) || [],
        }));
}

export function listBiosamplesForAnnotationTissue(annoData = {}, annotation, tissue) {
    if (!annotation || !tissue) {
        return [];
    }
    return groupAnnoRegionsByBiosample(annoData?.[annotation]?.[tissue]?.region || []);
}

export function computeAnnotationWorkspaceTrackHeight(tissueCount) {
    const { topMargin, bottomMargin } = VARIANT_SIFTER_ANNO_TRACK_MARGIN;
    if (!tissueCount) {
        return topMargin + bottomMargin + VKS_ANNO_TRACK_STATS_HEADER;
    }
    return (
        topMargin +
        bottomMargin +
        VKS_ANNO_TRACK_STATS_HEADER +
        tissueCount * VKS_ANNO_TRACK_PER_TISSUE +
        VKS_ANNO_TRACK_X_AXIS_GAP
    );
}

export function computeAnnotationBiosampleTrackHeight(biosampleCount) {
    const { topMargin, bottomMargin } = VARIANT_SIFTER_ANNO_TRACK_MARGIN;
    if (!biosampleCount) {
        return topMargin + bottomMargin + VKS_ANNO_BIOSAMPLE_TITLE_H;
    }
    return (
        topMargin +
        bottomMargin +
        VKS_ANNO_BIOSAMPLE_TITLE_H +
        VKS_ANNO_BIOSAMPLE_TITLE_GAP +
        biosampleCount * VKS_ANNO_TRACK_PER_TISSUE +
        VKS_ANNO_TRACK_X_AXIS_GAP
    );
}
