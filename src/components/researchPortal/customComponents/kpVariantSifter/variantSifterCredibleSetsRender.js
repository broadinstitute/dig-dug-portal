import {
    getInternalPlotHeight,
    normalizePlotMargin,
    renderTrackHighlightBands,
    renderPlotAxis,
    renderPlotDot,
    setupPlotCanvas,
    VKS_DEFAULT_DOT_RADIUS,
} from "./variantSifterPlotShared.js";
import {
    isVariantStarred,
    renderLivePositionGuideline,
    renderPlotMarkerLines,
    renderStarDot,
    renderXAxisBandHoverHighlight,
} from "./variantSifterPlotMarkers.js";

export const VKS_CS_TRACK_DISPLAY_HEIGHT = 70;

const CS_Y_MIN = 0;
const CS_Y_MAX = 1;

function resolveVariantId(variant, formattedRow) {
    return (
        formattedRow?.["Variant ID"] ||
        variant?.varId ||
        variant?.["Variant ID"] ||
        ""
    );
}

function resolveFormattedRow(variant, formattedRow) {
    if (formattedRow) {
        return formattedRow;
    }
    const position = Number(variant?.position ?? variant?.Position);
    const ppa = variant?.posteriorProbability ?? variant?.PPA;
    return {
        "Variant ID": resolveVariantId(variant),
        Position: position,
        PPA: ppa,
        varId: variant?.varId,
    };
}

/**
 * Render PPA vs genomic position for selected credible sets.
 * Returns dot hit-test positions for hover / click handling.
 */
export function renderCredibleSetsTrack(ctx, options) {
    const {
        canvasWidth,
        canvasHeight,
        margin: plotMargin,
        viewRegion,
        selectedSets,
        colorBySetId,
        plotMarkers,
        recombPeakIntervals = [],
        phenotypeLabel,
        utils,
        starredVariants = [],
        xAxisBandHover = false,
        livePositionMarkerX = null,
    } = options;

    const dotPositions = [];

    if (!ctx || !canvasWidth || !viewRegion || !selectedSets?.length) {
        return dotPositions;
    }

    const margin = normalizePlotMargin(plotMargin);
    const plotWidth = canvasWidth - margin.left * 2;
    const plotHeight = getInternalPlotHeight(VKS_CS_TRACK_DISPLAY_HEIGHT);
    const xMin = Number(viewRegion.start);
    const xMax = Number(viewRegion.end);
    const xSpan = xMax - xMin;
    if (!xSpan || plotWidth <= 0) {
        return dotPositions;
    }

    const xPosByPixel = plotWidth / xSpan;
    const yPosByPixel = plotHeight / (CS_Y_MAX - CS_Y_MIN);
    const xStart = margin.left;
    const yStart = margin.top + plotHeight;

    if (phenotypeLabel) {
        ctx.font = "24px Arial";
        ctx.fillStyle = "#333333";
        ctx.textAlign = "left";
        ctx.fillText(phenotypeLabel, margin.bump || 11, margin.top - 6);
    }

    renderPlotAxis(ctx, {
        margin,
        plotWidth,
        plotHeight,
        yMin: CS_Y_MIN,
        yMax: CS_Y_MAX,
        xMin,
        xMax,
        type: "cs",
        utils,
        yAxisLabel: "PPA",
        xAxisLabel: "",
    });

    renderTrackHighlightBands(ctx, {
        intervals: recombPeakIntervals,
        visibleRegion: viewRegion,
        margin,
        plotWidth,
        plotHeight,
    });

    let dotsInRegion = 0;

    selectedSets.forEach(({ credibleSetId, variants, formattedVariants }) => {
        const color = colorBySetId?.[credibleSetId] || "#32AFD550";
        (variants || []).forEach((variant, index) => {
            const position = Number(variant.position ?? variant.Position);
            const ppa = Number(variant.PPA ?? variant.posteriorProbability ?? 0);
            if (Number.isNaN(position) || position < xMin || position > xMax) {
                return;
            }

            const formattedRow = resolveFormattedRow(
                variant,
                formattedVariants?.[index]
            );
            const variantId = resolveVariantId(variant, formattedRow);
            const xPos = xStart + (position - xMin) * xPosByPixel;
            const yPos = yStart - (ppa - CS_Y_MIN) * yPosByPixel;

            dotPositions.push({
                x: xPos,
                y: yPos,
                row: formattedRow,
                credibleSetId,
                ppa,
            });

            if (isVariantStarred(starredVariants, variantId)) {
                renderStarDot(ctx, xPos, yPos, color);
            } else {
                renderPlotDot(ctx, xPos, yPos, color);
            }
            dotsInRegion += 1;
        });
    });

    if (dotsInRegion === 0) {
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#666666";
        ctx.fillText(
            "No credible variants in the visible region",
            margin.left + plotWidth / 2,
            margin.top + plotHeight / 2
        );
    }

    renderPlotMarkerLines(ctx, {
        starredVariants: plotMarkers?.starredVariants || [],
        positionMarkers: plotMarkers?.positionMarkers || [],
        visibleRegion: viewRegion,
        margin,
        plotWidth,
        plotHeight,
        canvasHeight,
    });

    if (xAxisBandHover && livePositionMarkerX != null) {
        renderXAxisBandHoverHighlight(ctx, {
            margin,
            plotWidth,
            plotHeight,
            canvasHeight,
        });
        renderLivePositionGuideline(ctx, livePositionMarkerX, {
            margin,
            plotHeight,
        });
    }

    return dotPositions;
}

export function computeCredibleSetsTrackCanvasHeight(plotMargin) {
    const margin = normalizePlotMargin(plotMargin);
    const plotHeight = getInternalPlotHeight(VKS_CS_TRACK_DISPLAY_HEIGHT);
    return margin.top + plotHeight + margin.bottom;
}

export function setupCredibleSetsCanvas(canvas, canvasWidth, canvasHeight) {
    return setupPlotCanvas(canvas, canvasWidth, canvasHeight);
}

export { VKS_DEFAULT_DOT_RADIUS };
