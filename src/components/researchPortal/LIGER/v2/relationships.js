// Program <-> cell-state edges for the canvas, from gene-program-heatmap.
//
// What that index actually returns is eight fields: dataset, cell_type, model,
// program_id, program_label, state_name, gsea_p, gsea_q. **GSEA P and q are the only
// metrics.** There is no correlation, no NES, no combined match score, no
// cell/donor Spearman -- v1 once drew columns for every one of those and each read a
// field no row carries. Do not widen the metric choice past these two.
//
// Two properties of the data shape everything here:
//
// 1. `gsea_p` / `gsea_q` are null on a large fraction of rows (190 of 450 for islet
//    beta). A missing p-value cannot be drawn: a hairline would assert "no
//    association" when the fact is "not reported". Those rows are dropped and
//    counted, so the UI can say how many it is not showing.
// 2. `state_name` mixes curated states with QC signatures and nothing on the row
//    separates them -- 36 QC signatures against 6 real states for vat/adipocyte.
//    Filtering goes through isQcStateRow(), which prefers the QC signature
//    dictionary when the caller has loaded it and falls back to the name prefix
//    when it has not. See ../ligerApi.js.

import { programKey, stateKey, isQcStateRow, gseaPValue, gseaQValue, SIGNIFICANCE_P } from "../ligerApi";
import { clamp } from "../ligerHeat";

// Categorical colors for cell states, so an edge can be traced to the state it
// lands on. This is a real encoding, not decoration -- the state's row carries the
// same swatch, which makes the list its own legend.
//
// Okabe-Ito plus two dark Tol colors, chosen to stay separable under the common
// color-vision deficiencies. Okabe-Ito's yellow (#F0E442) is deliberately excluded:
// it is unreadable as a thin line on white.
export const STATE_COLORS = [
    "#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00",
    "#56B4E9", "#882255", "#44AA99", "#332288", "#661100"
];

export function stateColor(index) {
    return STATE_COLORS[index % STATE_COLORS.length];
}

// Edge widths in WORLD pixels. The SVG lives inside the canvas transform, so these
// scale with everything else -- at a fit zoom of ~0.4 a 10px world stroke is a 4px
// screen stroke, which is why the range is this generous.
const MIN_WIDTH = 2;
const MAX_WIDTH = 11;
// -log10(p) at the significance threshold, i.e. the thinnest line worth drawing.
// Exported because it is the BOTTOM of the width scale and the legend states it: the
// thinnest line on screen does not mean a score of zero.
export const EDGE_MIN_SCORE = -Math.log10(SIGNIFICANCE_P);
// Floor for the top of the width scale, so a cell type whose best association is
// weak does not get the same fat lines as one with a genuinely strong hit. Same
// reasoning as the axis floors in programAxis.js.
const SCORE_CEILING_FLOOR = 6;

export const METRICS = [
    { key: "gsea_p", label: "GSEA P", read: gseaPValue },
    { key: "gsea_q", label: "GSEA q", read: gseaQValue }
];

export function metricFor(key) {
    return METRICS.find((metric) => metric.key === key) || METRICS[0];
}

// Builds the drawable edge set.
//
// `programOrder` / `stateOrder` are key -> index maps of what is actually on the
// canvas. An edge is only kept when BOTH of its endpoints are present: the heatmap
// is scoped to the cell type, not to the gene, so it reports programs and states
// that this gene's expression rows do not include, and an edge to a row that is not
// drawn would point at empty space.
export function buildEdges(heatmapRows = [], {
    programOrder = {},
    stateOrder = {},
    metricKey = "gsea_p",
    significantOnly = true,
    // The authoritative QC test, from gene-program-qc-metadata-extended. Optional:
    // the heatmap can resolve before that dictionary does, and isQcStateRow() falls
    // back to the name prefix rather than stopping filtering.
    qcSignatureIndex = null
} = {}) {
    let metric = metricFor(metricKey);

    let qcDropped = 0;
    let unreportedDropped = 0;
    let offCanvasDropped = 0;
    let nonSignificantDropped = 0;

    let candidates = [];

    heatmapRows.forEach((row) => {
        if (isQcStateRow(row, qcSignatureIndex)) {
            qcDropped++;
            return;
        }

        let program = programKey(row);
        let state = stateKey(row);

        if (!program || !state || !(program in programOrder) || !(state in stateOrder)) {
            offCanvasDropped++;
            return;
        }

        let value = metric.read(row);

        if (value === null) {
            unreportedDropped++;
            return;
        }

        if (significantOnly && value >= SIGNIFICANCE_P) {
            nonSignificantDropped++;
            return;
        }

        candidates.push({
            key: `${program}::${state}`,
            programKey: program,
            stateKey: state,
            value,
            // Both metrics travel with the edge regardless of which one is driving
            // the width, because the detail tables show both -- and re-reading them
            // from the row later would mean carrying the row around.
            gseaP: gseaPValue(row),
            gseaQ: gseaQValue(row),
            // -log10(p) so a stronger association is a thicker line. The p-value
            // itself is not usable as a magnitude: it underflows to 5e-324 for the
            // strongest hits, which is why the score is clamped below.
            score: value > 0 ? -Math.log10(value) : 324
        });
    });

    // Scale to the strongest association on screen, floored -- the same relative
    // scaling the expression bars use, and safe for the same reason: the legend
    // states the top of the range.
    let observedMax = candidates.reduce((max, edge) => Math.max(max, edge.score), 0);
    let ceiling = Math.max(observedMax, SCORE_CEILING_FLOOR);

    let edges = candidates.map((edge) => {
        let normalized = ceiling > EDGE_MIN_SCORE
            ? clamp((edge.score - EDGE_MIN_SCORE) / (ceiling - EDGE_MIN_SCORE), 0, 1)
            : 0;

        return {
            ...edge,
            color: stateColor(stateOrder[edge.stateKey]),
            width: MIN_WIDTH + normalized * (MAX_WIDTH - MIN_WIDTH),
            // Above the ceiling the width is clamped, so mark it rather than letting
            // two very different associations look identical.
            clamped: edge.score > ceiling
        };
    });

    // Thin lines drawn last would be buried; strongest on top reads better and
    // matches what a reader is looking for.
    edges.sort((a, b) => a.score - b.score);

    return {
        edges,
        metric,
        ceiling,
        dropped: {
            qc: qcDropped,
            unreported: unreportedDropped,
            offCanvas: offCanvasDropped,
            nonSignificant: nonSignificantDropped
        },
        // Adjacency, for hover highlighting and for the per-row match counts. With
        // up to a few hundred edges on screen this is what keeps the picture
        // readable -- without it a bipartite fan is a hairball.
        byProgram: groupBy(edges, "programKey"),
        byState: groupBy(edges, "stateKey")
    };
}

function groupBy(edges, field) {
    return edges.reduce((map, edge) => {
        (map[edge[field]] = map[edge[field]] || []).push(edge);
        return map;
    }, {});
}

// --- gene -> program links ------------------------------------------------------
//
// Width from the searched gene's LOADING in each program, which is a different
// quantity from the GSEA p-values above: loadings run 0 to ~58 with most values
// near zero, so there is no -log10 here. Scaled to the strongest loading on screen
// with a floor, the same relative-scaling-with-a-stated-ceiling rule the expression
// bars follow.
const GENE_LINK_MIN_WIDTH = 2;
const GENE_LINK_MAX_WIDTH = 11;
// Keeps a program where the gene barely loads from getting the same line as one
// where it dominates, when every loading in the set happens to be small.
const GENE_LINK_CEILING_FLOOR = 5;

// `loadingByProgram` is programId -> loading. A program the gene has NO reported
// loading for is left out entirely rather than drawn hairline: a thin line would
// assert "barely loads here" where the fact is "not reported".
//
// A loading of exactly 0 IS drawn, at the minimum width -- that is a measurement,
// and it is the one case where the thinnest line is honest.
export function buildGeneLinks(programKeys = [], loadingByProgram = {}) {
    let present = programKeys
        .filter((key) => Number.isFinite(loadingByProgram[key]))
        .map((key) => ({ programKey: key, loading: loadingByProgram[key] }));

    let observedMax = present.reduce((max, link) => Math.max(max, link.loading), 0);
    let ceiling = Math.max(observedMax, GENE_LINK_CEILING_FLOOR);

    let links = present.map((link) => {
        let normalized = ceiling > 0 ? clamp(link.loading / ceiling, 0, 1) : 0;

        return {
            ...link,
            key: `gene::${link.programKey}`,
            width: GENE_LINK_MIN_WIDTH + normalized * (GENE_LINK_MAX_WIDTH - GENE_LINK_MIN_WIDTH)
        };
    });

    // Strongest on top, matching the program/state edges.
    links.sort((a, b) => a.loading - b.loading);

    return {
        links,
        ceiling,
        resolved: present.length,
        missing: programKeys.length - present.length
    };
}

// A cubic bezier from the right edge of the programs list to the left edge of the
// states list. Horizontal control points, so every edge leaves and arrives level
// and the bundle reads as a flow rather than as straight chords.
export function edgePath(x1, y1, x2, y2) {
    let controlOffset = Math.max(40, (x2 - x1) * 0.45);
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
}
