/** Dot colors for credible sets — same 8-digit hex opacity as association LD dots (`50` ≈ 31%). */
export const VKS_CREDIBLE_SET_DOT_COLORS = [
    "#32AFD550",
    "#4DB05250",
    "#EE982D50",
    "#D0363350",
    "#2074B650",
    "#82409950",
];

/** Solid fills for drawer pills (match dot hue, full opacity). */
export const VKS_CREDIBLE_SET_PILL_COLORS = [
    "#32AFD5",
    "#4DB052",
    "#EE982D",
    "#D03633",
    "#2074B6",
    "#824099",
];

export function credibleSetColorForIndex(index) {
    if (index < 0) {
        return VKS_CREDIBLE_SET_DOT_COLORS[0];
    }
    return VKS_CREDIBLE_SET_DOT_COLORS[index % VKS_CREDIBLE_SET_DOT_COLORS.length];
}

export function credibleSetPillColorForIndex(index) {
    if (index < 0) {
        return VKS_CREDIBLE_SET_PILL_COLORS[0];
    }
    return VKS_CREDIBLE_SET_PILL_COLORS[index % VKS_CREDIBLE_SET_PILL_COLORS.length];
}

/**
 * Assign colors by selection order so each active set is distinct
 * (independent of index in the full locus list).
 */
export function buildCredibleSetColorMap(_availableSets, selectedIds) {
    const dotMap = {};
    const pillMap = {};

    (selectedIds || []).forEach((credibleSetId, selectionIndex) => {
        dotMap[credibleSetId] = credibleSetColorForIndex(selectionIndex);
        pillMap[credibleSetId] = credibleSetPillColorForIndex(selectionIndex);
    });

    return { dotMap, pillMap };
}
