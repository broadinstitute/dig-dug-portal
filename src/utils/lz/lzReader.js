import LocusZoom from "locuszoom";
import {BIO_INDEX_TO_LZ, BIO_INDEX_TYPE, LZSchemas, moduleParserSchema} from "./lzConstants"
import { isEmpty, dataRangeFilter, dataFilter } from "./lzUtils";
import {arityFilter, queryTemplate, majorFormat, buildModuleQuery} from "@/utils/bioIndexUtils"

// schema can be applied to both column-first or record-first formats, but the distinction
// in how is handled by another function
function moduleParser(index) {
    return function (data){
        let schema = moduleParserSchema[index];
        let format = majorFormat(data);
        switch(format) {
            case 'r':
                return data.map(schema);
            case 'c':
                return schema(data);
        }
    }
}

function readOnCoords(store, moduleIndex, queryMaker) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                const moduleQueryStr = buildModuleQuery(moduleIndex, { ...queryMaker, chromosome, start, end });
                const moduleStore = _.camelCase(moduleIndex);
                return await store.dispatch(`${moduleStore}/query`, { q: moduleQueryStr }).then(() => {
                    let value = store.getters[`${moduleStore}/data`];
                    if (value) {
                        return callback(value);
                    }
                    const emptyObject = new LZSchemas[BIO_INDEX_TO_LZ[BIO_INDEX_TYPE[moduleIndex]]]().toObject();
                    return callback(emptyObject);
                });
            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

// Candidate A: Read off store (i.e. command-query separation)
function readOffStore(store, moduleIndex) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                let value = store.getters[`${_.camelCase(moduleIndex)}/data`];
                if (value) {
                    let format = majorFormat(value);

                    // default behavior is to return everything if states for a filter are undefined
                    const chromosomeFilter = dataFilter(format, 'chromosome')(chromosome);  // scoping the name as 'chromosome' as we're expecting bioindex data in general
                    const positionFilter = dataRangeFilter(format, 'position')(start, end);
                    if (!isEmpty(value)) {
                        if (typeof indexObject !== "undefined") {
                            Object.keys(indexObject).forEach(property => {
                                const indexObjectFilter = dataFilter(format, property)(indexObject[property]);  // e.g. phenotype: `<page's phenotype>`
                                value = indexObjectFilter(value);
                            });
                        }
                    }
                    value = chromosomeFilter(value);
                    value = positionFilter(value);
                    return callback(value);
                } else {
                    const emptySchema = new LZSchemas[BIO_INDEX_TO_LZ[BIO_INDEX_TYPE[moduleIndex]]]().toObject();
                    return callback(emptySchema);
                }

            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

export const BioIndexLZSource = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
BioIndexLZSource.prototype.parseInit = function ({ store, module, indexObj }) {
    this.params = { store, module, indexObj };
    this.parser = moduleParser(module);
    this.reader = readOffStore(store, module, indexObj);
};
BioIndexLZSource.prototype.getRequest = function (state, chain, fields) {
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

export const BioIndexLZSourceJIT = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
BioIndexLZSourceJIT.prototype.parseInit = function (params) {
    const { store, module, queryMaker } = params;
    this.params = params;
    this.parser = moduleParser(module);
    this.reader = readOnCoords(store, module, queryMaker);
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
