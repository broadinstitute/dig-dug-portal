/*
    Canvas drawing helpers ported from mskkp_mockup/public/app.js (renderUmap,
    renderViolinPlot, renderScatterPlot and their supporting math), adapted into
    reusable pure functions that take their inputs as arguments instead of reading a
    module-level `state`/`els` object. The visual design (colors, layout, densities)
    is intentionally unchanged - only the data now comes from the live single-cell
    BioIndex instead of mskkp_mockup's static JSON.
*/

export const PAIR_COLORS = { left: "#2f6f73", right: "#c06938" };

export function prepareCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}

export function clearCanvas(canvas) {
    const ctx = prepareCanvas(canvas);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function scale(value, d0, d1, r0, r1) {
    return d1 === d0 ? (r0 + r1) / 2 : r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}
function yScale(value, yMax, r0, r1) {
    return scale(Math.max(0, Math.min(yMax, value || 0)), 0, yMax, r0, r1);
}
function quantile(values, q) {
    const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}
function niceCeil(value) {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / 10 ** exponent;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * 10 ** exponent;
}
function hexToRgba(hex, alpha) {
    const clean = String(hex || "#9aa5a0").replace("#", "");
    return `rgba(${parseInt(clean.slice(0, 2), 16)}, ${parseInt(clean.slice(2, 4), 16)}, ${parseInt(clean.slice(4, 6), 16)}, ${alpha})`;
}
function formatAxisNumber(value) {
    return value >= 10 ? String(Math.round(value)) : value >= 1 ? value.toFixed(1) : value.toFixed(2);
}
function truncate(value, max) {
    return String(value || "").length > max ? `${String(value).slice(0, max - 1)}...` : String(value || "");
}

export function renderUmap(canvas, cells, cellTypeColors) {
    const ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fbfcfc";
    ctx.fillRect(0, 0, width, height);
    if (!cells || !cells.length) return;
    const xs = cells.map((cell) => cell.x);
    const ys = cells.map((cell) => cell.y);
    const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    const pad = 28;
    cells.forEach((cell) => {
        const x = scale(cell.x, bounds.minX, bounds.maxX, pad, width - pad);
        const y = scale(cell.y, bounds.minY, bounds.maxY, height - pad, pad);
        ctx.globalAlpha = 0.86;
        ctx.fillStyle = (cellTypeColors && cellTypeColors[cell.cell_type]) || "#9aa5a0";
        ctx.beginPath();
        ctx.arc(x, y, 2.45, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawAxes(ctx, margins, plotWidth, plotHeight, yMax, yLabel) {
    ctx.strokeStyle = "#c4d0ca";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margins.left, margins.top);
    ctx.lineTo(margins.left, margins.top + plotHeight);
    ctx.lineTo(margins.left + plotWidth, margins.top + plotHeight);
    ctx.stroke();
    ctx.fillStyle = "#63706b";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i += 1) {
        const value = (yMax * i) / 4;
        const y = yScale(value, yMax, margins.top + plotHeight, margins.top);
        ctx.strokeStyle = i === 0 ? "#c4d0ca" : "#e5ece8";
        ctx.beginPath();
        ctx.moveTo(margins.left, y);
        ctx.lineTo(margins.left + plotWidth, y);
        ctx.stroke();
        ctx.fillText(formatAxisNumber(value), margins.left - 8, y);
    }
    ctx.save();
    ctx.translate(16, margins.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

function drawMedian(ctx, values, x, yMax, margins, plotHeight, color) {
    const y = yScale(quantile(values, 0.5), yMax, margins.top + plotHeight, margins.top);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawJitter(ctx, values, x, maxHalfWidth, yMax, margins, plotHeight, color) {
    ctx.fillStyle = hexToRgba(color, 0.62);
    values.slice(0, 80).forEach((value, index) => {
        const jitter = ((Math.sin((index + 1) * 12.9898) * 43758.5453) % 1) * maxHalfWidth * 1.5;
        const y = yScale(value, yMax, margins.top + plotHeight, margins.top);
        ctx.beginPath();
        ctx.arc(x + jitter, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawDistribution(ctx, rawValues, x, maxHalfWidth, yMax, margins, plotHeight, color) {
    const values = rawValues.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!values.length) return;
    if (values.length < 8 || new Set(values.map((v) => v.toFixed(4))).size < 3) {
        drawJitter(ctx, values, x, maxHalfWidth, yMax, margins, plotHeight, color);
        drawMedian(ctx, values, x, yMax, margins, plotHeight, color);
        return;
    }
    const bins = 34;
    const bandwidth = Math.max(yMax / 18, 0.04);
    const points = [];
    let maxDensity = 0;
    for (let i = 0; i < bins; i += 1) {
        const value = (yMax * i) / (bins - 1);
        const density = values.reduce((sum, sample) => {
            const z = (value - sample) / bandwidth;
            return sum + Math.exp(-0.5 * z * z);
        }, 0) / values.length;
        maxDensity = Math.max(maxDensity, density);
        points.push({ value, density });
    }
    ctx.beginPath();
    points.forEach((point, index) => {
        const w = (point.density / maxDensity) * maxHalfWidth;
        const y = yScale(point.value, yMax, margins.top + plotHeight, margins.top);
        if (index === 0) ctx.moveTo(x - w, y);
        else ctx.lineTo(x - w, y);
    });
    [...points].reverse().forEach((point) => {
        const w = (point.density / maxDensity) * maxHalfWidth;
        const y = yScale(point.value, yMax, margins.top + plotHeight, margins.top);
        ctx.lineTo(x + w, y);
    });
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, 0.32);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
    drawMedian(ctx, values, x, yMax, margins, plotHeight, color);
}

function drawCategoryLabel(ctx, label, x, y) {
    ctx.save();
    ctx.fillStyle = "#43504b";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.translate(x - 4, y + 50);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(truncate(label, 24), 0, 0);
    ctx.restore();
}

// categories: [{ label, leftValues: number[], rightValues: number[] }]
// returns a status string ("" on success, an explanatory message when there is
// nothing to plot)
export function renderViolinPlot(canvas, categories, yLabel) {
    const available = (categories || []).filter((row) => row.leftValues.length || row.rightValues.length);
    if (!available.length) {
        clearCanvas(canvas);
        return "No plot values available.";
    }
    const ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const margins = { top: 20, right: 18, bottom: 92, left: 58 };
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    const allValues = available.flatMap((row) => [...row.leftValues, ...row.rightValues]).map(Number).filter(Number.isFinite);
    const yMax = niceCeil(Math.max(0.05, quantile(allValues, 0.995)));
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fbfcfc";
    ctx.fillRect(0, 0, width, height);
    drawAxes(ctx, margins, plotWidth, plotHeight, yMax, yLabel);
    const band = plotWidth / available.length;
    const groupWidth = Math.min(58, band * 0.68);
    const offset = Math.min(20, groupWidth * 0.28);
    available.forEach((row, index) => {
        const center = margins.left + band * (index + 0.5);
        drawDistribution(ctx, row.leftValues, center - offset, groupWidth * 0.38, yMax, margins, plotHeight, PAIR_COLORS.left);
        drawDistribution(ctx, row.rightValues, center + offset, groupWidth * 0.38, yMax, margins, plotHeight, PAIR_COLORS.right);
        drawCategoryLabel(ctx, row.label, center, margins.top + plotHeight + 14);
    });
    return "";
}

function drawScatterAxes(ctx, margins, plotWidth, plotHeight, maxValue, xLabel, yLabel) {
    ctx.strokeStyle = "#c4d0ca";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margins.left, margins.top);
    ctx.lineTo(margins.left, margins.top + plotHeight);
    ctx.lineTo(margins.left + plotWidth, margins.top + plotHeight);
    ctx.stroke();
    ctx.fillStyle = "#63706b";
    ctx.font = "12px Inter, sans-serif";
    for (let i = 0; i <= 4; i += 1) {
        const value = (maxValue * i) / 4;
        const x = scale(value, 0, maxValue, margins.left, margins.left + plotWidth);
        const y = scale(value, 0, maxValue, margins.top + plotHeight, margins.top);
        ctx.strokeStyle = i === 0 ? "#c4d0ca" : "#e5ece8";
        ctx.beginPath();
        ctx.moveTo(margins.left, y);
        ctx.lineTo(margins.left + plotWidth, y);
        ctx.moveTo(x, margins.top);
        ctx.lineTo(x, margins.top + plotHeight);
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(formatAxisNumber(value), margins.left - 8, y);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(formatAxisNumber(value), x, margins.top + plotHeight + 8);
    }
    ctx.fillStyle = "#43504b";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${truncate(xLabel, 48)} avg expression`, margins.left + plotWidth / 2, margins.top + plotHeight + 54);
    ctx.save();
    ctx.translate(18, margins.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${truncate(yLabel, 48)} avg expression`, 0, 0);
    ctx.restore();
}

// points: [{ label, x, y }]; returns a status string as above
export function renderScatterPlot(canvas, points, xLabel, yLabel) {
    const available = (points || []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!available.length) {
        clearCanvas(canvas);
        return "No plot values available.";
    }
    const ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const margins = { top: 22, right: 24, bottom: 70, left: 72 };
    const plotWidth = width - margins.left - margins.right;
    const plotHeight = height - margins.top - margins.bottom;
    const maxValue = niceCeil(Math.max(0.05, ...available.map((point) => Math.max(point.x, point.y))));

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fbfcfc";
    ctx.fillRect(0, 0, width, height);
    drawScatterAxes(ctx, margins, plotWidth, plotHeight, maxValue, xLabel, yLabel);

    ctx.strokeStyle = "#b8c6c0";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margins.left, margins.top + plotHeight);
    ctx.lineTo(margins.left + plotWidth, margins.top);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#345c5f";
    ctx.globalAlpha = 0.34;
    available.forEach((point) => {
        const x = scale(point.x, 0, maxValue, margins.left, margins.left + plotWidth);
        const y = scale(point.y, 0, maxValue, margins.top + plotHeight, margins.top);
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    const labeled = [...available].sort((a, b) => Math.max(b.x, b.y) - Math.max(a.x, a.y)).slice(0, 12);
    ctx.font = "10.5px Inter, sans-serif";
    ctx.fillStyle = "#33423d";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    labeled.forEach((point) => {
        const x = scale(point.x, 0, maxValue, margins.left, margins.left + plotWidth);
        const y = scale(point.y, 0, maxValue, margins.top + plotHeight, margins.top);
        ctx.beginPath();
        ctx.arc(x, y, 3.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(truncate(point.label, 14), Math.min(x + 5, margins.left + plotWidth - 54), y);
    });
    return "";
}
