import LocusZoom from "locuszoom";
import {BIO_INDEX_TO_LZ, BIO_INDEX_TYPE, LZSchemas} from "./lzConstants"
import {majorFormat, dataRangeFilter, dataFilter, isEmpty} from "./lzUtils";

let moduleParserSchema = Object.freeze({
    'test': function(data) { return data; },
    [BIO_INDEX_TYPE.Associations]: function(data) {
        return {
            phenotype: data.phenotype,
            id: data.varId || data.variant,
            chr: data.chromosome || data.chr,
            position: data.position,
            pvalue: data.pvalue || data.pValue,
            log_pvalue: data.pvalue.map(Math.log).map(x => (-1*x)) || data.pValue.map(Math.log).map(x => (-1*x)),
            ref_allele: data.reference || data.ref_allele,
            variant: data.varId || data.variant,
        }
    }
});

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

// Candidate A: Read off store (i.e. command-query separation)
// TODO: Caching?
function readOffStore(store, moduleIndex, indexObject) {
    return {
        fetch(chr, start, end, callback) {
            try {
                // TODO
                // let moduleIndex = 'Associations';
                let value = store.getters[`${moduleIndex}/data`]
                    || new LZSchemas[BIO_INDEX_TO_LZ[BIO_INDEX_TYPE[moduleIndex]]]().toObject();
                let format = majorFormat(value);

                // default behavior is to return everything if states for a filter are undefined
                const chromosomeFilter = dataFilter(format, { chr });
                const positionFilter = dataRangeFilter(format, 'position')(start, end);

                let filtered = value;
                if (!isEmpty(filtered)) {
                    if (indexObject) {
                        const indexObjectFilter = dataFilter(format, { ...indexObject });  // e.g. phenotype: `<page's phenotype>`
                        filtered = indexObjectFilter(filtered);
                    }
                    filtered = chromosomeFilter(filtered);
                    filtered = positionFilter(filtered);
                }
                return callback(filtered);
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
