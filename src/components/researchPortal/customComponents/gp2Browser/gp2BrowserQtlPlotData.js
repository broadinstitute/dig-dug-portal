/**
 * QTL plot-row mapping for GP2 Browser.
 *
 * QTL evidences render like Associations (searching-region overview + 50 kb
 * viewing-region plot, same load-time downsampling) except: no LD scores and
 * no recombination signal are loaded for QTL. Dots are colored by gene
 * identity and shaped as an upward triangle (beta > 0) or downward triangle
 * (beta < 0) instead of using color for effect direction.
 */
import { qtlVariantLabel } from "./gp2BrowserQtlApi.js";
import GP2_CATEGORICAL_COLORS from "@/utils/colors.js";

/** Fallback fill for a gene not present in the color map (e.g. missing gene field). */
export const GP2_QTL_GENE_FALLBACK_COLOR = "#8a8a8a";

/** Same ~31% alpha (`50` hex suffix) as the Associations plot's LD dot colors. */
export const GP2_QTL_DOT_ALPHA_SUFFIX = "50";

/** Plain 6-digit hex (legend/checkbox swatches) -> same hex with plot-dot alpha. */
export function gp2QtlDotFillColor(hexColor) {
    return `${hexColor}${GP2_QTL_DOT_ALPHA_SUFFIX}`;
}

function hexToRgb(hex) {
    const value = String(hex).replace("#", "");
    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16),
    };
}

function rgbToHex({ r, g, b }) {
    const toHex = (x) =>
        Math.round(Math.max(0, Math.min(255, x)))
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 50/50 blend of two hex colors. */
function mixHexColors(hexA, hexB) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgbToHex({
        r: (a.r + b.r) / 2,
        g: (a.g + b.g) / 2,
        b: (a.b + b.b) / 2,
    });
}

/**
 * The 15 hand-picked palette colors first, then every distinct pair of them
 * blended 50/50, in order (1&2, 1&3, ..., 1&15, 2&3, 2&4, ..., 14&15) — 15 +
 * 105 = 120 colors total before any repeat, which comfortably covers any
 * locus's gene count while always starting from the same hand-picked base.
 */
function buildGp2QtlExtendedColorSequence(basePalette) {
    const sequence = [...basePalette];
    for (let i = 0; i < basePalette.length - 1; i += 1) {
        for (let j = i + 1; j < basePalette.length; j += 1) {
            sequence.push(mixHexColors(basePalette[i], basePalette[j]));
        }
    }
    return sequence;
}

const GP2_QTL_EXTENDED_COLOR_SEQUENCE = buildGp2QtlExtendedColorSequence(
    GP2_CATEGORICAL_COLORS
);

/**
 * Color for the Nth gene (0-indexed) in a locus — the hand-picked palette for
 * the first 15 genes, then 50/50 blends of palette pairs for the next 105,
 * only cycling back to the start beyond that (120 genes in one locus would
 * be an extraordinary edge case).
 */
export function gp2QtlColorForGeneIndex(index) {
    return GP2_QTL_EXTENDED_COLOR_SEQUENCE[index % GP2_QTL_EXTENDED_COLOR_SEQUENCE.length];
}

/**
 * Stable gene -> color assignment, independent of which other genes happen
 * to be in a given subset (sorted alphabetically first, so the same gene
 * always gets the same color whether the map is built from the whole locus
 * or a filtered subset of it) and reused by both the searching and viewing
 * plots so a gene's color matches across them.
 */
export function buildGp2QtlGeneColorMap(rows) {
    const geneNames = Array.from(
        new Set((rows || []).map((row) => row?.gene || row?.Gene).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const colorMap = {};
    geneNames.forEach((gene, index) => {
        colorMap[gene] = gp2QtlColorForGeneIndex(index);
    });
    return colorMap;
}

export function gp2QtlColorForGene(gene, colorMap) {
    if (gene && colorMap && colorMap[gene]) {
        return colorMap[gene];
    }
    return GP2_QTL_GENE_FALLBACK_COLOR;
}

/**
 * Convert raw `qtl-associations` rows (already type/tissue/p-value filtered)
 * into plot row objects for the QTL region plots.
 */
export function qtlRowsToPlotData(rows) {
    if (!Array.isArray(rows) || !rows.length) {
        return null;
    }

    const plotRows = rows
        .map((row) => {
            const pValue = Number(row?.pValue);
            const negLog10 =
                Number.isFinite(pValue) && pValue > 0 ? -Math.log10(pValue) : null;
            const position = Number(row?.position);

            return {
                "Variant ID": qtlVariantLabel(row),
                Position: Number.isFinite(position) ? position : null,
                "P-Value": pValue,
                "-log10(P-Value)": negLog10,
                Beta: row?.beta,
                Gene: row?.gene,
                Tissue: row?.region,
                Dataset: row?.dataset,
                row,
            };
        })
        .filter(
            (row) =>
                row["Variant ID"] &&
                row.Position != null &&
                row["-log10(P-Value)"] != null &&
                !Number.isNaN(row["-log10(P-Value)"])
        );

    return plotRows.length ? plotRows : null;
}
