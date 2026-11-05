import {
    collectGenesFromTissueData,
    collectMethodsFromTissueData,
    normalizeV2gSelectedLinks,
    v2gLinkSelectionKey,
    VKS_V2G_METHOD_COLORS,
} from "./variantSifterV2gData.js";

const SPACE_BY = 20;
const SELECTED_TRACK_FILL = "#EE312428";
const SELECTED_TRACK_BAR = "#EE3124";

function selectedLinkSet(selectedLinks) {
    return new Set(normalizeV2gSelectedLinks(selectedLinks));
}

function isLinkTrackSelected(tissue, gene, method, selectedSet) {
    if (!selectedSet?.size || !tissue || !gene || !method) {
        return false;
    }
    return selectedSet.has(v2gLinkSelectionKey(tissue, gene, method));
}

function isGeneTrackSelected(tissue, gene, methods, selectedSet) {
    if (!selectedSet?.size || !tissue || !gene) {
        return false;
    }
    const methodList = Array.isArray(methods) ? methods : [];
    if (!methodList.length) {
        return false;
    }
    return methodList.some((method) =>
        isLinkTrackSelected(tissue, gene, method, selectedSet)
    );
}

export function findV2gTrackRowAtY(trackRows, y) {
    if (!Array.isArray(trackRows) || y == null) {
        return null;
    }
    return (
        trackRows.find((row) => y >= row.yTop && y < row.yBottom) || null
    );
}

function formatAxisTick(position, xMaxMinGap) {
    const decimals = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;
    let label = Number(position);
    if (Number.isNaN(label)) {
        return "";
    }
    if (decimals === 0) {
        label = Math.round(label);
    } else {
        label = Number(label.toFixed(decimals));
    }
    if (label >= 100000) {
        return `${Math.round(label * 0.001)}k`;
    }
    return String(label);
}

function renderAxis(ctx, margin, plotWidth, blockHeight, xMin, xMax, yPos, bump) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.setLineDash([]);

    ctx.moveTo(margin.left - bump, yPos);
    ctx.lineTo(margin.left - bump, yPos + blockHeight + bump);
    ctx.stroke();

    const rightX = Math.round(margin.left + plotWidth + bump) + 0.5;
    ctx.moveTo(rightX, yPos);
    ctx.lineTo(rightX, yPos + blockHeight + bump);
    ctx.stroke();

    ctx.moveTo(margin.left - bump, yPos + blockHeight + bump);
    ctx.lineTo(rightX, yPos + blockHeight + bump);
    ctx.stroke();

    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    const xGap = xMax - xMin;

    for (let i = 0; i < 6; i += 1) {
        const tickXPos = margin.left + i * xTickDistance;
        const adjTickXPos = Math.floor(tickXPos) + 0.5;
        ctx.moveTo(adjTickXPos, yPos + blockHeight + bump);
        ctx.lineTo(adjTickXPos, yPos + blockHeight + bump * 2);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.font = "24px Arial";
        ctx.fillStyle = "#000000";
        const positionLabel = formatAxisTick(xMin + i * xStep, xGap);
        ctx.fillText(positionLabel, adjTickXPos, yPos + blockHeight + bump * 4);
    }
}

/**
 * Render Research-style gene-links tracks (tissue → gene → method-colored bars).
 * Returns hit regions for hover (CSS / display pixel coordinates).
 */
export function renderV2gTracks(ctx, options) {
    const {
        renderData = {},
        tissueData = {},
        regionStart,
        regionEnd,
        plotWidth,
        margin,
        methodColors = VKS_V2G_METHOD_COLORS,
        selectedLinks = [],
    } = options;

    const methodsArr = collectMethodsFromTissueData(tissueData);
    const genesArr = collectGenesFromTissueData(tissueData);
    const tissues = Object.keys(renderData).sort();
    const hitRegions = [];
    const trackRows = [];
    const selectedSet = selectedLinkSet(selectedLinks);

    if (!tissues.length || !plotWidth || regionEnd <= regionStart) {
        return { hitRegions, trackRows, canvasHeight: 0 };
    }

    const tissueTitleH = SPACE_BY * 2;
    const btwnTissues = SPACE_BY * 5;
    const perMethod = SPACE_BY;
    const btwnGenes = 0;
    const topMargin = SPACE_BY * 2;
    const bottomMargin = SPACE_BY * 4;
    const bump = margin.bump != null ? margin.bump : 11;

    let contentHeight = 0;
    tissues.forEach((tissue) => {
        contentHeight += tissueTitleH;
        const genes = renderData[tissue] || {};
        genesArr.forEach((gene) => {
            if (!genes[gene]) {
                return;
            }
            contentHeight += btwnGenes + Object.keys(genes[gene]).length * perMethod;
        });
        contentHeight += btwnTissues;
    });
    contentHeight -= btwnTissues;

    const canvasHeight = contentHeight + topMargin + bottomMargin;
    const xPerPixel = plotWidth / (regionEnd - regionStart || 1);

    let renderHeight = tissueTitleH;

    tissues.forEach((tissue) => {
        const tValue = renderData[tissue] || {};

        ctx.font = "28px Arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "#00000075";
        ctx.fillText(tissue, bump, renderHeight);

        let blockHeight = 0;
        const yAxisTop = renderHeight + perMethod;
        renderHeight = yAxisTop;
        let geneIndex = 0;

        genesArr.forEach((gKey) => {
            if (!tValue[gKey]) {
                return;
            }
            const gValue = tValue[gKey];
            ctx.font = "24px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#000000";
            ctx.fillText(gKey, bump, renderHeight + perMethod);

            const methodCount = Object.keys(gValue).length;
            if (geneIndex % 2 === 0) {
                ctx.fillStyle = "#00000010";
                ctx.fillRect(
                    margin.left,
                    renderHeight,
                    plotWidth,
                    perMethod * methodCount
                );
            }

            methodsArr.forEach((mKey) => {
                if (!gValue[mKey]) {
                    return;
                }
                const mValue = gValue[mKey];
                const colorIndex = methodsArr.indexOf(mKey);
                const methodColor = methodColors[colorIndex % methodColors.length];

                // Full-width row hit so users can select the track even where no bars are drawn.
                const rowSelected = isLinkTrackSelected(
                    tissue,
                    gKey,
                    mKey,
                    selectedSet
                );
                trackRows.push({
                    yTop: renderHeight,
                    yBottom: renderHeight + perMethod,
                    xLeft: margin.left,
                    xRight: margin.left + plotWidth,
                    targetGene: gKey,
                    method: mKey,
                    tissue,
                });

                if (rowSelected) {
                    ctx.fillStyle = SELECTED_TRACK_FILL;
                    ctx.fillRect(
                        margin.left,
                        renderHeight,
                        plotWidth,
                        perMethod - 2
                    );
                }

                mValue.forEach((m) => {
                    if (!(m.start <= regionEnd && m.end >= regionStart)) {
                        return;
                    }

                    let xPosStart =
                        (m.start - regionStart) * xPerPixel + margin.left;
                    xPosStart = Math.max(margin.left, xPosStart);
                    let xPosEnd = (m.end - regionStart) * xPerPixel + margin.left;
                    xPosEnd = Math.min(margin.left + plotWidth, xPosEnd);
                    const xPosWidth = Math.max(2, xPosEnd - xPosStart);

                    ctx.fillStyle = rowSelected ? SELECTED_TRACK_BAR : methodColor;
                    ctx.fillRect(xPosStart, renderHeight, xPosWidth, perMethod - 2);

                    hitRegions.push({
                        yTop: renderHeight,
                        yBottom: renderHeight + perMethod,
                        xLeft: xPosStart,
                        xRight: xPosStart + xPosWidth,
                        targetGene: m.targetGene || gKey,
                        method: m.method || mKey,
                        biosample: m.biosample,
                        start: m.start,
                        end: m.end,
                        targetGeneStart: m.targetGeneStart,
                        targetGeneEnd: m.targetGeneEnd,
                        tissue,
                    });
                });

                renderHeight += perMethod;
                blockHeight += perMethod;
            });

            blockHeight += btwnGenes;
            renderHeight += btwnGenes;
            geneIndex += 1;
        });

        renderAxis(
            ctx,
            margin,
            plotWidth,
            blockHeight,
            Number(regionStart),
            Number(regionEnd),
            yAxisTop,
            bump
        );

        renderHeight += btwnTissues;
    });

    return { hitRegions, trackRows, canvasHeight };
}

export function computeV2gCanvasHeight(renderData, tissueData) {
    const genesArr = collectGenesFromTissueData(tissueData);
    const tissues = Object.keys(renderData || {}).sort();
    if (!tissues.length) {
        return 0;
    }

    const tissueTitleH = SPACE_BY * 2;
    const btwnTissues = SPACE_BY * 5;
    const perMethod = SPACE_BY;
    const topMargin = SPACE_BY * 2;
    const bottomMargin = SPACE_BY * 4;

    let contentHeight = 0;
    tissues.forEach((tissue) => {
        contentHeight += tissueTitleH;
        const genes = renderData[tissue] || {};
        genesArr.forEach((gene) => {
            if (!genes[gene]) {
                return;
            }
            contentHeight += Object.keys(genes[gene]).length * perMethod;
        });
        contentHeight += btwnTissues;
    });
    contentHeight -= btwnTissues;

    return contentHeight + topMargin + bottomMargin;
}

const RIBBON_BAND = SPACE_BY * 5;
const RIBBON_METHOD_GAP = SPACE_BY * 1.5;
const PROMOTER_MARK_HEIGHT = 6;
/** Minimum painted width (canvas px) for each ribbon end so links stay region→region. */
const RIBBON_MIN_END_WIDTH = 2;

/**
 * Map a genomic interval to canvas X without clamping to the plot.
 * Off-screen coordinates keep their true positions so ribbons/arcs aim at the
 * real target instead of collapsing onto the view edge.
 */
function mapGenomeIntervalRaw(start, end, regionStart, xPerPixel, margin) {
    const plotLeft = margin.left;
    let xStart = (Math.min(start, end) - regionStart) * xPerPixel + plotLeft;
    let xEnd = (Math.max(start, end) - regionStart) * xPerPixel + plotLeft;

    if (xEnd - xStart < RIBBON_MIN_END_WIDTH) {
        const mid = (xStart + xEnd) / 2;
        xStart = mid - RIBBON_MIN_END_WIDTH / 2;
        xEnd = mid + RIBBON_MIN_END_WIDTH / 2;
    }

    return [xStart, xEnd];
}

/** Visible portion of an interval for on-track bars (null if fully off-screen). */
function visibleBarInterval(xStart, xEnd, margin, plotWidth) {
    const plotLeft = margin.left;
    const plotRight = margin.left + plotWidth;
    const left = Math.max(plotLeft, Math.min(xStart, xEnd));
    const right = Math.min(plotRight, Math.max(xStart, xEnd));
    if (right <= left) {
        return null;
    }
    return [left, Math.max(RIBBON_MIN_END_WIDTH, right - left)];
}

function withPlotClip(ctx, margin, plotWidth, yTop, height, draw) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, yTop, plotWidth, height);
    ctx.clip();
    draw();
    ctx.restore();
}

function solidMethodFill(colorWithAlpha) {
    if (!colorWithAlpha || typeof colorWithAlpha !== "string") {
        return "rgba(0, 123, 255, 0.35)";
    }
    if (colorWithAlpha.length === 9 && colorWithAlpha.startsWith("#")) {
        const hex = colorWithAlpha.slice(1, 7);
        const alphaHex = colorWithAlpha.slice(7, 9);
        const alpha = Number.parseInt(alphaHex, 16) / 255;
        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${Math.min(0.45, alpha || 0.35)})`;
    }
    return colorWithAlpha;
}

/**
 * Draw a filled ribbon between two horizontal intervals.
 * Attaches at yBase (top of region bars). Outer peak is 2px above the inner
 * peak so the fill does not open a seam at the apex.
 */
function drawRibbon(ctx, leftA, rightA, leftB, rightB, yBase, yPeak, fillStyle) {
    let a0 = Math.min(leftA, rightA);
    let a1 = Math.max(leftA, rightA);
    let b0 = Math.min(leftB, rightB);
    let b1 = Math.max(leftB, rightB);

    if (a1 - a0 < RIBBON_MIN_END_WIDTH) {
        const mid = (a0 + a1) / 2;
        a0 = mid - RIBBON_MIN_END_WIDTH / 2;
        a1 = mid + RIBBON_MIN_END_WIDTH / 2;
    }
    if (b1 - b0 < RIBBON_MIN_END_WIDTH) {
        const mid = (b0 + b1) / 2;
        b0 = mid - RIBBON_MIN_END_WIDTH / 2;
        b1 = mid + RIBBON_MIN_END_WIDTH / 2;
    }

    const yPeakOuter = yPeak - 2;
    const yPeakInner = yPeak;

    ctx.beginPath();
    ctx.moveTo(a0, yBase);
    ctx.lineTo(a1, yBase);
    ctx.bezierCurveTo(a1, yPeakOuter, b1, yPeakOuter, b1, yBase);
    ctx.lineTo(b0, yBase);
    ctx.bezierCurveTo(b0, yPeakInner, a0, yPeakInner, a0, yBase);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function flattenGeneMethodLinks(geneMethods = {}) {
    const links = [];
    Object.entries(geneMethods).forEach(([method, methodLinks]) => {
        (Array.isArray(methodLinks) ? methodLinks : []).forEach((link) => {
            links.push({
                ...link,
                method: link.method || method,
                targetGene: link.targetGene,
            });
        });
    });
    return links;
}

function genesPresentInTissue(tissueGenes, genesArr) {
    return (genesArr || []).filter((gene) => tissueGenes?.[gene]);
}

function solidMethodStroke(colorWithAlpha) {
    if (!colorWithAlpha || typeof colorWithAlpha !== "string") {
        return "#007bff";
    }
    if (colorWithAlpha.length === 9 && colorWithAlpha.startsWith("#")) {
        return colorWithAlpha.slice(0, 7);
    }
    return colorWithAlpha;
}

function drawArcLine(ctx, xA, xB, yBase, yPeak, strokeStyle) {
    const midX = (xA + xB) / 2;
    ctx.beginPath();
    ctx.moveTo(xA, yBase);
    ctx.quadraticCurveTo(midX, yPeak, xB, yBase);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    ctx.stroke();
}

/**
 * Shared gene-row layout for ribbons / arcs:
 * tissue → one track per gene; link color still follows method.
 */
function renderV2gGeneConnectionTracks(ctx, options, connectionMode) {
    const {
        renderData = {},
        genesArr = [],
        colorMethodsArr = [],
        regionStart,
        regionEnd,
        plotWidth,
        margin,
        methodColors = VKS_V2G_METHOD_COLORS,
        selectedLinks = [],
    } = options;

    const tissues = Object.keys(renderData).sort();
    const hitRegions = [];
    const trackRows = [];
    const selectedSet = selectedLinkSet(selectedLinks);

    if (!tissues.length || !plotWidth || regionEnd <= regionStart) {
        return { hitRegions, trackRows, canvasHeight: 0 };
    }

    const tissueTitleH = SPACE_BY * 2;
    const btwnTissues = SPACE_BY * 5;
    const perMethod = SPACE_BY;
    const bump = margin.bump != null ? margin.bump : 11;
    const canvasHeight = computeV2gGeneConnectionCanvasHeight(renderData, genesArr);
    const xPerPixel = plotWidth / (regionEnd - regionStart || 1);

    let renderHeight = tissueTitleH;

    tissues.forEach((tissue) => {
        const tissueGenes = renderData[tissue] || {};
        const geneKeys = genesPresentInTissue(tissueGenes, genesArr);

        ctx.font = "28px Arial";
        ctx.textAlign = "left";
        ctx.fillStyle = "#00000075";
        ctx.fillText(tissue, bump, renderHeight);

        let blockHeight = 0;
        const yAxisTop = renderHeight + SPACE_BY;
        renderHeight = yAxisTop;

        geneKeys.forEach((gene, geneIndex) => {
            const links = flattenGeneMethodLinks(tissueGenes[gene]);
            const trackTop = renderHeight + RIBBON_BAND;
            const yBase = trackTop;
            const methodsForGene = Object.keys(tissueGenes[gene] || {}).sort();

            const geneSelected = isGeneTrackSelected(
                tissue,
                gene,
                methodsForGene,
                selectedSet
            );
            trackRows.push({
                yTop: renderHeight,
                yBottom: renderHeight + RIBBON_BAND + perMethod,
                xLeft: margin.left,
                xRight: margin.left + plotWidth,
                targetGene: gene,
                tissue,
                methods: methodsForGene,
            });

            if (geneSelected) {
                ctx.fillStyle = SELECTED_TRACK_FILL;
                ctx.fillRect(
                    margin.left,
                    renderHeight,
                    plotWidth,
                    RIBBON_BAND + perMethod
                );
            } else if (geneIndex % 2 === 0) {
                ctx.fillStyle = "#00000008";
                ctx.fillRect(
                    margin.left,
                    renderHeight,
                    plotWidth,
                    RIBBON_BAND + perMethod
                );
            }

            ctx.font = "22px Arial";
            ctx.textAlign = "left";
            ctx.fillStyle = "#000000";
            ctx.fillText(gene, bump, trackTop + perMethod - 2);

            withPlotClip(
                ctx,
                margin,
                plotWidth,
                renderHeight,
                RIBBON_BAND + perMethod,
                () => {
                    links.forEach((link, linkIndex) => {
                        const method = link.method;
                        const colorIndex = Math.max(0, colorMethodsArr.indexOf(method));
                        const methodColor =
                            methodColors[colorIndex % methodColors.length] ||
                            methodColors[0];
                        const reStart = Number(link.start);
                        const reEnd = Number(link.end);
                        const prStart = Number(link.targetGeneStart);
                        const prEnd = Number(link.targetGeneEnd);
                        if (
                            Number.isNaN(reStart) ||
                            Number.isNaN(reEnd) ||
                            Number.isNaN(prStart) ||
                            Number.isNaN(prEnd)
                        ) {
                            return;
                        }

                        const reOverlaps = reStart <= regionEnd && reEnd >= regionStart;
                        const prOverlaps = prStart <= regionEnd && prEnd >= regionStart;
                        if (!reOverlaps && !prOverlaps) {
                            return;
                        }

                        const [x1, x2] = mapGenomeIntervalRaw(
                            reStart,
                            reEnd,
                            regionStart,
                            xPerPixel,
                            margin
                        );
                        const [x3, x4] = mapGenomeIntervalRaw(
                            prStart,
                            prEnd,
                            regionStart,
                            xPerPixel,
                            margin
                        );

                        const peakLift = RIBBON_BAND * (0.45 + (linkIndex % 5) * 0.1);
                        const yPeak = yBase - peakLift;

                        if (connectionMode === "arcs") {
                            drawArcLine(
                                ctx,
                                (x1 + x2) / 2,
                                (x3 + x4) / 2,
                                yBase,
                                yPeak,
                                solidMethodStroke(methodColor)
                            );
                        } else {
                            drawRibbon(
                                ctx,
                                x1,
                                x2,
                                x3,
                                x4,
                                yBase,
                                yPeak,
                                solidMethodFill(methodColor)
                            );
                        }

                        if (reOverlaps) {
                            const bar = visibleBarInterval(x1, x2, margin, plotWidth);
                            if (bar) {
                                ctx.fillStyle = methodColor;
                                ctx.fillRect(bar[0], trackTop, bar[1], perMethod - 2);
                            }
                        }
                        if (prOverlaps) {
                            const tick = visibleBarInterval(x3, x4, margin, plotWidth);
                            if (tick) {
                                ctx.fillStyle = "#333333aa";
                                ctx.fillRect(
                                    tick[0],
                                    trackTop + (perMethod - 2 - PROMOTER_MARK_HEIGHT),
                                    tick[1],
                                    PROMOTER_MARK_HEIGHT
                                );
                            }
                        }

                        const plotLeft = margin.left;
                        const plotRight = margin.left + plotWidth;
                        const hitLeft = Math.max(plotLeft, Math.min(x1, x2, x3, x4));
                        const hitRight = Math.min(plotRight, Math.max(x1, x2, x3, x4));
                        if (hitRight > hitLeft) {
                            hitRegions.push({
                                yTop: Math.min(yPeak, trackTop),
                                yBottom: trackTop + perMethod,
                                xLeft: hitLeft,
                                xRight: hitRight,
                                targetGene: link.targetGene || gene,
                                method,
                                biosample: link.biosample,
                                start: link.start,
                                end: link.end,
                                targetGeneStart: link.targetGeneStart,
                                targetGeneEnd: link.targetGeneEnd,
                                tissue,
                            });
                        }
                    });
                }
            );

            renderHeight += RIBBON_BAND + perMethod + RIBBON_METHOD_GAP;
            blockHeight += RIBBON_BAND + perMethod + RIBBON_METHOD_GAP;
        });

        if (blockHeight > 0) {
            renderAxis(
                ctx,
                margin,
                plotWidth,
                blockHeight - RIBBON_METHOD_GAP,
                Number(regionStart),
                Number(regionEnd),
                yAxisTop,
                bump
            );
        }

        renderHeight += btwnTissues;
    });

    return { hitRegions, trackRows, canvasHeight };
}

/**
 * Ribbons view: one track per gene within each tissue; ribbon fill color = method.
 */
export function renderV2gRibbons(ctx, options) {
    return renderV2gGeneConnectionTracks(ctx, options, "ribbons");
}

/**
 * Arcs view: one track per gene within each tissue; 1px arc color = method.
 */
export function renderV2gArcs(ctx, options) {
    return renderV2gGeneConnectionTracks(ctx, options, "arcs");
}

export function computeV2gGeneConnectionCanvasHeight(renderData, genesArr = []) {
    const tissues = Object.keys(renderData || {}).sort();
    if (!tissues.length) {
        return 0;
    }

    const tissueTitleH = SPACE_BY * 2;
    const btwnTissues = SPACE_BY * 5;
    const perMethod = SPACE_BY;
    const topMargin = SPACE_BY * 2;
    const bottomMargin = SPACE_BY * 4;

    let contentHeight = 0;
    tissues.forEach((tissue) => {
        contentHeight += tissueTitleH;
        const geneKeys = genesPresentInTissue(renderData[tissue], genesArr);
        contentHeight += geneKeys.length * (RIBBON_BAND + perMethod + RIBBON_METHOD_GAP);
        contentHeight += btwnTissues;
    });
    contentHeight -= btwnTissues;

    return contentHeight + topMargin + bottomMargin;
}

/** @deprecated Prefer computeV2gGeneConnectionCanvasHeight */
export function computeV2gRibbonsCanvasHeight(renderData, genesArr = []) {
    return computeV2gGeneConnectionCanvasHeight(renderData, genesArr);
}
