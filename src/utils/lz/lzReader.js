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

const SimpleSource = LocusZoom.Data.Source.extend(function(params) {
    this._store = params.store;
    this._data = params.data;
    this._positionUpdater = params.positionUpdater;
    this._cachedKey = null;
    this._dispatch = _.debounce(shouldDispatch(this), 1000);
},'SimpleSource');
SimpleSource.prototype.getRequest = function(state, chain, fields) {
    let cacheKey = this.getCacheKey(state, chain, fields);
    this._dispatch(state, cacheKey);
    return Promise.resolve(this._data);
};
SimpleSource.prototype.toJSON = function() {
    return [Object.getPrototypeOf(this).constructor.SOURCE_NAME, this._data];
};
SimpleSource.prototype.getCacheKey = function(state, chain, fields) {
    return JSON.stringify(state.chr) + JSON.stringify(state.start) + JSON.stringify(state.start);
};

function shouldDispatch(self) {
    return (state, cacheKey) => {
        if (typeof(cacheKey) !== 'undefined' && cacheKey !== self._cachedKey) {
            // self._store.dispatch('onLocusZoomCoords', {
            //     newChr: state.chr,
            //     newStart: state.start,
            //     newEnd: state.end,
            // });
            self._positionUpdater(state);
        }
    }
}
