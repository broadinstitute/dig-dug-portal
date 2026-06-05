/** Canvas drawing helpers for gene–trait locus plot (Playground parity). */

const PLOT_MARGIN = { top: 22, right: 18, bottom: 40, left: 52 };
const GENE_TRACK_MARGIN = { top: 16, right: 18, bottom: 22, left: 52 };

export function formatLocusCoordinate(value) {
    return Number(value).toLocaleString();
}

export function formatLocusPValue(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return "NA";
    }
    if (numeric === 0) {
        return "0";
    }
    return numeric < 0.001 ? numeric.toExponential(2) : numeric.toPrecision(3);
}

export function nearestLocusLabel(value) {
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    return value || "NA";
}

function packGeneRows(genes) {
    const tracks = [];
    return (genes || []).flatMap((gene) => {
        const start = Number(gene.start);
        const end = Number(gene.end);
        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return [];
        }
        let track = tracks.findIndex((lastEnd) => start > lastEnd);
        if (track < 0) {
            track = tracks.length;
            tracks.push(end);
        } else {
            tracks[track] = end;
        }
        return [{ ...gene, start, end, track }];
    });
}

export function genesForRegion(region) {
    const genes = Array.isArray(region?.genes) ? region.genes : [];
    if (genes.length > 0) {
        return genes;
    }
    if (
        region?.gene &&
        Number.isFinite(Number(region.gene_start)) &&
        Number.isFinite(Number(region.gene_end))
    ) {
        return [
            {
                symbol: region.gene,
                name: region.gene,
                source: "focus_gene",
                chromosome: region.chromosome,
                start: region.gene_start,
                end: region.gene_end,
                type: "focus gene",
                build: region.build || "",
            },
        ];
    }
    return [];
}

function isProteinCodingGene(gene) {
    return String(gene?.type || "").toLowerCase() === "protein_coding";
}

export function visibleGenesForRegion(region, includeNonProteinCoding) {
    const genes = genesForRegion(region);
    if (includeNonProteinCoding) {
        return genes;
    }
    const proteinCodingGenes = genes.filter((gene) => isProteinCodingGene(gene));
    if (proteinCodingGenes.length > 0) {
        return proteinCodingGenes;
    }
    return genes;
}

export function drawLocusPlot(canvas, region, associations) {
    if (!canvas || !region) {
        return [];
    }
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(640, Math.floor(rect.width || 900));
    const height = 330;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const plotWidth = width - PLOT_MARGIN.left - PLOT_MARGIN.right;
    const plotHeight = height - PLOT_MARGIN.top - PLOT_MARGIN.bottom;
    const rows = (associations || [])
        .filter(
            (row) =>
                Number.isFinite(Number(row.position)) &&
                Number.isFinite(Number(row.log_pvalue))
        )
        .map((row) => ({
            ...row,
            position: Number(row.position),
            log_pvalue: Number(row.log_pvalue),
        }));
    const maxLog = Math.max(10, ...rows.map((row) => row.log_pvalue)) * 1.08;
    const xFor = (position) =>
        PLOT_MARGIN.left +
        ((position - region.start) / (region.end - region.start)) * plotWidth;
    const yFor = (logp) =>
        PLOT_MARGIN.top + plotHeight - (logp / maxLog) * plotHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#e5ded6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i += 1) {
        const y = PLOT_MARGIN.top + (plotHeight * i) / 4;
        ctx.moveTo(PLOT_MARGIN.left, y);
        ctx.lineTo(width - PLOT_MARGIN.right, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#4b5563";
    ctx.beginPath();
    ctx.moveTo(PLOT_MARGIN.left, PLOT_MARGIN.top);
    ctx.lineTo(PLOT_MARGIN.left, PLOT_MARGIN.top + plotHeight);
    ctx.lineTo(width - PLOT_MARGIN.right, PLOT_MARGIN.top + plotHeight);
    ctx.stroke();

    ctx.fillStyle = "#4b5563";
    ctx.font = "11px Menlo, Monaco, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i += 1) {
        const value = (maxLog * (4 - i)) / 4;
        const y = PLOT_MARGIN.top + (plotHeight * i) / 4;
        ctx.fillText(value.toFixed(value >= 10 ? 0 : 1), PLOT_MARGIN.left - 8, y);
    }

    ctx.save();
    ctx.translate(14, PLOT_MARGIN.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("-log10 p-value", 0, 0);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
        `chr${region.chromosome}:${formatLocusCoordinate(region.start)}-${formatLocusCoordinate(region.end)}`,
        PLOT_MARGIN.left + plotWidth / 2,
        PLOT_MARGIN.top + plotHeight + 18
    );

    ctx.strokeStyle = "#efc39c";
    ctx.beginPath();
    const thresholdY = yFor(7.301);
    if (thresholdY >= PLOT_MARGIN.top && thresholdY <= PLOT_MARGIN.top + plotHeight) {
        ctx.setLineDash([5, 4]);
        ctx.moveTo(PLOT_MARGIN.left, thresholdY);
        ctx.lineTo(width - PLOT_MARGIN.right, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const pointRows =
        rows.length > 12000
            ? rows
                  .slice()
                  .sort((a, b) => b.log_pvalue - a.log_pvalue)
                  .slice(0, 12000)
            : rows;
    const hitPoints = [];
    for (const row of pointRows) {
        const x = xFor(row.position);
        const y = yFor(row.log_pvalue);
        const beta = Number(row.beta);
        ctx.fillStyle = Number.isFinite(beta) && beta < 0 ? "#4f78c4" : "#c18f2c";
        ctx.globalAlpha = row.log_pvalue >= 7.301 ? 0.95 : 0.58;
        ctx.beginPath();
        ctx.arc(x, y, row.log_pvalue >= 7.301 ? 2.7 : 1.8, 0, Math.PI * 2);
        ctx.fill();
        hitPoints.push({ x, y, row });
    }
    ctx.globalAlpha = 1;
    return hitPoints;
}

export function drawGeneTrack(canvas, region, includeNonProteinCoding) {
    if (!canvas || !region) {
        return [];
    }
    const genes = packGeneRows(visibleGenesForRegion(region, includeNonProteinCoding));
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(640, Math.floor(rect.width || 900));
    const rowHeight = 20;
    const trackCount = Math.max(1, ...genes.map((gene) => gene.track + 1), 1);
    const height =
        GENE_TRACK_MARGIN.top + GENE_TRACK_MARGIN.bottom + trackCount * rowHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const plotWidth = width - GENE_TRACK_MARGIN.left - GENE_TRACK_MARGIN.right;
    const xFor = (position) =>
        GENE_TRACK_MARGIN.left +
        ((position - region.start) / (region.end - region.start)) * plotWidth;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e5ded6";
    ctx.beginPath();
    ctx.moveTo(GENE_TRACK_MARGIN.left, GENE_TRACK_MARGIN.top - 4);
    ctx.lineTo(width - GENE_TRACK_MARGIN.right, GENE_TRACK_MARGIN.top - 4);
    ctx.stroke();

    const hitGenes = [];
    genes.forEach((gene) => {
        const clippedStart = Math.max(region.start, gene.start);
        const clippedEnd = Math.min(region.end, gene.end);
        const x1 = xFor(clippedStart);
        const x2 = xFor(clippedEnd);
        const y = GENE_TRACK_MARGIN.top + gene.track * rowHeight + 7;
        const isFocusGene =
            String(gene.symbol).toUpperCase() === String(region.gene).toUpperCase();
        ctx.strokeStyle = isFocusGene ? "#8f6718" : "#4b5563";
        ctx.lineWidth = isFocusGene ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.fillStyle = isFocusGene ? "#8f6718" : "#4b5563";
        ctx.beginPath();
        ctx.moveTo(x2, y);
        ctx.lineTo(x2 - 6, y - 4);
        ctx.lineTo(x2 - 6, y + 4);
        ctx.closePath();
        ctx.fill();
        const labelX = Math.min(
            Math.max((x1 + x2) / 2, GENE_TRACK_MARGIN.left + 20),
            width - GENE_TRACK_MARGIN.right - 20
        );
        ctx.font = `${isFocusGene ? "700 " : ""}11px Menlo, Monaco, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(gene.symbol, labelX, y - 5);
        hitGenes.push({ x1, x2, y: y - 12, height: 20, gene });
    });

    ctx.fillStyle = "#4b5563";
    ctx.font = "11px Menlo, Monaco, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Genes", GENE_TRACK_MARGIN.left + plotWidth / 2, height - 16);
    return hitGenes;
}
