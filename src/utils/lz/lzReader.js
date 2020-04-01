import LocusZoom from "locuszoom";
import { BIO_INDEX_TO_LZ, bioIndexMappings, createSchemaTranslator } from "@/utils/dataMappingUtils";

function readOnCoords(store, moduleIndex) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                // const moduleQueryStr = buildModuleQuery(moduleIndex, { ...queryMaker, chromosome, start, end });
                const moduleStore = _.camelCase(moduleIndex);
                return await store.dispatch(`onLocusZoomCoords`, { module: moduleStore, newChr: chromosome, newStart: start, newEnd: end } )
                    .then(() => {
                        let value = store.getters[`${moduleStore}/data`];
                        console.log(value)
                        if (value) {
                            return callback(value);
                        }
                        const emptyObject = [];
                        return callback(emptyObject);
                    });
            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

export const BioIndexLZSourceJIT = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
BioIndexLZSourceJIT.prototype.parseInit = function (params) {
    const { store, module } = params;
    this.parser = createSchemaTranslator(BIO_INDEX_TO_LZ[module], module, bioIndexMappings);
    this.reader = readOnCoords(store, module);
};
BioIndexLZSourceJIT.prototype.getRequest = function (state, chain, fields) {
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



