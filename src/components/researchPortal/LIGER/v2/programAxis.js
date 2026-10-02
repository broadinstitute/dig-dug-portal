// Axis and bar math for the canvas nodes.
//
// This is presentation, so it lives in v2 rather than at the root -- but the two
// rules it encodes are not negotiable, and undoing either brings back a real bug
// that shipped once already (see ../README.md, "Bars"):
//
// 1. The expression bar is drawn from `10^log10_cpk`, not from `log10_cpk`. A
//    filled bar asserts a meaningful zero, and `log10_cpk` has none -- it is 0 at
//    1 CPK and negative for ~90% of values, so a bar drawn from it starts at an
//    arbitrary point on a log axis and its length means nothing.
// 2. The axis top scales to the gene but stays anchored at zero and labeled. The
//    relative scaling is only safe because of those two properties. Remove either
//    and A1BG (max 0.029) renders as strongly expressed as INS.

import { formatPValue } from "../ligerFormat";
import { absoluteExpressionValue, specificityValue, numericField, SIGNIFICANCE_P } from "../ligerApi";

// Stops a barely-expressed gene from filling its own bar: a gene has to reach
// roughly the upper quartile of the measured distribution (p75 = 0.47) before the
// axis starts tracking it. A1BG tops out at 5% of the track at this floor.
export const EXPRESSION_AXIS_FLOOR = 0.5;

// Specificity values cluster hard at zero (p75 = +0.115), so without a floor a card
// whose values are all tiny would scale up and imply enrichment that is not there.
export const SPECIFICITY_AXIS_FLOOR = 1.5;

export function niceAxisMax(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }

    let magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    let normalized = value / magnitude;
    let step = [1, 1.2, 1.4, 1.5, 1.6, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10]
        .find((candidate) => normalized <= candidate + 1e-9);

    return Number((step * magnitude).toPrecision(2));
}

// Values outside the domain clamp and report an overflow direction, so a clamped
// bar can be marked rather than silently squashed.
export function axisFill(value, min, max) {
    if (!Number.isFinite(value) || max <= min) {
        return { percent: 0, overflow: null, present: false };
    }

    let raw = ((value - min) / (max - min)) * 100;
    let overflow = raw > 100 ? "high" : (raw < 0 ? "low" : null);

    return { percent: Math.max(0, Math.min(100, raw)), overflow, present: true };
}

export function expressionAxisMax(rows = [], configuredMax) {
    let configured = Number(configuredMax);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }

    let observed = rows
        .map((row) => absoluteExpressionValue(row))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, Math.pow(10, value)), 0);

    return niceAxisMax(Math.max(observed, EXPRESSION_AXIS_FLOOR));
}

// Per-card, deliberately. Cell-type specificity is measured against the other cell
// types in the tissue; state and program specificity against the parent cell type.
// Different denominators -- those numbers are not comparable and must not share a
// scale. (The expression axis *is* shared, because it is the same metric.)
export function specificityAxisFor(rows = [], configuredMax) {
    let configured = Number(configuredMax);
    if (Number.isFinite(configured) && configured > 0) {
        return configured;
    }

    let observed = rows
        .map((row) => specificityValue(row))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, Math.abs(value)), 0);

    return niceAxisMax(Math.max(observed, SPECIFICITY_AXIS_FLOOR));
}

// Missing and zero are different facts, so a missing value is never printed as a
// number. ADIPOQ in islet should read `<0.001`, not `—`; a genuinely absent field
// should read `—`, not `0.00`.
export function formatExpressionValue(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    if (value >= 0.1) {
        return value.toFixed(2);
    }

    if (value >= 0.001) {
        return value.toFixed(3);
    }

    return value > 0 ? "<0.001" : "0";
}

export function formatSignificance(value) {
    if (!Number.isFinite(value)) {
        return "—";
    }

    // p_value underflows to 5e-324 for the strongest hits, so anything at the floor
    // is shown as a bound rather than a falsely precise number.
    if (value < 1e-300) {
        return "<1e-300";
    }

    return formatPValue(value);
}

export function formatRawMetric(value) {
    return Number.isFinite(value) ? value.toFixed(2) : "—";
}

// Turns expression rows into what a list row needs to render. Used for both the
// program rows and the cell-state rows -- the two endpoints return the same
// expression / specificity / p_value shape, so the rows are built identically and
// only their labels are resolved differently.
//
// `labelFor` is injected so the caller can join in the labels from a second fetch
// (gene-program-factor for programs, cell-state-metadata for states) without this
// file knowing about either.
//
// NOTE the caller must pass a `specAxis` computed from the SAME row set. State and
// program specificity are both measured against the parent cell type, but a card
// whose values are all tiny would scale up and imply enrichment that is not there,
// which is what the floor in specificityAxisFor() prevents.
export function buildExpressionItems(rows = [], { axisMax, specAxis, labelFor }) {
    return rows
        .map((row) => {
            let absolute = absoluteExpressionValue(row);
            // Undo the pipeline's outer log so the bar has a true zero.
            let linear = Number.isFinite(absolute) ? Math.pow(10, absolute) : null;
            let specificity = specificityValue(row);
            let pValue = numericField(row, ["p_value"]);
            let fill = axisFill(linear, 0, axisMax);

            let identity = labelFor(row);

            return {
                key: identity.key,
                label: identity.label || identity.key,

                abs: linear,
                absText: formatExpressionValue(linear),
                absRaw: absolute,
                absRawText: formatRawMetric(absolute),
                expressionWidth: `${fill.percent}%`,
                expressionOverflow: fill.overflow,
                hasExpression: fill.present,

                spec: specificity,
                specText: formatRawMetric(specificity),
                // -1..1 of a half-track. The node scales a center-anchored fill by
                // this, so passing through zero crosses the axis cleanly.
                specScale: Number.isFinite(specificity)
                    ? Math.max(-1, Math.min(1, specificity / specAxis)).toFixed(3)
                    : "0",
                specDirection: Number.isFinite(specificity) ? (specificity >= 0 ? "up" : "down") : null,
                hasSpec: Number.isFinite(specificity),

                // Only dim a bar when there is a p-value saying it is not
                // significant. Some endpoints omit p_value entirely, and dimming on
                // missing data reads as "all low confidence" when it actually means
                // "not reported".
                muted: Number.isFinite(pValue) && pValue > SIGNIFICANCE_P,
                pValueText: formatSignificance(pValue),

                row
            };
        })
        .filter((item) => !!item.key)
        .sort((a, b) => {
            // Strongest expression first; unmeasured rows sink rather than sorting
            // as zero.
            let aHas = Number.isFinite(a.abs);
            let bHas = Number.isFinite(b.abs);

            if (aHas !== bHas) {
                return aHas ? -1 : 1;
            }

            if (aHas && a.abs !== b.abs) {
                return b.abs - a.abs;
            }

            return a.label.localeCompare(b.label);
        });
}
