<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils";
import idCounter from "@/utils/idCounter";
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "../beta/lzConfiguration";

export default Vue.component("lz-associations-panel", {
    props: {
        phenotype: {
            type: String,
            // required: true
        },
        title: {
            type: String,
        },
        // for use with v-model
        value: {
            required: false,
        },
        onLoad: Function,
        onResolve: Function,
        onError: Function,
    },
    data() {
        return {
            id: null,
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", (panel) => {
            // if (panel.data === this.id) {
            //     this.$destroy();
            // }
        });
    },
    beforeDestroy() {
        this.$parent.plot.removePanel(this.id);
    },
    methods: {
        updatePanel() {
            const onLoad = !!!this.onLoad
                ? (result) => this.$emit("input", result)
                : this.onLoad;

            this.id = this.$parent.addPanelAndDataSource(
                makeAssociationsPanel(
                    this.phenotype,
                    this.title,
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
                if (!!this.id) {
                    this.$parent.plot.removePanel(this.id);
                }
                this.updatePanel();
            }
        },
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        },
    },
});

export function makeAssociationsPanel(phenotype, title='', onLoad, onResolve, onError, initialData) {

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
        })
        .addFields('association', 'assoc', 
            ['pValue', 'position', 'consequence', 'nearest', 'beta']
        );



    // modify one of the data layers
    // https://statgen.github.io/locuszoom/docs/guides/interactivity.html#helper-functions-for-modifying-nested-layouts
    const associationDataLayerQ = '$..data_layers[?(@.tag === "association")]';
    layout.setProperty(`${associationDataLayerQ}.tooltip`, {
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
