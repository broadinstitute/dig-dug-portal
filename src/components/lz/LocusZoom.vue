<template>
    <div>
        <div id="lz"></div>
        <slot></slot>
    </div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import "locuszoom/dist/ext/lz-intervals-track.min.js";

import {
    LZ_TYPE,
    BASE_PANEL_OPTIONS,
    PANEL_OPTIONS
} from "@/utils/lz/lzConstants";
import LZDataSources from "@/utils/lz/lzDataSources";
import { LZAssociationsPanel, LZAnnotationIntervalsPanel, LZCredibleVariantsPanel } from "@/utils/lz/lzPanels";
import LZEvents, {
    LZ_ADD_PANEL,
    LZ_LOAD_PANEL,
} from "@/components/lz/LocusZoomEvents"

import idCounter from "@/utils/idCounter"

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
        "colorScheme",
    ],
    mounted() {

        this.dataSources = new LocusZoom.DataSources();
        Object.values(LZ_TYPE).forEach(lzType => {
            if (!!this[lzType]) {
                this.createSource(lzType, this[lzType]);
            } else {
                let source = LZDataSources[lzType];
                if (!!source) {
                    this.dataSources.add(lzType, source);
                }
            }
        });

        this.locuszoom = LocusZoom.populate("#lz", this.dataSources, {
            responsive_resize: "width_only",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });

        // adding default panel for gene reference track
        this.locuszoom.addPanel(LocusZoom.Layouts.get("panel", "genes", {
            y_index: 9001
        }));

        // event listeners
        let self = this;

        this.locuszoom.on('panel_removed', function(event) {
            self.$emit('panelremoved', event);
        })

        // region change handler
        this.locuszoom.on('state_changed', function(event) {
            // TODO: doesn't pass out chromosome!
            const { start, end } = event; // coordinates are in decimals
            self.$emit('regionchanged', event);
        })

        // this shows what panels updated
        // this.locuszoom.on('layout_changed', function() {
        //  console.log('layout_changed', arguments)
        // })

    },
    methods: {

        addPanelAndDataSource: function(panelClass) {

            // DataSources and Panels/Layouts are linked together via namespaces.
            // A DataSource name is given to the panel, for a particular data type
            // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
            // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <panel.takingDataSourceName>

            const { panel, source } = panelClass;
            console.log(panel)
            this.dataSources.add(source.givingDataSourceName, source.withDataSourceReader);

            this.locuszoom.addPanel(LocusZoom.Layouts.get("panel", panel.panelLayoutType, {
                namespace: { [panel.forDataSourceType]: panel.takingDataSourceName },
                id: panel.id,
                ...panel.locusZoomLayoutOptions,                // other locuszoom configuration required for the panel, including overrides(?)
            })).addBasicLoader();

        },

        addLZComponent: function(PanelComponentType, panelConfig) {
            if (this.lz != null) {

                let LZPanelConstructor = Vue.extend(PanelComponentType);

                let vueContainer = document.createElement('div');
                this.$el.appendChild(vueContainer)

                const trackComponentInstance = new LZPanelConstructor({
                    propsData: trackConfig.data,
                    parent: this,
                }).$mount(vueContainer);

            }
        },

        // remember that the handlers are optional (bioIndexUtils knows what to do without them) so you don't have to pass them into this function
        addAssociationsPanel: function(phenotype, finishHandler, resolveHandler, errHandler) {
            this.addPanelAndDataSource(
                new LZAssociationsPanel(
                    phenotype,
                    { finishHandler, resolveHandler, errHandler }
                )
            );
        },
        addAnnotationIntervalsPanel: function(annotation, method, finishHandler, resolveHandler, errHandler) {
            this.addPanelAndDataSource(
                new LZAnnotationIntervalsPanel(
                    annotation, method,
                    { finishHandler, resolveHandler, errHandler },
                    this.colorScheme
                )
            );
        },
        addCredibleVariantsPanel: function(phenotype, credibleSetId, finishHandler, resolveHandler, errHandler) {
            this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    phenotype, credibleSetId,
                    { finishHandler, resolveHandler, errHandler }
                )
            );
        },

    },
});

</script>
