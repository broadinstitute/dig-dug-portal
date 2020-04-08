import {BIO_INDEX_TYPE} from '@/utils/bioIndexUtils'

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
    'genes',
    'intervals',
    'phewas',
    'annotation_catalog',
    'annotation_credible_set',
]);

export function sortPanels(panels) {
    // _.invert swaps keys and values, i.e. [ "val" ] === { 0: "val" } => { "val": 0 }
    const panelOrderMap = _.invert(PANEL_ORDER);
    return panels.sort(function (x, y) {
        if (panelOrderMap[x] < panelOrderMap[y]) {
            return -1;
        }
        if (panelOrderMap[x] > panelOrderMap[y]) {
            return 1;
        }
        return 0;
    });
}

export const calcLog = function (values) {
    if (values instanceof Array) {
        return values.map(Math.log).map(data => (-1) * data);
    } else {
        return (-1) * Math.log(values);
    }
};

/* LZ Mappings */
// Used to transform BioIndex types into LZ types
export const BIO_INDEX_TO_LZ = Object.freeze({
    [BIO_INDEX_TYPE.PhenotypeAssociations]: [LZ_TYPE.assoc],
    [BIO_INDEX_TYPE.Associations]: [LZ_TYPE.assoc],
    [BIO_INDEX_TYPE.TopAssociations]: [LZ_TYPE.assoc],
    [BIO_INDEX_TYPE.Genes]: [LZ_TYPE.gene],
});
