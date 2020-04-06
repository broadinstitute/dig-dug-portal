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
import {cloneDeep} from "lodash";
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
    type: "annotation",
    height: 300,
    visibilityWindow: 200000,
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

export function makeBioIndexIGVTrack({ module, translator }) {
    return {
        ...TEMPLATE_TRACK,
        name: module,
        source: {
            ...TEMPLATE_SOURCE,
            url: makeSourceURLFunction(module),
            parser: translator,
        }
    }
}

export const associationsToIGVAnnotationTrackData = response => {
    const json = JSON.parse(response);
    if (typeof json.data == 'undefined') {
        return []
    } else {
        return json.data.map(element => {
            const annotation = cloneDeep(element);
            annotation['chromosome'] = undefined;
            annotation['position'] = undefined;
            return {
                chr: element.chromosome,
                start: element.position,
                end: element.position,
                ...annotation,
            }
        });
    }
}
