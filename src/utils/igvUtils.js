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
            finishHandler: response => {
                this.$emit('igvupdate', response.json());
            },
        }).then(bioIndexData => {
            // TODO: abstract
            let igvData = this.translator(bioIndexData);
            return igvData;
        })

        return response;

    }
}
