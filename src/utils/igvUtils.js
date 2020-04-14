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
import { BIO_INDEX_HOST, fullQueryFromUrl, moduleQueryTemplate, camelKebab } from "@/utils/bioIndexUtils";

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

function makeBioIndexIGVTrack({ module, track, translator }) {
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

export function makeBioIndexIGVTrackWithReader({ store, module, track, translator }) {
    const bioIndexIGVSource = new BioIndexIGVReader({
        store,
        module,
        translator,
    });
    return {
        name: module,
        type: track,
        reader: bioIndexIGVSource,
    };
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
        this.config = config;
    }
    async readFeatures(chr, start, end) {


        let chrNum = chr.split('chr')[1];

        let data = [];

        data = await this.config.store.dispatch('onIGVCoords', { module: this.config.module, newChr: chrNum, newStart: start, newEnd: end })
        .then(() => {
            let value = this.config.store.getters[`${camelKebab(this.config.module)}/data`];
            console.log('value', value);
            if (value) {
                return value;
            }
            const emptyObject = [];
            return emptyObject;
        });

        // TODO: this is the localized version of BioIndexIGVReader
        // let url = makeSourceURLFunction(this.config.module)({chr, start, end})
        // data = await fullQueryFromUrl(url);

        let features;
        if (data) {
            if (typeof this.config.translator === "function") {
                features = this.config.translator(data);
                console.log('features', this.config.translator, features);
            }
        }
        return features;
    }
}
