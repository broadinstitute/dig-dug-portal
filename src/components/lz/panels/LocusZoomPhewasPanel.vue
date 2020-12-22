<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-phewas-panel", {
    props: {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        phenotypeMap: {
            type: Object,
            required: true,
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
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler = !!!this.finishHandler ? result => this.$emit('input', result) : this.finishHandler;
            this.panelId = this.$parent.addPhewasPanel(
                this.id,
                this.type,
                this.phenotypeMap,
                this.value,
                finishHandler,
                this.resolveHandler,
                this.errHandler
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.panelId) {
                    this.$parent.plot.removePanel(this.panelId);
                }
                this.updatePanel();
            }
        },
        id(newVarOrGeneId) {
            // this is good enough
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
        type() {
            // this is good enough
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.updatePanel();
        },
    },
});

export class LZPhewasPanel {
    constructor(varOrGeneId, idType, phenotypeMap, finishHandler, resolveHandler, errHandler, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'phewas';
        this.datasource_type = 'phewas';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = ({ gene: 'gene-associations', variant: 'phewas-associations' })[idType];
        this.queryStringMaker = (chr, start, end) => `${varOrGeneId}`
        this.translator = associations => {
            const portalAssociations = associations.filter(a => {
                return !!phenotypeMap[a.phenotype];
            });
            // transform from bio index to locuszoom
            const phewas = portalAssociations.map(a => {
                const phenotypeInfo = phenotypeMap[a.phenotype];
                return {
                    id: phenotypeInfo.name,
                    log_pvalue: -Math.log10(a.pValue),
                    trait_group: phenotypeInfo.group,
                    trait_label: phenotypeInfo.description,
                    pValue: a.pValue,
                    phenotype: phenotypeInfo.name,
                    beta: a.beta,
                };
            });
            return phewas;
        }
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're not overriding defaults
        this.locusZoomPanelOptions = {
            // ...BASE_PANEL_OPTIONS,
            data_layers: [
                LocusZoom.Layouts.merge(
                    {
                        fields: [
                            // we need to call out the fields directly since merge algorithm doesn't combine arrays
                            `{{namespace[${this.datasource_type}]}}pValue`, // adding this piece of data irrelevant to the graphic will help us filter later
                            `{{namespace[${this.datasource_type}]}}phenotype`, // adding this piece of data irrelevant to the graphic will help us filter later
                            ...LocusZoom.Layouts.get('data_layer', 'phewas_pvalues', { unnamespaced: true }).fields,
                        ].concat(this.index === 'phewas-associations' ? `{{namespace[${this.datasource_type}]}}beta` : []), // concat spreading an empty list means it adds no elements
                    },
                    LocusZoom.Layouts.get('data_layer', 'phewas_pvalues', { unnamespaced: true }),
                ),
            ],
            toolbar: {
                widgets: [
                    {
                        type: "toggleloglog",
                        color: "gray",
                        position: "right"
                    },
                ]
            },
            axes: {
                y1: {
                    label: '-log10(p)',
                }
            },
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
