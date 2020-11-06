<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-associations-panel", {
    props: {
        phenotype: {
            type: String
            // required: true
        },
        // for use with v-model
        value: {
            required: false
        },
        finishHandler: Function,
        resolveHandler: Function,
        errHandler: Function,
    },
    data() {
        return {
            id: null
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", panel => {
            console.log('remove panel')
            if (panel.data === this.id) {
                this.$destroy();
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
        phenotype(newPhenotype, oldPhenotype) {
            console.log('updatePhenotype')
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});


export class LZAssociationsPanel {
    constructor(phenotype, finishHandler, resolveHandler, errHandler, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'association';
        this.datasource_type = 'assoc';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'associations'
        this.queryStringMaker = (chr, start, end) => `${phenotype},${chr}:${start}-${end}`
        this.translator = associations => associations.map(association => ({
            id: association.varId,
            position: association.position,
            pValue: association.pValue,
            log_pvalue: ((-1) * Math.log10(association.pValue)), // .toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
            consequence: association.consequence,
            beta: association.beta,
            nearest: association.nearest,
        }));
        this.initialData = initialData;


        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            id: this.panel_id,
            y_index: 0,
            axes: {
                y1: {
                    label: '-log10(p)',
                }
            },
            data_layers: [
                // this works
                LocusZoom.Layouts.merge(
                    {
                        y_axis: {
                            axis: 1,
                            field: `{{namespace[${this.datasource_type}]}}log_pvalue`, // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                            upper_buffer: 0.10,
                        },
                        fields: [
                            `{{namespace[${this.datasource_type}]}}pValue`,  // adding this piece of data irrelevant to the graphic will help us filter later
                            `{{namespace[${this.datasource_type}]}}consequence`,  // adding this piece of data irrelevant to the graphic will help us filter later
                            `{{namespace[${this.datasource_type}]}}nearest`,  // adding this piece of data irrelevant to the graphic will help us filter later
                            // we need to call out the fields directly since merge algorithm doesn't combine arrays
                            `{{namespace[${this.datasource_type}]}}beta`,
                            ...LocusZoom.Layouts.get('data_layer', 'association_pvalues', { unnamespaced: true }).fields,
                        ],
                    },
                    LocusZoom.Layouts.get('data_layer', 'association_pvalues', { unnamespaced: true }),
                ),
                LocusZoom.Layouts.get('data_layer', 'recomb_rate', { unnamespaced: true }),
                LocusZoom.Layouts.get('data_layer', 'significance', { unnamespaced: true })
            ]
        };

        this.bioIndexToLZReader = new LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler,
            resolveHandler,
            errHandler,
            initialData: this.initialData,
        });
    }
}


</script>
