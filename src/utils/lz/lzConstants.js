import SchemaObject from "schema-object";
import { calcLog } from "@/utils/lz/lzUtils";
import {BIO_INDEX_TYPE} from "@/utils/bioIndexUtils";

export const HUMAN_GENOME_BUILD_VERSION = 'GRCh37';

// panel ordering
// https://github.com/statgen/locuszoom/wiki/Panel#general
// https://github.com/statgen/locuszoom/wiki/Data-Layer#supported-layout-directives---allmost-data-layer-types
export const PANEL_ORDER = Object.freeze([
    // TODO: your ordering here
    'association','genes','intervals'
]);

// change this at your peril - they are observed values from LocusZoom's defaults
export const LZ_TYPE = Object.freeze({
    assoc: 'assoc',
    gene: 'gene',
    recomb: 'recomb',
    ld: 'ld',
    constraint: 'constraint',
    intervals: 'intervals',
    catalog: 'catalog',
});

export const BIO_INDEX_TO_LZ = Object.freeze({
    [BIO_INDEX_TYPE.test]: LZ_TYPE.assoc,
    [BIO_INDEX_TYPE.PhenotypeAssociations]: LZ_TYPE.assoc,  // done
    [BIO_INDEX_TYPE.Associations]: LZ_TYPE.assoc,   // done
    [BIO_INDEX_TYPE.TopAssociations]: LZ_TYPE.assoc,   // done
    [BIO_INDEX_TYPE.Variants]: LZ_TYPE.ld, // todo
    [BIO_INDEX_TYPE.Genes]: LZ_TYPE.gene,   // done
});

const LD = new SchemaObject({
    state: { type:'any', default: [] },
    isrefvar: { type:'any', default: [] },
}, { setUndefined: true, });

const Catalog = new SchemaObject({
    rsid: { type:'any', default: [] },
    trait: { type:'any', default: [] },
    log_pvalue: { type:'any', default: [] },
}, { setUndefined: true, });

const PheWAS = new SchemaObject({
    id: { type:'any', default: [] },
    log_pvalue: { type:'any', default: [] },
    trait_group: { type:'any', default: [] },
    trait_label: { type:'any', default: [] },
}, { setUndefined: true, });

const Exon = new SchemaObject({
    chrom: String,
    end: Number,
    exon_id: String,
    start: Number,
    strand: String,
}, { setUndefined: true, });

const Genes = new SchemaObject({
    chrom:  { type:'any', default: [] },
    end:  { type:'any', default: [] },
    exons:  { type: Array, arrayType: Exon, default: [] },
    gene_id:  { type:'any', default: [] },
    gene_name:  { type:'any', default: [] },
    start:  { type:'any', default: [] },
    strand:  { type:'any', default: [] },
    transcripts:  { type: Array, arrayType: Transcript, default: [] },
}, { setUndefined: true, });

const Transcript = new SchemaObject({
    chrom:  { type:'any', default: [] },
    end:  { type:'any', default: [] },
    exons:  { type: Array, arrayType: Exon, default: [] },
    gene_id:  { type:'any', default: [] },
    gene_name:  { type:'any', default: [] },
    start:  { type:'any', default: [] },
    strand:  { type:'any', default: [] },
}, { setUndefined: true, });

const Constraint = new SchemaObject({
    // TODO
}, { setUndefined: true, });

const Intervals = new SchemaObject({
    chromosome:  { type:'any', default: [] },
    end:  { type:'any', default: [] },
    id:  { type:'any', default: [] },
    public_id:  { type:'any', default: [] },
    start:  { type:'any', default: [] },
    state_id:  { type:'any', default: [] },
    state_name:  { type:'any', default: [] },
    strand:  { type:'any', default: [] },
}, { setUndefined: true, });

const Associations = new SchemaObject({
    phenotype: { type:'any', default: [] },
    id: { type:'any', default: [] },
    chr: { type:'any', default: [] },
    position: { type:'any', default: [] },
    pvalue: { type:'any', default: [] },
    log_pvalue: { type:'any', default: [] },
    ref_allele: { type:'any', default: [] },
    variant: { type:'any', default: [] },
}, { setUndefined: true, });

export const LZSchemas = Object.freeze({
    [LZ_TYPE.assoc]: Associations,
    [LZ_TYPE.constraint]: Constraint,
    [LZ_TYPE.intervals]: Intervals,
    [LZ_TYPE.gene]: Genes,
    [LZ_TYPE.phewas]: PheWAS,
    [LZ_TYPE.ld]: LD,
    [LZ_TYPE.catalog]: Catalog,
});

export const moduleParserSchema = Object.freeze({
    'test': function(data) {
        const parsedData = new LZSchemas[LZ_TYPE.assoc]({
            phenotype: data.phenotype || [],
            id: data.varId || [],
            chr: data.chromosome || [],
            position: data.position || [],
            pvalue: data.pValue || [],
            log_pvalue: calcLog(data.pValue) || [],
            ref_allele: data.reference || [],
            variant: data.varId || [],
        }).toObject();
        return parsedData;
    },
    [BIO_INDEX_TYPE.Variants]: function(data) {
        const parsedData = new LZSchemas[LZ_TYPE.intervals]({
            chrom:  data.chromosome || [],
            start:  data.start || [],
            end:  data.end || [],
            gene_id:  data.ensemblId || [],
            gene_name:  data.name || [],
        }).toObject();
        return parsedData;
    },
    [BIO_INDEX_TYPE.Genes]: function(data) {
        const parsedData = new LZSchemas[LZ_TYPE.gene]({
            chrom:  data.chromosome || [],
            start:  data.start || [],
            end:  data.end || [],
            gene_id:  data.ensemblId || [],
            gene_name:  data.name || [],
        }).toObject();
        return parsedData;
    },
    [BIO_INDEX_TYPE.Associations]: function(data) {
        const parsedData = new LZSchemas[LZ_TYPE.assoc]({
            phenotype: data.phenotype || [],
            id: data.varId || [],
            chr: data.chromosome  || [],
            position: data.position || [],
            pvalue: data.pValue || [],
            log_pvalue: calcLog(data.pValue) || [],
            ref_allele: data.reference || [],
            variant: data.varId || [],
        }).toObject();
        return parsedData;
    },
    [BIO_INDEX_TYPE.TopAssociations]: function(data) {

        const parsedData = new LZSchemas[LZ_TYPE.assoc]({
            phenotype: data.phenotype || [],
            id: data.varId || [],
            chr: data.chromosome  || [],
            position: data.position || [],
            pvalue: data.pValue || [],
            log_pvalue: calcLog(data.pValue) || [],
            ref_allele: data.reference || [],
            variant: data.varId || [],
        }).toObject();
        return parsedData;
    },
    [BIO_INDEX_TYPE.PhenotypeAssociations]: function(data) {
        const parsedData = new LZSchemas[LZ_TYPE.assoc]({
            phenotype: data.phenotype || [],
            id: data.varId || [],
            chr: data.chromosome  || [],
            position: data.position || [],
            pvalue: data.pValue || [],
            log_pvalue: calcLog(data.pValue) || [],
            ref_allele: data.reference || [],
            variant: data.varId || [],
        }).toObject();
        return parsedData;
    },
});
