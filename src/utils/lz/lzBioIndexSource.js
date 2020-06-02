import { query } from "@/utils/bioIndexUtils";
import LocusZoom from "locuszoom";

function readOnCoords(store, moduleIndex) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                return await query();
                // store.dispatch(`onLocusZoomCoords`, { module: moduleStore, newChr: chromosome, newStart: start, newEnd: end } )
                //     .then(() => {
                //         let value = store.getters[`${moduleStore}/data`];
                //         if (value) {
                //             return callback(value);
                //         }
                //         const emptyObject = [];
                //         return callback(emptyObject);
                //     });
            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

export const LZBioIndexSource = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
LZBioIndexSource.prototype.parseInit = function (params) {
    const { store, module } = params;
    this.params = params;
    this.parser = lzCreateSchemaTranslator(BIO_INDEX_TO_LZ[module], module, bioIndexToLzMappings);
    this.reader = readOnCoords(store, module);
};
LZBioIndexSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    return new Promise((resolve, reject) => {
        self.reader.fetch(state.chr, state.start, state.end, (data, err) => {
            if (err) {
                reject(new Error(err));
            }
            resolve(self.parser(data));
        });
    });
};
