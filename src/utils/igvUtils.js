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
import { BIO_INDEX_HOST, fullQuery } from "@/utils/bioIndexUtils";
import { moduleQueryTemplate } from "./bioIndexUtils";

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
    visibilityWindow: 5000,
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

export function makeBioIndexIGVTrack({ module, track, translator, source }) {
    return {
        ...TEMPLATE_TRACK,
        name: module,
        type: track,
        source: source || {
            ...TEMPLATE_SOURCE,
            url: makeSourceURLFunction(module),
            parser: json => translator(JSON.parse(json).data),
        }
    }
}

export function makeBioIndexIGVTrackWithReader({ module, track, translator }) {
    const bioIndexIGVSource = new BioIndexIGVReader({
        module,
        translator,
    });
    return makeBioIndexIGVTrack({
        module,
        track,
        translator,
        source: bioIndexIGVSource,
    });
}

/**
 * A custom feature reader implementation
 * The purpose of the BioIndexIGVReader is to totally complete a query up to its limit.
 * Required methods:
 *    constructor
 *    readFeatures
 */
class BioIndexIGVReader {

    constructor(config) {
        this.module = config.module;
        this.translator = config.translator;
    }

    async readFeatures(chr, start, end) {

        const data =
            await fullQuery({
                index: this.module,
                q: moduleQueryTemplate(this.module, {
                    chromosome: chr,
                    start: start,
                    end: end
                })
            }, () => {
                throw Error('module query failed')
            });

        return this.translator(data);

        // if (!response.ok) {
        //     throw Error(response.statusText);
        // } else {
        //     return data;
        // }
    }
}
