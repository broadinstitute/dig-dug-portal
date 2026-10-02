// Heat colors for the LIGER matrices.
//
// Shared across versions. `clamp` and `mixColor` are generic color math and should
// stay version-agnostic; `heatColor` is v1's palette. A new version that wants a
// different scale should define its own `heatColor` in its own folder and reuse
// `clamp` / `mixColor` from here rather than editing this one.
//
// Within v1: the matrices live inside the detail components, but the parent still
// colors its own cells, so this is shared rather than duplicated on both sides.
//
// Diverging scales run orange -> white -> blue around a true zero; sequential runs
// white -> teal from zero. Both apply a mild gamma so the middle of the range stays
// distinguishable instead of washing out.

export function clamp(value, minValue, maxValue) {
    return Math.min(maxValue, Math.max(minValue, value));
}

export function mixColor(start, end, amount) {
    let red = Math.round(start[0] + (end[0] - start[0]) * amount);
    let green = Math.round(start[1] + (end[1] - start[1]) * amount);
    let blue = Math.round(start[2] + (end[2] - start[2]) * amount);
    return `rgb(${red}, ${green}, ${blue})`;
}

export function heatColor(value, diverging, maxAbsolute, maxPositive) {
    if (!Number.isFinite(value)) {
        return "#f8fafc";
    }

    if (diverging) {
        let normalized = clamp(value / (maxAbsolute || 1), -1, 1);

        if (normalized >= 0) {
            return mixColor([255, 255, 255], [47, 91, 234], Math.pow(normalized, 0.65));
        }

        return mixColor([255, 255, 255], [194, 65, 12], Math.pow(Math.abs(normalized), 0.65));
    }

    let positiveScale = clamp(value / (maxPositive || 1), 0, 1);
    return mixColor([255, 255, 255], [24, 169, 153], Math.pow(positiveScale, 0.6));
}
