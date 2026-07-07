import {
    annotationColorForKey,
    isGeAnnotationEmphasized,
    isGePointEmphasized,
    isGeTissueEmphasized,
    mutedAnnotationColor,
    topGeLabelThresholds,
} from "./variantSifterGlobalEnrichmentData.js";

const GE_PLOT_MARGIN = {
    left: 150,
    right: 40,
    top: 48,
    bottom: 120,
    bump: 11,
};

const ANNO_PLOT_MARGIN = {
    left: 150,
    right: 40,
    top: 24,
    bottom: 24,
    bump: 11,
};

function formatAxisTick(value, decimalPlaces, utils) {
    if (utils?.Formatters?.decimalFormatter) {
        return utils.Formatters.decimalFormatter(value, decimalPlaces);
    }
    return String(Math.round(value * 100) / 100);
}

function renderGeAxis(ctx, options) {
    const {
        plotLeft,
        plotTop,
        plotWidth,
        plotHeight,
        xMin,
        xMax,
        yMin,
        yMax,
        utils,
    } = options;
    const bump = GE_PLOT_MARGIN.bump;

    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.setLineDash([]);
    ctx.fillStyle = "#000000";
    ctx.font = "24px Arial";

    const yAxisX = Math.round(plotLeft - bump);
    ctx.moveTo(yAxisX, plotTop);
    ctx.lineTo(yAxisX, plotTop + plotHeight + bump);

    const yStep = (yMax - yMin) / 5;
    const yTickDistance = plotHeight / 5;
    const yGap = yMax - yMin;
    const yDecimal = yGap <= 1 ? 2 : yGap <= 50 ? 1 : 0;

    for (let i = 0; i < 6; i += 1) {
        const tickY = plotTop + i * yTickDistance;
        ctx.moveTo(plotLeft - bump * 2, tickY);
        ctx.lineTo(plotLeft - bump, tickY);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(
            formatAxisTick(yMin + i * yStep, yDecimal, utils),
            plotLeft - bump * 3,
            plotTop + plotHeight + bump - i * yTickDistance
        );
    }

    ctx.textAlign = "center";
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
        "Fold(SNPs/expectedSNPs)",
        -(plotTop + plotHeight / 2),
        plotLeft - bump * 8
    );
    ctx.rotate(Math.PI / 2);

    ctx.moveTo(plotLeft - bump, plotTop + plotHeight + bump);
    ctx.lineTo(plotLeft + plotWidth, plotTop + plotHeight + bump);
    ctx.stroke();

    const xStep = (xMax - xMin) / 5;
    const xTickDistance = plotWidth / 5;
    const xGap = xMax - xMin;
    const xDecimal = xGap <= 1 ? 2 : xGap <= 50 ? 1 : 0;

    for (let i = 0; i < 6; i += 1) {
        const tickX = plotLeft + i * xTickDistance;
        ctx.moveTo(tickX, plotTop + plotHeight + bump);
        ctx.lineTo(tickX, plotTop + plotHeight + bump * 2);
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillText(
            formatAxisTick(xMin + i * xStep, xDecimal, utils),
            tickX,
            plotTop + plotHeight + bump * 4
        );
    }

    ctx.fillText(
        "-Log10(p-value)",
        plotLeft + plotWidth / 2,
        plotTop + plotHeight + bump * 6 + 24
    );
    ctx.restore();
}

export function renderGlobalEnrichmentPlot(ctx, options) {
    const {
        plotModel,
        canvasWidth,
        canvasHeight,
        title,
        selectedAnnotations = null,
        colors,
        utils,
        llmRelevance = null,
        enabledMutedAnnotations = [],
        enabledMutedTissues = [],
    } = options;

    const dotPositions = [];

    if (!ctx || !canvasWidth || !canvasHeight) {
        return dotPositions;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!plotModel?.points?.length) {
        ctx.fillStyle = "#666666";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            "No enrichment points for this locus.",
            canvasWidth / 2,
            canvasHeight / 2
        );
        return dotPositions;
    }

    const selectedSet =
        Array.isArray(selectedAnnotations) && selectedAnnotations.length
            ? new Set(selectedAnnotations)
            : null;

    const plotLeft = GE_PLOT_MARGIN.left;
    const plotTop = GE_PLOT_MARGIN.top + 28;
    const plotWidth = canvasWidth - GE_PLOT_MARGIN.left - GE_PLOT_MARGIN.right;
    const plotHeight =
        canvasHeight - plotTop - GE_PLOT_MARGIN.bottom;
    const { xMin, xMax, yMin, yMax, points, annotations } = plotModel;
    const xPosByPixel = plotWidth / (xMax - xMin || 1);
    const yPosByPixel = plotHeight / (yMax - yMin || 1);
    const { foldThreshold, pValueThreshold } = topGeLabelThresholds(points);

    if (title) {
        ctx.fillStyle = "#000000";
        ctx.font = "28px Arial";
        ctx.textAlign = "left";
        ctx.fillText(title, 12, 32);
    }

    renderGeAxis(ctx, {
        plotLeft,
        plotTop,
        plotWidth,
        plotHeight,
        xMin,
        xMax,
        yMin,
        yMax,
        utils,
    });

    points.forEach((point) => {
        if (selectedSet && !selectedSet.has(point.annotation)) {
            return;
        }

        const emphasized = isGePointEmphasized(point, {
            llmRelevance,
            enabledMutedAnnotations,
            enabledMutedTissues,
        });
        const baseColor = annotationColorForKey(point.annotation, annotations, colors);
        const color = emphasized ? baseColor : mutedAnnotationColor(baseColor);

        const xPos = plotLeft + (point.pValue - xMin) * xPosByPixel;
        const yPos = plotTop + plotHeight - (point.fold - yMin) * yPosByPixel;
        const radius = emphasized ? 8 : 6;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(xPos, yPos, radius, 0, Math.PI * 2);
        ctx.fill();

        dotPositions.push({
            x: xPos,
            y: yPos,
            radius,
            point,
        });

        const shouldLabel =
            emphasized &&
            ((foldThreshold != null && point.fold >= foldThreshold) ||
                (pValueThreshold != null && point.pValue >= pValueThreshold));

        if (!shouldLabel) {
            return;
        }

        ctx.fillStyle = "#000000";
        ctx.font = "24px Arial";
        if (xPos > plotLeft + plotWidth * 0.75) {
            ctx.textAlign = "right";
            ctx.fillText(point.tissue, xPos - 14, yPos + 6);
        } else {
            ctx.textAlign = "left";
            ctx.fillText(point.tissue, xPos + 14, yPos + 6);
        }
    });

    return dotPositions;
}

function renderAnnotationAxis(ctx, plotLeft, plotTop, plotWidth, plotHeight, xMin, xMax, utils) {
    const bump = ANNO_PLOT_MARGIN.bump;
    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.font = "24px Arial";

    ctx.moveTo(plotLeft - bump, plotTop);
    ctx.lineTo(plotLeft - bump, plotTop + plotHeight);
    ctx.stroke();

    const xStep = Math.ceil((xMax - xMin) / 5);
    const xTickDistance = plotWidth / 5;
    const xGap = xMax - xMin;
    const xDecimal = xGap <= 1 ? 2 : xGap <= 50 ? 1 : 0;

    for (let i = 0; i < 6; i += 1) {
        const tickX = plotLeft + i * xTickDistance;
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

export function renderAnnotationsPlot(ctx, options) {
    const {
        annoData,
        visibleRegion,
        canvasWidth,
        canvasHeight,
        annotations = [],
        colors,
        utils,
        llmRelevance = null,
        enabledMutedAnnotations = [],
        enabledMutedTissues = [],
    } = options;

    if (!ctx || !canvasWidth || !canvasHeight || !visibleRegion || !annotations.length) {
        return;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const regionStart = Number(visibleRegion.start);
    const regionEnd = Number(visibleRegion.end);
    const plotLeft = ANNO_PLOT_MARGIN.left;
    const plotTop = ANNO_PLOT_MARGIN.top;
    const plotWidth = canvasWidth - ANNO_PLOT_MARGIN.left - ANNO_PLOT_MARGIN.right;
    const spaceBy = 24;
    const annotationTitleH = spaceBy * 2;
    const betweenAnnotations = spaceBy * 7;
    const perTissue = spaceBy;

    let renderHeight = plotTop + annotationTitleH;

    annotations.forEach((annotation, annotationIndex) => {
        const tissues = annoData[annotation] || {};
        const tissueKeys = Object.keys(tissues).sort();
        const annotationEmphasized = isGeAnnotationEmphasized(annotation, {
            llmRelevance,
            enabledMutedAnnotations,
        });
        const blockHeight = tissueKeys.length * perTissue;

        ctx.fillStyle = annotationEmphasized ? "#000000" : "#8a8a8a";
        ctx.font = "28px Arial";
        ctx.textAlign = "left";
        ctx.fillText(annotation, 12, renderHeight);

        renderAnnotationAxis(
            ctx,
            plotLeft,
            renderHeight,
            plotWidth,
            blockHeight,
            regionStart,
            regionEnd,
            utils
        );

        renderHeight += annotationTitleH;

        tissueKeys.forEach((tissue, tissueIndex) => {
            const regions = tissues[tissue]?.region || [];
            const tissueEmphasized = isGeTissueEmphasized(tissue, {
                llmRelevance,
                enabledMutedTissues,
            });
            const emphasized = annotationEmphasized && tissueEmphasized;
            const barColor = emphasized
                ? annotationColorForKey(annotation, annotations, colors)
                : mutedAnnotationColor(annotationColorForKey(annotation, annotations, colors));

            if (tissueIndex % 2 === 0) {
                ctx.fillStyle = emphasized ? "#00000010" : "#00000006";
                ctx.fillRect(plotLeft, renderHeight, plotWidth, perTissue);
            }

            regions.forEach((region) => {
                if (region.end < regionStart || region.start > regionEnd) {
                    return;
                }

                const xPosStart = Math.max(
                    plotLeft,
                    plotLeft + ((region.start - regionStart) / (regionEnd - regionStart)) * plotWidth
                );
                const xPosEnd = Math.min(
                    plotLeft + plotWidth,
                    plotLeft + ((region.end - regionStart) / (regionEnd - regionStart)) * plotWidth
                );
                const width = Math.max(2, xPosEnd - xPosStart);

                ctx.fillStyle = barColor;
                ctx.fillRect(xPosStart, renderHeight, width, perTissue - 1);
            });

            ctx.fillStyle = emphasized ? "#000000" : "#8a8a8a";
            ctx.font = "24px Arial";
            ctx.textAlign = "start";
            ctx.textBaseline = "middle";
            ctx.fillText(tissue, 10, renderHeight + perTissue / 2);

            renderHeight += perTissue;
        });

        if (annotationIndex < annotations.length - 1) {
            renderHeight += betweenAnnotations;
        }
    });
}

export function globalEnrichmentPlotCanvasHeight() {
    return GE_PLOT_MARGIN.top + 28 + 280 + GE_PLOT_MARGIN.bottom;
}

export {
    GE_PLOT_MARGIN,
    ANNO_PLOT_MARGIN,
};
