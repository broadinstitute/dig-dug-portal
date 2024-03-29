import LocusZoom from "locuszoom"
import idCounter from "@/utils/idCounter"
import { applyNamespaces, mutate_attrs, query_attrs }  from "locuszoom/esm/helpers/layouts"
// Layout wrapper
// new LzLayout(locuszoom_layout_object)
// new LzLayout(locuszoom_layout_object, optionals)
// new LzLayout(locuszoom_layout_string)
// new LzLayout(locuszoom_layout_string, optionals)
// methods
// - withNamespace(original, target)
// - addFields(fieldnames)
// - configuredWith(property, value)
// - addRule
// getters
// - full

// FIXME: Recommend this class for total removal.
//  This effectively wraps the LocusZoom.Layouts registry, with several custom functions that introduce major bugs while re-implementing existing functionality.
//  It will likely need to be removed before LZjs 0.14, which will change how namespaces work
export class LzLayout {
    layout = null;
    constructor(firstParam, secondParam, shared_name=undefined) {
        if (firstParam === Object(firstParam) && typeof secondParam === 'object' && !Array.isArray(secondParam)) {
            this.layout = LocusZoom.Layouts.merge(firstParam, secondParam);
        } else if (firstParam === Object(firstParam)) {
            this.layout = firstParam;
        } else if (typeof firstParam === 'string' && typeof secondParam === 'object' && !Array.isArray(secondParam)) {
            this.layout = LocusZoom.Layouts.get('panel', firstParam, secondParam);
        } else if (typeof firstParam === 'string') {
            this.layout = LocusZoom.Layouts.get('panel', firstParam)
        }
        this.layout = Object.assign(this.layout, { id: idCounter.getUniqueId() });
    }
    
    withNamespace(original_namespace, target_namespace) {
        // TODO: ACHTUNG: The original solution that just used `renameFields`, was a leaky abstraction: https://github.com/statgen/locuszoom/issues/249
        // as a dumb workaround I'm introducing a way of correcting errors from broad-based field edits
        // something better would let me edit all of the namespaces in a layout at once, without having to use `LocusZoom.Layout.get`, so namespaces could be given later/at any time.
        
        // TODO: does `applyNamespaces` helper work here? ask Andy.

        // known interfering fields:
        const fragile_fields = ['type', 'tag', 'id'];

        // test for the false positive edits before they're made
        const false_positive = (field, namespace) => `$..data_layers[?(@.${field} === "${namespace}")]`
        const false_positive2 = (field, namespace) => `$..toolbar.*[?(@.${'data_layer_id'} === "${namespace}")]`

        const has_false_positives = fragile_fields.reduce(
            (acc, item) => acc.concat(
                ...false_positive(item, original_namespace),
                ...false_positive2(item, original_namespace)
            ), []
        ).length > 0;

        // this function rewrites all of the namespace-relevant fields
        this.layout = LocusZoom.Layouts.renameField(
            this.layout, 
            original_namespace, 
            target_namespace, 
        )
        
        // correct the false positive edits
        if (has_false_positives) {
            const correction_target = (field, namespace) => `${false_positive(field, namespace)}.${field}`
            const correction_target2 = (field, namespace) => `${false_positive2(field, namespace)}.${field}`
            fragile_fields.forEach(field => {
                LocusZoom.Layouts.mutate_attrs(this.layout, correction_target(field, target_namespace), original_namespace); // since `original_namespace` was the correct value, no need to redeclare
                LocusZoom.Layouts.mutate_attrs(this.layout, correction_target2(field, target_namespace), original_namespace); // since `original_namespace` was the correct value, no need to redeclare
            })
        }

        return this;
    }

    mergeLayoutObject(object_query, new_object) {
        const attribute = LocusZoom.Layouts.query_attrs(this.layout, object_query)[0];
        if (typeof attribute === 'object' && !Array.isArray(attribute)) {
            LocusZoom.Layouts.mutate_attrs(this.layout, object_query, object => {
                return Object.assign(object, new_object)
            })
        } else {
            console.warn("Can't give a non-object an object to merge with")
        }
        return this;
    }

    addProperty(object_query, property, value_object) {
        const new_object = {
            [property]: value_object
        }
        this.mergeLayoutObject(object_query, new_object);
        return this;
    }

    setProperty(property, value, overrideArray=false) {
        const attribute = LocusZoom.Layouts.query_attrs(this.layout, property);
        if (attribute) {
            const isArray = Array.isArray(attribute[0]);
            if (isArray && overrideArray === false) {
                console.warn(`NOTE: ${property} is an Array! Pass 'overrideArray' as 'true' to replace the value of ${property} with ${value}. Use 'addRule' if you want to add an entry to ${property}.`)
                return this;
            }
        }
        // side effect
        LocusZoom.Layouts.mutate_attrs(this.layout, property, value);
        return this;
    }

    addRule(property, value, prepend=false) {
        const isArray = Array.isArray(LocusZoom.Layouts.query_attrs(this.layout, property)[0]);
        if (isArray) {
            this.setProperty(property, id => {
                if (prepend) {
                    return [
                        value,
                        ...id
                    ]
                } else {
                    return [
                        ...id,
                        value
                    ]
                }
            }, true);
        } else {
            console.warn(property, 'not an array for the given layout');
        }
        return this;
    }

    addFields(data_layer, binder, fieldnames) {
        fieldnames.forEach(fieldname => {
            this.addRule(`${data_layer}.fields`, `${binder}:${fieldname}`);
        });
        return this;
    }

    // use to rename fields like posteriorProbability => posterior_prob, p_value => pValue, etc;
    renameField(field_before, field_after) {
        LocusZoom.Layouts.renameFields(this.layout, field_before, field_after);
        return this;
    }

    get full() {
        try {
            if (this.layout !== null) {
                return this.layout;
            }
            throw Error(`Layout hasn't been properly initialized. layout: ${this.layout}`);
        } catch(e) {
            console.warn(e);
        } finally {
            return null;
        }
    }
}

// Datasource wrapper
// -> BioIndexDatsource Wrapper
// new LzDataSource(name, BaseAdapter, params)
// -> registers BaseAdapter if it doesn't exist in Lz?
// new LzDataSource(BaseAdapter, params)
// -> registers BaseAdapter if it doesn't exist in Lz?
// methods
// - withNamespace(target)
// - withParams(parameters)
// - withParam(name, value)
// getters
// - full

export class LzDataSource {
    name = null;
    datasource = null;
    params = {};
    constructor(firstParam, secondParam, thirdParam) {
        if (firstParam === Object(firstParam)) {
            this.datasource = firstParam;
        } else if (typeof firstParam === 'string') {
            this.name = firstParam;
        }
        if (secondParam === Object(secondParam)) {
            //
        }
        this.params = thirdParam;
    }

    withName(target) {
        this.name = target;
        // TODO
        return this;
    }

    withParams(target) {
        this.params = target;
        return this;     
    }

    withParam(name, value) {
        this.params = {
            ...this.params,
            // overrides previous params
            [name]: value
        }
        return this;
    }

    full() {
        try {
            if (this.name !== null && this.datasource !== null) {
                return [this.name, new this.datasource(params)];
            }
            throw Error(`One of 'name' or 'datasource' hasn't been initialized. name: ${this.name} datasource: ${this.datasource}`);
        } catch(e) {
            console.warn(e);
            return null;
        }
    }
}

// DataClass Component
// new LzPanelClass(new LzLayout, new LzDataSource)
// constructor:
// - create namespaces
// methods:
// - initialize(plot)
// => registers everything to plot
// getters:
// - namespaced datasource
// - namespaced layout
// - destructable layout, datasource

export class LzPanelClass {
    #identifier
    #namespace_symbol
    #layout
    #datasource
    constructor(lzLayout, lzDataSource, shared_field) {
        this.#layout = lzLayout;
        this.#datasource = lzDataSource;
        if (typeof shared_field === 'string') {
            this.initialize(shared_field);
        } else {
            console.info('Remember to bind the layout and datasource together with `initialize(shared_field?)`');
        }
    }

    initialize(shared_field) {
        this.#identifier = idCounter.getUniqueId();
        this.#namespace_symbol = `${shared_field}_${this.#identifier}`;
        this.#layout = this.#layout.withNamespace(shared_field, this.#namespace_symbol);
        this.#datasource = this.#datasource.withName(this.#namespace_symbol);
        return this;
    }

    get unwrap() {
        return {
            layouts: [
                this.#layout.layout
            ],
            sources: [
                // TODO: this should have been obscured by this.#datasource with a getter but i haven't been able to get it to work
                [this.#datasource.name, new this.#datasource.datasource(this.#datasource.params)]
            ]
        }
    }
}

export function bioIndexParams(index, firstKey, translator, secondKey, onLoad=id=>id, onResolve=id=>id, onError=id=>id, initialData=[]) {
    return {
        index,
        queryStringMaker: !!secondKey ? 
                            () => `${firstKey},${secondKey}` : 
                            (chr, start, end) => `${firstKey}${!!chr && !!start && !!end ? `,${chr}:${start}-${end}` : ''}`,
        translator: !!translator ? translator : id => id,
        onLoad,
        onResolve, 
        onError,
        initialData
    }
}

export const queryForDataLayerById = data_layer_id => `$..data_layers[?(@.id === "${data_layer_id}")]`;

// Testing
// In the end, these interfaces are meant to replace what are essentially the same data structures
// So I can test for equivalence of the different ways to use the data structures with the final result.

// new LzPanelClass(
//     new LzLayout('association_catalog'),
//     new LzDataSource(LZBioIndexSource, {
//         index: 'associations',
//         firstParam: `${phenotype}`
//     }),
//     'assoc'
// )

// new LzPanelClass(
//     new LzLayout('association_catalog'),
//     new LzDataSource('BioindexDatasource', {
//         index: 'associations',
//         // indexes the query string
//         firstParam: `${phenotype}`,
//         // overrides region information for query
//         // secondParam: ``
//     }),
//     'assoc'
// )
