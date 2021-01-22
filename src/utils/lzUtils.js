import { BaseAdapter } from "locuszoom/esm/data/adapters"
import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import LocusZoom from "locuszoom";
import jsonQuery from "json-query";

export const BASE_PANEL_OPTIONS = {
    height: 240,
    // `min_height` is authoratative to locuszoom on what the "natural" height of the track ought to be; i.e. `height` can change, but `min_height` cannot, and so `min_height` can be the layout's default height without any other information.
    // this means when we delete a panel in between two other panels, locuszoom knows what height each other panel ought to be, the `min_height`, rather than resizing both panels to fill the space left in the middle.
    // so we should define min_height across all panels if we want to stop them from changing each other's sizes when any of them are removed.
    min_height: 240,
}

// just letting you know what everything is for
export const makeSource = function(that) {
    return {
        isDataSourceType: that.datasource_type,
        givingDataSourceName: that.datasource_namespace_symbol_for_panel,
        asDataSourceReader: that.bioIndexToLZReader,
    }
}

export const makeLayout = function(that) {
    return {
        panelLayoutType: that.panel_layout_type,
        takingDataSourceName: that.datasource_namespace_symbol_for_panel,
        forDataSourceType: that.datasource_type,
        locusZoomPanelOptions: that.locusZoomPanelOptions,
    }
}

export class LZBioIndexSource extends BaseAdapter {
    constructor(params) {
        super(params)
    }
    parseInit(params) {
        const { index, queryStringMaker, translator, onLoad, onResolve, onError } = params;
        this.params = params;
        this.queryStringMaker = queryStringMaker;
        this.index = index;
        this.translator = translator;
        this.onLoad = onLoad;
        this.onResolve = onResolve;
        this.onError = onError;
    };
    getCacheKey(state /*, chain, fields*/) {
        return [state.chr, state.start, state.end].join('_');
    }
    fetchRequest(state, chain, fields) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (!!self.initialData) {
                resolve(self.translator(self.initialData));
                self.initialData = null;
            } else {
                const alertID = postAlertNotice(`Loading ${self.index}; please wait ...`);
                query(self.index, self.queryStringMaker(state.chr, state.start, state.end), {
                    // onResolve: self.onResolve,
                })
                .then(async bioIndexResults => {
                    if(!!self.onLoad) {
                        self.onLoad(bioIndexResults);
                    }
                    resolve(self.translator(bioIndexResults));
                })
                .catch(async error => {
                    postAlertError(error.message);
                    reject(new Error(error));
                })
                .finally(() => closeAlert(alertID))
            }
        });
    };
}

export class LZLayout {
    #layout
    constructor(initialLayout) {
        this.#layout = initialLayout;
        console.log(this.#layout)
    }

    addFilter(data_layer, rawNamespaceKey, rawField) {

        // // side effect: since matching functions can't be undefined when they're called, we have to guarantee their registry before this layout is instanced
        // // no final flag = not overriding current registered match function to handle case where this was already done somewhere else, or at least once through this method
        // wrap in guard against being undefined to ensure execution only once
        if (typeof LocusZoom.MatchFunctions._items.get(rawField) !== 'undefined') {
            LocusZoom.MatchFunctions.add(rawField, () => true);
        }

        const data_layer_id = data_layer //.replaceAll('_', '');
        const filter = {
            field: `${rawNamespaceKey}:${rawField}`,
            operator: rawField,
            value: null,
        };
        const data_layer_object = this.#layout.data_layers.filter(dl => dl.id === data_layer_id)[0];

        if (!!!data_layer_object.filters) {
            data_layer_object.filters = [];
        }

        data_layer_object.filters.unshift(filter);

        return this;
    }

    addField(data_layer, rawNamespaceKey, rawField) {
        const data_layer_id = data_layer //.replaceAll('_', '');
        const data_layer_object = this.#layout.data_layers.filter(dl => dl.id === data_layer_id)[0];

        data_layer_object.fields.unshift(`${rawNamespaceKey}:${rawField}`);

        return this;
    }

    json() {
        return this.#layout;
    }
}

export function hasDataLayer(data_layer_id, panelClass) {
    return jsonQuery(`layouts[*]data_layers[*id=${data_layer_id}]`, {
        data: panelClass
    }).value.length > 0
}
