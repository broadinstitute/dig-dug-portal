export const LZ_TYPE = Object.freeze({
    assoc: 'assoc',
    gene: 'gene',
    recomb: 'recomb',
    ld: 'ld',
    constraint: 'constraint',
    intervals: 'intervals',
    phewas: 'phewas',
});

export const HUMAN_GENOME_BUILD_VERSION = 'GRCh37';
// panel ordering
// https://github.com/statgen/locuszoom/wiki/Panel#general
// https://github.com/statgen/locuszoom/wiki/Data-Layer#supported-layout-directives---allmost-data-layer-types

export const PANEL_ORDER = Object.freeze([
    // TODO: your ordering here
    'association',
    'association_catalog',
    'association_credible_set',
    'phewas',
    'genes',
    'intervals',
    'annotation_catalog',
    'annotation_credible_set',
]);

export function sortPanels(panels, panelOrderMap = PANEL_ORDER) {
    // _.invert swaps keys and values, i.e. [ "val" ] === { 0: "val" } => { "val": 0 }
    const panelOrder = _.invert(panelOrderMap);
    return panels.sort(function (x, y) {
        if (panelOrder[x] < panelOrder[y]) {
            return -1;
        }
        if (panelOrder[x] > panelOrder[y]) {
            return 1;
        }
        return 0;
    });
}

export const calcLog = function (values) {
    return -Math.log10(values);
};
