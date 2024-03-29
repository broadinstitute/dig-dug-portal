<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";
import LocusZoom from "locuszoom";

export default Vue.component('lz-credset-panel', {
    components: {
        LzPanel
    },
    props: {
        phenotype: {
            type: String,
            required: true,
        },
        credibleSetId: {
            type: String,
            required: true,
        },
    },
    created() {
        this.panelClass = new LZCredibleVariantsPanel(
            this.phenotype, 
            this.credibleSetId,
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        )
        // hack - needs to be replaced
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    },
    watch: {
        phenotype(newPhenotype) {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
        credibleSetId(newPhenotype) {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
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
                        `${this.datasource_namespace_symbol_for_panel}:pValue`,  // adding this piece of data irrelevant to the graphic will help us filter later
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

        this.layouts = [
            LocusZoom.Layouts.get("panel", this.panel_layout_type, this.locusZoomPanelOptions)
        ]

        this.sources = [
            [this.datasource_namespace_symbol_for_panel, this.bioIndexToLZReader]
        ]

    }
}

export function makeCredibleSetsPanel(phenotype, credibleSetId, onLoad, onResolve, onError, initialData) {
    
    // const datalayer = data_layer_id => `$..data_layers[?(@.id === "${data_layer_id}")]`;
    // const associationDataLayerQ = datalayer('associationspvaluecatalog');


    // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
    // however they are also jointly necessary for LocusZoom –
    const panel_layout_type = 'association';
    const datasource_type = 'cred_vars';

    // this is arbitrary, but we want to base it on the ID
    const panel_id = idCounter.getUniqueId(panel_layout_type);
    const datasource_namespace_symbol_for_panel = `${panel_id}_src`;

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
            },
            // we're overriding all data layers and replacing it with these ones
            data_layers: [
                {
                    "namespace": datasource_namespace_symbol_for_panel,
                    "id": panel_id,
                    "type": "scatter",

                    // id_field is necessary for the scatter visualization to work (used by the d3 code generating the viz)
                    "id_field": `${datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${datasource_namespace_symbol_for_panel}:id`,
                        `${datasource_namespace_symbol_for_panel}:position`,
                        `${datasource_namespace_symbol_for_panel}:posterior_prob`,
                        `{{namespace[${datasource_type}]}}pValue`,  // adding this piece of data irrelevant to the graphic will help us filter later
                    ],
                    "x_axis": {
                        "field": `${datasource_namespace_symbol_for_panel}:position`
                    },
                    // this overrides the log-pvalue and recombinant scales of the default associations plot
                    // since y-axes are partitioned into either axis: 1 -> y1 and axis: 2 -> y2, by overriding y_axis
                    // we've removed axis y2 from the associations plot (as we're only defining y1)
                    "y_axis": {
                        "axis": 1,
                        "field": `${datasource_namespace_symbol_for_panel}:posterior_prob`,
                        // normalizing the scale to probability space
                        "floor": 0,
                        "ceiling": 1
                    }
                }
            ]
        })

    // TODO: eliminate the translator function with field renaming!
    const translator = (associations) => {
        function varId2OtherVarId(varId) {
            const [a, b, c, d] = varId.split(':'); // ['9', '22132076', 'A', 'G']
            return `${a}:${b}_${c}/${d}`
        }
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

    const datasource = new LzDataSource(LZBioIndexSource)
        .withParams(
            bioIndexParams(
                'credible-variants',
                phenotype, 
                translator, 
                undefined,
                onLoad,
                onError,
                onResolve,
                initialData
            )
        );

    const associations_panel = new LzPanelClass(layout, datasource).initialize(datasource_namespace_symbol_for_panel); // 'assoc' binds both the datasource presented and the layout given uniquely
    return associations_panel.unwrap;
}

</script>

<template>
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>