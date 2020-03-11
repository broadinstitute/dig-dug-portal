import SchemaObject from "schema-object";

export const HUMAN_GENOME_BUILD_VERSION = 'GRCh37';

// panel ordering
// https://github.com/statgen/locuszoom/wiki/Panel#general
// https://github.com/statgen/locuszoom/wiki/Data-Layer#supported-layout-directives---allmost-data-layer-types
export const PANEL_ORDER = Object.freeze([
    // TODO: your ordering here
    'association','genes','intervals'
]);

export const BIO_INDEX_TYPE = Object.freeze({
    test: 'test',
    Associations: "Associations",
    TopAssociations: "TopAssociations",
    Variants: "Variants",
    PhenotypeAssociations: "PhenotypeAssociations",
});

export const LZ_TYPE = Object.freeze({
    assoc: 'assoc',
    gene: 'gene',
    recomb: 'recomb',
    ld: 'ld',
    constraint: 'constraint',
    intervals: 'intervals'
});

export const BIO_INDEX_TO_LZ = Object.freeze({
    [BIO_INDEX_TYPE.test]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.Associations]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.PhenotypeAssociations]: '',
    [BIO_INDEX_TYPE.TopAssociations]: '',
    [BIO_INDEX_TYPE.Variants]: '',
});

// TODO: type any?
const AssociationsSchemaCol = new SchemaObject({
    phenotype: { type: Array },
    id: { type: Array },
    chr: { type: Array },
    position: { type: Array },
    pvalue: { type: Array },
    log_pvalue: { type: Array },
    ref_allele: { type: Array },
    variant: { type: Array },
}, { setUndefined: true, });

const Associations = new SchemaObject({
    phenotype: 'any',
    id: 'any',
    chr: 'any',
    position: 'any',
    pvalue: 'any',
    log_pvalue: 'any',
    ref_allele: 'any',
    variant: 'any',
}, { setUndefined: true, });

export const LZSchemas = Object.freeze({
    [BIO_INDEX_TO_LZ[BIO_INDEX_TYPE.test]]: AssociationsSchemaCol,
    [BIO_INDEX_TO_LZ[BIO_INDEX_TYPE.Associations]]: AssociationsSchemaCol,
});
