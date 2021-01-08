<template>
    <div></div>
</template>

<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

export default Vue.component("lz-catalog-annotations-panel", {
    props: {
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
            id: null
        };
    },
    mounted() {
        this.updatePanel();
        this.$parent.plot.on("panel_removed", panel => {
            // if (panel.data === this.id) {
            //     this.$destroy();
            // }
        });
    },
    methods: {
        updatePanel() {
            // TODO
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const finishHandler = !!!this.finishHandler ? result => this.$emit('input', result) : this.finishHandler;
            this.id = this.$parent.addCatalogAnnotationsPanel(
                this.phenotype,
                this.value,
                finishHandler,
                this.resolveHandler,
                this.errHandler,
            );

        }
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.id) {
                    this.$parent.plot.removePanel(this.id);
                };
                this.updatePanel();
            }
        },
        phenotype(newPhenotype, oldPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    }
});


export class LZCatalogAnnotationsPanel {
    constructor(finishHandler, resolveHandler, errHandler, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = ['annotation_catalog'];
        this.datasource_type = 'catalog';
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {};
        this.bioIndexToLZReader = [
            "GwasCatalogLZ", 
            { 
                url: "https://portaldev.sph.umich.edu/api/v1/annotation/gwascatalog/results/",
                params: {
                    build: "GRCh37",
                }
            }
        ];
    }
}


</script>
