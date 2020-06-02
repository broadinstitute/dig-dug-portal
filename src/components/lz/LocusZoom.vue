<template>
    <div>
        <div id="lz"></div>
        <slot v-if="locuszoomInitialized"></slot>
    </div>
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


import LZEvents, {
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
} from "@/components/lz/LocusZoomEvents"


import * as _ from "lodash";

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",

        "finishHandler",
        "resolveHandler",
        "errHandler",
    ],

    data() {
        return {
            locuszoomInitialized: false,
        };
    },
    mounted() {

        let defaultPanels = ['genes'].map(p => {
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
        this.locuszoom = LocusZoom.populate("#lz", this.dataSources, {
            panels: defaultPanels,
            responsive_resize: "width_only",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });
        this.createEventHandlers(this.locuszoom);
        this.locuszoomInitialized = true;
    },
    methods: {
        createEventHandlers(locuszoom) {

            LZEvents.$on(LZ_BROWSER_FORCE_REFRESH, () => {
                console.log('force refresh')
                locuszoom.refresh();
            })

            LZEvents.$on(LZ_ADD_PANEL, panelConfiguration => {
                console.log('add panel')
            });

            LZEvents.$on(LZ_REMOVE_PANEL, panelName => {
                console.log('remove panel')
            });

            // default handlers for tracks completing their data
            // TODO: this is the wierdest part of the application right now. It works out as long as we only have one instance of LocusZoom per page.
            LZEvents.$on(LZ_BIOINDEX_QUERY_RESOLVE, json => {
                if (!!this.resolveHandler) {
                    this.resolveHandler(response);
                } else {
                    // igvResolve(json);
                }
            })
            LZEvents.$on(LZ_BIOINDEX_QUERY_ERROR, json => {
                if (!!this.errHandler) {
                    this.errHandler(response);
                } else {
                }
            })
            LZEvents.$on(LZ_BIOINDEX_QUERY_FINISH, response => {
                if (!!this.finishHandler) {
                    this.finishHandler(response);
                } else {
                }
            });

        },

        addLZPanel: function(PanelComponentType, panelConfig) {
            if (this.lz != null) {

                let LZPanelConstructor = Vue.extend(PanelComponentType);
                let vueContainer = document.createElement('div');

                this.$el.appendChild(vueContainer)

                const trackComponentInstance = new LZPanelConstructor({
                    propsData: trackConfig.data
                }).$mount(vueContainer);

            }
        },

    },

    watch: {

    }
});
</script>
