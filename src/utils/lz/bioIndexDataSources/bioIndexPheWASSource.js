import LocusZoom from "locuszoom";
import { query } from "@/util/bioIndexUtils";

/* This function acts as a kind of "constructor" for an BioIndexPheWASSource object.
 * The params are passed from the LocusZoom component.
 *
 * Additionally, every source needs a promise that will be returned to
 * LocusZoom when it asks for data.
 */
function BioIndePheWASParams(params) {
    this._params = params;
}

/* BioIndexPheWASSource is a subclass of a LocusZoom Reader.
 */
const BioIndexPheWASSource = LocusZoom.Data.Source.extend(BioIndePheWASParams, 'BioIndexPheWASSource');

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom tells the source that it needs to fetch more data.
 * In our case, we'll call the _lzupdate method in the LocusZoom component,
 * which will end up performing a dispatch to the app/store.
 *
 * LocusZoom wants a promise to let it know when the data has finished
 * loading.
 */
BioIndexPheWASSource.prototype.getRequest = function (state, chain, fields) {
    let q = `${this._params.varId}`;
    let handlers = {};

    return query('variant', q, handlers)
        .then(data => {
            return data.associations.map(a => {
                return {
                    id: a.phenotype.name,
                    log_pvalue: -Math.log10(a.pValue),
                    trait_group: a.phenotype.group,
                    trait_label: a.phenotype.description
                };
            });
        });
};

/* Overridden LocusZoom method.
 */
BioIndexPheWASSource.prototype.getCacheKey = function (state, chain, fields) {
    return `${this._params.phenotype},${state.chr}:${state.start}-${state.end}`;
};

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom gets the data.
 */
BioIndexPheWASSource.prototype.toJSON = function () {
    return [Object.getPrototypeOf(this).constructor.SOURCE_NAME, this._data];
}
