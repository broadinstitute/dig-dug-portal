import { lookupLdScore } from "./variantSifterLdServer.js";
import plotUtils from "@/utils/plotUtils.js";

/** Display height from render config; internal canvas height is 2× this value. */
export const VKS_PLOT_DISPLAY_HEIGHT = 120;

export const VKS_LD_DOT_COLORS = [
    "#2074B650",
    "#32AFD550",
    "#4DB05250",
    "#EE982D50",
    "#D0363350",
    "#824099cc",
];

export const VKS_LD_BG_COLORS = [
    "#2074B620",
    "#32AFD520",
    "#4DB05220",
    "#EE982D20",
    "#D0363320",
];

export const VKS_DEFAULT_DOT_RADIUS = 9;

export function normalizePlotMargin(plotMargin) {
    if (!plotMargin) {
        return { left: 150, right: 40, top: 20, bottom: 100, bump: 11 };
    }
    if (plotMargin.left != null) {
        return plotMargin;
    }
    return {
        left: plotMargin.leftMargin,
        right: plotMargin.rightMargin,
        top: plotMargin.topMargin,
        bottom: plotMargin.bottomMargin,
        bump: plotMargin.bump,
    };
}

export function resolveRowLdScore(row, scoreMap) {
    if (row?.LDS != null && !Number.isNaN(row.LDS)) {
        return row.LDS;
    }
    return lookupLdScore(scoreMap, row);
}

export function getInternalPlotHeight(displayHeight = VKS_PLOT_DISPLAY_HEIGHT) {
    return displayHeight * 2;
}

/**
 * Match ResearchRegionPlot retina canvas sizing (2× internal pixels, CSS fills container).
 */
export function setupPlotCanvas(canvas, internalWidth, internalHeight) {
    canvas.width = internalWidth;
    canvas.height = internalHeight;
    canvas.style.width = "100%";
    canvas.style.height = `${internalHeight / 2}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, internalWidth, internalHeight);
    return ctx;
}

/** Minimum container width before plotting (drawer may still be animating open). */
export const VKS_MIN_PLOT_CONTAINER_WIDTH = 100;

export function measurePlotCanvasWidth(containerEl) {
    const displayWidth = containerEl?.clientWidth || 0;
    if (displayWidth < VKS_MIN_PLOT_CONTAINER_WIDTH) {
        return null;
    }
    return displayWidth * 2 - 60;
}

export function measureAssociationCanvasWidth(containerEl) {
    return measurePlotCanvasWidth(containerEl);
}

export function measureLdCanvasWidth(containerEl) {
    return measurePlotCanvasWidth(containerEl);
}

/**
 * Re-render when the plot container resizes (e.g. drawer open animation).
 */
export function attachPlotResizeObserver(vm, containerRef, onResize) {
    if (typeof ResizeObserver === "undefined") {
        return null;
    }

    let frame = null;
    const observer = new ResizeObserver(() => {
        if (frame) {
            cancelAnimationFrame(frame);
        }
        frame = requestAnimationFrame(() => {
            onResize();
        });
    });

    vm.$nextTick(() => {
        const container = vm.$refs[containerRef];
        if (container) {
            observer.observe(container);
        }
    });

    return observer;
}

export function renderPlotDot(ctx, xPos, yPos, color, width = VKS_DEFAULT_DOT_RADIUS) {
    plotUtils.renderDot(ctx, xPos, yPos, color, width);
}

export function getLdDotColor(r2) {
    if (r2 == null || Number.isNaN(r2)) {
        return "#00000030";
    }
    const index = Math.floor(Number(r2) * 5);
    return VKS_LD_DOT_COLORS[index] ?? "#00000030";
}

export function computeNegLog10Extents(plotRows) {
    let yMin = null;
    let yMax = null;

    plotRows.forEach((row) => {
        const y = row["-log10(P-Value)"];
        if (typeof y !== "number" || Number.isNaN(y)) {
            return;
        }
        yMin = yMin == null ? y : Math.min(yMin, y);
        yMax = yMax == null ? y : Math.max(yMax, y);
    });

    if (yMin == null || yMax == null) {
        return { yMin: 0, yMax: 1 };
    }

    return {
        yMin: Math.floor(yMin),
        yMax: Math.ceil(yMax),
    };
}

export async function fetchRecombinationRate(region) {
    const signalURL =
        "https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/?filter=id in 15 and chromosome eq '" +
        region.chr +
        "' and position gt " +
        region.start +
        " and position lt " +
        region.end;

    const signalJson = await fetch(signalURL).then((response) => response.json());
    if (signalJson?.error != null || !signalJson?.data?.position) {
        return null;
    }

    return {
        position: signalJson.data.position,
        recomb_rate: signalJson.data.recomb_rate,
    };
}

export function renderDiamond(ctx, xPos, yPos, color) {
    const width = 18;
    const height = 24;
    ctx.save();
    ctx.fillStyle = color;
    ctx.lineWidth = 0;
    ctx.beginPath();
    ctx.moveTo(xPos, yPos - height / 2);
    ctx.lineTo(xPos - width / 2, yPos);
    ctx.lineTo(xPos, yPos + height / 2);
    ctx.lineTo(xPos + width / 2, yPos);
    ctx.closePath();
    ctx.strokeStyle = "#824099";
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}

export function renderRecombinationLine(ctx, margin, plotWidth, plotHeight, region, recombData) {
    if (!recombData?.position?.length) {
        return;
    }

    const xPixel = plotWidth / (region.end - region.start);
    const yPixel = plotHeight / 100;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#007BFF";

    recombData.position.forEach((xPos, index) => {
        if (index >= recombData.position.length - 1) {
            return;
        }
        const x1 = margin.left + (xPos - region.start) * xPixel;
        const y1 = margin.top + plotHeight - recombData.recomb_rate[index] * yPixel;
        const x2 =
            margin.left +
            (recombData.position[index + 1] - region.start) * xPixel;
        const y2 =
            margin.top +
            plotHeight -
            recombData.recomb_rate[index + 1] * yPixel;

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    });
}

function formatAxisTickValue(value, decimalPlaces, utils) {
    if (utils?.Formatters?.decimalFormatter) {
        return utils.Formatters.decimalFormatter(value, decimalPlaces);
    }
    return String(Math.round(value));
}

/**
 * Port of ResearchRegionPlot.renderAxis for VS association and LD plots.
 */
export function renderPlotAxis(ctx, options) {
    const {
        margin,
        plotWidth,
        plotHeight,
        yMin,
        yMax,
        xMin,
        xMax,
        type,
        utils,
        yAxisLabel = "-log10(p-value)",
        xAxisLabel = "Chromosome",
        ldBackground = false,
    } = options;

    const bump = margin.bump ?? 10;
    const yMaxMinGap = yMax - yMin;
    const yDecimal = yMaxMinGap <= 1 ? 2 : yMaxMinGap <= 50 ? 1 : 0;
    const xMaxMinGap = xMax - xMin;
    const xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;
    const recomXpos = Math.round(margin.left + plotWidth + bump);

    if (type === "ld" && ldBackground) {
        const xBGDistance = plotWidth / 5;
        for (let i = 0; i < 5; i += 1) {
            const bgXPos = Math.floor(margin.left + i * xBGDistance);
            ctx.fillStyle = VKS_LD_BG_COLORS[i];
            ctx.fillRect(bgXPos, margin.top, xBGDistance - 1, plotHeight);
        }
    }

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.font = "24px Arial";
    ctx.fillStyle = "#000000";
    ctx.setLineDash([]);

    ctx.moveTo(margin.left - bump, margin.top);
    ctx.lineTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.stroke();

    if (type === "asso") {
        ctx.moveTo(recomXpos, margin.top);
        ctx.lineTo(recomXpos, plotHeight + margin.top + bump);
        ctx.stroke();
    }

    ctx.moveTo(margin.left - bump, plotHeight + margin.top + bump);
    ctx.lineTo(
        type === "asso"
            ? plotWidth + margin.left + bump
            : plotWidth + margin.left,
        plotHeight + margin.top + bump
    );
    ctx.stroke();

    const yStep = (yMax - yMin) / 5;
    const yTickDistance = plotHeight / 5;
    for (let i = 0; i < 6; i += 1) {
        const tickYPos = margin.top + i * yTickDistance;
        const adjTickYPos = Math.floor(tickYPos);
        ctx.moveTo(margin.left - bump * 2, adjTickYPos);
        ctx.lineTo(margin.left - bump, adjTickYPos);
        ctx.stroke();

        ctx.textAlign = "right";
        let tickValue = formatAxisTickValue(yMin + i * yStep, yDecimal, utils);
        if (yMaxMinGap >= 100000) {
            tickValue += "k";
        }
        ctx.fillText(
            tickValue,
            margin.left - bump * 3,
            margin.top + plotHeight + bump - i * yTickDistance
        );
    }

    if (type === "asso") {
        const recombStep = 20;
        for (let i = 0; i < 6; i += 1) {
            const tickYPos = margin.top + i * yTickDistance;
            const adjTickYPos = Math.floor(tickYPos);
            ctx.moveTo(recomXpos, adjTickYPos);
            ctx.lineTo(recomXpos + bump, adjTickYPos);
            ctx.stroke();
            ctx.textAlign = "left";
            ctx.fillText(
                String(i * recombStep),
                margin.left + plotWidth + bump * 3,
                margin.top + plotHeight + 5 - i * yTickDistance
            );
        }
    }

    const xStep = type === "asso" ? Math.ceil((xMax - xMin) / 5) : 0.2;
    const xTickDistance = plotWidth / 5;
    for (let i = 0; i < 6; i += 1) {
        const tickXPos = margin.left + i * xTickDistance;
        const adjTickXPos = Math.floor(tickXPos);
        ctx.moveTo(adjTickXPos, margin.top + plotHeight + bump);
        ctx.lineTo(adjTickXPos, margin.top + plotHeight + bump * 2);
        ctx.stroke();

        ctx.textAlign = "center";
        let positionLabel = formatAxisTickValue(xMin + i * xStep, xDecimal, utils);
        if (type === "asso" && Number(positionLabel) >= 100000) {
            positionLabel = `${Math.round(Number(positionLabel) * 0.001)}k`;
        }
        ctx.fillText(
            positionLabel,
            adjTickXPos,
            margin.top + plotHeight + bump * 4
        );
    }

    ctx.textAlign = "center";
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(
        yAxisLabel,
        -(margin.top + plotHeight / 2),
        bump + 24
    );

    if (type === "asso") {
        ctx.fillText(
            "Recombination Rate (cM/Mb)",
            -(margin.top + plotHeight / 2),
            margin.left * 2 + plotWidth - (bump + 24)
        );
    }

    ctx.rotate((-Math.PI * 3) / 2);
    ctx.fillText(
        xAxisLabel,
        plotWidth / 2 + margin.left,
        margin.top + margin.bottom + plotHeight - 24
    );
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function canvasPointerPosition(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}
