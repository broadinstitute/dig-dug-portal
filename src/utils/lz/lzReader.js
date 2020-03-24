import LocusZoom from "locuszoom";
import {BIO_INDEX_TO_LZ, BIO_INDEX_TYPE, LZSchemas, moduleParserSchema} from "./lzConstants"
import {majorFormat, dataRangeFilter, dataFilter, isEmpty} from "./lzUtils";
import {arityFilter, queryTemplate} from "../bioIndexUtils"

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

function readOnCoords(store, moduleIndex, queryObj) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                return await store.dispatch(`${_.camelCase(moduleIndex)}/query`, { q: queryTemplate(arityFilter[moduleIndex]({ ...queryObj })) }).then(() => {
                        let value = store.getters[`${_.camelCase(moduleIndex)}/data`]
                            ||  new LZSchemas[BIO_INDEX_TO_LZ[BIO_INDEX_TYPE[moduleIndex]]]().toObject();
                        let format = majorFormat(value);

                        // default behavior is to return everything if states for a filter are undefined
                        const chromosomeFilter = dataFilter(format, 'chromosome')(chromosome);  // scoping the name as 'chromosome' as we're expecting bioindex data in general
                        const positionFilter = dataRangeFilter(format, 'position')(start, end);

                        value = chromosomeFilter(value);
                        value = positionFilter(value);

                    return callback(value);
                });
            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

function readFilteredQuery(store, moduleIndex, queryObj, filterObj) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                return await store.dispatch(`${_.camelCase(moduleIndex)}/query`, { q: queryTemplate({ ...queryObj }) }).then(() => {

                    let value = store.getters[`${_.camelCase(moduleIndex)}/data`]
                        ||  new LZSchemas[BIO_INDEX_TO_LZ[BIO_INDEX_TYPE[moduleIndex]]]().toObject();
                    let format = majorFormat(value);

                    // default behavior is to return everything if states for a filter are undefined
                    const chromosomeFilter = dataFilter(format, 'chromosome')(filterObj.chromosome || chromosome);  // scoping the name as 'chromosome' as we're expecting bioindex data in general
                    const positionFilter = dataRangeFilter(format, 'position')(filterObj.start || start, filterObj.end || end);

                    let filtered = value;
                    if (!isEmpty(filtered)) {
                        if (filterObj) {
                            Object.keys(filterObj).forEach(property => {
                                if (property !== 'chromosome' || property !== 'start' || property !== 'end') {
                                    const indexObjectFilter = dataFilter(format, property)(filterObj[property]);  // e.g. phenotype: `<page's phenotype>`
                                    filtered = indexObjectFilter(filtered);
                                }
                            });
                        }
                    }

                    filtered = chromosomeFilter(filtered);
                    filtered = positionFilter(filtered);

                    return callback(filtered);
                });
            } catch (e) {
                return callback(null, e);
            }
        }
    }
}

// Candidate A: Read off store (i.e. command-query separation)
// TODO: Caching?
function readOffStore(store, moduleIndex, indexObject) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                let value = store.getters[`${_.camelCase(moduleIndex)}/data`];
                if (value) {
                    let format = majorFormat(value);

                    // default behavior is to return everything if states for a filter are undefined
                    const chromosomeFilter = dataFilter(format, 'chromosome')(chromosome);  // scoping the name as 'chromosome' as we're expecting bioindex data in general
                    const positionFilter = dataRangeFilter(format, 'position')(start, end);

                    let filtered = value;
                    if (!isEmpty(filtered)) {
                        if (indexObject) {
                            Object.keys(indexObject).forEach(property => {
                                const indexObjectFilter = dataFilter(format, property)(indexObject[property]);  // e.g. phenotype: `<page's phenotype>`
                                filtered = indexObjectFilter(filtered);
                            });
                        }
                        filtered = chromosomeFilter(filtered);
                        filtered = positionFilter(filtered);
                    }
                    return callback(filtered);
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

export const BioIndexLZSourceJustInTime = LocusZoom.Data.Source.extend(function(init) {
    this.parseInit(init);
});
BioIndexLZSourceJustInTime.prototype.parseInit = function ({ store, module, queryMaker }) {
    this.params = { store, module, queryMaker };
    this.parser = moduleParser(module);
    this.reader = readOnCoords(store, module, queryMaker);
};
BioIndexLZSourceJustInTime.prototype.getRequest = function (state, chain, fields) {
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
