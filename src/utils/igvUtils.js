import { query, buildBioIndexQueryString } from "@/utils/bioIndexUtils"

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
                        return this.queryHandlers.resolveHandler(response);
                    } else {
                        console.log('step', json);
                    }
                },
                errHandler: json => {
                    if (!!this.queryHandlers.finishHandler) {
                        return this.queryHandlers.errHandler(response);
                    } else {
                        console.log('error', json);
                    }
                },
                finishHandler: response => {
                    if (!!this.queryHandlers.finishHandler) {
                        return this.queryHandlers.finishHandler(response);
                    } else {
                        console.log('finish', response);
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
