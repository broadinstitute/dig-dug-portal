<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import { LZBioIndexSource } from "@/utils/lzUtils"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "./lzConfiguration";







export default Vue.component('lz-associations-panel', {
    components: {
        LzPanel
    },
    props: {
        phenotype: String
    },
    created() {
        this.panelClass = makeAssociationsPanel(
            this.phenotype, 
            'Type 2 Diabetes', 
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        )
        this.addPanels = this.$parent.addPanels;
    }
});








export function makeAssociationsPanel(phenotype, title='', onLoad, onResolve, onError, initialData) {
    
    const datalayer = data_layer_id => `$..data_layers[?(@.id === "${data_layer_id}")]`;
    const associationDataLayerQ = datalayer('associationspvaluecatalog');

    const layout = new LzLayout('association_catalog', {
            title: {
                text: !!title
                    ? `${title} Variant Associations`
                    : "Variant Associations",
                style: { "font-size": "18px" },
                x: -0.5,
            },
            y_index: 0
        }).addFields(associationDataLayerQ, 'assoc', 
            ['pValue', 'position', 'consequence', 'nearest', 'beta']
        );

    layout.addProperty(`${associationDataLayerQ}`, 'toolbar', {
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
    })
    .addProperty(`${associationDataLayerQ}`, 'match', {
        send: `assoc:position`,
        receive: `assoc:position`,
    })
    .addProperty(`${associationDataLayerQ}`, 'y_axis', {
        axis: 1,
        field: `assoc:log_pvalue`,
        upper_buffer: 0.1,
    })
    .addRule(`${associationDataLayerQ}.color`, {
        field: "lz_highlight_match",
        scale_function: "if",
        parameters: {
            field_value: true,
            then: "#FF00FF",
        },
    }, true);

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
                'associations',
                phenotype, 
                translator, 
                undefined,
                onLoad,
                onError,
                onResolve,
                initialData
            )
        );

    const associations_panel = new LzPanelClass(layout, datasource).initialize('assoc');
    return associations_panel.unwrap;
}
</script>

<template>
    <lz-panel :panelClass="panelClass"></lz-panel>
</template>