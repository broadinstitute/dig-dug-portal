import LocusZoom from "locuszoom"
import idCounter from "@/utils/idUtils"

// Layout wrapper
// new LzLayout(locuszoom_layout_object)
// new LzLayout(locuszoom_layout_object, optionals)
// new LzLayout(locuszoom_layout_string)
// new LzLayout(locuszoom_layout_string, optionals)
// methods
// - withNamespace(original, target)
// - addFields(fieldnames)
// - configuredWith(property, value)
// getters
// - full

class LzLayout {
    #layout = null;
    constructor(firstParam, secondParam) {
        if (firstParam === Object(firstParam) && typeof secondParam !== 'undefined') {
            this.#layout = LocusZoom.Layouts.merge(firstParam, secondParam);
        } else if (firstParam === Object(firstParam)) {
            this.#layout = firstParam;
        } else if (typeof firstParam === 'string' && typeof secondParam !== 'undefined') {
            this.#layout = LocusZoom.get('panel', firstParam, secondParam);
        } else if (typeof firstParam === 'string') {
            this.#layout = LocusZoom.get('panel', firstParam)
        }
    }
    
    withNamespace(original_namespace, target_namespace) {
        this.#layout = LocusZoom.Layouts.renameFields(
            this.#layout, 
            original_namespace, 
            target_namespace, 
            warn_transforms = true
        )
        return this;
    }

    setProperty(property, value) {
        this.#layout = LocusZoom.Layouts.mutate_attrs(this.#layout, property, value);
        return this;
    }

    addRule(property, value, prepend=false) {
        const isArray = Array.isArray(LocusZoom.Layouts.query_attrs(this.#layout, 'fields'));
        if (isArray) {
            this.#layout = this.setProperty(property, id => {
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
            });
        } else {
            console.warn(property, 'not an array for the given layout');
        }
        return this;
    }

    addFields(binder, ...fieldnames) {
        fieldnames.forEach(fieldname => {
            this.addRule('fields', `${binder}:${fieldname}`);
        });
        return this;
    }

    get full() {
        try {
            if (this.#layout !== null) {
                return this.#layout;
            }
            throw Error(`Layout hasn't been properly initialized. layout: ${this.#layout}`);
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

class LzDataSource {
    #name = null;
    #datasource = null;
    constructor(firstParam, secondParam, thirdParam) {
        if (firstParam === Object(firstParam)) {
            // 
        } else if (typeof firstParam === 'string') {
            this.#name = firstParam;
        }
        if (secondParam === Object(secondParam)) {
            // 
        }
    }

    withName(target) {
        this.#name = target;
        // TODO
        return this;
    }

    withParams(target) {
        // TODO
        return this;     
    }

    withParam(name, value) {
        // TODO
        return this;
    }

    get full() {
        try {
            if (this.#name !== null && this.#datasource !== null) {
                return [this.#name, this.#datasource];
            }
            throw Error(`One of 'namespace' or 'datasource' hasn't been initialized. name: ${this.#name} datasource: ${this.#datasource}`);
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

class LzPanelClass {
    #identifier
    #namespace_symbol
    #layout
    #datasource
    constructor(lzLayout, lzDataSource, shared_field) {
        this.#layout = lzLayout;
        this.#datasource = lzDataSource;
        if (typeof binder === 'string') {
            this.initialize(shared_field);
        } else {
            console.warn('Remember to bind the lazyout and datasource together with `initialize()`');
        }
    }
    initialize(shared_field) {
        this.#identifier = idCounter.getUniqueId();
        this.#namespace_symbol = `${shared_field}_${this.#identifier}`;
        this.#layout = lzLayout.withNamespace(shared_field, this.#namespace_symbol);
        this.#datasource = lzDataSource.withName(this.#namespace_symbol);
    }
    get full() {
        return {
            layout: this.#layout.full(),
            datasource: this.#datasource.full()
        }
    }
}

new LzPanelClass(
    new LzLayout('associations_catalog'),
    new LzDataSource(BioIndexDataSource, {
        index: 'associations-index',
        firstParam: `${phenotype}`,
    }),
    'assoc'
)

new LzPanelClass(
    new LzLayout('associations_catalog'),
    new LzDataSource('BioindexDatasource', {
        index: 'associations',
        // indexes the query string
        firstParam: `${phenotype}`,
        // overrides region information for query
        // secondParam: ``
    }),
    'assoc'
)

// Testing
// In the end, these interfaces are meant to replace what are essentially the same data structures
// So I can test for equivalence of the different ways to use the data structures with the final result.

class LZAssociationsPanel {
    /* 
     * LZAssociationsPanel
     * 
     * A data-class containing all the information necessary to load a panel into LzPlot.vue
     * 
     * Every such loading has three steps that it performs:
     *      1) "Define Namespaces"
     *      2) "Configure Layouts"
     *      3) "Create Adapters"
     * 
     * We are making panels in a way which conjoins a lot of steps that would typically be done at LocusZoom's initialization. 
     * But this lets us create panels on the fly, based on user inputs and the like.
     * 
     * To see how namespaces, layouts, and adapters interrelate, read the LocusZoom documentation once. 
     * It will help clarify the comments made on each step made below.
     * 
     */
    constructor(phenotype, title, onLoad, onResolve, onError, initialData) {

        /* PART ONE
             Define Namespaces */

        /* Identify the resources from LocusZoom to use */

        // Use the `association_catalog` layout
        this.panel_layout_type = "association_catalog";
        // Use the datasources in the "assoc" namespace (we'll be replacing them)
        this.datasource_type = "assoc";  

        /* Define namespace-binding information */
        //
        // These two pieces of ID information can be defined arbitrarily and independent from everything else;
        // however, we'll define them in terms of:
        //    (a) the layout's parameter (in this case phenotype) and visualization as the ID, and
        //    (b) the ID combined with the adapter type as the name for the panel's datasource.
        //
        // * `panel_id` is used by LocusZoom to e.g. know which panel to delete on a delete event.
        // * `datasource_namespace_symbol_for_panel` is used by LocusZoom to know what datasource to call
        //    when the state of the visualization changes (such as when you shift a region).
        //
        // Both `panel_id` and `datasource_namespace_symbol_for_panel` are used within the "Configuring Layouts" step.
        // 
        // Importantly: when `datasource_namespace_symbol_for_panel` is applied to a layout, either indirectly through
        // the namespace property of the layout object, or directly through rewriting the fields from e.g. "{{namespace[assoc]}}:log_pvalue"
        // to "T2D_association_src:log_pvalue", it will draw information from a datasource with that name.
        //
        // Later when we "Create Adapters" (step 3), we use `datasource_namespace_symbol_for_panel` as the name for the register, which will be
        // registed for the datasource to call.
        //
        // By having `datasource_namespace_symbol_for_panel` depend on `panel_id`, we can guarantee a unique datasource for each panel. This way,
        // different panels can show different information of the same type (e.g. multiple GWAS plots for different phenotypes).
        //

        this.panel_id = `${phenotype}_${this.panel_layout_type}`;
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_${this.datasource_type}_src`;

        /* END PART ONE */


        /* PART TWO 
            Configure Layouts */

        // Several important tasks, commented inline

        this.layouts = [
            LocusZoom.Layouts.get("panel", this.panel_layout_type, {

                // TASK: ID: make sure the panel_id is provided
                id: `${this.panel_id}`,
                title: {
                    text: !!title
                        ? `${title} Variant Associations`
                        : "Variant Associations",
                    style: { "font-size": "18px" },
                    x: -0.5,
                },
                y_index: 0,
                data_layers: [
                    LocusZoom.Layouts.get("panel", this.panel_layout_type)
                        .data_layers[0],
                    LocusZoom.Layouts.get("panel",this.panel_layout_type)
                        .data_layers[1],
                    LocusZoom.Layouts.get(
                        "data_layer",
                        "association_pvalues_catalog",

                        // TODO: for all of this fidgeting with the namespace, replace with rewriting a layout's fields with helper method
                        // TASK: Wherever the data_layer needs to reference a particular adapter, bind the adapter's name to the namespace
                        {
                            namespace: {
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog"
                                ).namespace,
                                [this.datasource_type]: this
                                    .datasource_namespace_symbol_for_panel,
                            },
                        // TASK: Important! Fields only draw data that they need. Sometimes filters need data which isn't explicitly displayed. 
                        //  SO: Add these extra fields to the "fields" part of a datalayer. Since it's a list, you need to make sure all the previous items still exist.
                            fields: [
                                // adding back other items
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog",
                                    { unnamespaced: true }
                                ).fields,

                                // creating new (unnamespaced) fields
                                `{{namespace[${this.datasource_type}]}}position`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}pValue`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}consequence`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}nearest`, // adding this piece of data irrelevant to the graphic will help us filter later
                                // we need to call out the fields directly since merge algorithm doesn't combine arrays
                                `{{namespace[${this.datasource_type}]}}beta`,
                            ],
                            y_axis: {
                                axis: 1,
                                field: `{{namespace[${this.datasource_type}]}}log_pvalue`, // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                                upper_buffer: 0.1,
                            },

                            // Finally: defining extra parts of the data_layer 

                            toolbar: {
                                widgets: [
                                    {
                                        type: "remove_panel",
                                        color: "red",
                                        position: "right",
                                    },
                                    {
                                        type: "toggle_legend",
                                        position: "right",
                                    },
                                    {
                                        type: "toggleloglog",
                                        color: "gray",
                                        position: "right",
                                    },
                                ],
                            },
                            // matching property so that data can be selected across panels
                            match: {
                                send: `assoc:position`,
                                receive: `assoc:position`,
                            },
                            color: [
                                // declarative rule for what should happen in matching state
                                {
                                    field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
                                    scale_function: "if",
                                    parameters: {
                                        field_value: true,
                                        then: "#FF00FF",
                                    },
                                },
                                // remember other color rules
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog",
                                    { unnamespaced: true }
                                ).color,
                            ],
                        }
                    ),
                ],
            }),
        ];

        /* END PART TWO */


        /* PART THREE 
            Create Adapters */

        function varId2OtherVarId(varId) {
            const [a, b, c, d] = varId.split(':'); // ['9', '22132076', 'A', 'G']
            return `${a}:${b}_${c}/${d}`
        }

        // the index used against BioIndex
        this.index = "associations";

        // TASK: the query will receive LocusZoom's state, mainly chr,start,end; but this isn't typically sufficient to specify
        //      a BioIndex query, which will typically be indexed on a single paramter (in this case Phenotype)
        //      So we make a function which is a closure for the indexing parameter, and used to build the query for BioIndex.
            // TODO: Potentially, this could be eliminated in favor of using URL params (like with AssociationLZ Adapters)
        this.queryStringMaker = (chr, start, end) => `${phenotype},${chr}:${start}-${end}`

        // TASK: Translate the data into a form that the LocusZoom panel layout will except (due to its definitions for fields in its data_layers)
            // TODO: Potentially, this ETL could be eliminated in favor of renaming the fields in the layout with helper
        this.translator = (associations) => {
            return associations.map((association) => ({
                chromosome: association.chromosome,
                id: varId2OtherVarId(association.varId),
                position: association.position,
                pValue: association.pValue,
                log_pvalue: -1 * Math.log10(association.pValue), // .toPrecision(4),
                variant: varId2OtherVarId(association.varId),
                ref_allele: association.reference,
                consequence: association.consequence,
                beta: association.beta,
                nearest: association.nearest,
            }));
        };

        // TODO: this isn't currently in use since we have decided to support mainly "pulling" style of data-passing.
        this.initialData = initialData;
        
        // TODO: To eliminate this datasource, we could possible register the dataSource *once* for LocusZoom, then just refer 
        //  to it by name along with a params object.
        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            // TODO: remove onLoad/onResolve/onError and find another way to bind them?
            onLoad,
            onResolve,
            onError,
            // TODO: remove push-based code?
            initialData: this.initialData,
        });

        // This will look a lot like how we defined the default datasources elsewhere in the code (like in LocusZoom.vue)
        this.sources = { [this.datasource_namespace_symbol_for_panel]: this.bioIndexToLZReader };

        /* END PART THREE */

    }
}


const oldAssocationsPanelLayout = new LZAssociationsPanel().layouts[0];

const layout1 = new LzLayout('associations_catalog')
    .addFields('assoc', ['pvalue', 'fold' /* etc */]);

const datasource = new LzDataSource(BioIndexDataSource)
    .withParams({ index: 'associations', firstParam: `${phenotype}` });

const associations_panel = new LzPanelClass(layout1, datasource).initialize('assoc');

console.log(oldAssocationsPanelLayout === layout.full())
console.log(oldAssocationsPanelLayout === associations_panel.full().layout)

const layout2 = new LzLayout(LocusZoom.Layouts.get('panel', 'associations_catalog'), {})
                    .withNamespace('assoc', 'assoc')

console.log(oldAssocationsPanelLayout === layout2.full())
