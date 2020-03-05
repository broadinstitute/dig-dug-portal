import LocusZoom from "locuszoom";

function makeModuleReader(store, moduleIndex, phenotype) {
    return {
        fetch(chr, start, end, callback) {
            return new Promise(function (resolve, reject) {
                resolve(store.dispatch(`${moduleIndex}/query`, { q: `chr${chr}:${start}-${end}` }));
            }).then(store.getters[`${moduleIndex}/getData`]({ phenotype }));
        }
    }
}

let moduleParser = {
    "associations": function(data) {
        return {
            ...data,
            id: data.varId,
            // phenotype?
            chr: data.chromosome,
            pvalue: data.pValue,
            log_pvalue: data.pValue.map(-Math.log),
            ref_allele: data.reference,
            variant: data.varId,
        }
    }
};


export function makeDataSourceFromModule(store, moduleIndex, phenotype) {
    const moduleDataSourceConstructor = {
        parseInit(init) {
            this.params = init.params; // Used to create a parser
            this.parser = moduleParser[moduleIndex];
            this.reader = makeModuleReader(store, moduleIndex, phenotype);
        },
        fetchRequest(state, chain, fields) {
            const self = this;
            return new Promise((resolve, reject) => {
                self.reader.fetch(state.chr, state.start, state.end, (data, err) => {
                    if (err) {
                        reject(new Error(err));
                    }
                    resolve(data);
                });
            });
        },
        normalizeResponse(data) {
            return data.map(this.parser)
        }
    };
    LocusZoom.Data.StaticSource.extend(moduleDataSourceConstructor, `BI_${moduleIndex}LZ`);
    return
}
