import plotUtils from "@/utils/plotUtils.js";
import { normalizePlotMargin } from "./variantSifterPlotShared.js";

export const VKS_STAR_LINE_COLOR = "#FFAA0088";
export const VKS_POSITION_MARKER_COLOR = "#ff0000";

export function emptyPlotMarkersState() {
    return {
        starredVariants: [],
        positionMarkers: [],
    };
}

export function createStarredVariant(row, source = "associations") {
    if (!row?.["Variant ID"]) {
        return null;
    }
    return {
        variantId: row["Variant ID"],
        position: Number(row.Position),
        source,
        row: { ...row },
    };
}

export function isVariantStarred(starredVariants, variantId) {
    return (starredVariants || []).some((entry) => entry.variantId === variantId);
}

export function toggleStarredVariant(starredVariants, row, source = "associations") {
    const variantId = row?.["Variant ID"];
    if (!variantId) {
        return starredVariants || [];
    }
    const existing = starredVariants || [];
    if (isVariantStarred(existing, variantId)) {
        return existing.filter((entry) => entry.variantId !== variantId);
    }
    const entry = createStarredVariant(row, source);
    return entry ? [...existing, entry] : existing;
}

export function genomicPositionToCanvasX(position, visibleRegion, margin, plotWidth) {
    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const xPosByPixel = plotWidth / (xMax - xMin || 1);
    return margin.left + (Number(position) - xMin) * xPosByPixel;
}

export function canvasXToGenomicPosition(canvasX, canvasWidth, plotMargin, visibleRegion) {
    const margin = normalizePlotMargin(plotMargin);
    const plotWidth = canvasWidth - margin.left * 2;
    if (!plotWidth || !visibleRegion) {
        return null;
    }
    const clampedX = Math.max(margin.left, Math.min(canvasWidth - margin.right, canvasX));
    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const fraction = (clampedX - margin.left) / plotWidth;
    return Math.floor(xMin + fraction * (xMax - xMin));
}

export function positionMarkerToleranceBp(visibleRegion) {
    const width = Number(visibleRegion.end) - Number(visibleRegion.start);
    return Math.max(500, Math.round(width / 200));
}

export function togglePositionMarker(positionMarkers, position, visibleRegion) {
    const markers = Array.isArray(positionMarkers) ? [...positionMarkers] : [];
    const tolerance = positionMarkerToleranceBp(visibleRegion);
    const existingIndex = markers.findIndex(
        (marker) => Math.abs(marker - position) <= tolerance
    );
    if (existingIndex >= 0) {
        markers.splice(existingIndex, 1);
        return markers;
    }
    markers.push(position);
    return markers;
}

export const VKS_X_AXIS_INTERACTION_BAND_FRACTION = 0.5;

export function getXAxisBandBounds(margin, plotHeight, canvasHeight) {
    const bump = margin.bump ?? 10;
    const bandTop = margin.top + plotHeight + bump;
    const fullBandBottom = canvasHeight;
    const fullBandHeight = Math.max(0, fullBandBottom - bandTop);
    const bandHeight = fullBandHeight * VKS_X_AXIS_INTERACTION_BAND_FRACTION;
    const bandBottom = bandTop + bandHeight;
    return {
        bandTop,
        bandBottom,
        bandHeight,
    };
}

export function isCanvasPointInPlotXRange(x, canvasWidth, margin) {
    return x >= margin.left && x <= canvasWidth - margin.right;
}

export function isCanvasPointInXAxisBand(y, canvasHeight, margin, plotHeight) {
    const { bandTop, bandBottom } = getXAxisBandBounds(margin, plotHeight, canvasHeight);
    return y >= bandTop && y <= bandBottom;
}

export function isCanvasPointInXAxisInteractionZone(x, y, canvasWidth, canvasHeight, margin, plotHeight) {
    return (
        isCanvasPointInPlotXRange(x, canvasWidth, margin) &&
        isCanvasPointInXAxisBand(y, canvasHeight, margin, plotHeight)
    );
}

export const VKS_X_AXIS_BAND_HOVER_FILL = "#ff880025";

export function renderXAxisBandHoverHighlight(ctx, options) {
    const { margin, plotWidth, plotHeight, canvasHeight } = options;
    const { bandTop, bandHeight } = getXAxisBandBounds(margin, plotHeight, canvasHeight);
    if (!bandHeight) {
        return;
    }
    ctx.fillStyle = VKS_X_AXIS_BAND_HOVER_FILL;
    ctx.fillRect(margin.left, bandTop, plotWidth, bandHeight);
}

export function renderLivePositionGuideline(ctx, xPos, options) {
    const { margin, plotHeight } = options;
    const yTop = margin.top - margin.bump * 3;
    const yBottom = margin.top + plotHeight + margin.bump * 3;
    plotUtils.renderDashedLine(ctx, xPos, yTop, xPos, yBottom, 1, VKS_POSITION_MARKER_COLOR, [
        6,
        2,
    ]);
    plotUtils.renderDot(ctx, xPos, yBottom, VKS_POSITION_MARKER_COLOR, 5);
}

/**
 * Draw starred-variant and position-marker vertical guides on any VS canvas track.
 */
export function renderPlotMarkerLines(ctx, options) {
    const {
        starredVariants = [],
        positionMarkers = [],
        visibleRegion,
        margin,
        plotWidth,
        plotHeight,
        canvasHeight,
        starLineColor = VKS_STAR_LINE_COLOR,
        positionLineColor = VKS_POSITION_MARKER_COLOR,
    } = options;

    if (!ctx || !visibleRegion || !margin || !plotWidth || !plotHeight) {
        return;
    }

    const yTop = margin.top - margin.bump * 3;
    const yBottom = margin.top + plotHeight + margin.bump * 3;

    starredVariants.forEach((star) => {
        const position = Number(star.position ?? star.row?.Position);
        if (!Number.isFinite(position)) {
            return;
        }
        const xPos = genomicPositionToCanvasX(
            position,
            visibleRegion,
            margin,
            plotWidth
        );
        plotUtils.renderDashedLine(ctx, xPos, yTop, xPos, yBottom, 3, starLineColor, [
            6,
            2,
        ]);
        plotUtils.renderDot(ctx, xPos, yBottom, starLineColor, 5);
    });

    positionMarkers.forEach((position) => {
        const xPos = genomicPositionToCanvasX(
            position,
            visibleRegion,
            margin,
            plotWidth
        );
        plotUtils.renderDashedLine(
            ctx,
            xPos,
            yTop,
            xPos,
            yBottom,
            1,
            positionLineColor,
            [6, 2]
        );
        plotUtils.renderDot(ctx, xPos, yBottom, positionLineColor, 5);
    });
}

export function renderStarDot(ctx, xPos, yPos, color) {
    plotUtils.renderStar(ctx, xPos, yPos, 5, 10, 6, color, color);
}
