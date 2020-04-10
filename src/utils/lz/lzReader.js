import LocusZoom from "locuszoom";

function readOnCoords(store, moduleIndex) {
    return {
        async fetch(chromosome, start, end, callback) {
            try {
                const moduleStore = _.camelCase(moduleIndex);
                return await store.dispatch(`onLocusZoomCoords`, { module: moduleStore, newChr: chromosome, newStart: start, newEnd: end })
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

export const BioIndexLZSource = LocusZoom.Data.Source.extend(function (init) {
    this.parseInit(init);
});
BioIndexLZSource.prototype.parseInit = function (params) {
    const { store, module, translator } = params;
    this.params = params;
    this.parser = translator;
    this.reader = readOnCoords(store, module);
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
