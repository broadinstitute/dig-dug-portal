import LocusZoom from "locuszoom";

/* This function acts as a kind of "constructor" for an LZVueSource object.
 * The params are passed from the LocusZoom component.
 *
 * Additionally, every source needs a promise that will be returned to
 * LocusZoom when it asks for data.
 */
function LZVueParams(params) {
    this._lzupdate = params.lzupdate;

    // create the promise for a future getRequest
    this._promise = new Promise(r => {
        this._resolve = r;
    });
}

/* LZVueSource is a subclass of a LocusZoom Reader.
 */
const LZVueSource = LocusZoom.Data.Source.extend(LZVueParams, 'LZVueSource');

/* This is called when data has been loaded for the source and is ready
 * to be resolved for LocusZoom.
 */
LZVueSource.prototype.resolve = function (data) {
    this._resolve(data);

    // clear the resolve function, can't do it again!
    this._resolve = null;
}

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom tells the source that it needs to fetch more data.
 * In our case, we'll call the _lzupdate method in the LocusZoom component,
 * which will end up performing a dispatch to the app/store.
 *
 * LocusZoom wants a promise to let it know when the data has finished
 * loading.
 */
LZVueSource.prototype.getRequest = function (state, chain, fields) {
    let promise = this._promise;

    // make the request for data
    this._lzupdate(state, chain, fields);

    /* If the source has already loaded the data, then we'll return the
     * current promise as it's already been resolved and then make a new
     * promise for any future requests.
     */
    if (!this._resolve) {
        this._promise = new Promise(r => {
            this._resolve = r;
        });
    }

    // this is returned to LocusZoom, but will be resolved by the component
    return promise;
};

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom gets the data.
 */
LZVueSource.prototype.toJSON = function () {
    return [Object.getPrototypeOf(this).constructor.SOURCE_NAME, this._data];
}

/* Overridden LocusZoom method.
 */
LZVueSource.prototype.getCacheKey = function (state, chain, fields) {
    return `${state.chr}:${state.start}-${state.end}`;
};
