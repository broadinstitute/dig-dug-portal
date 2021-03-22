import { BaseAdapter } from "locuszoom/esm/data/adapters"
import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { ColorRuler } from "color-ruler"
import _ from "lodash";

export const BASE_PANEL_OPTIONS = {
    height: 240,
    // `min_height` is authoratative to locuszoom on what the "natural" height of the track ought to be; i.e. `height` can change, but `min_height` cannot, and so `min_height` can be the layout's default height without any other information.
    // this means when we delete a panel in between two other panels, locuszoom knows what height each other panel ought to be, the `min_height`, rather than resizing both panels to fill the space left in the middle.
    // so we should define min_height across all panels if we want to stop them from changing each other's sizes when any of them are removed.
    min_height: 240,
}

export class LZBioIndexSource extends BaseAdapter {
    constructor(params) {
        super(params)
    }
    parseInit(params) {
        const { index, queryStringMaker, translator, onLoad, onResolve, onError } = params;
        this.params = params;
        this.index = index;
        this.queryStringMaker = queryStringMaker;
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

class LocusZoomPanel {
    #layout;
    #adapter;
    constructor(layout, adapter, identifier='', namespace={}) {
        this.#layout = layout;
        this.#adapter = adapter;
        
        this.#adapter._setIdentifier(identifier);
        this.#layout._setIdentifier(identifier);
        
        // if the namespace is empty, assume that all data is taken from the datasource labeled with identifier
        if (_.isEmpty(namespace)) {
            this.#layout._modifyNamespace(identifier);
        } else {
            this.#layout._modifyNamespace(identifier);
        }
    }
    get components() {
        return {
            layout: this.#layout.full(),
            adapter: this.#adapter.full(),
        }
    }
}

class LocusZoomLayout {

    #base_layout;
    #layout_options;

    constructor(base_layout, layout_options={}) {
        this.#base_layout = base_layout;
        this.#layout_options = layout_options;
    }

    setTitle(text, opts={}) {
        this.#layout_options['title'] = { text, ...opts }
        return this;
    }
    
    addFields(namespaceTarget, ...fields) {
        const namespacedFields = fields.map(field => {
            return `{{namespace[${namespaceTarget}]}}${field}`
        })
        this.#layout_options['fields'] = namespacedFields.concat(
            ...LocusZoom.Layouts.get(
                "panel",
                this.#base_layout,
                { unnamespaced: true }
            ).fields
        );
        return this;
    }

    _setIdentifier(identifier) {
        this.#layout_options['id'] = `${identifier}_layout`
        return this;
    }
    _modifyNamespace(namespaceOrSourceId, namespaceTarget) {
        try {
            if (_.isPlainObject(namespaceOrSourceId)) {
                // merge the two namespaces
                this.#layout_options['namespace'] = _.merge(
                        LocusZoom.Layouts.get(
                            "panel",
                            this.#base_layout
                        ).namespace,
                        namespaceOrSourceId,
                    );
            } else if (_.isString(namespaceOrSourceId) && !!namespaceTarget) {
                // assume that all of the namespace will remap onto this
            } else {
                throw Error(
                    `unsupported type for modifyNamespace: ${typeof namespaceOrSourceId} (could be an Array?)`
                )
            }
        } catch(e) {
            console.warn(e);
        }
        return this;
    }

    get full() {
        return LocusZoom.Layouts.get(
            "panel",
            this.#base_layout,
            this.#layout_options,
        )
    }
}

class LocusZoomAdapter {
    #identifier;
    #adapter;
    constructor(base_adapter) {
        // TODO: default to StaticJSON?
        this.#adapter = base_adapter;
    }
    _setIdentifier(identifier, suffixed) {
        this.#identifier = `${identifier}_src`
    }
    get full() {
        return [this.#identifier, this.#adapter];
    }
}

class LZBioIndexAdapter extends LocusZoomAdapter {
    constructor(index, primary_key, secondary_key, opts={}) {
        // build the query-making function from the index, primary key, and secondary key
        // if no secondary key is available, assume that it's the region
        // CASES:
        //      primary_key=phenotype, secondary_key=undefined => `${phenotype},${chr}:${start}-${end}`     (Used in Associations plot)
        //      primary_key=varOrGeneId, secondary_key='' => `${primary_key}`                               (Used in PheWAS plot)
        //      primary_key=varOrGeneId, secondary_key=<some string> => `${primary_key},${secondary_key}`   (valid, although unknown)
        //      primary_key=undefined, secondary_key=<some string>                                          (INVALID)
        let queryStringMaker;
        if (!!primary_key) {
            if (_.isString(secondary_key)) {
                queryStringMaker = (chr, start, end) => `${primary_key},${secondary_key}`;
            } else {
                queryStringMaker = (chr, start, end) => `${primary_key},${chr}:${start}-${end}`;
            }
        } else {
            throw Error('No primary key defined for LZBioIndexAdapter')
        };

        super(new LZBioIndexSource({ 
            index,
            queryStringMaker, 
            ...opts, 
        }));

    }
}


export function addPanel(plot, dataSources, panelClass) {
    const { layout, adapter } = new LocusZoomPanel(
            new LocusZoomLayout(), 
            new LocusZoomAdapter(panelClass.bioIndexToLZReader)
        ).components;

    // DataSources and Panels/Layouts are linked together via namespaces.
    // A DataSource name is given to the panel, for a particular data type
    // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
    // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <layout.takingDataSourceName>

    if (
        !!!dataSources._items.has(
            panelClass.datasource_namespace_symbol_for_panel
        )
    ) {
        dataSources.add(
            panelClass.datasource_namespace_symbol_for_panel,
            panelClass.bioIndexToLZReader
        );
    }

    let panel;
    if (!!panelClass.layouts) {
        let layouts = panelClass.layouts[0];
        panel = plot.addPanel(layouts).addBasicLoader();
    } else {
        let panelOptions = {
            id: idCounter.getUniqueId(),
            namespace: {
                [panelClass.datasource_type]:
                    panelClass.datasource_namespace_symbol_for_panel,
            },
            // id: layout.id,
            ...panelClass.locusZoomPanelOptions, // other locuszoom configuration required for the panel, including overrides(?)
        };
        panel = plot
            .addPanel(
                LocusZoom.Layouts.get(
                    "panel",
                    panelClass.panel_layout_type,
                    panelOptions
                )
            )
            .addBasicLoader();
    }

    // so we can figure out how to remove it later
    return panel.id;
}

// new LocusZoomPanel(new LocusZoomLayout('assoc'), new LZBioIndexAdapter()).components()

export const LZColorScheme = new ColorRuler();
