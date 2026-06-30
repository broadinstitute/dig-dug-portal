/** Match kpGEMPkg compareGroupColors.bold used by ResearchCredibleSets. */
export const VKS_CREDIBLE_SET_COLORS = [
    "#32AFD5",
    "#4DB052",
    "#EE982D",
    "#D03633",
    "#824099",
    "#2074B6",
    "#E07B39",
    "#6B6B6B",
];

export function credibleSetColorForIndex(index) {
    if (index < 0) {
        return VKS_CREDIBLE_SET_COLORS[0];
    }
    return VKS_CREDIBLE_SET_COLORS[index % VKS_CREDIBLE_SET_COLORS.length];
}

export function buildCredibleSetColorMap(availableSets, selectedIds) {
    const colorKeys = (availableSets || []).map(
        (entry) => `${entry.credibleSetId}, ${entry.phenotype || ""}`
    );
    const map = {};

    (selectedIds || []).forEach((credibleSetId) => {
        const entry = (availableSets || []).find((item) => item.credibleSetId === credibleSetId);
        const colorKey = entry
            ? `${entry.credibleSetId}, ${entry.phenotype || ""}`
            : credibleSetId;
        const index = colorKeys.indexOf(colorKey);
        map[credibleSetId] = credibleSetColorForIndex(index >= 0 ? index : selectedIds.indexOf(credibleSetId));
    });

    return map;
}
