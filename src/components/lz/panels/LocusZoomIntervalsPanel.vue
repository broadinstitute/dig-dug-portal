<template>
    <div></div>
</template>

<script>
import Vue from "vue";

import { isEqual, isEmpty } from "lodash";
import { rgb, color } from "d3";
import {
    LZBioIndexSource,
    LZColorScheme,
} from "@/utils/lzUtils";
import bioIndexGroups from "@/utils/bioIndexGroups"
import idCounter from "@/utils/idCounter";

import LocusZoom from "locuszoom";

export default Vue.component("lz-intervals-panel", {
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
        onLoad: Function,
        onResolve: Function,
        onError: Function,
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
            const onLoad = !!!this.onLoad
                ? (result) => this.$emit("input", result)
                : this.onLoad;
            this.panelId = this.$parent.addIntervalsPanel(
                this.index,
                this.primaryKey,
                this.secondaryKey,
                this.scoring,
                this.title,
                this.initialData,
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
    },
});

export class LZIntervalsPanel {
    constructor(
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
        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = "intervals";
        this.datasource_type = "intervals";

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = index;
        this.queryStringMaker = (chr, start, end) =>
            `${primaryKey},${chr}:${start}-${end}`;
        this.translator = function (intervals) {
            const tissueIntervals = !!intervals
                ? intervals
                      .map((interval) => {
                          const { r, g, b } = rgb(
                              color(
                                  LZColorScheme.getColor(interval[secondaryKey])
                              )
                          );

                          if (!interval[secondaryKey]) return null;

                          return {
                              name: primaryKey,
                            
                                // TODO: using a delimeter here should be 
                              pValue: scoring[`${interval.annotation}___${interval.tissue}`].minP,
                              fold: scoring[`${interval.annotation}___${interval.tissue}`].maxFold,

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
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults.
        this.locusZoomPanelOptions = {
            y_index: 2,
            title: {
                text: `${title} Regions`,
            },
            data_layers: [
                LocusZoom.Layouts.merge(
                    {
                        namespace: {
                            ...LocusZoom.Layouts.get("data_layer", "intervals")
                                .namespace,
                            [this.datasource_type]: this
                                .datasource_namespace_symbol_for_panel,
                        },
                        fields: [
                            `{{namespace[${this.datasource_type}]}}pValue`,
                            `{{namespace[${this.datasource_type}]}}fold`,
                            ...LocusZoom.Layouts.get(
                                "data_layer",
                                "intervals",
                                { unnamespaced: true }
                            ).fields,
                        ],
                    },
                    LocusZoom.Layouts.get("data_layer", "intervals", {
                        unnamespaced: true,
                    })
                ),
            ],
        };
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
