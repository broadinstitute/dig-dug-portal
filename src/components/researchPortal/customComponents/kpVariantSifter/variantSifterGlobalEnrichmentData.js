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
        });
    });

    return Object.fromEntries(
        Object.entries(annoData).sort(([left], [right]) => left.localeCompare(right))
    );
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
        rationaleById: {},
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
        enabledMutedTissues: [...(state.enabledMutedTissues || [])],
        selectedAnnotations: [...(state.selectedAnnotations || [])],
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
        enabledMutedTissues: Array.isArray(exported.enabledMutedTissues)
            ? exported.enabledMutedTissues
            : [],
        selectedAnnotations: resolveSelectedGeAnnotations(
            exported.selectedAnnotations?.length
                ? exported.selectedAnnotations
                : exported.annotationOnFocus
                  ? [exported.annotationOnFocus]
                  : [],
            catalog.annotations
        ),
    };
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

export function isGeTissueEmphasized(tissue, { llmRelevance, enabledMutedTissues = [] } = {}) {
    if (!llmRelevance?.llmUsed) {
        return true;
    }
    if (llmRelevance.relevantTissues.includes(tissue)) {
        return true;
    }
    return enabledMutedTissues.includes(tissue);
}

export function isGePointEmphasized(
    point,
    { llmRelevance, enabledMutedAnnotations = [], enabledMutedTissues = [] } = {}
) {
    if (!point) {
        return true;
    }
    return (
        isGeAnnotationEmphasized(point.annotation, {
            llmRelevance,
            enabledMutedAnnotations,
        }) &&
        isGeTissueEmphasized(point.tissue, {
            llmRelevance,
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

export function listMutedGeTissues(tissues = [], { llmRelevance, enabledMutedTissues = [] } = {}) {
    if (!llmRelevance?.llmUsed) {
        return [];
    }
    return tissues.filter(
        (tissue) =>
            !llmRelevance.relevantTissues.includes(tissue) &&
            !enabledMutedTissues.includes(tissue)
    );
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

    const pValueFormatter = utils?.Formatters?.pValueFormatter;
    const pValueLabel = pValueFormatter
        ? pValueFormatter(stats.rawPValue)
        : String(stats.rawPValue);
    const foldLabel = Number(stats.fold).toFixed(3);
    return `${pValueLabel} / ${foldLabel}`;
}

export const VKS_ANNO_TRACK_PER_TISSUE = 24;
export const VKS_ANNO_TRACK_STATS_HEADER = 24;

export function computeAnnotationWorkspaceTrackHeight(tissueCount) {
    const { topMargin, bottomMargin } = VARIANT_SIFTER_ANNO_TRACK_MARGIN;
    if (!tissueCount) {
        return topMargin + bottomMargin + VKS_ANNO_TRACK_STATS_HEADER;
    }
    return (
        topMargin +
        bottomMargin +
        VKS_ANNO_TRACK_STATS_HEADER +
        tissueCount * VKS_ANNO_TRACK_PER_TISSUE
    );
}
