import LocusZoom from "locuszoom";
import {BIO_INDEX_TO_LZ, BIO_INDEX_TYPE, LZSchemas, moduleParserSchema} from "./lzConstants"
import {majorFormat, dataRangeFilter, dataFilter, isEmpty} from "./lzUtils";

// schema can be applied to both column-first or record-first formats, but the distinction
// in how is handled by another function
function moduleParser(index) {
    return function (data){
        let schema = moduleParserSchema[index];
        let format = majorFormat(data);

        console.log(index, data, schema, format);

        switch(format) {
            case 'r':
                console.log(data.map(schema));
                return data.map(schema);
            case 'c':
                console.log(schema(data));
                return schema(data);
        }
    }
}

// Candidate A: Read off store (i.e. command-query separation)
// TODO: Caching?
function readOffStore(store, moduleIndex, indexObject) {
    return {
        fetch(chromosome, start, end, callback) {
            try {
                let value = store.getters[`${moduleIndex}/data`];
                if(value) {
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
            console.log('resolving data', data, self.parser(data));
            resolve(self.parser(data));
        });
    });
};
