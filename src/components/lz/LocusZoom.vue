<template>
    <div id="lz"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import {
    LZ_TYPE,
    BASE_PANEL_OPTIONS,
    PANEL_OPTIONS
} from "@/utils/lz/lzConstants";
import LZDataSources from "@/utils/lz/lzDataSources";
import LZVueSource from "@/utils/lz/lzVueSource";
import * as _ from "lodash";

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
    ],

    data() {
        return {
            initialState: {
                chr: this.chr,
                start: this.start,
                end: this.end,
            },
        };
    },
    mounted() {
        let panels = ['genes'].map(p => {
            return LocusZoom.Layouts.get("panel", p, {
                ...BASE_PANEL_OPTIONS,
                ...PANEL_OPTIONS[p]
                // TODO: override/extend defaults here...
            });
        });

        // create the data source collection
        this.dataSources = new LocusZoom.DataSources();

        // register all the possible data sources
        Object.values(LZ_TYPE).forEach(lzType => {
            let source = LZDataSources[lzType];
            if (!!source) {
                this.dataSources.add(lzType, source);
            }
        });

        // create the final plot with a layout and desired state
        this.lzplot = LocusZoom.populate("#lz", this.dataSources, {
            panels,
            responsive_resize: "width_only",

            // this must be a copy since LocusZoom modifies the object passed
            state: Object.assign({}, this.initialState)
        });
    },
    methods: {
        propertyWatch(lzType, data) {
            let source = this.dataSources.sources[lzType];

            if (!!source) {
                source.resolve(data);
            }

            if (!!this.lzplot) {
                this.lzplot.refresh();
            }
        }
    },

    watch: {

    }
});
</script>
