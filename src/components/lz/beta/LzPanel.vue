<script>
/*
* LzPanel:
* A high-level child component that represents a particular panel.
*
* The advantage: it gives developers of the Portal a *consistent way of defining LocusZoom visualizations like they were any other Vue component.*
*
* Example:
*    ```
*    <lz-plot :base_layout="genes" :base_sources="sources" :chr="8" :start="20000" :end="250000">
*       <lz-panel 
*          :layout="layout"
*          :source="source"
*          :filter="filterFunction"
*          @input="onLoad"
*       ></lz-panel>
*    </lz-plot>
*    ```
* 
* As LzPanel is a Vue component, it reacts to changes in its props. As LzPanel is Vue component, it can be scaled down or up with a list from v-for. 
* This makes it easy to add new panels, and remove them just as easily. 
*
* Ideally, LzPanel is used as a template for other components. With panels displaying BioIndex data, a lead parameter is required to fully specify a query:
*
* Example:
*   ```
*   <lz-plot :base_layout="genes" :base_sources="sources" :chr="8" :start="20000" :end="250000">
*       <v-fragment v-for="phenotype in phenotypes" :key="phenotype">
*           <lz-associations-panel 
*               :phenotype="phenotype"
*               :title="title(phenotype)"
*               :filter="filterFunction"
*               @input="associations = $event"
*           ></lz-associations-panel>
*       </v-fragment>
*    </lz-plot>
*    ```
* 
* Here, 'phenotype' is the indexing parameter. `<lz-associations-panel>` should itself already know what :layout and :source should be, 
* and :source should be defined in part by the indexing parameter (much like how the "AssociationsLZ" takes params against its URL).
* Creating a higher-level component is likely necessary whenever we want a panel that reacts to its indexing parameter.
*
* The primary drawback to this design approach is keeping LocusZoom and the Portal in sync. They can get out of sync with the data they represent,
* as there is no way to pass data by reference, nor is there a means of avoiding the fact that LocusZoom must maintain duplications of data in different data sources.
*
* However, the majority of cases relevant to everyday Portal use have thusfar been covered by two decisions:
*   1) Create an event hook for when data is loaded by the panel (usually on @input), and assign it to a piece of data in page scope. This is "pulling" the data.
*   2) Removing the panel of the LocusZoom plot in `beforeDestroy` and when the plot emits the event `panel_removed`, so no matter which way the panel is removed,
*       both the representation in LocusZoom, and the Vue component, are deleted.
*
* Overall, rather than cluttering multi-visualization pages with a bunch of LocusZoom-specific code, we can encapsulate the logic of  
* using LocusZoom into the "LzPlot.vue" component and its children: LzPanels are its children.
*
*/

/*
*
* Tasks:
* - allow panels to be declared with layout/source combos, or with a dataclass
*   - define a small algebra of classes that can make these two cases equivalent
*   - the dataclasses can be reused in the programmatic case (where we want to add panels to the plot from a javascript function)
* - redefine the filter calculation logic on a panel-by-panel basis, and make the watcher work with it
* - check why the "panel_removed"
* - simplify the data-class configuration to its cleanest, most canonical form (see notes in the example dataclass below)
*/

import Vue from "vue"

export default Vue.component('lz-panel', {
    props: {
        panelClass: Object,
        layout: Object,
        source: Object,
        filter: Function
    },
    data() {
        return {
            id: null,
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", (panel) => {
            if (panel.data === this.id) {
                // TODO: will this work?
                // this.$destroy(); 
            }
        });
    },
    // defining this hook will let v-for remove components (which means that v-for will be able to add and remove components)
    beforeDestroy() {
        this.$parent.plot.removePanel(this.id);
    },
    methods: {
        updatePanel() {
            // e.g.
            // this.panelClass = new LZAssociationsPanel(
            //     this.phenotype, 
            //     'Type 2 Diabetes', 
            //     () => this.$emit('input'),
            //     () => this.$emit('load'),
            //     () => this.$emit('error')
            // )
            if (!!this.$parent.addPanels) {
                this.$parent.addPanels(
                    this.panelClass.layouts,
                    Object.entries(this.panelClass.sources)
                )
            }
            // used to add panels upstream inf necessary
            this.$emit('create', this.panelClass);
        },
    },
    watch: {
        filter() {
            // TODO
        }
    }
})

export class LZAssociationsPanel {
    /* 
     * LZAssociationsPanel
     * 
     * A data-class containing all the information necessary to load a panel into LzPlot.vue
     * 
     * Every such loading has three steps that it performs:
     *      1) "Define Namespaces" - a way of linking panel layouts and adapters
     *      2) "Configure Layouts" - defining which panel layout to use, and modifying it for new data
     *      3) "Create Adapters" - for BioIndex data sources, if applicable define ETL, query structure, and initial data
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
                    LocusZoom.Layouts.get("panel", this.panel_layout_type)
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

        // just a small helper function specific to this case
        // can probably remove
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

        // TODO: this isn't currently in use since we have decided to support mainly "pulling" style of data-passing. So it could be removed.
        this.initialData = initialData;
        
        // TODO: To eliminate this datasource, we could possible register the dataSource *once* for LocusZoom, then just refer 
        //  to it by name along with a params object.
        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            // TODO: remove onLoad/onResolve/onError and find another way to bind them?
            // TODO: remove them and use "emit" events?
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

</script>
<template>
    <div :id="this.id"></div>
</tempate>