import {
    formatGeFoldLabel,
    groupAnnoRegionsByBiosample,
    isGeAnnotationEmphasized,
    isGeTissueEmphasized,
    regionPassesGeMethodSourceFilter,
    resolveGeTissuesForDisplay,
    biosampleSelectionKey,
    VKS_ANNO_BIOSAMPLE_TITLE_GAP,
    VKS_ANNO_BIOSAMPLE_TITLE_H,
    VKS_ANNO_TRACK_FOLD_GAP,
    VKS_ANNO_TRACK_PER_TISSUE,
    VKS_ANNO_TRACK_STATS_HEADER,
    VKS_ANNO_TRACK_X_AXIS_GAP,
    VKS_GE_TRACK_REGION_COLOR,
} from "./variantSifterGlobalEnrichmentData.js";
import {
    normalizePlotMargin,
    renderTrackHighlightBands,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import {
    genomicPositionToCanvasX,
    renderLivePositionGuideline,
    renderPlotMarkerLines,
    renderXAxisBandHoverHighlight,
} from "./variantSifterPlotMarkers.js";

function formatAxisTick(value, decimalPlaces, utils) {
    if (utils?.Formatters?.decimalFormatter) {
        return utils.Formatters.decimalFormatter(value, decimalPlaces);
    }
    return String(Math.round(value * 100) / 100);
}

function truncateTextToWidth(ctx, text, maxWidth) {
    if (!text || maxWidth <= 0) {
        return "";
    }
    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }
    const ellipsis = "…";
    let truncated = text;
    while (
        truncated.length > 0 &&
        ctx.measureText(`${truncated}${ellipsis}`).width > maxWidth
    ) {
        truncated = truncated.slice(0, -1);
    }
    return `${truncated}${ellipsis}`;
}

function renderWorkspaceAnnotationAxis(ctx, options) {
    const {
        plotLeft,
        plotTop,
        plotWidth,
        plotHeight,
        xMin,
        xMax,
        utils,
        bump,
        axisGap = VKS_ANNO_TRACK_X_AXIS_GAP,
    } = options;

    const axisY = plotTop + plotHeight + axisGap;

    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.font = "24px Arial";

    ctx.beginPath();
    ctx.moveTo(plotLeft - bump, plotTop);
    ctx.lineTo(plotLeft - bump, axisY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(plotLeft - bump, axisY);
    ctx.lineTo(plotLeft + plotWidth, axisY);
    ctx.stroke();

    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    const xGap = xMax - xMin;
    const xDecimal = xGap <= 1 ? 2 : xGap <= 50 ? 1 : 0;

    for (let i = 0; i < 6; i += 1) {
        const tickX = plotLeft + i * xTickDistance;
        ctx.beginPath();
        ctx.moveTo(tickX, axisY);
        ctx.lineTo(tickX, axisY + bump);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(
            formatAxisTick(xMin + i * xStep, xDecimal, utils),
            tickX,
            axisY + bump * 3
        );
    }

    ctx.restore();
}

export function setupAnnotationsWorkspaceCanvas(canvas, canvasWidth, canvasHeight) {
    return setupPlotCanvas(canvas, canvasWidth, canvasHeight);
}

/**
 * Render one annotation's tissue rows for the workspace track stack.
 * Returns tissue row hit regions (with nested enriched-region hits) for hover / selection.
 */
export function renderAnnotationsWorkspaceTrack(ctx, options) {
    const {
        annoData = {},
        annotation,
        visibleRegion,
        canvasWidth,
        canvasHeight,
        margin: plotMargin,
        geTissueStats = {},
        utils,
        recombPeakIntervals = [],
        plotMarkers,
        selectedTissue = null,
        selectedTissues = null,
        llmRelevance = null,
        enabledMutedAnnotations = [],
        enabledMutedAnnotationTissues = {},
        disabledAnnotationTissues = {},
        xAxisBandHover = false,
        livePositionMarkerX = null,
        tissueTrackSort = "alphabetical",
        pValueMax = 0.5,
    } = options;

    const tissueHits = [];

    if (!ctx || !canvasWidth || !canvasHeight || !visibleRegion || !annotation) {
        return tissueHits;
    }

    const margin = normalizePlotMargin(plotMargin);
    const plotLeft = margin.left;
    const plotTop = margin.top + VKS_ANNO_TRACK_STATS_HEADER;
    const plotWidth = canvasWidth - margin.left * 2;
    const tissues = annoData[annotation] || {};
    const tissueKeys = resolveGeTissuesForDisplay(Object.keys(tissues), {
        annotation,
        llmRelevance,
        enabledMutedAnnotationTissues,
        disabledAnnotationTissues,
        geTissueStats,
        sort: tissueTrackSort,
        pValueMax,
    });
    const plotHeight = tissueKeys.length * VKS_ANNO_TRACK_PER_TISSUE;
    const markerPlotHeight =
        VKS_ANNO_TRACK_STATS_HEADER + plotHeight + VKS_ANNO_TRACK_X_AXIS_GAP;
    const regionStart = Number(visibleRegion.start);
    const regionEnd = Number(visibleRegion.end);
    const bump = margin.bump;
    const annotationEmphasized = isGeAnnotationEmphasized(annotation, {
        llmRelevance,
        enabledMutedAnnotations,
    });
    const tissueLabelMaxWidth = Math.max(40, plotLeft - 14);
    const foldColumnLeft = plotLeft + plotWidth + VKS_ANNO_TRACK_FOLD_GAP;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (recombPeakIntervals.length) {
        renderTrackHighlightBands(ctx, {
            intervals: recombPeakIntervals,
            visibleRegion,
            margin,
            plotWidth,
            plotHeight,
            bandTop: plotTop,
            bandHeight: plotHeight,
        });
    }

    renderWorkspaceAnnotationAxis(ctx, {
        plotLeft,
        plotTop,
        plotWidth,
        plotHeight,
        xMin: regionStart,
        xMax: regionEnd,
        utils,
        bump,
        axisGap: VKS_ANNO_TRACK_X_AXIS_GAP,
    });

    ctx.fillStyle = "#000000";
    ctx.font = "22px Arial";
    ctx.textAlign = "start";
    ctx.textBaseline = "middle";
    ctx.fillText(
        "Fold",
        foldColumnLeft,
        margin.top + VKS_ANNO_TRACK_STATS_HEADER / 2
    );

    let renderHeight = plotTop;

    tissueKeys.forEach((tissue, tissueIndex) => {
        const regions = tissues[tissue]?.region || [];
        const tissueEmphasized = isGeTissueEmphasized(tissue, {
            annotation,
            llmRelevance,
            enabledMutedAnnotationTissues,
        });
        const emphasized = annotationEmphasized && tissueEmphasized;
        const isSelected = Array.isArray(selectedTissues)
            ? selectedTissues.includes(tissue)
            : selectedTissue === tissue;
        const barColor = isSelected ? "#EE3124" : VKS_GE_TRACK_REGION_COLOR;
        const regionHits = [];

        if (tissueIndex % 2 === 0) {
            ctx.fillStyle = emphasized ? "#00000010" : "#00000006";
            ctx.fillRect(plotLeft, renderHeight, plotWidth, VKS_ANNO_TRACK_PER_TISSUE);
        }

        regions.forEach((region) => {
            if (region.end < regionStart || region.start > regionEnd) {
                return;
            }

            const xPosStart = Math.max(
                plotLeft,
                genomicPositionToCanvasX(region.start, visibleRegion, margin, plotWidth)
            );
            const xPosEnd = Math.min(
                plotLeft + plotWidth,
                genomicPositionToCanvasX(region.end, visibleRegion, margin, plotWidth)
            );
            const width = Math.max(2, xPosEnd - xPosStart);

            ctx.fillStyle = barColor;
            ctx.fillRect(xPosStart, renderHeight, width, VKS_ANNO_TRACK_PER_TISSUE - 1);

            regionHits.push({
                tissue,
                start: Number(region.start),
                end: Number(region.end),
                state: region.state ?? "",
                biosample: region.biosample ?? "",
                dataset: region.dataset ?? "",
                method: region.method ?? "",
                source: region.source ?? "",
                xStart: xPosStart,
                xEnd: xPosStart + width,
                yTop: renderHeight,
                yBottom: renderHeight + VKS_ANNO_TRACK_PER_TISSUE,
            });
        });

        ctx.fillStyle = emphasized ? "#000000" : "#8a8a8a";
        ctx.font = "24px Arial";
        ctx.textAlign = "start";
        ctx.textBaseline = "middle";
        ctx.fillText(
            truncateTextToWidth(ctx, tissue, tissueLabelMaxWidth),
            10,
            renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2
        );

        const foldLabel = formatGeFoldLabel(geTissueStats[tissue]?.fold);
        if (foldLabel && foldLabel !== "—") {
            ctx.fillStyle = emphasized ? "#000000" : "#8a8a8a";
            ctx.font = "22px Arial";
            ctx.textAlign = "start";
            ctx.fillText(
                foldLabel,
                foldColumnLeft,
                renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2
            );
        }

        tissueHits.push({
            tissue,
            yTop: renderHeight,
            yBottom: renderHeight + VKS_ANNO_TRACK_PER_TISSUE,
            regions: regionHits,
        });

        renderHeight += VKS_ANNO_TRACK_PER_TISSUE;
    });

    renderPlotMarkerLines(ctx, {
        starredVariants: plotMarkers?.starredVariants || [],
        positionMarkers: plotMarkers?.positionMarkers || [],
        visibleRegion,
        margin,
        plotWidth,
        plotHeight: markerPlotHeight,
        canvasHeight,
    });

    if (xAxisBandHover) {
        renderXAxisBandHoverHighlight(ctx, {
            margin,
            plotWidth,
            plotHeight: markerPlotHeight,
            canvasHeight,
        });
    }

    if (livePositionMarkerX != null) {
        renderLivePositionGuideline(ctx, livePositionMarkerX, {
            margin,
            plotHeight: markerPlotHeight,
        });
    }

    return tissueHits;
}

export function findAnnotationTissueHitAtY(tissueHits, y) {
    if (!Array.isArray(tissueHits) || y == null) {
        return null;
    }
    return tissueHits.find((hit) => y >= hit.yTop && y < hit.yBottom) || null;
}

export function findAnnotationRegionHitAtPoint(tissueHits, x, y) {
    if (!Array.isArray(tissueHits) || x == null || y == null) {
        return null;
    }
    for (const tissueHit of tissueHits) {
        if (y < tissueHit.yTop || y >= tissueHit.yBottom) {
            continue;
        }
        const regions = tissueHit.regions || [];
        for (let index = regions.length - 1; index >= 0; index -= 1) {
            const region = regions[index];
            if (x >= region.xStart && x <= region.xEnd) {
                return region;
            }
        }
    }
    return null;
}

export function formatAnnotationEnrichedRegionLabel(region) {
    if (!region) {
        return "";
    }
    const start = Number(region.start);
    const end = Number(region.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return "";
    }
    return `${Math.round(start)}-${Math.round(end)}`;
}

export function formatAnnotationRegionStateLabel(state) {
    if (state == null || state === "") {
        return "state: —";
    }
    return `state: ${state}`;
}

export function formatAnnotationRegionMetaLabel(label, value) {
    if (value == null || value === "") {
        return `${label}: —`;
    }
    return `${label}: ${value}`;
}

/**
 * Render per-biosample tracks for one selected annotation + tissue.
 * Returns biosample row hits with nested enriched-region hits for hover.
 */
export function renderAnnotationBiosampleTracks(ctx, options) {
    const {
        regions = [],
        annotation,
        tissue,
        visibleRegion,
        canvasWidth,
        canvasHeight,
        margin: plotMargin,
        utils,
        recombPeakIntervals = [],
        plotMarkers,
        selectedBiosamples = [],
        selectedMethods = null,
        selectedSources = null,
        xAxisBandHover = false,
        livePositionMarkerX = null,
    } = options;

    const biosampleHits = [];

    if (!ctx || !canvasWidth || !canvasHeight || !visibleRegion || !annotation || !tissue) {
        return biosampleHits;
    }

    const margin = normalizePlotMargin(plotMargin);
    const plotLeft = margin.left;
    const plotTop = margin.top + VKS_ANNO_BIOSAMPLE_TITLE_H + VKS_ANNO_BIOSAMPLE_TITLE_GAP;
    const plotWidth = canvasWidth - margin.left * 2;
    const filteredRegions = (regions || []).filter((region) =>
        regionPassesGeMethodSourceFilter(region, { selectedMethods, selectedSources })
    );
    const biosampleGroups = groupAnnoRegionsByBiosample(filteredRegions);
    const plotHeight = biosampleGroups.length * VKS_ANNO_TRACK_PER_TISSUE;
    const markerPlotHeight =
        VKS_ANNO_BIOSAMPLE_TITLE_H +
        VKS_ANNO_BIOSAMPLE_TITLE_GAP +
        plotHeight +
        VKS_ANNO_TRACK_X_AXIS_GAP;
    const regionStart = Number(visibleRegion.start);
    const regionEnd = Number(visibleRegion.end);
    const bump = margin.bump;
    const selectedBiosampleSet = new Set(selectedBiosamples || []);
    const tissueLabelMaxWidth = Math.max(40, plotLeft - 14);
    const title = `${annotation} / ${tissue}`;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#000000";
    ctx.font = "28px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
        truncateTextToWidth(ctx, title, canvasWidth - 24),
        12,
        margin.top + VKS_ANNO_BIOSAMPLE_TITLE_H / 2 + 4
    );

    if (recombPeakIntervals.length && plotHeight > 0) {
        renderTrackHighlightBands(ctx, {
            intervals: recombPeakIntervals,
            visibleRegion,
            margin,
            plotWidth,
            plotHeight,
            bandTop: plotTop,
            bandHeight: plotHeight,
        });
    }

    if (plotHeight > 0) {
        renderWorkspaceAnnotationAxis(ctx, {
            plotLeft,
            plotTop,
            plotWidth,
            plotHeight,
            xMin: regionStart,
            xMax: regionEnd,
            utils,
            bump,
        });
    }

    let renderHeight = plotTop;

    biosampleGroups.forEach((group, biosampleIndex) => {
        const { biosample } = group;
        const regionHits = [];
        const isSelected = selectedBiosampleSet.has(
            biosampleSelectionKey(tissue, biosample)
        );
        const barColor = isSelected ? "#EE3124" : VKS_GE_TRACK_REGION_COLOR;

        if (biosampleIndex % 2 === 0) {
            ctx.fillStyle = "#00000010";
            ctx.fillRect(plotLeft, renderHeight, plotWidth, VKS_ANNO_TRACK_PER_TISSUE);
        }

        (group.regions || []).forEach((region) => {
            if (region.end < regionStart || region.start > regionEnd) {
                return;
            }

            const xPosStart = Math.max(
                plotLeft,
                genomicPositionToCanvasX(region.start, visibleRegion, margin, plotWidth)
            );
            const xPosEnd = Math.min(
                plotLeft + plotWidth,
                genomicPositionToCanvasX(region.end, visibleRegion, margin, plotWidth)
            );
            const width = Math.max(2, xPosEnd - xPosStart);

            ctx.fillStyle = barColor;
            ctx.fillRect(xPosStart, renderHeight, width, VKS_ANNO_TRACK_PER_TISSUE - 1);

            regionHits.push({
                tissue,
                biosample,
                start: Number(region.start),
                end: Number(region.end),
                state: region.state ?? "",
                dataset: region.dataset ?? "",
                method: region.method ?? "",
                source: region.source ?? "",
                xStart: xPosStart,
                xEnd: xPosStart + width,
                yTop: renderHeight,
                yBottom: renderHeight + VKS_ANNO_TRACK_PER_TISSUE,
            });
        });

        ctx.fillStyle = "#000000";
        ctx.font = "24px Arial";
        ctx.textAlign = "start";
        ctx.textBaseline = "middle";
        ctx.fillText(
            truncateTextToWidth(ctx, biosample, tissueLabelMaxWidth),
            10,
            renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2
        );

        biosampleHits.push({
            tissue,
            biosample,
            yTop: renderHeight,
            yBottom: renderHeight + VKS_ANNO_TRACK_PER_TISSUE,
            regions: regionHits,
        });

        renderHeight += VKS_ANNO_TRACK_PER_TISSUE;
    });

    renderPlotMarkerLines(ctx, {
        starredVariants: plotMarkers?.starredVariants || [],
        positionMarkers: plotMarkers?.positionMarkers || [],
        visibleRegion,
        margin,
        plotWidth,
        plotHeight: markerPlotHeight,
        canvasHeight,
    });

    if (xAxisBandHover && plotHeight > 0) {
        renderXAxisBandHoverHighlight(ctx, {
            margin,
            plotWidth,
            plotHeight: markerPlotHeight,
            canvasHeight,
        });
    }

    if (livePositionMarkerX != null && plotHeight > 0) {
        renderLivePositionGuideline(ctx, livePositionMarkerX, {
            margin,
            plotHeight: markerPlotHeight,
        });
    }

    return biosampleHits;
}
