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
        // hack - needs to be replaced
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
    // console.log(LocusZoom.Layouts.get("panel", "annotation_catalog").data_layers[0])

    const datalayer = data_layer_id => `$..data_layers[?(@.tag === "${data_layer_id}")]`;
    const associationDataLayerQ = datalayer('gwascatalog');

    // get a base layout, give it a title and add some fields under the 'assoc' namespace
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
        field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
        scale_function: "if",
        parameters: {
            field_value: true,
            then: "red",
        },
    }, true)
    .addRule(`${associationDataLayerQ}.color`, "#0000CC", true);

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
