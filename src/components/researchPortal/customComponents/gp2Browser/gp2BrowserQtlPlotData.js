/**
 * QTL plot-row mapping and effect-direction (beta sign) coloring for GP2 Browser.
 *
 * QTL evidences render like Associations (searching-region overview + 50 kb
 * viewing-region plot, same load-time downsampling) except: no LD scores and
 * no recombination signal are loaded for QTL, and dots are colored by the
 * direction of the effect (beta) instead of LD r2.
 */
import { qtlVariantLabel } from "./gp2BrowserQtlApi.js";

/**
 * Plot dot colors, matching the Beta/Var Beta "is-positive" / "is-negative"
 * hues in GP2BrowserQtlTable.vue, with the same ~31% alpha (`50` hex suffix)
 * used by the Associations plot's LD dot colors (`VKS_LD_DOT_COLORS`).
 */
export const GP2_QTL_POSITIVE_EFFECT_COLOR = "#04884550";
export const GP2_QTL_NEGATIVE_EFFECT_COLOR = "#ee312450";
export const GP2_QTL_NEUTRAL_EFFECT_COLOR = "#8a8a8a50";

/** Color a QTL dot by the sign of its beta (effect direction). */
export function qtlDotColorForBeta(beta) {
    const number = Number(beta);
    if (!Number.isFinite(number) || number === 0) {
        return GP2_QTL_NEUTRAL_EFFECT_COLOR;
    }
    return number < 0 ? GP2_QTL_NEGATIVE_EFFECT_COLOR : GP2_QTL_POSITIVE_EFFECT_COLOR;
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
