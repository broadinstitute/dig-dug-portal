import LocusZoom from "locuszoom";

function readOnCoords(store, moduleIndex, makePromiseForNewData) {
    return {
        async fetch({ chromosome, start, end }, callback) {
            try {
                store.dispatch(`onLocusZoomCoords`, { module: moduleIndex, newChr: chromosome, newStart: start, newEnd: end });
                return makePromiseForNewData().then(callback);
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
    const { store, module, translator, promiseMaker } = params;
    this.params = params;
    this.translator = translator;
    this.promiseMaker = promiseMaker;
    this.reader = readOnCoords(store, module, promiseMaker);

    this.sideEffect = null;

};

BioIndexLZSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    const cacheKey = this.getCacheKey(state, chain, fields);
    if (self.enableCache && typeof(cacheKey) !== 'undefined' && cacheKey === this._cachedKey) {
        return Promise.resolve(self._cachedResponse);  // Resolve to the value of the current promise
    } else {
        return new Promise((resolve, reject) => {
            self.reader.fetch({ chromosome: state.chr, start: state.start, end: state.end }, (data, err) => {
                if (err) {
                    reject(new Error(err));
                }
                resolve(self.translator(data));
            });
        });
    }

};

BioIndexLZSource.prototype.getCacheKey = function(state, chain, fields) {
    console.log(state);
    return JSON.stringify(state.chr) + JSON.stringify(state.start) + JSON.stringify(state.start);
};
