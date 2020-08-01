<template>
    <div>
        <div id="lz"></div>
        <slot v-if="locuszoommounted"></slot>
    </div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import LZDataSources from "@/utils/lz/lzDataSources";
import { LZAssociationsPanel, LZAnnotationIntervalsPanel, LZCredibleVariantsPanel, LZPhewasPanel } from "@/utils/lz/lzPanels";
import "locuszoom/dist/ext/lz-intervals-track.min.js";
import idCounter from "@/utils/idCounter"
import LocusZoomAssociationsPanel from "./panels/LocusZoomAssociationsPanel.vue";

const BASE_PANEL_OPTIONS = {
    // proportional_height: 1,
    height: 240,
    dashboard: {
        components: [
            {
                type: "resize_to_data",
                position: "right"
            },
            {
                type: "region_scale",
                position: "left"
            }
        ]
    }
}

/* panel options by panel type
 */
const PANEL_OPTIONS = {
    'association': { min_height: 240, height: 240 },
    'genes': { min_height: 240, height: 240 },
};

export default Vue.component("locuszoom", {
    props: [
        "chr",
        "start",
        "end",
        "colorScheme",
        "refSeq",
    ],
    data() {
        return {
            locuszoommounted: false,
        }
    },
    mounted() {

        this.dataSources = new LocusZoom.DataSources();
        Object.keys(LZDataSources).forEach(lzType => {
            if (!!this[lzType]) {
                this.createSource(lzType, this[lzType]);
            } else {
                let source = LZDataSources[lzType];
                if (!!source) {
                    this.dataSources.add(lzType, source);
                }
            }
        });

        this.plot = LocusZoom.populate("#lz", this.dataSources, {
            responsive_resize: "width_only",
            state: Object.assign({}, {
                chr: this.chr,
                start: this.start,
                end: this.end,
            })
        });
        this.locuszoommounted = true;

        if (this.refSeq) {
            // adding default panel for gene reference track
            this.plot.addPanel(LocusZoom.Layouts.get("panel", "genes", {
                y_index: 9001
            }));
        }

        // event listeners
        let self = this;

        this.plot.on('panel_removed', function(event) {
            self.$emit('panelremoved', event);
        })

        // region change handler
        this.plot.on('state_changed', function(event) {
            // TODO: doesn't pass out chromosome!
            const { start, end } = event; // coordinates are in decimals
            self.$emit('regionchanged', event);
        })

        // this shows what panels updated
        // this.plot.on('layout_changed', function() {
        //  console.log('layout_changed', arguments)
        // })

        self.$on("LZ_ADD_PANEL", () => {
            console.log('load panel')
        });

    },
    methods: {

        addPanelAndDataSource: function(panelClass) {

            // DataSources and Panels/Layouts are linked together via namespaces.
            // A DataSource name is given to the panel, for a particular data type
            // The data that a Layout takes is defined in its "fields", which we leave equal to the key 'forDataSourceType'
            // However, the *specific data* for these fields, so the string <source.givingDataSourceName> must be equal to <panel.takingDataSourceName>

            const { panel, source } = panelClass;
            this.dataSources.add(source.givingDataSourceName, source.withDataSourceReader);

            this.plot.addPanel(LocusZoom.Layouts.get("panel", panel.panelLayoutType, {
                namespace: { [panel.forDataSourceType]: panel.takingDataSourceName },
                id: panel.id,
                ...panel.locusZoomLayoutOptions,                // other locuszoom configuration required for the panel, including overrides(?)
            })).addBasicLoader();

            // so we can figure out how to remove it later
            return panel.id;

        },

        // TODO: component system for LocusZoom
        addLZComponent: function(PanelComponentType, panelConfig) {
            if (this.plot != null) {
                console.log('mounting', PanelComponentType)

                let LZPanelConstructor = Vue.extend(PanelComponentType);

                let vueContainer = document.createElement('div');
                this.$el.appendChild(vueContainer)

                const trackComponentInstance = new LZPanelConstructor({
                    propsData: panelConfig,
                    parent: this,
                }).$mount(vueContainer);

            } else {
                console.log('lz is null right now')
            }
        },

        // addAssociationsPanelComponent: function(phenotype) {
        //     console.log('add associations panel component')
        //     this.addLZComponent(LocusZoomAssociationsPanel, {
        //         phenotype
        //     });
        // },

        // remember that the handlers are optional (bioIndexUtils knows what to do without them) so you don't have to pass them into these functions
        // however the initial non-handler arguments are mandatory. anything that comes after the handler arguments will usually be optional
        addAssociationsPanel: function(phenotype, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZAssociationsPanel(
                    phenotype,
                    { finishHandler, resolveHandler, errHandler }
                )
            );
            return panelId;
        },
        addAnnotationIntervalsPanel: function(annotation, method, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZAnnotationIntervalsPanel(
                    annotation, method,
                    { finishHandler, resolveHandler, errHandler },
                    this.colorScheme  // this constructor has a default function if this.colorScheme is undefined
                )
            );
            return panelId;
        },
        addCredibleVariantsPanel: function(phenotype, credibleSetId, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    phenotype, credibleSetId,
                    { finishHandler, resolveHandler, errHandler }
                )
            );
            return panelId;
        },
        addPhewasPanel: function(varId, phenotypeMap, finishHandler, resolveHandler, errHandler) {
            const panelId = this.addPanelAndDataSource(
                new LZPhewasPanel(
                    varId,
                    phenotypeMap,
                    { finishHandler, resolveHandler, errHandler }
                )
            );
            return panelId;
        }
    },
    computed: {
        region() {
            return {
                chr: this.chr,
                start: this.start,
                end: this.end,
            }
        }
    },
    watch: {
        region(newRegion) {
            this.plot.applyState({ chr: newRegion.chr, start: newRegion.start, end: newRegion.end })
        }
    }
});

</script>
