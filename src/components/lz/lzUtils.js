import LocusZoom from "locuszoom";

import { BaseAdapter } from "locuszoom/esm/data/adapters"
import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import { ColorRuler } from "color-ruler"
import _ from "lodash";

import Counter from '@/utils/idCounter';
import { data, type } from "jquery";

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
        const { index, queryStringMaker, translator=id=>id, onLoad=id=>id, onResolve=id=>id, onError=id=>id } = params;
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

// const prefSuff = (prefix, suffix) => `${prefix}_${suffix}`;
// const lzAdapterId = identifier => prefSuff(identifier, 'source');
// const lzLayoutId = identifier => prefSuff(identifier, 'layout');

/*
 * The goal of LocusZoomPanel, LocusZoomLayout, and LocusZoomAdapter are to encapsulate 
 * common operations that are used in the portal /to extend existing LocusZoom layouts/.
 * 
 * These operations include:
 *   Quickly implementing and extending default layouts from LocusZoom
 *   Binding adapters and layouts together using the namespace
 *   Adding new fields to a data layer to make them filterable
 *   Making new datasources that call BioIndex and are indexed by a primary key
 *   Tweaking individual properties deep inside of the layout
 * 
 */
class LocusZoomPanel {
    #layout;
    #adapter;

    // CASES:
    //  Plain old LocusZoom layout: pass in a LocusZoom layout object into `layout`, omit the other paramters as optional
    //      Case 1: pass in layout string
    //          "associationspvaluecatalog"
    //      Case 2: pass in a LocusZoom layout directly
    //          LocusZoom.Layouts.get("panels", "associationspvaluecatalog", { unnamespaced: true }) // should be namespaced automatically base on other arguments
    //  A LocusZoom layout with a known adapter: pass in a LocusZoom layout object into `layout` or a string that can retrieve that layout. pass a LocusZoom adapter into `adapter` or a string that can retrieve that adapter.
    //  A LocusZoom layout with a custom adapter: see above, but requires namespaceTarget or namespace to be defined (identifier is either given or generated)
    //  A custom LocusZoom layout with a custom adapter: see above, requires namespaceTarget or namespace to be defined (identifier is either given or generated)
    constructor(layout, adapter, namespaceTarget='', identifier='') {

        let sharedIdentifier;
        if (_.isString(identifier)) {
            if (_.isEmpty(identifier)) {
                sharedIdentifier = Counter.getUniqueId(namespaceTarget);
            } else {
                sharedIdentifier = identifier;
            }
        } else {
            throw Error(`your provided identifier is of the wrong type: ${typeof identifier} (should be String)`)
        }
        
        // TODO: consolidate namespaceTarget and identifier into namespace? derive everything from namespace?
        // let _namespace = {
        //     [namespaceTarget]: identifier,
        //     ...namespace,
        // }

        if (typeof layout === "string") {
            this.#layout = new LocusZoomLayout(layout, sharedIdentifier, namespaceTarget);
        } else if (layout instanceof LocusZoomLayout) {
            // full override?
            this.#layout = layout;
        } else if (_.isPlainObject(layout)) {
            // TODO: merging with existing layouts passed
            // this.#layout = new LocusZoomLayout(layout.full, shared_identifier);
        }

        if (adapter instanceof LocusZoomAdapter) {
            // full override?
            this.#adapter = adapter;
        } else {
            this.#adapter = new LocusZoomAdapter(adapter, sharedIdentifier, namespaceTarget);
        }

    }

    // unwrap the layout and adapter classes, and get their plain old LocusZoom objects
    // these can be passed into LocusZoom directly (e.g. plot.addPanel(layout) and dataSources.addSource(adapter))
    // `layout` should be an object, `adapter` should be an array of [namespaceTarget: String, adapter: child of LocusZoom.BaseAdapter]
    get components() {
        return {
            layout: this.#layout.full,
            adapter: this.#adapter.full,
        }
    }
}

class LocusZoomLayout {

    #base_layout;
    // The LocusZoomLayout object makes it simple to extend or modify the `fields` and `namespaces` of a given layout
    // It works with any valid LocusZoom layout
    constructor(base_layout, identifier, namespaceTarget, layout_options={}, ) {

        // guarantee a base layout
        if (_.isString(base_layout)) {
            this.#base_layout = LocusZoom.Layouts.get('panel', base_layout, {
                namespace: {
                    [namespaceTarget]: identifier
                }
            });
        } else if (
            _.isPlainObject(base_layout)
        ) {
            this.#base_layout = base_layout;
        } else {
            throw Error('You must present a valid base layout!\n Giving the name of an existing LocusZoom panel will do.')
        }
    }

    // TODO: replace with utils method?
    setTitle(text, opts={}) {
        // this.#layout_options['title'] = { text, ...opts }
        return this;
    }
    
    setProperty(accessor, value) {
        _.set(this.#base_layout, accessor, value)
        return this;
    }

    // TODO: replace with utils method?
    // use this function when you want to ensure certain fields exist in the data_layer that aren't necessarily displayed on the plot
    // useful for filters which will operate on non-visualized properties, e.g. nearest genes, consequences, methods
    // prior knowledge of the keys used for the namespace is required
    // you can find documentation for base layouts and their namespaces here: 
    addFields(namespaceTarget, ...fields) {
        // const namespacedFields = fields.map(field => {
        //     return `{{namespace[${namespaceTarget}]}}${field}`
        // })
        // // this.#layout_options['fields'] = 
        // namespacedFields.concat(
        //     this.#base_layout.fields
        // );
        // _.set(this.#base_layout, 'fields', 
        //     namespacedFields.concat(
        //         this.#base_layout.fields
        //     )
        // )
        return this;
    }

    get full() {
        let layout = _.cloneDeep(this.#base_layout);
        return layout;
    }
}

class LocusZoomAdapter {
    
    #identifier;
    #adapter;

    constructor(base_adapter, identifier) {
        // TODO: default to StaticJSON?
        this.#adapter = base_adapter;
        this.#identifier = identifier;
    }

    get full() {
        return [this.#identifier, this.#adapter];
    }
}


class LZBioIndexAdapter extends LocusZoomAdapter {
    constructor(index, primary_key, secondary_key, translator=id=>id, { onLoad=id=>id, onResolve=id=>id, onError=id=>id }) {
        const opts = { onLoad, onResolve, onError };
        
        // build the query-making function from the index, primary key, and secondary key
        // if no secondary key is available, assume that it's the region
        // EXAMPLE CASES:
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

        // additional options:
        //  translator: Function
        //  onLoad: Function
        //  onError: Function
        //  onResolve: Function

        super(new LZBioIndexSource({ 
            index,
            queryStringMaker,
            translator, 
            ...opts, 
        }));

    }
}

export function addPanel(plot, dataSources, panelClass) {


    // DataSources and Panels/Layouts are linked together via namespaces.
    // A DataSource name is given to the panel, for a particular data type
    // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
    // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <layout.takingDataSourceName>

    const sharedId = Counter.getUniqueId('assoc');
    const { layout, adapter: [namespace, source] } = new LocusZoomPanel(
        new LocusZoomLayout(
            "association_catalog", 
            // consolidate 'sharedId' and 'assoc' into a namespace object?
            sharedId, 
            'assoc',
        )
        .addFields('assoc', ['pValue'])
        .setProperty(accessor, value),
        new LocusZoomAdapter(
            panelClass.bioIndexToLZReader,
            // consolidate 'sharedId' and 'assoc' into a namespace object? 
            sharedId, 
            'assoc'
        ),
    ).components;

    if (
        !!!dataSources._items.has(
            namespace
        )
    ) {
        dataSources.add(
            namespace,
            source
        );
    }

    const panel = plot.addPanel(layout).addBasicLoader();

    // so we can figure out how to remove it later
    return panel.id;
}

// const associationsPanel = new LocusZoomPanel(
//    new LocusZoomLayout('associationspvaluecatalog'),     // layout with base_layout given
//    new LZBioIndexAdapter('associations', 'T2D'),         // setup an adapter to BioIndex
//    'assoc'                                               // the term that will join both visualizations together
// )

// const assocPanel = new LocusZoomPanel(
//    'assoc',                                              // the term that will join both visualizations together
//    'associationspvaluecatalog',                          // assumed default layout will be derived
//    new LZBioIndexAdapter('associations', 'T2D'),         // setup an adapter to BioIndex
// )


export const LZColorScheme = new ColorRuler();
