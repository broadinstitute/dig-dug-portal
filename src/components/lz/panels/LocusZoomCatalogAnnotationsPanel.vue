<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, LZLayout } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-catalog-annotations-panel", {
    props: {
        // for use with v-model
        value: {
            required: false
        },
        phenotype: String,
        onLoad: Function,
        onResolve: Function,
        onError: Function,
    },
    data() {
        return {
            id: null
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", panel => {
            // if (panel.data === this.id) {
            //     this.$destroy();
            // }
        });
    },
    methods: {
        updatePanel() {
            const onLoad = !!!this.onLoad ? result => this.$emit('input', result) : this.onLoad;
            this.id = this.$parent.addCatalogAnnotationsPanel(
                this.phenotype,
                this.value,
                onLoad,
                this.onResolve,
                this.onError,
            );

        }
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.id) {
                    this.$parent.plot.removePanel(this.id);
                };
                this.updatePanel();
            }
        },
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});


export class LZCatalogAnnotationsPanel {
    constructor(phenotype, onLoad, onResolve, onError, initialData) {



        this.datasource_type = 'assoc';
        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId();
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;


        this.index = 'associations'
        this.queryStringMaker = (chr, start, end) => `${phenotype},${chr}:${start}-${end}`
        this.translator = associations => {
            return associations.map(association => ({
                chromosome: association.chromosome,
                id: (association.varId),
                position: association.position,
                pValue: association.pValue,
                log_pvalue: ((-1) * Math.log10(association.pValue)), // .toPrecision(4),
                variant: (association.varId),
                ref_allele: (association.varId),
                consequence: association.consequence,
                beta: association.beta,
                nearest: association.nearest,
            }))
        };
        this.initialData = initialData;
        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            onLoad,
            onResolve,
            onError,
            initialData: this.initialData,
        });


        this.layouts = [
            new LZLayout(
                LocusZoom.Layouts.get("panel", "annotation_catalog", {
                    y_index: 0,
                    id: this.panel_id,
                    data_layers: [
                        Object.assign(LocusZoom.Layouts.get("data_layer", "annotation_catalog"), {
                            namespace: {
                                catalog: "catalog",
                                [this.datasource_type]: this.datasource_type,
                            },
                            match: { send: 'catalog:pos', receive: 'catalog:pos' },
                            color: [
                                {
                                    field: 'lz_is_match',  // Special field name whose presence triggers custom rendering
                                    scale_function: 'if',
                                    parameters: {
                                            field_value: true,
                                            then: 'red'
                                        },
                                },
                                '#0000CC'
                            ]
                        })
                    ]
                }),
            )
            // .addField("annotation_catalog", this.datasource_type, 'position')
            // .addField("annotation_catalog", this.datasource_type, 'pValue')
            // .addField("annotation_catalog", this.datasource_type, 'consequence')
            // .addField("annotation_catalog", this.datasource_type, 'nearest')
            // .addField("annotation_catalog", this.datasource_type, 'beta')
            // // .addFilter("annotation_catalog", this.datasource_type, 'position')
            // // .addFilter("annotation_catalog", this.datasource_type, 'pValue')
            // // .addFilter("annotation_catalog", this.datasource_type, 'consequence')
            // // .addFilter("annotation_catalog", this.datasource_type, 'nearest')
            // // .addFilter("annotation_catalog", this.datasource_type, 'beta')
            .json()
        ];
    }
}


</script>
