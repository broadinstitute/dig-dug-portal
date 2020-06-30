<template>
    <div>
        <div id="lz"></div>
        <slot></slot>
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
    LZ_LOAD_PANEL,
    LZ_LOAD_DATASOURCE,
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
            locuszoomMounted: false,
        };
    },
    beforeCreate() {
        // can't be data
        this.panelList = [{ type: 'genes', for: 'genes', takes: 'genes'}];
        this.dataSourceList = [];
    },
    created() {
        LZEvents.$on(LZ_LOAD_PANEL, config => {
            console.log('capturing loaded panel', config)
            this.panelList.push(config.panel);
            this.dataSourceList.push(config.source);
        })
    },
    mounted() {
        this.panels = this.panelList.map(p => {
            return LocusZoom.Layouts.get("panel", p.type, {
                // TODO: override/extend defaults here...
                namespace: { [p.for]: p.takes },
                id: p.id,
                ...BASE_PANEL_OPTIONS,
                ...PANEL_OPTIONS[p.type],
            });
        });

        this.dataSources = new LocusZoom.DataSources();
        // Add Default Data Sources:
        Object.values(LZ_TYPE).forEach(lzType => {
            let source = LZDataSources[lzType];
            if (!!source) {
                this.dataSources.add(lzType, source);
            }
        });

        if (this.dataSourceList.length > 0) {
            this.dataSourceList.map(dataSource => {
                this.dataSources.add(dataSource.gives, dataSource.reader);
            });
        }
        this.locuszoom = LocusZoom.populate("#lz", dataSources, {
            panels: panels,
            responsive_resize: "width_only",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });
        this.createEventHandlers(this.locuszoom);
        this.locuszoomMounted = true
    },
    methods: {
        addPanels(plot, data_sources, panel_options, source_options) {
            source_options.forEach(source => data_sources.add(...source));
            panel_options.forEach((panel_layout) => {
                panel_layout.y_index = -1; // Make sure genes track is always the last one
                const panel = plot.addPanel(panel_layout);
                panel.addBasicLoader();
            })
        },
        createEventHandlers(locuszoom) {

            LZEvents.$on(LZ_BROWSER_FORCE_REFRESH, () => {
                console.log('force refresh')
                locuszoom.refresh();
            })

            LZEvents.$on(LZ_ADD_PANEL, panelConfiguration => {
                const { panel, source } = panelConfiguration;
                this.dataSources.add(source.gives, source.reader);
                const newPanel = LocusZoom.Layouts.get("panel", panel.type, {
                    // TODO: override/extend defaults here...
                    namespace: { [panel.for]: panel.takes },
                    id: panel.id,
                    ...BASE_PANEL_OPTIONS,
                    ...PANEL_OPTIONS[panel.type],
                });
                locuszoom.addPanel(newPanel);
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
});
</script>
