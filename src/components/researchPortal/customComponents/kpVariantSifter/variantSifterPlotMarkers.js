import plotUtils from "@/utils/plotUtils.js";
import {
    normalizePlotMargin,
    renderTrackHighlightBands,
} from "./variantSifterPlotShared.js";

export const VKS_STAR_DOT_SCALE = 1.25;
const VKS_STAR_DOT_INNER = 5 * VKS_STAR_DOT_SCALE;
const VKS_STAR_DOT_OUTER = 10 * VKS_STAR_DOT_SCALE;
const VKS_STAR_DOT_SPIKE = 6 * VKS_STAR_DOT_SCALE;

export const VKS_STAR_LINE_COLOR = "#FFAA0088";
export const VKS_POSITION_MARKER_COLOR = "#ff0000";
/** Red x-axis band fill for highlighted gene regions (50% opacity). */
export const VKS_GENE_REGION_X_AXIS_FILL = "rgba(255, 0, 0, 0.5)";
/** Fixed height (canvas px) for gene-region x-axis highlight bars. */
export const VKS_GENE_REGION_X_AXIS_HEIGHT = 10;
export const VKS_GENE_REGION_X_AXIS_LABEL_COLOR = "#b71c1c";
/** Canvas font for gene-region x-axis labels (retina canvases are 2× CSS px). */
export const VKS_GENE_REGION_X_AXIS_LABEL_FONT = "bold 22px sans-serif";

export function emptyPlotMarkersState() {
    return {
        starredVariants: [],
        positionMarkers: [],
        geneRegionMarkers: [],
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

function normalizeGeneRegionMarkerName(value) {
    return String(value || "").trim().toUpperCase();
}

/**
 * Toggle a gene genomic span used for genes-track underlines and association/QTL
 * x-axis highlight bars. `gene` needs `{ geneName|symbol, start, end }`.
 */
export function toggleGeneRegionMarker(geneRegionMarkers, gene) {
    const geneName = String(
        gene?.geneName || gene?.gene_name || gene?.symbol || ""
    ).trim();
    const start = Number(gene?.start);
    const end = Number(gene?.end);
    if (
        !geneName ||
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start === end
    ) {
        return Array.isArray(geneRegionMarkers) ? [...geneRegionMarkers] : [];
    }

    const markers = Array.isArray(geneRegionMarkers)
        ? [...geneRegionMarkers]
        : [];
    const key = normalizeGeneRegionMarkerName(geneName);
    const existingIndex = markers.findIndex(
        (marker) =>
            normalizeGeneRegionMarkerName(
                marker?.geneName || marker?.gene_name || marker?.symbol
            ) === key
    );
    if (existingIndex >= 0) {
        markers.splice(existingIndex, 1);
        return markers;
    }
    markers.push({
        geneName,
        start: Math.min(start, end),
        end: Math.max(start, end),
    });
    return markers;
}

export function geneRegionMarkerNameSet(geneRegionMarkers) {
    return new Set(
        (geneRegionMarkers || [])
            .map((marker) =>
                normalizeGeneRegionMarkerName(
                    marker?.geneName || marker?.gene_name || marker?.symbol
                )
            )
            .filter(Boolean)
    );
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

/**
 * Draw thin red semi-transparent bars on the x-axis for highlighted gene spans,
 * with the gene symbol centered just above each bar.
 */
export function renderGeneRegionXAxisBands(ctx, options) {
    const {
        geneRegionMarkers = [],
        visibleRegion,
        margin,
        plotWidth,
        plotHeight,
        canvasHeight,
        fillStyle = VKS_GENE_REGION_X_AXIS_FILL,
        bandHeight = VKS_GENE_REGION_X_AXIS_HEIGHT,
        labelColor = VKS_GENE_REGION_X_AXIS_LABEL_COLOR,
    } = options;

    if (!ctx || !geneRegionMarkers?.length || !visibleRegion || !margin) {
        return;
    }

    const { bandTop } = getXAxisBandBounds(margin, plotHeight, canvasHeight);
    if (!bandHeight) {
        return;
    }

    renderTrackHighlightBands(ctx, {
        intervals: geneRegionMarkers,
        visibleRegion,
        margin,
        plotWidth,
        plotHeight,
        bandTop,
        bandHeight,
        fillStyle,
    });

    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const xSpan = xMax - xMin;
    if (!xSpan) {
        return;
    }

    const xPosByPixel = plotWidth / xSpan;
    const labelY = bandTop - 2;
    const plotLeft = margin.left;
    const plotRight = margin.left + plotWidth;

    ctx.save();
    ctx.font = VKS_GENE_REGION_X_AXIS_LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    geneRegionMarkers.forEach((marker) => {
        const name = String(
            marker?.geneName || marker?.gene_name || marker?.symbol || ""
        ).trim();
        if (!name) {
            return;
        }
        const start = Number(marker.start);
        const end = Number(marker.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return;
        }
        const x1 = plotLeft + (Math.min(start, end) - xMin) * xPosByPixel;
        const x2 = plotLeft + (Math.max(start, end) - xMin) * xPosByPixel;
        const mid = (x1 + x2) / 2;
        if (mid < plotLeft || mid > plotRight) {
            return;
        }

        // Light halo so the symbol stays readable over tick labels / the bar.
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.strokeText(name, mid, labelY);
        ctx.fillStyle = labelColor;
        ctx.fillText(name, mid, labelY);
    });
    ctx.restore();
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
    plotUtils.renderStar(
        ctx,
        xPos,
        yPos,
        VKS_STAR_DOT_INNER,
        VKS_STAR_DOT_OUTER,
        VKS_STAR_DOT_SPIKE,
        color,
        color
    );
}
