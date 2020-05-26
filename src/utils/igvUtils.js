import { query, buildBioIndexQueryString } from "@/utils/bioIndexUtils"

/**
 * A custom feature reader implementation
 * Required methods:
 *    constructor
 *    readFeatures
 */
export class BioIndexReader {

    constructor(config) {
        const { index, feature, translator } = config;
        this.index = index;
        this.feature = feature;
        this.translator = translator;
    }

    async readFeatures(chr, start, end) {
        // let limit = Math.abs(end - start)
        let bioIndexQuery = buildBioIndexQueryString({
            feature: this.feature,
            coords: {
                chr: chr.slice(-1),
                start: start,
                end: end,
            }
        });
        const response = await query(this.index, bioIndexQuery, {
            limit: 10000,
            resolveHandler: json => {
                console.log('step', json);
            },
            errHandler: json => {
                console.log('error', json);
            },
        })
        .then(response => {
            // TODO: abstract
            let translatedResponse = this.translator(response);
            console.log('end response', translatedResponse)
            return translatedResponse;
        })

        return response;

    }
}
