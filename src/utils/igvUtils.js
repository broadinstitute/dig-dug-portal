import { query } from "@/utils/bioIndexUtils";

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
        const response = await query(
            this.index,
            this.queryStringMaker(
                chr.slice(3),  // filter out the first three characters (take the characters from 3 onwards)
                start,
                end
            ),
            {
                limit: null,  // UNLIMITED POWER
                resolveHandler: json => this.queryHandlers.resolveHandler(json),
                errHandler: json => this.queryHandlers.errHandler(json),
                finishHandler: response => this.queryHandlers.finishHandler(response),
            }
        )
        .then(bioIndexData => {
            let igvData = this.translator(bioIndexData);
            return igvData;
        })

        return response;

    }
}

// TODO
// export function tissueColorScheme(tissues) {
//     return d3.scaleOrdinal().domain(tissues).range(d3.schemeSet1);
// }
