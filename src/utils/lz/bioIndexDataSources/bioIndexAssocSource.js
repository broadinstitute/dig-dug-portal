import LocusZoom from "locuszoom";
import { query } from "@/util/bioIndexUtils";

/* This function acts as a kind of "constructor" for an BioIndexAssocSource object.
 * The params are passed from the LocusZoom component.
 *
 * Additionally, every source needs a promise that will be returned to
 * LocusZoom when it asks for data.
 */
function BioIndexAssocParams(params) {
    this._params = params;
}

/* BioIndexAssocSource is a subclass of a LocusZoom Reader.
 */
const BioIndexAssocSource = LocusZoom.Data.Source.extend(BioIndexAssocParams, 'BioIndexAssocSource');

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom tells the source that it needs to fetch more data.
 * In our case, we'll call the _lzupdate method in the LocusZoom component,
 * which will end up performing a dispatch to the app/store.
 *
 * LocusZoom wants a promise to let it know when the data has finished
 * loading.
 */
BioIndexAssocSource.prototype.getRequest = function ({ chr, start, end }, chain, fields) {
    let q = `${this._params.phenotype},${chr}:${start}-${end}`;
    let handlers = {};

    return query('associations', q, handlers)
        .then(data => {
            this._data = data;

            // attempt to limit to ~1000 data points
            let threshold = 1000 / data.length;
            let assocs = data
                .filter(v => v.pValue < 1e-5 || Math.random() < threshold)
                .map(v => {
                    return {
                        id: v.varId,
                        variant: v.varId,
                        position: v.position,
                        log_pvalue: -Math.log10(v.pValue),
                        ref_allele: v.reference
                    };
                });

            return assocs;
        });
};

/* Overridden LocusZoom method.
 */
BioIndexAssocSource.prototype.getCacheKey = function (state, chain, fields) {
    return `${this._params.phenotype},${state.chr}:${state.start}-${state.end}`;
};

/* Overridden LocusZoom method.
 *
 * This is how LocusZoom gets the data.
 */
BioIndexAssocSource.prototype.toJSON = function () {
    return [Object.getPrototypeOf(this).constructor.SOURCE_NAME, this._data];
}
