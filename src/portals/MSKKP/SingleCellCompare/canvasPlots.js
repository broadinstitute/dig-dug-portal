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
    ctx.translate(x - 4, y);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(label, 0, 0);
    ctx.restore();
}

// Width (in px, along the horizontal axis) the rotated (-45deg) category
// label text occupies, used to size the bottom margin so full names never
// get clipped.
function measureRotatedLabelWidth(ctx, label) {
    ctx.save();
    ctx.font = "11px Inter, sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.restore();
    // At a 45deg rotation, the label's footprint along the vertical axis
    // equals its text width times sin(45deg); add the font height too.
    return textWidth * Math.SQRT1_2 + 11;
}

// Smallest plotting area (in px) the violin bodies are allowed to be drawn into.
// Template.vue's canvas has a fixed aspect ratio, which gives a fixed clientHeight
// regardless of how tall the rotated category labels end up being; when that
// bottom-margin reservation would otherwise eat into (or invert) the plot area,
// the canvas is grown past its CSS-driven height to preserve at least this much.
const MIN_VIOLIN_PLOT_HEIGHT = 120;

// Template.vue overlays the left/right dataset legend on top of this chart, top
// right (see .chart-legend-overlay). Reserving this much extra top margin keeps the
// violin bodies/axis from starting underneath that legend; growing the canvas by the
// same amount (via the height check below) means the plot area itself doesn't shrink
// to make room - the whole chart just gets a little taller and the plot shifts down.
const LEGEND_RESERVED_TOP = 34;

// categories: [{ label, leftValues: number[], rightValues: number[] }]
// returns a status string ("" on success, an explanatory message when there is
// nothing to plot)
export function renderViolinPlot(canvas, categories, yLabel) {
    const available = (categories || []).filter((row) => row.leftValues.length || row.rightValues.length);
    if (!available.length) {
        clearCanvas(canvas);
        return "No plot values available.";
    }
    let ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const labelOffset = 14;
    const maxLabelFootprint = Math.max(
        0,
        ...available.map((row) => measureRotatedLabelWidth(ctx, row.label))
    );
    const margins = { top: 20 + LEGEND_RESERVED_TOP, right: 18, bottom: Math.max(92, labelOffset + maxLabelFootprint + 10), left: 58 };

    // The CSS aspect ratio sizes the canvas assuming a modest bottom margin; long
    // rotated labels can blow past that, so grow the element's own height (not just
    // the backing buffer) whenever it would leave less than MIN_VIOLIN_PLOT_HEIGHT -
    // or a negative amount - for the actual plot, then re-run prepareCanvas so the
    // backing buffer/DPR transform match the new size.
    const requiredHeight = margins.top + MIN_VIOLIN_PLOT_HEIGHT + margins.bottom;
    let height = canvas.clientHeight;
    if (requiredHeight > height) {
        canvas.style.height = `${requiredHeight}px`;
        ctx = prepareCanvas(canvas);
        height = canvas.clientHeight;
    }

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
        drawCategoryLabel(ctx, row.label, center, margins.top + plotHeight + labelOffset);
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
    const xCenter = margins.left + plotWidth / 2;
    ctx.fillText(xLabel, xCenter, margins.top + plotHeight + 54);
    ctx.fillText("avg expression", xCenter, margins.top + plotHeight + 68);
    ctx.save();
    ctx.translate(18, margins.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, -7);
    ctx.fillText("avg expression", 0, 7);
    ctx.restore();
}

// points: [{ label, x, y }]; returns a status string as above
export function renderScatterPlot(canvas, points, xLabel, yLabel) {
    const available = (points || []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!available.length) {
        clearCanvas(canvas);
        return "No plot values available.";
    }
    const width = canvas.clientWidth;
    const margins = { top: 22 + LEGEND_RESERVED_TOP, right: 24, bottom: 84, left: 72 };

    // Same treatment as the violin plot: Template.vue overlays the left/right dataset
    // legend and the download button on top of this chart too, so the canvas is
    // grown by the same amount reserved for them above, keeping the plot area itself
    // the size it would have been without the overlay. redrawCellTypePlot (and hence
    // this function) reruns on every cell-type/dataset change and window resize, so
    // the inline height set here must never be read back as this call's own baseline
    // - clear it first to let the CSS aspect-ratio give back the natural height,
    // then grow from that stable number every time instead of compounding on top of
    // whatever a previous call already grew it to.
    canvas.style.height = "";
    const baseHeight = canvas.clientHeight;
    canvas.style.height = `${baseHeight + LEGEND_RESERVED_TOP}px`;
    let ctx = prepareCanvas(canvas);
    const height = canvas.clientHeight;

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

    // Color each gene by whichever dataset expresses it more strongly, using the
    // same left/right colors as the dataset-key chips above this chart (and the
    // violin plot's PAIR_COLORS) - a flat, unrelated color read as "black" at this
    // dot size/alpha and gave no visual tie to the left/right legend at all.
    ctx.globalAlpha = 0.5;
    available.forEach((point) => {
        const x = scale(point.x, 0, maxValue, margins.left, margins.left + plotWidth);
        const y = scale(point.y, 0, maxValue, margins.top + plotHeight, margins.top);
        ctx.fillStyle = point.x >= point.y ? PAIR_COLORS.left : PAIR_COLORS.right;
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    const labeled = [...available].sort((a, b) => Math.max(b.x, b.y) - Math.max(a.x, a.y)).slice(0, 12);
    ctx.font = "10.5px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    labeled.forEach((point) => {
        const x = scale(point.x, 0, maxValue, margins.left, margins.left + plotWidth);
        const y = scale(point.y, 0, maxValue, margins.top + plotHeight, margins.top);
        ctx.fillStyle = point.x >= point.y ? PAIR_COLORS.left : PAIR_COLORS.right;
        ctx.beginPath();
        ctx.arc(x, y, 3.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#33423d";
        ctx.fillText(truncate(point.label, 14), Math.min(x + 5, margins.left + plotWidth - 54), y);
    });
    return "";
}
