import {
    getInternalPlotHeight,
    normalizePlotMargin,
    setupPlotCanvas,
} from "./variantSifterPlotShared.js";
import { renderPlotMarkerLines } from "./variantSifterPlotMarkers.js";

export const VKS_CS_TRACK_DISPLAY_HEIGHT = 100;

function renderDot(ctx, x, y, color, radius = 8) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function renderCsAxis(ctx, margin, plotWidth, plotHeight, yBase, xMin, xMax) {
    const bump = margin.bump || 11;
    const left = margin.left;
    const right = left + plotWidth;

    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(left - bump, yBase);
    ctx.lineTo(left - bump, yBase + plotHeight + bump);
    ctx.lineTo(right + bump, yBase + plotHeight + bump);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.font = "24px Arial";
    ctx.fillStyle = "#333333";
    ctx.fillText("1", left - bump * 3, yBase + bump);
    ctx.fillText("0", left - bump * 3, yBase + plotHeight + bump);

    ctx.save();
    ctx.translate(left - bump * 4, yBase + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("PPA", 0, 0);
    ctx.restore();
}

/**
 * Render PPA vs genomic position for selected credible sets (one phenotype lane).
 */
export function renderCredibleSetsTrack(ctx, options) {
    const {
        canvasWidth,
        margin: plotMargin,
        viewRegion,
        selectedSets,
        colorBySetId,
        plotMarkers,
        phenotypeLabel,
    } = options;

    if (!ctx || !canvasWidth || !viewRegion || !selectedSets?.length) {
        return 0;
    }

    const margin = normalizePlotMargin(plotMargin);
    const plotWidth = canvasWidth - margin.left * 2;
    const plotHeight = getInternalPlotHeight(VKS_CS_TRACK_DISPLAY_HEIGHT);
    const xMin = Number(viewRegion.start);
    const xMax = Number(viewRegion.end);
    const xSpan = xMax - xMin;
    if (!xSpan || plotWidth <= 0) {
        return 0;
    }

    const xPerPixel = plotWidth / xSpan;
    const yPerPixel = plotHeight;
    let renderTop = margin.top;
    const laneGap = 28;
    const titleHeight = 32;

    ctx.font = "24px Arial";
    ctx.fillStyle = "#333333";
    ctx.textAlign = "left";
    if (phenotypeLabel) {
        ctx.fillText(phenotypeLabel, margin.bump || 11, renderTop + 24);
    }
    renderTop += titleHeight;

    renderCsAxis(ctx, margin, plotWidth, plotHeight, renderTop, xMin, xMax);

    let dotsInRegion = 0;

    selectedSets.forEach(({ credibleSetId, variants }) => {
        const color = colorBySetId?.[credibleSetId] || "#32AFD5";
        (variants || []).forEach((variant) => {
            const position = Number(variant.position ?? variant.Position);
            const ppa = Number(variant.PPA ?? variant.posteriorProbability ?? 0);
            if (Number.isNaN(position) || position < xMin || position > xMax) {
                return;
            }

            const xPos = (position - xMin) * xPerPixel + margin.left;
            const yPos = renderTop + plotHeight - ppa * yPerPixel;
            renderDot(ctx, xPos, yPos, color);
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
            renderTop + plotHeight / 2
        );
    }

    const trackMargin = { ...margin, top: renderTop };
    renderPlotMarkerLines(ctx, {
        starredVariants: plotMarkers?.starredVariants || [],
        positionMarkers: plotMarkers?.positionMarkers || [],
        visibleRegion: viewRegion,
        margin: trackMargin,
        plotWidth,
        plotHeight,
        canvasHeight: renderTop + plotHeight + (margin.bottom || 0),
    });

    return renderTop + plotHeight + laneGap;
}

export function computeCredibleSetsTrackCanvasHeight(plotMargin, hasSelectedSets) {
    if (!hasSelectedSets) {
        return 0;
    }
    const margin = normalizePlotMargin(plotMargin);
    const plotHeight = getInternalPlotHeight(VKS_CS_TRACK_DISPLAY_HEIGHT);
    return margin.top + 32 + plotHeight + 28;
}

export function setupCredibleSetsCanvas(canvas, canvasWidth, canvasHeight) {
    return setupPlotCanvas(canvas, canvasWidth, canvasHeight);
}
