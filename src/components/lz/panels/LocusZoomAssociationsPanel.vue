<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";
import idCounter from "@/utils/idCounter";
import LocusZoom from "locuszoom";
import {_LZBioIndexSource} from "@/utils/lz/lzPanels"

const BASE_PANEL_OPTIONS = {
    height: 240,
}

// TODO: refactor lzPanels into their respective Vue components
// PROBLEM: should not have two ways of adding panels, just done.
// Current way allows us to evade having to use components.
// Would be better to stick to the way that uses components.
// Unfortunately the two aren't equivalent because adding components programatically to another component eliminates reactivity.
// This would be fixed by using the Composition API to add watchers programatically during the created phase of the object lifecycle, if necessary.
class LZPanel {

    constructor(panel_layout_type, datasource_type, index, queryStringMaker, translator, locusZoomLayoutOptions, { finishHandler, resolveHandler, errHandler }, initialData) {
        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = panel_layout_type;
        this.datasource_type = datasource_type;

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = index;
        this.queryStringMaker = queryStringMaker;
        this.translator = translator;
        this.locusZoomLayoutOptions = Object.assign(locusZoomLayoutOptions, { ...BASE_PANEL_OPTIONS, id: this.panel_id });

        this.handlers = {
            finishHandler,
            resolveHandler,
            errHandler
        };
        this.initialData = initialData;
    }

    get bioIndexToLZReader() {
        const reader = new _LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler: this.handlers.finishHandler,
            resolveHandler: this.handlers.resolveHandler,
            errHandler: this.handlers.errHandler,
            initialData: this.initialData,
        });
        return reader;
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomLayoutOptions: this.locusZoomLayoutOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }

}

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
    },
    methods: {
        updatePanel() {
            // TODO: what *should* happen when this.finishHandler and this.value are both defined?
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler = typeof this.value !== 'undefined' ?
                result => this.$emit('input', result.data) : this.finishHandler;

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
