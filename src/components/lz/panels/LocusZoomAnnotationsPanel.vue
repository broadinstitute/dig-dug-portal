<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

import { scaleOrdinal, rgb, schemeSet1 } from 'd3';

export default Vue.component("lz-annotation-intervals-panel", {
    props: {
        annotation: {
            type: String,
            required: true,
        },
        method: {
            type: String,
            required: true,
        },
        scoring: {
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
            this.panelId = this.$parent.addAnnotationIntervalsPanel(
                this.annotation,
                this.method,
                this.scoring,
                this.initialData,
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
        annotation() {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        },
        method() {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    },
});


export class LZAnnotationIntervalsPanel {
    constructor(annotation, method, finishHandler, resolveHandler, errHandler, initialData, scoring) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'intervals';
        this.datasource_type = 'intervals';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'annotated-regions';
        this.queryStringMaker = (chr, start, end) => `${annotation},${chr}:${start}-${end}`
        this.translator = function (intervals) {
            const tissues = intervals.map(interval => interval.tissue);
            const colorScheme = scaleOrdinal().domain(tissues).range(schemeSet1);
            const tissueIntervals = !!intervals ? intervals
                .map((interval) => {
                    const { r, g, b } = rgb(colorScheme(interval.tissue));

                    let t = interval.tissueId || "NA";
                    let m = interval.method || "NA";
                    let key = `${t}_${m}_${interval.annotation}`;
                    return !!scoring[key] ? {
                        name: interval.tissue || interval.tissueId,
                        // some data (not displayed by default)
                        // region information
                        chr: interval.chromosome,
                        start: interval.start,
                        end: interval.end,
                        pValue: scoring[key].minP,
                        fold: scoring[key].maxFold,
                        state_id: `${interval.tissueId}`,
                        // "state_name" is what annotations are actually grouped by when you split the tracks. it should be visible in the legend
                        state_name: `${interval.tissue}`,
                        // a string-encoded list of RGB coords, e.g. '255,0,128'
                        itemRgb: [r, g, b].join(),
                    } : null;
                    // filter nulls (which represent elements we can't score)
                }).filter(el => !!el) : [];
            return tissueIntervals;
        }
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults.
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            y_index: 1,
            title: {
                text: `${annotation} ${method ? method : ''}`
            },
            data_layers: [
                LocusZoom.Layouts.merge(
                    {
                        fields: [
                            `{{namespace[${this.datasource_type}]}}pValue`,
                            `{{namespace[${this.datasource_type}]}}fold`,
                            ...LocusZoom.Layouts.get('data_layer', 'intervals', { unnamespaced: true }).fields
                        ]
                    },
                    LocusZoom.Layouts.get('data_layer', 'intervals', { unnamespaced: true }),
                ),
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
