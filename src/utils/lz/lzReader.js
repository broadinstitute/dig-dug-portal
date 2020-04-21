import LocusZoom from "locuszoom";

function readOnCoords(store, makePromiseForNewData) {
    return {
        async fetch({ chromosome, start, end }, callback) {
            try {
                store.dispatch(`onLocusZoomCoords`, { newChr: chromosome, newStart: start, newEnd: end });
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
    const { store, translator, promiseMaker } = params;
    this.params = params;
    this.translator = translator;
    this.promiseMaker = promiseMaker;
    this.reader = readOnCoords(store, promiseMaker);
};

BioIndexLZSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    const cacheKey = this.getCacheKey(state, chain, fields);
    if (self.enableCache && typeof(cacheKey) !== 'undefined' && cacheKey === self._cachedKey) {
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
    return JSON.stringify(state.chr) + JSON.stringify(state.start) + JSON.stringify(state.start);
};

// ALazyRandomFilterPhewas = LocusZoom.Data.LazyData(lzPhewasFilter);
// ILazyRandomFilterPhewas = ALazyRandomFilterPhewas(phewas_forest);

LocusZoom.Data.LazySource = LocusZoom.Data.Source.extend(function(lazyData) {
    this._lazyData = lazyData;
},'LazyJSON');
LocusZoom.Data.LazySource.prototype.getRequest = function(state, chain, fields) {
    this._lazyData = this._lazyData({state, chain, fields})
    return Promise.resolve(this._lazyData());
};
LocusZoom.Data.LazySource.prototype.toJSON = function() {
    return [Object.getPrototypeOf(this).constructor.SOURCE_NAME, this._lazyData()];
};
LocusZoom.Data.LazyData = (reduceFunc) => (initState) => {
    var current_state = initState;
    var handle_state = (args) => {
        if (typeof args !== "undefined") {
            current_state = (reduceFunc(current_state)(args));
            return LocusZoom.Data.TLazy(reduceFunc)(current_state);
        } else {
            return current_state;
        }
    }; // only return on evaluation
    return handle_state;
};
