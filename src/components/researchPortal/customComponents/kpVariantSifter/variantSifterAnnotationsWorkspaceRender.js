import {
    VKS_ANNOTATION_COLORS,
    annotationColorForKey,
    filterGeTissuesForDisplay,
    formatGeTissueStatLabel,
    isGeAnnotationEmphasized,
    isGeTissueEmphasized,
    mutedAnnotationColor,
    solidAnnotationColor,
    VKS_ANNO_TRACK_PER_TISSUE,
    VKS_ANNO_TRACK_STATS_HEADER,
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
    const { plotLeft, plotTop, plotWidth, plotHeight, xMin, xMax, utils, bump } = options;

    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.font = "24px Arial";

    ctx.beginPath();
    ctx.moveTo(plotLeft - bump, plotTop);
    ctx.lineTo(plotLeft - bump, plotTop + plotHeight);
    ctx.stroke();

    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    const xGap = xMax - xMin;
    const xDecimal = xGap <= 1 ? 2 : xGap <= 50 ? 1 : 0;

    for (let i = 0; i < 6; i += 1) {
        const tickX = plotLeft + i * xTickDistance;
        ctx.beginPath();
        ctx.moveTo(tickX, plotTop + plotHeight);
        ctx.lineTo(tickX, plotTop + plotHeight + bump);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(
            formatAxisTick(xMin + i * xStep, xDecimal, utils),
            tickX,
            plotTop + plotHeight + bump * 3
        );
    }

    ctx.restore();
}

export function setupAnnotationsWorkspaceCanvas(canvas, canvasWidth, canvasHeight) {
    return setupPlotCanvas(canvas, canvasWidth, canvasHeight);
}

/**
 * Render one annotation's tissue rows for the workspace track stack.
 * Returns tissue row hit regions for hover / selection.
 */
export function renderAnnotationsWorkspaceTrack(ctx, options) {
    const {
        annoData = {},
        annotation,
        annotations = [],
        visibleRegion,
        canvasWidth,
        canvasHeight,
        margin: plotMargin,
        geTissueStats = {},
        phenotype,
        ancestry,
        utils,
        colors = VKS_ANNOTATION_COLORS,
        recombPeakIntervals = [],
        plotMarkers,
        selectedTissue = null,
        llmRelevance = null,
        enabledMutedAnnotations = [],
        enabledMutedTissues = [],
        showFilteredTissuesInTracks = false,
        xAxisBandHover = false,
        livePositionMarkerX = null,
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
    const tissueKeys = filterGeTissuesForDisplay(Object.keys(tissues).sort(), {
        llmRelevance,
        enabledMutedTissues,
        showFilteredTissuesInTracks,
    });
    const plotHeight = tissueKeys.length * VKS_ANNO_TRACK_PER_TISSUE;
    const markerPlotHeight = VKS_ANNO_TRACK_STATS_HEADER + plotHeight;
    const regionStart = Number(visibleRegion.start);
    const regionEnd = Number(visibleRegion.end);
    const bump = margin.bump;
    const baseAnnotationColor = annotationColorForKey(annotation, annotations, colors);
    const annotationEmphasized = isGeAnnotationEmphasized(annotation, {
        llmRelevance,
        enabledMutedAnnotations,
    });
    const ancestryLabel = ancestry || "Mixed";
    const statsColumnLeft = plotLeft + plotWidth + 12;
    const tissueLabelMaxWidth = Math.max(40, plotLeft - 14);

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
    });

    ctx.fillStyle = "#000000";
    ctx.font = "22px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
        `${phenotype} (${ancestryLabel})`,
        canvasWidth - margin.right + 180,
        margin.top + VKS_ANNO_TRACK_STATS_HEADER / 2
    );

    let renderHeight = plotTop;

    tissueKeys.forEach((tissue, tissueIndex) => {
        const regions = tissues[tissue]?.region || [];
        const tissueEmphasized = isGeTissueEmphasized(tissue, {
            llmRelevance,
            enabledMutedTissues,
        });
        const emphasized = annotationEmphasized && tissueEmphasized;
        const isSelected = selectedTissue === tissue;
        const barColor = isSelected
            ? "#EE3124"
            : emphasized
              ? baseAnnotationColor
              : mutedAnnotationColor(baseAnnotationColor);

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

        const stats = geTissueStats[tissue];
        const statLabel = formatGeTissueStatLabel(stats, utils);
        if (statLabel) {
            if (stats.rank < 5) {
                ctx.fillStyle = solidAnnotationColor(baseAnnotationColor);
                ctx.beginPath();
                ctx.arc(statsColumnLeft - 10, renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2, 6, 0, 2 * Math.PI);
                ctx.fill();
            }

            if (stats.rawPValue < 0.05) {
                ctx.fillStyle = "#FF9999";
                ctx.beginPath();
                ctx.arc(statsColumnLeft - 20, renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2, 6, 0, 2 * Math.PI);
                ctx.fill();
            }

            ctx.fillStyle = "#000000";
            ctx.font = "22px Arial";
            ctx.textAlign = "start";
            ctx.fillText(
                statLabel,
                statsColumnLeft,
                renderHeight + VKS_ANNO_TRACK_PER_TISSUE / 2
            );
        }

        tissueHits.push({
            tissue,
            yTop: renderHeight,
            yBottom: renderHeight + VKS_ANNO_TRACK_PER_TISSUE,
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
    return tissueHits.find((hit) => y >= hit.yTop && y < hit.yBottom) || null;
}
