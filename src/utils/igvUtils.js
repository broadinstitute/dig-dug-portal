import { query } from "@/utils/bioIndexUtils"
import {
    // postAlertNotice,
    // closeAlert
    postAlertError,
} from "@/components/Alert";

/**
 * A custom feature reader implementation
 * Required methods:
 *    constructor
 *    readFeatures
 */
export class BioIndexReader {

    constructor(config) {
        const { index, translator, queryString, queryHandlers } = config;
        // this.feature = feature;
        this.index = index;
        this.translator = translator;
        this.queryStringMaker = queryString;
        this.queryHandlers = queryHandlers;
    }

    async readFeatures(chr, start, end) {
        // let limit = Math.abs(end - start);
        const response = await query(
            this.index,
            this.queryStringMaker(
                chr.slice(-1),
                start,
                end
            ),
            {
                limit: 10000,
                resolveHandler: json => {
                    if (!!this.queryHandlers.finishHandler) {
                        return this.queryHandlers.resolveHandler(json);
                    }
                },
                errHandler: json => {
                    if (!!this.queryHandlers.finishHandler) {
                        return this.queryHandlers.errHandler(json);
                    }
                },
                finishHandler: response => {
                    if (!!this.queryHandlers.finishHandler) {
                        return this.queryHandlers.finishHandler(response);
                    }
                },
            })
        .then(bioIndexData => {
            // TODO: abstract
            let igvData = this.translator(bioIndexData);
            return igvData;
        })

        return response;

    }
}

export function igvError(error) {
    postAlertError(error.detail);
}


export function colorIntervalAnnotation(intervalAnnotation) {
    console.log(intervalAnnotation);
    // TODO: Is this list exhaustive?
    // TODO: replace with a round robin of coloring? i.e. Replace with color iterator?
    // https://krazydad.com/tutorials/makecolors.php
    const intervalAnnotationStyles = {
        // TODO what do these map to?
        'Weak transcription start site': '#FFB974',
        'Active transcription start site': '#FF0000',

        'QuiescentLow': '#DDDDDD',
        'EnhancerGenic2': '',
        // TODO how are these different?
        'Bivalent poised TSS': '#FFFF19',
        'EnhancerBivalent': '#FFFF19',
        'PromoterBivalentFlanking': '#FFFF19',
        'PromoterBivalent': '',

        'TranscriptionFlanking': '#FF8D1D',
        'PromoterWeak': '',
        'RepressedPolycombWeak': '#C0C0C0',
        'RepressedPolycomb': '#808080',
        'PromoterFlankingDownstream': '',
        'PromoterFlankingUpstream': '',
        'Enhancer': '',
        'EnhancerGenic': '',
        'EnhancerWeak': '#FFFF00',
        'EnhancerActive1': '#FFE4B0',
        'EnhancerActive2': '#FFC34D',

        'PromoterFlanking': '',
        'PromoterActive': '',
        'GenePrediction': '',

        'TranscriptionWeak': '#006400',
        // TODO are these erquivalent?
        'Transcription': '#00E600',
        'TranscriptionStrong': '#00E600',
    };
    if (!!intervalAnnotationStyles[intervalAnnotation]) {
        return intervalAnnotationStyles[intervalAnnotation];
    } else {
        // a shade of blue for default colour
        return '#49A7E9'
    }
}

export const colorRing = {
    labels: new Map(),
    colorMapper: function(label) {
        if (!this.labels.has(label)) {
            this.colorGenerator.next();
        }
        return labels[label]
    },
    colorGenerator: function* () {}
}
