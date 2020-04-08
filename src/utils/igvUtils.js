// gene
// genes
// global-enrichment
// regions
// associations
// top-associations
// phenotype-associations
// variant
// variants

// annotation --> in old portal
// alignment
// variant
// wig --> in old portal 2x
// segmented copy number
// splice junctions
// gwas  --> in old portal
// interaction

// Variants -> Annotation
import {BIO_INDEX_TYPE, BIO_INDEX_HOST} from "@/utils/bioIndexUtils";

function variantsToIgvAnnotations(variants) {
    return variants.map(variant => (
        {
            chr: variant.chromosome,
            start: variant.position,
            end: variant.position,
            strand: variant.strand,
        }
    ));
};

const TEMPLATE_TRACK = {
    name: null,
    type: null,  // e.g. annotation, GWAS, seg,...
    height: 300,
    visibilityWindow: 50000,
    sourceType: "custom",
    source: null
}

const TEMPLATE_SOURCE = {
    url: null,
    method: "GET",
    contentType: "application/json",
    parser: null,
}

function makeSourceURLFunction(regionBasedModule) {
    return function (options) {
        const chrNum = options.chr.split('chr')[1];
        const bioIndexAPICall = `${BIO_INDEX_HOST}/api/bio/query/${regionBasedModule}?q=${chrNum}:${options.start}-${options.end}`;
        return bioIndexAPICall;
    }
};

export function makeBioIndexIGVTrack({ module, track, translator }) {
    return {
        ...TEMPLATE_TRACK,
        name: module,
        type: track,
        source: {
            ...TEMPLATE_SOURCE,
            url: makeSourceURLFunction(module),
            parser: json => translator(JSON.parse(json).data),
        }
    }
}
