<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import { LZBioIndexSource } from "@/utils/lzUtils"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-catalog-annotations-panel', {
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
        this.panelClass = makeCatalogAnnotationsPanel(
            this.phenotype, 
            this.title, 
            event => this.$emit('input', event),
            event => this.$emit('resolve', event),
            event => this.$emit('error', event)
        )
        this.addPanels = this.$parent.addPanels;
        this.plot = this.$parent.plot;
    },
    watch: {
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
    }
});

export function makeCatalogAnnotationsPanel(phenotype, title='', onLoad, onResolve, onError, initialData) {

    const datalayer = data_layer_id => `$..data_layers[?(@.tag === "${data_layer_id}")]`;
    const associationDataLayerQ = datalayer('gwascatalog');

    const layout = new LzLayout('annotation_catalog', {
            title: {
                text: !!title
                    ? `${title} Variant Catalog`
                    : "Variant Catalog",
                style: { "font-size": "18px" },
                x: -0.5,
            },
            y_index: 0
        }).addFields(associationDataLayerQ, 'assoc', 
            ['pValue', 'position', 'consequence', 'nearest', 'beta']
        );

    layout.addProperty(`${associationDataLayerQ}`, 'match', {
        send: "catalog:pos",
        receive: "catalog:pos",
    })
    .addProperty(`${associationDataLayerQ}`, 'x_axis', {
        field: `assoc:position`,
    })
    .addRule(`${associationDataLayerQ}`, 'filter', {
        field: "catalog:pos",
        operator: ">",
        value: 0
    })
    .addRule(`${associationDataLayerQ}.color`, {
        field: "lz_highlight_match",
        scale_function: "if",
        parameters: {
            field_value: true,
            then: "red",
        },
    }, true)
    .addRule(`${associationDataLayerQ}.color`, "#0000CC", true);

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
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>
