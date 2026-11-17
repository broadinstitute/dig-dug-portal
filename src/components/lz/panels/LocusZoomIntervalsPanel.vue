<script>
import LocusZoom from 'locuszoom';
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

    const layout = new LzLayout('intervals', {
            y_index: 2,
            title: {
                text: `${title} Regions`,
            }
        })
        .addFields(dataLayerQ, 'intervals', 
            ['pValue', 'fold']
        );
    // Force split tracks because the portal panel abstraction breaks the toggle.
    LocusZoom.Layouts.mutate_attrs(layout.layout, '$..data_layers[?(@.tag === "intervals")].split_tracks', true);

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

                            const score = scoring[`${interval.annotation}___${interval.tissue}`] || { minP: undefined, maxFold: undefined }; 

                            return {
                                name: primaryKey,
                            
                                pValue: score.minP,
                                fold: score.maxFold,

                                chr: interval.chromosome,
                                start: interval.start,
                                end: interval.end,
                                state_id: `${interval[secondaryKey]}`,
                                state_name: `${interval[secondaryKey]}`,
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

    const panel = new LzPanelClass(layout, datasource).initialize('intervals');
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