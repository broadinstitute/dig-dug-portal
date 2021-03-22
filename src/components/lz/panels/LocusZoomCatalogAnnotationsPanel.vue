<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { GwasCatalogLZ } from "locuszoom/esm/data/adapters/";

import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/components/lz/lzUtils";
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-catalog-annotations-panel", {
    props: {
        // for use with v-model
        value: {
            required: false,
        },
        phenotype: String,
        title: String,
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
            this.id = this.$parent.addCatalogAnnotationsPanel(
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

export class LZCatalogAnnotationsPanel {
    constructor(phenotype, title, onLoad, onResolve, onError, initialData) {
        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = "annotation_catalog";

        this.datasource_type = "assoc";
        // this is arbitrary, but we want to base it on the ID
        this.panel_id = `${phenotype}_assoc`;
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = "associations";
        this.queryStringMaker = (chr, start, end) =>
            `${phenotype},${chr}:${start}-${end}`;
        this.translator = (associations) => {
            return associations.map((association) => ({
                chromosome: association.chromosome,
                id: association.varId,
                position: association.position,
                pValue: association.pValue,
                log_pvalue: -1 * Math.log10(association.pValue), // .toPrecision(4),
                variant: association.varId,
                ref_allele: association.varId,
                consequence: association.consequence,
                beta: association.beta,
                nearest: association.nearest,
            }));
        };
        this.initialData = initialData;
        this.layouts = [
            LocusZoom.Layouts.get("panel", "annotation_catalog", {
                title: {
                    text: !!title
                        ? `${title} Variant Catalog`
                        : "Variant Catalog",
                    style: { "font-size": "18px" },
                    x: -0.5,
                },
                y_index: 0,
                id: `${this.panel_id}_catalog`,
                data_layers: [
                    Object.assign(
                        LocusZoom.Layouts.get("panel", "annotation_catalog")
                            .data_layers[0],
                        {
                            namespace: {
                                catalog: "catalog",
                                [this.datasource_type]: this
                                    .datasource_namespace_symbol_for_panel,
                            },
                            id_field: LocusZoom.Layouts.get(
                                "panel",
                                "annotation_catalog"
                            ).data_layers[0].id_field.replace(
                                this.datasource_type,
                                this.datasource_namespace_symbol_for_panel
                            ),
                            fields: [
                                ...LocusZoom.Layouts.get(
                                    "panel",
                                    "annotation_catalog"
                                ).data_layers[0].fields.map((field) =>
                                    field.replace(
                                        this.datasource_type,
                                        this
                                            .datasource_namespace_symbol_for_panel
                                    )
                                ),
                            ],
                            filter: [
                                // Hack to exclude incomplete datapoints
                                {
                                    field: "catalog:pos",
                                    operator: ">",
                                    value: 0,
                                },
                            ],
                            match: {
                                send: "catalog:pos",
                                receive: "catalog:pos",
                            },
                            color: [
                                {
                                    field: "lz_highlight_match", // Special field name whose presence triggers custom rendering
                                    scale_function: "if",
                                    parameters: {
                                        field_value: true,
                                        then: "red",
                                    },
                                },
                                "#0000CC",
                            ],
                            x_axis: {
                                field: `${this.datasource_namespace_symbol_for_panel}:position`,
                            },
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
    }
}
</script>
