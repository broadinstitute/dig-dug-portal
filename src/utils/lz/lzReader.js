import LocusZoom from "locuszoom";
import { moduleParserSchema } from "@/utils/lz/lzSchemas"

// schema can be applied to both column-first or record-first formats, but the distinction
// in how is handled by another function
function moduleParser(index) {
    return function (data){
        let schema = moduleParserSchema[index];
        return data.map(schema);
    }
}

function readOnCoords(store, moduleIndex) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                // const moduleQueryStr = buildModuleQuery(moduleIndex, { ...queryMaker, chromosome, start, end });
                const moduleStore = _.camelCase(moduleIndex);
                return await store.dispatch(`onLocusZoomCoords`, { module: moduleStore, newChr: chromosome, newStart: start, newEnd: end } )
                    .then(() => {
                        let value = store.getters[`${moduleStore}/data`];
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
    this.params = params;
    this.parser = moduleParser(module);
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



