import { query } from "@/utils/bioIndexUtils";
import LocusZoom from "locuszoom";

function readOnCoords(index, queryStringMaker, {
    resolveHandler,
    errHandler,
    finishHandler,
}) {
    return {
        async fetch(chr, start, end, callback) {
            let q = queryStringMaker(chr, start, end);
            console.log('fetch', chr, start, end, q);
            let responseData = await query(index, q, {
                resolveHandler,
                errHandler,
                finishHandler,
            })
            return callback(responseData);
        }
    }
}

export const LZBioIndexSource = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
LZBioIndexSource.prototype.parseInit = function (params) {
    const { index, queryStringMaker, translator, resolveHandler, errHandler, finishHandler } = params;
    this.params = params;

    this.queryStringMaker = queryStringMaker;
    this.index = index;
    this.translator = translator;
    this.reader = readOnCoords(index, queryStringMaker, {
        resolveHandler,
        errHandler,
        finishHandler,
    });

};
LZBioIndexSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.reader.fetch(state.chr, state.start, state.end, (data, err) => {
            if (err) {
                reject(new Error(err));
            }
            resolve(self.translator(data));
        });
    });
};
