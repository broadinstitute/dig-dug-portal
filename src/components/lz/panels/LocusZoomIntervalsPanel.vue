<script>

import Vue from "vue";
import LzPanel from "./LzPanel"
import{  rgb, color } from "d3";
import { LZBioIndexSource, LZColorScheme } from "@/utils/lzUtils"
import { LzLayout, LzPanelClass, LzDataSource, bioIndexParams } from "@/components/lz/beta/lzConfiguration";

export default Vue.component('lz-intervals-panel', {
    components: {
        LzPanel
    },
    props: {
        index: {
            type: String,
            required: true,
        },
        primaryKey: {
            type: String,
            required: true,
        },
        secondaryKey: {
            type: String,
            required: true,
        },
        scoring: Object,
        title: String,
    },
    data() {
        return {
            panelId: null,
            panelClass: null,
        }
    },
    created() {
        this.panelClass = makeIntervalsPanel(
            this.index,
            this.primaryKey,
            this.secondaryKey,
            this.scoring,
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
        annotation() {
            if (!!this.panelId) {
                this.$parent.plot.removePanel(this.panelId);
            }
            this.$refs.panel.updatePanel();
        },
    },
    
});

export function makeIntervalsPanel(
        index,
        primaryKey,
        secondaryKey,
        scoring,
        title,
        onLoad,
        onResolve,
        onError,
        initialData
    ) {

    const dataLayerQ = '$..data_layers[?(@.id === "intervals")]';

    // get a base layout, give it a title and add some fields under the 'intervals' namespace
    const layout = new LzLayout('intervals')
        // .addFields(dataLayerQ, 'intervals', 
        //     ['pValue', 'fold']
        // );

    // TODO: eliminate the translator function with field renaming!
    const translator = function (intervals) {
            const tissueIntervals = !!intervals
                ? intervals
                      .map((interval) => {
                            const { r, g, b } = rgb(
                                color(
                                    LZColorScheme.getColor(interval[secondaryKey])
                                )
                            );

                            if (!interval[secondaryKey]) return null;

                            // workaround for when no global enrichment exists for a defined
                            // possibly an issue with bioindex ingest?
                            const score = scoring[`${interval.annotation}___${interval.tissue}`] || { minP: undefined, maxFold: undefined }; 

                            return {
                                name: primaryKey,
                            
                                pValue: score.minP,
                                fold: score.maxFold,

                                // some data (not displayed by default)
                                // region information
                                chr: interval.chromosome,
                                start: interval.start,
                                end: interval.end,
                                state_id: `${interval[secondaryKey]}`,
                                // "state_name" is what annotations are actually grouped by when you split the tracks. it should be visible in the legend
                                state_name: `${interval[secondaryKey]}`,
                                // a string-encoded list of RGB coords, e.g. '255,0,128'
                                itemRgb: [r, g, b].join(),
                            };
                      })
                      .filter((el) => !!el)
                : [];

            return tissueIntervals;
    };

    const datasource = new LzDataSource(LZBioIndexSource)
        .withParams(
            bioIndexParams(
                index,
                primaryKey, 
                translator, 
                undefined,
                onLoad,
                onError,
                onResolve,
                initialData
            )
        );

    const panel = new LzPanelClass(layout, datasource).initialize('intervals'); // 'assoc' binds both the datasource presented and the layout given uniquely
    return panel.unwrap;
}

</script>

<template>
    <lz-panel
        ref="panel"
        :panelClass="panelClass" 
        @updated="$event => this.panelId = $event.panelId">
    </lz-panel>
</template>