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

        this.panel_layout_type = 'association';
        this.datasource_type = 'cred_vars';

        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'credible-variants';
        this.queryStringMaker = (chr, start, end) => `${phenotype},${credibleSetId}`
        this.translator = associations => associations.map(association => ({
            id: association.varId,
            position: association.position,
            pValue: association.pValue,
            posterior_prob: association.posteriorProbability,
            contrib_fraction: 0.5,
            is_member: true,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));
        this.initialData = initialData;

        this.phenotype = phenotype;

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
            data_layers: [
                {
                    "namespace": this.datasource_namespace_symbol_for_panel,
                    "id": this.panel_id,
                    "type": "scatter",

                    "id_field": `${this.datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${this.datasource_namespace_symbol_for_panel}:id`,
                        `${this.datasource_namespace_symbol_for_panel}:position`,
                        `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
                        `${this.datasource_namespace_symbol_for_panel}:pValue`,
                    ],
                    "x_axis": {
                        "field": `${this.datasource_namespace_symbol_for_panel}:position`
                    },
                    "y_axis": {
                        "axis": 1,
                        "field": `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
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
    


    const panel_layout_type = 'association';
    const datasource_type = 'cred_vars';

    const panel_id = idCounter.getUniqueId(panel_layout_type);
    const datasource_namespace_symbol_for_panel = `${panel_id}_src`;

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
            data_layers: [
                {
                    "namespace": datasource_namespace_symbol_for_panel,
                    "id": panel_id,
                    "type": "scatter",

                    "id_field": `${datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${datasource_namespace_symbol_for_panel}:id`,
                        `${datasource_namespace_symbol_for_panel}:position`,
                        `${datasource_namespace_symbol_for_panel}:posterior_prob`,
                        `{{namespace[${datasource_type}]}}pValue`,
                    ],
                    "x_axis": {
                        "field": `${datasource_namespace_symbol_for_panel}:position`
                    },
                    "y_axis": {
                        "axis": 1,
                        "field": `${datasource_namespace_symbol_for_panel}:posterior_prob`,
                        "floor": 0,
                        "ceiling": 1
                    }
                }
            ]
        })

    const translator = (associations) => {
        function varId2OtherVarId(varId) {
            const [a, b, c, d] = varId.split(':');
            return `${a}:${b}_${c}/${d}`
        }
        return associations.map((association) => ({
            chromosome: association.chromosome,
            id: varId2OtherVarId(association.varId),
            position: association.position,
            pValue: association.pValue,
            log_pvalue: -1 * Math.log10(association.pValue),
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

    const associations_panel = new LzPanelClass(layout, datasource).initialize(datasource_namespace_symbol_for_panel);
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