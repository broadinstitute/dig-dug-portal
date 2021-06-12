<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import { LZBioIndexSource } from "@/utils/lzUtils"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-associations-panel', {
    components: {
        LzPanel
    },
    props: {
        phenotype: String,
        title: String,
    },
    data() {
        return {
            panelId: null,
            panelClass: null,
        }
    },
    created() {
        this.panelClass = makeAssociationsPanel(
            this.phenotype, 
            this.title, 
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        )
        // hack - needs to be replaced
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    },
    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.$refs.panel.updatePanel();
        },
    }
});

export function makeAssociationsPanel(phenotype, title='', onLoad, onResolve, onError, initialData) {
    
    const datalayer = data_layer_id => `$..data_layers[?(@.id === "${data_layer_id}")]`;
    const associationDataLayerQ = datalayer('associationpvaluescatalog');

    // get a base layout, give it a title and add some fields under the 'assoc' namespace
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

    // modify one of the data layers
    // https://statgen.github.io/locuszoom/docs/guides/interactivity.html#helper-functions-for-modifying-nested-layouts
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
        field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
        scale_function: "if",
        parameters: {
            field_value: true,
            then: "#FF00FF",
        },
    }, true);

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

    const associations_panel = new LzPanelClass(layout, datasource).initialize('assoc'); // 'assoc' binds both the datasource presented and the layout given uniquely
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