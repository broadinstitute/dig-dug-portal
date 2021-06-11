<template>
    <div></div>
</template>
<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "../beta/lzConfiguration";

export default Vue.component("lz-credset-panel", {
    props: {
        phenotype: {
            type: String,
            required: true,
        },
        credibleSetId: {
            type: String,
            required: true,
        },
        // for use with v-model
        value: {
            required: false
        },
        onLoad: Function,
        onResolve: Function,
        onError: Function,
    },
    data() {
        return {
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const onLoad = !!!this.onLoad ? result => this.$emit('input', result) : this.onLoad;
            this.panelId = this.$parent.addPanelAndDataSource(
                makeCredibleVariantsPanel(
                    this.phenotype,
                    this.credibleSetId,
                    onLoad,
                    this.onResolve,
                    this.onError,
                    this.value
                )
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.panelId) {
                    this.$parent.plot.removePanel(this.panelId);
                }
                this.updatePanel();
            }
        },
        phenotype(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        },
        credibleSetId(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    },
});

export function makeCredibleVariantsPanel(phenotype, credibleSetId, onLoad, onResolve, onError, initialData) {

    // get a base layout, give it a title and add some fields under the 'assoc' namespace
    const layout = new LzLayout('association', {
            ...BASE_PANEL_OPTIONS,
            y_index: 2,
            title: {
                text: `${credibleSetId}`
            },
            axes: {
                y1: {
                    label: 'Posterior Probability'
                }
            }
    })
    
    // create new data layer
    // Data Layers are what actually populate the layout with stuff
    // They tell you how your data is interpreted and where it's going
    // First: establish the namespace
    // Second: declare the fields with respect to the namespace
    // Third: create axes and register the fields inside of them
    // Fourth: write down the type of visualization using the data
    // Fifth: add stylings, and the data layer ID
    layout.addRule('data_layers', {
            "namespace": "assoc",
            "id": "credset_layout",
            "type": "scatter",
            "tag": "credsets",
            // id_field is necessary for the scatter visualization to work (used by the d3 code generating the viz)
            "id_field": `assoc:id`,

            "x_axis": {
                "field": `assoc:position`
            },
            "fields": [],
            // this overrides the log-pvalue and recombinant scales of the default associations plot
            // since y-axes are partitioned into either axis: 1 -> y1 and axis: 2 -> y2, by overriding y_axis
            // we've removed axis y2 from the associations plot (as we're only defining y1)
            "y_axis": {
                "axis": 1,
                "field": `assoc:posterior_prob`,
                // normalizing the scale to probability space
                "floor": 0,
                "ceiling": 1
            }
    });
    layout.addFields('$..data_layers[?(@.tag === "credsets")]', 'assoc', 
        ['pValue', 'position', 'id', 'posterior_prob']
    );


    // TODO: eliminate the translator function with field renaming!
    const translator = (associations) => {
        return associations.map(association => ({
            id: association.varId,
            position: association.position,
            pValue: association.pValue,
            // posteriorProbability => posterior_prob; it's refactored to the name compatible with the other credible set visualization supported by LocusZoom
            posterior_prob: association.posteriorProbability,
            contrib_fraction: 0.5,
            is_member: true,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));
    };

    const datasource = new LzDataSource(LZBioIndexSource)
        .withParams(
            bioIndexParams(
                'credible-variants',
                phenotype, 
                translator, 
                credibleSetId,
                onLoad,
                onError,
                onResolve,
                initialData
            )
        );

    const associations_panel = new LzPanelClass(layout, datasource).initialize('assoc'); // 'assoc' binds both the datasource presented and the layout given uniquely
    return associations_panel.unwrap;
}

</script>
