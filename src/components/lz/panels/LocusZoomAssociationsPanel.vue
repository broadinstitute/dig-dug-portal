<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils";
import idCounter from "@/utils/idCounter";

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

            this.id = this.$parent.addAssociationsPanel(
                this.phenotype,
                this.title,
                this.value,
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

export class LZAssociationsPanel {
    constructor(phenotype, title, onLoad, onResolve, onError, initialData) {
        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = "association_catalog";

        this.datasource_type = "assoc";
        // this is arbitrary, but we want to base it on the ID
        this.panel_id = `${phenotype}_assoc`;
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = "associations";
        this.queryStringMaker = (chr, start, end) =>
            `${phenotype},${chr}:${start}-${end}`;
        function varId2OtherVarId(varId) {
            // const [a, b, c, d] = varId.split(':'); // ['9', '22132076', 'A', 'G']
            // return `${a}:${b}_${c}/${d}`
            return varId;
        }
        this.translator = (associations) => {
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
        this.initialData = initialData;

        this.layouts = [
            LocusZoom.Layouts.get("panel", "association_catalog", {
                id: `${this.panel_id}_association`,
                title: {
                    text: !!title
                        ? `${title} Variant Associations`
                        : "Variant Associations",
                    style: { "font-size": "18px" },
                    x: -0.5,
                },
                y_index: 0,
                data_layers: [
                    LocusZoom.Layouts.get("panel", "association_catalog")
                        .data_layers[0],
                    LocusZoom.Layouts.get("panel", "association_catalog")
                        .data_layers[1],
                    LocusZoom.Layouts.get(
                        "data_layer",
                        "association_pvalues_catalog",
                        {
                            namespace: {
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog"
                                ).namespace,
                                [this.datasource_type]: this
                                    .datasource_namespace_symbol_for_panel,
                            },
                            y_axis: {
                                axis: 1,
                                field: `{{namespace[${this.datasource_type}]}}log_pvalue`, // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                                upper_buffer: 0.1,
                            },
                            toolbar: {
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
                            },
                            title: {
                                text: "hello is the gene",
                            },
                            fields: [
                                `{{namespace[${this.datasource_type}]}}position`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}pValue`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}consequence`, // adding this piece of data irrelevant to the graphic will help us filter later
                                `{{namespace[${this.datasource_type}]}}nearest`, // adding this piece of data irrelevant to the graphic will help us filter later
                                // we need to call out the fields directly since merge algorithm doesn't combine arrays
                                `{{namespace[${this.datasource_type}]}}beta`,
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog",
                                    { unnamespaced: true }
                                ).fields,
                            ],
                            match: {
                                send: `assoc:position`,
                                receive: `assoc:position`,
                            },
                            color: [
                                {
                                    field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
                                    scale_function: "if",
                                    parameters: {
                                        field_value: true,
                                        then: "#FF00FF",
                                    },
                                },
                                ...LocusZoom.Layouts.get(
                                    "data_layer",
                                    "association_pvalues_catalog",
                                    { unnamespaced: true }
                                ).color,
                            ],
                        }
                    ),
                ],
            }),
        ];

        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            onLoad,
            onResolve,
            onError,
            initialData: this.initialData,
        });

        this.sources = { assoc: this.bioIndexToLZReader };
    }
}
</script>
