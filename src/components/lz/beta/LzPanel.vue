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
            if (!!this.$parent.addPanels) {
                this.$parent.addPanels(
                    this.panelClass.layouts,
                    this.panelClass.sources
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

</script>
<template>
    <div :id="this.id"></div>
</tempate>