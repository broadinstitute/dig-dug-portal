/** Internal canvas pixels per gene row (name + body + spacing). */
export const VKS_GENE_TRACK_ROW_HEIGHT = 60;

const LANE_COLLISION_PADDING = 100;
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

export function computeGenesTrackCanvasHeight(margin, laneCount) {
    if (!laneCount) {
        return 0;
    }
    return margin.top + VKS_GENE_TRACK_ROW_HEIGHT * laneCount;
}

export function computeRegionPlotWidth(canvasWidth, margin) {
    return canvasWidth - margin.left * 2;
}

function formatGeneLabel(gene) {
    if (gene.strand === "+") {
        return `${gene.gene_name} ${STRAND_RIGHT}`;
    }
    return `${STRAND_LEFT} ${gene.gene_name}`;
}

function renderGeneExons(ctx, gene, xMin, xMax, xStart, xPosByPixel, yPos) {
    if (!Array.isArray(gene.exons)) {
        return;
    }

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
    ctx.strokeStyle = "#000000";
    ctx.setLineDash([]);
    ctx.font = "italic bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";

    const { layouts } = layoutGenesInLanes(genes, xMin, xMax, xStart, xPosByPixel);

    layouts.forEach(({ gene, lane, xStartPos, xEndPos }) => {
        const yPos = margin.top + lane * VKS_GENE_TRACK_ROW_HEIGHT;

        ctx.fillText(
            formatGeneLabel(gene),
            xStartPos + (xEndPos - xStartPos) / 2,
            yPos
        );

        ctx.beginPath();
        ctx.moveTo(xStartPos, yPos + 20);
        ctx.lineTo(xEndPos, yPos + 20);
        ctx.stroke();

        renderGeneExons(ctx, gene, xMin, xMax, xStart, xPosByPixel, yPos);
    });
}
