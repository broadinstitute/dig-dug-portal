import { query, buildBioIndexQueryString } from "@/utils/bioIndexUtils"

/**
 * A custom feature reader implementation
 * Required methods:
 *    constructor
 *    readFeatures
 */
export class BioIndexReader {

    constructor(config) {
        const { index, translator, queryString } = config;
        // this.feature = feature;
        this.index = index;
        this.translator = translator;
        this.queryStringMaker = queryString;
    }

    async readFeatures(chr, start, end) {
        // let limit = Math.abs(end - start)
        // let bioIndexQuery = buildBioIndexQueryString({
        //     feature: this.feature,
        //     coords: {
        //         chr: chr.slice(-1),
        //         start: start,
        //         end: end,
        //     }
        // });
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
                    console.log('step', json);
                },
                errHandler: json => {
                    console.log('error', json);
                },
                finishHandler: response => {
                    // this.$emit('igvupdate', response);
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
