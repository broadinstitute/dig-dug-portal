import { BaseAdapter } from "locuszoom/esm/data/adapters"
import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

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
        withDataSourceReader: that.bioIndexToLZReader,
    }
}

export const makeLayout = function(that) {
    return {
        id: that.panel_id,
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
        const { index, queryStringMaker, translator, finishHandler, resolveHandler, errHandler } = params;
        this.params = params;
        this.queryStringMaker = queryStringMaker;
        this.index = index;
        this.translator = translator;
        this.finishHandler = finishHandler;
        this.resolveHandler = resolveHandler;
        this.errHandler = errHandler;
    };
    getCacheKey(state /*, chain, fields*/) {
        // In generic form, Tabix queries are based on chr, start, and end. The cache is thus controlled by the query,
        //  not the URL
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
                    finishHandler: self.finishHandler,
                    resolveHandler: self.resolveHandler,
                    errHandler: self.errHandler,
                })
                .then(async resultData => {
                    resolve(self.translator(resultData));
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
