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
import { data } from "jquery";

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

const prefSuff = (prefix, suffix) => `${prefix}_${suffix}`;
const lzAdapterId = identifier => prefSuff(identifier, 'source');
const lzLayoutId = identifier => prefSuff(identifier, 'layout');

/*
 * The goal of LocusZoomPanel, LocusZoomLayout, and LocusZoomAdapter are to encapsulate 
 * common operations that are used in the portal /to extend existing LocusZoom layouts/.
 * 
 */
class LocusZoomPanel {
    #layout;
    #adapter;

    // TODO: namespace parameterization
    // CASES:
    //  Plain old LocusZoom layout: pass in a LocusZoom layout object into `layout`, omit the other paramters as optional
    //  A LocusZoom layout with a known adapter: pass in a LocusZoom layout object into `layout` or a string that can retrieve that layout. pass a LocusZoom adapter into `adapter` or a string that can retrieve that adapter.
    //  A LocusZoom layout with a custom adapter: see above, but requires namespaceTarget or namespace to be defined (identifier is either given or generated)
    //  A custom LocusZoom layout with a custom adapter: see above, requires namespaceTarget or namespace to be defined (identifier is either given or generated)
    constructor(layout, adapter, namespaceTarget='', identifier='shared', namespace={}) {

        this.#layout = layout;
        this.#adapter = adapter;

        let shared_identifier;
        if (_.isString(identifier)) {
            if (_.isEmpty(identifier)) {
                shared_identifier = Counter.getUniqueId(namespaceTarget);
            } else {
                shared_identifier = identifier;
            }
        } else {
            throw Error(`your provided identifier is of the wrong type: ${typeof identifier} (should be String)`)
        }
        
        // this.#adapter._setIdentifier(shared_identifier); // equivalent to the datasource for a namespace, see `_modifyNamespace` below
        // this.#layout._setIdentifier(shared_identifier);
        
        // // information leak
        // console.log(this.#layout.full.id === lzLayoutId(shared_identifier));
        // console.log(this.#adapter.full[0] === lzAdapterId(shared_identifier));

        // // // if the namespace is empty, assume that all data is taken from the datasource labeled with identifier
        // // // TODO: Test
        // if (_.isEmpty(namespace)) {
        //     console.log('namespace is empty')
        //     if (!_.isEmpty(namespaceTarget)) {
        //         console.log('namespace target is still given')
        //         this.#layout._modifyNamespace({
        //             [namespaceTarget]: this.#adapter.identifier, // not `shared_identifier` because it will suffixed differently depending on who gets it
        //         });
        //     }
        //     // no extra namespacing information given, so keep the defaults of the layout
        // } else {
        //     this.#layout._modifyNamespace(namespace);  
        // }

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
    #layout_options;

    #identifier;

    // The LocusZoomLayout object makes it simple to extend or modify the `fields` and `namespaces` of a given layout
    // It works with any valid LocusZoom layout
    constructor(base_layout, layout_options={}, identifier='shared', namespaceTarget='assoc') {
        this.#identifier = identifier;

        // guarantee a base layout
        if (_.isString(base_layout)) {
            this.#base_layout = LocusZoom.Layouts.get('panel', base_layout, {
                namespace: {
                    [namespaceTarget]: identifier
                }
            });
        } else if (
            _.isPlainObject(base_layout) 
        // && !_.isEmpty(base_layout)
        ) {
            this.#base_layout = base_layout;
        } else {
            throw Error('You must present a valid base layout!\n Giving the name of an existing LocusZoom panel will do.')
        }

        this.#layout_options = layout_options;
    
    }

    setTitle(text, opts={}) {
        // this.#layout_options['title'] = { text, ...opts }
        return this;
    }
    
    // use this function when you want to ensure certain fields exist in the data_layer that aren't necessarily displayed on the plot
    // useful for filters which will operate on non-visualized properties, e.g. nearest genes, consequences, methods
    // prior knowledge of the keys used for the namespace is required
    // you can find documentation for base layouts and their namespaces here: 
    addFields(namespaceTarget, ...fields) {
        // const namespacedFields = fields.map(field => {
        //     return `{{namespace[${namespaceTarget}]}}${field}`
        // })
        // this.#layout_options['fields'] = namespacedFields.concat(
        //     ...LocusZoom.Layouts.get(
        //         "panel",
        //         this.#base_layout,
        //         { unnamespaced: true }
        //     ).fields
        // );
        return this;
    }

    // in practice this identifier will share a prefix with a unique adapter associated with its data
    // useful when there are multiple panels of the same kind, e.g. annotations or GWAS being rendered in a plot
    _setIdentifier(identifier) {
        this.#identifier = identifier;
        this.#layout_options['id'] = lzLayoutId(identifier);
        return this;
    }

    // this method encapsulate the data operations required for a layout to have a modified namespace
    // prior knowledge of the keys used for the namespace is required
    // you can find documentation for base layouts and their namespaces here: 
    // TODO: should we support just providing the sourceID, assuming the namespace to be mapped upon?
    _modifyNamespace(updatedNamespace) {

        layout.namespace = Object.assign(
            layout.namespace, 
            updatedNamespace
        );

        for (let i = 0; i < 3; i++) {
            if (!!layout.data_layers[i].namespace) {
                layout.data_layers[i].namespace = Object.assign(
                    layout.data_layers[i].namespace, 
                    updatedNamespace
                )
            }
            if (!_.isEmpty(layout.data_layers[i].tooltip)) {
                if (!!layout.data_layers[i].tooltip.namespace) {
                    layout.data_layers[i].tooltip.namespace = Object.assign(
                        layout.namespace, 
                        updatedNamespace
                    );
                }
            }
        }

        console.log(layout, layout.namespace)
        
        // find the data layers of the layout whose namespace structure pattern-matches to the given namespace
        // then, modify the namespaces of those data layers in place

        // this.#layout_options.data_layers = this.#base_layout.data_layers.map(
        //     data_layer => {
        //         return _.merge(data_layer, {
        //             namespace: {
        //                 ...data_layer.namespace,
        //                 ...updatedNamespace,
        //             }
        //         })
        //     }
        // );

        // // assert: modified in place
        // console.log(this.#layout_options, 
        //     this.#layout_options.data_layers.every(data_layer => {
        //     return Object.entries(updatedNamespace).every(namespace => {
        //         const [ namespaceTarget, namespaceSource ] = namespace;
        //         return data_layer.namespace[namespaceTarget] === namespaceSource;
        //     })
        // }))

        // select all the data layers (traverse)
        // filter for data layers whose namespaces contain keys equivalent to the new namespace (constrain)
        // override the namespaces with the new values for those matched keys (merge the two namespaces)
        // this.#layout_options['namespace'] = _.merge(
        //     LocusZoom.Layouts.get(
        //         "panel",
        //         this.#base_layout
        //     ).namespace,
        //     namespace,
        // );

        // ensure that the namespaces for those data layers are modified in place (assert/check)
        return layout;
    }

    _modifyNamespace_(layout) {
        layout.namespace = Object.assign(
            layout.namespace, 
            updatedNamespace
        );

        for (let i = 0; i < 3; i++) {
            if (!!layout.data_layers[i].namespace) {
                layout.data_layers[i].namespace = Object.assign(
                    layout.data_layers[i].namespace, 
                    updatedNamespace
                )
            }
            if (!_.isEmpty(layout.data_layers[i].tooltip)) {
                if (!!layout.data_layers[i].tooltip.namespace) {
                    layout.data_layers[i].tooltip.namespace = Object.assign(
                        layout.namespace, 
                        updatedNamespace
                    );
                }
            }
        }
        return layout
    }

    get full() {
        let layout = _.cloneDeep(this.#base_layout);
        
        return layout;
    }
}

class LocusZoomAdapter {
    
    #identifier;
    #adapter;

    constructor(base_adapter) {
        // TODO: default to StaticJSON?
        this.#adapter = base_adapter;
    }

    // in practice this identifier will share a prefix with a unique layout associated with the adapter
    // useful when there are multiple panels of the same kind, e.g. annotations or GWAS being rendered in a plot
    _setIdentifier(identifier) {
        this.#identifier = lzAdapterId(identifier);
    }

    get identifier() {
        return this.#identifier;
    }

    get full() {
        return ["shared", this.#adapter];
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

export function getDataLayers(layout) {
    console.log(layout)

    function gdl() {
        // Auxiliary method within our json query for data layers in the LocusZoom plot
        // takes a list of objects of objects, and returns an array of the deepest objects - i.e. [{{*}}] => {*}
        // using flatmap because we need to work across many Object.keys
        const forceKeys = (el) =>
            el.flatMap((data_layer_set) =>
                Object.entries(data_layer_set).map(
                    (data_layer_pair) => data_layer_pair[1]
                )
            );

        // Do we need to calculate this forceKeys every time?
        // YES: number of data_layers is dynamic, can't really memoize.
        let data_layers = jsonQuery("panels[*].data_layers[*]:forceKeys", {
            data: this.plot,
            locals: { forceKeys },
        }).value;
        return data_layers;
    }




}

export function addPanel(plot, dataSources, panelClass) {


    // DataSources and Panels/Layouts are linked together via namespaces.
    // A DataSource name is given to the panel, for a particular data type
    // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
    // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <layout.takingDataSourceName>

    const { layout, adapter: [namespace, source] } = new LocusZoomPanel(
        new LocusZoomLayout("association_catalog"),
        new LocusZoomAdapter(panelClass.bioIndexToLZReader),
        'assoc'
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

    // if (
    //     !!!dataSources._items.has(
    //         panelClass.datasource_namespace_symbol_for_panel
    //     )
    // ) {
    //     console.log(panelClass.datasource_namespace_symbol_for_panel, panelClass.bioIndexToLZReader)
    //     dataSources.add(
    //         panelClass.datasource_namespace_symbol_for_panel,
    //         panelClass.bioIndexToLZReader
    //     );
    // }

    const panel = plot.addPanel(layout).addBasicLoader();

    console.log(plot)
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
//    new LocusZoomLayout('associationspvaluecatalog'),     // layout with base_layout given
//    new LZBioIndexAdapter('associations', 'T2D'),         // setup an adapter to BioIndex
// )

export const LZColorScheme = new ColorRuler();
