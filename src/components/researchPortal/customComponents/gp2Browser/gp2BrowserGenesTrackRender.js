/**
 * GP2 Browser genes track rendering — forked from
 * `kpVariantSifter/variantSifterGenesTrackRender.js` (shared file, never
 * modified — see gp2Browser/AGENTS.md).
 *
 * Differences from the shared version:
 * - The gene label renders beside the gene body (on the side the strand
 *   arrow points to) instead of centered above it, and lane-packing only
 *   reserves horizontal clearance on that one side (measured from the real
 *   label width when a canvas context is available, falling back to a
 *   character-count estimate otherwise) instead of a flat 100px pad on both
 *   sides. Genes that previously collided only because of the centered
 *   label's overhang now often share a lane, so the whole track needs fewer
 *   lanes — and therefore less vertical space.
 * - Row height is half the shared track's (labels no longer need vertical
 *   clearance above the gene body).
 * - `showLabels: false` (the collapsed view) drops the text label and its
 *   lane padding entirely — packing then only has to avoid exon/body
 *   collisions, so far more genes fit per lane — and draws a small filled
 *   arrowhead at the strand's leading end instead, since the label (and the
 *   arrow character baked into it) is gone. Hit-testing / hover still finds
 *   the gene either way, so its name is one hover away via the info panel.
 */

/** Internal canvas pixels per gene row. */
export const GP2_GENE_TRACK_ROW_HEIGHT = 45;

/** Small visual gap (px) between a gene's body and its side label. */
export const GP2_GENE_LABEL_GAP = 8;
/** Horizontal clearance reserved on the label side when no ctx is available for measurement. */
export const GP2_GENE_LABEL_FALLBACK_PADDING = 110;
/** Horizontal clearance reserved on the non-label side (just a small visual gap between lanes). */
export const GP2_GENE_NON_LABEL_PADDING = 8;

export const GP2_GENE_LABEL_FONT = "italic bold 24px Arial";

/** Half-height (px) of a gene's hover hit-band — kept inside one row so adjacent lanes don't overlap. */
const GENE_HIT_HALF_HEIGHT = Math.max(12, GP2_GENE_TRACK_ROW_HEIGHT / 2 - 2);
/** Collapsed-view strand arrowhead size (px). */
const STRAND_ARROW_SIZE = 6;
/** Gap (px) between the gene body/exons and the collapsed-view strand arrowhead. */
const STRAND_ARROW_GAP = 5;

import { geneColorForGene } from "../kpVariantSifter/variantSifterGenesColors.js";

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
    return leftStart < rightEnd && rightStart < leftEnd;
}

function formatGeneLabel(gene) {
    if (gene.strand === "+") {
        return `${gene.gene_name} ${STRAND_RIGHT}`;
    }
    return `${STRAND_LEFT} ${gene.gene_name}`;
}

/** Label (when shown) renders on the side the strand arrow points to. */
function labelOnRight(gene) {
    return gene.strand === "+";
}

function measureGeneLabelWidth(ctx, gene) {
    const label = formatGeneLabel(gene);
    if (!ctx) {
        return Math.max(label.length * 13, 48);
    }
    const previousFont = ctx.font;
    ctx.font = GP2_GENE_LABEL_FONT;
    const width = ctx.measureText(label).width;
    ctx.font = previousFont;
    return width;
}

/**
 * Pack visible genes into the fewest horizontal lanes without overlapping
 * gene bodies (and, when `showLabels` is true, their side labels). `ctx`
 * (optional) lets label widths be measured precisely instead of estimated
 * from character count.
 * Returns [{ gene, lane, xStartPos, xEndPos }, ...] and laneCount.
 */
export function layoutGenesInLanes(
    genes,
    xMin,
    xMax,
    xStart,
    xPosByPixel,
    ctx = null,
    showLabels = true
) {
    const candidates = [];

    (genes || []).forEach((gene) => {
        if (!geneOverlapsRegion(gene, xMin, xMax)) {
            return;
        }
        const { xStartPos, xEndPos } = geneXSpan(
            gene,
            xMin,
            xMax,
            xStart,
            xPosByPixel
        );
        const bodyLeft = Math.min(xStartPos, xEndPos);
        const bodyRight = Math.max(xStartPos, xEndPos);

        let occupyStart = bodyLeft - GP2_GENE_NON_LABEL_PADDING;
        let occupyEnd = bodyRight + GP2_GENE_NON_LABEL_PADDING;

        if (showLabels) {
            const labelWidth = ctx
                ? measureGeneLabelWidth(ctx, gene)
                : GP2_GENE_LABEL_FALLBACK_PADDING - GP2_GENE_LABEL_GAP;
            const labelPadding = labelWidth + GP2_GENE_LABEL_GAP;
            if (labelOnRight(gene)) {
                occupyEnd = bodyRight + labelPadding;
            } else {
                occupyStart = bodyLeft - labelPadding;
            }
        }

        candidates.push({ gene, xStartPos, xEndPos, occupyStart, occupyEnd });
    });

    // Left-to-right packing finds denser layouts than input order alone.
    candidates.sort((a, b) => {
        if (a.occupyStart !== b.occupyStart) {
            return a.occupyStart - b.occupyStart;
        }
        return a.occupyEnd - b.occupyEnd;
    });

    /** @type {{ start: number, end: number }[][]} */
    const laneOccupancy = [];
    const layouts = [];

    candidates.forEach((candidate) => {
        let lane = laneOccupancy.findIndex(
            (regions) =>
                !regions.some((region) =>
                    spansOverlap(
                        candidate.occupyStart,
                        candidate.occupyEnd,
                        region.start,
                        region.end
                    )
                )
        );

        if (lane < 0) {
            lane = laneOccupancy.length;
            laneOccupancy.push([]);
        }

        laneOccupancy[lane].push({
            start: candidate.occupyStart,
            end: candidate.occupyEnd,
        });

        layouts.push({
            gene: candidate.gene,
            lane,
            xStartPos: candidate.xStartPos,
            xEndPos: candidate.xEndPos,
        });
    });

    return {
        layouts,
        laneCount: laneOccupancy.length,
    };
}

/**
 * Canvas hit regions for gene labels and bodies (internal retina coordinates).
 */
export function computeGeneTrackHitRegions(
    genes,
    visibleRegion,
    margin,
    canvasWidth,
    ctx = null,
    showLabels = true
) {
    if (!genes?.length || !visibleRegion || !canvasWidth) {
        return [];
    }

    const xMin = Number(visibleRegion.start);
    const xMax = Number(visibleRegion.end);
    const plotWidth = computeRegionPlotWidth(canvasWidth, margin);
    const xStart = margin.left;
    const xPosByPixel = plotWidth / (xMax - xMin || 1);
    const { layouts } = layoutGenesInLanes(
        genes,
        xMin,
        xMax,
        xStart,
        xPosByPixel,
        ctx,
        showLabels
    );

    return layouts.map(({ gene, lane, xStartPos, xEndPos }) => {
        const yPos = margin.top + lane * GP2_GENE_TRACK_ROW_HEIGHT;
        const bodyLeft = Math.min(xStartPos, xEndPos);
        const bodyRight = Math.max(xStartPos, xEndPos);
        const onRight = labelOnRight(gene);
        const labelWidth = showLabels
            ? measureGeneLabelWidth(ctx, gene)
            : STRAND_ARROW_GAP + STRAND_ARROW_SIZE * 1.3;
        const labelLeft = showLabels
            ? onRight
                ? bodyRight + GP2_GENE_LABEL_GAP
                : bodyLeft - GP2_GENE_LABEL_GAP - labelWidth
            : onRight
              ? bodyRight
              : bodyLeft - labelWidth;
        const labelRight = labelLeft + labelWidth;
        const bodyCenterY = yPos + 20;

        return {
            gene,
            left: Math.min(bodyLeft, labelLeft) - 6,
            right: Math.max(bodyRight, labelRight) + 6,
            top: bodyCenterY - GENE_HIT_HALF_HEIGHT,
            bottom: bodyCenterY + GENE_HIT_HALF_HEIGHT,
            centerX: bodyLeft + (bodyRight - bodyLeft) / 2,
            centerY: bodyCenterY,
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
    return margin.top + GP2_GENE_TRACK_ROW_HEIGHT * laneCount;
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

/** Small filled triangle marking strand direction, used when labels are hidden. */
function renderStrandArrow(ctx, x, y, color, pointingRight) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (pointingRight) {
        ctx.moveTo(x, y - STRAND_ARROW_SIZE);
        ctx.lineTo(x + STRAND_ARROW_SIZE * 1.3, y);
        ctx.lineTo(x, y + STRAND_ARROW_SIZE);
    } else {
        ctx.moveTo(x, y - STRAND_ARROW_SIZE);
        ctx.lineTo(x - STRAND_ARROW_SIZE * 1.3, y);
        ctx.lineTo(x, y + STRAND_ARROW_SIZE);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw genes onto a 2× retina canvas aligned with the association region plot.
 * `ctx` should already be sized (via `setupPlotCanvas`) before calling this.
 * `showLabels: false` renders the collapsed view (exons + a strand arrowhead,
 * no text label) — see the file-level comment.
 */
export function renderGenesTrack(ctx, options) {
    const {
        genes = [],
        visibleRegion,
        margin,
        canvasWidth,
        canvasHeight,
        colorByGeneType = {},
        showLabels = true,
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
    ctx.font = GP2_GENE_LABEL_FONT;
    ctx.textBaseline = "middle";

    const { layouts } = layoutGenesInLanes(
        genes,
        xMin,
        xMax,
        xStart,
        xPosByPixel,
        ctx,
        showLabels
    );

    layouts.forEach(({ gene, lane, xStartPos, xEndPos }) => {
        const yPos = margin.top + lane * GP2_GENE_TRACK_ROW_HEIGHT;
        const bodyCenterY = yPos + 20;
        const color = geneColorForGene(gene, colorByGeneType);
        const onRight = labelOnRight(gene);

        if (showLabels) {
            ctx.fillStyle = color;
            ctx.textAlign = onRight ? "left" : "right";
            ctx.fillText(
                formatGeneLabel(gene),
                onRight ? xEndPos + GP2_GENE_LABEL_GAP : xStartPos - GP2_GENE_LABEL_GAP,
                bodyCenterY
            );
        }

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(xStartPos, yPos + 20);
        ctx.lineTo(xEndPos, yPos + 20);
        ctx.stroke();

        if (!showLabels) {
            renderStrandArrow(
                ctx,
                onRight ? xEndPos + STRAND_ARROW_GAP : xStartPos - STRAND_ARROW_GAP,
                bodyCenterY,
                color,
                onRight
            );
        }

        renderGeneExons(ctx, gene, xMin, xMax, xStart, xPosByPixel, yPos, color);
    });
}
