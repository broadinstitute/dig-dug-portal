<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";
import idCounter from "@/utils/idCounter";
import LocusZoom from "locuszoom";
import { _LZBioIndexSourc, LZAssociationsPanel } from "@/utils/lz/lzPanels"

const BASE_PANEL_OPTIONS = {
    height: 240,
}

/*
class LZAssociationsPanel extends LZPanel {
    constructor(phenotype, { finishHandler, resolveHandler, errHandler }, initialData) {
        super(
            'association',
            'assoc',
            'associations',
            (chr, start, end) => `${phenotype},${chr}:${start}-${end}`,
            associations => associations.map(association => ({
                id: association.varId,
                chr: association.chromosome,
                start: association.position,
                end: association.position,
                position: association.position,
                pvalue: association.pValue,
                log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
                variant: association.varId,
                ref_allele: association.varId,
            })),
            {
                ...BASE_PANEL_OPTIONS,
                y_index: 0,
                axes: {
                    y1: {
                        label: 'log10 log_pvalue'
                    }
                },
                data_layers: [
                    // this works
                    LocusZoom.Layouts.merge(
                            {
                                y_axis: {
                                    axis: 1,
                                    field: '{{namespace[assoc]}}log_pvalue|log10', // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                                    // floor: 0,
                                    upper_buffer: 0.10,
                                    // min_extent: [0, 10],
                                }
                            },
                            LocusZoom.Layouts.get('data_layer', 'association_pvalues', { unnamespaced: true }),
                    ),
                    LocusZoom.Layouts.get('data_layer', 'recomb_rate', { unnamespaced: true }),
                    LocusZoom.Layouts.get('data_layer', 'significance', { unnamespaced: true })
                ]
            },
            { finishHandler, resolveHandler, errHandler },
            initialData,
        )
    }
}
*/
export default Vue.component("lz-associations-panel", {
    props: {
        phenotype: {
            type: String
            // required: true
        },
        finishHandler: {
            type: Function,
            required: false
        },
        resolveHandler: {
            type: Function,
            required: false
        },
        errHandler: {
            type: Function,
            required: false
        },
        // for use with v-model
        value: {
            required: false
        }
    },
    data() {
        return {
            id: null
        };
    },
    mounted() {
        this.updatePanel();

        this.$parent.plot.on("panel_removed", panel => {
            console.log('panel', panel)
            if (panel.data === this.id) {
                // this.$destroy();
            }
        });

    },
    methods: {
        updatePanel() {
            // TODO: what *should* happen when this.finishHandler and this.value are both defined?
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler = !!!this.finishHandler ? result => this.$emit('input', result) : this.finishHandler;
            this.id = this.$parent.addAssociationsPanel(
                this.phenotype,
                this.value,
                finishHandler,
                this.resolveHandler,
                this.errHandler,
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
        phenotype(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});
</script>
