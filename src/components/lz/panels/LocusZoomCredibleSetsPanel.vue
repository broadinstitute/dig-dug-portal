<template>
    <div></div>
</template>
<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

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
            this.panelId = this.$parent.addCredibleVariantsPanel(
                this.phenotype,
                this.credibleSetId,
                this.initialData,
                onLoad,
                this.onResolve,
                this.onError
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

export class LZCredibleVariantsPanel {
    constructor(phenotype, credibleSetId, onLoad, onResolve, onError, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'association';
        this.datasource_type = 'cred_vars';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'credible-variants';
        this.queryStringMaker = (chr, start, end) => `${phenotype},${credibleSetId}`
        this.translator = associations => associations.map(association => ({
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
        this.initialData = initialData;

        // the requirement for this field is required for how we're implementing the `bioIndexToLZReader` getter (below)
        this.phenotype = phenotype;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            y_index: 2,
            title: {
                text: `${credibleSetId}`
            },
            axes: {
                y1: {
                    label: 'Posterior Probability'
                }
            },
            // Data Layers are what actually populate the layout with stuff
            // They tell you how your data is interpreted and where it's going
            // First: establish the namespace
            // Second: declare the fields with respect to the namespace
            // Third: create axes and register the fields inside of them
            // Fourth: write down the type of visualization using the data
            // Fifth: add stylings, and the data layer ID
            data_layers: [
                {
                    "namespace": this.datasource_namespace_symbol_for_panel,
                    "id": this.panel_id,
                    "type": "scatter",

                    // id_field is necessary for the scatter visualization to work (used by the d3 code generating the viz)
                    "id_field": `${this.datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${this.datasource_namespace_symbol_for_panel}:id`,
                        `${this.datasource_namespace_symbol_for_panel}:position`,
                        `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
                        `{{namespace[${this.datasource_type}]}}pValue`,  // adding this piece of data irrelevant to the graphic will help us filter later
                    ],
                    "x_axis": {
                        "field": `${this.datasource_namespace_symbol_for_panel}:position`
                    },
                    // this overrides the log-pvalue and recombinant scales of the default associations plot
                    // since y-axes are partitioned into either axis: 1 -> y1 and axis: 2 -> y2, by overriding y_axis
                    // we've removed axis y2 from the associations plot (as we're only defining y1)
                    "y_axis": {
                        "axis": 1,
                        "field": `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
                        // normalizing the scale to probability space
                        "floor": 0,
                        "ceiling": 1
                    }
                },
            ],
        }

        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            onLoad,
            onResolve,
            onError,
            initialData: this.initalData,
        });
    }
}

</script>
