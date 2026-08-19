/** Internal canvas pixels per gene row (name + body + spacing). */
export const VKS_GENE_TRACK_ROW_HEIGHT = 60;

/** Horizontal padding when testing gene label lane collisions (matches ResearchGenesTrack). */
export const LANE_COLLISION_PADDING = 100;

export const VKS_GENE_LABEL_FONT = "italic bold 24px Arial";

import { geneColorForGene } from "./variantSifterGenesColors.js";
const STRAND_RIGHT = "\u{2192}";
const STRAND_LEFT = "\u{2190}";

function geneOverlapsRegion(gene, xMin, xMax) {
    return gene.start <= xMax && gene.end >= xMin;
}

function geneXSpan(gene, xMin, xMax, xStart, xPosByPixel) {
    const xStartPos =
        gene.start > xMin ? xStart + (gene.start - xMin) * xPosByPixel : xStart;
    const xEndPos =
        gene.end < xMax
            ? xStart + (gene.end - xMin) * xPosByPixel
            : xStart + (xMax - xMin) * xPosByPixel;
    return { xStartPos, xEndPos };
}

function spansOverlap(leftStart, leftEnd, rightStart, rightEnd) {
    return (
        (leftStart >= rightStart && leftStart <= rightEnd) ||
        (leftEnd >= rightStart && leftEnd <= rightEnd)
    );
}

/**
 * Assign each visible gene to a horizontal lane to reduce label overlap.
 * Returns [{ gene, lane, xStartPos, xEndPos }, ...] and laneCount.
 */
export function layoutGenesInLanes(genes, xMin, xMax, xStart, xPosByPixel) {
    const layouts = [];
    let takenGeneRegions = [];
    let lane = 0;

    genes.forEach((gene) => {
        if (!geneOverlapsRegion(gene, xMin, xMax)) {
            return;
        }

        const { xStartPos, xEndPos } = geneXSpan(gene, xMin, xMax, xStart, xPosByPixel);
        const collision = takenGeneRegions.some((region) =>
            spansOverlap(xStartPos, xEndPos, region.start, region.end)
        );

        if (takenGeneRegions.length > 0 && collision) {
            takenGeneRegions = [];
            lane += 1;
        }

        takenGeneRegions.push({
            start: xStartPos - LANE_COLLISION_PADDING,
            end: xEndPos + LANE_COLLISION_PADDING,
        });

        layouts.push({ gene, lane, xStartPos, xEndPos });
    });

    const laneCount = layouts.length ? lane + 1 : 0;
    return { layouts, laneCount };
}

function formatGeneLabel(gene) {
    if (gene.strand === "+") {
        return `${gene.gene_name} ${STRAND_RIGHT}`;
    }
    return `${STRAND_LEFT} ${gene.gene_name}`;
}

function measureGeneLabelWidth(ctx, gene) {
    const label = formatGeneLabel(gene);
    if (!ctx) {
        return Math.max(label.length * 13, 48);
    }
    const previousFont = ctx.font;
    ctx.font = VKS_GENE_LABEL_FONT;
    const width = ctx.measureText(label).width;
    ctx.font = previousFont;
    return width;
}

/**
 * Canvas hit regions for gene labels and bodies (internal retina coordinates).
 */
export function computeGeneTrackHitRegions(
    genes,
    visibleRegion,
    margin,
    canvasWidth,
    ctx = null
) {
    if (!genes?.length || !visibleRegion || !canvasWidth) {
        return [];
    }

    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const plotWidth = computeRegionPlotWidth(canvasWidth, margin);
    const xStart = margin.left;
    const xPosByPixel = plotWidth / (xMax - xMin || 1);
    const { layouts } = layoutGenesInLanes(genes, xMin, xMax, xStart, xPosByPixel);

    return layouts.map(({ gene, lane, xStartPos, xEndPos }) => {
        const yPos = margin.top + lane * VKS_GENE_TRACK_ROW_HEIGHT;
        const bodyLeft = Math.min(xStartPos, xEndPos);
        const bodyRight = Math.max(xStartPos, xEndPos);
        const labelCenterX = bodyLeft + (bodyRight - bodyLeft) / 2;
        const labelHalfWidth = measureGeneLabelWidth(ctx, gene) / 2;
        const labelLeft = labelCenterX - labelHalfWidth;
        const labelRight = labelCenterX + labelHalfWidth;

        return {
            gene,
            left: Math.min(bodyLeft, labelLeft) - 6,
            right: Math.max(bodyRight, labelRight) + 6,
            top: yPos - 30,
            bottom: yPos + 34,
            centerX: labelCenterX,
            centerY: yPos - 12,
        };
    });
}

export function findGeneHitAtCanvasPoint(hitRegions, x, y, padding = 6) {
    let bestHit = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    hitRegions.forEach((region) => {
        const withinX = x >= region.left - padding && x <= region.right + padding;
        const withinY = y >= region.top - padding && y <= region.bottom + padding;
        if (!withinX || !withinY) {
            return;
        }

        const distance = Math.hypot(x - region.centerX, y - region.centerY);
        if (distance < bestDistance) {
            bestHit = region;
            bestDistance = distance;
        }
    });

    return bestHit;
}

export function computeGenesTrackCanvasHeight(margin, laneCount) {
    if (!laneCount) {
        return 0;
    }
    return margin.top + VKS_GENE_TRACK_ROW_HEIGHT * laneCount;
}

export function computeRegionPlotWidth(canvasWidth, margin) {
    return canvasWidth - margin.left * 2;
}

function renderGeneExons(ctx, gene, xMin, xMax, xStart, xPosByPixel, yPos, color) {
    if (!Array.isArray(gene.exons)) {
        return;
    }

    ctx.fillStyle = color;

    gene.exons.forEach((exon) => {
        if (exon.start >= xMax || exon.end <= xMin) {
            return;
        }

        const xonStartPos =
            exon.start > xMin
                ? xStart + (exon.start - xMin) * xPosByPixel
                : xStart;
        const xonEndPos =
            exon.end < xMax
                ? xStart + (exon.end - xMin) * xPosByPixel
                : xStart + (xMax - xMin) * xPosByPixel;
        const xonWidth = Math.max(1, xonEndPos - xonStartPos);

        ctx.fillRect(xonStartPos, yPos + 10, xonWidth, 20);
    });
}

/**
 * Draw genes onto a 2× retina canvas aligned with the association region plot.
 */
export function renderGenesTrack(ctx, options) {
    const {
        genes = [],
        visibleRegion,
        margin,
        canvasWidth,
        canvasHeight,
        colorByGeneType = {},
    } = options;

    if (!ctx || !visibleRegion || !canvasWidth || !canvasHeight) {
        return;
    }

    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const plotWidth = computeRegionPlotWidth(canvasWidth, margin);
    const xStart = margin.left;
    const xPosByPixel = plotWidth / (xMax - xMin || 1);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.font = VKS_GENE_LABEL_FONT;
    ctx.textAlign = "center";

    const { layouts } = layoutGenesInLanes(genes, xMin, xMax, xStart, xPosByPixel);

    layouts.forEach(({ gene, lane, xStartPos, xEndPos }) => {
        const yPos = margin.top + lane * VKS_GENE_TRACK_ROW_HEIGHT;
        const color = geneColorForGene(gene, colorByGeneType);

        ctx.fillStyle = color;
        ctx.fillText(
            formatGeneLabel(gene),
            xStartPos + (xEndPos - xStartPos) / 2,
            yPos
        );

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(xStartPos, yPos + 20);
        ctx.lineTo(xEndPos, yPos + 20);
        ctx.stroke();

        renderGeneExons(ctx, gene, xMin, xMax, xStart, xPosByPixel, yPos, color);
    });
}
